import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, Mail, Send } from 'lucide-react';

import AuthLayout from '../../layouts/AuthLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Alert from '../../components/ui/Alert.jsx';
import authService from '../../services/authService.js';
import { useAuth } from '../../hooks/useAuth.js';
import { PATHS, homeForRole } from '../../constants/routes.js';

export default function VerifyEmail() {
  const { token } = useParams();
  const { user, isAuthenticated, reloadUser } = useAuth();

  const [state, setState] = useState({ status: 'verifying', message: null });
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  /**
   * A verification token is single-use, so this must fire exactly once.
   * React StrictMode intentionally double-invokes effects in development; the
   * guard stops the second run from consuming the token and reporting failure
   * for a link that actually worked.
   */
  const attempted = useRef(false);

  const verify = useCallback(async () => {
    try {
      const result = await authService.verifyEmail(token);
      setState({ status: 'success', message: result.message });
      // Refresh the cached user so the "verify your email" banner disappears
      // without needing a reload.
      if (isAuthenticated) await reloadUser().catch(() => {});
    } catch (error) {
      setState({ status: 'error', message: error.message });
    }
  }, [token, isAuthenticated, reloadUser]);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    verify();
  }, [verify]);

  const handleResend = async (event) => {
    event.preventDefault();
    const email = resendEmail.trim() || user?.email;
    if (!email) return;

    setResending(true);
    try {
      await authService.resendVerification(email);
      setResent(true);
      toast.success('If that address needs verifying, a new link is on its way.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setResending(false);
    }
  };

  if (state.status === 'verifying') {
    return (
      <AuthLayout title="Verifying your email" subtitle="This will only take a moment.">
        <div className="flex items-center gap-3 text-navy-500" aria-live="polite">
          <Spinner size="md" />
          <span className="text-sm">Confirming your verification link…</span>
        </div>
      </AuthLayout>
    );
  }

  if (state.status === 'success') {
    return (
      <AuthLayout title="Email verified" subtitle={state.message}>
        <div className="space-y-6">
          <div className="flex items-start gap-4 rounded-2xl bg-success-50 p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-success-600">
              <CheckCircle2 className="size-5" aria-hidden="true" />
            </span>
            <p className="text-sm leading-relaxed text-success-700">
              Your account is fully active. Build your profile next — it’s what powers every match Orbitwise shows you.
            </p>
          </div>

          <Button as={Link} to={isAuthenticated ? homeForRole(user.role) : PATHS.login} size="lg" fullWidth>
            {isAuthenticated ? 'Continue to Orbitwise' : 'Sign in to continue'}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="This link didn’t work"
      subtitle="Verification links expire after 24 hours and can only be used once."
      footer={
        <p className="text-center text-sm text-navy-500">
          Need help?{' '}
          {/* mailto rather than /contact — that page arrives in Phase 4, and a
              link that 404s is worse than one that opens the user's mail app. */}
          <a
            href="mailto:support@orbitwise.dev"
            className="font-semibold text-primary-700 hover:text-primary-800"
          >
            Contact support
          </a>
        </p>
      }
    >
      <div className="space-y-6">
        <Alert tone="danger" title="Verification failed">
          {state.message}
        </Alert>

        {resent ? (
          <Alert tone="success" title="Link sent">
            Check your inbox for a fresh verification link.
          </Alert>
        ) : (
          <form onSubmit={handleResend} className="space-y-4">
            <Input
              label="Send a new link to"
              type="email"
              placeholder={user?.email ?? 'you@example.com'}
              leftIcon={Mail}
              value={resendEmail}
              onChange={(event) => setResendEmail(event.target.value)}
              hint={user?.email ? `Leave blank to use ${user.email}` : undefined}
            />
            <Button type="submit" size="lg" fullWidth isLoading={resending} loadingText="Sending…" leftIcon={Send}>
              Send a new verification link
            </Button>
          </form>
        )}

        <Button as={Link} to={PATHS.login} variant="ghost" size="lg" fullWidth>
          Back to sign in
        </Button>
      </div>
    </AuthLayout>
  );
}
