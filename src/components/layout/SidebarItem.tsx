import { Link } from "@tanstack/react-router";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  label: string;
  icon: LucideIcon;
  to: string;
  isActive: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}

export function SidebarItem({ 
  label, 
  icon: Icon, 
  to, 
  isActive, 
  isCollapsed, 
  onClick 
}: SidebarItemProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg text-[13px] font-bold uppercase tracking-wider transition-all duration-200",
        isCollapsed && "justify-center px-0",
        isActive
          ? "bg-white/10 text-white shadow-sm ring-1 ring-white/20"
          : "text-blue-100/60 hover:bg-white/5 hover:text-white"
      )}
      title={isCollapsed ? label : undefined}
    >
      <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-blue-100/50")} />
      {!isCollapsed && <span>{label}</span>}
    </Link>
  );
}
