'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useState replacement that persists form data to sessionStorage.
 * Data survives page refresh but clears when the tab is closed.
 *
 * @param {string} key   Unique key for this form (e.g. 'product-create', 'category-edit-5')
 * @param {*}      initial  Default state (used when no draft exists)
 * @returns {[any, Function, Function]}  [state, setState, clearDraft]
 */
export function useFormDraft(key, initial) {
  const storageKey = `form-draft:${key}`;
  const initialized = useRef(false);

  const [state, setState] = useState(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return initial;
  });

  // Persist to sessionStorage on every change (skip initial mount)
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state, storageKey]);

  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [storageKey]);

  return [state, setState, clearDraft];
}
