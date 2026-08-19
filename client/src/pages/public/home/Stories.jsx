import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Quote, Star } from 'lucide-react';

import SectionHeading from '../../../components/shared/SectionHeading.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import Avatar from '../../../components/ui/Avatar.jsx';
import { PATHS } from '../../../constants/routes.js';
import { fadeUp, inView, resolve, staggerParent } from '../../../utils/motion.js';

/**
 * Student stories.
 *
 * Each card names where the student *started* — city and previous qualification —
 * not just where they ended up. A reader with 74% in Class 12 needs to find
 * someone who also had 74%, which a destination-only testimonial cannot give them.
 */
export function StoryCard({ story, className }) {
  return (
    <article className={`flex h-full flex-col rounded-2xl bg-surface p-6 shadow-sm hairline ${className ?? ''}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1" aria-label={`${story.rating} out of 5`}>
          {Array.from({ length: story.rating }, (_, index) => (
            <Star key={index} className="size-3.5 fill-warning-500 text-warning-500" aria-hidden="true" />
          ))}
        </div>
        {story.scholarshipPercent > 0 && (
          <Badge tone="success" size="sm">
            {story.scholarshipPercent}% scholarship
          </Badge>
        )}
      </div>

      <Quote className="mt-4 size-6 text-primary-200" aria-hidden="true" />

      <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-navy-700">“{story.quote}”</blockquote>

      <footer className="mt-6 flex items-start gap-3 border-t border-navy-100 pt-5">
        <Avatar name={story.studentName} src={story.avatar} size="md" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-navy-950">{story.studentName}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-navy-500">
            {story.previousQualification}
            {story.fromCity ? ` · ${story.fromCity}` : ''}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-navy-600">
            <span className="font-medium">{story.courseTitle}</span>
            <br />
            {story.universityName} · {story.countryName} · {story.intakeYear}
          </p>
        </div>
      </footer>
    </article>
  );
}

export default function Stories({ testimonials = [] }) {
  const reduce = useReducedMotion();
  if (!testimonials.length) return null;

  return (
    <section className="section-y">
      <div className="container-page">
        <SectionHeading
          eyebrow="Success stories"
          title="Students who started where you are"
          description="Real journeys, including the ones that began with marks below a cut-off or a budget that ruled out the obvious destinations."
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={inView}
          variants={staggerParent(0.07)}
          className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {testimonials.slice(0, 6).map((story) => (
            <motion.div key={`${story.studentName}-${story.intakeYear}`} variants={resolve(fadeUp, reduce)}>
              <StoryCard story={story} />
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-10 flex justify-center">
          <Button as={Link} to={PATHS.successStories} variant="outline" rightIcon={ArrowRight}>
            Read more stories
          </Button>
        </div>
      </div>
    </section>
  );
}
