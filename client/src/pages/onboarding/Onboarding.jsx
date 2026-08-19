import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';

import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import ProgressRing from '../../components/ui/ProgressRing.jsx';
import Stepper from '../../components/ui/Stepper.jsx';
import Logo from '../../components/shared/Logo.jsx';
import RouteLoader from '../../routes/RouteLoader.jsx';

import EducationStep from './steps/EducationStep.jsx';
import GoalStep from './steps/GoalStep.jsx';
import DestinationStep from './steps/DestinationStep.jsx';
import BudgetStep from './steps/BudgetStep.jsx';
import EnglishStep from './steps/EnglishStep.jsx';
import { STEPS, INITIAL_VALUES, patchForStep, validateStep, valuesFromProfile } from './wizardSteps.js';

import useQuery from '../../hooks/useQuery.js';
import studentService from '../../services/studentService.js';
import catalogueService from '../../services/catalogueService.js';
import { PATHS } from '../../constants/routes.js';
import { fadeUp, resolve } from '../../utils/motion.js';

const STEP_COMPONENTS = {
  education: EducationStep,
  goal: GoalStep,
  destinations: DestinationStep,
  budget: BudgetStep,
  english: EnglishStep,
};

/**
 * Translation from the API's dotted field paths to this form's field names.
 *
 * Client validation mirrors the server's, so these should rarely fire — but when
 * they do, the error belongs under the input that caused it rather than in a banner
 * that leaves the student hunting. Anything unmapped falls back to the banner.
 */
const SERVER_FIELD_MAP = {
  'education.level': 'educationLevel',
  'education.secondaryMarks.value': 'marksValue',
  'education.tertiaryMarks.value': 'marksValue',
  'education.yearOfCompletion': 'yearOfCompletion',
  'education.backlogs': 'backlogs',
  'goal.degreeLevel': 'degreeLevel',
  'goal.fields': 'fields',
  'goal.intake.season': 'intakeSeason',
  'goal.intake.year': 'intakeYear',
  destinations: 'destinations',
  'budget.annualInr': 'budgetAnnualInr',
  'budget.fundingSource': 'fundingSource',
  'english.test': 'englishTest',
  'english.overall': 'englishOverall',
};

/**
 * The five-step profile wizard.
 *
 * Each step saves on its way out rather than the whole form saving at the end. A
 * student interrupted at step three keeps steps one and two, and — more usefully —
 * the server answers each save with its eligibility ruling, so step two can offer
 * only the qualifications the level entered in step one actually permits.
 *
 * `mode="profile"` reuses the same component to edit a finished profile, with every
 * step unlocked. One implementation: a separate editor would drift from the wizard
 * within a release, and the two have identical rules.
 */
