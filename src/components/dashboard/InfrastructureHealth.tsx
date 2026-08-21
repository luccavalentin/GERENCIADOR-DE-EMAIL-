import { Activity, Mail, Shield, Database, Server } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfrastructureHealthProps {
  isWorkerOnline: boolean;
  isDbOnline: boolean;
  imapStatus: string;
  smtpStatus: string;
}

export function InfrastructureHealth({ 
  isWorkerOnline, 
  isDbOnline, 
  imapStatus, 
  smtpStatus 
}: InfrastructureHealthProps) {
  const items = [
    { label: "Worker", status: isWorkerOnline ? 'operacional' : 'falha', icon: Activity },
    { label: "IMAP", status: imapStatus, icon: Mail },
    { label: "SMTP", status: smtpStatus, icon: Shield },
    { label: "Banco de Dados", status: isDbOnline ? 'operacional' : 'falha', icon: Database },
  ];

  return (
    <section className="space-y-4">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] px-1">Saúde da Infraestrutura</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        {items.map((item, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 group hover:border-[#0000a2] transition-all">
            <div className={cn(
              "p-2 rounded-lg",
              item.status === 'operacional' ? "bg-green-50 text-green-600" : 
              item.status === 'falha' ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-400"
            )}>
              <item.icon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</div>
              <div className={cn(
                "text-[10px] md:text-xs font-bold capitalize",
                item.status === 'operacional' ? "text-slate-900" : 
                item.status === 'falha' ? "text-red-600" : "text-slate-400"
              )}>
                {item.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
