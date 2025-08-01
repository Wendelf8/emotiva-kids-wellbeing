import { useState, useEffect } from "react";
import EmotivaButton from "@/components/EmotivaButton";
import EmojiSelector from "@/components/EmojiSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
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
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    emocao: "",
    dormiu_bem: null as boolean | null,
    aconteceu_algo_ruim: null as boolean | null,
    comentario: ""
  });
  const { toast } = useToast();

  const handleMoodSelect = (mood: string) => {
    setFormData(prev => ({ ...prev, emocao: mood }));
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

    setIsSubmitting(true);

    try {
      const checkInData = {
        crianca_id: selectedChild.id,
        emocao: formData.emocao,
        observacoes: JSON.stringify({
          dormiu_bem: formData.dormiu_bem,
          aconteceu_algo_ruim: formData.aconteceu_algo_ruim,
          comentario: formData.comentario
        }),
        intensidade: formData.emocao === "happy" ? 5 : formData.emocao === "neutral" ? 3 : 1,
        data: new Date().toISOString()
      };

      const { error } = await (supabase as any)
        .from('checkins_emocionais')
        .insert([checkInData]);

      if (error) {
        console.error('Erro ao salvar check-in:', error);
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar o check-in. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      const now = new Date();
      toast({
        title: "Check-in realizado! ✨",
        description: `Check-in de ${selectedChild.nome} feito com sucesso às ${formatTime(now)}`,
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

  const canProceed = () => {
    switch (step) {
      case 1: return formData.emocao !== "";
      case 2: return formData.dormiu_bem !== null;
      case 3: return formData.aconteceu_algo_ruim !== null;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-card shadow-card">
        <button 
          onClick={() => step > 1 ? setStep(step - 1) : onNavigate('dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {step > 1 ? "Anterior" : "Voltar"}
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{step}/4</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((num) => (
              <div
                key={num}
                className={`w-2 h-2 rounded-full ${
                  num <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 py-8">
        <Card className="shadow-card animate-fade-in">
          <CardHeader className="text-center">
            <div className="text-4xl mb-4">
              {step === 1 && "🌟"}
              {step === 2 && "😴"}
              {step === 3 && "🤔"}
              {step === 4 && "💭"}
            </div>
            <CardTitle className="text-2xl">
              {step === 1 && `Como ${selectedChild?.nome || 'você'} está se sentindo hoje?`}
              {step === 2 && `${selectedChild?.nome || 'Você'} dormiu bem?`}
              {step === 3 && `Algo ruim aconteceu hoje com ${selectedChild?.nome || 'você'}?`}
              {step === 4 && "Quer nos contar mais alguma coisa?"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Passo 1: Humor */}
            {step === 1 && (
              <div className="space-y-6">
                <EmojiSelector 
                  selectedMood={formData.emocao}
                  onMoodSelect={handleMoodSelect}
                  size="lg"
                />
              </div>
            )}

            {/* Passo 2: Sono */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: true, label: "Sim", emoji: "😴" },
                    { value: false, label: "Não", emoji: "😵‍💫" }
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
            )}

            {/* Passo 3: Problemas */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: false, label: "Não", emoji: "😊" },
                    { value: true, label: "Sim, algo ruim aconteceu", emoji: "😔" }
                  ].map((option) => (
                    <button
                      key={option.value.toString()}
                      onClick={() => setFormData(prev => ({ ...prev, aconteceu_algo_ruim: option.value }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.aconteceu_algo_ruim === option.value
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
            )}

            {/* Passo 4: Comentários */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="comments" className="text-base">
                    Comentários (opcional)
                  </Label>
                    <Textarea
                      id="comments"
                      placeholder="Conte-nos um pouco mais sobre como foi seu dia..."
                      value={formData.comentario}
                      onChange={(e) => setFormData(prev => ({ ...prev, comentario: e.target.value }))}
                      className="mt-2 min-h-[120px] rounded-xl"
                    />
                  <p className="text-sm text-muted-foreground mt-2">
                    Sua privacidade é importante para nós. Apenas você e seus responsáveis podem ver isso.
                  </p>
                </div>

                {/* Resumo */}
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <h4 className="font-medium mb-3">Resumo do seu check-in:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Humor</Badge>
                        <span>{formData.emocao === "happy" ? "😀 Feliz" : formData.emocao === "neutral" ? "😐 Neutro" : "😢 Triste"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Sono</Badge>
                        <span>
                          {formData.dormiu_bem === true ? "😴 Dormiu bem" : "😵‍💫 Não dormiu bem"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Problemas</Badge>
                        <span>
                          {formData.aconteceu_algo_ruim === false ? "😊 Nenhum problema" : "😔 Algo ruim aconteceu"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Botões de navegação */}
            <div className="flex gap-3 pt-4">
              {step < 4 ? (
                <EmotivaButton
                  variant="primary"
                  size="lg"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="flex-1"
                >
                  Próximo
                </EmotivaButton>
              ) : (
                <EmotivaButton
                  variant="primary"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Salvando..." : "✨ Finalizar Check-in"}
                </EmotivaButton>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckIn;