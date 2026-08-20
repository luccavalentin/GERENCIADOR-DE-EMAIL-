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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestão de Usuários</h1>
          <p className="text-slate-500 mt-1">Administre quem tem acesso ao painel Agilliza.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0000A0] hover:bg-[#000080]">
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
              <Button 
                onClick={() => createMutation.mutate()} 
                className="bg-[#0000A0]"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Criando..." : "Criar Usuário"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="pl-6">Usuário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((profile: any) => (
                <TableRow key={profile.id}>
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-[#0000A0]">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{profile.full_name || "Sem nome"}</div>
                        <div className="text-xs text-slate-500">{profile.email || "--"}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      profile.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                    )} variant="outline">
                      {profile.is_active ? "ATIVO" : "INATIVO"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {profile.created_at ? format(new Date(profile.created_at), "dd/MM/yyyy") : "--"}
                  </TableCell>
                  <TableCell className="text-right pr-6">
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
                  <TableCell colSpan={4} className="text-center py-12 text-slate-400 italic">
                    Nenhum usuário encontrado.
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
