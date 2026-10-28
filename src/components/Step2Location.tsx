"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

import Swal from "sweetalert2";

import type {
  PartialFormData,
  PropertyFormData,
} from "@/types/property";

interface Step2Props {
  data: PropertyFormData;
  update: (partial: PartialFormData) => void;
  onContinue: () => void;
  onBack: () => void;
}

interface LocationSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
  type: "City" | "Locality" | "Project";
  types: string[];
  distanceMeters: number | null;
}

type LocationField = "city" | "locality";

/* ================================================================
   GOOGLE MAPS SCRIPT LOADER
   - script sirf ek baar load hoti hai
   - Places library ke saath
================================================================ */

const GOOGLE_SCRIPT_ID = "google-maps-script";

let googleMapsPromise: Promise<any> | null = null;

function loadGoogleMaps(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is not available"));
  }

  const w = window as any;

  // Pehle se load ho chuka hai
  if (w.google?.maps?.places) {
    return Promise.resolve(w.google.maps);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return Promise.reject(
      new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing")
    );
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const onReady = () => {
      if (w.google?.maps?.places) {
        resolve(w.google.maps);
      } else {
        googleMapsPromise = null;
        reject(new Error("Google Maps Places library not available"));
      }
    };

    const onError = () => {
      googleMapsPromise = null;
      reject(new Error("Google Maps JavaScript API failed to load"));
    };

    const existing = document.getElementById(
      GOOGLE_SCRIPT_ID
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener("error", onError, { once: true });
      return;
    }

    const script = document.createElement("script");

    script.id = GOOGLE_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = onReady;
    script.onerror = onError;

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

/* ================================================================
   GOOGLE PREDICTION -> LocationSuggestion
================================================================ */

function mapPrediction(
  prediction: any,
  field: LocationField
): LocationSuggestion | null {
  const mainText: string = (
    prediction?.structured_formatting?.main_text ??
    prediction?.description ??
    ""
  ).trim();

  if (!mainText) {
    return null;
  }

  const secondaryText: string = (
    prediction?.structured_formatting?.secondary_text ?? ""
  ).trim();

  const types: string[] = Array.isArray(prediction?.types)
    ? prediction.types
    : [];

  let type: LocationSuggestion["type"] = "Locality";

  if (field === "city" || types.includes("locality")) {
    type = "City";
  }

  return {
    placeId: String(prediction?.place_id ?? mainText),
    mainText,
    secondaryText,
    fullText:
      (prediction?.description as string) ||
      (secondaryText ? `${mainText}, ${secondaryText}` : mainText),
    type,
    types,
    distanceMeters: null,
  };
}

export default function Step2Location({
  data,
  update,
  onContinue,
  onBack,
}: Step2Props) {
  /* ============================================================
     AUTOCOMPLETE STATE
  ============================================================ */

  const [activeField, setActiveField] =
    useState<LocationField | null>(null);

  const [suggestions, setSuggestions] = useState<
    LocationSuggestion[]
  >([]);

  const [loadingSuggestions, setLoadingSuggestions] =
    useState(false);

  const [focusedSuggestion, setFocusedSuggestion] =
    useState(-1);

  const [searchError, setSearchError] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const requestId = useRef(0);

  // Google AutocompleteService instance
  const serviceRef = useRef<any>(null);

  /* ============================================================
     PRELOAD GOOGLE SCRIPT
  ============================================================ */

  useEffect(() => {
    loadGoogleMaps().catch((error) => {
      console.error("Google Maps load error:", error);
    });
  }, []);

  /* ============================================================
     GENERIC FIELD UPDATE
  ============================================================ */

  const set = useCallback(
    (key: keyof PropertyFormData) =>
      (e: ChangeEvent<HTMLInputElement>) => {
        update({
          [key]: e.target.value,
        } as PartialFormData);
      },
    [update]
  );

  /* ============================================================
     GET CURRENT FIELD VALUE
  ============================================================ */

  const getFieldValue = useCallback(
    (field: LocationField): string => {
      if (field === "city") {
        return data.city || "";
      }

      return data.locality || "";
    },
    [data.city, data.locality]
  );

  /* ============================================================
     CLEAR AUTOCOMPLETE
  ============================================================ */

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setFocusedSuggestion(-1);
    setLoadingSuggestions(false);
    setSearchError(false);
  }, []);

  /* ============================================================
     SEARCH LOCATIONS  (Google Places AutocompleteService)
  ============================================================ */

  const searchLocations = useCallback(
    (field: LocationField, value: string) => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }

      const query = value.trim();

      /*
       * Empty / short query.
       */
      if (query.length < 2) {
        clearSuggestions();
        return;
      }

      /*
       * Increment request id immediately.
       * This invalidates older requests.
       */
      const scheduledRequest = ++requestId.current;

      setLoadingSuggestions(true);
      setSearchError(false);

      /*
       * Small debounce.
       */
      searchTimer.current = setTimeout(async () => {
        if (scheduledRequest !== requestId.current) {
          return;
        }

        try {
          const maps = await loadGoogleMaps();

          if (scheduledRequest !== requestId.current) {
            return;
          }

          if (!serviceRef.current) {
            serviceRef.current =
              new maps.places.AutocompleteService();
          }

          const city = data.city?.trim() || "";

          /*
           * city field     -> sirf cities
           * locality field -> regions (locality / sublocality / ...)
           *                   selected city ke saath, taaki results
           *                   usi city ke aayein
           */
          const request: Record<string, unknown> = {
            input:
              field === "locality" && city
                ? `${query}, ${city}`
                : query,
            componentRestrictions: { country: "in" },
            types: field === "city" ? ["(cities)"] : ["(regions)"],
          };

          const predictions: any[] = await new Promise(
            (resolve, reject) => {
              serviceRef.current.getPlacePredictions(
                request,
                (results: any[] | null, status: string) => {
                  const okStatus =
                    maps.places.PlacesServiceStatus.OK;
                  const zeroStatus =
                    maps.places.PlacesServiceStatus.ZERO_RESULTS;

                  if (status === okStatus && results) {
                    resolve(results);
                  } else if (status === zeroStatus) {
                    resolve([]);
                  } else {
                    reject(
                      new Error(`Places status: ${status}`)
                    );
                  }
                }
              );
            }
          );

          /*
           * Ignore stale response.
           */
          if (scheduledRequest !== requestId.current) {
            return;
          }

          const nextSuggestions = predictions
            .slice(0, 6)
            .map((item) => mapPrediction(item, field))
            .filter(
              (item): item is LocationSuggestion => item !== null
            );

          setSuggestions(nextSuggestions);
          setFocusedSuggestion(-1);
          setSearchError(false);
        } catch (error) {
          console.error("Location autocomplete error:", error);

          if (scheduledRequest === requestId.current) {
            setSuggestions([]);
            setSearchError(true);
          }
        } finally {
          if (scheduledRequest === requestId.current) {
            setLoadingSuggestions(false);
          }
        }
      }, 250);
    },
    [clearSuggestions, data.city]
  );

  /* ============================================================
     INPUT CHANGE
  ============================================================ */

  const handleLocationChange = useCallback(
    (field: LocationField, value: string) => {
      /*
       * CITY
       */
      if (field === "city") {
        update({
          city: value,
        } as PartialFormData);

        /*
         * City badli to purani locality is city ki nahi hogi.
         */
        if (data.city !== value && data.locality) {
          update({
            locality: "",
          } as PartialFormData);
        }
      }

      /*
       * LOCALITY
       */
      if (field === "locality") {
        update({
          locality: value,
        } as PartialFormData);
      }

      setActiveField(field);
      setFocusedSuggestion(-1);

      searchLocations(field, value);
    },
    [data.city, data.locality, searchLocations, update]
  );

  /* ============================================================
     SELECT SUGGESTION
  ============================================================ */

  const selectSuggestion = useCallback(
    (field: LocationField, suggestion: LocationSuggestion) => {
      if (field === "city") {
        /*
         * Sirf clean city name jata hai (e.g. "Lucknow"),
         * kyunki backend geocoding isi city name par chalti hai.
         */
        update({
          city: suggestion.mainText,
          locality: "",
        } as PartialFormData);
      } else {
        update({
          locality: suggestion.mainText,
        } as PartialFormData);
      }

      /*
       * Close dropdown after selection.
       */
      setSuggestions([]);
      setActiveField(null);
      setFocusedSuggestion(-1);
      setSearchError(false);
      setLoadingSuggestions(false);

      /*
       * Invalidate pending requests.
       */
      requestId.current += 1;

      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
        searchTimer.current = null;
      }
    },
    [update]
  );

  /* ============================================================
     KEYBOARD NAVIGATION
  ============================================================ */

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    field: LocationField
  ) => {
    if (e.key === "Escape") {
      e.preventDefault();

      clearSuggestions();
      setActiveField(null);

      requestId.current += 1;

      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
        searchTimer.current = null;
      }

      return;
    }

    if (!suggestions.length) {
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();

      setFocusedSuggestion((current) => {
        if (current < suggestions.length - 1) {
          return current + 1;
        }

        return 0;
      });

      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();

      setFocusedSuggestion((current) => {
        if (current > 0) {
          return current - 1;
        }

        return suggestions.length - 1;
      });

      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();

      const selected = suggestions[focusedSuggestion];

      if (selected) {
        selectSuggestion(field, selected);
      }

      return;
    }
  };

  /* ============================================================
     INPUT FOCUS
  ============================================================ */

  const handleFieldFocus = (field: LocationField) => {
    setActiveField(field);
    setSearchError(false);

    const value = getFieldValue(field);

    if (value.trim().length < 2) {
      clearSuggestions();
      return;
    }

    searchLocations(field, value);
  };

  /* ============================================================
     CLOSE DROPDOWN ON OUTSIDE CLICK
  ============================================================ */

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;

      if (!target?.closest(".location-autocomplete")) {
        clearSuggestions();
        setActiveField(null);

        requestId.current += 1;

        if (searchTimer.current) {
          clearTimeout(searchTimer.current);
          searchTimer.current = null;
        }
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [clearSuggestions]);

  /* ============================================================
     CLEANUP
  ============================================================ */

  useEffect(() => {
    return () => {
      requestId.current += 1;

      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
    };
  }, []);

  /* ============================================================
     VALIDATE STEP 2
  ============================================================ */

  const validateStep2 = (): boolean => {
    const city = data.city?.trim() || "";
    const locality = data.locality?.trim() || "";

    if (!city) {
      Swal.fire({
        icon: "warning",
        title: "City is required",
        text: "Please enter the city where your property is located.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#087f45",
      });

      return false;
    }

    if (!locality) {
      Swal.fire({
        icon: "warning",
        title: "Locality is required",
        text: "Please enter the locality where your property is located.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#087f45",
      });

      return false;
    }

    return true;
  };

  /* ============================================================
     CONTINUE
  ============================================================ */

  const handleContinue = () => {
    if (!validateStep2()) {
      return;
    }

    clearSuggestions();
    setActiveField(null);

    onContinue();
  };

  /* ============================================================
     SUGGESTION ICON
  ============================================================ */

  const getSuggestionIcon = (type: LocationSuggestion["type"]) => {
    if (type === "City") {
      return "🏙️";
    }

    if (type === "Project") {
      return "🏢";
    }

    return "📍";
  };

  /* ============================================================
     SUGGESTION DROPDOWN
  ============================================================ */

  const renderSuggestions = (field: LocationField) => {
    if (activeField !== field) {
      return null;
    }

    if (loadingSuggestions) {
      return (
        <div className="suggestion-dropdown">
          <div className="suggestion-loading">
            <span className="loading-spinner" />
            <span>Searching locations...</span>
          </div>
        </div>
      );
    }

    if (searchError) {
      return (
        <div className="suggestion-dropdown">
          <div className="suggestion-empty">
            <div className="empty-icon">!</div>

            <div>
              <div className="empty-title">
                Unable to search locations
              </div>

              <div className="empty-text">
                Please try again.
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (suggestions.length === 0) {
      const value = getFieldValue(field).trim();

      if (value.length < 2) {
        return null;
      }

      return (
        <div className="suggestion-dropdown">
          <div className="suggestion-empty">
            <div className="empty-icon">⌕</div>

            <div>
              <div className="empty-title">
                No locations found
              </div>

              <div className="empty-text">
                Try a different spelling or nearby area.
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        id={`${field}-location-list`}
        className="suggestion-dropdown"
        role="listbox"
      >
        {suggestions.map((suggestion, index) => (
          <button
            key={`${suggestion.placeId}-${index}`}
            type="button"
            role="option"
            aria-selected={focusedSuggestion === index}
            className={`suggestion-item ${
              focusedSuggestion === index
                ? "suggestion-active"
                : ""
            }`}
            onMouseDown={(event) => {
              /*
               * Prevent input blur before click.
               */
              event.preventDefault();
            }}
            onClick={() => {
              selectSuggestion(field, suggestion);
            }}
            onMouseEnter={() => {
              setFocusedSuggestion(index);
            }}
          >
            <div className="suggestion-icon">
              {getSuggestionIcon(suggestion.type)}
            </div>

            <div className="suggestion-content">
              <div className="suggestion-main">
                {suggestion.mainText}
              </div>

              {suggestion.secondaryText && (
                <div className="suggestion-secondary">
                  {suggestion.secondaryText}
                </div>
              )}
            </div>

            <div className="suggestion-right">
              <span className="suggestion-type">
                {suggestion.type}
              </span>
            </div>
          </button>
        ))}

        <div className="google-attribution">
          Powered by Google
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ========================================================
          BACK
      ======================================================== */}

      <button
        type="button"
        className="back-link"
        onClick={onBack}
      >
        ← Back
      </button>

      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="header-section">
        <div className="step-badge">Step 2</div>

        <div>
          <h1 className="page-title">
            Where is your property located?
          </h1>

          <p className="page-subtitle">
            An accurate location helps you connect
            with the right buyers.
          </p>
        </div>
      </div>

      {/* ========================================================
          LOCATION FORM
      ======================================================== */}

      <div className="location-card">
        {/* ======================================================
            CITY
        ====================================================== */}

        <div className="input-with-label location-autocomplete">
          <label htmlFor="city">
            City
            <span className="required-star">*</span>
          </label>

          <div className="input-wrapper">
            <input
              id="city"
              type="text"
              value={data.city || ""}
              onChange={(e) => {
                handleLocationChange("city", e.target.value);
              }}
              onFocus={() => {
                handleFieldFocus("city");
              }}
              onKeyDown={(e) => {
                handleKeyDown(e, "city");
              }}
              placeholder="e.g. Lucknow"
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-controls="city-location-list"
              aria-expanded={
                activeField === "city" && suggestions.length > 0
              }
            />

            {loadingSuggestions && activeField === "city" && (
              <span className="input-spinner" />
            )}
          </div>

          {renderSuggestions("city")}

          <span className="input-help">
            Start typing and select your city
            from the suggestions.
          </span>
        </div>

        {/* ======================================================
            LOCALITY
        ====================================================== */}

        <div className="input-with-label location-autocomplete">
          <label htmlFor="locality">
            Locality
            <span className="required-star">*</span>
          </label>

          <div className="input-wrapper">
            <input
              id="locality"
              type="text"
              value={data.locality || ""}
              onChange={(e) => {
                handleLocationChange("locality", e.target.value);
              }}
              onFocus={() => {
                handleFieldFocus("locality");
              }}
              onKeyDown={(e) => {
                handleKeyDown(e, "locality");
              }}
              placeholder={
                data.city
                  ? `e.g. Gomti Nagar, ${data.city}`
                  : "e.g. Gomti Nagar"
              }
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-controls="locality-location-list"
              aria-expanded={
                activeField === "locality" && suggestions.length > 0
              }
            />

            {loadingSuggestions && activeField === "locality" && (
              <span className="input-spinner" />
            )}
          </div>

          {renderSuggestions("locality")}

          <span className="input-help">
            Search locality, sector, road, project
            or nearby area.
          </span>
        </div>

        {/* ======================================================
            SUB LOCALITY
        ====================================================== */}

        <div className="input-with-label">
          <label htmlFor="subLocality">
            Sub Locality
            <span className="optional-text">Optional</span>
          </label>

          <input
            id="subLocality"
            type="text"
            value={data.subLocality || ""}
            onChange={set("subLocality")}
            placeholder="e.g. Sector, colony or nearby area"
          />
        </div>

        {/* ======================================================
            MALL
        ====================================================== */}

        <div className="input-with-label">
          <label htmlFor="mallName">
            Mall
            <span className="optional-text">Optional</span>
          </label>

          <input
            id="mallName"
            type="text"
            value={data.mallName || ""}
            onChange={set("mallName")}
            placeholder="e.g. Phoenix Mall"
          />
        </div>
      </div>

      {/* ========================================================
          ACTION
      ======================================================== */}

      <div className="action-area">
        <div className="action-info">
          <span className="required-info">
            * Required fields
          </span>

          <span className="action-help">
            Complete the required location details
            to continue.
          </span>
        </div>

        <button
          type="button"
          className="primary-btn"
          onClick={handleContinue}
        >
          Continue
          <span className="arrow">→</span>
        </button>
      </div>

      {/* ========================================================
          STYLES
      ======================================================== */}

      <style jsx>{`
        .back-link {
          display: inline-flex;
          align-items: center;
          border: none;
          background: transparent;
          color: #1267b1;
          font-size: 13px;
          font-weight: 600;
          padding: 0;
          margin: 0 0 22px;
          cursor: pointer;
          transition: color 0.18s ease;
        }

        .back-link:hover {
          color: #087f45;
        }

        .header-section {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 26px;
        }

        .step-badge {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: #eaf5ee;
          color: #087f45;
          font-size: 12px;
          font-weight: 700;
        }

        .page-title {
          margin: 0;
          color: #101828;
          font-size: 30px;
          line-height: 1.2;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .page-subtitle {
          margin: 7px 0 0;
          color: #667085;
          font-size: 14px;
          line-height: 1.5;
        }

        .location-card {
          width: 100%;
          box-sizing: border-box;
          background: #ffffff;
          border: 1px solid #e5eaf0;
          border-radius: 16px;
          padding: 25px 28px;
          box-shadow: 0 2px 8px rgba(16, 24, 40, 0.025);
        }

        .input-with-label {
          width: 100%;
          margin-bottom: 20px;
        }

        .input-with-label:last-child {
          margin-bottom: 0;
        }

        .input-with-label label {
          display: flex;
          align-items: center;
          gap: 3px;
          margin-bottom: 8px;
          color: #172033;
          font-size: 13px;
          font-weight: 650;
        }

        .required-star {
          color: #d92d20;
          font-size: 14px;
          font-weight: 700;
        }

        .optional-text {
          margin-left: 5px;
          color: #98a2b3;
          font-size: 11px;
          font-weight: 500;
        }

        .input-wrapper {
          position: relative;
          width: 100%;
        }

        .input-with-label input {
          width: 100%;
          height: 50px;
          box-sizing: border-box;
          border: 1px solid #d0d5dd;
          border-radius: 10px;
          background: #ffffff;
          color: #172033;
          padding: 0 15px;
          font-size: 13px;
          outline: none;
          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease,
            background 0.18s ease;
        }

        .input-with-label input::placeholder {
          color: #a0a9b8;
        }

        .input-with-label input:hover {
          border-color: #aeb8c5;
        }

        .input-with-label input:focus {
          border-color: #1683d8;
          background: #fbfdff;
          box-shadow: 0 0 0 3px rgba(22, 131, 216, 0.08);
        }

        /* ======================================================
           AUTOCOMPLETE DROPDOWN
        ====================================================== */

        .location-autocomplete {
          position: relative;
        }

        .suggestion-dropdown {
          position: absolute;
          z-index: 1000;
          left: 0;
          right: 0;
          margin-top: 4px;
          background: #ffffff;
          border: 1px solid #e1e6ec;
          border-radius: 11px;
          box-shadow:
            0 14px 35px rgba(16, 24, 40, 0.13),
            0 3px 9px rgba(16, 24, 40, 0.06);
          overflow: hidden;
        }

        .suggestion-item {
          width: 100%;
          min-height: 62px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border: none;
          border-bottom: 1px solid #edf0f3;
          background: #ffffff;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .suggestion-item:last-of-type {
          border-bottom: none;
        }

        .suggestion-item:hover,
        .suggestion-active {
          background: #f7f9fc;
        }

        .suggestion-icon {
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #f1f5f9;
          font-size: 15px;
        }

        .suggestion-content {
          min-width: 0;
          flex: 1;
        }

        .suggestion-main {
          color: #25324a;
          font-size: 13px;
          font-weight: 650;
          line-height: 1.35;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .suggestion-secondary {
          margin-top: 3px;
          color: #8a96a8;
          font-size: 11px;
          line-height: 1.35;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .suggestion-right {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 3px;
        }

        .suggestion-type {
          color: #087f45;
          background: #eaf5ee;
          border-radius: 20px;
          padding: 3px 7px;
          font-size: 9px;
          font-weight: 700;
          text-transform: capitalize;
        }

        .suggestion-loading {
          display: flex;
          align-items: center;
          gap: 9px;
          min-height: 52px;
          padding: 0 15px;
          color: #667085;
          font-size: 12px;
        }

        .loading-spinner {
          width: 15px;
          height: 15px;
          flex-shrink: 0;
          border: 2px solid #e5e7eb;
          border-top-color: #1683d8;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .suggestion-empty {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 62px;
          padding: 10px 14px;
        }

        .empty-icon {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #f2f4f7;
          color: #667085;
          font-size: 14px;
          font-weight: 700;
        }

        .empty-title {
          color: #344054;
          font-size: 12px;
          font-weight: 600;
        }

        .empty-text {
          margin-top: 2px;
          color: #98a2b3;
          font-size: 10px;
        }

        .google-attribution {
          padding: 7px 13px;
          color: #98a2b3;
          background: #fafbfc;
          border-top: 1px solid #edf0f3;
          font-size: 9px;
          text-align: right;
        }

        .input-spinner {
          position: absolute;
          right: 15px;
          top: 50%;
          width: 15px;
          height: 15px;
          margin-top: -8px;
          border: 2px solid #e5e7eb;
          border-top-color: #1683d8;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .input-help {
          display: block;
          margin-top: 5px;
          color: #98a2b3;
          font-size: 11px;
          line-height: 1.4;
        }

        /* ======================================================
           ACTION
        ====================================================== */

        .action-area {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-top: 24px;
        }

        .action-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .required-info {
          color: #344054;
          font-size: 12px;
          font-weight: 600;
        }

        .action-help {
          color: #98a2b3;
          font-size: 11px;
        }

        .primary-btn {
          min-width: 145px;
          height: 48px;
          border: none;
          border-radius: 9px;
          background: #087f45;
          color: #ffffff;
          padding: 0 20px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 10px rgba(8, 127, 69, 0.18);
          transition:
            transform 0.18s ease,
            background 0.18s ease,
            box-shadow 0.18s ease;
        }

        .primary-btn:hover {
          background: #066d3b;
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(8, 127, 69, 0.22);
        }

        .primary-btn:active {
          transform: translateY(0);
        }

        .arrow {
          font-size: 17px;
          line-height: 1;
        }

        /* ======================================================
           ANIMATIONS
        ====================================================== */

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        /* ======================================================
           MOBILE
        ====================================================== */

        @media (max-width: 760px) {
          .page-title {
            font-size: 24px;
          }

          .header-section {
            gap: 10px;
          }

          .step-badge {
            width: 38px;
            height: 38px;
            border-radius: 9px;
          }

          .location-card {
            padding: 20px;
            border-radius: 13px;
          }

          .action-area {
            align-items: stretch;
            flex-direction: column;
          }

          .primary-btn {
            width: 100%;
          }

          .suggestion-right {
            display: none;
          }

          .suggestion-item {
            min-height: 58px;
            padding: 9px 11px;
          }

          .suggestion-secondary {
            max-width: 210px;
          }
        }

        @media (max-width: 480px) {
          .page-title {
            font-size: 21px;
          }

          .page-subtitle {
            font-size: 13px;
          }

          .location-card {
            padding: 16px;
          }

          .input-with-label input {
            height: 48px;
          }

          .suggestion-icon {
            width: 30px;
            height: 30px;
            font-size: 13px;
          }

          .suggestion-main {
            font-size: 12px;
          }

          .suggestion-secondary {
            font-size: 10px;
          }
        }
      `}</style>
    </>
  );
}