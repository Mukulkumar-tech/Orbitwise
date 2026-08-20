import cn from '../../utils/cn.js';

/**
 * Shimmer placeholder.
 *
 * Skeletons should mirror the shape of the content that replaces them, so the
 * layout does not jump on load. Compose them per view rather than reaching for a
 * generic spinner — see SkeletonText and SkeletonCard below.
 *
 * `aria-hidden` because the surrounding container announces loading state; a
 * screen reader should hear "loading courses" once, not twelve grey boxes.
 */
export default function Skeleton({ className, rounded = 'rounded-lg' }) {
  return (
    <span
      aria-hidden="true"
      className={cn('relative block overflow-hidden bg-navy-100', rounded, className)}
    >
      {/* bg-linear-* is the Tailwind v4 name; bg-gradient-* is the v3 spelling. */}
      <span className="absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-white/60 to-transparent" />
    </span>
  );
}

/** Paragraph placeholder; the last line is short, as real text tends to be. */
export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn('h-3.5', index === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

/** Card-shaped placeholder matching the product's standard card geometry. */
export function SkeletonCard({ className }) {
  return (
    <div className={cn('rounded-2xl bg-surface p-5 shadow-sm hairline', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="size-11" rounded="rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      </div>
      <SkeletonText lines={2} className="mt-5" />
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-9 w-28" rounded="rounded-lg" />
        <Skeleton className="h-9 w-24" rounded="rounded-lg" />
      </div>
    </div>
  );
}

/** Grid of card placeholders, for list and search results. */
export function SkeletonGrid({ count = 6, className }) {
  return (
    <div role="status" aria-live="polite" className={cn('grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3', className)}>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
      <span className="sr-only">Loading results</span>
    </div>
  );
}
