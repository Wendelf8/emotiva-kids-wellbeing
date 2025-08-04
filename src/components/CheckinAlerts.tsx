import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [minimizedAlerts, setMinimizedAlerts] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!children || children.length === 0) return;

      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const alertsData: AlertData[] = [];

      for (const child of children) {
        // Buscar o último check-in da criança
        const { data: checkins } = await supabase
          .from('checkins_emocionais')
          .select('*')
          .eq('crianca_id', child.id)
          .order('data', { ascending: false })
          .limit(1);

        if (checkins && checkins.length > 0) {
          const checkin = checkins[0];
          const checkinDate = new Date(checkin.data);

          // Verificar se o check-in é de menos de 24 horas
          if (checkinDate >= twentyFourHoursAgo) {
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
      }

      setAlerts(alertsData);
    };

    fetchAlerts();
  }, [children]);

  const toggleMinimized = (index: number) => {
    setMinimizedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

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
          const isMinimized = minimizedAlerts.has(index);

          if (isMinimized) {
            return (
              <div
                key={index}
                onClick={() => toggleMinimized(index)}
                className="flex items-center gap-2 p-3 bg-orange-100 border border-orange-200 rounded-lg cursor-pointer hover:bg-orange-150 transition-colors"
              >
                <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                <span className="text-orange-800 font-medium flex-1">
                  {alert.child.nome}
                </span>
                <ChevronDown className="h-4 w-4 text-orange-600" />
              </div>
            );
          }

          return (
            <Alert key={index} className="border-orange-200 bg-orange-50">
              <div className="flex justify-between items-start">
                <div className="flex gap-2 flex-1">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <AlertDescription className="text-orange-800 flex-1">
                    <div className="space-y-1">
                      <p className="font-medium">
                        🚨 {alert.child.nome} {alert.issues.join(', ')}.
                      </p>
                      <p className="text-sm text-orange-600">
                        Último check-in: {formattedDate} às {formattedTime}
                      </p>
                    </div>
                  </AlertDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleMinimized(index)}
                  className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-100"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </Alert>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default CheckinAlerts;