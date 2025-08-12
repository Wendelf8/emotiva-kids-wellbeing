import { useState, useEffect } from 'react';
import { Plus, Users, Edit, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import EmotivaButton from '@/components/EmotivaButton';

type Turma = {
  id: string;
  nome: string;
  serie: string;
  descricao: string;
  created_at: string;
  alunos_count?: number;
};

type MinhasTurmasProps = {
  onNavigate: (page: string, turmaId?: string) => void;
};

export default function MinhasTurmas({ onNavigate }: MinhasTurmasProps) {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    serie: '',
    descricao: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTurmas();
  }, []);

  const fetchTurmas = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('turmas')
        .select(`
          *,
          alunos(count)
        `)
        .eq('escola_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const turmasWithCount = data?.map(turma => ({
        ...turma,
        alunos_count: turma.alunos?.[0]?.count || 0
      })) || [];

      setTurmas(turmasWithCount);
    } catch (error) {
      console.error('Erro ao buscar turmas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as turmas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação dos campos obrigatórios
    if (!formData.nome.trim()) {
      toast({
        title: "Erro de Validação",
        description: "O nome da turma é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({
          title: "Erro de Autenticação",
          description: "Usuário não autenticado. Faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      if (editingTurma) {
        const { error } = await supabase
          .from('turmas')
          .update({
            nome: formData.nome.trim(),
            serie: formData.serie.trim() || null,
            descricao: formData.descricao.trim() || null
          })
          .eq('id', editingTurma.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Turma atualizada com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('turmas')
          .insert({
            nome: formData.nome.trim(),
            serie: formData.serie.trim() || null,
            descricao: formData.descricao.trim() || null,
            escola_id: user.user.id
          });

        if (error) {
          console.error('Erro detalhado ao inserir turma:', error);
          throw error;
        }

        toast({
          title: "Sucesso",
          description: "Turma criada com sucesso!",
        });
      }

      setIsDialogOpen(false);
      setEditingTurma(null);
      setFormData({ nome: '', serie: '', descricao: '' });
      fetchTurmas();
    } catch (error: any) {
      console.error('Erro ao salvar turma:', error);
      
      let errorMessage = "Não foi possível salvar a turma.";
      
      if (error?.code === '42501') {
        errorMessage = "Apenas usuários do tipo 'Escola' podem criar turmas. Verifique se seu perfil está configurado corretamente.";
      } else if (error?.message) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (turma: Turma) => {
    try {
      const { error } = await supabase
        .from('turmas')
        .delete()
        .eq('id', turma.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Turma excluída com sucesso!",
      });
      
      fetchTurmas();
    } catch (error) {
      console.error('Erro ao excluir turma:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a turma.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (turma: Turma) => {
    setEditingTurma(turma);
    setFormData({
      nome: turma.nome,
      serie: turma.serie || '',
      descricao: turma.descricao || ''
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingTurma(null);
    setFormData({ nome: '', serie: '', descricao: '' });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando turmas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Minhas Turmas</h1>
            <p className="text-muted-foreground">Gerencie suas turmas e alunos</p>
          </div>
          
          <div className="flex gap-3">
            <EmotivaButton onClick={() => onNavigate('dashboard')}>
              Voltar
            </EmotivaButton>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog} className="flex items-center gap-2">
                  <Plus size={20} />
                  Nova Turma
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingTurma ? 'Editar Turma' : 'Nova Turma'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTurma ? 'Edite as informações da turma' : 'Preencha as informações da nova turma'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome da Turma</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Turma A"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="serie">Série/Ano</Label>
                    <Input
                      id="serie"
                      value={formData.serie}
                      onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
                      placeholder="Ex: 1º Ano, 5ª Série"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Descrição da turma..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingTurma ? 'Salvar' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {turmas.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma turma encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando sua primeira turma para gerenciar seus alunos.
              </p>
              <Button onClick={openCreateDialog} className="flex items-center gap-2 mx-auto">
                <Plus size={20} />
                Criar Primeira Turma
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {turmas.map((turma) => (
              <Card key={turma.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{turma.nome}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onNavigate('turma-detalhes', turma.id)}
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(turma)}
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
                            <AlertDialogTitle>Excluir Turma</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza de que deseja excluir a turma "{turma.nome}"? 
                              Esta ação não pode ser desfeita e todos os alunos da turma também serão excluídos.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(turma)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardTitle>
                  {turma.serie && (
                    <CardDescription>{turma.serie}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {turma.descricao && (
                    <p className="text-sm text-muted-foreground mb-3">{turma.descricao}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users size={16} />
                      <span>{turma.alunos_count || 0} alunos</span>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate('turma-detalhes', turma.id)}
                    >
                      Gerenciar
                    </Button>
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