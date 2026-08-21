import { 
  LayoutDashboard, 
  Mail, 
  Activity, 
  History, 
  Users, 
  Server, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SidebarItem } from "./SidebarItem";
import { useLocation } from "@tanstack/react-router";

export const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/" },
  { label: "Contas de E-mail", icon: Mail, to: "/accounts" },
  { label: "Monitoramento", icon: Activity, to: "/monitoring" },
  { label: "Logs", icon: History, to: "/logs" },
  { label: "Usuários", icon: Users, to: "/users" },
  { label: "Servidor", icon: Server, to: "/server" },
  { label: "Configurações", icon: Settings, to: "/settings" },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onSignOut: () => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed, onSignOut }: SidebarProps) {
  const location = useLocation();

  const handleItemClick = () => {
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }
  };

  return (
    <aside 
      className={cn(
        "border-r border-white/5 bg-[#000033] flex flex-col fixed inset-y-0 shadow-2xl z-50 transition-all duration-300 ease-in-out",
        isCollapsed ? "-translate-x-full md:w-20 md:translate-x-0" : "w-64 translate-x-0"
      )}
    >
      <div className={cn(
        "p-8 mb-4 flex items-center justify-center border-b border-white/5 bg-white/[0.02] relative",
        isCollapsed && "p-4"
      )}>
        {!isCollapsed ? (
          <img src="/logo-agilliza.png" alt="Agilliza" className="h-10 object-contain transition-all" />
        ) : (
          <img src="/logo-agilliza.png" alt="A" className="h-8 w-8 object-contain" />
        )}
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-10 h-6 w-6 rounded-full bg-[#0000A0] text-white hidden md:flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition-transform z-50"
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <SidebarItem
            key={item.to}
            {...item}
            isActive={location.pathname === item.to || (item.to === '/logs' && location.pathname.startsWith('/logs/'))}
            isCollapsed={isCollapsed}
            onClick={handleItemClick}
          />
        ))}
      </nav>

      <div className="p-6 border-t border-white/10">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full text-blue-100/70 hover:text-white hover:bg-white/5 font-medium",
            isCollapsed ? "justify-center px-0" : "justify-start"
          )}
          onClick={onSignOut}
          title={isCollapsed ? "Sair da conta" : undefined}
        >
          <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span>Sair da conta</span>}
        </Button>
      </div>
    </aside>
  );
}
