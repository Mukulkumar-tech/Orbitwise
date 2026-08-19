import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calculator, Info, TriangleAlert, Wallet } from 'lucide-react';

import PageHero from '../../components/shared/PageHero.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import useQuery from '../../hooks/useQuery.js';
import useDebounce from '../../hooks/useDebounce.js';
import scholarshipService, { toolsService } from '../../services/scholarshipService.js';
import { PATHS } from '../../constants/routes.js';
import { formatInr, formatInrExact } from '../../constants/domain.js';
import cn from '../../utils/cn.js';

const ANNUAL_LINES = [
  ['tuition', 'Tuition'],
  ['accommodation', 'Accommodation'],
  ['food', 'Food'],
  ['transport', 'Transport'],
  ['insurance', 'Health insurance'],
  ['flights', 'Flights'],
  ['other', 'Other'],
];

const ONE_TIME_LINES = [
  ['visa', 'Visa fee'],
  ['setup', 'Setup costs'],
];

const EMPTY = Object.fromEntries([...ANNUAL_LINES, ...ONE_TIME_LINES].map(([key]) => [key, 0]));

/**
 * Study-abroad cost calculator.
 *
 * All arithmetic runs server-side, in the same engine the rest of the platform
 * uses, so the total shown here can never disagree with the total on a course
 * card. The form is purely input collection.
 */
