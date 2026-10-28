"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { formatPrice } from "@/lib/property-utils";

/* ============================================================
   TYPES
============================================================ */

interface Property {
  id: number;

  name: string;

  image: string | null;

  looking_to: string | null;

  property_category: string | null;

  property_type: string | null;

  city: string | null;

  locality: string | null;

  sub_locality: string | null;

  carpet_area: string | null;

  carpet_area_unit: string | null;

  total_floors: number | null;

  parking: string | null;

  availability: string | null;

  photos: string | null;

  ownership: string | null;

  description: string | null;

  created_at: string | null;

  price: string | null;

  price_per_sqft: string | null;
}

interface SearchResponse {
  results: Property[];

  total: number;

  page?: number;

  limit?: number;

  totalPages: number;
}

/* ============================================================
   HELPERS
============================================================ */

function timeAgo(
  value: string | null
): string {
  if (!value) {
    return "";
  }

  const then = new Date(value).getTime();

  if (Number.isNaN(then)) {
    return "";
  }

  const mins = Math.floor(
    (Date.now() - then) / 60000
  );

  if (mins < 1) {
    return "Just now";
  }

  if (mins < 60) {
    return `${mins}m ago`;
  }

  const hrs = Math.floor(mins / 60);

  if (hrs < 24) {
    return `${hrs}h ago`;
  }

  const days = Math.floor(hrs / 24);

  if (days < 30) {
    return `${days}d ago`;
  }

  const months = Math.floor(days / 30);

  if (months < 12) {
    return `${months}mo ago`;
  }

  return `${Math.floor(months / 12)}y ago`;
}

function isPlot(
  type: string | null
): boolean {
  return /plot|land/i.test(
    type ?? ""
  );
}

/* ============================================================
   PROPERTY CARD
============================================================ */

