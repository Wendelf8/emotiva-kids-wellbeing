import { useState, useEffect } from "react";
import Welcome from "./Welcome";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import CheckIn from "./CheckIn";
import Reports from "./Reports";
import Support from "./Support";
import AddChild from "./AddChild";
import ResetPassword from "./ResetPassword";
import NewPassword from "./NewPassword";
import { supabase } from "@/integrations/supabase/client";
import { AppContextProvider } from "@/contexts/AppContext";

const Index = () => {
  const [currentPage, setCurrentPage] = useState("welcome");
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Parar loading imediatamente e ir direto para welcome
    setIsLoading(false);
    setCurrentPage('welcome');
  }, []);

  const checkUserFlow = async (user: any) => {
    try {
      // Buscar o perfil do usuário para verificar o tipo
      const { data: profile, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('tipo_usuario')
        .eq('id', user.id)
        .single();

      // Se não encontrar perfil ou der erro, vai direto pro dashboard
      if (profileError || !profile) {
        console.log('Profile not found or error:', profileError);
        setCurrentPage('dashboard');
        return;
      }

      if (profile.tipo_usuario === 'pai') {
        // Verificar se o pai tem crianças cadastradas
        const { data: children, error: childrenError } = await (supabase as any)
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
      case "reset-password":
        return <ResetPassword onNavigate={handleNavigate} />;
      case "new-password":
        return <NewPassword onNavigate={handleNavigate} />;
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

  return <AppContextProvider>{renderPage()}</AppContextProvider>;
};

export default Index;
