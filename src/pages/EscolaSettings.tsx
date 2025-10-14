import { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Mail, Users, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/contexts/SubscriptionContext';

type EscolaSettingsProps = {
  onNavigate: (page: string) => void;
};

export default function EscolaSettings({ onNavigate }: EscolaSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [escolaData, setEscolaData] = useState({
    nome: '',
    cidade: '',
    estado: '',
  });
  const [profileData, setProfileData] = useState({
    nome: '',
    email: '',
  });
  const [alunosCount, setAlunosCount] = useState(0);
  const { toast } = useToast();
  const { isSubscribed, subscriptionTier, subscriptionEnd, openCustomerPortal } = useSubscription();

  useEffect(() => {
    fetchEscolaData();
  }, []);

  const fetchEscolaData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar dados da escola
      const { data: escola } = await supabase
        .from('escolas')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (escola) {
        setEscolaData({
          nome: escola.nome || '',
          cidade: escola.cidade || '',
          estado: escola.estado || '',
        });
      }

      // Buscar dados do perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, email')
        .eq('id', user.id)
        .single();

      if (profile) {
        setProfileData({
          nome: profile.nome || '',
          email: profile.email || '',
        });
      }

      // Contar alunos
      const { data: turmas } = await supabase
        .from('turmas')
        .select('id')
        .eq('user_id', user.id);

      if (turmas && turmas.length > 0) {
        const turmaIds = turmas.map(t => t.id);
        const { count } = await supabase
          .from('alunos')
          .select('*', { count: 'exact', head: true })
          .in('turma_id', turmaIds);

        setAlunosCount(count || 0);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Atualizar dados da escola
      const { error: escolaError } = await supabase
        .from('escolas')
        .upsert({
          user_id: user.id,
          nome: escolaData.nome,
          cidade: escolaData.cidade,
          estado: escolaData.estado,
        });

      if (escolaError) throw escolaError;

      // Atualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome: profileData.nome,
          email: profileData.email,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getSubscriptionStatus = () => {
    if (!isSubscribed) {
      return { text: 'Inativa', variant: 'destructive' as const };
    }
    
    if (subscriptionEnd) {
      const endDate = new Date(subscriptionEnd);
      const now = new Date();
      
      if (endDate < now) {
        return { text: 'Expirada', variant: 'destructive' as const };
      }
      
      // Check if trial (within 14 days of start)
      const daysSinceStart = Math.floor((now.getTime() - (endDate.getTime() - 30 * 24 * 60 * 60 * 1000)) / (1000 * 60 * 60 * 24));
      if (daysSinceStart <= 14) {
        return { text: 'Em teste', variant: 'secondary' as const };
      }
    }
    
    return { text: 'Ativa', variant: 'default' as const };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configurações da Escola</h1>
            <p className="text-muted-foreground">Gerencie as informações da sua instituição</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Informações da Escola */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Dados da Escola
              </CardTitle>
              <CardDescription>
                Informações principais da instituição
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome-escola">Nome da Escola</Label>
                <Input
                  id="nome-escola"
                  value={escolaData.nome}
                  onChange={(e) => setEscolaData({ ...escolaData, nome: e.target.value })}
                  placeholder="Digite o nome da escola"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={escolaData.cidade}
                    onChange={(e) => setEscolaData({ ...escolaData, cidade: e.target.value })}
                    placeholder="Cidade"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={escolaData.estado}
                    onChange={(e) => setEscolaData({ ...escolaData, estado: e.target.value })}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Administrador */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Administrador
              </CardTitle>
              <CardDescription>
                Dados do responsável pela conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome-admin">Nome do Administrador</Label>
                <Input
                  id="nome-admin"
                  value={profileData.nome}
                  onChange={(e) => setProfileData({ ...profileData, nome: e.target.value })}
                  placeholder="Digite o nome"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email-admin">E-mail do Administrador</Label>
                <Input
                  id="email-admin"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="email@escola.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="text-sm font-medium">Número de Alunos</span>
                <Badge variant="secondary" className="text-lg">
                  {alunosCount}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Assinatura */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Assinatura
              </CardTitle>
              <CardDescription>
                Status e gerenciamento da sua assinatura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Status da Assinatura</p>
                  {subscriptionEnd && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {isSubscribed ? `Válida até: ${new Date(subscriptionEnd).toLocaleDateString('pt-BR')}` : 'Sem assinatura ativa'}
                    </p>
                  )}
                </div>
                <Badge variant={subscriptionStatus.variant}>
                  {subscriptionStatus.text}
                </Badge>
              </div>
              
              {subscriptionTier && (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Plano</span>
                  <Badge variant="outline" className="capitalize">
                    {subscriptionTier}
                  </Badge>
                </div>
              )}

              {isSubscribed && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => openCustomerPortal()}
                >
                  Gerenciar Assinatura
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Botões de ação */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => onNavigate('dashboard')}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