function PropertyCard({
  p,
}: {
  p: Property;
}) {
  const router = useRouter();

  const [expanded, setExpanded] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const href =
    `/property-detail/${p.id}`;

  const lookingTo =
    p.looking_to
      ?.trim()
      .toLowerCase() ?? "";

  const isRent =
    lookingTo === "rent" ||
    lookingTo === "lease";

  const place = [
    p.locality,
    p.city,
  ]
    .filter(Boolean)
    .join(", ");

  const title =
    [
      p.sub_locality,
      p.locality,
    ]
      .filter(Boolean)
      .join(", ") ||
    p.name ||
    "Property";

  /* ========================================================
     AREA
  ======================================================== */

  const areaNum =
    p.carpet_area
      ? Number(p.carpet_area)
      : NaN;

  const hasArea =
    Number.isFinite(areaNum) &&
    areaNum > 0;

  const sqm =
    hasArea
      ? Math.round(
          areaNum * 0.092903
        )
      : null;

  const unit =
    p.carpet_area_unit ||
    "sq.ft.";

  /* ========================================================
     IMAGE ERROR FALLBACK
  ======================================================== */

  const [imageError, setImageError] =
    useState(false);

  const hasImage =
    Boolean(p.image) &&
    !imageError;

  /* ========================================================
     CARD
  ======================================================== */

  return (
    <article
      onClick={() =>
        router.push(href)
      }
      className="
        cursor-pointer
        bg-white
        dark:bg-slate-900
        rounded-2xl
        border
        border-slate-200
        dark:border-slate-800
        shadow-sm
        hover:shadow-md
        transition-shadow
        overflow-hidden
      "
    >
      <div
        className="
          flex
          flex-col
          md:flex-row
          gap-4
          md:gap-6
          p-4
        "
      >
        {/* ==================================================
            IMAGE
        ================================================== */}

        <Link
          href={href}
          onClick={(e) =>
            e.stopPropagation()
          }
          className="
            relative
            block
            md:w-80
            shrink-0
            h-52
            md:h-auto
            md:min-h-[190px]
            rounded-xl
            overflow-hidden
            bg-gradient-to-b
            from-blue-50
            to-blue-100/40
            dark:from-slate-800
            dark:to-slate-800
          "
        >
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.image!}
              alt={p.name}
              className="
                absolute
                inset-0
                w-full
                h-full
                object-cover
              "
              loading="lazy"
              onError={() =>
                setImageError(true)
              }
            />
          ) : (
            <div
              className="
                absolute
                inset-0
                flex
                flex-col
                items-center
                justify-center
                gap-4
              "
            >
              <svg
                viewBox="0 0 64 64"
                className="
                  w-24
                  h-24
                  text-blue-300
                "
                fill="currentColor"
                aria-hidden
              >
                <path
                  d="
                    M32 6
                    6 28
                    h6
                    v26
                    h16
                    V38
                    h8
                    v16
                    h16
                    V28
                    h6
                    L32 6Z
                  "
                  opacity=".85"
                />
              </svg>

              <span
                className="
                  px-4
                  py-1.5
                  rounded-full
                  bg-white
                  shadow
                  text-sm
                  font-semibold
                  text-blue-600
                "
              >
                No photos yet
              </span>
            </div>
          )}
        </Link>

        {/* ==================================================
            DETAILS
        ================================================== */}

        <div
          className="
            relative
            flex-1
            min-w-0
          "
        >
          {/* =================================================
              TITLE + SHORTLIST
          ================================================= */}

          <div
            className="
              flex
              items-start
              justify-between
              gap-3
            "
          >
            <div className="min-w-0">
              <Link
                href={href}
                onClick={(e) =>
                  e.stopPropagation()
                }
                className="
                  block
                  text-[17px]
                  font-bold
                  text-slate-900
                  dark:text-white
                  hover:text-blue-700
                  truncate
                "
              >
                {title}
              </Link>

              <p
                className="
                  mt-1
                  text-[15px]
                  font-semibold
                  text-slate-800
                  dark:text-slate-200
                "
              >
                {p.property_type ??
                  p.property_category ??
                  "Property"}

                {place && (
                  <span
                    className="
                      font-normal
                      text-slate-600
                      dark:text-slate-400
                    "
                  >
                    {" "}
                    in {place}
                  </span>
                )}
              </p>
            </div>

            <div
              className="
                flex
                items-center
                gap-2
                shrink-0
              "
            >
              <span
                className="
                  px-2
                  py-0.5
                  text-[11px]
                  font-bold
                  tracking-wide
                  uppercase
                  rounded
                  bg-slate-100
                  text-slate-600
                  dark:bg-slate-800
                  dark:text-slate-300
                "
              >
                {isRent
                  ? "Rent"
                  : "Resale"}
              </span>

              <button
                type="button"
                aria-label={
                  saved
                    ? "Remove from shortlist"
                    : "Shortlist"
                }
                onClick={(e) => {
                  e.stopPropagation();

                  setSaved(
                    (current) =>
                      !current
                  );
                }}
                className="
                  p-1
                  rounded-full
                  hover:bg-slate-100
                  dark:hover:bg-slate-800
                "
              >
                <svg
                  viewBox="0 0 24 24"
                  className={`
                    w-6
                    h-6
                    ${
                      saved
                        ? "fill-red-500 text-red-500"
                        : "fill-slate-300 text-slate-300"
                    }
                  `}
                  aria-hidden
                >
                  <path
                    d="
                      M12 21
                      s-7.5-4.6-9.6-9.2
                      C.9 8.4 2.7 5 6 5
                      c2 0 3.3 1.1 4 2.3
                      h4
                      C14.7 6.1 16 5 18 5
                      c3.3 0 5.1 3.4 3.6 6.8
                      C19.5 16.4 12 21 12 21Z
                    "
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* =================================================
              PRICE / AREA / CATEGORY
          ================================================= */}

          <div
            className="
              mt-4
              flex
              flex-wrap
              items-stretch
              gap-y-3
            "
          >
            {/* PRICE */}

            <div className="pr-5">
              <p
                className="
                  text-xl
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                {p.price
                  ? formatPrice(p.price)
                  : "Price on request"}

                {isRent && (
                  <span
                    className="
                      text-sm
                      font-normal
                      text-slate-500
                    "
                  >
                    {" "}
                    /month
                  </span>
                )}
              </p>

              {p.price_per_sqft &&
                Number(
                  p.price_per_sqft
                ) > 0 && (
                  <p
                    className="
                      text-sm
                      text-slate-600
                      dark:text-slate-400
                    "
                  >
                    {formatPrice(
                      p.price_per_sqft
                    )}{" "}
                    /sqft
                  </p>
                )}
            </div>

            {/* AREA */}

            {hasArea && (
              <div
                className="
                  px-5
                  border-l
                  border-slate-200
                  dark:border-slate-700
                "
              >
                <p
                  className="
                    text-[15px]
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  {areaNum.toLocaleString(
                    "en-IN"
                  )}{" "}
                  {unit}

                  {sqm &&
                    /sq\.?\s*ft|sqft/i.test(
                      unit
                    ) && (
                      <span
                        className="
                          ml-2
                          text-sm
                          font-normal
                          text-slate-500
                        "
                      >
                        ({sqm} sqm)
                      </span>
                    )}
                </p>

                <p
                  className="
                    text-sm
                    text-slate-600
                    dark:text-slate-400
                  "
                >
                  {isPlot(
                    p.property_type
                  )
                    ? "Plot Area"
                    : "Carpet Area"}
                </p>
              </div>
            )}

            {/* CATEGORY */}

            {(p.property_category ||
              p.availability) && (
              <div
                className="
                  pl-5
                  border-l
                  border-slate-200
                  dark:border-slate-700
                "
              >
                <p
                  className="
                    text-[15px]
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  {p.property_category ??
                    p.property_type ??
                    "Property"}
                </p>

                {p.availability && (
                  <p
                    className="
                      text-sm
                      text-slate-600
                      dark:text-slate-400
                    "
                  >
                    {p.availability}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* =================================================
              DESCRIPTION
          ================================================= */}

          {p.description && (
            <div
              className="
                mt-4
                flex
                items-start
                gap-2
                text-sm
                text-slate-600
                dark:text-slate-400
              "
            >
              <p
                className={`
                  flex-1
                  whitespace-pre-line
                  ${
                    expanded
                      ? ""
                      : "line-clamp-1"
                  }
                `}
              >
                {p.description}
              </p>

              <button
                type="button"
                aria-label={
                  expanded
                    ? "Show less"
                    : "Show more"
                }
                onClick={(e) => {
                  e.stopPropagation();

                  setExpanded(
                    (current) =>
                      !current
                  );
                }}
                className="
                  p-1
                  text-slate-400
                  hover:text-slate-600
                "
              >
                <svg
                  viewBox="0 0 20 20"
                  className={`
                    w-4
                    h-4
                    fill-current
                    transition-transform
                    ${
                      expanded
                        ? "rotate-180"
                        : ""
                    }
                  `}
                >
                  <path d="M5 7l5 6 5-6H5Z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <div
        className="
          flex
          flex-wrap
          items-center
          justify-between
          gap-3
          px-4
          py-3
          bg-slate-50
          dark:bg-slate-800/60
          md:pl-[calc(1rem+20rem+1.5rem)]
        "
      >
        <div className="text-sm">
          <p className="text-slate-500">
            {timeAgo(p.created_at)}
          </p>

          {p.ownership && (
            <p
              className="
                font-semibold
                text-slate-800
                dark:text-slate-200
              "
            >
              {p.ownership}
            </p>
          )}
        </div>

        <div
          className="
            flex
            items-center
            gap-3
          "
        >
          <Link
            href={href}
            onClick={(e) =>
              e.stopPropagation()
            }
            className="
              px-5
              py-2
              rounded-lg
              border
              border-blue-600
              text-blue-600
              font-semibold
              text-sm
              hover:bg-blue-50
              dark:hover:bg-slate-800
            "
          >
            View Details
          </Link>

          <Link
            href={`${href}#contact`}
            onClick={(e) =>
              e.stopPropagation()
            }
            className="
              px-5
              py-2
              rounded-lg
              bg-blue-600
              text-white
              font-semibold
              text-sm
              hover:bg-blue-700
            "
          >
            Contact
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   MAIN PAGE
============================================================ */

export default function PropertiesList() {
  const searchParams =
    useSearchParams();

  const router = useRouter();

  const search =
    searchParams.get("search") ??
    "";

  const lookingTo =
    (
      searchParams.get(
        "looking_to"
      ) ?? ""
    ).toLowerCase();

  const page = Math.max(
    1,
    Number.parseInt(
      searchParams.get("page") ??
        "1",
      10
    ) || 1
  );

  const [
    data,
    setData,
  ] = useState<SearchResponse>({
    results: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /* ========================================================
     FETCH SEARCH RESULTS
  ======================================================== */

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadProperties() {
      setLoading(true);
      setError("");

      try {
        const params =
          new URLSearchParams(
            searchParams.toString()
          );

        params.set(
          "limit",
          "10"
        );

        /*
         * Always make sure page exists.
         */
        params.set(
          "page",
          String(page)
        );

        const response =
          await fetch(
            `/api/search?${params.toString()}`,
            {
              method: "GET",
              cache: "no-store",
              signal:
                controller.signal,
            }
          );

        if (!response.ok) {
          throw new Error(
            "Failed to load properties"
          );
        }

        const json =
          (await response.json()) as Partial<SearchResponse>;

        setData({
          results:
            Array.isArray(
              json.results
            )
              ? json.results
              : [],

          total:
            Number(json.total) ||
            0,

          page:
            Number(json.page) ||
            page,

          limit:
            Number(json.limit) ||
            10,

          totalPages:
            Number(
              json.totalPages
            ) || 1,
        });
      } catch (err) {
        if (
          err instanceof Error &&
          err.name ===
            "AbortError"
        ) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load properties"
        );
      } finally {
        if (
          !controller.signal
            .aborted
        ) {
          setLoading(false);
        }
      }
    }

    loadProperties();

    return () =>
      controller.abort();
  }, [searchParams, page]);

  /* ========================================================
     PAGINATION
  ======================================================== */

  const goToPage = (
    nextPage: number
  ) => {
    const safePage =
      Math.max(
        1,
        Math.min(
          nextPage,
          data.totalPages
        )
      );

    const params =
      new URLSearchParams(
        searchParams.toString()
      );

    params.set(
      "page",
      String(safePage)
    );

    router.push(
      `/properties?${params.toString()}`
    );
  };

  /* ========================================================
     TITLE
  ======================================================== */

  const isRentSearch =
    lookingTo === "rent" ||
    lookingTo === "lease";

  const isBuySearch =
    lookingTo === "sell" ||
    lookingTo === "sale" ||
    lookingTo === "buy";

  const title = [
    isRentSearch
      ? "Rent"
      : isBuySearch
      ? "Buy"
      : null,

    search
      ? `“${search}”`
      : "Properties",
  ]
    .filter(Boolean)
    .join(" · ");

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <main
      className="
        max-w-5xl
        mx-auto
        px-4
        py-18
      "
    >
      <h1
        className="
          text-2xl
          font-semibold
          text-slate-900
          dark:text-white
        "
      >
        {title}
      </h1>

      {!loading &&
        !error && (
          <p
            className="
              mt-1
              text-sm
              text-slate-500
              dark:text-slate-400
            "
          >
            {data.total}{" "}
            {data.total === 1
              ? "property"
              : "properties"}{" "}
            found
          </p>
        )}

      {/* ERROR */}

      {error && (
        <div
          className="
            mt-6
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-red-600
          "
        >
          {error}
        </div>
      )}

      {/* LOADING */}

      {loading ? (
        <div
          className="
            mt-6
            space-y-5
          "
        >
          {Array.from({
            length: 3,
          }).map((_, index) => (
            <div
              key={index}
              className="
                h-64
                rounded-2xl
                bg-slate-100
                dark:bg-slate-800
                animate-pulse
              "
            />
          ))}
        </div>
      ) : data.results.length ===
          0 && !error ? (
        <div
          className="
            mt-10
            text-center
            text-slate-500
          "
        >
          {search
            ? `No properties found for “${search}”.`
            : "No properties found."}
        </div>
      ) : (
        <div
          className="
            mt-6
            space-y-5
          "
        >
          {data.results.map(
            (property) => (
              <PropertyCard
                key={property.id}
                p={property}
              />
            )
          )}
        </div>
      )}

      {/* ==================================================
          PAGINATION
      ================================================== */}

      {!loading &&
        !error &&
        data.totalPages > 1 && (
          <div
            className="
              mt-8
              flex
              items-center
              justify-center
              gap-4
            "
          >
            <button
              type="button"
              disabled={page <= 1}
              onClick={() =>
                goToPage(
                  page - 1
                )
              }
              className="
                px-4
                py-2
                rounded-lg
                border
                border-slate-300
                dark:border-slate-700
                disabled:opacity-40
                disabled:cursor-not-allowed
              "
            >
              Previous
            </button>

            <span
              className="
                text-sm
                text-slate-600
                dark:text-slate-400
              "
            >
              Page{" "}
              {Math.min(
                page,
                data.totalPages
              )}{" "}
              of{" "}
              {data.totalPages}
            </span>

            <button
              type="button"
              disabled={
                page >=
                data.totalPages
              }
              onClick={() =>
                goToPage(
                  page + 1
                )
              }
              className="
                px-4
                py-2
                rounded-lg
                border
                border-slate-300
                dark:border-slate-700
                disabled:opacity-40
                disabled:cursor-not-allowed
              "
            >
              Next
            </button>
          </div>
        )}
    </main>
  );
}