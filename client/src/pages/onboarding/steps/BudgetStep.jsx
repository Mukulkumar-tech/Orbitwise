import { IndianRupee } from 'lucide-react';

import ChoiceCards from '../../../components/ui/ChoiceCards.jsx';
import Input from '../../../components/ui/Input.jsx';
import { FUNDING_SOURCES, formatInr } from '../../../constants/domain.js';

const FUNDING_OPTIONS = Object.entries(FUNDING_SOURCES).map(([value, label]) => ({ value, label }));

/** Common starting points, so the field is not a blank box with no scale. */
const PRESETS = [1_500_000, 2_500_000, 3_500_000, 5_000_000];

export default function BudgetStep({ values, errors, set }) {
  const entered = Number(values.budgetAnnualInr);
  const isValidNumber = Number.isFinite(entered) && entered > 0;

  return (
    <div className="space-y-7">
      <div>
        <Input
          label="Annual budget — tuition and living together"
          name="budgetAnnualInr"
          type="number"
          inputMode="numeric"
          min={100_000}
          step={50_000}
          leftIcon={IndianRupee}
          placeholder="2500000"
          value={values.budgetAnnualInr}
          onChange={(event) => set('budgetAnnualInr', event.target.value)}
          error={errors.budgetAnnualInr}
          required
          // Reading back the figure in lakhs catches the most common input error
          // here by an order of magnitude: 250000 typed for twenty-five lakh.
          hint={
            isValidNumber
              ? `That is ${formatInr(entered)} per year. Living costs alone run ₹7L–₹10.5L depending on the country.`
              : 'Enter the total you can fund each year. Living costs alone run ₹7L–₹10.5L depending on the country.'
          }
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => set('budgetAnnualInr', String(preset))}
              className="rounded-full border border-navy-200 px-3 py-1 text-xs font-semibold text-navy-600 transition-colors duration-150 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
            >
              {formatInr(preset)}
            </button>
          ))}
        </div>
      </div>

      <ChoiceCards
        name="fundingSource"
        legend="How will you fund it?"
        options={FUNDING_OPTIONS}
        value={values.fundingSource}
        onChange={(value) => set('fundingSource', value)}
        error={errors.fundingSource}
        columns={2}
      />

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-navy-200 bg-white p-3.5 transition-colors duration-150 hover:bg-navy-50/60 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary-600">
        <input
          type="checkbox"
          checked={values.needsScholarship}
          onChange={(event) => set('needsScholarship', event.target.checked)}
          className="mt-0.5 size-4.5 shrink-0 rounded border-navy-300 text-primary-600 accent-primary-600"
        />
        <span>
          <span className="block text-sm font-semibold text-navy-900">
            I need a scholarship to make this work
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-navy-500">
            Courses with funding are highlighted, and a scholarship that would close your budget gap is called out
            explicitly rather than assumed.
          </span>
        </span>
      </label>
    </div>
  );
}
