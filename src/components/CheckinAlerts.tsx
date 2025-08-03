import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CheckinAlertsProps {
  children: any[];
}

interface AlertData {
  child: any;
  checkin: any;
  issues: string[];
}

const CheckinAlerts = ({ children }: CheckinAlertsProps) => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!children || children.length === 0) return;

      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

      const alertsData: AlertData[] = [];

      for (const child of children) {
        // Buscar o último check-in da criança nos últimos 3 dias
        const { data: checkins } = await supabase
          .from('checkins_emocionais')
          .select('*')
          .eq('crianca_id', child.id)
          .gte('data_escolhida', threeDaysAgoStr)
          .order('data_escolhida', { ascending: false })
          .limit(1);

        if (checkins && checkins.length > 0) {
          const checkin = checkins[0];
          const issues: string[] = [];

          // Verificar condições preocupantes
          if (checkin.emocao === 'sad' || checkin.como_se_sente === 'sad') {
            issues.push('está se sentindo triste');
          }

          if (checkin.dormiu_bem === false) {
            issues.push('não dormiu bem');
          }

          if (checkin.algo_ruim === true) {
            issues.push('algo ruim aconteceu');
          }

          // Se há problemas, adicionar ao alerta
          if (issues.length > 0) {
            alertsData.push({
              child,
              checkin,
              issues
            });
          }
        }
      }

      setAlerts(alertsData);
    };

    fetchAlerts();
  }, [children]);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-card border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="w-5 h-5" />
          Alertas de Check-in
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert, index) => {
          const checkinDate = new Date(alert.checkin.data);
          const formattedDate = checkinDate.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
          });
          const formattedTime = checkinDate.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <Alert key={index} className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <div className="space-y-1">
                  <p className="font-medium">
                    🚨 {alert.child.nome} {alert.issues.join(', ')}.
                  </p>
                  <p className="text-sm text-orange-600">
                    Último check-in: {formattedDate} às {formattedTime}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default CheckinAlerts;