import { Check } from 'lucide-react';
import cn from '../../utils/cn.js';

/**
 * Horizontal step indicator for the onboarding wizard.
 *
 * Completed steps are buttons and future steps are not: letting a student jump
 * back to fix their marks is essential, while jumping forward past a required
 * answer produces a step that cannot validate. The current step is marked with
 * `aria-current="step"` so a screen reader announces position without relying on
 * the visual treatment.
 */
export default function Stepper({ steps = [], current = 0, onStepSelect, unlockAll = false, className }) {
  return (
    <nav aria-label="Profile setup progress" className={className}>
      <ol className="flex items-center gap-1.5 sm:gap-2">
        {steps.map((step, index) => {
          const isComplete = index < current;
          const isCurrent = index === current;
          // `unlockAll` is for editing a finished profile, where every step is a
          // valid destination rather than a step not yet reached.
          const canNavigate = Boolean(onStepSelect) && (unlockAll || isComplete);

          const Node = canNavigate ? 'button' : 'div';

          return (
            <li key={step.title} className="flex flex-1 items-center gap-1.5 sm:gap-2">
              <Node
                {...(canNavigate ? { type: 'button', onClick: () => onStepSelect(index) } : {})}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Step ${index + 1} of ${steps.length}: ${step.title}${isComplete ? ' (completed)' : ''}`}
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors duration-150',
                  canNavigate && 'hover:bg-navy-50'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-150',
                    isComplete && 'bg-primary-500 text-navy-950',
                    isCurrent && 'bg-primary-100 text-primary-700 ring-2 ring-primary-500',
                    !isComplete && !isCurrent && 'bg-navy-100 text-navy-400'
                  )}
                >
                  {isComplete ? <Check className="size-3.5" strokeWidth={3} /> : index + 1}
                </span>

                <span
                  className={cn(
                    'hidden truncate text-xs font-semibold sm:block',
                    isCurrent ? 'text-navy-900' : isComplete ? 'text-navy-600' : 'text-navy-400'
                  )}
                >
                  {step.title}
                </span>
              </Node>

              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn('h-px w-2 shrink-0 sm:w-4', isComplete ? 'bg-primary-300' : 'bg-navy-200')}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
