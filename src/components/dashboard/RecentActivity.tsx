import { Link } from "@tanstack/react-router";
import { History, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LogEntry } from "@/lib/types";

interface RecentActivityProps {
  logs: LogEntry[] | undefined;
}

export function RecentActivity({ logs }: RecentActivityProps) {
  return (
    <Card className="premium-card overflow-hidden">
      <CardHeader className="p-4 md:p-6 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
        <div>
          <CardTitle className="text-lg font-bold text-slate-900">Atividade Recente</CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">Timeline operacional de eventos processados.</p>
        </div>
        <Button variant="outline" size="sm" className="text-[#0000A0] border-[#0000A0]/20 font-bold hover:bg-blue-50" asChild>
          <Link 
            to="/logs" 
            search={{}}
            className="flex items-center gap-2"
          >
            Ver Histórico Completo
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/50 hidden md:table-header-group">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="w-[120px] font-bold text-slate-500 pl-6">Horário</TableHead>
              <TableHead className="font-bold text-slate-500">Evento / Descrição</TableHead>
              <TableHead className="w-[120px] text-right font-bold text-slate-500 pr-6">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs?.length ? logs.map((log) => (
              <TableRow key={log.id} className="group hover:bg-slate-50/50 transition-colors border-slate-100 md:table-row flex flex-col p-4 md:p-0">
                <TableCell className="text-xs text-slate-400 font-mono pl-6 md:table-cell flex justify-between items-center w-full md:w-[120px]">
                  <span className="md:hidden font-bold text-slate-500 uppercase tracking-widest text-[10px]">Horário</span>
                  {log.created_at ? format(new Date(log.created_at), "HH:mm:ss") : "--:--:--"}
                </TableCell>
                <TableCell className="py-2 md:py-4 md:table-cell block">
                  <div className="text-sm font-semibold text-slate-900 leading-none mb-1">
                    {log.message.split(' - ')[0] || "Processamento"}
                  </div>
                  <div className="text-xs text-slate-500 truncate max-w-[600px]">
                    {log.message.includes(' - ') ? log.message.split(' - ').slice(1).join(' - ') : log.message}
                  </div>
                </TableCell>
                <TableCell className="text-right pr-6 md:table-cell flex justify-between items-center w-full md:w-[120px]">
                  <span className="md:hidden font-bold text-slate-500 uppercase tracking-widest text-[10px]">Status</span>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 uppercase tracking-tighter rounded-md border-none",
                      log.level === 'error' ? "bg-red-50 text-red-600" : 
                      log.level === 'success' ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                    )}
                  >
                    {log.level || 'info'}
                  </Badge>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-20 text-slate-400">
                  <div className="flex flex-col items-center gap-2 opacity-50">
                    <History className="h-8 w-8" />
                    <p className="text-xs font-bold uppercase tracking-widest">Aguardando dados...</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
