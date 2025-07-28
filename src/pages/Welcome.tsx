import EmotivaButton from "@/components/EmotivaButton";
import { Card } from "@/components/ui/card";
import { Heart, Users, BarChart3 } from "lucide-react";
import emotivaBackground from "@/assets/emotiva-bg.jpg";

interface WelcomeProps {
  onNavigate: (page: string) => void;
}

const Welcome = ({ onNavigate }: WelcomeProps) => {
  return (
    <div 
      className="min-h-screen flex flex-col relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${emotivaBackground})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
      
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Logo e título */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="text-6xl mb-4">💙</div>
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Emotiva
          </h1>
          <p className="text-xl text-muted-foreground max-w-md">
            Acompanhe o bem-estar emocional das crianças com carinho e simplicidade
          </p>
        </div>

        {/* Cards de benefícios */}
        <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-4xl w-full">
          <Card className="p-6 text-center shadow-card border-0 bg-card/80 backdrop-blur">
            <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Check-ins Diários</h3>
            <p className="text-sm text-muted-foreground">
              Momentos especiais para entender os sentimentos
            </p>
          </Card>
          
          <Card className="p-6 text-center shadow-card border-0 bg-card/80 backdrop-blur">
            <BarChart3 className="w-12 h-12 text-secondary-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Relatórios Visuais</h3>
            <p className="text-sm text-muted-foreground">
              Gráficos simples para acompanhar o humor
            </p>
          </Card>
          
          <Card className="p-6 text-center shadow-card border-0 bg-card/80 backdrop-blur">
            <Users className="w-12 h-12 text-accent-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Para Pais e Escolas</h3>
            <p className="text-sm text-muted-foreground">
              Conectando família e educação no cuidado
            </p>
          </Card>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-4">
          <EmotivaButton 
            variant="primary" 
            size="lg"
            onClick={() => onNavigate('login')}
            className="min-w-[160px]"
          >
            Entrar
          </EmotivaButton>
          <EmotivaButton 
            variant="soft" 
            size="lg"
            onClick={() => onNavigate('register')}
            className="min-w-[160px]"
          >
            Criar Conta
          </EmotivaButton>
        </div>

        {/* Rodapé */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Um espaço seguro para cuidar das emoções das crianças
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;