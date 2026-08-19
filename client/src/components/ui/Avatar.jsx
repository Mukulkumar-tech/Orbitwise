import { useState } from 'react';
import cn from '../../utils/cn.js';

const SIZES = {
  xs: 'size-6 text-2xs',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-xl',
};

/** First letter of the first two words — "Aarav Kumar Sharma" → "AK". */
const initialsOf = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

export default function Avatar({ name = '', src, size = 'md', className, ring = false }) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'bg-primary-100 font-semibold text-primary-700 select-none',
        ring && 'ring-2 ring-white',
        SIZES[size],
        className
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={name ? `${name}'s profile photo` : 'Profile photo'}
          // A broken avatar URL falls back to initials rather than a broken-image
          // icon — the most common way a polished UI suddenly looks unfinished.
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initialsOf(name)}</span>
      )}
    </span>
  );
}
