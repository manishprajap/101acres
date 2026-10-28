'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FiSearch,
  FiChevronDown,
  FiMapPin,
  FiMic,
  FiX,
  FiNavigation,
} from "react-icons/fi";

interface ResultItem {
  id: number;
  name: string;
  image?: string | null;
  looking_to?: string | null;
  city?: string | null;
  locality?: string | null;
  carpet_area?: string | null;
  carpet_area_unit?: string | null;
  price?: string | null;

  /*
   * Required for 5 KM nearby calculation.
   */
  latitude?: number | string | null;
  longitude?: number | string | null;
}

interface NearbyResultItem extends ResultItem {
  distanceKm: number;
}

interface VoiceRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: {
    results: ArrayLike<ArrayLike<{ transcript: string }>>;
  }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface VoiceRecognitionWindow extends Window {
  SpeechRecognition?: new () => VoiceRecognition;
  webkitSpeechRecognition?: new () => VoiceRecognition;
}

const TABS: {
  label: string;
  lookingTo?: string;
  badge?: boolean;
  category?: string;
}[] = [
  { label: "Buy", lookingTo: "sell" },
  { label: "Rent", lookingTo: "rent" },
  { label: "Commercial", category: "commercial" },
  { label: "Residential", category: "residential" },
];

const PROPERTY_TYPES = [
  "Flat/Apartment",
  "Builder Floor",
  "Independent House/Villa",
  "Residential Land",
  "1 RK/Studio Apartment",
  "Farm House",
  "Serviced Apartments",
  "Other",
];

const FILTER_PILLS = [
  "Budget",
  "Bedroom",
  "Construction Status",
  "Posted By",
];

/*
 * Nearby search radius.
 *
 * Change this one value if you want:
 * 3  = 3 KM
 * 5  = 5 KM
 * 10 = 10 KM
 */
const NEARBY_RADIUS_KM = 5;

/*
 * Calculate distance between two coordinates.
 *
 * Returns distance in kilometres.
 */
