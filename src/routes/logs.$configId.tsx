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
import { cn } from "@/lib/utils";
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          <Button variant="outline" size="sm" className="font-bold border-slate-200 text-slate-600">
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
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Data/Hora</TableHead>
                <TableHead className="font-bold text-slate-700">Nível</TableHead>
                <TableHead className="font-bold text-slate-700">Mensagem</TableHead>
                <TableHead className="font-bold text-slate-700">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.logs?.map((log: any) => (
                <TableRow key={log.id} className="hover:bg-slate-50/50 group transition-colors">
                  <TableCell className="text-slate-500 text-[10px] font-mono whitespace-nowrap">
                    [{format(new Date(log.created_at), "HH:mm:ss")}]
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] font-bold px-1.5 py-0 border-none shadow-none",
                        log.level === 'error' ? "text-red-600 bg-red-50" : 
                        log.level === 'success' ? "text-green-600 bg-green-50" :
                        "text-[#0000A0] bg-blue-50"
                      )}
                    >
                      {log.level.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn(
                    "max-w-md font-medium text-xs",
                    log.level === 'error' ? "text-red-700" : 
                    log.level === 'success' ? "text-green-700" : "text-slate-700"
                  )}>
                    {log.message}
                  </TableCell>
                  <TableCell className="text-slate-400 text-[10px] font-mono italic">
                    {log.details?.executionId ? `ID: ${log.details.executionId.substring(0, 8)}...` : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {logs?.logs?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <History className="h-8 w-8 opacity-20" />
                      <p>Nenhum log encontrado para esta conta.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
