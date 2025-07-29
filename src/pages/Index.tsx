import { useState, useEffect } from "react";
import Welcome from "./Welcome";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import CheckIn from "./CheckIn";
import Reports from "./Reports";
import Support from "./Support";
import AddChild from "./AddChild";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [currentPage, setCurrentPage] = useState("welcome");
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se há uma sessão ativa
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Verificar o tipo de usuário e se tem crianças cadastradas
        await checkUserFlow(session.user);
      }
      setIsLoading(false);
    };

    // Listener para mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          await checkUserFlow(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setCurrentPage('welcome');
        }
      }
    );

    checkAuth();

    return () => subscription.unsubscribe();
  }, []);

  const checkUserFlow = async (user: any) => {
    // Buscar o perfil do usuário para verificar o tipo
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('tipo_usuario')
      .eq('id', user.id)
      .single();

    if (profile && profile.tipo_usuario === 'pai') {
      // Verificar se o pai tem crianças cadastradas
      const { data: children } = await (supabase as any)
        .from('criancas')
        .select('id')
        .eq('usuario_id', user.id);

      if (!children || children.length === 0) {
        setCurrentPage('add-child');
      } else {
        setCurrentPage('dashboard');
      }
    } else {
      setCurrentPage('dashboard');
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
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
      case "dashboard":
        return <Dashboard onNavigate={handleNavigate} />;
      case "checkin":
        return <CheckIn onNavigate={handleNavigate} />;
      case "reports":
        return <Reports onNavigate={handleNavigate} />;
      case "support":
        return <Support onNavigate={handleNavigate} />;
      case "add-child":
        return <AddChild onNavigate={handleNavigate} />;
      default:
        return <Welcome onNavigate={handleNavigate} />;
    }
  };

  return renderPage();
};

export default Index;
