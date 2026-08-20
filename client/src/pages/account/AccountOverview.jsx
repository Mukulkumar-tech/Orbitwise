import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogOut, MailCheck, MailWarning, ShieldCheck } from 'lucide-react';

import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Logo from '../../components/shared/Logo.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import authService from '../../services/authService.js';

const ROLE_TONES = { admin: 'solid', counsellor: 'primary', student: 'success' };

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

/**
 * The signed-in account screen.
 *
 * Serves as the authenticated landing for every role while the role dashboards
 * are built out (student in Phase 7, counsellor in Phase 12, admin in Phase 13),
 * and remains the permanent home of account-level settings after that.
 */
export default function AccountOverview() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await logout();
    toast.success('Signed out');
    navigate('/login', { replace: true });
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await authService.resendVerification(user.email);
      toast.success('Verification link sent — check your inbox.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-navy-100 bg-white">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo />
          <Button variant="outline" size="sm" leftIcon={LogOut} isLoading={signingOut} onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="container-page max-w-3xl py-12">
        <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] text-navy-950">
          Good to see you, {user.name.split(' ')[0]}
        </h1>
        <p className="mt-2 text-base text-navy-500">Your Orbitwise account is active and secured.</p>

        {!user.isVerified && (
          <Alert
            tone="warning"
            title="Verify your email address"
            className="mt-8"
            action={
              <Button size="sm" variant="outline" isLoading={resending} onClick={handleResendVerification}>
                Resend
              </Button>
            }
          >
            We sent a link to {user.email}. Verifying keeps your account recoverable if you forget your password.
          </Alert>
        )}

        <section className="mt-8 rounded-2xl bg-surface p-6 shadow-md hairline md:p-8">
          <div className="flex flex-wrap items-center gap-5">
            <Avatar name={user.name} src={user.avatar} size="xl" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-lg font-semibold text-navy-950">{user.name}</h2>
                <Badge tone={ROLE_TONES[user.role]} className="capitalize">
                  {user.role}
                </Badge>
                {user.isVerified ? (
                  <Badge tone="success" icon={MailCheck}>
                    Verified
                  </Badge>
                ) : (
                  <Badge tone="warning" icon={MailWarning}>
                    Unverified
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-navy-500">{user.email}</p>
              {user.phone && <p className="text-sm text-navy-500">{user.phone}</p>}
            </div>
          </div>

          <dl className="mt-8 grid grid-cols-1 gap-x-8 gap-y-5 border-t border-navy-100 pt-6 sm:grid-cols-2">
            {[
              ['Member since', formatDate(user.createdAt)],
              ['Last sign-in', formatDate(user.lastLogin)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-2xs font-semibold tracking-wide text-navy-400 uppercase">{label}</dt>
                <dd className="mt-1 text-sm font-medium text-navy-800">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-6 flex items-start gap-4 rounded-2xl bg-navy-950 p-6 md:p-8">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-primary-300 ring-1 ring-white/10">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-white">How your session is protected</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-navy-300">
              Your access token lives in memory for 15 minutes and is never written to browser storage. Refreshes use an
              HttpOnly cookie that JavaScript cannot read, and every refresh rotates the token so an intercepted one
              cannot be reused.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