const calculateDistanceKm = (
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
): number => {
  const earthRadiusKm = 6371;

  const dLatitude =
    ((latitude2 - latitude1) * Math.PI) / 180;

  const dLongitude =
    ((longitude2 - longitude1) * Math.PI) / 180;

  const lat1 =
    (latitude1 * Math.PI) / 180;

  const lat2 =
    (latitude2 * Math.PI) / 180;

  const a =
    Math.sin(dLatitude / 2) *
      Math.sin(dLatitude / 2) +
    Math.sin(dLongitude / 2) *
      Math.sin(dLongitude / 2) *
      Math.cos(lat1) *
      Math.cos(lat2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadiusKm * c;
};

export default function FormThree() {
  const router = useRouter();

  const panelRef =
    useRef<HTMLDivElement>(null);
  const voiceRecognitionRef =
    useRef<VoiceRecognition | null>(null);

  /*
   * ----------------------------------------------------
   * NORMAL SEARCH STATE
   * ----------------------------------------------------
   */

  const [activeTabIndex, setActiveTabIndex] =
    useState<number>(0);

  const [inputQuery, setInputQuery] =
    useState<string>("");

  const [categoryOpen, setCategoryOpen] =
    useState<boolean>(false);

  const [suggestOpen, setSuggestOpen] =
    useState<boolean>(false);

  const [checkedTypes, setCheckedTypes] =
    useState<Record<string, boolean>>(
      Object.fromEntries(
        PROPERTY_TYPES.map((type) => [
          type,
          true,
        ])
      )
    );

  const [results, setResults] =
    useState<ResultItem[]>([]);

  const [total, setTotal] =
    useState<number>(0);

  const [loading, setLoading] =
    useState<boolean>(false);
  const [voiceListening, setVoiceListening] =
    useState<boolean>(false);
  const [voiceError, setVoiceError] =
    useState<string>("");
  const [nearbyLoading, setNearbyLoading] =
    useState<boolean>(false);
  const [nearbyError, setNearbyError] =
    useState<string>("");

  /*
   * ----------------------------------------------------
   * LOCATION STATE
   * ----------------------------------------------------
   */

  const [
    locationModalOpen,
    setLocationModalOpen,
  ] = useState<boolean>(false);

  const [
    locationStatus,
    setLocationStatus,
  ] = useState<
    "idle" |
    "requesting" |
    "success" |
    "denied" |
    "unavailable"
  >("idle");

  const [
    locationError,
    setLocationError,
  ] = useState<string>("");

  const [
    locationPermission,
    setLocationPermission,
  ] = useState<PermissionState | null>(
    null
  );

  const [
    userLocation,
    setUserLocation,
  ] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [
    nearbyProperties,
    setNearbyProperties,
  ] = useState<NearbyResultItem[]>([]);

  const [
    nearMeActive,
    setNearMeActive,
  ] = useState<boolean>(false);

  /*
   * ----------------------------------------------------
   * SELECTED PROPERTY TYPES
   * ----------------------------------------------------
   */

  const selectedTypes =
    PROPERTY_TYPES.filter(
      (type) => checkedTypes[type]
    );

  const allSelected =
    selectedTypes.length ===
    PROPERTY_TYPES.length;

  /*
   * ----------------------------------------------------
   * POST PROPERTY
   * ----------------------------------------------------
   */

 const LOGIN_PATH = "/auth-login";
const ADD_PROPERTY_PATH = "/dashboard/add-property";

const handlePostProperty = () => {
  const storedId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const isLoggedIn =
    !!token &&
    Number.isFinite(Number(storedId)) &&
    Number(storedId) > 0;

  if (isLoggedIn) {
    router.push(ADD_PROPERTY_PATH);
  } else {
    router.push(
      `${LOGIN_PATH}?redirect=${encodeURIComponent(ADD_PROPERTY_PATH)}`
    );
  }
};

  /*
   * ----------------------------------------------------
   * BUILD SEARCH PARAMS
   * ----------------------------------------------------
   */

  const buildParams = (
    extra: Record<string, string> = {}
  ) => {
    const params =
      new URLSearchParams();

    if (inputQuery.trim()) {
      params.set(
        "query",
        inputQuery.trim()
      );
    }

    const tab =
      TABS[activeTabIndex];

    if (tab.lookingTo) {
      params.set(
        "looking_to",
        tab.lookingTo
      );
    }

    if (tab.category) {
      params.set(
        "category",
        tab.category
      );
    }

    if (
      !allSelected &&
      selectedTypes.length > 0
    ) {
      params.set(
        "types",
        selectedTypes.join(",")
      );
    }

    Object.entries(extra).forEach(
      ([key, value]) => {
        params.set(key, value);
      }
    );

    return params;
  };

  /*
   * ----------------------------------------------------
   * TAB CLICK
   * ----------------------------------------------------
   */

  const handleTabClick = (
    tabIndex: number
  ) => {
    setActiveTabIndex(tabIndex);
  };

  /*
   * ----------------------------------------------------
   * NORMAL SEARCH
   * ----------------------------------------------------
   */

  const handleSearch = () => {
    /*
     * If Near Me is active and user presses Search,
     * keep the nearby search active.
     */
    if (nearMeActive) {
      showNearbyPropertiesPage();
      return;
    }

    if (
      inputQuery.trim() === ""
    ) {
      return;
    }

    setSuggestOpen(false);

    const params =
      buildParams();

    params.set(
      "search",
      inputQuery.trim()
    );

    params.delete("query");

    router.push(
      `/properties?${params.toString()}`
    );
  };

  const handleVoiceSearch = () => {
    if (voiceListening) {
      voiceRecognitionRef.current?.stop();
      return;
    }

    const speechWindow = window as VoiceRecognitionWindow;
    const Recognition =
      speechWindow.SpeechRecognition ??
      speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setVoiceError("Voice search is not supported by this browser.");
      return;
    }

    setVoiceError("");
    const recognition = new Recognition();
    recognition.lang = navigator.language || "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setNearMeActive(false);
        setUserLocation(null);
        setNearbyProperties([]);
        setInputQuery(transcript);
        setSuggestOpen(true);
      }
    };
    recognition.onerror = (event) => {
      setVoiceError(
        event.error === "not-allowed"
          ? "Allow microphone access in your browser to use voice search."
          : "Voice search could not hear you. Please try again."
      );
    };
    recognition.onend = () => {
      setVoiceListening(false);
      voiceRecognitionRef.current = null;
    };

    voiceRecognitionRef.current = recognition;
    setVoiceListening(true);
    try {
      recognition.start();
    } catch (error) {
      voiceRecognitionRef.current = null;
      setVoiceListening(false);
      console.error("Could not start voice search:", error);
      setVoiceError("Voice search could not start. Please try again.");
    }
  };

  const fetchNearbyProperties = async (
    latitude: number,
    longitude: number
  ) => {
    const params = buildParams({
      latitude: String(latitude),
      longitude: String(longitude),
      radius: String(NEARBY_RADIUS_KM),
      limit: "50",
    });
    params.delete("query");
    params.delete("search");

    setNearbyLoading(true);
    setNearbyError("");
    try {
      const response = await fetch(`/api/search?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not find nearby properties.");
      }

      const matches = Array.isArray(data.results) ? data.results : [];
      setNearbyProperties(
        matches
          .map((property: ResultItem & { distanceKm?: number }) => {
            const propertyLatitude = Number(property.latitude);
            const propertyLongitude = Number(property.longitude);
            const distanceKm = Number.isFinite(property.distanceKm)
              ? Number(property.distanceKm)
              : calculateDistanceKm(
                  latitude,
                  longitude,
                  propertyLatitude,
                  propertyLongitude
                );
            return { ...property, distanceKm };
          })
          .filter(
            (property: NearbyResultItem) =>
              Number.isFinite(property.distanceKm) &&
              property.distanceKm <= NEARBY_RADIUS_KM
          )
          .sort(
            (first: NearbyResultItem, second: NearbyResultItem) =>
              first.distanceKm - second.distanceKm
          )
      );
    } catch (error) {
      console.error("Nearby property search failed:", error);
      setNearbyProperties([]);
      setNearbyError(
        error instanceof Error
          ? error.message
          : "Could not find nearby properties."
      );
    } finally {
      setNearbyLoading(false);
    }
  };

  /*
   * ----------------------------------------------------
   * CHECK BROWSER LOCATION PERMISSION
   * ----------------------------------------------------
   *
   * granted:
   *   Directly get location.
   *
   * prompt:
   *   Open our custom permission modal.
   *
   * denied:
   *   Open modal with browser settings instructions.
   */

  useEffect(() => {
    let permissionStatus:
      | PermissionStatus
      | null = null;

    const checkPermission =
      async () => {
        if (
          typeof navigator ===
            "undefined" ||
          !navigator.permissions
        ) {
          return;
        }

        try {
          permissionStatus =
            await navigator.permissions.query(
              {
                name: "geolocation",
              }
            );

          setLocationPermission(
            permissionStatus.state
          );

          permissionStatus.onchange =
            () => {
              setLocationPermission(
                permissionStatus!.state
              );
            };
        } catch (error) {
          console.log(
            "Could not check location permission:",
            error
          );
        }
      };

    checkPermission();

    return () => {
      if (permissionStatus) {
        permissionStatus.onchange =
          null;
      }
    };
  }, []);

  /*
   * ----------------------------------------------------
   * LOCATION BUTTON
   * ----------------------------------------------------
   */

  const handleLocationButton = async () => {
    setLocationError("");

    /*
     * If browser supports Permissions API,
     * check current permission.
     */
    if (
      typeof navigator !==
        "undefined" &&
      navigator.permissions
    ) {
      try {
        const permission =
          await navigator.permissions.query(
            {
              name: "geolocation",
            }
          );

        setLocationPermission(
          permission.state
        );

        /*
         * IMPORTANT:
         *
         * Permission already granted.
         *
         * Do NOT open modal.
         */
        if (
          permission.state ===
          "granted"
        ) {
          getCurrentLocation();
          return;
        }

        /*
         * Permission denied.
         *
         * Open modal with settings
         * instructions.
         */
        if (
          permission.state ===
          "denied"
        ) {
          setLocationStatus(
            "denied"
          );

          setLocationModalOpen(
            true
          );

          return;
        }

        /*
         * Permission is still "prompt".
         *
         * Show custom modal.
         */
        setLocationStatus(
          "idle"
        );

        setLocationModalOpen(
          true
        );

        return;
      } catch (error) {
        console.log(
          "Permission API error:",
          error
        );
      }
    }

    /*
     * Fallback for browsers that don't
     * support navigator.permissions.
     */
    setLocationStatus("idle");

    setLocationModalOpen(true);
  };

  /*
   * ----------------------------------------------------
   * GET CURRENT LOCATION
   * ----------------------------------------------------
   */

  const getCurrentLocation = () => {
    if (
      typeof navigator ===
        "undefined" ||
      !navigator.geolocation
    ) {
      setLocationStatus(
        "unavailable"
      );

      setLocationError(
        "Your browser does not support location access."
      );

      setLocationModalOpen(true);

      return;
    }

    setLocationStatus(
      "requesting"
    );

    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        const currentLocation = {
          latitude,
          longitude,
        };

        /*
         * Save user's location.
         */
        setUserLocation(
          currentLocation
        );

        /*
         * Activate Near Me.
         */
        setNearMeActive(true);

        void fetchNearbyProperties(latitude, longitude);

        /*
         * Close modal after
         * successful permission.
         */
        setLocationModalOpen(
          false
        );

        setLocationStatus(
          "success"
        );

        /*
         * Show Near Me in input.
         */
        setInputQuery(
          "Near me"
        );

        setSuggestOpen(false);
      },

      (error) => {
        console.error(
          "Geolocation error:",
          error
        );

        /*
         * Permission denied.
         */
        if (error.code === 1) {
          setLocationStatus(
            "denied"
          );

          setLocationError(
            "Please Allow Location Access From Settings"
          );

          setLocationModalOpen(
            true
          );

          return;
        }

        /*
         * Position unavailable.
         */
        if (error.code === 2) {
          setLocationStatus(
            "unavailable"
          );

          setLocationError(
            "Your current location could not be detected. Please turn on Location Services and try again."
          );

          setLocationModalOpen(
            true
          );

          return;
        }

        /*
         * Timeout.
         */
        if (error.code === 3) {
          setLocationStatus(
            "unavailable"
          );

          setLocationError(
            "Location request timed out. Please try again."
          );

          setLocationModalOpen(
            true
          );

          return;
        }

        setLocationStatus(
          "unavailable"
        );

        setLocationError(
          "Unable to access your location."
        );

        setLocationModalOpen(
          true
        );
      },

      {
        enableHighAccuracy: true,

        /*
         * 15 second maximum wait.
         */
        timeout: 15000,

        /*
         * Reuse a location that is up to
         * 5 minutes old.
         */
        maximumAge: 300000,
      }
    );
  };

  /*
   * ----------------------------------------------------
   * OPEN PROPERTY LISTING PAGE
   * ----------------------------------------------------
   *
   * No new API is created here.
   */

  const showNearbyPropertiesPage =
    () => {
      if (!userLocation) {
        return;
      }

      const params =
        new URLSearchParams();

      /*
       * Tell listing page that this is
       * a Near Me search.
       */
      params.set(
        "near_me",
        "true"
      );

      /*
       * Send user's coordinates.
       */
      params.set(
        "latitude",
        String(
          userLocation.latitude
        )
      );

      params.set(
        "longitude",
        String(
          userLocation.longitude
        )
      );

      /*
       * 5 KM radius.
       */
      params.set(
        "radius",
        String(
          NEARBY_RADIUS_KM
        )
      );

      const tab =
        TABS[activeTabIndex];

      if (tab.lookingTo) {
        params.set(
          "looking_to",
          tab.lookingTo
        );
      }

      if (tab.category) {
        params.set(
          "category",
          tab.category
        );
      }

      if (
        !allSelected &&
        selectedTypes.length > 0
      ) {
        params.set("types", selectedTypes.join(","));
      }

      router.push(
        `/properties?${params.toString()}`
      );
    };

  /*
   * ----------------------------------------------------
   * CLEAR NEAR ME
   * ----------------------------------------------------
   */

  const clearLocation = () => {
    setNearMeActive(
      false
    );

    setUserLocation(
      null
    );

    setNearbyProperties(
      []
    );

    setLocationStatus(
      "idle"
    );

    if (
      inputQuery ===
      "Near me"
    ) {
      setInputQuery("");
    }
  };

  /*
   * ----------------------------------------------------
   * PROPERTY TYPES
   * ----------------------------------------------------
   */

  const toggleType = (
    type: string
  ) => {
    setCheckedTypes(
      (previous) => ({
        ...previous,
        [type]:
          !previous[type],
      })
    );
  };

  const clearAll = () => {
    setCheckedTypes(
      Object.fromEntries(
        PROPERTY_TYPES.map(
          (type) => [
            type,
            false,
          ]
        )
      )
    );
  };

  const categoryLabel =
    allSelected
      ? "All Residential"
      : `${selectedTypes.length} selected`;

  /*
   * ----------------------------------------------------
   * CLOSE DROPDOWNS WHEN CLICKING OUTSIDE
   * ----------------------------------------------------
   */

  useEffect(() => {
    const onClickOutside =
      (event: MouseEvent) => {
        if (
          panelRef.current &&
          !panelRef.current.contains(
            event.target as Node
          )
        ) {
          setCategoryOpen(
            false
          );

          setSuggestOpen(
            false
          );
        }
      };

    document.addEventListener(
      "mousedown",
      onClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        onClickOutside
      );
    };
  }, []);

  useEffect(() => {
    return () => {
      voiceRecognitionRef.current?.stop();
    };
  }, []);

  /*
   * ----------------------------------------------------
   * LIVE NORMAL SEARCH
   * ----------------------------------------------------
   */

  useEffect(() => {
    /*
     * When Near Me is active,
     * don't run normal text search.
     */
    if (
      nearMeActive
    ) {
      setResults([]);
      setTotal(0);
      return;
    }

    if (
      inputQuery.trim()
        .length < 2
    ) {
      setResults([]);
      setTotal(0);
      return;
    }

    const controller =
      new AbortController();

    const fetchData =
      async () => {
        setLoading(true);

        try {
          const params =
            buildParams({
              limit: "6",
            });

          const response =
            await fetch(
              `/api/search?${params.toString()}`,
              {
                signal:
                  controller.signal,
              }
            );

          if (
            !response.ok
          ) {
            throw new Error(
              "Search request failed"
            );
          }

          const data =
            await response.json();

          setResults(
            data.results ??
              []
          );

          setTotal(
            data.total ??
              0
          );

          setSuggestOpen(
            true
          );
        } catch (error) {
          if (
            (error as Error)
              .name !==
            "AbortError"
          ) {
            console.error(
              "Search error:",
              error
            );
          }
        } finally {
          if (
            !controller.signal
              .aborted
          ) {
            setLoading(
              false
            );
          }
        }
      };

    const debounce =
      setTimeout(
        fetchData,
        400
      );

    return () => {
      clearTimeout(
        debounce
      );

      controller.abort();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    inputQuery,
    activeTabIndex,
    checkedTypes,
    nearMeActive,
  ]);

  /*
   * ----------------------------------------------------
   * PROPERTY DATA TO DISPLAY
   * ----------------------------------------------------
   */

  const displayProperties =
    nearMeActive
      ? nearbyProperties
      : results;

  /*
   * ----------------------------------------------------
   * RENDER
   * ----------------------------------------------------
   */

  return (
    <>
      {/* =================================================
          SEARCH BOX
      ================================================= */}

      <div
        className="w-full max-w-4xl mx-auto relative px-2 sm:px-0"
        ref={panelRef}
      >
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl shadow-black/20 overflow-hidden">

          {/* =============================================
              TOP TAB ROW
          ============================================= */}

          <div className="flex items-center justify-between gap-2 px-3 pt-3 sm:px-6 sm:pt-4">

            <ul className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 whitespace-nowrap sm:flex-none sm:gap-6 lg:gap-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

              {TABS.map(
                (tab, index) => (
                  <li
                    key={
                      tab.label
                    }
                    className="relative pb-3 whitespace-nowrap"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleTabClick(
                          index
                        )
                      }
                      className={`text-[13px] sm:text-[15px] transition-colors duration-200 ${
                        activeTabIndex ===
                        index
                          ? "font-semibold text-slate-900 dark:text-white"
                          : "font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                      }`}
                    >
                      {
                        tab.label
                      }
                    </button>

                    {tab.badge && (
                      <span className="absolute -top-0.5 -right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
                    )}

                    {activeTabIndex ===
                      index && (
                      <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-blue-600 rounded-full" />
                    )}
                  </li>
                )
              )}

            </ul>

            <div className="flex shrink-0 items-center justify-end gap-2 pb-1 sm:gap-4 sm:pb-3">

              <span className="hidden h-4 w-px bg-slate-200 dark:bg-slate-700 sm:block" />

              <button
                type="button"
                onClick={
                  handlePostProperty
                }
                className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white sm:gap-2 sm:text-[15px]"
              >
                Post Property

                <span className="text-[10px] font-semibold bg-green-600 text-white px-1.5 py-0.5 rounded sm:text-[11px]">
                  FREE
                </span>
              </button>

            </div>
          </div>

          {/* =============================================
              SEARCH ROW
          ============================================= */}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
            className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6"
          >

            {/* CATEGORY */}

            <div className="flex items-center gap-2 sm:shrink-0">
              <button
                type="button"
                onClick={() =>
                  setCategoryOpen(
                    (open) =>
                      !open
                  )
                }
                className="flex items-center gap-1.5 text-[14px] font-medium text-slate-700 dark:text-slate-200 sm:text-[15px]"
              >
                {categoryLabel}

                <FiChevronDown
                  className={`transition-transform duration-200 ${
                    categoryOpen
                      ? "rotate-180"
                      : ""
                  }`}
                  size={14}
                />
              </button>

              <span className="hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block" />
            </div>

            {/* SEARCH INPUT */}

            <div className="flex flex-1 items-center gap-2.5 min-w-0">

              <FiSearch
                className="text-slate-400 shrink-0"
                size={18}
              />

              <input
                type="text"
                className="w-full bg-transparent border-0 outline-none text-[15px] placeholder:text-slate-400 text-slate-800 dark:text-white"
                placeholder='Search "Flats for rent in sector 77 Noida"'
                value={
                  inputQuery
                }
                onChange={(event) => {
                  const value =
                    event.target
                      .value;

                  /*
                   * If user manually changes
                   * the text while Near Me is
                   * active, remove Near Me.
                   */
                  if (
                    nearMeActive &&
                    value !==
                      "Near me"
                  ) {
                    setNearMeActive(
                      false
                    );

                    setUserLocation(
                      null
                    );

                    setNearbyProperties(
                      []
                    );
                  }

                  setInputQuery(
                    value
                  );
                }}
                onFocus={() => {
                  if (
                    !nearMeActive &&
                    results.length >
                      0
                  ) {
                    setSuggestOpen(
                      true
                    );
                  }
                }}
              />

              {/* NEAR ME CHIP */}

              {nearMeActive && (
                <button
                  type="button"
                  onClick={
                    clearLocation
                  }
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[11px] font-medium shrink-0 sm:px-3 sm:text-xs"
                >
                  <FiMapPin
                    size={12}
                  />

                  <span className="whitespace-nowrap">Near me</span>

                  <FiX
                    size={12}
                  />
                </button>
              )}

            </div>

            {/* ACTION ICONS */}

            <div className="flex items-center justify-between gap-2.5 sm:justify-end sm:shrink-0">

              {/* LOCATION */}

              <button
                type="button"
                aria-label="Use current location"
                onClick={
                  handleLocationButton
                }
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                  nearMeActive
                    ? "bg-blue-600 text-white"
                    : "bg-sky-50 dark:bg-slate-800 text-sky-500 hover:bg-sky-100 dark:hover:bg-slate-700"
                }`}
              >
                <FiMapPin
                  size={16}
                />
              </button>

              {/* VOICE */}

              <button
                type="button"
                aria-label="Search by voice"
                aria-pressed={voiceListening}
                title={voiceListening ? "Stop voice search" : "Search by voice"}
                onClick={handleVoiceSearch}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                  voiceListening
                    ? "bg-red-100 text-red-600 animate-pulse"
                    : "bg-sky-50 dark:bg-slate-800 text-sky-500 hover:bg-sky-100 dark:hover:bg-slate-700"
                }`}
              >
                <FiMic
                  size={16}
                />
              </button>

              {/* SEARCH */}

              <button
                type="submit"
                className="h-11 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-medium transition-colors sm:px-7 sm:text-[15px]"
              >
                Search
              </button>

            </div>
          </form>

          {voiceError && (
            <p className="px-6 pb-3 text-sm text-red-600" role="status">
              {voiceError}
            </p>
          )}

          {/* =============================================
              NEARBY PROPERTY INFORMATION
          ============================================= */}

          {nearMeActive &&
            userLocation && (
              <div className="border-t border-slate-100 dark:border-slate-800 bg-blue-50 px-6 py-3">

                <div className="flex items-center justify-between gap-3">

                  <div className="flex items-center gap-2 text-sm text-blue-700">

                    <FiMapPin
                      size={17}
                    />

                    <span>
                      Properties within{" "}
                      <strong>
                        {
                          NEARBY_RADIUS_KM
                        } KM
                      </strong>{" "}
                      of your location
                    </span>

                  </div>

                  <span className="text-xs text-blue-600">
                    {nearbyLoading
                      ? "Searching nearby…"
                      : `${nearbyProperties.length} found`}
                  </span>

                </div>

                {nearbyError && (
                  <p className="mt-2 text-sm text-red-600" role="status">
                    {nearbyError}
                  </p>
                )}

              </div>
            )}

          {/* =============================================
              NORMAL SEARCH RESULTS
          ============================================= */}

          {suggestOpen &&
            !nearMeActive &&
            inputQuery.trim()
              .length >= 2 && (
              <div className="border-t border-slate-100 dark:border-slate-800 max-h-80 overflow-y-auto">

                {loading && (
                  <p className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">
                    Searching…
                  </p>
                )}

                {!loading &&
                  results.length ===
                    0 && (
                    <p className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">
                      No properties found
                      for “
                      {
                        inputQuery
                      }
                      ”.
                    </p>
                  )}

                {!loading &&
                  results.map(
                    (item) => (
                      <button
                        key={
                          item.id
                        }
                        type="button"
                        onClick={() =>
                          router.push(
                            `/property-detail/${item.id}`
                          )
                        }
                        className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              item.image
                            }
                            alt=""
                            className="w-12 h-12 rounded-md object-cover shrink-0"
                          />
                        ) : (
                          <span className="w-12 h-12 rounded-md bg-slate-100 dark:bg-slate-800 shrink-0" />
                        )}

                        <span className="min-w-0 flex-1">

                          <span className="block text-[14px] font-medium text-slate-800 dark:text-white truncate">
                            {
                              item.name
                            }
                          </span>

                          <span className="block text-[13px] text-slate-500 dark:text-slate-400 truncate">
                            {[
                              item.carpet_area &&
                                `${item.carpet_area} ${
                                  item.carpet_area_unit ??
                                  ""
                                }`,
                              item.looking_to,
                            ]
                              .filter(
                                Boolean
                              )
                              .join(
                                " • "
                              )}
                          </span>

                        </span>

                        {item.price && (
                          <span className="text-[14px] font-semibold text-slate-800 dark:text-white shrink-0">
                            ₹
                            {Number(
                              item.price
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        )}
                      </button>
                    )
                  )}

                {!loading &&
                  total >
                    results.length && (
                    <button
                      type="button"
                      onClick={
                        handleSearch
                      }
                      className="w-full px-6 py-3 text-sm text-blue-600 hover:underline text-left border-t border-slate-100 dark:border-slate-800"
                    >
                      View all{" "}
                      {total}{" "}
                      results
                    </button>
                  )}

              </div>
            )}

          {/* =============================================
              NEARBY RESULTS
          ============================================= */}

          {nearMeActive && (
            <div className="border-t border-slate-100 dark:border-slate-800 max-h-[420px] overflow-y-auto">

              {/* LOADING */}

              {locationStatus ===
                "requesting" && (
                <div className="px-6 py-8 text-center">

                  <div className="mx-auto w-9 h-9 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />

                  <p className="mt-3 text-sm text-slate-600">
                    Finding properties near
                    you...
                  </p>

                </div>
              )}

              {/* NO PROPERTIES */}

              {nearbyLoading && (
                <div className="px-6 py-8 text-center text-sm text-slate-600">
                  Searching for nearby properties…
                </div>
              )}

              {!nearbyLoading &&
                locationStatus !==
                "requesting" &&
                nearbyProperties.length ===
                  0 && (
                  <div className="px-6 py-8 text-center">

                    <FiMapPin
                      size={28}
                      className="mx-auto text-slate-400"
                    />

                    <p className="mt-3 text-sm font-medium text-slate-700">
                      No properties found
                      within{" "}
                      {
                        NEARBY_RADIUS_KM
                      } KM
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Properties need valid
                      latitude and longitude
                      coordinates to appear
                      here.
                    </p>

                  </div>
                )}

              {/* PROPERTY LIST */}

              {!nearbyLoading &&
                nearbyProperties.length >
                0 &&
                nearbyProperties.map(
                  (item) => (
                    <button
                      key={
                        item.id
                      }
                      type="button"
                      onClick={() =>
                        router.push(
                          `/property-detail/${item.id}`
                        )
                      }
                      className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800"
                    >

                      {/* IMAGE */}

                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            item.image
                          }
                          alt=""
                          className="w-14 h-14 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <span className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                          <FiMapPin
                            size={20}
                            className="text-slate-400"
                          />
                        </span>
                      )}

                      {/* DETAILS */}

                      <span className="min-w-0 flex-1">

                        <span className="block text-[14px] font-medium text-slate-800 dark:text-white truncate">
                          {
                            item.name
                          }
                        </span>

                        <span className="block text-[13px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {[
                            item.locality,
                            item.city,
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              ", "
                            )}
                        </span>

                        <span className="block text-[12px] text-slate-500 mt-1">
                          {item.carpet_area &&
                            `${item.carpet_area} ${
                              item.carpet_area_unit ??
                              ""
                            }`}

                          {item.looking_to &&
                            ` • ${item.looking_to}`}
                        </span>

                      </span>

                      {/* PRICE + DISTANCE */}

                      <span className="text-right shrink-0">

                        {item.price && (
                          <span className="block text-[14px] font-semibold text-slate-800 dark:text-white">
                            ₹
                            {Number(
                              item.price
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        )}

                        <span className="flex items-center justify-end gap-1 mt-1 text-[12px] font-medium text-blue-600">
                          <FiNavigation
                            size={11}
                          />

                          {item.distanceKm.toFixed(
                            1
                          )}{" "}
                          KM
                        </span>

                      </span>

                    </button>
                  )
                )}

              {/* VIEW ALL */}

              {!nearbyLoading &&
                nearbyProperties.length >
                0 && (
                <button
                  type="button"
                  onClick={
                    showNearbyPropertiesPage
                  }
                  className="w-full px-6 py-4 text-sm font-medium text-blue-600 hover:bg-blue-50 text-left"
                >
                  View all properties
                  within{" "}
                  {
                    NEARBY_RADIUS_KM
                  } KM →
                </button>
              )}

            </div>
          )}

          {/* =============================================
              PROPERTY TYPE PANEL
          ============================================= */}

          {categoryOpen && (
            <div className="border-t border-slate-100 dark:border-slate-800 px-6 pt-4 pb-5">

              <div className="flex justify-end mb-3">

                <button
                  type="button"
                  onClick={
                    clearAll
                  }
                  className="text-sm text-blue-600 hover:underline"
                >
                  Clear
                </button>

              </div>

              <div className="grid grid-cols-1 gap-x-4 gap-y-3 max-w-2xl sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10">

                {PROPERTY_TYPES.map(
                  (type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2.5 text-[14px] text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={
                          !!checkedTypes[
                            type
                          ]
                        }
                        onChange={() =>
                          toggleType(
                            type
                          )
                        }
                        className="w-4 h-4 rounded accent-blue-600"
                      />

                      {
                        type
                      }
                    </label>
                  )
                )}

              </div>

              <p className="mt-4 text-[14px] text-slate-600 dark:text-slate-400">
                Looking for commercial
                properties?{" "}
                <a
                  href="#"
                  className="text-blue-600 hover:underline"
                >
                  Click here
                </a>
              </p>

              <div className="border-t border-slate-100 dark:border-slate-800 mt-4 pt-4">

                <div className="flex items-center gap-3 flex-wrap">

                  {FILTER_PILLS.map(
                    (pill) => (
                      <button
                        key={
                          pill
                        }
                        type="button"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-300 dark:border-slate-700 text-[14px] text-slate-700 dark:text-slate-200 hover:border-slate-400"
                      >
                        {
                          pill
                        }

                        <FiChevronDown
                          size={12}
                        />
                      </button>
                    )
                  )}

                </div>

              </div>

            </div>
          )}

        </div>
      </div>

      {/* =================================================
          LOCATION PERMISSION MODAL
      ================================================= */}

      {locationModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          style={{
            background:
              "rgba(15, 23, 42, 0.55)",
            backdropFilter:
              "blur(4px)",
          }}
        >

          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

            {/* MODAL HEADER */}

            <div className="relative px-6 pt-7 pb-4">

              <button
                type="button"
                onClick={() =>
                  setLocationModalOpen(
                    false
                  )
                }
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"
              >
                <FiX
                  size={18}
                />
              </button>

              <div className="flex justify-center mb-4">

                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                  <FiMapPin
                    size={30}
                    className="text-blue-600"
                  />
                </div>

              </div>

              <h2 className="text-xl font-semibold text-center text-slate-900">
                Find Properties Near You
              </h2>

              <p className="mt-2 text-sm text-center text-slate-500 leading-6">
                Allow location access to
                discover properties within{" "}
                <strong>
                  {
                    NEARBY_RADIUS_KM
                  } KM
                </strong>{" "}
                of your current location.
              </p>

            </div>

            {/* MODAL BODY */}

            <div className="px-6 pb-6">

              {/* ==========================================
                  INITIAL PROMPT
              ========================================== */}

              {locationStatus ===
                "idle" && (
                <>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 mb-5">

                    <div className="flex gap-3">

                      <FiNavigation
                        className="text-blue-600 mt-0.5 shrink-0"
                        size={20}
                      />

                      <div>

                        <p className="text-sm font-medium text-slate-800">
                          Use your current
                          location
                        </p>

                        <p className="text-xs text-slate-500 mt-1 leading-5">
                          We will calculate
                          nearby properties
                          within{" "}
                          {
                            NEARBY_RADIUS_KM
                          } KM.
                        </p>

                      </div>

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={
                      getCurrentLocation
                    }
                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                  >
                    Allow Location
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setLocationModalOpen(
                        false
                      )
                    }
                    className="w-full mt-2 h-11 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium"
                  >
                    Not Now
                  </button>
                </>
              )}

              {/* ==========================================
                  REQUESTING
              ========================================== */}

              {locationStatus ===
                "requesting" && (
                <div className="py-6 text-center">

                  <div className="mx-auto w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />

                  <p className="mt-4 text-sm font-medium text-slate-800">
                    Requesting location
                    access...
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Please allow location
                    access in your browser.
                  </p>

                </div>
              )}

              {/* ==========================================
                  SUCCESS
              ========================================== */}

              {locationStatus ===
                "success" && (
                <div className="py-6 text-center">

                  <div className="mx-auto w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                    <FiMapPin
                      size={22}
                      className="text-green-600"
                    />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-green-700">
                    Location Access
                    Granted
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Finding properties within{" "}
                    {
                      NEARBY_RADIUS_KM
                    } KM...
                  </p>

                </div>
              )}

              {/* ==========================================
                  DENIED
              ========================================== */}

              {locationStatus ===
                "denied" && (
                <>
                  <div className="rounded-xl bg-red-50 border border-red-100 p-4">

                    <div className="flex gap-3">

                      <FiMapPin
                        className="text-red-600 shrink-0 mt-0.5"
                        size={20}
                      />

                      <div>

                        <p className="text-sm font-semibold text-red-700">
                          Please Allow
                          Location Access
                          From Settings
                        </p>

                        <p className="text-xs text-red-600 mt-2 leading-5">
                          Your browser has
                          blocked location
                          access.
                        </p>

                      </div>

                    </div>

                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 p-4">

                    <p className="text-sm font-medium text-slate-800 mb-3">
                      Allow location in
                      browser settings
                    </p>

                    <ol className="text-xs text-slate-600 space-y-2 list-decimal ml-4">

                      <li>
                        Click the 🔒 icon
                        near the website
                        address.
                      </li>

                      <li>
                        Open{" "}
                        <strong>
                          Site settings
                        </strong>
                        .
                      </li>

                      <li>
                        Find{" "}
                        <strong>
                          Location
                        </strong>
                        .
                      </li>

                      <li>
                        Select{" "}
                        <strong>
                          Allow
                        </strong>
                        .
                      </li>

                      <li>
                        Reload the page if
                        required.
                      </li>

                      <li>
                        Click the location
                        button again.
                      </li>

                    </ol>

                  </div>

                  <button
                    type="button"
                    onClick={
                      handleLocationButton
                    }
                    className="w-full mt-5 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    Try Again
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setLocationModalOpen(
                        false
                      )
                    }
                    className="w-full mt-2 h-11 text-sm text-slate-500 hover:text-slate-700"
                  >
                    Close
                  </button>
                </>
              )}

              {/* ==========================================
                  UNAVAILABLE
              ========================================== */}

              {locationStatus ===
                "unavailable" && (
                <>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">

                    <p className="text-sm font-semibold text-amber-700">
                      Location Unavailable
                    </p>

                    <p className="text-xs text-amber-600 mt-2 leading-5">
                      {locationError ||
                        "Please turn on Location Services and try again."}
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={
                      handleLocationButton
                    }
                    className="w-full mt-5 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    Try Again
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setLocationModalOpen(
                        false
                      )
                    }
                    className="w-full mt-2 h-11 text-sm text-slate-500"
                  >
                    Close
                  </button>
                </>
              )}

            </div>

          </div>

        </div>
      )}
    </>
  );
}