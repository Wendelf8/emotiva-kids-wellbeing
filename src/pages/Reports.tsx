import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Calendar, AlertTriangle, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReportsProps {
  onNavigate: (page: string) => void;
}

const Reports = ({ onNavigate }: ReportsProps) => {
  // Dados simulados para o relatório semanal
  const weeklyData = [
    { day: "Segunda", mood: "happy", emoji: "😀" },
    { day: "Terça", mood: "neutral", emoji: "😐" },
    { day: "Quarta", mood: "sad", emoji: "😢" },
    { day: "Quinta", mood: "sad", emoji: "😢" },
    { day: "Sexta", mood: "neutral", emoji: "😐" },
    { day: "Sábado", mood: "happy", emoji: "😀" },
    { day: "Domingo", mood: "happy", emoji: "😀" }
  ];

  const insights = [
    {
      type: "warning",
      title: "Tristeza contínua",
      description: "Sofia relatou tristeza por 2 dias seguidos (Qua-Qui)",
      suggestion: "Considere conversar sobre o que pode estar incomodando"
    },
    {
      type: "positive",
      title: "Melhora no fim de semana",
      description: "Humor melhorou significativamente no fim de semana",
      suggestion: "Identifique quais atividades contribuem para o bem-estar"
    }
  ];

  const getMoodCount = (targetMood: string) => {
    return weeklyData.filter(day => day.mood === targetMood).length;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="p-4 flex items-center bg-card shadow-card">
        <button 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar ao Dashboard
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-4 py-8 space-y-6">
        {/* Título */}
        <div className="text-center animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">📊 Relatório Semanal</h1>
          <p className="text-muted-foreground">
            7 a 13 de Janeiro • Sofia
          </p>
        </div>

        {/* Resumo da semana */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Humor da Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4 mb-6">
              {weeklyData.map((day, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl mb-2">{day.emoji}</div>
                  <div className="text-sm font-medium mb-1">{day.day}</div>
                  <Badge 
                    variant={
                      day.mood === "happy" ? "secondary" : 
                      day.mood === "neutral" ? "outline" : 
                      "destructive"
                    }
                    className="text-xs"
                  >
                    {day.mood === "happy" ? "Feliz" : 
                     day.mood === "neutral" ? "Neutro" : "Triste"}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary-foreground">{getMoodCount("happy")}</div>
                <div className="text-sm text-muted-foreground">Dias Felizes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">{getMoodCount("neutral")}</div>
                <div className="text-sm text-muted-foreground">Dias Neutros</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{getMoodCount("sad")}</div>
                <div className="text-sm text-muted-foreground">Dias Tristes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insights e alertas */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Insights da Semana
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.map((insight, index) => (
              <div 
                key={index}
                className={`p-4 rounded-xl border-l-4 ${
                  insight.type === "warning" 
                    ? "border-l-destructive bg-destructive/5" 
                    : "border-l-secondary bg-secondary/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {insight.type === "warning" ? (
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    ) : (
                      <Heart className="w-5 h-5 text-secondary-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {insight.description}
                    </p>
                    <div className="bg-card p-3 rounded-lg">
                      <p className="text-sm">
                        <strong>💡 Sugestão:</strong> {insight.suggestion}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sugestões de conversa */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>💬 Sugestões de Conversa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-primary-soft/30 rounded-lg">
                <p className="text-sm">
                  "Como foi seu dia na escola na quarta e quinta-feira? Aconteceu algo especial?"
                </p>
              </div>
              <div className="p-3 bg-primary-soft/30 rounded-lg">
                <p className="text-sm">
                  "O que você mais gostou de fazer no fim de semana?"
                </p>
              </div>
              <div className="p-3 bg-primary-soft/30 rounded-lg">
                <p className="text-sm">
                  "Há algo que está te deixando preocupado(a) ou triste?"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Próximos passos */}
        <Card className="shadow-card border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl mb-3">🌟</div>
              <h3 className="font-semibold mb-2">Continue acompanhando!</h3>
              <p className="text-sm text-muted-foreground">
                Fazer check-ins regulares ajuda a entender melhor os padrões emocionais
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;