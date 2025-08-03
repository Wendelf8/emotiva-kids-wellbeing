import { useState, useEffect } from "react";
import EmotivaButton from "@/components/EmotivaButton";
import EmojiSelector from "@/components/EmojiSelector";
import DatePicker from "@/components/DatePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatTime } from "@/utils/dateUtils";
import { useAppContext } from "@/contexts/AppContext";

interface CheckInProps {
  onNavigate: (page: string) => void;
}

const CheckIn = ({ onNavigate }: CheckInProps) => {
  const { selectedChild } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    como_se_sente: "",
    dormiu_bem: null as boolean | null,
    algo_ruim: null as boolean | null,
    resumo: "",
    data_escolhida: new Date()
  });
  const { toast } = useToast();

  const handleMoodSelect = (mood: string) => {
    setFormData(prev => ({ ...prev, como_se_sente: mood }));
  };

  const handleSubmit = async () => {
    if (!selectedChild) {
      toast({
        title: "Erro",
        description: "Nenhuma criança selecionada.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.como_se_sente || formData.dormiu_bem === null || formData.algo_ruim === null) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const checkInData = {
        crianca_id: selectedChild.id,
        como_se_sente: formData.como_se_sente,
        dormiu_bem: formData.dormiu_bem,
        algo_ruim: formData.algo_ruim,
        resumo: formData.resumo || null,
        data_escolhida: formData.data_escolhida.toISOString().split('T')[0],
        // Campos mantidos para compatibilidade
        emocao: formData.como_se_sente,
        intensidade: formData.como_se_sente === "happy" ? 5 : formData.como_se_sente === "neutral" ? 3 : 1,
        data: new Date().toISOString(),
        observacoes: JSON.stringify({
          dormiu_bem: formData.dormiu_bem,
          aconteceu_algo_ruim: formData.algo_ruim,
          comentario: formData.resumo
        })
      };

      const { error } = await supabase
        .from('checkins_emocionais')
        .insert([checkInData]);

      if (error) {
        console.error('Erro ao salvar check-in:', error);
        if (error.code === '23505') {
          toast({
            title: "Check-in já realizado",
            description: `Já existe um check-in para ${selectedChild.nome} neste dia.`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erro ao salvar",
            description: "Não foi possível salvar o check-in. Tente novamente.",
            variant: "destructive"
          });
        }
        return;
      }

      const now = new Date();
      toast({
        title: "Check-in realizado! ✨",
        description: `Check-in de ${selectedChild.nome} salvo com sucesso às ${formatTime(now)}`,
      });
      
      onNavigate('dashboard');
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Algo deu errado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return formData.como_se_sente !== "" && 
           formData.dormiu_bem !== null && 
           formData.algo_ruim !== null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-card shadow-card">
        <button 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
        
        <div className="text-center">
          <h1 className="text-lg font-semibold">Check-in Emocional</h1>
        </div>
        
        <div className="w-8"></div>
      </div>

      <div className="max-w-2xl mx-auto p-4 py-8">
        {/* Informações da criança */}
        {selectedChild && (
          <Card className="mb-6 shadow-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-soft rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{selectedChild.nome}</h2>
                  <p className="text-sm text-muted-foreground">{selectedChild.idade} anos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-card animate-fade-in">
          <CardHeader>
            <CardTitle className="text-xl text-center">
              Como foi o dia de {selectedChild?.nome || 'hoje'}?
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Seleção de Data */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Dia do check-in
              </Label>
              <DatePicker
                date={formData.data_escolhida}
                onDateChange={(date) => date && setFormData(prev => ({ ...prev, data_escolhida: date }))}
                disabled={(date) => date > new Date()}
                placeholder="Selecione o dia"
              />
            </div>

            {/* Como se sente */}
            <div className="space-y-4">
              <Label className="text-base font-medium">
                Como {selectedChild?.nome || 'você'} está se sentindo?
              </Label>
              <EmojiSelector 
                selectedMood={formData.como_se_sente}
                onMoodSelect={handleMoodSelect}
                size="lg"
              />
            </div>

            {/* Dormiu bem */}
            <div className="space-y-4">
              <Label className="text-base font-medium">
                {selectedChild?.nome || 'Você'} dormiu bem?
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: true, label: "Sim, dormiu bem", emoji: "😴" },
                  { value: false, label: "Não dormiu bem", emoji: "😵‍💫" }
                ].map((option) => (
                  <button
                    key={option.value.toString()}
                    onClick={() => setFormData(prev => ({ ...prev, dormiu_bem: option.value }))}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      formData.dormiu_bem === option.value
                        ? "border-primary bg-primary-soft shadow-soft"
                        : "border-border hover:border-primary/50 hover:bg-primary-soft/30"
                    }`}
                  >
                    <div className="text-3xl mb-2">{option.emoji}</div>
                    <div className="text-sm font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Algo ruim aconteceu */}
            <div className="space-y-4">
              <Label className="text-base font-medium">
                Aconteceu algo ruim com {selectedChild?.nome || 'você'}?
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: false, label: "Não, tudo normal", emoji: "😊" },
                  { value: true, label: "Sim, algo ruim aconteceu", emoji: "😔" }
                ].map((option) => (
                  <button
                    key={option.value.toString()}
                    onClick={() => setFormData(prev => ({ ...prev, algo_ruim: option.value }))}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      formData.algo_ruim === option.value
                        ? "border-primary bg-primary-soft shadow-soft"
                        : "border-border hover:border-primary/50 hover:bg-primary-soft/30"
                    }`}
                  >
                    <div className="text-2xl mb-2">{option.emoji}</div>
                    <div className="text-sm font-medium text-center">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Comentários opcionais */}
            <div className="space-y-3">
              <Label htmlFor="resumo" className="text-base font-medium">
                Deseja adicionar algo? (opcional)
              </Label>
              <Textarea
                id="resumo"
                placeholder="Conte-nos um pouco mais sobre como foi o dia..."
                value={formData.resumo}
                onChange={(e) => setFormData(prev => ({ ...prev, resumo: e.target.value }))}
                className="min-h-[100px] rounded-xl"
              />
              <p className="text-sm text-muted-foreground">
                Sua privacidade é importante. Apenas você e os responsáveis podem ver isso.
              </p>
            </div>

            {/* Resumo visual quando formulário válido */}
            {isFormValid() && (
              <Card className="bg-muted/30 border-primary/20">
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-3 text-center">✨ Resumo do check-in</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Badge variant="outline">Humor</Badge>
                      </span>
                      <span>{formData.como_se_sente === "happy" ? "😀 Feliz" : formData.como_se_sente === "neutral" ? "😐 Neutro" : "😢 Triste"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Badge variant="outline">Sono</Badge>
                      </span>
                      <span>
                        {formData.dormiu_bem === true ? "😴 Dormiu bem" : "😵‍💫 Não dormiu bem"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Badge variant="outline">Problemas</Badge>
                      </span>
                      <span>
                        {formData.algo_ruim === false ? "😊 Nenhum problema" : "😔 Algo ruim aconteceu"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botão de finalizar */}
            <div className="pt-4">
              <EmotivaButton
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                disabled={!isFormValid() || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Salvando..." : "✨ Finalizar Check-in"}
              </EmotivaButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckIn;