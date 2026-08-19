import { useEffect, useState } from 'react';

/**
 * Returns `value` after it has stopped changing for `delay` ms.
 *
 * Used for search boxes and the cost calculator, where every keystroke would
 * otherwise be a request — typing a seven-figure tuition figure would fire seven
 * of them, and they can land out of order.
 *
 * Objects work as long as the caller memoizes them; an inline literal changes
 * identity every render and would never settle.
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default useDebounce;
