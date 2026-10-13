import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'draft' | 'review' | 'ready' | 'published' | 'critical' | 'high' | 'medium' | 'low' | 'success' | 'info';
  className?: string;
}

const variants: Record<string, string> = {
  default:   'badge-draft',
  draft:     'badge-draft',
  review:    'badge-review',
  ready:     'badge-ready',
  published: 'badge-published',
  critical:  'bg-red-500/10 text-red-400 border border-red-500/20',
  high:      'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  medium:    'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  low:       'badge-draft',
  success:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  info:      'bg-violet-500/10 text-violet-400 border border-violet-500/20',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('badge', variants[variant], className)}>
      {children}
    </span>
  );
}
