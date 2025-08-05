import { useState, useEffect } from "react";
import EmotivaButton from "@/components/EmotivaButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewPasswordProps {
  onNavigate: (page: string) => void;
}

const NewPassword = ({ onNavigate }: NewPasswordProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se há um token na URL
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const token = urlParams.get('token');
    
    if (!token) {
      toast({
        title: "Token inválido",
        description: "Use o link do e-mail para acessar esta página.",
        variant: "destructive",
      });
      onNavigate('login');
    }
  }, [onNavigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, digite sua nova senha.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "As senhas digitadas não são iguais.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Obter token da URL
      const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const token = urlParams.get('token');

      if (!token) {
        toast({
          title: "Token inválido",
          description: "Use o link do e-mail para acessar esta página.",
          variant: "destructive",
        });
        onNavigate('login');
        return;
      }

      // Usar nossa edge function personalizada
      const response = await fetch('https://hifksggqkimdfqlhcosx.supabase.co/functions/v1/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          newPassword: password 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Erro ao atualizar senha",
          description: result.error || "Erro desconhecido",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Senha atualizada com sucesso!",
          description: "Sua senha foi alterada. Faça login com a nova senha.",
        });
        
        // Redirecionar para login
        onNavigate('login');
      }
    } catch (error: any) {
      toast({
        title: "Erro de conexão",
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
          Voltar ao login
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md shadow-card">
          <CardHeader className="text-center">
            <div className="text-4xl mb-4">🔐</div>
            <CardTitle className="text-2xl font-bold">Nova senha</CardTitle>
            <CardDescription>
              Digite sua nova senha
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                {loading ? "Atualizando..." : "Atualizar senha"}
              </EmotivaButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewPassword;