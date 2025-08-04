import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChildManagementMenuProps {
  child: any;
  onChildUpdated: () => void;
  onChildDeleted: () => void;
}

const ChildManagementMenu = ({ child, onChildUpdated, onChildDeleted }: ChildManagementMenuProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editName, setEditName] = useState(child?.nome || "");
  const [editAge, setEditAge] = useState(child?.idade || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleEditChild = async () => {
    if (!editName.trim()) {
      toast({
        title: "Erro",
        description: "O nome é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!editAge || Number(editAge) < 1 || Number(editAge) > 18) {
      toast({
        title: "Erro",
        description: "A idade deve estar entre 1 e 18 anos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('criancas')
        .update({
          nome: editName.trim(),
          idade: Number(editAge)
        })
        .eq('id', child.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Dados da criança atualizados com sucesso.",
      });

      setShowEditDialog(false);
      onChildUpdated();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar criança.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleDeleteChild = async () => {
    setIsLoading(true);

    try {
      // Primeiro deletar check-ins relacionados
      await supabase
        .from('checkins_emocionais')
        .delete()
        .eq('crianca_id', child.id);

      // Depois deletar a criança
      const { error } = await supabase
        .from('criancas')
        .delete()
        .eq('id', child.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Criança removida com sucesso.",
      });

      setShowDeleteDialog(false);
      onChildDeleted();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover criança.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = () => {
    setEditName(child?.nome || "");
    setEditAge(child?.idade || "");
    setShowEditDialog(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={openEditDialog}>
            <Edit className="mr-2 h-4 w-4" />
            Editar dados da criança
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir criança
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar dados da criança</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Digite o nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-age">Idade</Label>
              <Select value={editAge.toString()} onValueChange={setEditAge}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a idade" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 18 }, (_, i) => i + 1).map((age) => (
                    <SelectItem key={age} value={age.toString()}>
                      {age} anos
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setShowEditDialog(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleEditChild} disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente os dados de {child?.nome} e todos os check-ins relacionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChild} disabled={isLoading}>
              {isLoading ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ChildManagementMenu;