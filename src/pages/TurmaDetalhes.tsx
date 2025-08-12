import { useState, useEffect } from 'react';
import { Plus, User, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import EmotivaButton from '@/components/EmotivaButton';

type Aluno = {
  id: string;
  nome: string;
  idade: number;
  responsavel: string;
  created_at: string;
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
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    idade: '',
    responsavel: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTurmaData();
  }, [turmaId]);

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
        </div>

        {alunos.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <User size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum aluno encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece adicionando alunos a esta turma.
              </p>
              <Button onClick={openCreateDialog} className="flex items-center gap-2 mx-auto">
                <Plus size={20} />
                Adicionar Primeiro Aluno
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alunos.map((aluno) => (
              <Card key={aluno.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{aluno.nome}</span>
                    <div className="flex gap-2">
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
                            <Trash2 size={16} />
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
                  </CardTitle>
                  <CardDescription>{aluno.idade} anos</CardDescription>
                </CardHeader>
                <CardContent>
                  {aluno.responsavel && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Responsável:</span> {aluno.responsavel}
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    Adicionado em {new Date(aluno.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}