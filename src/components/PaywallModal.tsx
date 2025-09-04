import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_CONFIG } from '@/config/stripe';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  feature
}) => {
  const { createCheckoutSession } = useSubscription();

  const handleSubscribe = async () => {
    try {
      const stripe = await loadStripe(STRIPE_CONFIG.publishableKey);
      if (!stripe) {
        console.error('Stripe não carregou corretamente');
        return;
      }

      const data = await createCheckoutSession();
      if (data?.sessionId) {
        const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (result.error) {
          console.error('Erro no checkout:', result.error);
        }
      }
    } catch (error) {
      console.error('Erro ao iniciar checkout:', error);
    }
    onClose();
  };

  const premiumFeatures = [
    'Check-ins emocionais ilimitados',
    'Relatórios semanais detalhados',
    'Alertas personalizados',
    'Histórico completo de emoções',
    'Análises de tendências',
    'Suporte prioritário'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Desbloqueie o Emotiva Premium
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card className="border-primary/20">
            <CardHeader className="text-center pb-2">
              <div className="flex items-center justify-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Plano Premium</CardTitle>
              </div>
              <CardDescription>
                Acesso completo para acompanhar o bem-estar emocional das suas crianças
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">R$ 69,90</div>
                <div className="text-sm text-muted-foreground">por mês</div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Você tentou acessar: {feature}</p>
                <Badge variant="outline" className="w-full justify-center">
                  Funcionalidade Premium
                </Badge>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Recursos inclusos:</p>
                <ul className="space-y-1">
                  {premiumFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-2 pt-2">
                <Button 
                  onClick={handleSubscribe}
                  className="w-full"
                  size="lg"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Assinar Premium
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="w-full"
                >
                  Voltar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};