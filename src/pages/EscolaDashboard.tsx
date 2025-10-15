import { useState, useEffect } from 'react';
import { Users, TrendingUp, AlertTriangle, Calendar, Settings, LogOut, BarChart3, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type EscolaDashboardProps = {
  onNavigate: (page: string) => void;
};

type EmotionStats = {
  emotion: string;
  count: number;
  percentage: number;
  emoji: string;
};

export default function EscolaDashboard({ onNavigate }: EscolaDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<string>('all');
  const [stats, setStats] = useState({
    totalAlunos: 0,
    totalCheckins: 0,
    alertasAtivos: 0,
  });
  const [emotionStats, setEmotionStats] = useState<EmotionStats[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTurma]);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, email')
        .eq('id', user.id)
        .single();

      setUserProfile(profile);

      // Buscar turmas
      const { data: turmasData } = await supabase
        .from('turmas')
        .select('id, nome')
        .eq('user_id', user.id)
        .order('nome');

      setTurmas(turmasData || []);

      // Buscar alunos
      let alunosQuery = supabase
        .from('alunos')
        .select('id, nome, turma_id');

      if (turmasData && turmasData.length > 0) {
        const turmaIds = turmasData.map(t => t.id);
        alunosQuery = alunosQuery.in('turma_id', turmaIds);

        if (selectedTurma !== 'all') {
          alunosQuery = alunosQuery.eq('turma_id', selectedTurma);
        }
      }

      const { data: alunos } = await alunosQuery;
      const totalAlunos = alunos?.length || 0;

      // Buscar check-ins (últimos 7 dias)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Como não temos vínculo direto entre alunos e crianças, 
      // vamos contar todos os check-ins da escola
      const { data: checkins, count: totalCheckins } = await supabase
        .from('checkins_emocionais')
        .select('*', { count: 'exact' })
        .gte('created_at', sevenDaysAgo.toISOString());

      // Calcular estatísticas de emoções
      const emotionCounts: { [key: string]: number } = {};
      checkins?.forEach(checkin => {
        if (checkin.emocao) {
          emotionCounts[checkin.emocao] = (emotionCounts[checkin.emocao] || 0) + 1;
        }
      });

      const total = Object.values(emotionCounts).reduce((a, b) => a + b, 0);
      const emotionStatsData: EmotionStats[] = Object.entries(emotionCounts)
        .map(([emotion, count]) => ({
          emotion,
          count,
          percentage: Math.round((count / total) * 100),
          emoji: getEmotionEmoji(emotion),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setEmotionStats(emotionStatsData);

      // Calcular tendência semanal
      const weeklyData: { [key: string]: number } = {};
      const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = daysOfWeek[date.getDay()];
        weeklyData[dayName] = 0;
      }

      checkins?.forEach(checkin => {
        const date = new Date(checkin.created_at);
        const dayName = daysOfWeek[date.getDay()];
        if (weeklyData[dayName] !== undefined) {
          weeklyData[dayName]++;
        }
      });

      const weeklyTrendData = Object.entries(weeklyData).map(([day, count]) => ({
        day,
        count,
      }));

      setWeeklyTrend(weeklyTrendData);

      // Contar alertas (simulado - em produção viria de uma tabela real)
      const alertasAtivos = 0; // TODO: Implementar lógica de alertas

      setStats({
        totalAlunos,
        totalCheckins: totalCheckins || 0,
        alertasAtivos,
      });
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do dashboard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getEmotionEmoji = (emotion: string): string => {
    const emojiMap: { [key: string]: string } = {
      'feliz': '😊',
      'triste': '😢',
      'ansioso': '😰',
      'animado': '🤩',
      'cansado': '😴',
      'bravo': '😠',
      'neutro': '😐',
    };
    return emojiMap[emotion.toLowerCase()] || '😊';
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNavigate('welcome');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-card shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">💙</div>
            <div>
              <h1 className="text-xl font-bold">Emotiva - Escola</h1>
              <p className="text-sm text-muted-foreground">{userProfile?.nome}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('minhas-turmas')}
            >
              <Users className="w-4 h-4 mr-2" />
              Turmas
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('escola-relatorios')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Relatórios
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('escola-settings')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Filtro de Turma */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-muted-foreground">Acompanhe o bem-estar emocional dos alunos</p>
          </div>
          
          {turmas.length > 0 && (
            <Select value={selectedTurma} onValueChange={setSelectedTurma}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecionar turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as turmas</SelectItem>
                {turmas.map((turma) => (
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAlunos}</div>
              <p className="text-xs text-muted-foreground">
                {selectedTurma === 'all' ? 'Em todas as turmas' : 'Na turma selecionada'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-ins (7 dias)</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCheckins}</div>
              <p className="text-xs text-muted-foreground">
                Últimos 7 dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.alertasAtivos}</div>
              <p className="text-xs text-muted-foreground">
                Alunos que requerem atenção
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Emoções Mais Frequentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Emoções Mais Frequentes
            </CardTitle>
            <CardDescription>
              Últimos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emotionStats.length > 0 ? (
              <div className="space-y-4">
                {emotionStats.map((stat) => (
                  <div key={stat.emotion} className="flex items-center gap-4">
                    <span className="text-2xl">{stat.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium capitalize">{stat.emotion}</span>
                        <span className="text-sm text-muted-foreground">
                          {stat.count} ({stat.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${stat.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum check-in registrado nos últimos 7 dias
              </p>
            )}
          </CardContent>
        </Card>

        {/* Evolução Semanal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Evolução Semanal
            </CardTitle>
            <CardDescription>
              Número de check-ins por dia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-48">
              {weeklyTrend.map((item) => {
                const maxCount = Math.max(...weeklyTrend.map(d => d.count), 1);
                const height = (item.count / maxCount) * 100;
                
                return (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-muted rounded-t-lg relative" style={{ height: '100%' }}>
                      <div
                        className="bg-primary rounded-t-lg absolute bottom-0 w-full flex items-end justify-center pb-2"
                        style={{ height: `${height}%`, minHeight: item.count > 0 ? '24px' : '0' }}
                      >
                        {item.count > 0 && (
                          <span className="text-xs font-medium text-primary-foreground">
                            {item.count}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={() => onNavigate('minhas-turmas')}>
              <Users className="w-4 h-4 mr-2" />
              Gerenciar Turmas
            </Button>
            <Button variant="outline">
              <Mail className="w-4 h-4 mr-2" />
              Convidar Pais
            </Button>
            <Button variant="outline" onClick={() => onNavigate('escola-settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
