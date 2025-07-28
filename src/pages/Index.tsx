import { useState } from "react";
import Welcome from "./Welcome";
import Login from "./Login";
import Dashboard from "./Dashboard";
import CheckIn from "./CheckIn";
import Reports from "./Reports";
import Support from "./Support";

const Index = () => {
  const [currentPage, setCurrentPage] = useState("welcome");

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "welcome":
        return <Welcome onNavigate={handleNavigate} />;
      case "login":
      case "register":
        return <Login onNavigate={handleNavigate} />;
      case "dashboard":
        return <Dashboard onNavigate={handleNavigate} />;
      case "checkin":
        return <CheckIn onNavigate={handleNavigate} />;
      case "reports":
        return <Reports onNavigate={handleNavigate} />;
      case "support":
        return <Support onNavigate={handleNavigate} />;
      default:
        return <Welcome onNavigate={handleNavigate} />;
    }
  };

  return renderPage();
};

export default Index;
