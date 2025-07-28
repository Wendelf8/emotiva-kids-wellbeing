import { useState } from "react";
import EmotivaButton from "@/components/EmotivaButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Lock, School, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LoginProps {
  onNavigate: (page: string) => void;
}

const Login = ({ onNavigate }: LoginProps) => {
  const [userType, setUserType] = useState<"parent" | "school" | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    schoolCode: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simular login - em produção conectaria com backend
    onNavigate('dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center">
        <button 
          onClick={() => onNavigate('welcome')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md shadow-card">
          <CardHeader className="text-center">
            <div className="text-4xl mb-4">💙</div>
            <CardTitle className="text-2xl font-bold">Bem-vindo de volta!</CardTitle>
            <CardDescription>
              Entre na sua conta Emotiva
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Seleção de tipo de usuário */}
            {!userType && (
              <div className="space-y-4">
                <Label className="text-sm font-medium">Você é:</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setUserType("parent")}
                    className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary-soft/30 transition-all duration-200 group"
                  >
                    <User className="w-8 h-8 text-primary mx-auto mb-2" />
                    <span className="font-medium">Pai/Mãe</span>
                  </button>
                  <button
                    onClick={() => setUserType("school")}
                    className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary-soft/30 transition-all duration-200 group"
                  >
                    <School className="w-8 h-8 text-primary mx-auto mb-2" />
                    <span className="font-medium">Escola</span>
                  </button>
                </div>
              </div>
            )}

            {/* Formulário de login */}
            {userType && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="text-xs">
                    {userType === "parent" ? "👨‍👩‍👧‍👦 Pai/Mãe" : "🏫 Escola"}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => setUserType(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Alterar
                  </button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10 h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>

                {userType === "parent" && (
                  <div className="space-y-2">
                    <Label htmlFor="schoolCode">Código da Escola (opcional)</Label>
                    <Input
                      id="schoolCode"
                      placeholder="Código fornecido pela escola"
                      value={formData.schoolCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, schoolCode: e.target.value }))}
                      className="h-12 rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">
                      Conecte-se com a escola do seu filho
                    </p>
                  </div>
                )}

                <EmotivaButton type="submit" variant="primary" size="lg" className="w-full">
                  Entrar
                </EmotivaButton>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => onNavigate('register')}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Não tem conta? <span className="text-primary font-medium">Criar conta</span>
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;