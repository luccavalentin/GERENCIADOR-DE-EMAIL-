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
  Trash2
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

export const Route = createFileRoute("/users")({
  component: () => (
    <AppLayout>
      <UsersPage />
    </AppLayout>
  ),
});

function UsersPage() {
  const queryClient = useQueryClient();
  
  const { data: profiles, isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: () => getProfiles(),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (data: { id: string; is_active: boolean }) => toggleProfileStatus({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Status do usuário atualizado");
    },
    onError: () => toast.error("Falha ao atualizar status"),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (data: { id: string }) => deleteProfile({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Usuário removido com sucesso");
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Usuários do Sistema</h1>
          <p className="text-slate-500 mt-1">Gerencie quem tem acesso ao painel Agilliza</p>
        </div>
        <Button className="bg-[#0000A0] hover:bg-[#000080] shadow-md font-bold">
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold text-slate-700">Nome</TableHead>
              <TableHead className="font-bold text-slate-700">E-mail</TableHead>
              <TableHead className="font-bold text-slate-700 text-center">Status</TableHead>
              <TableHead className="font-bold text-slate-700">Criação</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles?.map((profile: any) => (
              <TableRow key={profile.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <div className="font-semibold text-slate-900">{profile.full_name || "N/A"}</div>
                </TableCell>
                <TableCell className="text-slate-600">{profile.email}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-3">
                    <Badge variant={profile.is_active ? "default" : "secondary"} className={profile.is_active ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>
                      {profile.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Switch 
                      checked={profile.is_active} 
                      onCheckedChange={(checked) => toggleStatusMutation.mutate({ id: profile.id, is_active: checked })}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {format(new Date(profile.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem className="cursor-pointer">
                        <Key className="mr-2 h-4 w-4" />
                        Redefinir Acesso
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir este usuário?")) {
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
  );
}
