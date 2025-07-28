import { useState } from "react";
import EmotivaButton from "@/components/EmotivaButton";
import MoodCard from "@/components/MoodCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Calendar, TrendingUp, BookOpen, Settings, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const Dashboard = ({ onNavigate }: DashboardProps) => {
  const [currentMood] = useState("neutral"); // Estado simulado
  const [childName] = useState("Sofia"); // Nome simulado

  const alerts = [
    {
      id: 1,
      type: "warning",
      message: "Sofia relatou tristeza por 3 dias seguidos",
      date: "Hoje"
    },
    {
      id: 2,
      type: "info", 
      message: "Novo conteúdo sobre ansiedade infantil disponível",
      date: "Ontem"
    }
  ];

  const recentMoods = [
    { day: "Seg", mood: "happy" },
    { day: "Ter", mood: "neutral" },
    { day: "Qua", mood: "sad" },
    { day: "Qui", mood: "sad" },
    { day: "Sex", mood: "neutral" },
    { day: "Sab", mood: "happy" },
    { day: "Dom", mood: "happy" }
  ];

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case "happy": return "😀";
      case "neutral": return "😐"; 
      case "sad": return "😢";
      default: return "😐";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-card p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">💙</div>
            <h1 className="text-xl font-bold">Emotiva</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-muted transition-colors md:hidden">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Saudação */}
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold mb-2">Olá! 👋</h2>
          <p className="text-muted-foreground">
            Como está o dia da {childName} hoje?
          </p>
        </div>

        {/* Grid principal */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card de humor atual */}
            <MoodCard currentMood={currentMood} />

            {/* Botão de check-in */}
            <div className="text-center">
              <EmotivaButton 
                variant="primary" 
                size="lg"
                onClick={() => onNavigate('checkin')}
                className="px-12"
              >
                ✨ Fazer Check-in
              </EmotivaButton>
            </div>

            {/* Humor da semana */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Humor desta semana
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  {recentMoods.map((day, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl mb-1">{getMoodEmoji(day.mood)}</div>
                      <div className="text-xs text-muted-foreground">{day.day}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Alertas */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Alertas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-start gap-2">
                      <Badge 
                        variant={alert.type === "warning" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {alert.type === "warning" ? "⚠️" : "ℹ️"}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{alert.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Ações rápidas */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <EmotivaButton 
                  variant="soft" 
                  size="sm"
                  onClick={() => onNavigate('reports')}
                  className="w-full justify-start"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Ver Relatórios
                </EmotivaButton>
                
                <EmotivaButton 
                  variant="soft" 
                  size="sm"
                  onClick={() => onNavigate('support')}
                  className="w-full justify-start"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Dicas de Apoio
                </EmotivaButton>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;