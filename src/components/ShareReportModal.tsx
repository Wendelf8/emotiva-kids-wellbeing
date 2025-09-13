import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy } from "lucide-react";

interface ShareReportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  childId: string;
  childName: string;
}

export default function ShareReportModal({ isOpen, onOpenChange, childId, childName }: ShareReportModalProps) {
  const [psychologistId, setPsychologistId] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    if (!psychologistId.trim()) {
      toast({
        title: "Erro",
        description: "Digite o ID do psicólogo.",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);

    try {
      // Verificar se o psicólogo existe
      const { data: psychologist, error: psychError } = await supabase
        .from('psicologos')
        .select('id, nome')
        .eq('psicologo_id', psychologistId.trim().toUpperCase())
        .single();

      if (psychError || !psychologist) {
        toast({
          title: "Erro",
          description: "Psicólogo não encontrado. Verifique o ID informado.",
          variant: "destructive",
        });
        return;
      }

      // Verificar se já existe um compartilhamento ativo
      const { data: existingShare } = await supabase
        .from('shared_reports')
        .select('*')
        .eq('child_id', childId)
        .eq('psychologist_id', psychologist.id)
        .in('status', ['pendente', 'aceito']);

      if (existingShare && existingShare.length > 0) {
        const status = existingShare[0].status;
        toast({
          title: "Atenção",
          description: `Já existe um compartilhamento ${status} com este psicólogo.`,
          variant: "destructive",
        });
        return;
      }

      // Obter dados do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Criar compartilhamento
      const { error: shareError } = await supabase
        .from('shared_reports')
        .insert({
          child_id: childId,
          parent_id: user.id,
          psychologist_id: psychologist.id,
          status: 'pendente'
        });

      if (shareError) throw shareError;

      // Criar notificação para o psicólogo
      const { error: alertError } = await supabase
        .from('alertas')
        .insert({
          enviado_para_id: psychologist.id,
          mensagem: `Novo convite para acompanhar ${childName}. Acesse suas notificações para aceitar ou recusar.`
        });

      if (alertError) console.warn('Erro ao criar alerta:', alertError);

      toast({
        title: "Sucesso!",
        description: `Convite enviado para Dr(a). ${psychologist.nome}`,
      });

      onOpenChange(false);
      setPsychologistId("");
    } catch (error: any) {
      console.error('Erro ao compartilhar:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar convite.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Compartilhar com Psicólogo
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="psychologist-id">ID do Psicólogo</Label>
            <Input
              id="psychologist-id"
              value={psychologistId}
              onChange={(e) => setPsychologistId(e.target.value)}
              placeholder="Ex: PSIC-0001"
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Digite o ID fornecido pelo psicólogo para compartilhar os relatórios de {childName}.
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 justify-end">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSharing}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleShare}
            disabled={isSharing}
          >
            {isSharing ? "Enviando..." : "Enviar Convite"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}