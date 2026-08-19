import { RefreshCw, TriangleAlert, WifiOff } from 'lucide-react';

import Button from './Button.jsx';
import cn from '../../utils/cn.js';

/**
 * Shown when a request failed. The counterpart to EmptyState.
 *
 * A failed fetch is usually transient, so retry is the primary action rather
 * than a footnote — and the copy distinguishes a connection problem from a
 * server problem, because those need different things from the user.
 *
 * Pass the ApiClientError straight through: `isNetworkError` drives the variant.
 */
export default function ErrorState({ error, onRetry, title, size = 'md', className }) {
  const isOffline = error?.isNetworkError;
  const Icon = isOffline ? WifiOff : TriangleAlert;
  const compact = size === 'sm';

  const heading = title ?? (isOffline ? 'Connection lost' : 'Something went wrong');
  const description =
    error?.message ??
    (isOffline
      ? 'Check your internet connection and try again.'
      : 'We couldn’t load this right now. Trying again usually works.');

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-danger-100 bg-danger-50/60 text-center',
        compact ? 'px-5 py-10' : 'px-6 py-16',
        className
      )}
    >
      <span
        className={cn(
          'flex items-center justify-center rounded-2xl bg-white text-danger-600 shadow-xs',
          compact ? 'size-11' : 'size-14'
        )}
      >
        <Icon className={compact ? 'size-5' : 'size-6'} aria-hidden="true" />
      </span>

      <h3 className={cn('mt-5 font-semibold text-navy-900', compact ? 'text-sm' : 'text-base')}>{heading}</h3>
      <p className={cn('mt-1.5 max-w-sm leading-relaxed text-navy-600', compact ? 'text-xs' : 'text-sm')}>
        {description}
      </p>

      {onRetry && (
        <Button
          variant="outline"
          size={compact ? 'sm' : 'md'}
          leftIcon={RefreshCw}
          onClick={onRetry}
          className="mt-6"
        >
          Try again
        </Button>
      )}
    </div>
  );
}
