import { Mail, TrendingUp, XCircle, Copy, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { SystemStats } from "@/lib/types";

interface StatCardsProps {
  stats: SystemStats | undefined;
}

export function StatCards({ stats }: StatCardsProps) {
  const statItems = [
    { 
      label: "Processados hoje", 
      value: stats ? stats.found : "—", 
      icon: Mail, 
      color: "text-blue-600", 
      bg: "bg-blue-50/50" 
    },
    { 
      label: "Encaminhados", 
      value: stats ? stats.forwarded : "—", 
      icon: TrendingUp, 
      color: "text-green-600", 
      bg: "bg-green-50/50" 
    },
    { 
      label: "Ignorados", 
      value: stats ? stats.ignored : "—", 
      icon: XCircle, 
      color: "text-slate-400", 
      bg: "bg-slate-50/50" 
    },
    { 
      label: "Duplicados", 
      value: stats ? stats.duplicates : "—", 
      icon: Copy, 
      color: "text-amber-600", 
      bg: "bg-amber-50/50" 
    },
    { 
      label: "Erros", 
      value: stats ? stats.errors : "—", 
      icon: AlertCircle, 
      color: "text-red-600", 
      bg: "bg-red-50/50" 
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
      {statItems.map((stat, i) => (
        <Card key={i} className="premium-card group">
          <CardContent className="p-4 md:p-6">
            <div className={cn("p-3 w-fit rounded-xl mb-4 transition-transform group-hover:scale-110", stat.bg, stat.color)}>
              <stat.icon className="h-6 w-6" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mt-2 tracking-tight">
              {stat.value === "—" ? <span className="text-slate-200">—</span> : stat.value}
            </h3>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
