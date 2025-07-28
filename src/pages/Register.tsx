import { useState } from "react";
import EmotivaButton from "@/components/EmotivaButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Lock, User, School } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RegisterProps {
  onNavigate: (page: string) => void;
}

const Register = ({ onNavigate }: RegisterProps) => {
  const [userType, setUserType] = useState<"parent" | "school" | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nome: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome: formData.nome,
            tipo_usuario: userType || 'pai'
          }
        }
      });

      if (error) {
        toast({
          title: "Erro ao criar conta",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu e-mail para confirmar a conta.",
        });
        onNavigate('login');
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
          onClick={() => onNavigate('login')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md shadow-card">
          <CardHeader className="text-center">
            <div className="text-4xl mb-4">💙</div>
            <CardTitle className="text-2xl font-bold">Criar conta</CardTitle>
            <CardDescription>
              Junte-se à comunidade Emotiva
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Seleção de tipo de usuário */}
            {!userType && (
              <div className="space-y-4">
                <Label className="text-sm font-medium">Você é:</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setUserType("parent")}
                    className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary-soft/30 transition-all duration-200 group"
                  >
                    <User className="w-8 h-8 text-primary mx-auto mb-2" />
                    <span className="font-medium">Pai/Mãe</span>
                  </button>
                  <button
                    onClick={() => setUserType("school")}
                    className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary-soft/30 transition-all duration-200 group"
                  >
                    <School className="w-8 h-8 text-primary mx-auto mb-2" />
                    <span className="font-medium">Escola</span>
                  </button>
                </div>
              </div>
            )}

            {/* Formulário de cadastro */}
            {userType && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="text-xs">
                    {userType === "parent" ? "👨‍👩‍👧‍👦 Pai/Mãe" : "🏫 Escola"}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => setUserType(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Alterar
                  </button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome {userType === "school" ? "da Escola" : "Completo"}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="nome"
                      type="text"
                      placeholder={userType === "school" ? "Nome da escola" : "Seu nome completo"}
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      className="pl-10 h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10 h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 h-12 rounded-xl"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mínimo de 6 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="pl-10 h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <EmotivaButton 
                  type="submit" 
                  variant="primary" 
                  size="lg" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Criando conta..." : "Criar conta"}
                </EmotivaButton>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Já tem conta? <span className="text-primary font-medium">Fazer login</span>
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;