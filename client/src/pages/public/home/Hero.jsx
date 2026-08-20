import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, CalendarCheck, GraduationCap, Sparkles, Wallet } from 'lucide-react';

import Button from '../../../components/ui/Button.jsx';
import { PATHS } from '../../../constants/routes.js';
import { formatInr } from '../../../constants/domain.js';
import { fadeUp, resolve, staggerParent } from '../../../utils/motion.js';

/** Small floating proof points. Four, not eight — the hero must stay readable. */
function FloatingCard({ icon: Icon, label, value, className, delay, reduce }) {
  return (
    <motion.div
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute hidden items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-lg ring-1 ring-navy-950/5 backdrop-blur-sm md:flex ${className}`}
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
        <Icon className="size-4.5" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-navy-950">{value}</span>
        <span className="block text-2xs font-medium tracking-wide text-navy-400 uppercase">{label}</span>
      </span>
    </motion.div>
  );
}

export default function Hero({ stats }) {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-navy-950">
      {/* Two soft washes give the flat navy depth without a gradient that fights
          the content for attention. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-32 size-[38rem] rounded-full bg-primary-600/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-56 -left-40 size-[34rem] rounded-full bg-primary-500/10 blur-3xl"
      />

      <div className="container-page relative grid items-center gap-14 pt-16 pb-20 md:pt-20 md:pb-28 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <motion.div initial="hidden" animate="visible" variants={staggerParent(0.08)}>
          <motion.span
            variants={resolve(fadeUp, reduce)}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-primary-300 ring-1 ring-white/15"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            Personalised with OrbitMatch
          </motion.span>

          <motion.h1
            variants={resolve(fadeUp, reduce)}
            className="mt-6 font-display text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.035em] text-white sm:text-display-md lg:text-display-lg"
          >
            Your global future starts here.
          </motion.h1>

          <motion.p
            variants={resolve(fadeUp, reduce)}
            className="mt-6 max-w-xl text-base leading-relaxed text-navy-300 md:text-lg"
          >
            Find the right university, course and country — matched to your academic profile, career goals and budget.
            Whether you have just finished Class 12 or your degree, you only see programmes you can actually get into.
          </motion.p>

          <motion.div variants={resolve(fadeUp, reduce)} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button as={Link} to={PATHS.register} size="lg" rightIcon={ArrowRight}>
              Find my course
            </Button>
            <Button
              as={Link}
              to={PATHS.contact}
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:border-white/30 hover:bg-white/10"
            >
              Book free counselling
            </Button>
          </motion.div>

          <motion.p variants={resolve(fadeUp, reduce)} className="mt-6 text-sm text-navy-400">
            Free to use · No hidden charges · {stats ? `${stats.scholarshipCourses} courses with scholarships` : 'Scholarships available'}
          </motion.p>
        </motion.div>

        {/* ─── Visual ──────────────────────────────────────────────── */}
        <div className="relative">
          <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-4/5 overflow-hidden rounded-3xl ring-1 ring-white/10 sm:aspect-3/2 lg:aspect-4/5"
          >
            <img
              src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1000&q=80"
              alt="International students on a university campus"
              loading="eager"
              className="size-full object-cover"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-navy-950/70 via-transparent to-transparent" />
          </motion.div>

          <FloatingCard
            icon={Sparkles}
            value="94% Match"
            label="OrbitMatch score"
            className="-top-4 -left-6 lg:-left-14"
            delay={0.45}
            reduce={reduce}
          />
          <FloatingCard
            icon={GraduationCap}
            value={stats ? `${stats.universities} universities` : 'Verified universities'}
            label="In the catalogue"
            className="top-1/3 -right-4 lg:-right-10"
            delay={0.6}
            reduce={reduce}
          />
          <FloatingCard
            icon={Wallet}
            value={stats?.lowestTuitionInr ? `From ${formatInr(stats.lowestTuitionInr)}/yr` : 'Budget-aware'}
            label="Tuition"
            className="bottom-16 -left-4 lg:-left-12"
            delay={0.75}
            reduce={reduce}
          />
          <FloatingCard
            icon={CalendarCheck}
            value="After 12th or degree"
            label="Both pathways"
            className="-bottom-4 right-2 lg:right-6"
            delay={0.9}
            reduce={reduce}
          />
        </div>
      </div>
    </section>
  );
}
