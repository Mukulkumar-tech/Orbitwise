import { CheckCircle2, Database, Plug, RefreshCw } from 'lucide-react';

import Button from '../../components/ui/Button.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import useQuery from '../../hooks/useQuery.js';
import systemService from '../../services/systemService.js';
import cn from '../../utils/cn.js';

/**
 * Phase 1 scaffolding: proves the client → proxy → Express → MongoDB path works
 * and renders the design tokens so they can be judged with actual eyes.
 *
 * Phase 4 replaces this route with the real Orbitwise homepage.
 */
export default function SystemStatus() {
  const { data: health, isLoading, isError, error, refetch } = useQuery(() => systemService.health(), []);

  return (
    <main className="min-h-screen bg-canvas">
      <div className="container-page section-y max-w-4xl">
        <header>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold tracking-wide text-primary-700 uppercase">
            Phase 1 · Foundation
          </span>
          <h1 className="mt-5 font-display text-display-sm font-semibold text-navy-950 md:text-display-md">
            Orbitwise
          </h1>
          <p className="mt-3 max-w-xl text-lg leading-relaxed text-navy-500">
            Helping students discover, plan and complete their study-abroad journey.
          </p>
        </header>

        {/* ─── API connectivity ─────────────────────────────────────────── */}
        <section className="mt-12 rounded-2xl bg-surface p-6 shadow-md hairline md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="flex items-center gap-2.5 text-base font-semibold text-navy-950">
              <Plug className="size-5 text-navy-400" aria-hidden="true" />
              API connectivity
            </h2>

            <Button variant="outline" size="sm" leftIcon={RefreshCw} isLoading={isLoading} onClick={refetch}>
              Re-check
            </Button>
          </div>

          <div className="mt-6">
            {isLoading && (
              <div role="status" aria-live="polite" className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-16" rounded="rounded-xl" />
                ))}
                <span className="sr-only">Contacting the API</span>
              </div>
            )}

            {isError && (
              <ErrorState
                size="sm"
                error={error}
                onRetry={refetch}
                title="Cannot reach the API"
                className="text-left"
              />
            )}

            {health && (
              <>
                <p className="flex items-center gap-2.5 text-sm font-semibold text-success-700">
                  <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                  API reachable · uptime {health.uptimeSeconds}s · {health.environment}
                </p>

                <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                  <StatusRow
                    icon={Database}
                    label="Database"
                    value={health.database.state}
                    note={health.database.ephemeral ? 'in-memory — resets on restart' : 'persistent'}
                    tone={health.database.state === 'connected' ? 'success' : 'danger'}
                  />
                  {/* Rendered from whatever the API reports, so this page needs
                      no edit as each adapter lands. */}
                  {Object.entries(health.adapters).map(([name, provider]) => (
                    <StatusRow key={name} icon={Plug} label={`${name} adapter`} value={provider} />
                  ))}
                </dl>
              </>
            )}
          </div>
        </section>

        {/* ─── Design tokens ────────────────────────────────────────────── */}
        <section className="mt-8 rounded-2xl bg-surface p-6 shadow-md hairline md:p-8">
          <h2 className="text-base font-semibold text-navy-950">Design tokens</h2>
          <p className="mt-1.5 text-sm text-navy-500">
            Electric Indigo on deep navy, with semantic colours reserved for state.
          </p>

          <div className="mt-6 space-y-4">
            <Ramp label="Primary" prefix="bg-primary" />
            <Ramp label="Navy" prefix="bg-navy" />
            <Ramp label="Success" prefix="bg-success" />
            <Ramp label="Warning" prefix="bg-warning" />
            <Ramp label="Danger" prefix="bg-danger" />
          </div>

          <div className="mt-8 flex flex-wrap items-end gap-3">
            {['shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl'].map((shadow) => (
              <div
                key={shadow}
                className={cn(
                  'flex size-24 items-end justify-center rounded-2xl bg-white p-3 text-2xs font-medium text-navy-400',
                  shadow
                )}
              >
                {shadow.replace('shadow-', '')}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusRow({ icon: Icon, label, value, note, tone }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-navy-50 px-4 py-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-navy-400" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-2xs font-semibold tracking-wide text-navy-400 uppercase">{label}</dt>
        <dd
          className={cn(
            'mt-0.5 font-mono text-sm font-medium',
            tone === 'success' && 'text-success-700',
            tone === 'danger' && 'text-danger-700',
            !tone && 'text-navy-800'
          )}
        >
          {value}
          {note && <span className="ml-1.5 font-sans text-xs font-normal text-navy-400">({note})</span>}
        </dd>
      </div>
    </div>
  );
}

// Static class strings rather than interpolation: Tailwind scans source text, so
// `bg-${prefix}-500` would produce a class it never compiles.
const RAMPS = {
  'bg-primary': ['bg-primary-100', 'bg-primary-300', 'bg-primary-500', 'bg-primary-600', 'bg-primary-700', 'bg-primary-900'],
  'bg-navy': ['bg-navy-100', 'bg-navy-300', 'bg-navy-500', 'bg-navy-700', 'bg-navy-900', 'bg-navy-950'],
  'bg-success': ['bg-success-100', 'bg-success-300', 'bg-success-500', 'bg-success-600', 'bg-success-700', 'bg-success-900'],
  'bg-warning': ['bg-warning-100', 'bg-warning-300', 'bg-warning-500', 'bg-warning-600', 'bg-warning-700', 'bg-warning-900'],
  'bg-danger': ['bg-danger-100', 'bg-danger-300', 'bg-danger-500', 'bg-danger-600', 'bg-danger-700', 'bg-danger-900'],
};

function Ramp({ label, prefix }) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-16 shrink-0 text-xs font-medium text-navy-500">{label}</span>
      <div className="flex flex-1 overflow-hidden rounded-lg">
        {RAMPS[prefix].map((swatch) => (
          <div key={swatch} className={cn('h-10 flex-1', swatch)} title={swatch} />
        ))}
      </div>
    </div>
  );
}
