import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getLogs } from "@/lib/email.functions";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Filter, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/logs/$configId")({
  component: () => (
    <AppLayout>
      <LogsPage />
    </AppLayout>
  ),
});

function LogsPage() {
  const { configId } = Route.useParams();
  
  const { data: logs, isLoading } = useQuery({
    queryKey: ["logs", configId],
    queryFn: () => getLogs({ data: { configId } }),
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
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <History className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Histórico de Atividades</h1>
            <p className="text-slate-500 mt-1">Logs detalhados de processamento para a conta selecionada.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="font-semibold">
            <Filter className="mr-2 h-4 w-4" /> Filtros
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b bg-slate-50/50 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Buscar no log..." className="pl-9 bg-white" />
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Data/Hora</TableHead>
              <TableHead className="font-bold">Nível</TableHead>
              <TableHead className="font-bold">Mensagem</TableHead>
              <TableHead className="font-bold">Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs?.map((log: any) => (
              <TableRow key={log.id} className="hover:bg-slate-50/50">
                <TableCell className="text-slate-500 text-xs whitespace-nowrap">
                  {format(new Date(log.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={
                      log.level === 'error' ? "text-red-600 border-red-200 bg-red-50" : 
                      log.level === 'warn' ? "text-amber-600 border-amber-200 bg-amber-50" :
                      "text-blue-600 border-blue-200 bg-blue-50"
                    }
                  >
                    {log.level.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-md font-medium text-slate-900 truncate">
                  {log.message}
                </TableCell>
                <TableCell className="text-slate-400 text-xs italic truncate">
                  {JSON.stringify(log.details || {})}
                </TableCell>
              </TableRow>
            ))}
            {logs?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-slate-400">
                  Nenhum log encontrado para esta conta.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
