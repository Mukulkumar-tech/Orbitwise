import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, GraduationCap, Sparkles, Wallet } from 'lucide-react';

import Logo from '../components/shared/Logo.jsx';
import { fadeUp, resolve, staggerParent } from '../utils/motion.js';

const VALUE_PROPS = [
  {
    icon: Sparkles,
    title: 'OrbitMatch scoring',
    body: 'See how well every course fits your grades, budget and goals — and exactly why.',
  },
  {
    icon: GraduationCap,
    title: '1,200+ universities',
    body: 'Explore verified courses across 25 countries with real requirements and deadlines.',
  },
  {
    icon: Wallet,
    title: 'Plan the real cost',
    body: 'Tuition, living, visa and flights — with scholarships factored in before you apply.',
  },
];

/**
 * Split layout for every credential screen.
 *
 * The form owns the left column at all widths; the navy panel is supporting
 * context and is dropped below `lg` rather than stacked, because a signed-out
 * user on a phone wants the form immediately, not a scroll past marketing.
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
  const reduce = useReducedMotion();

  return (
    <div className="flex min-h-screen bg-white">
      {/* ─── Form column ────────────────────────────────────────────────── */}
      <div className="flex w-full flex-col px-5 py-8 sm:px-8 lg:w-[52%] lg:px-14 xl:px-20">
        <header className="flex items-center justify-between gap-4">
          <Logo />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-navy-500 transition-colors duration-150 hover:text-navy-900"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to site
          </Link>
        </header>

        <motion.main
          initial="hidden"
          animate="visible"
          variants={staggerParent(0.06)}
          className="flex flex-1 flex-col justify-center py-12"
        >
          <div className="mx-auto w-full max-w-[27rem]">
            <motion.div variants={resolve(fadeUp, reduce)}>
              <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] text-navy-950 sm:text-4xl">
                {title}
              </h1>
              {subtitle && <p className="mt-3 text-base leading-relaxed text-navy-500">{subtitle}</p>}
            </motion.div>

            <motion.div variants={resolve(fadeUp, reduce)} className="mt-8">
              {children}
            </motion.div>
          </div>
        </motion.main>

        {footer && <footer className="mx-auto w-full max-w-[27rem] pb-2">{footer}</footer>}
      </div>

      {/* ─── Context panel ──────────────────────────────────────────────── */}
      <aside className="relative hidden overflow-hidden bg-navy-950 lg:flex lg:w-[48%] lg:flex-col lg:justify-center lg:px-14 xl:px-20">
        {/* Two soft radial washes give the flat navy depth without a gradient
            that competes with the content. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-24 size-[28rem] rounded-full bg-primary-600/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-20 size-[24rem] rounded-full bg-primary-500/10 blur-3xl"
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerParent(0.08, 0.15)}
          className="relative max-w-lg"
        >
          <motion.p
            variants={resolve(fadeUp, reduce)}
            className="font-display text-3xl leading-tight font-semibold tracking-[-0.03em] text-white xl:text-[2.5rem]"
          >
            Your global future starts here.
          </motion.p>

          <motion.p variants={resolve(fadeUp, reduce)} className="mt-4 text-base leading-relaxed text-navy-300">
            Orbitwise helps you discover, plan and complete your study-abroad journey — from first search to arrival.
          </motion.p>

          <ul className="mt-12 space-y-7">
            {VALUE_PROPS.map(({ icon: Icon, title: propTitle, body }) => (
              <motion.li key={propTitle} variants={resolve(fadeUp, reduce)} className="flex gap-4">
                <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/8 text-primary-300 ring-1 ring-white/10">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{propTitle}</p>
                  <p className="mt-1 text-sm leading-relaxed text-navy-400">{body}</p>
                </div>
              </motion.li>
            ))}
          </ul>

          <motion.div
            variants={resolve(fadeUp, reduce)}
            className="mt-14 flex items-center gap-8 border-t border-white/10 pt-8"
          >
            {[
              ['25+', 'Countries'],
              ['1,200+', 'Universities'],
              ['4,600+', 'Courses'],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="text-2xl font-semibold tracking-[-0.02em] text-white">{value}</p>
                <p className="mt-0.5 text-xs font-medium tracking-wide text-navy-400 uppercase">{label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </aside>
    </div>
  );
}
