import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Award, MapPin, Users } from 'lucide-react';

import SectionHeading from '../../../components/shared/SectionHeading.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import { PATHS } from '../../../constants/routes.js';
import { fadeUp, inView, resolve, staggerParent } from '../../../utils/motion.js';

export default function FeaturedUniversities({ universities = [] }) {
  const reduce = useReducedMotion();
  if (!universities.length) return null;

  return (
    <section className="section-y bg-white">
      <div className="container-page">
        <SectionHeading
          eyebrow="Universities"
          title="Institutions offering scholarships"
          description="Every one of these has funding available for international students — acceptance rates included, because a ranking alone will not tell you your odds."
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={inView}
          variants={staggerParent(0.06)}
          className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {universities.map((university) => (
            <motion.article key={university.slug} variants={resolve(fadeUp, reduce)}>
              <Link
                to={PATHS.university(university.slug)}
                className="group flex h-full flex-col rounded-2xl bg-canvas p-6 transition-all duration-200 ease-out hairline hover:-translate-y-1 hover:bg-white hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* No logo assets, so an initial-based mark keeps the grid even
                      rather than leaving a broken-image gap. */}
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-navy-950 text-base font-semibold text-white">
                    {university.name
                      .replace(/^(The|University of)\s+/i, '')
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((word) => word[0]?.toUpperCase())
                      .join('')}
                  </span>
                  <Badge tone="primary" size="sm">
                    Scholarships
                  </Badge>
                </div>

                <h3 className="mt-4 text-base leading-snug font-semibold text-navy-950">{university.name}</h3>

                <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-navy-500">
                  <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                  {university.city}
                </p>

                <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-navy-200/70 pt-4 text-sm">
                  <div>
                    <dt className="inline-flex items-center gap-1.5 text-2xs font-semibold tracking-wide text-navy-400 uppercase">
                      <Award className="size-3" aria-hidden="true" />
                      Ranking
                    </dt>
                    <dd className="mt-0.5 font-semibold text-navy-900">
                      {university.worldRanking ? `#${university.worldRanking}` : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline-flex items-center gap-1.5 text-2xs font-semibold tracking-wide text-navy-400 uppercase">
                      <Users className="size-3" aria-hidden="true" />
                      Accepts
                    </dt>
                    <dd className="mt-0.5 font-semibold text-navy-900">
                      {university.acceptanceRate != null ? `${university.acceptanceRate}%` : '—'}
                    </dd>
                  </div>
                </dl>
              </Link>
            </motion.article>
          ))}
        </motion.div>

        <div className="mt-10 flex justify-center">
          <Button as={Link} to={PATHS.universities} variant="outline" rightIcon={ArrowRight}>
            Browse all universities
          </Button>
        </div>
      </div>
    </section>
  );
}
