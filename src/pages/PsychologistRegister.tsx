import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import EmotivaButton from "@/components/EmotivaButton";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PsychologistRegisterProps {
  onNavigate: (page: string) => void;
}

export default function PsychologistRegister({ onNavigate }: PsychologistRegisterProps) {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    password: "",
    confirmPassword: "",
    crp: "",
    especialidade: "",
    celular: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.crp || !formData.especialidade || !formData.celular) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome: formData.nome,
            tipo_usuario: 'psicologo',
            user_type: 'psychologist'
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Criar perfil do psicólogo
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            nome: formData.nome,
            email: formData.email,
            tipo_usuario: 'psicologo',
            user_type: 'psychologist'
          });

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
        }

        // Criar dados específicos do psicólogo (deixar o trigger gerar o psicologo_id)
        const { error: psicologoError } = await supabase
          .from('psicologos')
          .insert({
            user_id: data.user.id,
            nome: formData.nome,
            crp: formData.crp,
            especialidade: formData.especialidade,
            celular: formData.celular,
            psicologo_id: '' // Será preenchido pelo trigger
          });

        if (psicologoError) {
          console.error('Erro ao criar dados do psicólogo:', psicologoError);
        }

        toast({
          title: "Sucesso!",
          description: "Cadastro realizado! Verifique seu email para confirmar a conta."
        });

        onNavigate('login');
      }
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      
      let errorMessage = "Erro ao criar conta. Tente novamente.";
      if (error.message?.includes('User already registered')) {
        errorMessage = "Este email já está cadastrado. Tente fazer login ou use outro email.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20">
      <Card className="w-full max-w-md p-6 shadow-card border-0 bg-card/80 backdrop-blur">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Cadastro - Psicólogo
          </h1>
          <p className="text-muted-foreground">
            Crie sua conta profissional
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Seu nome completo"
              required
            />
          </div>

          <div>
            <Label htmlFor="crp">CRP</Label>
            <Input
              id="crp"
              type="text"
              value={formData.crp}
              onChange={(e) => setFormData({ ...formData, crp: e.target.value })}
              placeholder="Número do CRP"
              required
            />
          </div>

          <div>
            <Label htmlFor="especialidade">Especialidade</Label>
            <Input
              id="especialidade"
              type="text"
              value={formData.especialidade}
              onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
              placeholder="Sua especialidade"
              required
            />
          </div>

          <div>
            <Label htmlFor="celular">Celular</Label>
            <Input
              id="celular"
              type="tel"
              value={formData.celular}
              onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
              placeholder="(11) 99999-9999"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirme sua senha"
              required
            />
          </div>

          <EmotivaButton
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </EmotivaButton>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => onNavigate('login')}
            className="text-primary hover:underline"
          >
            Já tem conta? Faça login
          </button>
        </div>
      </Card>
    </div>
  );
}