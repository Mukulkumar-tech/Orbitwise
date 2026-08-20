import { forwardRef, useId, useState } from 'react';
import { AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import cn from '../../utils/cn.js';

/**
 * Text input with label, hint, error and success states wired to real ARIA.
 *
 * The error message is linked via aria-describedby and aria-invalid, so a screen
 * reader announces *why* a field was rejected rather than just that it is
 * focused. Password fields get a show/hide toggle for free.
 */
const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    success,
    type = 'text',
    leftIcon: LeftIcon,
    required = false,
    optionalLabel = false,
    className,
    containerClassName,
    id: providedId,
    ...props
  },
  ref
) {
  const autoId = useId();
  const id = providedId ?? autoId;
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === 'password';
  const resolvedType = isPassword && revealed ? 'text' : type;

  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <label htmlFor={id} className="text-sm font-medium text-navy-800">
            {label}
            {required && (
              <span className="ml-0.5 text-danger-700" aria-hidden="true">
                *
              </span>
            )}
          </label>
          {optionalLabel && !required && <span className="text-xs text-navy-400">Optional</span>}
        </div>
      )}

      <div className="relative">
        {LeftIcon && (
          <LeftIcon
            className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-navy-400"
            aria-hidden="true"
          />
        )}

        <input
          ref={ref}
          id={id}
          type={resolvedType}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-navy-900',
            'transition-[border-color,box-shadow] duration-150 ease-out',
            'placeholder:text-navy-400',
            'focus:outline-none focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:bg-navy-50 disabled:text-navy-400',
            LeftIcon && 'pl-10.5',
            (isPassword || success) && 'pr-10.5',
            error
              ? 'border-danger-300 focus:border-danger-500 focus:ring-4 focus:ring-danger-100'
              : success
                ? 'border-success-300 focus:border-success-500 focus:ring-4 focus:ring-success-100'
                : 'border-navy-200 hover:border-navy-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-100',
            className
          )}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((prev) => !prev)}
            // The label changes with state so a screen reader announces the
            // action available now, not the one already taken.
            aria-label={revealed ? 'Hide password' : 'Show password'}
            className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-navy-400 transition-colors duration-150 hover:bg-navy-50 hover:text-navy-700"
          >
            {revealed ? <EyeOff className="size-4.5" aria-hidden="true" /> : <Eye className="size-4.5" aria-hidden="true" />}
          </button>
        )}

        {success && !isPassword && (
          <Check className="absolute top-1/2 right-3.5 size-4.5 -translate-y-1/2 text-success-700" aria-hidden="true" />
        )}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm text-danger-700">
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

export default Input;
