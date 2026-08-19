import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, LayoutDashboard, Menu, X } from 'lucide-react';

import Logo from './Logo.jsx';
import Button from '../ui/Button.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { PATHS, homeForRole } from '../../constants/routes.js';
import cn from '../../utils/cn.js';

const NAV = [
  { label: 'Study Abroad', to: PATHS.studyAbroad },
  { label: 'Countries', to: PATHS.countries },
  { label: 'Universities', to: PATHS.universities },
  { label: 'Courses', to: PATHS.courses },
  { label: 'Scholarships', to: PATHS.scholarships },
  {
    label: 'Resources',
    children: [
      { label: 'Cost calculator', to: PATHS.costCalculator, hint: 'What it really costs' },
      { label: 'IELTS', to: PATHS.testPrep('ielts'), hint: 'Bands, format, preparation' },
      { label: 'PTE', to: PATHS.testPrep('pte'), hint: 'Computer-based, fast results' },
      { label: 'TOEFL', to: PATHS.testPrep('toefl'), hint: 'Widely accepted in the US' },
      { label: 'Student visa', to: PATHS.visa, hint: 'Documents and timelines' },
      { label: 'PR pathways', to: PATHS.pr, hint: 'Study to residency routes' },
    ],
  },
  { label: 'Success Stories', to: PATHS.successStories },
  { label: 'About', to: PATHS.about },
];

/**
 * Public site navigation.
 *
 * Shrinks and gains a backdrop on scroll rather than switching to a solid bar —
 * the hero image stays visible behind it, which is what makes the page feel like
 * one composition instead of a bar sitting on top of a picture.
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Any navigation closes both menus, including a click on the link you are
  // already on — otherwise the drawer stays open over the page you asked for.
  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [location.pathname]);

  // A drawer that scrolls the page behind it feels broken on touch devices.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-200 ease-out',
        scrolled ? 'border-b border-navy-100 bg-white/85 shadow-sm backdrop-blur-lg' : 'bg-transparent'
      )}
    >
      <div className={cn('container-page flex items-center justify-between transition-all duration-200', scrolled ? 'h-15' : 'h-18')}>
        <Logo />

        {/* ─── Desktop ─────────────────────────────────────────────── */}
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) =>
            item.children ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setOpenMenu(item.label)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <button
                  type="button"
                  aria-expanded={openMenu === item.label}
                  onClick={() => setOpenMenu(openMenu === item.label ? null : item.label)}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-navy-600 transition-colors duration-150 hover:text-navy-950"
                >
                  {item.label}
                  <ChevronDown
                    className={cn('size-4 transition-transform duration-200', openMenu === item.label && 'rotate-180')}
                    aria-hidden="true"
                  />
                </button>

                <AnimatePresence>
                  {openMenu === item.label && (
                    <motion.div
                      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
                      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute top-full left-0 w-72 pt-2"
                    >
                      <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white p-2 shadow-xl">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            className="block rounded-xl px-3 py-2.5 transition-colors duration-150 hover:bg-navy-50"
                          >
                            <span className="block text-sm font-semibold text-navy-900">{child.label}</span>
                            <span className="mt-0.5 block text-xs text-navy-500">{child.hint}</span>
                          </NavLink>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                    isActive ? 'text-primary-700' : 'text-navy-600 hover:text-navy-950'
                  )
                }
              >
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          {isAuthenticated ? (
            <Button as={Link} to={homeForRole(user.role)} size="sm" leftIcon={LayoutDashboard}>
              My dashboard
            </Button>
          ) : (
            <>
              <Button as={Link} to={PATHS.login} variant="ghost" size="sm">
                Sign in
              </Button>
              <Button as={Link} to={PATHS.register} size="sm">
                Find my course
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          className="flex size-10 items-center justify-center rounded-xl text-navy-700 transition-colors duration-150 hover:bg-navy-100 lg:hidden"
        >
          <Menu className="size-5.5" aria-hidden="true" />
        </button>
      </div>

      {/* ─── Mobile drawer ───────────────────────────────────────────
          A full-height panel with large touch targets and its own CTA block,
          rather than the desktop bar stacked vertically. */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-navy-950/40 backdrop-blur-sm lg:hidden"
              aria-hidden="true"
            />
            <motion.div
              initial={reduce ? { opacity: 1 } : { x: '100%' }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: '100%' }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="scrollbar-slim fixed inset-y-0 right-0 z-50 flex w-[min(22rem,88vw)] flex-col overflow-y-auto bg-white lg:hidden"
              role="dialog"
              aria-label="Menu"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-navy-100 px-5">
                <Logo size="sm" />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="flex size-10 items-center justify-center rounded-xl text-navy-500 hover:bg-navy-100"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>

              <nav aria-label="Mobile" className="flex-1 px-3 py-4">
                {NAV.map((item) =>
                  item.children ? (
                    <div key={item.label} className="mt-2">
                      <p className="px-3 pt-3 pb-1 text-2xs font-semibold tracking-wider text-navy-400 uppercase">
                        {item.label}
                      </p>
                      {item.children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          className="block rounded-xl px-3 py-3 text-[0.9375rem] font-medium text-navy-700 hover:bg-navy-50"
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  ) : (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'block rounded-xl px-3 py-3 text-[0.9375rem] font-medium',
                          isActive ? 'bg-primary-50 text-primary-700' : 'text-navy-700 hover:bg-navy-50'
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  )
                )}
              </nav>

              <div className="shrink-0 space-y-2.5 border-t border-navy-100 p-5">
                {isAuthenticated ? (
                  <Button as={Link} to={homeForRole(user.role)} fullWidth size="lg" leftIcon={LayoutDashboard}>
                    My dashboard
                  </Button>
                ) : (
                  <>
                    <Button as={Link} to={PATHS.register} fullWidth size="lg">
                      Find my course
                    </Button>
                    <Button as={Link} to={PATHS.login} variant="outline" fullWidth size="lg">
                      Sign in
                    </Button>
                  </>
                )}
                <Button as={Link} to={PATHS.contact} variant="ghost" fullWidth size="lg">
                  Book free counselling
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
