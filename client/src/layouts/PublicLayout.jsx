import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import Navbar from '../components/shared/Navbar.jsx';
import Footer from '../components/shared/Footer.jsx';

/**
 * Shell for every public page.
 *
 * Owns the two behaviours a router does not give you for free: resetting scroll
 * between pages, and a skip link. Without the scroll reset, navigating from
 * halfway down the course list to a detail page lands the visitor halfway down
 * the detail page.
 */
export default function PublicLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Visible only on keyboard focus. The navbar has ~9 links before the
          content starts, which is a lot to tab through on every page. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-xl focus:bg-navy-950 focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <Navbar />

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
