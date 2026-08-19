import cn from '../../utils/cn.js';

const SIZES = { xs: 'size-3', sm: 'size-4', md: 'size-5', lg: 'size-6', xl: 'size-8' };

export default function Spinner({ size = 'md', className, label = 'Loading' }) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <svg
        className={cn('animate-spin', SIZES[size], className)}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
        <path
          d="M22 12a10 10 0 0 0-10-10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
