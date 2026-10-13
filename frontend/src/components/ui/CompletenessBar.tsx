import { cn } from '../../lib/utils';

interface CompletenessBarProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function CompletenessBar({ score, showLabel = true, size = 'md', className }: CompletenessBarProps) {
  const color = score >= 80 ? '#059669' : score >= 50 ? '#d97706' : '#dc2626';
  const h = size === 'sm' ? 'h-1' : 'h-1.5';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 rounded-full overflow-hidden', h)} style={{ background: '#f1f5f9' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold tabular-nums w-8 text-right" style={{ color }}>
          {score}%
        </span>
      )}
    </div>
  );
}
