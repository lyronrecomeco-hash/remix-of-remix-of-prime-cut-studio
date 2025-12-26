import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-primary/10",
        className
      )}
      {...props}
    />
  )
}

// Loading card skeleton
function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card rounded-xl p-4 space-y-3", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  )
}

// Service card skeleton
function ServiceSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    </div>
  )
}

// Appointment card skeleton
function AppointmentSkeleton() {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-center space-y-1">
            <Skeleton className="h-8 w-14" />
            <Skeleton className="h-3 w-10 mx-auto" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// List skeleton
function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export { Skeleton, CardSkeleton, ServiceSkeleton, AppointmentSkeleton, ListSkeleton }
