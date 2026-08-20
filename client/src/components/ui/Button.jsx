import { forwardRef } from 'react';
import cn from '../../utils/cn.js';
import Spinner from './Spinner.jsx';

/**
 * The one button in the product.
 *
 * Every variant already carries hover, active, disabled, loading and focus
 * treatments, so no call site should ever hand-roll a `<button className="bg-...">`
 * — that is how design systems drift.
 */

const VARIANTS = {
  // Navy label rather than white: white on the brand orange measures 2.80:1 and
  // fails AA, while navy on it is 5.54:1. Hover *lightens* because dark-on-light
  // fills gain contrast as the fill lightens (6.87:1 at primary-400).
  primary:
    'bg-primary-500 text-navy-950 shadow-primary hover:bg-primary-400 active:bg-primary-600 disabled:bg-primary-200 disabled:text-navy-500 disabled:shadow-none',
  secondary:
    'bg-navy-950 text-white hover:bg-navy-800 active:bg-navy-900 disabled:bg-navy-300 disabled:text-white/70',
  outline:
    'border border-navy-200 bg-white text-navy-800 hover:border-navy-300 hover:bg-navy-50 active:bg-navy-100 disabled:border-navy-100 disabled:text-navy-300',
  ghost: 'text-navy-600 hover:bg-navy-100 hover:text-navy-900 active:bg-navy-200 disabled:text-navy-300',
  subtle:
    'bg-primary-50 text-primary-800 hover:bg-primary-100 active:bg-primary-200 disabled:bg-navy-50 disabled:text-navy-300',
  danger:
    'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-700 disabled:bg-danger-100 disabled:text-danger-500',
  link: 'text-primary-700 underline-offset-4 hover:text-primary-800 hover:underline disabled:text-navy-300',
};

const SIZES = {
  sm: 'h-9 gap-1.5 px-3.5 text-sm rounded-lg',
  md: 'h-11 gap-2 px-5 text-sm rounded-xl',
  lg: 'h-13 gap-2.5 px-6 text-base rounded-xl',
};

const ICON_SIZES = { sm: 'size-4', md: 'size-4', lg: 'size-5' };

const Button = forwardRef(function Button(
  {
    as: Component = 'button',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    loadingText,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    fullWidth = false,
    disabled = false,
    className,
    children,
    type,
    ...props
  },
  ref
) {
  const isDisabled = disabled || isLoading;
  const iconSize = ICON_SIZES[size];

  return (
    <Component
      ref={ref}
      // A <button> inside a form defaults to type="submit", which silently
      // submits when the author meant a plain click handler.
      type={Component === 'button' ? (type ?? 'button') : type}
      disabled={Component === 'button' ? isDisabled : undefined}
      aria-disabled={Component === 'button' ? undefined : isDisabled || undefined}
      aria-busy={isLoading || undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap',
        'transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600',
        'active:scale-[0.98] disabled:pointer-events-none disabled:active:scale-100',
        variant === 'link' && 'h-auto px-0 active:scale-100',
        variant !== 'link' && SIZES[size],
        VARIANTS[variant],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size={size === 'lg' ? 'md' : 'sm'} />
          {loadingText ?? children}
        </>
      ) : (
        <>
          {LeftIcon && <LeftIcon className={iconSize} aria-hidden="true" />}
          {children}
          {RightIcon && <RightIcon className={iconSize} aria-hidden="true" />}
        </>
      )}
    </Component>
  );
});

export default Button;
