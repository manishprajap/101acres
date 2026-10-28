// utils/storage.js
// Small wrapper around localStorage so every step can save/load its own
// slice of the "post property" form, plus a helper for the whole object.

const STORAGE_KEY = "99acres_property_draft";

const isBrowser = () => typeof window !== "undefined";

/** Read the full draft object from localStorage. */
export function loadDraft() {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error("Failed to read draft from localStorage:", err);
    return {};
  }
}

/** Overwrite the full draft object in localStorage. */
export function saveDraft(draft) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch (err) {
    console.error("Failed to write draft to localStorage:", err);
  }
}

/** Merge a partial update (e.g. one step's fields) into the saved draft. */
export function updateDraft(partial) {
  const current = loadDraft();
  const next = { ...current, ...partial };
  saveDraft(next);
  return next;
}

/** Clear the draft entirely (e.g. after final submit). */
export function clearDraft() {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear draft from localStorage:", err);
  }
}

export const STORAGE_KEY_NAME = STORAGE_KEY;
