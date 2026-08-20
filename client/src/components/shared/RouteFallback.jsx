import Spinner from '../ui/Spinner.jsx';

/**
 * Shown while a lazily-loaded route group downloads.
 *
 * Centred on a full-height canvas rather than a bare spinner in the corner: this
 * replaces the entire page for a moment, and a fallback that doesn't fill the
 * space makes the app look like it collapsed before it recovers.
 *
 * The delay is usually a single fetch on a fast connection, so there is no
 * skeleton here — a skeleton that flashes for 80ms is worse than nothing.
 */
export default function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <Spinner size="lg" className="text-primary-600" label="Loading" />
    </div>
  );
}
