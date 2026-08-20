import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogOut } from 'lucide-react';

import Avatar from '../components/ui/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import Logo from '../components/shared/Logo.jsx';
import Badge from '../components/ui/Badge.jsx';
import { PATHS } from '../constants/routes.js';
import { useAuth } from '../hooks/useAuth.js';
import cn from '../utils/cn.js';

const linkClasses = ({ isActive }) =>
  cn(
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150',
    isActive ? 'bg-primary-50 text-primary-700' : 'text-navy-600 hover:bg-navy-100 hover:text-navy-900'
  );

/**
 * Shared shell for the staff portals.
 *
 * Extracted rather than copied from StudentLayout: the counsellor and admin
 * portals need the same sidebar, the same mobile pill row and the same sign-out,
 * and three near-identical layouts would drift the moment one of them changed.
 * `nav` and `roleLabel` are the only differences.
 */
export default function PortalLayout({ nav = [], roleLabel }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await logout();
    toast.success('Signed out');
    navigate(PATHS.login, { replace: true });
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* ─── Sidebar (lg and up) ─────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 hidden w-[16.5rem] flex-col border-r border-navy-100 bg-white px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo />
          {roleLabel && (
            <Badge tone="primary" size="sm" className="mt-3">
              {roleLabel}
            </Badge>
          )}
        </div>

        <nav aria-label={`${roleLabel} portal`} className="mt-8 flex-1">
          <ul className="space-y-1">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={linkClasses}>
                  <Icon className="size-4.5 shrink-0" aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-navy-100 pt-4">
          <Link
            to={PATHS.account}
            className="flex items-center gap-3 rounded-xl p-2 transition-colors duration-150 hover:bg-navy-50"
          >
            <Avatar name={user.name} src={user.avatar} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-navy-900">{user.name}</span>
              <span className="block truncate text-xs text-navy-500">{user.email}</span>
            </span>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            fullWidth
            leftIcon={LogOut}
            isLoading={signingOut}
            onClick={handleSignOut}
            className="mt-1 justify-start"
          >
            Sign out
          </Button>
        </div>
      </aside>

      {/* ─── Mobile header ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-navy-100 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-5">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <Link to={PATHS.account} aria-label="Your account">
              <Avatar name={user.name} src={user.avatar} size="sm" />
            </Link>
            <Button variant="ghost" size="sm" leftIcon={LogOut} isLoading={signingOut} onClick={handleSignOut}>
              <span className="sr-only">Sign out</span>
            </Button>
          </div>
        </div>

        <nav aria-label={`${roleLabel} portal`} className="scrollbar-slim overflow-x-auto px-3 pb-2">
          <ul className="flex gap-1.5">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors duration-150',
                      isActive ? 'bg-primary-500 text-navy-950' : 'bg-navy-50 text-navy-600'
                    )
                  }
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <main className="lg:pl-[16.5rem]">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
