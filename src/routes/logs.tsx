import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { History, Trash2, Search, Filter, Eye, ChevronLeft, ChevronRight } from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";
import { getLogs } from "@/lib/email.functions";
import { format } from "date-fns";

export const Route = createFileRoute("/logs")({
  component: LogsIndexPage,
});

function LogsIndexPage() {
  const [level, setLevel] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 50;
  
  const { data: logsData, isLoading } = useQuery({
    queryKey: ["allLogs", level, search, page],
    queryFn: () => getLogs({ 
      data: { 
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

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Central de Auditoria</h1>
            <p className="text-slate-500 mt-1">Logs de todas as operações do sistema.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b bg-slate-50 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar em logs globais..." 
                className="pl-9 bg-white" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Nível de log" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="info">INFO</SelectItem>
                <SelectItem value="success">SUCCESS</SelectItem>
                <SelectItem value="warning">WARNING</SelectItem>
                <SelectItem value="error">ERROR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-6 py-3 text-left">Horário</th>
                  <th className="px-6 py-3 text-left">Nível</th>
                  <th className="px-6 py-3 text-left">Evento</th>
                  <th className="px-6 py-3 text-left">Execução</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400">Carregando auditoria...</td>
                  </tr>
                ) : logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 group">
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs whitespace-nowrap">
                      {format(new Date(log.created_at), "dd/MM HH:mm:ss")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                        log.level === 'error' ? "bg-red-50 text-red-600" :
                        log.level === 'success' ? "bg-green-50 text-green-600" :
                        "bg-blue-50 text-blue-600"
                      )}>{log.level}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 text-xs">{log.message}</td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-[10px]">
                      {log.details?.executionId ? (
                        <span className="opacity-50 group-hover:opacity-100 transition-opacity">
                          {log.details.executionId.substring(0,4)}...{log.details.executionId.substring(log.details.executionId.length - 4)}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                         <a href={`/logs/${log.config_id || ''}`} title="Ver Detalhes">
                            <Eye className="h-3 w-3 text-slate-400" />
                         </a>
                       </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </AppLayout>
  );
}
