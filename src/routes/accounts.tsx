import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getActiveConfigs } from "@/lib/email.functions";
import { 
  Plus, 
  Search,
  MoreVertical,
  Clock,
  ExternalLink,
  History,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppLayout } from "@/components/layout/AppLayout";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/accounts")({
  component: () => (
    <AppLayout>
      <AccountsPage />
    </AppLayout>
  ),
});

function AccountsPage() {
  const navigate = useNavigate();
  const { data: configs, isLoading } = useQuery({
    queryKey: ["activeConfigs"],
    queryFn: () => getActiveConfigs(),
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contas de E-mail</h1>
          <p className="text-slate-500 mt-1">Gerencie as caixas de entrada monitoradas e suas regras.</p>
        </div>
        <Button className="bg-[#0000A0] hover:bg-[#000080] shadow-md font-bold">
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b bg-slate-50/50 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Buscar conta..." className="pl-9 bg-white" />
          </div>
        </div>
        
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold">E-mail</TableHead>
              <TableHead className="font-bold">Servidor IMAP</TableHead>
              <TableHead className="font-bold text-center">Status</TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs?.map((config: any) => (
              <TableRow key={config.id} className="group hover:bg-slate-50/50 transition-colors">
                <TableCell className="font-semibold text-slate-900">{config.email_user}</TableCell>
                <TableCell className="text-slate-500">{config.imap_host}:{config.imap_port}</TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Online</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400"
                      onClick={() => navigate({ to: `/logs/${config.id}` })}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem className="cursor-pointer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Editar Configuração
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover Conta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {configs?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-slate-400">
                  Nenhuma conta configurada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
