import { useState, useEffect } from "react";
import Welcome from "./Welcome";
import Login from "./Login";
import Register from "./Register";
import PsychologistRegister from "./PsychologistRegister";
import Dashboard from "./Dashboard";
import PsychologistDashboard from "./PsychologistDashboard";
import CheckIn from "./CheckIn";
import Reports from "./Reports";
import Support from "./Support";
import AddChild from "./AddChild";
import ResetPassword from "./ResetPassword";
import NewPassword from "./NewPassword";
import MinhasTurmas from "./MinhasTurmas";
import TurmaDetalhes from "./TurmaDetalhes";
import Success from "./Success";
import { supabase } from "@/integrations/supabase/client";
import { AppContextProvider } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [currentPage, setCurrentPage] = useState("welcome");
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTurmaId, setSelectedTurmaId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const applyHashRoute = () => {
      const hash = window.location.hash.replace('#', '');
      
      // Handle email confirmation
      if (hash === 'confirmed') {
        toast({
          title: "Email confirmado com sucesso!",
          description: "Sua conta foi ativada. Você já pode fazer login.",
        });
        setCurrentPage('login');
        window.history.replaceState(null, '', window.location.pathname);
        return;
      }

      // Handle payment success from URL path
      if (window.location.pathname === '/success') {
        setCurrentPage('success');
        return;
      }
      
      if (hash.startsWith('new-password')) {
        setCurrentPage('new-password');
      } else if (hash.startsWith('reset-password')) {
        setCurrentPage('reset-password');
      } else {
        setCurrentPage('welcome');
      }
    };

    // Inicializar sessão de autenticação
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      // Limpa fragmentos de token (#access_token=...) após o SDK processar
      if (window.location.hash.includes('access_token') || window.location.hash.includes('type=signup')) {
        // Aguarda o SDK persistir a sessão e então remove o hash para evitar URLs feias
        setTimeout(() => {
          window.history.replaceState(null, '', window.location.pathname);
        }, 0);
      }
      
      if (session?.user) {
        await checkUserFlow(session.user);
      } else {
        applyHashRoute();
      }
      
      setIsLoading(false);
    };

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await checkUserFlow(session.user);
        } else {
          setCurrentPage('welcome');
          setUserProfile(null);
        }
      }
    );

    initializeAuth();
    window.addEventListener('hashchange', applyHashRoute);
    
    return () => {
      window.removeEventListener('hashchange', applyHashRoute);
      subscription.unsubscribe();
    };
  }, []);

  const checkUserFlow = async (user: any) => {
    try {
      // Buscar o perfil do usuário para verificar o tipo
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tipo_usuario, user_type')
        .eq('id', user.id)
        .single();

      // Se não encontrar perfil ou der erro, vai direto pro dashboard
      if (profileError || !profile) {
        console.log('Profile not found or error:', profileError);
        setCurrentPage('dashboard');
        return;
      }

      setUserProfile(profile);

      // Verificar se é psicólogo
      if (profile.user_type === 'psychologist' || profile.tipo_usuario === 'psicologo') {
        setCurrentPage('psychologist-dashboard');
        return;
      }

      if (profile.tipo_usuario === 'pai') {
        // Verificar se o pai tem crianças cadastradas
        const { data: children, error: childrenError } = await supabase
          .from('criancas')
          .select('id')
          .eq('usuario_id', user.id);

        if (childrenError) {
          console.log('Children query error:', childrenError);
          setCurrentPage('dashboard');
          return;
        }

        if (!children || children.length === 0) {
          setCurrentPage('add-child');
        } else {
          setCurrentPage('dashboard');
        }
      } else {
        setCurrentPage('dashboard');
      }
    } catch (error) {
      console.error('Error in checkUserFlow:', error);
      setCurrentPage('dashboard');
    }
  };

  const handleNavigate = (page: string, turmaId?: string) => {
    setCurrentPage(page);
    if (turmaId) {
      setSelectedTurmaId(turmaId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">💙</div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "welcome":
        return <Welcome onNavigate={handleNavigate} />;
      case "login":
        return <Login onNavigate={handleNavigate} />;
      case "register":
        return <Register onNavigate={handleNavigate} />;
      case "psychologist-register":
        return <PsychologistRegister onNavigate={handleNavigate} />;
      case "reset-password":
        return <ResetPassword onNavigate={handleNavigate} />;
      case "new-password":
        return <NewPassword onNavigate={handleNavigate} />;
      case "dashboard":
        return <Dashboard onNavigate={handleNavigate} />;
      case "psychologist-dashboard":
        return <PsychologistDashboard onNavigate={handleNavigate} />;
      case "checkin":
        return <CheckIn onNavigate={handleNavigate} />;
      case "reports":
        return <Reports onNavigate={handleNavigate} />;
      case "support":
        return <Support onNavigate={handleNavigate} />;
      case "add-child":
        return <AddChild onNavigate={handleNavigate} />;
      case "minhas-turmas":
        return <MinhasTurmas onNavigate={handleNavigate} />;
      case "turma-detalhes":
        return selectedTurmaId ? (
          <TurmaDetalhes turmaId={selectedTurmaId} onNavigate={handleNavigate} />
        ) : (
          <Welcome onNavigate={handleNavigate} />
        );
      case "success":
        return <Success onNavigate={handleNavigate} />;
      default:
        return <Welcome onNavigate={handleNavigate} />;
    }
  };

  return <AppContextProvider>{renderPage()}</AppContextProvider>;
};

export default Index;
