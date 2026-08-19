import ChoiceCards from '../../../components/ui/ChoiceCards.jsx';
import Input from '../../../components/ui/Input.jsx';
import { ENGLISH_TESTS, testTakesScore } from '../../../constants/domain.js';

/** Tests first, then the two "not yet" answers — which are real answers here. */
const TEST_OPTIONS = ['ielts', 'pte', 'toefl', 'duolingo', 'planned', 'none'].map((value) => {
  const test = ENGLISH_TESTS[value];
  return {
    value,
    label: test.label,
    hint: test.range ? `Scored ${test.range[0]}–${test.range[1]}` : undefined,
  };
});

/**
 * English test status.
 *
 * "Not taken yet" is a first-class answer rather than a dead end: it scores at
 * partial credit and turns into a next step ("book a test, target 6.5") instead of
 * blocking the student out of their own recommendations.
 */
export default function EnglishStep({ values, errors, set }) {
  const test = ENGLISH_TESTS[values.englishTest];
  const needsScore = testTakesScore(values.englishTest);

  return (
    <div className="space-y-7">
      <ChoiceCards
        name="englishTest"
        legend="Which test have you taken?"
        options={TEST_OPTIONS}
        value={values.englishTest}
        onChange={(value) => set('englishTest', value)}
        error={errors.englishTest}
        columns={2}
      />

      {needsScore && (
        <Input
          label={`${test.label} overall score`}
          name="englishOverall"
          type="number"
          inputMode="decimal"
          step={test.step}
          min={test.range[0]}
          max={test.range[1]}
          placeholder={test.placeholder}
          value={values.englishOverall}
          onChange={(event) => set('englishOverall', event.target.value)}
          error={errors.englishOverall}
          required
          // Every test is compared as an IELTS equivalent, so students who took PTE
          // or TOEFL are not quietly disadvantaged against an IELTS requirement.
          hint="Whatever you took is converted to its IELTS equivalent before matching."
        />
      )}

      {values.englishTest === 'planned' && (
        <p className="rounded-xl bg-info-50 px-4 py-3 text-sm leading-relaxed text-info-600">
          Book your test 3–4 months before your intake. Most courses ask for IELTS 6.0–6.5; nursing, teaching and law
          usually require 7.0. Your matches will improve the moment you add a score.
        </p>
      )}

      {values.englishTest === 'none' && (
        <p className="rounded-xl bg-warning-50 px-4 py-3 text-sm leading-relaxed text-warning-700">
          You can plan everything else first — but no destination on this list issues a student visa without proof of
          English, so this becomes the critical path about four months before your intake.
        </p>
      )}
    </div>
  );
}
