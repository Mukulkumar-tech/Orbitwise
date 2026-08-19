import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names, resolving Tailwind conflicts in favour of the last value.
 *
 * This is what lets every UI primitive accept a `className` override without
 * specificity fights: cn('px-4 py-2', className) with className='px-6' yields
 * 'py-2 px-6', not both padding values racing in the stylesheet.
 */
export const cn = (...inputs) => twMerge(clsx(inputs));

export default cn;
