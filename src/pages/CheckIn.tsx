import { useState } from "react";
import EmotivaButton from "@/components/EmotivaButton";
import EmojiSelector from "@/components/EmojiSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Moon, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface CheckInProps {
  onNavigate: (page: string) => void;
}

const CheckIn = ({ onNavigate }: CheckInProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    mood: "",
    sleep: "",
    problems: "",
    comments: ""
  });
  const { toast } = useToast();

  const handleMoodSelect = (mood: string) => {
    setFormData(prev => ({ ...prev, mood }));
  };

  const handleSubmit = () => {
    // Simular envio
    toast({
      title: "Check-in realizado! ✨",
      description: "Obrigado por compartilhar como você está se sentindo.",
    });
    onNavigate('dashboard');
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.mood !== "";
      case 2: return formData.sleep !== "";
      case 3: return formData.problems !== "";
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
              {step === 1 && "Como você está se sentindo hoje?"}
              {step === 2 && "Você dormiu bem?"}
              {step === 3 && "Algo ruim aconteceu hoje?"}
              {step === 4 && "Quer nos contar mais alguma coisa?"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Passo 1: Humor */}
            {step === 1 && (
              <div className="space-y-6">
                <EmojiSelector 
                  selectedMood={formData.mood}
                  onMoodSelect={handleMoodSelect}
                  size="lg"
                />
              </div>
            )}

            {/* Passo 2: Sono */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "yes", label: "Sim", emoji: "😴" },
                    { value: "kinda", label: "Mais ou menos", emoji: "😪" },
                    { value: "no", label: "Não", emoji: "😵‍💫" }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData(prev => ({ ...prev, sleep: option.value }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.sleep === option.value
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
                    { value: "no", label: "Não", emoji: "😊" },
                    { value: "family", label: "Problemas em casa", emoji: "🏠" },
                    { value: "school", label: "Problemas na escola", emoji: "🏫" },
                    { value: "friends", label: "Problemas com amigos", emoji: "👥" }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData(prev => ({ ...prev, problems: option.value }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.problems === option.value
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
                    value={formData.comments}
                    onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
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
                        <span>{formData.mood === "happy" ? "😀 Feliz" : formData.mood === "neutral" ? "😐 Neutro" : "😢 Triste"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Sono</Badge>
                        <span>
                          {formData.sleep === "yes" ? "😴 Dormiu bem" : 
                           formData.sleep === "kinda" ? "😪 Mais ou menos" : "😵‍💫 Não dormiu bem"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Problemas</Badge>
                        <span>
                          {formData.problems === "no" ? "😊 Nenhum problema" :
                           formData.problems === "family" ? "🏠 Problemas em casa" :
                           formData.problems === "school" ? "🏫 Problemas na escola" :
                           "👥 Problemas com amigos"}
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
                  className="flex-1"
                >
                  ✨ Finalizar Check-in
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