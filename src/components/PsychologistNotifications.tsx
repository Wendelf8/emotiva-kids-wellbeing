import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, User, CheckCircle, XCircle, Clock } from "lucide-react";

interface PendingInvite {
  id: string;
  child_id: string;
  parent_id: string;
  created_at: string;
  criancas: {
    nome: string;
    idade: number;
  };
  profiles: {
    nome: string;
  };
}

interface PsychologistNotificationsProps {
  psychologistData: any;
}

export default function PsychologistNotifications({ psychologistData }: PsychologistNotificationsProps) {
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPendingInvites = async () => {
    if (!psychologistData?.id) return;

    try {
      // Buscar shared_reports com dados das crianças
      const { data: reportsData, error } = await supabase
        .from('shared_reports')
        .select(`
          *,
          criancas:child_id (
            nome,
            idade
          )
        `)
        .eq('psychologist_id', psychologistData.id)
        .eq('status', 'pendente')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar dados dos pais separadamente
      const enrichedData = [];
      for (const report of reportsData || []) {
        const { data: parentData } = await supabase
          .from('profiles')
          .select('nome')
          .eq('id', report.parent_id)
          .single();

        enrichedData.push({
          ...report,
          profiles: parentData || { nome: 'Responsável' }
        });
      }

      setPendingInvites(enrichedData);
    } catch (error) {
      console.error('Erro ao buscar convites:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar convites pendentes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingInvites();
  }, [psychologistData]);

  const handleInviteResponse = async (inviteId: string, action: 'aceito' | 'recusado') => {
    setProcessing(inviteId);

    try {
      const { error } = await supabase
        .from('shared_reports')
        .update({ status: action })
        .eq('id', inviteId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: action === 'aceito' 
          ? "Convite aceito! Agora você pode acessar os relatórios da criança."
          : "Convite recusado.",
      });

      fetchPendingInvites();
    } catch (error: any) {
      console.error('Erro ao responder convite:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar resposta.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notificações
          {pendingInvites.length > 0 && (
            <Badge className="ml-2">{pendingInvites.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingInvites.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma notificação pendente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="p-4 border border-border rounded-lg bg-muted/20">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Novo convite de acompanhamento</h4>
                      <p className="text-sm text-muted-foreground">
                        {invite.profiles?.nome || 'Responsável'} deseja compartilhar os relatórios de{' '}
                        <strong>{invite.criancas?.nome}</strong> ({invite.criancas?.idade} anos)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(invite.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleInviteResponse(invite.id, 'aceito')}
                    disabled={processing === invite.id}
                    className="flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {processing === invite.id ? "Processando..." : "Aceitar"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleInviteResponse(invite.id, 'recusado')}
                    disabled={processing === invite.id}
                    className="flex items-center gap-1"
                  >
                    <XCircle className="w-4 h-4" />
                    Recusar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}