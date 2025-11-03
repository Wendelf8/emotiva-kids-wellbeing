import { useState, useEffect } from "react";
import EmotivaButton from "@/components/EmotivaButton";
import MoodCard from "@/components/MoodCard";
import CheckinAlerts from "@/components/CheckinAlerts";
import ChildManagementMenu from "@/components/ChildManagementMenu";
import SharedReportsManager from "@/components/SharedReportsManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Calendar, TrendingUp, BookOpen, Settings, Menu, MoreVertical, ChevronDown, User, LogOut, HelpCircle, BarChart3, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/AppContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PaywallModal } from "@/components/PaywallModal";

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const Dashboard = ({ onNavigate }: DashboardProps) => {
  const [currentMood] = useState("neutral");
  const [children, setChildren] = useState<any[]>([]);
  const { selectedChild, setSelectedChild } = useAppContext();
  const { canAccessPremium, isSubscribed, createCheckoutSession, openCustomerPortal } = useSubscription();
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
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState("");
  const { toast } = useToast();
  const [authChecked, setAuthChecked] = useState(false);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const refreshChildren = async () => {
    if (!user || !userProfile) return;
    
    setChildrenLoading(true);
    try {
      if (userProfile.tipo_usuario === 'pai') {
        const { data: childrenData, error: childrenErr } = await supabase
          .from('criancas')
          .select('*')
          .eq('usuario_id', user.id)
          .order('criado_em', { ascending: true });
        
        if (childrenErr) {
          console.log('Erro ao buscar crianças:', childrenErr);
          return;
        }

        if (childrenData) {
          setChildren(childrenData);
          
          if (!selectedChild && childrenData.length > 0) {
            setSelectedChild(childrenData[0]);
          } else if (selectedChild && !childrenData.find(c => c.id === selectedChild.id)) {
            setSelectedChild(childrenData.length > 0 ? childrenData[0] : null);
          }
        }
      }
    } catch (error) {
      console.log('Erro ao carregar crianças:', error);
    } finally {
      setChildrenLoading(false);
      if (!initialLoaded) setInitialLoaded(true);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.log('Erro ao obter usuário:', error);
          setErrorMsg('Erro de autenticação');
          setAuthChecked(true);
          return;
        }

        if (!user) {
          console.log('Nenhum usuário autenticado no Dashboard');
          setErrorMsg('Usuário não autenticado');
          setAuthChecked(true);
          return;
        }

        setUser(user);
        
        // Buscar perfil do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        setUserProfile(profile);
        
        // Inicializar campos de edição
        if (profile) {
          setEditedName(profile.nome || "");
          setEditedEmail(profile.email || "");
        }

        // Buscar alertas do usuário
        const { data: alertsData } = await supabase
          .from('alertas')
          .select('*')
          .eq('enviado_para_id', user.id)
          .order('criado_em', { ascending: false })
          .limit(5);
        
        if (alertsData) {
          setAlerts(alertsData);
        }

        setAuthChecked(true);
      } catch (error) {
        console.error('Erro crítico no Dashboard:', error);
        setErrorMsg('Erro interno');
        setAuthChecked(true);
      }
    };
    
    getUser();
  }, []);

  // Carregar crianças após autenticação e perfil estarem prontos
  useEffect(() => {
    if (authChecked && user && userProfile) {
      refreshChildren();
    }
  }, [authChecked, user, userProfile]);

  // Listener separado para atualizações em tempo real - só ativa APÓS o primeiro carregamento
  useEffect(() => {
    if (!authChecked || !user || !userProfile || !initialLoaded) return;

    if (userProfile.tipo_usuario !== 'pai') return;

    const channel = supabase
      .channel('criancas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'criancas',
          filter: `usuario_id=eq.${user.id}`
        },
        () => {
          refreshChildren();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authChecked, user, userProfile, initialLoaded]);

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

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    
    try {
      // Usar a função delete_user() que já existe no banco
      const { error } = await supabase.rpc('delete_user');
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Conta excluída",
        description: "Sua conta foi excluída com sucesso.",
      });
      
      onNavigate('welcome');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir conta.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteAccount(false);
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

  // Tela de carregamento - apenas no início
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">💙</div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Tela de erro se não houver usuário
  if (errorMsg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-muted-foreground">{errorMsg}</p>
          <button 
            onClick={() => onNavigate('welcome')}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

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
                  {userProfile?.tipo_usuario === 'pai' && (
                    <button 
                      onClick={() => onNavigate('add-child')}
                      className="w-full text-left p-2 rounded hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Adicionar criança
                    </button>
                  )}
                  <div className="border-t my-1"></div>
                  <AlertDialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
                    <AlertDialogTrigger asChild>
                      <button className="w-full text-left p-2 rounded hover:bg-muted transition-colors flex items-center gap-2 text-destructive">
                        <Trash2 className="w-4 h-4" />
                        Excluir Conta
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Conta</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta
                          e removerá todos os seus dados de nossos servidores.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          disabled={isDeleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting ? "Excluindo..." : "Sim, excluir conta"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
                    onClick={() => {
                      if (!canAccessPremium()) {
                        setBlockedFeature("Relatórios de Check-ins");
                        setShowPaywall(true);
                      } else {
                        onNavigate('reports');
                      }
                    }}
                    className="w-full text-left p-2 rounded hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Ver Check-ins {!canAccessPremium() && "🔒"}
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
              : userProfile?.tipo_usuario === 'Escola'
              ? 'Acompanhe o bem-estar emocional dos seus alunos'
              : 'Como está o seu dia hoje?'
            }
            {childrenLoading && (
              <span className="ml-2 text-xs text-muted-foreground">Atualizando crianças...</span>
            )}
          </p>
            {userProfile?.tipo_usuario === 'pai' && (
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
            )}
          </div>
        </div>

        {/* Alertas de Check-in - apenas para pais */}
        {userProfile?.tipo_usuario === 'pai' && <CheckinAlerts children={children} />}

        {/* Compartilhamento de relatórios */}
        {userProfile?.tipo_usuario === 'pai' && selectedChild && (
          <SharedReportsManager 
            childId={selectedChild.id} 
            childName={selectedChild.nome} 
          />
        )}

        {/* Grid principal */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card de humor atual - apenas para pais */}
            {userProfile?.tipo_usuario === 'pai' && <MoodCard currentMood={currentMood} />}

            {/* Botão de check-in - apenas para pais */}
            {userProfile?.tipo_usuario === 'pai' && (
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
            )}

            {/* Dashboard específico para escolas */}
            {userProfile?.tipo_usuario === 'Escola' && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Painel da Escola
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Gerencie suas turmas e alunos</h3>
                    <p className="text-muted-foreground mb-4">
                      Acompanhe o bem-estar emocional dos alunos e organize suas turmas
                    </p>
                    <EmotivaButton 
                      variant="primary" 
                      onClick={() => onNavigate('minhas-turmas')}
                    >
                      Gerenciar Turmas
                    </EmotivaButton>
                  </div>
                </CardContent>
              </Card>
            )}

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

            {/* Status de Assinatura */}
            {userProfile?.tipo_usuario === 'pai' && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {isSubscribed ? (
                      <>
                        <Badge className="bg-primary text-primary-foreground">Premium</Badge>
                        <span className="text-lg">🔓</span>
                      </>
                    ) : (
                      <>
                        <Badge variant="outline">Gratuito</Badge>
                        <span className="text-lg">🔒</span>
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isSubscribed ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Plano Premium ativo
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={openCustomerPortal}
                        className="w-full"
                      >
                        Gerenciar Assinatura
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        1 check-in gratuito por criança
                      </p>
                      <Button 
                        onClick={createCheckoutSession}
                        className="w-full"
                        size="sm"
                      >
                        Assinar Premium - R$ 69,90/mês
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Ações rápidas */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userProfile?.tipo_usuario === 'pai' && (
                  <>
                     <EmotivaButton 
                       variant="soft" 
                       size="sm"
                       onClick={() => {
                         if (!canAccessPremium()) {
                           setBlockedFeature("Relatórios detalhados");
                           setShowPaywall(true);
                         } else {
                           onNavigate('reports');
                         }
                       }}
                       className="w-full justify-start"
                     >
                       <TrendingUp className="w-4 h-4 mr-2" />
                       Ver Relatórios {!canAccessPremium() && "🔒"}
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
                  </>
                )}

                {userProfile?.tipo_usuario === 'Escola' && (
                  <>
                    <EmotivaButton 
                      variant="soft" 
                      size="sm"
                      onClick={() => onNavigate('minhas-turmas')}
                      className="w-full justify-start"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Gerenciar Turmas
                    </EmotivaButton>
                    
                    <EmotivaButton 
                      variant="soft" 
                      size="sm"
                      onClick={() => onNavigate('reports')}
                      className="w-full justify-start"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Relatórios Escolares
                    </EmotivaButton>
                    
                    <EmotivaButton 
                      variant="soft" 
                      size="sm"
                      onClick={() => onNavigate('support')}
                      className="w-full justify-start"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Suporte Técnico
                    </EmotivaButton>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature={blockedFeature}
      />
    </div>
  );
};

export default Dashboard;