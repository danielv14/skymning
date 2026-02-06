import { AppHeader } from '../ui/AppHeader'
import { Card } from '../ui/Card'

const Pulse = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-slate-700/40 ${className}`} />
)

export const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen">
      <AppHeader>
        <div className="flex items-center justify-between">
          <div>
            <Pulse className="h-8 w-36 mb-2" />
            <Pulse className="h-5 w-28" />
          </div>
          <div className="flex gap-3">
            <Pulse className="h-10 w-10 rounded-full" />
            <Pulse className="h-10 w-10 rounded-full" />
          </div>
        </div>
      </AppHeader>

      <main className="max-w-2xl mx-auto p-4 sm:p-8 space-y-4 sm:space-y-5">
        {/* TodayEntryCard skeleton */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Pulse className="h-3 w-12" />
                <Pulse className="h-7 w-48" />
              </div>
              <Pulse className="h-14 w-14 rounded-2xl" />
            </div>
            <Pulse className="h-5 w-full" />
            <Pulse className="h-5 w-3/4" />
          </div>
        </Card>

        {/* Bento grid skeleton */}
        <div className="bento-grid">
          <div className="bento-half">
            <Card className="h-full">
              <div className="flex items-center gap-4">
                <Pulse className="h-11 w-11 rounded-xl" />
                <div className="space-y-2">
                  <Pulse className="h-8 w-24" />
                  <Pulse className="h-4 w-32" />
                </div>
              </div>
            </Card>
          </div>
          <div className="bento-half">
            <Card className="h-full">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Pulse className="h-5 w-16" />
                  <Pulse className="h-8 w-8 rounded-lg" />
                </div>
                <Pulse className="h-4 w-full" />
                <Pulse className="h-4 w-2/3" />
                <Pulse className="h-3 w-28 mt-2" />
              </div>
            </Card>
          </div>
        </div>

        {/* Heatmap skeleton */}
        <div className="sm:max-w-sm">
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Pulse className="h-5 w-5 rounded" />
                <Pulse className="h-6 w-32" />
                <Pulse className="h-5 w-5 rounded" />
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, index) => (
                  <Pulse key={index} className="aspect-square rounded-lg" />
                ))}
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
