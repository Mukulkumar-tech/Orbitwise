import { useState } from 'react';
import { Info, X } from 'lucide-react';

import useDemoMode from '../../hooks/useDemoMode.js';

/**
 * Announces that the page is showing captured fixtures rather than live data.
 *
 * The whole point of the fallback is that the site stays explorable when the API
 * is asleep — but showing fabricated-looking data without saying so would mislead
 * whoever is reading the page. This is the honesty half of that feature, so it is
 * deliberately not subtle.
 *
 * Dismissible, because someone who has read it once should not have it follow
 * them around the site.
 */
export default function DemoBanner() {
  const isDemo = useDemoMode();
  const [dismissed, setDismissed] = useState(false);

  if (!isDemo || dismissed) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-gold-600/40 bg-gold-500 px-4 py-3 shadow-lg"
    >
      <div className="container-page flex items-start gap-3">
        <Info className="mt-0.5 size-4.5 shrink-0 text-navy-950" aria-hidden="true" />

        <p className="flex-1 text-sm leading-relaxed text-navy-950">
          <span className="font-semibold">Showing demo data.</span> The API is not responding — most
          likely a free-tier server that sleeps when idle. Course, destination and scholarship data
          below is a saved snapshot, so filters and sign-in will not work until the backend wakes up.
          Reload in about 30 seconds.
        </p>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="-m-1 shrink-0 rounded-lg p-1 text-navy-950/70 transition-colors hover:bg-navy-950/10 hover:text-navy-950"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