export default function Onboarding({ mode = 'onboarding' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reduce = useReducedMotion();

  const isEditing = mode === 'profile';

  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [stepIndex, setStepIndex] = useState(() => {
    const requested = Number(searchParams.get('step'));
    return Number.isInteger(requested) && requested >= 1 && requested <= STEPS.length ? requested - 1 : 0;
  });

  const options = useQuery((signal) => catalogueService.getOptions(signal), []);
  const summaryQuery = useQuery((signal) => studentService.getProfile(signal), []);
  const [summary, setSummary] = useState(null);

  // The profile is the seed for the form, not its owner — after the first load the
  // form is authoritative, so a later save never stomps what is being typed.
  useEffect(() => {
    if (summaryQuery.data && !summary) {
      setSummary(summaryQuery.data);
      setValues(valuesFromProfile(summaryQuery.data.profile));
    }
  }, [summaryQuery.data, summary]);

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  /** What the server currently rules this student eligible for. */
  const eligibility = useMemo(() => {
    const guidance = summary?.guidance;
    if (!guidance?.known) return null;

    const routes = {};
    for (const level of guidance.eligibleDegreeLevels ?? []) routes[level] = 'direct';
    for (const level of guidance.conditionalDegreeLevels ?? []) routes[level] = 'conditional';
    for (const level of guidance.futureDegreeLevels ?? []) routes[level] = 'future';

    return {
      levels: summary.eligibleDegreeLevels ?? [],
      routes,
      note: guidance.note,
      educationLevel: summary.profile?.education?.level,
    };
  }, [summary]);

  const set = (field, value) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    // Clearing on edit means an error never outlives the thing it described.
    setErrors((previous) => (previous[field] ? { ...previous, [field]: undefined } : previous));
  };

  const applyServerFieldErrors = (error) => {
    const mapped = {};
    let unmapped = false;

    for (const [path, message] of Object.entries(error.errors ?? {})) {
      const field = SERVER_FIELD_MAP[path];
      if (field) mapped[field] = message;
      else unmapped = true;
    }

    setErrors(mapped);
    setFormError(unmapped || Object.keys(mapped).length === 0 ? error.message : null);
  };

  const saveStep = async (targetIndex) => {
    const { ok, errors: stepErrors } = validateStep(stepIndex, values);
    if (!ok) {
      setErrors(stepErrors);
      setFormError(null);
      return false;
    }

    setSaving(true);
    setFormError(null);

    try {
      const updated = await studentService.updateProfile(patchForStep(stepIndex, values));
      setSummary(updated);
      setErrors({});

      if (targetIndex != null) {
        setStepIndex(targetIndex);
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      }
      return true;
    } catch (error) {
      applyServerFieldErrors(error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (isLastStep) {
      const saved = await saveStep(null);
      if (!saved) return;

      if (isEditing) {
        toast.success('Profile updated — your matches have been rescored');
        return;
      }
      toast.success('Profile complete. Here are your matches.');
      navigate(PATHS.studentHome, { replace: true });
      return;
    }

    await saveStep(stepIndex + 1);
  };

  /** Jumping backwards must never lose the current step's edits. */
  const handleStepSelect = async (index) => {
    if (index === stepIndex) return;
    await saveStep(index);
  };

  if (summaryQuery.isLoading && !summary) return <RouteLoader />;

  if (summaryQuery.isError) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20">
        <ErrorState error={summaryQuery.error} onRetry={summaryQuery.refetch} />
      </div>
    );
  }

  const StepComponent = STEP_COMPONENTS[step.id];
  const completion = summary?.completion?.percent ?? 0;

  const body = (
    <>
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-2xs font-semibold tracking-wide text-primary-600 uppercase">
            Step {stepIndex + 1} of {STEPS.length} · {step.title}
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-navy-950 sm:text-3xl">
            {step.headline}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-navy-500">{step.subhead}</p>
        </div>

        <ProgressRing
          value={completion}
          size="lg"
          suffix="%"
          className="hidden shrink-0 text-primary-600 sm:inline-flex"
          label={`Profile ${completion}% complete`}
        />
      </div>

      <Stepper
        steps={STEPS}
        current={stepIndex}
        onStepSelect={handleStepSelect}
        unlockAll={isEditing}
        className="mt-7 border-y border-navy-100 py-3"
      />

      {formError && (
        <Alert tone="danger" title="That didn’t save" className="mt-6">
          {formError}
        </Alert>
      )}

      <motion.div
        key={step.id}
        initial="hidden"
        animate="visible"
        variants={resolve(fadeUp, reduce)}
        className="mt-8"
      >
        <StepComponent
          values={values}
          errors={errors}
          set={set}
          eligibility={eligibility}
          countries={options.data?.countries ?? []}
          isLoading={options.isLoading}
        />
      </motion.div>

      <div className="mt-10 flex items-center justify-between gap-3 border-t border-navy-100 pt-6">
        <Button
          variant="ghost"
          leftIcon={ArrowLeft}
          disabled={stepIndex === 0 || saving}
          onClick={() => handleStepSelect(stepIndex - 1)}
        >
          Back
        </Button>

        <div className="flex items-center gap-3">
          {!isEditing && !isLastStep && (
            <p className="hidden text-xs text-navy-400 sm:block">Saved as you go</p>
          )}
          <Button
            rightIcon={isLastStep ? undefined : ArrowRight}
            leftIcon={isLastStep ? Check : undefined}
            isLoading={saving}
            loadingText="Saving"
            onClick={handleNext}
          >
            {isLastStep ? (isEditing ? 'Save changes' : 'See my matches') : 'Continue'}
          </Button>
        </div>
      </div>
    </>
  );

  // In profile mode the portal shell is already around us; in onboarding mode this
  // is a standalone page and has to bring its own.
  if (isEditing) return <div className="rounded-2xl bg-surface p-6 shadow-sm hairline md:p-8">{body}</div>;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-navy-100 bg-white">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo />
          <p className="flex items-center gap-1.5 text-xs font-medium text-navy-500">
            <Sparkles className="size-3.5 text-primary-500" aria-hidden="true" />
            Powering your OrbitMatch scores
          </p>
        </div>
      </header>

      <main className="container-page max-w-3xl py-10 md:py-14">
        <div className="rounded-2xl bg-surface p-6 shadow-md hairline md:p-9">{body}</div>
      </main>
    </div>
  );
}
