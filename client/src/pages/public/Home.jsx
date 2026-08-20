import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  ClipboardList,
  Coins,
  Compass,
  FileCheck2,
  GraduationCap,
  Minus,
  Plane,
  ScrollText,
  ShieldCheck,
  Target,
  UserRoundCheck,
} from 'lucide-react';

import Hero from './home/Hero.jsx';
import Destinations from './home/Destinations.jsx';
import FeaturedUniversities from './home/FeaturedUniversities.jsx';
import Stories from './home/Stories.jsx';
import SectionHeading from '../../components/shared/SectionHeading.jsx';
import Button from '../../components/ui/Button.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import useQuery from '../../hooks/useQuery.js';
import publicService from '../../services/publicService.js';
import { PATHS } from '../../constants/routes.js';
import { fadeUp, inView, resolve, staggerParent } from '../../utils/motion.js';
import cn from '../../utils/cn.js';

/* ─── Trust statistics ───────────────────────────────────────────────────── */

function Stats({ stats }) {
  const reduce = useReducedMotion();

  const items = stats
    ? [
        { value: `${stats.countries}`, label: 'Destinations' },
        { value: `${stats.universities}`, label: 'Universities' },
        { value: `${stats.courses}`, label: 'Courses' },
        { value: `${stats.scholarshipCourses}`, label: 'With scholarships' },
      ]
    : [];

  return (
    <section className="border-b border-navy-100 bg-white">
      <div className="container-page py-10 md:py-12">
        <motion.dl
          initial="hidden"
          whileInView="visible"
          viewport={inView}
          variants={staggerParent(0.05)}
          className="grid grid-cols-2 gap-6 md:grid-cols-4"
        >
          {items.length
            ? items.map((item) => (
                <motion.div key={item.label} variants={resolve(fadeUp, reduce)} className="text-center">
                  <dt className="sr-only">{item.label}</dt>
                  <dd>
                    <span className="block font-display text-3xl font-semibold tracking-[-0.02em] text-navy-950 md:text-4xl">
                      {item.value}
                    </span>
                    <span className="mt-1 block text-xs font-medium tracking-wide text-navy-500 uppercase">
                      {item.label}
                    </span>
                  </dd>
                </motion.div>
              ))
            : Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <Skeleton className="h-9 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
        </motion.dl>
      </div>
    </section>
  );
}

/* ─── How it works ──────────────────────────────────────────────────────── */

const STEPS = [
  {
    icon: UserRoundCheck,
    title: 'Build your profile',
    body: 'Your qualification, marks, budget and goals. Five steps, about two minutes.',
  },
  {
    icon: Target,
    title: 'Get matched',
    body: 'OrbitMatch scores every eligible course against your profile and shows you why each one fits.',
  },
  {
    icon: ClipboardList,
    title: 'Shortlist and compare',
    body: 'Save what interests you and compare total cost, entry requirements and intakes side by side.',
  },
  {
    icon: Plane,
    title: 'Apply with guidance',
    body: 'Documents, deadlines and visa steps tracked in one place, with a counsellor when you need one.',
  },
];

function HowItWorks() {
  const reduce = useReducedMotion();

  return (
    <section className="section-y bg-white">
      <div className="container-page">
        <SectionHeading
          eyebrow="How it works"
          title="From first search to boarding pass"
          description="One profile drives everything that follows, so you never re-enter the same information twice."
        />

        <motion.ol
          initial="hidden"
          whileInView="visible"
          viewport={inView}
          variants={staggerParent(0.08)}
          className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {STEPS.map((step, index) => (
            <motion.li key={step.title} variants={resolve(fadeUp, reduce)} className="relative">
              {/* Connector, desktop only — on mobile the vertical stack already
                  reads as a sequence. */}
              {index < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute top-6 left-[calc(3rem+0.75rem)] hidden h-px w-[calc(100%-3rem)] bg-navy-200 lg:block"
                />
              )}

              <span className="relative flex size-12 items-center justify-center rounded-2xl bg-primary-500 text-navy-950 shadow-primary">
                <step.icon className="size-5.5" aria-hidden="true" />
              </span>

              <h3 className="mt-5 text-base font-semibold text-navy-950">
                <span className="mr-1.5 font-mono text-sm text-primary-700">{index + 1}.</span>
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-500">{step.body}</p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}

/* ─── OrbitMatch explainer ──────────────────────────────────────────────── */

const WEIGHTS = [
  ['Academic fit', 25],
  ['Budget fit', 20],
  ['English requirement', 15],
  ['Destination', 12],
  ['Course fit', 12],
  ['Intake timing', 8],
  ['Admission likelihood', 8],
];

function OrbitMatchExplainer() {
  const reduce = useReducedMotion();

  return (
    <section className="section-y bg-navy-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 hidden justify-center overflow-hidden lg:flex"
      />
      <div className="container-page">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading
              align="left"
              tone="dark"
              eyebrow="OrbitMatch"
              title="A score you can argue with"
              description="Most sites show you a number. Orbitwise shows you the seven things that produced it — so you know whether to fix your IELTS, widen your budget, or apply today."
            />

            <motion.ul
              initial="hidden"
              whileInView="visible"
              viewport={inView}
              variants={staggerParent(0.05)}
              className="mt-10 space-y-3.5"
            >
              {WEIGHTS.map(([label, weight]) => (
                <motion.li key={label} variants={resolve(fadeUp, reduce)} className="flex items-center gap-4">
                  <span className="w-44 shrink-0 text-sm text-navy-300">{label}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <motion.span
                      initial={reduce ? { width: `${weight * 4}%` } : { width: 0 }}
                      whileInView={{ width: `${weight * 4}%` }}
                      viewport={inView}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      className="block h-full rounded-full bg-primary-500"
                    />
                  </span>
                  <span className="w-9 shrink-0 text-right font-mono text-xs text-navy-400">{weight}%</span>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          {/* Illustrative breakdown card — the shape the real API returns. */}
          <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={inView}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl bg-white p-6 shadow-2xl md:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-wide text-primary-700 uppercase">Excellent match</p>
                <h3 className="mt-1.5 text-lg leading-snug font-semibold text-navy-950">BSc Computer Science</h3>
                <p className="mt-0.5 text-sm text-navy-500">University of Auckland · New Zealand</p>
              </div>
              <span className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-success-50 text-success-700">
                <span className="text-xl font-semibold">94</span>
                <span className="text-2xs font-medium">match</span>
              </span>
            </div>

            <p className="mt-6 text-xs font-semibold tracking-wide text-navy-400 uppercase">Why this matches you</p>
            <ul className="mt-3 space-y-2.5">
              {[
                'Your 88% in Class 12 clears the 80% entry requirement',
                'Total cost ₹24.8L/yr sits inside your ₹28L budget',
                'IELTS 7.0 exceeds the 6.5 this course asks for',
                'New Zealand is one of your preferred destinations',
              ].map((reason) => (
                <li key={reason} className="flex items-start gap-2.5 text-sm text-navy-700">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-success-700" aria-hidden="true" />
                  {reason}
                </li>
              ))}
              <li className="flex items-start gap-2.5 text-sm text-warning-700">
                <Minus className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                September intake closes in 6 weeks — start now
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Why Orbitwise ─────────────────────────────────────────────────────── */

const REASONS = [
  {
    icon: GraduationCap,
    title: 'Only courses you can enter',
    body: 'Finished Class 12? You will not be shown a master’s degree. Eligibility is a filter here, not a low score.',
  },
  {
    icon: Coins,
    title: 'Total cost, not just tuition',
    body: 'Tuition plus living, in rupees, for the whole programme — the number your family actually has to fund.',
  },
  {
    icon: ScrollText,
    title: 'Requirements in the open',
    body: 'Marks, IELTS band, backlogs allowed and intake deadlines on every course, before you spend an application fee.',
  },
  {
    icon: Compass,
    title: 'Guidance, not a brochure',
    body: 'Your dashboard tells you the single next thing to do, whether that is a test booking or a document upload.',
  },
  {
    icon: ShieldCheck,
    title: 'No hidden charges',
    body: 'Discovery, matching and planning are free. You will always know what a service costs before it starts.',
  },
  {
    icon: FileCheck2,
    title: 'Built for Indian students',
    body: 'CBSE percentages, 10-point CGPA, education loans and rupee budgets are first-class inputs, not conversions you do yourself.',
  },
];

function WhyOrbitwise() {
  const reduce = useReducedMotion();

  return (
    <section className="section-y bg-white">
      <div className="container-page">
        <SectionHeading eyebrow="Why Orbitwise" title="Built to be useful, not impressive" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={inView}
          variants={staggerParent(0.05)}
          className="mt-14 grid grid-cols-1 gap-x-10 gap-y-11 md:grid-cols-2 lg:grid-cols-3"
        >
          {REASONS.map((reason) => (
            <motion.div key={reason.title} variants={resolve(fadeUp, reduce)}>
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <reason.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-navy-950">{reason.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-500">{reason.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── FAQ ───────────────────────────────────────────────────────────────── */

const FAQS = [
  {
    q: 'I have just finished Class 12. Can I use Orbitwise?',
    a: 'Yes — that is one of the two journeys the product is built around. Tell us you have completed Class 12 and you will see bachelor’s degrees, diplomas and foundation years, with the marks each one needs. Master’s programmes are hidden because you are not eligible for them yet, and showing them would waste your time.',
  },
  {
    q: 'I am still studying in Class 12. Is it too early?',
    a: 'It is the right time. Universities issue conditional offers against predicted grades, which convert to unconditional offers when your marksheet arrives. Courses reachable this way are labelled as conditional so you know what is still outstanding.',
  },
  {
    q: 'How is the match score calculated?',
    a: 'Seven weighted factors: academic fit, budget, English requirement, destination preference, course fit, intake timing and admission likelihood. Every course shows its own breakdown, including the factors it could not score because your profile is incomplete.',
  },
  {
    q: 'Do I need an IELTS score before I start?',
    a: 'No. Without one you still get matched — the English factor is simply marked unscored, and each course shows the band it asks for so you know your target before you book the test.',
  },
  {
    q: 'What does it cost?',
    a: 'Discovery, profile building, matching, shortlisting and cost planning are free. Counselling sessions are free to book. Nothing is charged without being stated first.',
  },
  {
    q: 'Are the tuition figures exact?',
    a: 'They are indicative planning figures converted to rupees at a fixed rate, so comparisons stay stable and reproducible. Always confirm the current fee with the university before you apply.',
  },
];

function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="section-y">
      <div className="container-page">
        <SectionHeading eyebrow="FAQ" title="Questions students actually ask" />

        <div className="mx-auto mt-12 max-w-3xl divide-y divide-navy-100 overflow-hidden rounded-2xl bg-surface shadow-sm hairline">
          {FAQS.map((faq, index) => {
            const isOpen = open === index;
            return (
              <div key={faq.q}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? -1 : index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${index}`}
                    className="flex w-full items-start justify-between gap-5 px-5 py-5 text-left transition-colors duration-150 hover:bg-navy-50 md:px-6"
                  >
                    <span className="text-[0.9375rem] font-semibold text-navy-950">{faq.q}</span>
                    <ChevronDown
                      className={cn(
                        'mt-0.5 size-5 shrink-0 text-navy-400 transition-transform duration-200',
                        isOpen && 'rotate-180'
                      )}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                {/* Kept in the DOM and hidden, so browser find-in-page and
                    search-engine crawlers can still reach the answers. */}
                <div id={`faq-panel-${index}`} hidden={!isOpen} className="px-5 pb-5 md:px-6">
                  <p className="max-w-2xl text-sm leading-relaxed text-navy-600">{faq.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ─────────────────────────────────────────────────────────── */

function FinalCta() {
  const reduce = useReducedMotion();

  return (
    <section className="section-y bg-white">
      <div className="container-page">
        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={inView}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl bg-navy-950 px-6 py-14 text-center md:px-16 md:py-20"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-20 size-80 rounded-full bg-primary-600/25 blur-3xl"
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-display text-3xl leading-tight font-semibold tracking-[-0.03em] text-white md:text-display-sm">
              Find out where you actually stand
            </h2>
            <p className="mt-4 text-base leading-relaxed text-navy-300 md:text-lg">
              Build your profile in about two minutes and see your matched courses, total costs and next steps — free,
              with no obligation to apply anywhere.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
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
                Talk to a counsellor
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function Home() {
  const { data, isError, error, refetch } = useQuery(() => publicService.home(), []);

  return (
    <>
      <Hero stats={data?.stats} />
      <Stats stats={data?.stats} />
      <HowItWorks />

      {isError ? (
        <div className="container-page section-y">
          <ErrorState
            error={error}
            onRetry={refetch}
            title="Couldn’t load destinations"
            // The static sections above still render, so this failure is scoped
            // to the data-driven part of the page rather than blanking it.
          />
        </div>
      ) : (
        <>
          <Destinations destinations={data?.destinations} />
          <FeaturedUniversities universities={data?.universities} />
        </>
      )}

      <OrbitMatchExplainer />
      <WhyOrbitwise />
      {!isError && <Stories testimonials={data?.testimonials} />}
      <Faq />
      <FinalCta />
    </>
  );
}
