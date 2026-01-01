import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Kanban,
  GitBranch,
  CheckSquare,
  DollarSign,
  UserCog,
  BarChart3,
  Settings,
  Building2,
  LogOut,
  LucideIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCRM } from '@/contexts/CRMContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  category?: string;
}

const navItems: NavItem[] = [
  // Visão Geral
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Visão Geral' },
  
  // Vendas
  { id: 'kanban', label: 'Pipeline de Vendas', icon: Kanban, category: 'Vendas' },
  { id: 'leads', label: 'Leads', icon: Users, category: 'Vendas' },
  { id: 'pipelines', label: 'Funis', icon: GitBranch, category: 'Vendas' },
  
  // Operações
  { id: 'tasks', label: 'Tarefas', icon: CheckSquare, category: 'Operações' },
  { id: 'financial', label: 'Financeiro', icon: DollarSign, category: 'Operações' },
  { id: 'reports', label: 'Relatórios', icon: BarChart3, category: 'Operações' },
  
  // Gestão
  { id: 'collaborators', label: 'Colaboradores', icon: Users, category: 'Gestão', adminOnly: true },
  { id: 'users', label: 'Usuários', icon: UserCog, category: 'Gestão', adminOnly: true },
  { id: 'company', label: 'Minha Empresa', icon: Building2, category: 'Gestão' },
  { id: 'settings', label: 'Configurações', icon: Settings, category: 'Gestão', adminOnly: true },
];

interface CRMSidebarNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function CRMSidebarNav({
  activeTab,
  onTabChange,
  onLogout,
  isCollapsed,
  onToggleCollapse,
}: CRMSidebarNavProps) {
  const { crmUser, crmTenant, isAdmin } = useCRM();

  const filteredItems = navItems.filter((item) => !item.adminOnly || isAdmin);
  
  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    const category = item.category || 'Outros';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gestor';
      default: return 'Colaborador';
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "hidden lg:flex border-r border-border/50 bg-slate-50 dark:bg-slate-900/50 fixed left-0 top-0 bottom-0 z-40 flex-col transition-all duration-300 shadow-sm",
        isCollapsed ? "w-[68px]" : "w-64"
      )}>
        {/* Header */}
        <div className={cn(
          "h-16 px-4 border-b border-border/50 flex items-center shrink-0",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          <div className={cn("flex items-center gap-3 min-w-0", isCollapsed && "justify-center")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="font-bold text-sm text-foreground truncate">
                  {crmTenant?.name || 'CRM'}
                </p>
                <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">
                  Gestão de Vendas
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onToggleCollapse}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Collapsed toggle */}
        {isCollapsed && (
          <div className="p-2 border-b border-border/50">
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-8"
              onClick={onToggleCollapse}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="mb-5">
              {!isCollapsed && (
                <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  {category}
                </p>
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = activeTab === item.id;
                  const buttonContent = (
                    <Button
                      key={item.id}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'w-full h-10 text-sm font-normal transition-all',
                        isCollapsed ? 'justify-center px-0' : 'justify-start gap-3 px-3',
                        isActive && 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium shadow-sm border border-indigo-500/20',
                        !isActive && 'text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                      onClick={() => onTabChange(item.id)}
                    >
                      <item.icon className={cn(
                        "shrink-0 transition-colors",
                        isCollapsed ? "w-5 h-5" : "w-4 h-4",
                        isActive && "text-indigo-600 dark:text-indigo-400"
                      )} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Button>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return buttonContent;
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border/50 p-3 shrink-0 space-y-3 bg-slate-100/50 dark:bg-slate-800/50">
          {!isCollapsed && (
            <div className="px-2">
              <p className="font-semibold text-sm truncate">{crmUser?.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {getRoleName(crmUser?.role || 'collaborator')}
              </p>
            </div>
          )}
          
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="w-full h-9 text-muted-foreground hover:text-red-500"
                  onClick={onLogout}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Sair</TooltipContent>
            </Tooltip>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full h-9 justify-start gap-3 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" 
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sair</span>
            </Button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