export default function CostCalculator() {
  const [params] = useSearchParams();
  const courseSlug = params.get('course') ?? '';
  const scholarshipSlug = params.get('scholarship') ?? '';

  const [costs, setCosts] = useState(EMPTY);
  const [durationMonths, setDuration] = useState(24);
  const [budget, setBudget] = useState('');
  const [result, setResult] = useState(null);
  const [calcError, setCalcError] = useState(null);

  const { data: prefill, isLoading: loadingPrefill } = useQuery(
    (signal) => toolsService.costPrefill(courseSlug ? { courseSlug } : {}, signal),
    [courseSlug]
  );

  const { data: award } = useQuery(
    (signal) => (scholarshipSlug ? scholarshipService.get(scholarshipSlug, signal) : Promise.resolve(null)),
    [scholarshipSlug],
    { enabled: Boolean(scholarshipSlug) }
  );

  // Seed the form once the server's starting point arrives.
  useEffect(() => {
    if (!prefill) return;
    if (prefill.costs) setCosts({ ...EMPTY, ...prefill.costs });
    if (prefill.durationMonths) setDuration(prefill.durationMonths);
    if (prefill.annualBudgetInr) setBudget(String(prefill.annualBudgetInr));
  }, [prefill]);

  // Debounced so typing a seven-figure number does not fire seven requests.
  const payload = useMemo(
    () => ({
      costs,
      durationMonths,
      ...(budget ? { annualBudgetInr: Number(budget) } : {}),
      ...(scholarshipSlug ? { scholarshipSlug } : {}),
    }),
    [costs, durationMonths, budget, scholarshipSlug]
  );
  const debounced = useDebounce(payload, 400);

  useEffect(() => {
    let cancelled = false;
    toolsService
      .calculateCost(debounced)
      .then((data) => {
        if (!cancelled) {
          setResult(data);
          setCalcError(null);
        }
      })
      .catch((error) => {
        if (!cancelled) setCalcError(error);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const setLine = (key, value) => setCosts((prev) => ({ ...prev, [key]: value === '' ? 0 : Number(value) }));

  return (
    <>
      <PageHero
        eyebrow="Planning tool"
        title="What will it actually cost?"
        description="Tuition is rarely the biggest number. This adds living costs across the full programme, applies a scholarship to tuition only, and compares the total against your budget."
        breadcrumbs={[{ label: 'Home', to: PATHS.home }, { label: 'Cost calculator' }]}
      />

      <div className="container-page py-14 md:py-20">
        {prefill?.course && (
          <Alert tone="info" className="mb-8" title={`Prefilled from ${prefill.course.title}`}>
            {prefill.course.universityName}
            {prefill.course.countryName ? ` · ${prefill.course.countryName}` : ''}. Living costs are indicative — edit any
            line you know better.
          </Alert>
        )}
        {award && (
          <Alert tone="success" className="mb-8" title={`Applying ${award.name}`}>
            {award.provider}. Awards reduce tuition, not total cost — the saving below reflects that.
          </Alert>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
          {/* ─── Inputs ────────────────────────────────────────────── */}
          <section>
            <h2 className="text-lg font-semibold text-navy-950">Your numbers</h2>
            <p className="mt-1.5 text-sm text-navy-500">All figures in rupees.</p>

            {loadingPrefill ? (
              <Skeleton className="mt-6 h-96" rounded="rounded-2xl" />
            ) : (
              <div className="mt-6 space-y-6">
                <div className="rounded-2xl bg-surface p-5 shadow-sm hairline">
                  <h3 className="text-sm font-semibold text-navy-950">Every year</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {ANNUAL_LINES.map(([key, label]) => (
                      <Input
                        key={key}
                        label={label}
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={costs[key] || ''}
                        onChange={(event) => setLine(key, event.target.value)}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-surface p-5 shadow-sm hairline">
                  <h3 className="text-sm font-semibold text-navy-950">Once only</h3>
                  {/* Called out explicitly because charging these every year is the
                      most common way a cost estimate becomes needlessly frightening. */}
                  <p className="mt-1 text-xs text-navy-500">Paid once for the whole journey, not annually.</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {ONE_TIME_LINES.map(([key, label]) => (
                      <Input
                        key={key}
                        label={label}
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={costs[key] || ''}
                        onChange={(event) => setLine(key, event.target.value)}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 rounded-2xl bg-surface p-5 shadow-sm hairline sm:grid-cols-2">
                  <Input
                    label="Programme length (months)"
                    type="number"
                    min="1"
                    max="96"
                    value={durationMonths}
                    onChange={(event) => setDuration(Number(event.target.value) || 1)}
                  />
                  <Input
                    label="Your annual budget"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="Optional"
                    hint="For the affordability check"
                    value={budget}
                    onChange={(event) => setBudget(event.target.value)}
                  />
                </div>
              </div>
            )}
          </section>

          {/* ─── Result ────────────────────────────────────────────── */}
          <section className="lg:sticky lg:top-24 lg:self-start">
            <h2 className="text-lg font-semibold text-navy-950">Estimate</h2>

            {calcError && <ErrorState className="mt-6" size="sm" error={calcError} />}

            {!result && !calcError && <Skeleton className="mt-6 h-80" rounded="rounded-2xl" />}

            {result && (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-navy-950 p-6">
                  <p className="text-2xs font-semibold tracking-wide text-navy-400 uppercase">
                    Total for {result.years} year{result.years === 1 ? '' : 's'}
                  </p>
                  <p className="mt-2 font-display text-4xl font-semibold tracking-[-0.02em] text-white">
                    {formatInr(result.netTotal)}
                  </p>
                  <p className="mt-1 font-mono text-xs text-navy-400">{formatInrExact(result.netTotal)}</p>

                  {result.scholarship.applies && (
                    <p className="mt-4 rounded-xl bg-success-500/15 px-3 py-2 text-sm text-success-300">
                      Scholarship saves {formatInr(result.scholarship.total)} ({result.savedPercent}% of total) —{' '}
                      {result.scholarship.describes}
                    </p>
                  )}

                  <dl className="mt-6 space-y-2.5 border-t border-white/10 pt-5 text-sm">
                    {[
                      ['First year (incl. one-off costs)', result.firstYear],
                      ['Each later year', result.laterYear],
                      ['Monthly living cost', result.monthlyLiving],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-3">
                        <dt className="text-navy-400">{label}</dt>
                        <dd className="font-semibold text-white">{formatInr(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Affordability: a shortfall per year, not a verdict. */}
                {result.budget?.known && (
                  <div
                    className={cn(
                      'flex items-start gap-3 rounded-2xl p-5',
                      result.budget.withinBudget ? 'bg-success-50' : 'bg-warning-50'
                    )}
                  >
                    {result.budget.withinBudget ? (
                      <Wallet className="mt-0.5 size-5 shrink-0 text-success-600" aria-hidden="true" />
                    ) : (
                      <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning-600" aria-hidden="true" />
                    )}
                    <div>
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          result.budget.withinBudget ? 'text-success-800' : 'text-warning-800'
                        )}
                      >
                        {result.budget.withinBudget
                          ? `Within budget — uses ${result.budget.usedPercent}% of it`
                          : `${formatInr(result.budget.gapPerYear)} short per year`}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-navy-600">
                        {result.budget.withinBudget
                          ? 'This plan fits what you said you can spend.'
                          : `Total shortfall ${formatInr(result.budget.gap)}. A larger scholarship, a cheaper city, or a shorter programme would close it.`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl bg-surface p-5 shadow-sm hairline">
                  <h3 className="text-sm font-semibold text-navy-950">Breakdown</h3>
                  <dl className="mt-4 divide-y divide-navy-100 text-sm">
                    {ANNUAL_LINES.filter(([key]) => result.breakdown.annual[key] > 0).map(([key, label]) => (
                      <div key={key} className="flex justify-between gap-3 py-2">
                        <dt className="text-navy-500">
                          {label} <span className="text-xs text-navy-400">× {result.years}</span>
                        </dt>
                        <dd className="font-medium text-navy-800">
                          {formatInr(result.breakdown.annual[key] * result.years)}
                        </dd>
                      </div>
                    ))}
                    {ONE_TIME_LINES.filter(([key]) => result.breakdown.oneTime[key] > 0).map(([key, label]) => (
                      <div key={key} className="flex justify-between gap-3 py-2">
                        <dt className="text-navy-500">
                          {label} <span className="text-xs text-navy-400">once</span>
                        </dt>
                        <dd className="font-medium text-navy-800">{formatInr(result.breakdown.oneTime[key])}</dd>
                      </div>
                    ))}
                    <div className="flex justify-between gap-3 py-2.5">
                      <dt className="font-semibold text-navy-900">Gross total</dt>
                      <dd className="font-semibold text-navy-900">{formatInr(result.grossTotal)}</dd>
                    </div>
                    {result.scholarship.applies && (
                      <div className="flex justify-between gap-3 py-2.5">
                        <dt className="font-semibold text-success-700">Less scholarship</dt>
                        <dd className="font-semibold text-success-700">−{formatInr(result.scholarship.total)}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <p className="flex items-start gap-2 text-xs leading-relaxed text-navy-500">
                  <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  Indicative planning figures. Confirm current fees with the university and current visa costs with the
                  consulate before committing.
                </p>
              </div>
            )}
          </section>
        </div>

        <div className="mt-14 flex flex-wrap justify-center gap-3">
          <Button as={Link} to={PATHS.scholarships} variant="outline" leftIcon={Calculator}>
            Find a scholarship to apply
          </Button>
        </div>
      </div>
    </>
  );
}
