import cn from '../../utils/cn.js';

const TONES = {
  neutral: 'bg-navy-100 text-navy-700',
  primary: 'bg-primary-50 text-primary-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700',
  info: 'bg-info-50 text-info-600',
  solid: 'bg-navy-950 text-white',
};

const SIZES = {
  sm: 'h-5 gap-1 px-2 text-2xs',
  md: 'h-6.5 gap-1.5 px-2.5 text-xs',
};

export default function Badge({ tone = 'neutral', size = 'md', icon: Icon, dot = false, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold whitespace-nowrap',
        TONES[tone],
        SIZES[size],
        className
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />}
      {Icon && <Icon className={size === 'sm' ? 'size-3' : 'size-3.5'} aria-hidden="true" />}
      {children}
    </span>
  );
}
