import { useState, useEffect } from "react";
import EmotivaButton from "@/components/EmotivaButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ResetPasswordProps {
  onNavigate: (page: string) => void;
}

const ResetPassword = ({ onNavigate }: ResetPasswordProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { toast } = useToast();

  // Cooldown timer para evitar múltiplos envios
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se está em cooldown
    if (cooldown > 0) {
      toast({
        title: "Aguarde",
        description: `Aguarde ${cooldown} segundos antes de tentar novamente.`,
        variant: "destructive",
      });
      return;
    }
    
    // Validar e-mail
    if (!email) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, digite seu e-mail.",
        variant: "destructive",
      });
      return;
    }

    // Validar formato do e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "E-mail inválido",
        description: "Por favor, digite um e-mail válido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Usar nossa edge function personalizada via Supabase client (melhor para CORS)
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email },
      });

      const result = data as any;


      if (error) {
        toast({
          title: "Erro ao enviar e-mail",
          description: (error as any)?.message || result?.error || "Erro desconhecido",
          variant: "destructive",
        });
        // Se for rate limit, adicionar cooldown maior
        const msg = ((error as any)?.message || result?.error || '').toLowerCase();
        if (msg.includes('rate limit')) {
          setCooldown(300); // 5 minutos
        } else {
          setCooldown(60); // 1 minuto para outros erros
        }
      } else {
        // Sucesso - mostrar tela de confirmação
        setEmailSent(true);
        toast({
          title: "E-mail enviado!",
          description: "Verifique seu e-mail para redefinir a senha.",
        });
        // Definir cooldown de 30 segundos para evitar spam
        setCooldown(30);
      }
    } catch (error: any) {
      // Capturar erros de rede
      const errorMessage = error?.message || "Erro de conexão. Verifique sua internet e tente novamente.";
      toast({
        title: "Erro de conexão",
        description: errorMessage,
        variant: "destructive",
      });
      setCooldown(30);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
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
              <div className="text-4xl mb-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              </div>
              <CardTitle className="text-2xl font-bold">E-mail enviado!</CardTitle>
              <CardDescription>
                Enviamos um link de redefinição para seu e-mail. Verifique sua caixa de entrada.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <EmotivaButton 
                variant="primary" 
                size="lg" 
                className="w-full"
                onClick={() => onNavigate('login')}
              >
                Voltar ao login
              </EmotivaButton>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            <div className="text-4xl mb-4">🔑</div>
            <CardTitle className="text-2xl font-bold">Redefinir senha</CardTitle>
            <CardDescription>
              Digite seu e-mail para receber um link de redefinição
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                disabled={loading || cooldown > 0}
              >
                {loading 
                  ? "Enviando..." 
                  : cooldown > 0 
                    ? `Aguarde ${cooldown}s` 
                    : "Enviar link de redefinição"
                }
              </EmotivaButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;