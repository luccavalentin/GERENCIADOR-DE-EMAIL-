import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  UserPlus, 
  UserCog, 
  Trash2, 
  Shield, 
  Mail, 
  Clock, 
  User,
  Users,
  Power
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  getProfiles, 
  toggleProfileStatus, 
  deleteProfile,
  createSystemUser 
} from "@/lib/email.functions";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";

export const Route = createFileRoute("/users")({
  component: () => (
    <AppLayout>
      <UsersPage />
    </AppLayout>
  ),
});

function UsersPage() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", full_name: "" });

  const { data: users, isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => getProfiles({}),
  });

  const toggleMutation = useMutation({
    mutationFn: (vars: { id: string, is_active: boolean }) => toggleProfileStatus({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success("Status atualizado");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProfile({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success("Usuário removido");
    }
  });

  const createMutation = useMutation({
    mutationFn: () => createSystemUser({ data: newUser }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setIsAddOpen(false);
      setNewUser({ email: "", password: "", full_name: "" });
      toast.success("Usuário criado com sucesso");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao criar usuário");
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0000A0]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Usuários do Sistema</h1>
          <p className="text-slate-500 mt-1">Administre as pessoas que possuem acesso operacional ao painel.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0000A0] hover:bg-[#000080] w-full sm:w-auto">
              <UserPlus className="mr-2 h-4 w-4" />
              + Novo usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input 
                  value={newUser.full_name}
                  onChange={e => setNewUser({...newUser, full_name: e.target.value})}
                  placeholder="Ex: João Silva" 
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input 
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  placeholder="joao@empresa.com" 
                />
              </div>
              <div className="space-y-2">
                <Label>Senha Temporária</Label>
                <Input 
                  type="password"
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Min. 6 caracteres" 
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
              <Button 
                onClick={() => {
                  if (!newUser.email || !newUser.password || !newUser.full_name) {
                    toast.error("Preencha todos os campos");
                    return;
                  }
                  createMutation.mutate();
                }} 
                className="bg-[#0000A0]"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Criando..." : "Criar Usuário"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="premium-card overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 hidden md:table-header-group">
              <TableRow>
                <TableHead className="pl-6 font-bold text-slate-700">Usuário</TableHead>
                <TableHead className="font-bold text-slate-700">E-mail</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="font-bold text-slate-700">Último acesso</TableHead>
                <TableHead className="font-bold text-slate-700">Criado em</TableHead>
                <TableHead className="text-right pr-6 font-bold text-slate-700">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((profile: any) => (
                <TableRow key={profile.id} className={cn("md:table-row flex flex-col p-4 md:p-0 border-b w-full", !profile.is_active && "bg-slate-50 opacity-80")}>
                  <TableCell className="pl-6 py-2 md:py-4 md:table-cell block">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0000A0] font-bold border border-blue-100 shrink-0 shadow-sm">
                        {profile.full_name ? profile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : <User className="h-5 w-5" />}
                      </div>
                      <div className="font-bold text-slate-900">{profile.full_name || "Sem nome"}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500 font-medium md:table-cell flex justify-between items-center py-2 md:py-4">
                    <span className="md:hidden font-bold text-slate-500 uppercase tracking-widest text-[9px]">E-mail</span>
                    {profile.email || "--"}
                  </TableCell>
                  <TableCell className="md:table-cell flex justify-between items-center py-2 md:py-4">
                    <span className="md:hidden font-bold text-slate-500 uppercase tracking-widest text-[9px]">Status</span>
                    <Badge className={cn(
                      profile.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                    )} variant="outline">
                      {profile.is_active ? "ATIVO" : "INATIVO"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-400 font-mono md:table-cell flex justify-between items-center py-2 md:py-4">
                    <span className="md:hidden font-bold text-slate-500 uppercase tracking-widest text-[9px]">Acesso</span>
                    {profile.last_sign_in_at ? format(new Date(profile.last_sign_in_at), "dd/MM HH:mm") : "--"}
                  </TableCell>
                  <TableCell className="text-sm text-slate-400 font-mono md:table-cell flex justify-between items-center py-2 md:py-4">
                    <span className="md:hidden font-bold text-slate-500 uppercase tracking-widest text-[9px]">Criado em</span>
                    {profile.created_at ? format(new Date(profile.created_at), "dd/MM/yyyy") : "--"}
                  </TableCell>
                  <TableCell className="text-right pr-6 md:table-cell flex justify-end items-center py-2 md:py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title={profile.is_active ? "Desativar" : "Ativar"}
                        onClick={() => toggleMutation.mutate({ id: profile.id, is_active: !profile.is_active })}
                      >
                        <Power className={cn("h-4 w-4", profile.is_active ? "text-slate-400" : "text-green-500")} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (confirm("Deseja realmente excluir este usuário?")) {
                            deleteMutation.mutate(profile.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {(!users || users.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-slate-400">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <Users className="h-8 w-8" />
                      <p className="text-xs font-bold uppercase tracking-widest">Nenhum usuário encontrado</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
