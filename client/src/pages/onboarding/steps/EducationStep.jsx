import { GraduationCap } from 'lucide-react';

import ChoiceCards from '../../../components/ui/ChoiceCards.jsx';
import Input from '../../../components/ui/Input.jsx';
import Select from '../../../components/ui/Select.jsx';
import {
  EDUCATION_LEVELS,
  EDUCATION_LEVEL_ORDER,
  GRADING_SYSTEMS,
  STREAMS,
  marksBasisFor,
} from '../../../constants/domain.js';

const LEVEL_OPTIONS = EDUCATION_LEVEL_ORDER.map((value) => ({
  value,
  label: EDUCATION_LEVELS[value].label,
  hint: EDUCATION_LEVELS[value].hint,
}));

const STREAM_OPTIONS = Object.entries(STREAMS).map(([value, label]) => ({ value, label }));

const SYSTEM_OPTIONS = Object.entries(GRADING_SYSTEMS).map(([value, { label }]) => ({ value, label }));

/** In-progress levels have no final marksheet, so the question changes wording. */
const MARKS_LABEL = {
  class_10: 'Class 10 marks',
  class_11: 'Latest school marks (Class 10 or 11)',
  class_12_pursuing: 'Expected Class 12 marks',
  class_12: 'Class 12 marks',
  diploma: 'Diploma marks',
  bachelors_pursuing: 'Marks so far in your degree',
  bachelors: 'Bachelor’s degree marks',
  masters: 'Master’s degree marks',
};

const currentYear = new Date().getFullYear();

export default function EducationStep({ values, errors, set }) {
  const isTertiary = marksBasisFor(values.educationLevel) === 'tertiary';
  const system = GRADING_SYSTEMS[values.marksSystem] ?? GRADING_SYSTEMS.percentage;

  return (
    <div className="space-y-7">
      <ChoiceCards
        name="educationLevel"
        legend="Your current level"
        options={LEVEL_OPTIONS}
        value={values.educationLevel}
        onChange={(value) => set('educationLevel', value)}
        error={errors.educationLevel}
        columns={2}
      />

      {values.educationLevel && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label={isTertiary ? 'Grading system' : 'Marks system'}
              name="marksSystem"
              options={SYSTEM_OPTIONS}
              value={values.marksSystem}
              onChange={(event) => set('marksSystem', event.target.value)}
              hint="Percentages, CGPA and GPA are all converted the way admissions offices convert them."
            />

            <Input
              label={MARKS_LABEL[values.educationLevel] ?? 'Latest marks'}
              name="marksValue"
              type="number"
              inputMode="decimal"
              step={system.step}
              min={0}
              max={system.max}
              placeholder={system.placeholder}
              value={values.marksValue}
              onChange={(event) => set('marksValue', event.target.value)}
              error={errors.marksValue}
              required
              hint={`Out of ${system.max}. Use your predicted result if you are still studying.`}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Stream"
              name="stream"
              placeholder="Select your stream"
              options={STREAM_OPTIONS}
              value={values.stream}
              onChange={(event) => set('stream', event.target.value)}
              hint="Used to check subject prerequisites."
            />

            <Input
              label={isTertiary ? 'College or university' : 'Board or school'}
              name="boardOrInstitution"
              leftIcon={GraduationCap}
              placeholder={isTertiary ? 'e.g. Delhi University' : 'e.g. CBSE'}
              value={values.boardOrInstitution}
              onChange={(event) => set('boardOrInstitution', event.target.value)}
              optionalLabel
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={
                ['class_11', 'class_12_pursuing', 'bachelors_pursuing'].includes(values.educationLevel)
                  ? 'Expected completion year'
                  : 'Year of completion'
              }
              name="yearOfCompletion"
              type="number"
              inputMode="numeric"
              min={1990}
              max={currentYear + 8}
              placeholder={String(currentYear)}
              value={values.yearOfCompletion}
              onChange={(event) => set('yearOfCompletion', event.target.value)}
              error={errors.yearOfCompletion}
              optionalLabel
            />

            {isTertiary && (
              <Input
                label="Active backlogs"
                name="backlogs"
                type="number"
                inputMode="numeric"
                min={0}
                max={50}
                value={values.backlogs}
                onChange={(event) => set('backlogs', event.target.value)}
                error={errors.backlogs}
                // Most universities publish a hard cap, so this is a gate rather than
                // a penalty — worth being upfront about instead of a surprise later.
                hint="Most universities cap this at 2–5. Entering it honestly keeps your matches real."
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
