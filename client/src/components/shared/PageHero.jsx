import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

import cn from '../../utils/cn.js';

/**
 * Header band for inner public pages.
 *
 * Navy so the transparent navbar has something to sit on — on a white page the
 * unscrolled navbar would float over nothing and its links would lose contrast.
 */
export default function PageHero({ eyebrow, title, description, breadcrumbs = [], children, className }) {
  return (
    <section className={cn('relative overflow-hidden bg-navy-950', className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-24 size-[26rem] rounded-full bg-primary-600/20 blur-3xl"
      />

      <div className="container-page relative pt-12 pb-16 md:pt-16 md:pb-20">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-navy-400">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.label} className="flex items-center gap-1.5">
                  {index > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />}
                  {crumb.to ? (
                    <Link to={crumb.to} className="transition-colors duration-150 hover:text-white">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-navy-200" aria-current="page">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {eyebrow && (
          <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary-300 uppercase">
            {eyebrow}
          </span>
        )}

        <h1 className="mt-5 max-w-3xl font-display text-3xl leading-tight font-semibold tracking-[-0.035em] text-white md:text-display-sm lg:text-display-md">
          {title}
        </h1>

        {description && <p className="mt-5 max-w-2xl text-base leading-relaxed text-navy-300 md:text-lg">{description}</p>}

        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
