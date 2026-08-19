import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-5">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
          <Compass className="size-7" aria-hidden="true" />
        </div>

        <p className="mt-6 font-mono text-sm font-semibold tracking-widest text-primary-600">404</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-navy-950">Off the map</h1>
        <p className="mt-3 text-base leading-relaxed text-navy-500">
          This page doesn’t exist — but your journey does. Let’s get you back on route.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-primary transition-colors duration-150 hover:bg-primary-700"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Orbitwise
        </Link>
      </div>
    </main>
  );
}
