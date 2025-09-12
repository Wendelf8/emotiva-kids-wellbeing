import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Brain, Users, TrendingUp, Settings, LogOut, Copy } from "lucide-react";
import EmotivaButton from "@/components/EmotivaButton";

interface PsychologistDashboardProps {
  onNavigate: (page: string) => void;
}

interface SharedReport {
  id: string;
  child_id: string;
  parent_id: string;
  status: string;
  created_at: string;
  criancas: {
    nome: string;
    idade: number;
  };
}

interface PsychologistData {
  nome: string;
  crp: string;
  especialidade: string;
  psicologo_id: string;
}

export default function PsychologistDashboard({ onNavigate }: PsychologistDashboardProps) {
  const [psychologistData, setPsychologistData] = useState<PsychologistData | null>(null);
  const [sharedReports, setSharedReports] = useState<SharedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPsychologistData();
    fetchSharedReports();
  }, []);

  const fetchPsychologistData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('psicologos')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setPsychologistData(data);
    } catch (error) {
      console.error('Erro ao buscar dados do psicólogo:', error);
    }
  };

  const fetchSharedReports = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar o ID do psicólogo
      const { data: psicologoData } = await supabase
        .from('psicologos')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!psicologoData) return;

      // Buscar relatórios compartilhados
      const { data, error } = await supabase
        .from('shared_reports')
        .select(`
          *,
          criancas:child_id (
            nome,
            idade
          )
        `)
        .eq('psychologist_id', psicologoData.id)
        .eq('status', 'aceito');

      if (error) throw error;
      setSharedReports(data || []);
    } catch (error) {
      console.error('Erro ao buscar relatórios compartilhados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNavigate('welcome');
  };

  const copyPsychologistId = () => {
    if (psychologistData?.psicologo_id) {
      navigator.clipboard.writeText(psychologistData.psicologo_id);
      toast({
        title: "ID copiado!",
        description: "ID do psicólogo copiado para a área de transferência."
      });
    }
  };

  const handleUnlinkChild = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('shared_reports')
        .update({ status: 'revogado' })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Criança desvinculada com sucesso."
      });

      fetchSharedReports();
    } catch (error) {
      console.error('Erro ao desvincular criança:', error);
      toast({
        title: "Erro",
        description: "Erro ao desvincular criança.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur border-b border-border/50 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Emotiva</h1>
              <p className="text-sm text-muted-foreground">Painel do Psicólogo</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* Informações do Psicólogo */}
        <Card className="p-6 mb-6 bg-card/80 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Olá, Dr(a). {psychologistData?.nome}
              </h2>
              <p className="text-muted-foreground mb-2">
                CRP: {psychologistData?.crp} | Especialidade: {psychologistData?.especialidade}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  ID do Psicólogo: <span className="font-mono bg-muted px-2 py-1 rounded">{psychologistData?.psicologo_id}</span>
                </p>
                <Button variant="ghost" size="sm" onClick={copyPsychologistId}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Estatísticas */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card className="p-6 bg-card/80 backdrop-blur">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-accent-foreground" />
              <div>
                <p className="text-2xl font-bold text-foreground">{sharedReports.length}</p>
                <p className="text-sm text-muted-foreground">Crianças Vinculadas</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card/80 backdrop-blur">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-accent-foreground" />
              <div>
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Relatórios Este Mês</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card/80 backdrop-blur">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-accent-foreground" />
              <div>
                <p className="text-2xl font-bold text-foreground">Ativo</p>
                <p className="text-sm text-muted-foreground">Status da Conta</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Lista de Crianças Vinculadas */}
        <Card className="p-6 bg-card/80 backdrop-blur">
          <h3 className="text-xl font-bold text-foreground mb-4">Crianças Vinculadas</h3>
          
          {sharedReports.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Nenhuma criança vinculada</p>
              <p className="text-sm text-muted-foreground">
                Compartilhe seu ID ({psychologistData?.psicologo_id}) com os pais para começar a receber relatórios
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sharedReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="font-semibold text-foreground">{report.criancas.nome}</h4>
                    <p className="text-sm text-muted-foreground">
                      {report.criancas.idade} anos • Vinculado em {new Date(report.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate(`reports?child=${report.child_id}`)}
                    >
                      Ver Relatórios
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleUnlinkChild(report.id)}
                    >
                      Desvincular
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}