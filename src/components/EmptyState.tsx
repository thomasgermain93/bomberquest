import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'gold' | 'secondary';
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  const btnClass = action?.variant === 'gold'
    ? 'pixel-btn pixel-btn-gold font-pixel text-[7px]'
    : action?.variant === 'secondary'
    ? 'pixel-btn pixel-btn-secondary font-pixel text-[7px]'
    : 'pixel-btn font-pixel text-[7px]';

  return (
    <div className={cn('pixel-border bg-card p-8 text-center flex flex-col items-center gap-3', className)}>
      <div className="w-12 h-12 bg-muted flex items-center justify-center">
        <Icon size={24} className="text-muted-foreground" />
      </div>
      <p className="font-pixel text-[10px] text-foreground">{title}</p>
      {description && (
        <p className="font-pixel text-[8px] text-muted-foreground max-w-[200px]">{description}</p>
      )}
      {action && (
        <button className={btnClass} onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
