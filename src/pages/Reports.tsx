import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Calendar, AlertTriangle, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentWeekDates, formatDateRange, formatWeekDay, formatShortDate, formatTime, getWeekDays } from "@/utils/dateUtils";

interface ReportsProps {
  onNavigate: (page: string) => void;
}

const Reports = ({ onNavigate }: ReportsProps) => {
  const { selectedChild } = useAppContext();
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState<{ start: Date; end: Date }>(() => {
    const { startOfWeek, endOfWeek } = getCurrentWeekDates();
    return { start: startOfWeek, end: endOfWeek };
  });

  useEffect(() => {
    const loadWeeklyData = async () => {
      if (!selectedChild) {
        setIsLoading(false);
        return;
      }

      try {
        const { startOfWeek, endOfWeek } = getCurrentWeekDates();
        
        const { data: checkins, error } = await supabase
          .from('checkins_emocionais')
          .select('*')
          .eq('crianca_id', selectedChild.id)
          .gte('data', startOfWeek.toISOString())
          .lte('data', endOfWeek.toISOString())
          .order('data', { ascending: true });

        if (error) {
          console.error('Erro ao buscar check-ins:', error);
          setWeeklyData([]);
          return;
        }

        // Criar dados da semana com base nos dias reais
        const weekDays = getWeekDays();
        const formattedData = weekDays.map(date => {
          const dayName = formatWeekDay(date);
          const shortDate = formatShortDate(date);
          
          // Encontrar check-in para este dia
          const checkin = checkins?.find(c => {
            const checkinDate = new Date(c.data);
            return checkinDate.toDateString() === date.toDateString();
          });

          if (checkin) {
            const checkinTime = new Date(checkin.data);
            return {
              day: dayName,
              date: shortDate,
              time: formatTime(checkinTime),
              mood: checkin.emocao,
              emoji: checkin.emocao === "happy" ? "😀" : checkin.emocao === "neutral" ? "😐" : "😢",
              hasCheckin: true,
              observacoes: checkin.observacoes
            };
          }

          return {
            day: dayName,
            date: shortDate,
            time: null,
            mood: null,
            emoji: "⚪",
            hasCheckin: false,
            observacoes: null
          };
        });

        setWeeklyData(formattedData);
      } catch (error) {
        console.error('Erro:', error);
        setWeeklyData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadWeeklyData();
  }, [selectedChild]);

  const generateInsights = () => {
    const insights = [];
    const checkedInDays = weeklyData.filter(day => day.hasCheckin);
    const sadDays = checkedInDays.filter(day => day.mood === "sad");
    const happyDays = checkedInDays.filter(day => day.mood === "happy");

    // Verificar tristeza contínua
    if (sadDays.length >= 2) {
      insights.push({
        type: "warning",
        title: "Dias de tristeza",
        description: `${selectedChild?.nome || 'A criança'} relatou tristeza em ${sadDays.length} dias esta semana`,
        suggestion: "Considere conversar sobre o que pode estar incomodando"
      });
    }

    // Verificar dias felizes
    if (happyDays.length >= 3) {
      insights.push({
        type: "positive",
        title: "Semana positiva",
        description: `${selectedChild?.nome || 'A criança'} teve ${happyDays.length} dias felizes esta semana`,
        suggestion: "Continue incentivando as atividades que trazem alegria"
      });
    }

    return insights;
  };

  const getMoodCount = (targetMood: string) => {
    return weeklyData.filter(day => day.mood === targetMood && day.hasCheckin).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 flex items-center bg-card shadow-card">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar ao Dashboard
          </button>
        </div>
        <div className="max-w-4xl mx-auto p-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-muted-foreground">Carregando relatório...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedChild) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 flex items-center bg-card shadow-card">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar ao Dashboard
          </button>
        </div>
        <div className="max-w-4xl mx-auto p-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">👶</div>
            <h2 className="text-xl font-semibold mb-2">Nenhuma criança selecionada</h2>
            <p className="text-muted-foreground">Selecione uma criança no dashboard para ver os relatórios.</p>
          </div>
        </div>
      </div>
    );
  }

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
            {formatDateRange(currentWeek.start, currentWeek.end)} • {selectedChild.nome}
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
                  <div className="text-xs text-muted-foreground mb-1">{day.date}</div>
                  {day.hasCheckin ? (
                    <>
                      <Badge 
                        variant={
                          day.mood === "happy" ? "secondary" : 
                          day.mood === "neutral" ? "outline" : 
                          "destructive"
                        }
                        className="text-xs mb-1"
                      >
                        {day.mood === "happy" ? "Feliz" : 
                         day.mood === "neutral" ? "Neutro" : "Triste"}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {day.time}
                      </div>
                    </>
                  ) : (
                    <Badge variant="outline" className="text-xs opacity-50">
                      Sem check-in
                    </Badge>
                  )}
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
            {generateInsights().map((insight, index) => (
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