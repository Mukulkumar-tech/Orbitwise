import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Briefcase, Clock } from 'lucide-react';

import SectionHeading from '../../../components/shared/SectionHeading.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import { PATHS } from '../../../constants/routes.js';
import { formatInr } from '../../../constants/domain.js';
import { fadeUp, inView, resolve, staggerParent } from '../../../utils/motion.js';

/**
 * Destination cards.
 *
 * Each leads with the two numbers that decide a shortlist — annual tuition span
 * and living cost — because "which country" is a budget question long before it
 * is a preference question.
 */
export default function Destinations({ destinations = [] }) {
  const reduce = useReducedMotion();
  if (!destinations.length) return null;

  return (
    <section className="section-y">
      <div className="container-page">
        <SectionHeading
          eyebrow="Destinations"
          title="Pick a country that fits your budget"
          description="Indicative annual costs in rupees, so you can compare eight destinations on the same scale."
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={inView}
          variants={staggerParent(0.06)}
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {destinations.map((country) => (
            <motion.article key={country.code} variants={resolve(fadeUp, reduce)}>
              <Link
                to={PATHS.country(country.slug)}
                className="group flex h-full flex-col rounded-2xl bg-surface p-5 shadow-sm transition-all duration-200 ease-out hairline hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-3xl leading-none" aria-hidden="true">
                    {country.flag}
                  </span>
                  {country.prPathway && (
                    <Badge tone="success" size="sm">
                      PR pathway
                    </Badge>
                  )}
                </div>

                <h3 className="mt-4 text-base font-semibold text-navy-950">{country.name}</h3>

                <dl className="mt-4 space-y-2.5 text-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-navy-500">Tuition / yr</dt>
                    <dd className="font-semibold text-navy-900">
                      {formatInr(country.tuitionRangeInr.min)}–{formatInr(country.tuitionRangeInr.max)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-navy-500">Living / yr</dt>
                    <dd className="font-semibold text-navy-900">{formatInr(country.livingCostPerYearInr)}</dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-wrap gap-3 border-t border-navy-100 pt-4 text-xs text-navy-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="size-3.5" aria-hidden="true" />
                    {country.workRights.hoursPerWeekDuringStudy}h/week
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3.5" aria-hidden="true" />
                    {country.workRights.postStudyWorkYears}y post-study
                  </span>
                </div>

                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600">
                  Explore
                  <ArrowRight
                    className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </motion.article>
          ))}
        </motion.div>

        <div className="mt-10 flex justify-center">
          <Button as={Link} to={PATHS.countries} variant="outline" rightIcon={ArrowRight}>
            Compare all destinations
          </Button>
        </div>
      </div>
    </section>
  );
}
