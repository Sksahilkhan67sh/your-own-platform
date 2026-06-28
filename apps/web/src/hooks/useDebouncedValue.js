import { useState, useEffect } from 'react';

/**
 * Returns a debounced copy of `value`, updating only after `delayMs` of
 * no further changes. Used for the search box and price/area filter
 * inputs so we don't fire an API request on every keystroke.
 */
export function useDebouncedValue(value, delayMs = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
