import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import DatePicker from "@/components/DatePicker";

interface EscolaRelatoriosProps {
  onNavigate: (page: string) => void;
}

interface Turma {
  id: string;
  nome: string;
}

interface EmotionData {
  emocao: string;
  count: number;
  percentage: number;
}

export default function EscolaRelatorios({ onNavigate }: EscolaRelatoriosProps) {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<string>("todas");
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [emotionData, setEmotionData] = useState<EmotionData[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCheckins: 0,
    totalAlunos: 0,
    alertasAtivos: 0,
  });
  const { toast } = useToast();

  const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];

  useEffect(() => {
    fetchTurmas();
  }, []);

  useEffect(() => {
    if (turmas.length > 0) {
      fetchRelatorios();
    }
  }, [selectedTurma, startDate, endDate, turmas]);

  const fetchTurmas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("turmas")
        .select("id, nome")
        .eq("user_id", user.id)
        .order("nome");

      if (error) throw error;
      setTurmas(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar turmas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as turmas.",
        variant: "destructive",
      });
    }
  };

  const fetchRelatorios = async () => {
    try {
      setLoading(true);

      // Buscar alunos
      let alunosQuery = supabase
        .from("alunos")
        .select("id, turma_id");

      if (selectedTurma !== "todas") {
        alunosQuery = alunosQuery.eq("turma_id", selectedTurma);
      } else {
        const turmaIds = turmas.map(t => t.id);
        alunosQuery = alunosQuery.in("turma_id", turmaIds);
      }

      const { data: alunosData, error: alunosError } = await alunosQuery;
      if (alunosError) throw alunosError;

      const alunoIds = alunosData?.map(a => a.id) || [];

      // Buscar check-ins no período
      const { data: checkinsData, error: checkinsError } = await supabase
        .from("aluno_checkins")
        .select("*")
        .in("aluno_id", alunoIds)
        .gte("data", startDate.toISOString())
        .lte("data", endDate.toISOString());

      if (checkinsError) throw checkinsError;

      // Calcular estatísticas de emoções
      const emotionCounts: Record<string, number> = {};
      const dailyCounts: Record<string, number> = {};

      checkinsData?.forEach((checkin) => {
        // Contar emoções
        emotionCounts[checkin.emocao] = (emotionCounts[checkin.emocao] || 0) + 1;

        // Contar por dia
        const day = new Date(checkin.data).toLocaleDateString('pt-BR');
        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      });

      const totalCheckins = checkinsData?.length || 0;

      // Preparar dados de emoções
      const emotions: EmotionData[] = Object.entries(emotionCounts)
        .map(([emocao, count]) => ({
          emocao,
          count,
          percentage: Math.round((count / totalCheckins) * 100),
        }))
        .sort((a, b) => b.count - a.count);

      setEmotionData(emotions);

      // Preparar dados diários
      const daily = Object.entries(dailyCounts).map(([date, count]) => ({
        date,
        checkins: count,
      }));

      setDailyData(daily);

      // Contar alertas ativos (emoções negativas com alta intensidade)
      const alertas = checkinsData?.filter(
        (c) => c.intensidade >= 4 && ["triste", "ansioso", "bravo"].includes(c.emocao.toLowerCase())
      ).length || 0;

      setStats({
        totalCheckins,
        totalAlunos: alunosData?.length || 0,
        alertasAtivos: alertas,
      });
    } catch (error: any) {
      console.error("Erro ao carregar relatórios:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os relatórios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => onNavigate("escola-dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Relatórios Emocionais</h1>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Turma</label>
                <Select value={selectedTurma} onValueChange={setSelectedTurma}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma turma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as Turmas</SelectItem>
                    {turmas.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Data Inicial</label>
                <DatePicker date={startDate} onDateChange={setStartDate} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Data Final</label>
                <DatePicker date={endDate} onDateChange={setEndDate} />
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Carregando relatórios...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Alunos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalAlunos}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Check-ins no Período
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalCheckins}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    Alertas Identificados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">{stats.alertasAtivos}</div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Distribuição de Emoções
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {emotionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={emotionData}
                          dataKey="count"
                          nameKey="emocao"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={(entry) => `${entry.emocao}: ${entry.percentage}%`}
                        >
                          {emotionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-12">
                      Nenhum dado disponível para o período selecionado.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Check-ins por Dia</CardTitle>
                </CardHeader>
                <CardContent>
                  {dailyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="checkins" fill="#8B5CF6" name="Check-ins" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-12">
                      Nenhum dado disponível para o período selecionado.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Emoções */}
            <Card>
              <CardHeader>
                <CardTitle>Emoções Mais Frequentes</CardTitle>
              </CardHeader>
              <CardContent>
                {emotionData.length > 0 ? (
                  <div className="space-y-3">
                    {emotionData.map((emotion, index) => (
                      <div key={emotion.emocao} className="flex items-center gap-4">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium capitalize">{emotion.emocao}</span>
                            <span className="text-muted-foreground">
                              {emotion.count} ({emotion.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${emotion.percentage}%`,
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum dado disponível para o período selecionado.
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
