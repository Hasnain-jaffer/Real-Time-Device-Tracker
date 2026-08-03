// client/src/components/ui/Skeleton.jsx
export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="glass rounded-2xl shadow-soft p-6 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
    </div>
  );
}