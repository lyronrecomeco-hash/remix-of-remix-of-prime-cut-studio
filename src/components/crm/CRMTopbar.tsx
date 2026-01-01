import React from 'react';
import {
  Search,
  Bell,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCRM } from '@/contexts/CRMContext';
import CRMProfileMenu from './CRMProfileMenu';
import { cn } from '@/lib/utils';

interface CRMTopbarProps {
  activeLabel: string;
  onSearchOpen: () => void;
  onProfileNavigate: (tab: string) => void;
  onLogout: () => void;
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
  isCollapsed?: boolean;
}

export default function CRMTopbar({
  activeLabel,
  onSearchOpen,
  onProfileNavigate,
  onLogout,
  onMobileMenuToggle,
  isMobileMenuOpen,
  isCollapsed = false,
}: CRMTopbarProps) {
  const { crmTenant } = useCRM();

  return (
    <>
      {/* Desktop Topbar */}
      <header className={cn(
        "hidden lg:flex h-14 border-b border-border/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md items-center justify-between px-6 sticky top-0 z-30 transition-all",
        isCollapsed ? "ml-[68px]" : "ml-64"
      )}>
        <div className="flex items-center gap-4 min-w-0">
          <h1 className="text-lg font-bold text-foreground">{activeLabel}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar - Always visible */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads, tarefas..."
              className="pl-9 h-9 w-64 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-indigo-500"
              onClick={onSearchOpen}
              readOnly
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 h-5 items-center gap-0.5 rounded border bg-slate-100 dark:bg-slate-700 px-1.5 font-mono text-[10px] font-medium text-muted-foreground hidden sm:inline-flex">
              ⌘K
            </kbd>
          </div>
          
          <Button variant="ghost" size="icon" className="h-9 w-9 relative hover:bg-slate-100 dark:hover:bg-slate-800">
            <Bell className="w-4 h-4" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[9px] flex items-center justify-center bg-indigo-500">
              3
            </Badge>
          </Button>
          
          <CRMProfileMenu onNavigate={onProfileNavigate} onLogout={onLogout} />
        </div>
      </header>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-border/50 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={onMobileMenuToggle}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{activeLabel}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={onSearchOpen}
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 relative">
            <Bell className="w-4 h-4" />
            <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 text-[9px] flex items-center justify-center bg-indigo-500">
              3
            </Badge>
          </Button>
          <CRMProfileMenu onNavigate={onProfileNavigate} onLogout={onLogout} />
        </div>
      </div>
    </>
  );
}
