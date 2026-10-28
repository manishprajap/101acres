import type { PropertyFormData } from "@/types/property";

const KEY = "property_draft_v1";

interface Draft {
  data: PropertyFormData;
  step: number;
}

export function loadDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

export function saveDraft(data: PropertyFormData, step: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ data, step }));
  } catch (err) {
    console.error("Draft save failed", err);
  }
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}