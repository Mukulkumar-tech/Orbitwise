import { LogoMark } from '../components/shared/Logo.jsx';

/**
 * Full-page hold shown while a session is being restored or a lazy route chunk
 * is downloading.
 *
 * Deliberately quiet: a branded mark and a progress hint, no spinner racing in
 * the centre of the screen. Most of these resolve in under 300ms, and a loud
 * loader that flashes is worse than a calm one that does not.
 */
export default function RouteLoader({ label = 'Loading Orbitwise' }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-5">
        <LogoMark size="lg" className="animate-pulse" />
        <div className="h-1 w-32 overflow-hidden rounded-full bg-navy-100">
          <div className="h-full w-1/3 animate-indeterminate rounded-full bg-primary-600" />
        </div>
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}
