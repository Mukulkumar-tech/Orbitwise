import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';

import PageHero from '../../components/shared/PageHero.jsx';
import Button from '../../components/ui/Button.jsx';
import NotFound from '../NotFound.jsx';
import { CONTENT, TEST_PREP_KEYS } from './content.js';
import { PATHS } from '../../constants/routes.js';

/**
 * Renders one guidance page from the content map.
 *
 * `contentKey` is passed for fixed routes; the `:test` param drives the three
 * test-prep routes. An unknown key renders the 404 rather than an empty shell,
 * so a mistyped URL behaves like every other bad route on the site.
 */
export default function ContentPage({ contentKey }) {
  const { test } = useParams();
  const key = contentKey ?? test;
  const content = CONTENT[key];

  if (!content) return <NotFound />;

  const isTestPrep = TEST_PREP_KEYS.includes(content.key);

  return (
    <>
      <PageHero
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        breadcrumbs={[{ label: 'Home', to: PATHS.home }, { label: content.eyebrow }]}
      >
        {isTestPrep && (
          <div className="flex flex-wrap gap-2">
            {TEST_PREP_KEYS.map((prep) => (
              <Link
                key={prep}
                to={PATHS.testPrep(prep)}
                aria-current={prep === content.key ? 'page' : undefined}
                className={
                  prep === content.key
                    ? 'rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy-950'
                    : 'rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-navy-200 ring-1 ring-white/15 transition-colors hover:bg-white/20'
                }
              >
                {prep.toUpperCase()}
              </Link>
            ))}
          </div>
        )}
      </PageHero>

      <div className="container-page py-14 md:py-20">
        <div className="mx-auto max-w-3xl">
          {content.sections.map((section) => (
            <section key={section.heading} className="mt-12 first:mt-0">
              <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-950">
                {section.heading}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-navy-600">{section.body}</p>

              {section.list && (
                <ul className="mt-6 space-y-3">
                  {section.list.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-navy-700">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary-700" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {content.faqs?.length > 0 && (
            <section className="mt-16 border-t border-navy-200 pt-12">
              <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-950">
                Common questions
              </h2>
              <dl className="mt-6 space-y-7">
                {content.faqs.map((faq) => (
                  <div key={faq.q}>
                    <dt className="text-[0.9375rem] font-semibold text-navy-950">{faq.q}</dt>
                    <dd className="mt-2 text-sm leading-relaxed text-navy-600">{faq.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section className="mt-16 rounded-2xl bg-primary-50 px-6 py-10 text-center">
            <h2 className="font-display text-xl font-semibold text-navy-950">
              See what this means for your profile
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-navy-600">
              Build a free profile and Orbitwise shows the courses you qualify for, what each one costs in total, and
              exactly what is still missing.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button as={Link} to={PATHS.register} rightIcon={ArrowRight}>
                Find my course
              </Button>
              <Button as={Link} to={PATHS.contact} variant="outline">
                Book free counselling
              </Button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
