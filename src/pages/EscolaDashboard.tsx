import { useState, useEffect } from 'react';
import { Users, TrendingUp, AlertTriangle, BarChart3, Mail, Settings as SettingsIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PWAInstallButton from '@/components/PWAInstallButton';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">💙</div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Emotiva - Escola</h1>
              <p className="text-sm text-muted-foreground">{userProfile?.nome}</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('minhas-turmas')}
              className="text-foreground"
            >
              <Users className="w-4 h-4 mr-2" />
              Turmas
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('escola-relatorios')}
              className="text-foreground"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Relatórios
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('escola-settings')}
              className="text-foreground"
            >
              <SettingsIcon className="w-4 h-4 mr-2" />
              Configurações
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-foreground"
            >
              Sair
            </Button>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Título */}
        <div>
          <h2 className="text-3xl font-bold text-foreground">Painel</h2>
          <p className="text-muted-foreground mt-1">Acompanhe o bem-estar emocional dos alunos</p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card/60 backdrop-blur border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-foreground">Total de Alunos</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalAlunos}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Em todas as turmas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-foreground">Check-ins (7 dias)</CardTitle>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalCheckins}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Últimos 7 dias
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-foreground">Alertas Ativos</CardTitle>
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.alertasAtivos}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Alunos que chamam atenção
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Emoções Mais Frequentes */}
        <Card className="bg-card/60 backdrop-blur border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
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
                        <span className="text-sm font-medium capitalize text-foreground">{stat.emotion}</span>
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
        <Card className="bg-card/60 backdrop-blur border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
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
                    <div className="w-full bg-muted/30 rounded-t-lg relative" style={{ height: '100%' }}>
                      <div
                        className="bg-teal-500 rounded-t-lg absolute bottom-0 w-full flex items-end justify-center pb-2"
                        style={{ height: `${height}%`, minHeight: item.count > 0 ? '24px' : '0' }}
                      >
                        {item.count > 0 && (
                          <span className="text-xs font-medium text-white">
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
        <Card className="bg-card/60 backdrop-blur border-border/40">
          <CardHeader>
            <CardTitle className="text-foreground">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button 
              onClick={() => onNavigate('minhas-turmas')}
              className="bg-teal-500 hover:bg-teal-600 text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              Gerenciar Turmas
            </Button>
            <Button variant="outline" onClick={() => onNavigate('minhas-turmas')}>
              <Mail className="w-4 h-4 mr-2" />
              Convidar Pais
            </Button>
            <Button variant="outline" onClick={() => onNavigate('escola-settings')}>
              <SettingsIcon className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* PWA Install Button - Fixed position */}
      <div className="fixed bottom-6 right-6 z-50">
        <PWAInstallButton />
      </div>
    </div>
  );
}
