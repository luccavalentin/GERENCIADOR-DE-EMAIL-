import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfiles, toggleProfileStatus, deleteProfile } from "@/lib/email.functions";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  UserPlus, 
  MoreVertical, 
  Key,
  Trash2,
  Mail,
  User,
  ShieldAlert
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSystemUser, resetUserPassword } from "@/lib/email.functions";

export const Route = createFileRoute("/users")({
  component: () => (
    <AppLayout>
      <UsersPage />
    </AppLayout>
  ),
});

function UsersPage() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [newUserData, setNewUserData] = React.useState({ full_name: "", email: "", password: "" });
  
  const { data: profiles, isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: () => getProfiles(),
  });

  const createUserMutation = useMutation({
    mutationFn: (data: typeof newUserData) => createSystemUser({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Usuário criado com sucesso");
      setIsCreateDialogOpen(false);
      setNewUserData({ full_name: "", email: "", password: "" });
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (data: { id: string; is_active: boolean }) => toggleProfileStatus({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Status atualizado");
    },
    onError: () => toast.error("Falha ao atualizar status"),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: { id: string; email: string }) => resetUserPassword({ data }),
    onSuccess: () => toast.success("Link de recuperação enviado ao e-mail"),
    onError: () => toast.error("Falha ao solicitar recuperação"),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (data: { id: string }) => deleteProfile({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Usuário removido");
    },
    onError: () => toast.error("Falha ao remover usuário"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0000A0]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Usuários do Sistema</h1>
          <p className="text-slate-500 mt-1">Gestão de acesso administrativo Agilliza</p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-[#0000A0] hover:bg-[#000080] shadow-md font-bold w-full sm:w-auto"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Nome</TableHead>
                <TableHead className="font-bold text-slate-700">E-mail</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Status</TableHead>
                <TableHead className="font-bold text-slate-700 hidden md:table-cell">Acesso</TableHead>
                <TableHead className="font-bold text-slate-700 hidden lg:table-cell">Criação</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles?.map((profile: any) => (
                <TableRow key={profile.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[#0000A0] font-bold text-xs">
                        {profile.full_name?.substring(0, 2).toUpperCase() || "??"}
                      </div>
                      <span className="font-semibold text-slate-900">{profile.full_name || "Sem nome"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 font-medium">{profile.email}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Badge variant={profile.is_active ? "default" : "secondary"} className={profile.is_active ? "bg-green-100 text-green-700 hover:bg-green-100 shadow-none border-none" : "bg-slate-100 text-slate-500 shadow-none border-none"}>
                        {profile.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                      <Switch 
                        checked={profile.is_active} 
                        onCheckedChange={(checked) => toggleStatusMutation.mutate({ id: profile.id, is_active: checked })}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm hidden md:table-cell">
                    {profile.last_access_at ? format(new Date(profile.last_access_at), "dd/MM/yy HH:mm", { locale: ptBR }) : "Nunca"}
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm hidden lg:table-cell">
                    {format(new Date(profile.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#0000A0]">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-2 shadow-lg border-slate-200">
                        <DropdownMenuItem 
                          className="cursor-pointer py-2 rounded-md transition-colors"
                          onClick={() => resetPasswordMutation.mutate({ id: profile.id, email: profile.email })}
                        >
                          <Key className="mr-2 h-4 w-4 text-slate-500" />
                          Redefinir Acesso
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer text-destructive focus:text-destructive py-2 rounded-md transition-colors"
                          onClick={() => {
                            if (confirm(`Excluir definitivamente ${profile.email}?`)) {
                              deleteUserMutation.mutate({ id: profile.id });
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir Usuário
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0000A0]">Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Insira os dados da pessoa que terá acesso ao Gerenciador Agilliza.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  id="name" 
                  placeholder="Ex: Lucca Santana" 
                  className="pl-10"
                  value={newUserData.full_name}
                  onChange={e => setNewUserData(prev => ({ ...prev, full_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="email@agilliza.net.br" 
                  className="pl-10"
                  value={newUserData.email}
                  onChange={e => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha Temporária</Label>
              <div className="relative">
                <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Mínimo 6 caracteres" 
                  className="pl-10"
                  value={newUserData.password}
                  onChange={e => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-[#0000A0] hover:bg-[#000080]" 
              disabled={createUserMutation.isPending || !newUserData.email || !newUserData.password}
              onClick={() => createUserMutation.mutate(newUserData)}
            >
              {createUserMutation.isPending ? "Criando..." : "Confirmar Criação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
