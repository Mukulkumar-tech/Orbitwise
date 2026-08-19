import { forwardRef, useId } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';
import cn from '../../utils/cn.js';

/**
 * Native select, styled to match Input.
 *
 * Native on purpose: a custom listbox would need keyboard navigation, typeahead,
 * scroll containment and screen-reader semantics rebuilt from scratch, and on a
 * phone it would replace the OS picker students already know with something worse.
 *
 * `options` is `[{ value, label, disabled? }]`. Grouping is `[{ label, options }]`.
 */
const Select = forwardRef(function Select(
  {
    label,
    hint,
    error,
    options = [],
    placeholder,
    required = false,
    className,
    containerClassName,
    id: providedId,
    ...props
  },
  ref
) {
  const autoId = useId();
  const id = providedId ?? autoId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  const renderOption = (option) =>
    option.options ? (
      <optgroup key={option.label} label={option.label}>
        {option.options.map((child) => (
          <option key={child.value} value={child.value} disabled={child.disabled}>
            {child.label}
          </option>
        ))}
      </optgroup>
    ) : (
      <option key={option.value} value={option.value} disabled={option.disabled}>
        {option.label}
      </option>
    );

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-navy-800">
          {label}
          {required && (
            <span className="ml-0.5 text-danger-600" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-11 w-full appearance-none rounded-xl border bg-white pr-10 pl-3.5 text-sm text-navy-900',
            'transition-[border-color,box-shadow] duration-150 ease-out',
            'focus:outline-none focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:bg-navy-50 disabled:text-navy-400',
            error
              ? 'border-danger-300 focus:border-danger-500 focus:ring-4 focus:ring-danger-100'
              : 'border-navy-200 hover:border-navy-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-100',
            className
          )}
          {...props}
        >
          {placeholder && (
            // Empty value so `required` treats it as unselected, and disabled so it
            // cannot be chosen again once the student has picked something real.
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(renderOption)}
        </select>

        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-navy-400"
          aria-hidden="true"
        />
      </div>

      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm text-danger-600">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="mt-1.5 text-xs leading-relaxed text-navy-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
});

export default Select;
