import { useState, useEffect } from "react";
import EmotivaButton from "@/components/EmotivaButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, Calendar, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddChildProps {
  onNavigate: (page: string) => void;
}

interface Child {
  nome: string;
  idade: number | "";
}

const AddChild = ({ onNavigate }: AddChildProps) => {
  const [children, setChildren] = useState<Child[]>([{ nome: "", idade: "" }]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const addAnotherChild = () => {
    setChildren([...children, { nome: "", idade: "" }]);
  };

  const updateChild = (index: number, field: keyof Child, value: string | number) => {
    const updatedChildren = [...children];
    updatedChildren[index] = { ...updatedChildren[index], [field]: value };
    setChildren(updatedChildren);
  };

  const removeChild = (index: number) => {
    if (children.length > 1) {
      const updatedChildren = children.filter((_, i) => i !== index);
      setChildren(updatedChildren);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação detalhada
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!child.nome.trim()) {
        toast({
          title: "Erro de validação",
          description: `O nome da criança ${i + 1} é obrigatório.`,
          variant: "destructive",
        });
        return;
      }
      if (!child.idade || isNaN(Number(child.idade))) {
        toast({
          title: "Erro de validação", 
          description: `A idade da criança ${i + 1} deve ser um número válido.`,
          variant: "destructive",
        });
        return;
      }
    }

    const validChildren = children.filter(child => child.nome.trim() && child.idade);
    if (validChildren.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma criança com nome e idade.",
        variant: "destructive",
      });
      return;
    }

    // Obter usuário atual do Supabase diretamente
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
    
    console.log('Current user from auth:', currentUser);
    console.log('Auth error:', authError);
    
    if (authError) {
      console.error('Auth error:', authError);
      toast({
        title: "Erro de autenticação",
        description: authError.message,
        variant: "destructive",
      });
      return;
    }
    
    if (!currentUser) {
      console.error('No current user found');
      toast({
        title: "Erro",
        description: "Usuário não encontrado. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const childrenToInsert = validChildren.map(child => ({
        nome: child.nome.trim(),
        idade: Number(child.idade)
      }));

      console.log('Children to insert:', childrenToInsert);

      const { error } = await (supabase as any)
        .from('criancas')
        .insert(childrenToInsert);

      if (error) {
        toast({
          title: "Erro ao adicionar crianças",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Crianças adicionadas com sucesso!",
          description: `${validChildren.length} criança(s) adicionada(s).`,
        });
        onNavigate('dashboard');
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center">
        <button 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-2xl shadow-card">
          <CardHeader className="text-center">
            <div className="text-4xl mb-4">👶</div>
            <CardTitle className="text-2xl font-bold">Adicionar Criança(s)</CardTitle>
            <CardDescription>
              Cadastre seus filhos para começar a monitorar o bem-estar emocional
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {children.map((child, index) => (
                <div key={index} className="p-4 border border-border rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Criança {index + 1}</h3>
                    {children.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChild(index)}
                        className="text-muted-foreground hover:text-destructive transition-colors text-sm"
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`nome-${index}`}>Nome da Criança *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id={`nome-${index}`}
                          type="text"
                          placeholder="Nome da criança"
                          value={child.nome}
                          onChange={(e) => updateChild(index, 'nome', e.target.value)}
                          className="pl-10 h-12 rounded-xl"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`idade-${index}`}>Idade *</Label>
                      <Select 
                        value={child.idade.toString()} 
                        onValueChange={(value) => updateChild(index, 'idade', parseInt(value))}
                        required
                      >
                        <SelectTrigger className="h-12 rounded-xl">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Selecione a idade" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 18 }, (_, i) => i + 3).map((age) => (
                            <SelectItem key={age} value={age.toString()}>
                              {age} anos
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex flex-col sm:flex-row gap-3">
                <EmotivaButton 
                  type="button"
                  variant="soft" 
                  size="lg" 
                  onClick={addAnotherChild}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar outra criança
                </EmotivaButton>

                <EmotivaButton 
                  type="submit" 
                  variant="primary" 
                  size="lg" 
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? "Adicionando..." : "Finalizar Cadastro"}
                </EmotivaButton>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddChild;