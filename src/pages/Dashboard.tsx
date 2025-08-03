import { useState, useEffect } from "react";
import EmotivaButton from "@/components/EmotivaButton";
import MoodCard from "@/components/MoodCard";
import CheckinAlerts from "@/components/CheckinAlerts";
import ChildManagementMenu from "@/components/ChildManagementMenu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Calendar, TrendingUp, BookOpen, Settings, Menu, MoreVertical, ChevronDown, User, LogOut, HelpCircle, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/AppContext";

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const Dashboard = ({ onNavigate }: DashboardProps) => {
  const [currentMood] = useState("neutral");
  const [children, setChildren] = useState<any[]>([]);
  const { selectedChild, setSelectedChild } = useAppContext();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showAlertsPopover, setShowAlertsPopover] = useState(false);
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  const [showMenuPopover, setShowMenuPopover] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const refreshChildren = async () => {
    if (user && userProfile?.tipo_usuario === 'pai') {
      const { data: childrenData } = await supabase
        .from('criancas')
        .select('*')
        .eq('usuario_id', user.id)
        .order('criado_em', { ascending: true });
      
      if (childrenData) {
        setChildren(childrenData);
        // Se a criança selecionada foi deletada, selecionar a primeira disponível
        if (selectedChild && !childrenData.find(c => c.id === selectedChild.id)) {
          setSelectedChild(childrenData.length > 0 ? childrenData[0] : null);
        }
      }
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Buscar perfil do usuário
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setUserProfile(profile);
        
        // Inicializar campos de edição
        if (profile) {
          setEditedName(profile.nome || "");
          setEditedEmail(profile.email || "");
        }

        // Se for pai, buscar crianças
        if (profile && profile.tipo_usuario === 'pai') {
          const { data: childrenData } = await (supabase as any)
            .from('criancas')
            .select('*')
            .eq('usuario_id', user.id)
            .order('criado_em', { ascending: true });
          
          if (childrenData && childrenData.length > 0) {
            setChildren(childrenData);
            setSelectedChild(childrenData[0]);
          }
        }

        // Buscar alertas do usuário
        const { data: alertsData } = await (supabase as any)
          .from('alertas')
          .select('*')
          .eq('enviado_para_id', user.id)
          .order('criado_em', { ascending: false })
          .limit(5);
        
        if (alertsData) {
          setAlerts(alertsData);
        }
      }
    };
    
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNavigate('welcome');
  };

  const handleUpdateProfile = async () => {
    if (!editedName.trim()) {
      toast({
        title: "Erro",
        description: "O nome é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!editedEmail.trim()) {
      toast({
        title: "Erro", 
        description: "O email é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          nome: editedName.trim(),
          email: editedEmail.trim()
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Atualizar estado local
      setUserProfile({
        ...userProfile,
        nome: editedName.trim(),
        email: editedEmail.trim()
      });

      setShowEditProfile(false);

      toast({
        title: "Sucesso!",
        description: "Perfil atualizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar perfil.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };


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
            {/* Alertas */}
            <Popover open={showAlertsPopover} onOpenChange={setShowAlertsPopover}>
              <PopoverTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors relative">
                  <Bell className="w-5 h-5" />
                  {alerts.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
                      {alerts.length}
                    </Badge>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Alertas</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {alerts.length > 0 ? (
                    alerts.map((alert) => (
                      <div key={alert.id} className="p-3 border-b last:border-b-0 hover:bg-muted/50">
                        <p className="text-sm">{alert.mensagem}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.criado_em).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      Nenhum alerta
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Configurações */}
            <Popover open={showSettingsPopover} onOpenChange={setShowSettingsPopover}>
              <PopoverTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="end">
                <div className="p-2">
                  <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
                    <DialogTrigger asChild>
                      <button className="w-full text-left p-2 rounded hover:bg-muted transition-colors flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Editar Perfil
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Editar Perfil</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome</Label>
                          <Input
                            id="name"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            placeholder="Digite seu nome"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={editedEmail}
                            onChange={(e) => setEditedEmail(e.target.value)}
                            placeholder="Digite seu email"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowEditProfile(false)}
                          disabled={isUpdating}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleUpdateProfile}
                          disabled={isUpdating}
                        >
                          {isUpdating ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <button 
                    onClick={() => onNavigate('add-child')}
                    className="w-full text-left p-2 rounded hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Gerenciar Crianças
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Menu de três pontos */}
            <Popover open={showMenuPopover} onOpenChange={setShowMenuPopover}>
              <PopoverTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="end">
                <div className="p-2">
                  <button 
                    onClick={() => onNavigate('reports')}
                    className="w-full text-left p-2 rounded hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Ver Check-ins
                  </button>
                  <button 
                    onClick={() => onNavigate('support')}
                    className="w-full text-left p-2 rounded hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Ajuda
                  </button>
                  <div className="border-t my-1"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left p-2 rounded hover:bg-muted transition-colors flex items-center gap-2 text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Saudação */}
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold mb-2">Olá, {userProfile?.nome || 'Usuário'}! 👋</h2>
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground">
              {userProfile?.tipo_usuario === 'pai' && selectedChild 
                ? `Como está o dia da ${selectedChild.nome} hoje?`
                : 'Como está o seu dia hoje?'
              }
            </p>
            <div className="flex items-center gap-3">
              {children.length > 1 && (
                <Select value={selectedChild?.id} onValueChange={(value) => {
                  const child = children.find(c => c.id === value);
                  setSelectedChild(child);
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Selecionar criança" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.nome} ({child.idade} anos)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedChild && (
                <ChildManagementMenu 
                  child={selectedChild}
                  onChildUpdated={refreshChildren}
                  onChildDeleted={refreshChildren}
                />
              )}
            </div>
          </div>
        </div>

        {/* Alertas de Check-in */}
        <CheckinAlerts children={children} />

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
                {alerts.length > 0 ? (
                  alerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-start gap-2">
                        <Badge variant="secondary" className="text-xs">
                          ℹ️
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm">{alert.mensagem}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(alert.criado_em).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum alerta no momento</p>
                  </div>
                )}
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