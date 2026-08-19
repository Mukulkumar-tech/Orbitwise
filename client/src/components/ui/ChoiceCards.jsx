import { useId } from 'react';
import { Check } from 'lucide-react';
import cn from '../../utils/cn.js';

/**
 * Card-style radio and checkbox groups — the wizard's main input.
 *
 * Real `<input type="radio">` and `<input type="checkbox">` elements sit behind the
 * cards rather than being replaced by clickable divs. That single decision buys
 * arrow-key navigation within a radio group, space to toggle, form semantics,
 * `aria-describedby` on the group, and correct announcement of "3 of 8 selected" —
 * all of which a div-based version has to reimplement, usually incompletely.
 *
 * Only the visual treatment is custom: `sr-only` hides the control, and
 * `peer-checked` / `peer-focus-visible` restyle the card from the input's real
 * state, so what a sighted user sees is always what assistive tech reports.
 *
 * `options` is `[{ value, label, hint?, meta?, icon? }]`.
 */
export default function ChoiceCards({
  name,
  legend,
  description,
  options = [],
  value,
  onChange,
  multiple = false,
  max,
  columns = 1,
  error,
  disabled = false,
  className,
}) {
  const groupId = useId();
  const errorId = `${groupId}-error`;
  const descriptionId = `${groupId}-description`;

  const selected = multiple ? (Array.isArray(value) ? value : []) : value;
  const isSelected = (optionValue) =>
    multiple ? selected.includes(optionValue) : selected === optionValue;

  /** Order of selection is meaningful for ranked groups (destinations). */
  const rankOf = (optionValue) => (multiple ? selected.indexOf(optionValue) + 1 : 0);

  const atLimit = multiple && max != null && selected.length >= max;

  const handleChange = (optionValue) => {
    if (!multiple) return onChange(optionValue);

    return onChange(
      selected.includes(optionValue)
        ? selected.filter((entry) => entry !== optionValue)
        : // Appending rather than sorting keeps the click order, which the
          // destination scorer reads as the student's preference ranking.
          [...selected, optionValue]
    );
  };

  return (
    <fieldset
      className={cn('w-full', className)}
      aria-describedby={[description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined}
      aria-invalid={error ? true : undefined}
      disabled={disabled}
    >
      {legend && (
        <legend className="mb-1 text-sm font-medium text-navy-800">
          {legend}
          {multiple && max != null && (
            <span className="ml-2 font-normal text-navy-400">
              {selected.length}/{max} selected
            </span>
          )}
        </legend>
      )}

      {description && (
        <p id={descriptionId} className="mb-3 text-xs leading-relaxed text-navy-500">
          {description}
        </p>
      )}

      <div
        className={cn(
          'grid gap-2.5',
          columns === 2 && 'sm:grid-cols-2',
          columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3'
        )}
      >
        {options.map((option) => {
          const checked = isSelected(option.value);
          // A locked-out option is disabled rather than hidden, so the limit is
          // visible instead of silently swallowing a click.
          const blocked = !checked && atLimit;
          const Icon = option.icon;

          return (
            <label
              key={option.value}
              className={cn(
                'group relative flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-3.5',
                'transition-[border-color,background-color,box-shadow] duration-150 ease-out',
                checked
                  ? 'border-primary-500 bg-primary-50/60 ring-1 ring-primary-500/20'
                  : 'border-navy-200 hover:border-navy-300 hover:bg-navy-50/60',
                blocked && 'cursor-not-allowed opacity-45 hover:border-navy-200 hover:bg-white',
                // The focus ring lives on the card because the input itself is sr-only.
                'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary-600'
              )}
            >
              <input
                type={multiple ? 'checkbox' : 'radio'}
                name={name}
                value={option.value}
                checked={checked}
                disabled={disabled || blocked}
                onChange={() => handleChange(option.value)}
                className="sr-only"
              />

              <span
                aria-hidden="true"
                className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center border text-white transition-colors duration-150',
                  multiple ? 'rounded-md' : 'rounded-full',
                  checked ? 'border-primary-600 bg-primary-600' : 'border-navy-300 bg-white'
                )}
              >
                {checked &&
                  (multiple && max != null && selected.length > 1 ? (
                    // In a ranked multi-select the number *is* the information:
                    // destination 1 outscores destination 3.
                    <span className="text-2xs font-bold">{rankOf(option.value)}</span>
                  ) : (
                    <Check className="size-3.5" strokeWidth={3} />
                  ))}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  {Icon && <Icon className="size-4 shrink-0 text-navy-400" aria-hidden="true" />}
                  <span className={cn('text-sm font-semibold', checked ? 'text-primary-900' : 'text-navy-900')}>
                    {option.label}
                  </span>
                </span>
                {option.hint && <span className="mt-0.5 block text-xs leading-relaxed text-navy-500">{option.hint}</span>}
                {option.meta && <span className="mt-1.5 block text-2xs font-medium text-navy-400">{option.meta}</span>}
              </span>
            </label>
          );
        })}
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-danger-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}
