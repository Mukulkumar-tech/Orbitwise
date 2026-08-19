import Alert from '../../../components/ui/Alert.jsx';
import ChoiceCards from '../../../components/ui/ChoiceCards.jsx';
import Select from '../../../components/ui/Select.jsx';
import { DEGREE_LEVELS, FIELDS, INTAKE_SEASONS, educationLabel } from '../../../constants/domain.js';

const FIELD_OPTIONS = Object.entries(FIELDS).map(([value, label]) => ({ value, label }));

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 4 }, (_, index) => {
  const year = currentYear + index;
  return { value: String(year), label: String(year) };
});

/**
 * What the student wants to study.
 *
 * The qualification options come from the server's eligibility ruling on the level
 * they just entered, not from the full list. That is the point where the wizard
 * stops being a form and starts being advice: a Class 12 student is never shown a
 * master's to choose and then told later it was impossible.
 */
export default function GoalStep({ values, errors, set, eligibility }) {
  const eligible = eligibility?.levels ?? Object.keys(DEGREE_LEVELS);

  const degreeOptions = eligible.map((value) => ({
    value,
    label: DEGREE_LEVELS[value]?.label ?? value,
    hint: DEGREE_LEVELS[value]?.hint,
    meta: eligibility?.routes?.[value] === 'future' ? 'Opens after your current result' : undefined,
  }));

  return (
    <div className="space-y-7">
      {eligibility?.note && (
        <Alert tone="info" title={`Based on: ${educationLabel(eligibility.educationLevel)}`}>
          {eligibility.note}
        </Alert>
      )}

      <ChoiceCards
        name="degreeLevel"
        legend="What qualification are you aiming for?"
        options={degreeOptions}
        value={values.degreeLevel}
        onChange={(value) => set('degreeLevel', value)}
        error={errors.degreeLevel}
        columns={2}
      />

      <ChoiceCards
        name="fields"
        legend="Subject areas"
        description="Pick up to three. Closely related subjects are scored too, so you will still see data science if you choose computer science."
        options={FIELD_OPTIONS}
        value={values.fields}
        onChange={(value) => set('fields', value)}
        error={errors.fields}
        multiple
        max={3}
        columns={3}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Target intake"
          name="intakeSeason"
          placeholder="Select a month"
          required
          options={INTAKE_SEASONS.map((season) => ({ value: season, label: season }))}
          value={values.intakeSeason}
          onChange={(event) => set('intakeSeason', event.target.value)}
          error={errors.intakeSeason}
          hint="Most destinations run September and January intakes."
        />

        <Select
          label="Intake year"
          name="intakeYear"
          placeholder="Select a year"
          required
          options={YEAR_OPTIONS}
          value={values.intakeYear}
          onChange={(event) => set('intakeYear', event.target.value)}
          error={errors.intakeYear}
          hint="Applications usually open 9–12 months ahead."
        />
      </div>
    </div>
  );
}
