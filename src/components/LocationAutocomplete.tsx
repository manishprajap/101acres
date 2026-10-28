// src/components/LocationAutocomplete.tsx
"use client";

import { useEffect, useRef, useState } from "react";

export interface PlaceSuggestion {
  id: string;
  label: string;
  secondary: string;
  typeLabel: "City" | "Locality" | "Place";
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  /** Suggestion select hone par call hota hai */
  onSelect?: (suggestion: PlaceSuggestion) => void;
  /** "city" = sirf cities, "locality" = city ke andar ke areas */
  mode?: "city" | "locality";
  /** mode="locality" mein selected city bhejo */
  city?: string;
  placeholder?: string;
  /** Agar frontend alag origin par hai (Ionic/Capacitor) to full base URL do */
  apiBaseUrl?: string;
  disabled?: boolean;
}

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

const styles = {
  wrapper: { position: "relative", width: "100%" } as const,
  input: {
    width: "100%",
    height: 48,
    padding: "0 16px",
    fontSize: 14,
    border: "1px solid #d9dee7",
    borderRadius: 12,
    outline: "none",
    background: "#fff",
    boxSizing: "border-box",
  } as const,
  dropdown: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    right: 0,
    zIndex: 50,
    margin: 0,
    padding: 0,
    listStyle: "none",
    background: "#fff",
    border: "1px solid #e4e8ef",
    borderRadius: 12,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
    maxHeight: 320,
    overflowY: "auto",
  } as const,
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 16px",
    fontSize: 14,
    cursor: "pointer",
    borderBottom: "1px solid #f0f2f6",
  } as const,
  itemActive: { background: "#f4f7fb" } as const,
  main: { color: "#111827" } as const,
  secondary: { color: "#6b7280", fontSize: 12, marginLeft: 6 } as const,
  badge: { color: "#6b7280", fontSize: 13, whiteSpace: "nowrap" } as const,
  status: { padding: "12px 16px", fontSize: 13, color: "#6b7280" } as const,
};

export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  mode = "city",
  city = "",
  placeholder,
  apiBaseUrl = "",
  disabled = false,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const skipNextFetch = useRef(false);

  // Bahar click karne par dropdown band
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced fetch
  useEffect(() => {
    // Suggestion select karne ke baad dobara fetch mat karo
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }

    const query = value.trim();

    if (query.length < MIN_CHARS) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams({ q: query, mode });
        if (mode === "locality" && city.trim()) {
          params.set("city", city.trim());
        }

        const response = await fetch(
          `${apiBaseUrl}/api/places/autocomplete?${params.toString()}`,
          { signal: controller.signal }
        );

        const data = await response.json();

        const list: PlaceSuggestion[] = Array.isArray(data?.suggestions)
          ? data.suggestions
          : [];

        setSuggestions(list);
        setActiveIndex(-1);
        setOpen(true);
      } catch (error) {
        if (!(error instanceof Error && error.name === "AbortError")) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, mode, city, apiBaseUrl]);

  function handleSelect(suggestion: PlaceSuggestion) {
    skipNextFetch.current = true;
    onChange(suggestion.label);
    onSelect?.(suggestion);
    setOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const showEmpty =
    open && !loading && suggestions.length === 0 && value.trim().length >= MIN_CHARS;

  return (
    <div ref={wrapperRef} style={styles.wrapper}>
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        style={styles.input}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />

      {open && (loading || suggestions.length > 0 || showEmpty) && (
        <ul style={styles.dropdown} role="listbox">
          {loading && suggestions.length === 0 && (
            <li style={styles.status}>Searching...</li>
          )}

          {suggestions.map((s, index) => (
            <li
              key={s.id}
              role="option"
              aria-selected={index === activeIndex}
              style={{
                ...styles.item,
                ...(index === activeIndex ? styles.itemActive : {}),
              }}
              onMouseEnter={() => setActiveIndex(index)}
              // onMouseDown: input blur hone se pehle select ho jaye
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(s);
              }}
            >
              <span>
                <span style={styles.main}>{s.label}</span>
                {s.secondary && (
                  <span style={styles.secondary}>{s.secondary}</span>
                )}
              </span>
              <span style={styles.badge}>{s.typeLabel}</span>
            </li>
          ))}

          {showEmpty && <li style={styles.status}>No matches found</li>}
        </ul>
      )}
    </div>
  );
}