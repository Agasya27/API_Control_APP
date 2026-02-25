import { useEffect, useMemo, useState } from 'react';

export function usePersistentState<T>(key: string, initialValue: T) {
  const safeInitialValue = useMemo(() => initialValue, [initialValue]);

  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return safeInitialValue;
    }

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        return safeInitialValue;
      }
      return JSON.parse(raw) as T;
    } catch {
      return safeInitialValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore persistence errors (quota/private mode) and continue with in-memory state.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
