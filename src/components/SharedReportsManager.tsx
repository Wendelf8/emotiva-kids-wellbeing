import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Trash2, Eye, Share2 } from "lucide-react";
import ShareReportModal from "./ShareReportModal";

interface SharedReport {
  id: string;
  child_id: string;
  psychologist_id: string;
  status: string;
  created_at: string;
  psicologos: {
    nome: string;
    psicologo_id: string;
    especialidade: string;
  };
}

interface SharedReportsManagerProps {
  childId: string;
  childName: string;
}

export default function SharedReportsManager({ childId, childName }: SharedReportsManagerProps) {
  const [sharedReports, setSharedReports] = useState<SharedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const { toast } = useToast();

  const fetchSharedReports = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_reports')
        .select(`
          *,
          psicologos:psychologist_id (
            nome,
            psicologo_id,
            especialidade
          )
        `)
        .eq('child_id', childId)
        .in('status', ['pendente', 'aceito'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSharedReports(data || []);
    } catch (error) {
      console.error('Erro ao buscar compartilhamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedReports();
  }, [childId]);

  const handleRevoke = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('shared_reports')
        .update({ status: 'revogado' })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Compartilhamento revogado com sucesso.",
      });

      fetchSharedReports();
    } catch (error: any) {
      console.error('Erro ao revogar compartilhamento:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao revogar compartilhamento.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Pendente</Badge>;
      case 'aceito':
        return <Badge className="bg-green-500 hover:bg-green-600">Aceito</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Compartilhamentos
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
    <>
      <Card className="bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Compartilhamentos de {childName}
            </div>
            <Button
              onClick={() => setShowShareModal(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Compartilhar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sharedReports.length === 0 ? (
            <div className="text-center py-8">
              <Share2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Nenhum compartilhamento ativo</p>
              <p className="text-sm text-muted-foreground">
                Compartilhe os relatórios de {childName} com psicólogos para acompanhamento profissional
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sharedReports.map((report) => (
                <div key={report.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        Dr(a). {report.psicologos?.nome}
                        {getStatusBadge(report.status)}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {report.psicologos?.especialidade} • ID: {report.psicologos?.psicologo_id}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Compartilhado em {new Date(report.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {report.status === 'aceito' && (
                        <Badge variant="outline" className="text-green-600 border-green-300 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          Ativo
                        </Badge>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revogar Compartilhamento</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja revogar o compartilhamento com Dr(a). {report.psicologos?.nome}?
                              O psicólogo perderá acesso imediato aos relatórios de {childName}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRevoke(report.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Revogar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ShareReportModal
        isOpen={showShareModal}
        onOpenChange={setShowShareModal}
        childId={childId}
        childName={childName}
      />
    </>
  );
}