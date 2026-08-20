import ChoiceCards from '../../../components/ui/ChoiceCards.jsx';
import { SkeletonText } from '../../../components/ui/Skeleton.jsx';
import { formatInr } from '../../../constants/domain.js';

/**
 * Destination preferences, ranked by selection order.
 *
 * Each card carries the two numbers that actually decide this choice — annual
 * living cost and post-study work years — because a student picking "Canada" over
 * "the UK" is choosing between a three-year work permit and a two-year one, and
 * that belongs on the card, not three clicks away.
 */
export default function DestinationStep({ values, errors, set, countries = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="rounded-xl border border-navy-100 p-4">
            <SkeletonText lines={2} />
          </div>
        ))}
      </div>
    );
  }

  const options = countries.map((country) => ({
    value: country.code,
    label: `${country.flag} ${country.name}`,
    hint: country.summary,
    meta: [
      `Living ~${formatInr(country.livingCostPerYearInr)}/yr`,
      country.workRights?.postStudyWorkYears
        ? `${country.workRights.postStudyWorkYears}-year post-study work`
        : null,
      country.prPathway ? 'PR pathway' : null,
    ]
      .filter(Boolean)
      .join(' · '),
  }));

  return (
    <ChoiceCards
      name="destinations"
      legend="Preferred destinations"
      description="Pick up to five in order of preference. The number on each card is its rank — your first choice scores highest, and you can change your mind later."
      options={options}
      value={values.destinations}
      onChange={(value) => set('destinations', value)}
      error={errors.destinations}
      multiple
      max={5}
      columns={2}
    />
  );
}
