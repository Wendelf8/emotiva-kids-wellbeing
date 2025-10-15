import { useState, useEffect } from 'react';
import { Plus, User, Edit, Trash2, ArrowLeft, UserPlus, Mail, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import EmotivaButton from '@/components/EmotivaButton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type Aluno = {
  id: string;
  nome: string;
  idade: number;
  responsavel: string;
  created_at: string;
};

type Responsavel = {
  id: string;
  responsavel_email: string;
  status: string;
  criado_em: string;
};

type Turma = {
  id: string;
  nome: string;
  serie: string;
  descricao: string;
};

type TurmaDetalhesProps = {
  turmaId: string;
  onNavigate: (page: string) => void;
};

export default function TurmaDetalhes({ turmaId, onNavigate }: TurmaDetalhesProps) {
  const [turma, setTurma] = useState<Turma | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>("");
  const [responsaveis, setResponsaveis] = useState<Record<string, Responsavel[]>>({});
  const [conviteEmail, setConviteEmail] = useState("");
  const [escolaNome, setEscolaNome] = useState("");
  const [formData, setFormData] = useState({
    nome: '',
    idade: '',
    responsavel: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTurmaData();
    fetchEscolaNome();
  }, [turmaId]);

  const fetchEscolaNome = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("escolas")
        .select("nome")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      if (data) setEscolaNome(data.nome);
    } catch (error) {
      console.error("Erro ao buscar nome da escola:", error);
    }
  };

  const fetchTurmaData = async () => {
    try {
      // Buscar dados da turma
      const { data: turmaData, error: turmaError } = await supabase
        .from('turmas')
        .select('*')
        .eq('id', turmaId)
        .single();

      if (turmaError) throw turmaError;
      setTurma(turmaData);

      // Buscar alunos da turma
      const { data: alunosData, error: alunosError } = await supabase
        .from('alunos')
        .select('*')
        .eq('turma_id', turmaId)
        .order('created_at', { ascending: false });

      if (alunosError) throw alunosError;
      setAlunos(alunosData || []);

      // Buscar responsáveis de cada aluno
      if (alunosData && alunosData.length > 0) {
        const responsaveisMap: Record<string, Responsavel[]> = {};
        
        for (const aluno of alunosData) {
          const { data: respData } = await supabase
            .from("aluno_responsaveis")
            .select("*")
            .eq("aluno_id", aluno.id);
          
          if (respData) {
            responsaveisMap[aluno.id] = respData;
          }
        }
        
        setResponsaveis(responsaveisMap);
      }
    } catch (error) {
      console.error('Erro ao buscar dados da turma:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da turma.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const alunoData = {
        nome: formData.nome,
        idade: parseInt(formData.idade),
        responsavel: formData.responsavel,
        turma_id: turmaId
      };

      if (editingAluno) {
        const { error } = await supabase
          .from('alunos')
          .update(alunoData)
          .eq('id', editingAluno.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Aluno atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('alunos')
          .insert(alunoData);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Aluno adicionado com sucesso!",
        });
      }

      setIsDialogOpen(false);
      setEditingAluno(null);
      setFormData({ nome: '', idade: '', responsavel: '' });
      fetchTurmaData();
    } catch (error) {
      console.error('Erro ao salvar aluno:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o aluno.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (aluno: Aluno) => {
    try {
      const { error } = await supabase
        .from('alunos')
        .delete()
        .eq('id', aluno.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Aluno removido com sucesso!",
      });
      
      fetchTurmaData();
    } catch (error) {
      console.error('Erro ao remover aluno:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o aluno.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (aluno: Aluno) => {
    setEditingAluno(aluno);
    setFormData({
      nome: aluno.nome,
      idade: aluno.idade.toString(),
      responsavel: aluno.responsavel || ''
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingAluno(null);
    setFormData({ nome: '', idade: '', responsavel: '' });
    setIsDialogOpen(true);
  };

  const handleSendInvite = async () => {
    if (!conviteEmail || !selectedAlunoId) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um aluno e informe o e-mail do responsável.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: existingInvite } = await supabase
        .from("aluno_responsaveis")
        .select("*")
        .eq("aluno_id", selectedAlunoId)
        .eq("responsavel_email", conviteEmail)
        .single();

      if (existingInvite) {
        toast({
          title: "Convite já enviado",
          description: "Já existe um convite pendente para este responsável.",
          variant: "destructive",
        });
        return;
      }

      const { error: insertError } = await supabase
        .from("aluno_responsaveis")
        .insert({
          aluno_id: selectedAlunoId,
          responsavel_email: conviteEmail,
          status: "pendente",
        });

      if (insertError) throw insertError;

      const aluno = alunos.find(a => a.id === selectedAlunoId);
      const { error: emailError } = await supabase.functions.invoke("send-parent-invite", {
        body: {
          responsavelEmail: conviteEmail,
          alunoNome: aluno?.nome || "Aluno",
          escolaNome: escolaNome,
          alunoId: selectedAlunoId,
        },
      });

      if (emailError) throw emailError;

      toast({
        title: "Convite enviado!",
        description: `Convite enviado para ${conviteEmail}`,
      });

      setInviteDialogOpen(false);
      setConviteEmail("");
      setSelectedAlunoId("");
      fetchTurmaData();
    } catch (error: any) {
      console.error("Erro ao enviar convite:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o convite.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aceito":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Aceito</Badge>;
      case "pendente":
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case "recusado":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Recusado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando dados da turma...</p>
        </div>
      </div>
    );
  }

  if (!turma) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">Turma não encontrada</h3>
            <p className="text-muted-foreground mb-4">
              A turma solicitada não existe ou você não tem permissão para acessá-la.
            </p>
            <EmotivaButton onClick={() => onNavigate('minhas-turmas')}>
              Voltar para Turmas
            </EmotivaButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => onNavigate('minhas-turmas')}>
            <ArrowLeft size={20} />
          </Button>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{turma.nome}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              {turma.serie && <span>Série: {turma.serie}</span>}
              <span>•</span>
              <span>{alunos.length} alunos</span>
            </div>
            {turma.descricao && (
              <p className="text-muted-foreground mt-2">{turma.descricao}</p>
            )}
          </div>
          
          <div className="flex gap-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog} className="flex items-center gap-2">
                  <Plus size={20} />
                  Adicionar Aluno
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingAluno ? 'Editar Aluno' : 'Novo Aluno'}
                </DialogTitle>
                <DialogDescription>
                  {editingAluno ? 'Edite as informações do aluno' : 'Adicione um novo aluno à turma'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome do Aluno</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome completo do aluno"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="idade">Idade</Label>
                  <Input
                    id="idade"
                    type="number"
                    min="3"
                    max="18"
                    value={formData.idade}
                    onChange={(e) => setFormData({ ...formData, idade: e.target.value })}
                    placeholder="Idade do aluno"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="responsavel">Responsável</Label>
                  <Input
                    id="responsavel"
                    value={formData.responsavel}
                    onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                    placeholder="Nome do pai, mãe ou responsável"
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingAluno ? 'Salvar' : 'Adicionar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <UserPlus size={20} />
                Convidar Responsável
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Responsável</DialogTitle>
                <DialogDescription>
                  Envie um convite por e-mail para o responsável acompanhar o aluno.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="aluno">Selecione o Aluno *</Label>
                  <select
                    id="aluno"
                    className="w-full p-2 border rounded-md"
                    value={selectedAlunoId}
                    onChange={(e) => setSelectedAlunoId(e.target.value)}
                  >
                    <option value="">Selecione um aluno</option>
                    {alunos.map((aluno) => (
                      <option key={aluno.id} value={aluno.id}>
                        {aluno.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="email">E-mail do Responsável *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={conviteEmail}
                    onChange={(e) => setConviteEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <Button onClick={handleSendInvite} className="w-full gap-2">
                  <Mail className="w-4 h-4" />
                  Enviar Convite
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Status Convite</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                      <div className="flex flex-col items-center gap-2">
                        <User size={32} className="text-muted-foreground" />
                        <p>Nenhum aluno cadastrado nesta turma.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  alunos.map((aluno) => (
                    <TableRow key={aluno.id}>
                      <TableCell className="font-medium">{aluno.nome}</TableCell>
                      <TableCell>{aluno.idade} anos</TableCell>
                      <TableCell>{aluno.responsavel || "-"}</TableCell>
                      <TableCell>
                        {responsaveis[aluno.id] && responsaveis[aluno.id].length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {responsaveis[aluno.id].map((resp) => (
                              <div key={resp.id} className="flex items-center gap-2">
                                <span className="text-sm">{resp.responsavel_email}</span>
                                {getStatusBadge(resp.status)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sem convites</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(aluno)}
                          >
                            <Edit size={16} />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 size={16} className="text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover Aluno</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza de que deseja remover o aluno "{aluno.nome}" da turma? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(aluno)}>
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}