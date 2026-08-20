import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getActiveConfigs, deleteProfile } from "@/lib/email.functions";
import { 
  Plus, 
  Search,
  MoreVertical,
  History,
  Trash2,
  Mail,
  Shield,
  ExternalLink,
  ShieldCheck,
  ShieldAlert
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
import { AccountDialog } from "@/components/accounts/AccountDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/accounts")({
  component: () => (
    <AppLayout>
      <AccountsPage />
    </AppLayout>
  ),
});

function AccountsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingConfig, setEditingConfig] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");

  const { data: configs, isLoading } = useQuery({
    queryKey: ["activeConfigs"],
    queryFn: () => getActiveConfigs(),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // We don't have a specific deleteConfig server function, but we can use supabase directly
      // Or if there's one in email.functions we should use it. 
      // Let's use supabase directly since we are in the client.
      const { error } = await supabase.from("email_configurations").delete().eq("id", id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeConfigs"] });
      toast.success("Conta removida com sucesso");
    },
    onError: (error: any) => toast.error(`Erro ao remover: ${error.message}`),
  });

  const filteredConfigs = React.useMemo(() => {
    if (!configs) return [];
    return configs.filter((c: any) => 
      c.email_user.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [configs, searchTerm]);

  const handleEdit = (config: any) => {
    setEditingConfig(config);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingConfig(null);
    setIsDialogOpen(true);
  };

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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contas de E-mail Monitoradas</h1>
          <p className="text-slate-500 mt-1">Gestão de caixas de entrada e fluxo de encaminhamento.</p>
        </div>
        <Button 
          onClick={handleCreate}
          className="bg-[#0000A0] hover:bg-[#000080] shadow-md font-bold"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b bg-slate-50/50 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por e-mail..." 
              className="pl-9 bg-white" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold text-slate-700">E-mail de Saída</TableHead>
              <TableHead className="font-bold text-slate-700">Configuração</TableHead>
              <TableHead className="font-bold text-slate-700 text-center">Keywords</TableHead>
              <TableHead className="font-bold text-slate-700 text-center">Status</TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredConfigs.map((config: any) => (
              <TableRow key={config.id} className="group hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Mail className="h-4 w-4 text-[#0000A0]" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{config.email_user}</div>
                      <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
                        {config.destinations?.length || 0} Destinatários
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <ShieldCheck className="h-3 w-3 text-green-500" />
                      IMAP: {config.imap_host}:{config.imap_port}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <ExternalLink className="h-3 w-3 text-blue-500" />
                      SMTP: {config.smtp_host}:{config.smtp_port}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center flex-wrap gap-1 max-w-[200px] mx-auto">
                    {config.keywords?.slice(0, 2).map((kw: string) => (
                      <Badge key={kw} variant="outline" className="text-[10px] font-bold px-1.5 py-0 border-slate-200">
                        {kw}
                      </Badge>
                    ))}
                    {(config.keywords?.length > 2) && (
                      <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 border-slate-200 bg-slate-50">
                        +{config.keywords.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 shadow-none border-none font-bold text-[10px] uppercase">
                    Ativo
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-[#0000A0]"
                      onClick={() => navigate({ to: `/logs/${config.id}` })}
                      title="Ver Logs"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#0000A0]">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-2 shadow-lg border-slate-200">
                        <DropdownMenuItem 
                          className="cursor-pointer py-2 rounded-md transition-colors"
                          onClick={() => handleEdit(config)}
                        >
                          <Shield className="mr-2 h-4 w-4 text-slate-500" />
                          Editar Configuração
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer text-destructive focus:text-destructive py-2 rounded-md transition-colors"
                          onClick={() => {
                            if (confirm(`Remover permanentemente o monitoramento de ${config.email_user}?`)) {
                              deleteMutation.mutate(config.id);
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir Conta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredConfigs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Mail className="h-8 w-8 opacity-20" />
                    <p>Nenhuma conta encontrada.</p>
                    <Button variant="link" onClick={handleCreate} className="text-[#0000A0] font-bold">
                      Cadastrar primeira conta
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AccountDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        config={editingConfig}
      />
    </div>
  );
}
