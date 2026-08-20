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
import { Search, Filter, History, Trash2, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";


export const Route = createFileRoute("/logs/$configId")({
  component: () => (
    <AppLayout>
      <LogsPage />
    </AppLayout>
  ),
});

function LogsPage() {
  const { configId } = Route.useParams();
  const [page, setPage] = useState(0);
  const [level, setLevel] = useState<string>("all");
  const [search, setSearch] = useState("");
  const limit = 20;
  
  const { data: logsData, isLoading } = useQuery({
    queryKey: ["logs", configId, page, level, search],
    queryFn: () => getLogs({ 
      data: { 
        configId, 
        limit, 
        offset: page * limit,
        level: level === "all" ? undefined : level as any,
        search
      } 
    }),
  });

  const logs = logsData?.logs || [];
  const totalCount = logsData?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  if (isLoading && page === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0000A0]"></div>
      </div>
    );
  }

  const [hiddenLogs, setHiddenLogs] = useState<Set<string>>(new Set());

  const handleClearView = () => {
    if (logs.length > 0) {
      const newHidden = new Set(hiddenLogs);
      logs.forEach((log: any) => newHidden.add(log.id));
      setHiddenLogs(newHidden);
      toast.info("Visualização limpa. Os logs novos aparecerão normalmente.");
    }
  };

  const visibleLogs = logs.filter((log: any) => !hiddenLogs.has(log.id));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link to="/logs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="p-2 bg-slate-100 rounded-lg">
            <History className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Histórico de Atividades</h1>
            <p className="text-slate-500 mt-1">Visualização detalhada da conta e logs de processamento.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={handleClearView}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Limpar Visualização
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar no log..." 
              className="pl-9 bg-white" 
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <div className="flex gap-2">
            <Select value={level} onValueChange={(val) => {
              setLevel(val);
              setPage(0);
            }}>
              <SelectTrigger className="w-[150px] bg-white">
                <SelectValue placeholder="Nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="info">Informação</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="warning">Atenção</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-700 w-[120px]">Data/Hora</TableHead>
                <TableHead className="font-bold text-slate-700 w-[100px]">Nível</TableHead>
                <TableHead className="font-bold text-slate-700">Mensagem</TableHead>
                <TableHead className="font-bold text-slate-700 w-[180px]">Execução</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleLogs.map((log: any) => (
                <TableRow key={log.id} className="hover:bg-slate-50/50 group transition-colors">
                  <TableCell className="text-slate-500 text-[10px] font-mono whitespace-nowrap pl-6">
                    {format(new Date(log.created_at), "dd/MM HH:mm:ss")}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[9px] font-bold px-1.5 py-0 border-none shadow-none uppercase tracking-wider",
                        log.level === 'error' ? "text-red-600 bg-red-50" : 
                        log.level === 'success' ? "text-green-600 bg-green-50" :
                        log.level === 'warning' ? "text-yellow-600 bg-yellow-50" :
                        "text-[#0000A0] bg-blue-50"
                      )}
                    >
                      {log.level || 'INFO'}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn(
                    "font-medium text-xs",
                    log.level === 'error' ? "text-red-700" : 
                    log.level === 'success' ? "text-green-700" : "text-slate-700"
                  )}>
                    {log.message}
                  </TableCell>
                  <TableCell className="text-slate-400 text-[10px] font-mono pr-6">
                    {log.details?.executionId ? (
                      <div className="flex items-center gap-1 group/id">
                        <span className="cursor-help border-b border-dotted border-slate-200" title={log.details.executionId}>
                          {log.details.executionId.substring(0, 4)}...{log.details.executionId.substring(log.details.executionId.length - 4)}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-4 w-4 opacity-0 group-hover/id:opacity-100 transition-opacity"
                          title="Copiar ID"
                          onClick={() => {
                            navigator.clipboard.writeText(log.details.executionId);
                            toast.success("ID copiado");
                          }}
                        >
                          <Search className="h-2 w-2" />
                        </Button>
                      </div>
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {visibleLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <History className="h-8 w-8 opacity-20" />
                      <p>Nenhum log encontrado para estes filtros.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Mostrando {page * limit + 1} a {Math.min((page + 1) * limit, totalCount)} de {totalCount} logs
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Próxima <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
