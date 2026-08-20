import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldOff } from 'lucide-react';

import Button from '../components/ui/Button.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { homeForRole } from '../constants/routes.js';

/**
 * Explicit 403.
 *
 * Shown instead of a silent redirect so a user who follows a link meant for
 * another role understands what happened rather than being quietly bounced.
 */
export default function Forbidden() {
  const { user, isAuthenticated } = useAuth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-5">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-warning-50 text-warning-700">
          <ShieldOff className="size-7" aria-hidden="true" />
        </div>

        <p className="mt-6 font-mono text-sm font-semibold tracking-widest text-warning-700">403</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-navy-950">Not your door</h1>
        <p className="mt-3 text-base leading-relaxed text-navy-500">
          {isAuthenticated
            ? `Your ${user.role} account doesn’t have access to this area.`
            : 'You need to sign in with an account that has access to this area.'}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button as={Link} to={isAuthenticated ? homeForRole(user.role) : '/login'} leftIcon={ArrowLeft}>
            {isAuthenticated ? 'Back to my dashboard' : 'Sign in'}
          </Button>
          <Button as={Link} to="/" variant="outline">
            Go to homepage
          </Button>
        </div>
      </div>
    </main>
  );
}
