import { Skeleton } from '../ui/Skeleton';
import { Card } from '../ui/Card';

export function AnalyticsSkeleton() {
  return (
    <div className="w-full max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
      {/* Controls Bar Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-line">
        <Skeleton className="h-11 w-72 rounded-btn" />
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-11 w-32 rounded-btn" />
          <Skeleton className="h-11 w-28 rounded-btn" />
        </div>
      </div>

      {/* Summary Metrics Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-28" />
          </Card>
        ))}
      </div>

      {/* Top Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-64 w-full rounded-btn" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
        <Card className="p-5 space-y-4">
          <Skeleton className="h-5 w-44" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <Skeleton className="h-56 w-56 rounded-full mx-auto" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((k) => (
                <div key={k} className="space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
          <Skeleton className="h-4 w-3/4" />
        </Card>
      </div>

      {/* Mid Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-64 w-full rounded-btn" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
        <Card className="p-5 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-12 w-28" />
          <div className="space-y-3 pt-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <Skeleton className="h-4 w-full" />
        </Card>
      </div>

      {/* Bottom Chart Skeleton */}
      <Card className="p-5 space-y-4">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-64 w-full rounded-btn" />
        <Skeleton className="h-4 w-2/3" />
      </Card>
    </div>
  );
}
