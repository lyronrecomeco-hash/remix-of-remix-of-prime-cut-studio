import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CRMPageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export default function CRMPageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: CRMPageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4", className)}>
      <div className="min-w-0">
        <h1 className="text-lg font-semibold flex items-center gap-2 truncate">
          {Icon && <Icon className="w-5 h-5 text-primary shrink-0" />}
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
