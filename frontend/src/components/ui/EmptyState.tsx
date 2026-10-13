import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 mb-1">{title}</h3>
      {description && <p className="text-xs text-zinc-500 max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  );
}
