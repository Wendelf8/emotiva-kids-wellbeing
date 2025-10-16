import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthCallbackProps {
  onNavigate: (page: string) => void;
}

const AuthCallback = ({ onNavigate }: AuthCallbackProps) => {
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const tokenHash = params.get('token_hash');
        const type = params.get('type');

        if (!tokenHash) {
          toast({
            title: 'Link inválido',
            description: 'O link de confirmação não é válido.',
            variant: 'destructive',
          });
          onNavigate('login');
          return;
        }

        // Verify the OTP token
        const { error } = await supabase.auth.verifyOtp({
          type: type === 'recovery' ? 'recovery' : 'signup',
          token_hash: tokenHash,
        });

        if (error) {
          if (error.message.toLowerCase().includes('expired') || 
              error.message.toLowerCase().includes('invalid')) {
            toast({
              title: 'Link expirado ou inválido',
              description: 'Seu link de confirmação expirou. Por favor, reenvie o e-mail.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erro na confirmação',
              description: error.message,
              variant: 'destructive',
            });
          }
          onNavigate('login');
        } else {
          toast({
            title: 'Conta confirmada com sucesso!',
            description: 'Sua conta foi ativada. Você já pode fazer login.',
          });
          onNavigate('login');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        toast({
          title: 'Erro inesperado',
          description: 'Ocorreu um erro ao confirmar sua conta.',
          variant: 'destructive',
        });
        onNavigate('login');
      }
    };

    handleCallback();
  }, [onNavigate, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">💙</div>
        <p className="text-muted-foreground">Confirmando sua conta...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
