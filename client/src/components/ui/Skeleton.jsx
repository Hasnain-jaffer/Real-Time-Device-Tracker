// client/src/components/ui/Skeleton.jsx
import { useTheme } from '../../app/ThemeContext';

export function Skeleton({ className = '' }) {
  const { theme } = useTheme();
  // Uses border color for subtle contrast against surface/page
  const bgColor = theme === 'dark' ? '#263531' : '#E1D9C8';

  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ backgroundColor: bgColor }}
    />
  );
}

export function SkeletonCard() {
  const { theme } = useTheme();
  const tokens =
    theme === 'dark'
      ? { '--bg-surface': '#182220', '--border': '#263531' }
      : { '--bg-surface': '#FFFFFF', '--border': '#E1D9C8' };

  const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

  return (
    <div
      className="rounded-2xl p-6 space-y-3"
      style={{
        ...tokens,
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: cardShadow,
      }}
    >
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
    </div>
  );
}