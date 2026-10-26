import { useEffect, useState } from 'react';

/**
 * useLocalStorage — state that survives a page reload (NFR: reliability).
 * `legacyKey` lets data saved by the hackathon version (vibetracker.*) carry over.
 */
export function useLocalStorage(key, initialValue, { legacyKey, migrate } = {}) {
  const [value, setValue] = useState(() => {
    try {
      let raw = window.localStorage.getItem(key);
      if (raw == null && legacyKey) {
        const old = window.localStorage.getItem(legacyKey);
        if (old != null) {
          const parsed = JSON.parse(old);
          return migrate ? migrate(parsed) : parsed;
        }
      }
      if (raw == null) return typeof initialValue === 'function' ? initialValue() : initialValue;
      const parsed = JSON.parse(raw);
      return migrate ? migrate(parsed) : parsed;
    } catch {
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or blocked (private mode): keep working in memory */
    }
  }, [key, value]);

  return [value, setValue];
}
