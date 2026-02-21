interface SkeletonProps {
  className?: string
}

interface SkeletonTextProps extends SkeletonProps {
  width?: string
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse h-28 ${className}`}
    />
  )
}

export function SkeletonTable({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden ${className}`}>
      {/* Header row */}
      <div className="bg-gray-200 dark:bg-gray-800 animate-pulse h-10" />
      {/* Data rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="border-t border-gray-100 dark:border-gray-800 px-6 py-4 flex gap-4 items-center"
        >
          <div
            className={`bg-gray-200 dark:bg-gray-800 animate-pulse rounded ${
              i % 2 === 0 ? 'h-4' : 'h-3'
            } w-1/4`}
          />
          <div
            className={`bg-gray-200 dark:bg-gray-800 animate-pulse rounded ${
              i % 2 === 0 ? 'h-3' : 'h-4'
            } w-1/6`}
          />
          <div className="bg-gray-200 dark:bg-gray-800 animate-pulse rounded h-3 w-1/5" />
          <div className="bg-gray-200 dark:bg-gray-800 animate-pulse rounded h-3 w-1/12" />
          <div className="bg-gray-200 dark:bg-gray-800 animate-pulse rounded h-4 w-1/6" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonText({ className = '', width = 'w-full' }: SkeletonTextProps) {
  return (
    <div
      className={`h-4 bg-gray-200 dark:bg-gray-800 animate-pulse rounded ${width} ${className}`}
    />
  )
}

export function SkeletonChart({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse h-52 ${className}`}
    />
  )
}

export function SkeletonList({ className = '' }: SkeletonProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {/* Circle avatar */}
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse flex-shrink-0" />
          {/* Two text lines */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 animate-pulse rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-800 animate-pulse rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
