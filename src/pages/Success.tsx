import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface SuccessProps {
  onNavigate: (page: string) => void;
}

const Success: React.FC<SuccessProps> = ({ onNavigate }) => {
  const { checkSubscription } = useSubscription();

  useEffect(() => {
    // Verificar status da assinatura após pagamento
    const timer = setTimeout(() => {
      checkSubscription();
    }, 2000);

    return () => clearTimeout(timer);
  }, [checkSubscription]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-card">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Pagamento Realizado!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Sua assinatura do Emotiva Premium foi ativada com sucesso.
          </p>
          <p className="text-sm">
            Agora você tem acesso a:
          </p>
          <ul className="text-sm text-left space-y-1 bg-muted/30 p-4 rounded-lg">
            <li>✅ Check-ins emocionais ilimitados</li>
            <li>✅ Relatórios semanais detalhados</li>
            <li>✅ Alertas personalizados</li>
            <li>✅ Histórico completo de emoções</li>
            <li>✅ Análises de tendências</li>
            <li>✅ Suporte prioritário</li>
          </ul>
          <div className="pt-4">
            <Button 
              onClick={() => onNavigate('dashboard')}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Success;