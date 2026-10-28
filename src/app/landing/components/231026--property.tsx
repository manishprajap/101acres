"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ChevronRight, Heart, Phone } from "lucide-react";

interface PropertiesData {
  id: number;

  image?: string | null;
  images?: string[] | null;

  title?: string | null;
  description?: string | null;

  price?: number | string | null;
  expected_price?: number | string | null;

  carpet_area?: number | string | null;
  carpet_area_unit?: string | null;

  city?: string | null;
  locality?: string | null;
  sub_locality?: string | null;
  location?: string | null;
  propertyLocation?: string | null;

  property_type?: string | null;
  property_category?: string | null;
  looking_to?: string | null;
  availability?: string | null;

  ownership?: string | null;
  postedBy?: string | null;

  status?: string | null;
  possession_status?: string | null;
  sale_type?: string | null; // e.g. "Resale" | "New"

  created_at?: string | null;
  createdAt?: string | null;

  premium?: boolean;
  verified?: boolean;
  video?: string | null;
}

type SortKey = "latest" | "price_low" | "price_high";
type ChipKey = "owner" | "verified" | "under_construction" | "ready" | "photos" | "videos";

const CHIPS: { key: ChipKey; label: string }[] = [
  { key: "owner", label: "Owner" },
  { key: "verified", label: "Verified" },
  { key: "under_construction", label: "Under construction" },
  { key: "ready", label: "Ready To Move" },
  { key: "photos", label: "With Photos" },
  { key: "videos", label: "With Videos" },
];

const SQFT_TO_SQM = 0.092903;
const INITIAL_VISIBLE_PROPERTIES = 6;

/* ============================================================
   HELPERS
============================================================ */

const getNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

const getPrice = (p: PropertiesData) => getNumber(p.price ?? p.expected_price);

const getTime = (p: PropertiesData) => {
  const d = p.created_at || p.createdAt;
  const t = d ? new Date(d).getTime() : NaN;
  return Number.isNaN(t) ? 0 : t;
};

/** Returns null when the property has no image (placeholder is shown instead). */
const getImageSrc = (image?: string | null, images?: string[] | null): string | null => {
  let img = "";
  if (Array.isArray(images) && images.length > 0) img = images[0] || "";
  if (!img && image) img = image;
  img = img.trim();
  if (!img) return null;

  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  if (img.startsWith("/api/uploads/")) return img;
  if (img.startsWith("/uploads/")) return img.replace(/^\/uploads\//, "/api/uploads/");
  if (img.startsWith("uploads/")) return `/api/${img}`;
  if (img.startsWith("/")) return img;
  return `/api/uploads/${encodeURIComponent(img)}`;
};

/** ₹20.08 Lac / ₹1.5 Cr */
const formatPrice = (value: number | null): string => {
  if (value === null) return "Price on request";
  if (value >= 10000000) return `₹${Number((value / 10000000).toFixed(2))} Cr`;
  if (value >= 100000) return `₹${Number((value / 100000).toFixed(2))} Lac`;
  return `₹${value.toLocaleString("en-IN")}`;
};

const getLocation = (p: PropertiesData): string => {
  if (p.location?.trim()) return p.location.trim();
  if (p.propertyLocation?.trim()) return p.propertyLocation.trim();
  const locality = p.locality?.trim();
  const sub = p.sub_locality?.trim();
  const city = p.city?.trim();
  if (locality && city) return `${locality}, ${city}`;
  if (sub && city) return `${sub}, ${city}`;
  return locality || sub || city || "Location not available";
};

/** "Posted by" now shows the raw `ownership` value from the properties table. */
const getPostedBy = (p: PropertiesData): string =>
  p.ownership?.trim() || "Not specified";

/** Used by the "Owner" filter chip. */
const isOwner = (p: PropertiesData) =>
  /owner|individual/i.test(p.ownership ?? "");

const formatPostedDate = (value: string | null | undefined): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diff = Date.now() - date.getTime();
  if (diff < 0) return "Just now";

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
};

const isReady = (p: PropertiesData) =>
  /ready/i.test(p.possession_status || p.status || "");
const isUnderConstruction = (p: PropertiesData) =>
  /under\s*construction/i.test(p.possession_status || p.status || "");

/* ============================================================
   PLACEHOLDER (no photo)
============================================================ */

function PhotoPlaceholder({ href }: { href: string }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-b from-[#eef4ff] to-[#dbe9ff]">
      <svg viewBox="0 0 140 130" className="h-[130px] w-[140px]" aria-hidden="true">
        <circle cx="70" cy="68" r="58" fill="#e3eeff" />
        <path d="M22 66 70 26l48 40H22Z" fill="#7fb0ff" />
        <rect x="34" y="66" width="72" height="44" fill="#a8cbff" />
        <rect x="44" y="76" width="16" height="34" fill="#5f9bf5" />
        <rect x="66" y="78" width="14" height="14" fill="#5f9bf5" />
        <rect x="86" y="78" width="14" height="14" fill="#5f9bf5" />
      </svg>

      <Link
        href={href}
        className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-white px-4 py-[7px] text-[13px] font-semibold text-[#1769aa] shadow-sm"
      >
        Request Photos
        <ChevronRight size={14} />
      </Link>
    </div>
  );
}

/* ============================================================
   CARD
============================================================ */

function PropertyCard({ p }: { p: PropertiesData }) {
  const [expanded, setExpanded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const href = `/property-detail/${p.id}`;
  const image = imageFailed ? null : getImageSrc(p.image, p.images);
  const location = getLocation(p);
  const postedBy = getPostedBy(p);
  const postedDate = formatPostedDate(p.created_at || p.createdAt);

  const price = getPrice(p);
  const area = getNumber(p.carpet_area);
  const unit = p.carpet_area_unit?.trim() || "sqft";
  const perSqft =
    price !== null && area && area > 0 && /sq\s*ft|sqft/i.test(unit)
      ? Math.round(price / area)
      : null;
  const sqm = area && /sq\s*ft|sqft/i.test(unit) ? Math.round(area * SQFT_TO_SQM) : null;

  const ownershipText = p.ownership?.trim() || "";

  const heading =
    p.title?.trim() ||
    `${ownershipText ? ownershipText + " " : ""}${p.property_type ?? "property"}`.trim();

  const category = p.property_category?.trim() || "Residential property";
  const saleTag = (p.sale_type || (p.looking_to === "rent" ? "Rent" : "Resale")).toUpperCase();

  const typeLabel = p.property_type?.trim() || "Property";
  const possession = p.possession_status?.trim() || p.availability?.trim() || "";
  const lookingTo = p.looking_to?.toLowerCase();

  const ownerText = ownershipText ? `${ownershipText.toLowerCase()} ` : "";

  const description =
    p.description?.trim() ||
    `Located in ${location.toLowerCase()}, this ${area ? `${area} ${unit} ` : ""}${ownerText}${typeLabel.toLowerCase()} is available for ${lookingTo === "rent" || lookingTo === "pg" ? "rent" : "sale"}.`;

  return (
    <article className="overflow-hidden rounded-[14px] border border-[#eef0f3] bg-white shadow-[0_2px_10px_rgba(20,40,80,0.08)]">
      <div className="flex flex-col gap-4 p-4 md:flex-row md:gap-6">
        {/* IMAGE */}
        <div className="relative h-[220px] w-full shrink-0 overflow-hidden rounded-[6px] bg-[#edf1f5] md:w-[345px]">
          {image ? (
            <Link href={href} className="block h-full w-full">
              <Image
                src={image}
                alt={heading}
                fill
                sizes="345px"
                unoptimized
                className="object-cover"
                onError={() => setImageFailed(true)}
              />
            </Link>
          ) : (
            <PhotoPlaceholder href={href} />
          )}

          {p.premium && (
            <span className="absolute left-2 top-2 z-10 rounded bg-red-500 px-2 py-1 text-[10px] font-semibold text-white">
              PREMIUM
            </span>
          )}
        </div>

        {/* DETAILS */}
        <div className="relative min-w-0 flex-1">
          {/* RESALE TAG */}
          <span className="absolute -right-4 top-0 hidden bg-[#e9ecef] py-[3px] pl-3 pr-4 text-[10px] font-bold tracking-wide text-[#333] md:block">
            {saleTag}
          </span>

          {/* HEART */}
          <button
            type="button"
            aria-label="Add to favourites"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute -left-[42px] top-[2px] hidden text-[#9aa0a6] hover:text-red-500 md:block"
          >
            <Heart size={22} strokeWidth={2} fill="currentColor" />
          </button>

          {/* TITLE */}
          <Link href={href} className="block pr-16">
            <h3 className="truncate text-[15px] font-bold leading-[22px] text-[#111827]">
              {heading}
            </h3>
            <p className="truncate text-[15px] leading-[22px] text-[#374151]">
              <span className="font-bold text-[#111827]">{category}</span> in {location}
            </p>
          </Link>

          {/* STATS */}
          <div className="mt-4 grid grid-cols-1 gap-y-3 sm:grid-cols-[1.1fr_1.1fr_1fr] sm:divide-x sm:divide-[#e5e7eb]">
            <div className="sm:pr-4">
              <div className="text-[22px] font-bold leading-[28px] text-[#111827]">
                {formatPrice(price)}
              </div>
              {perSqft && (
                <div className="text-[14px] leading-[20px] text-[#4b5563]">
                  ₹{perSqft.toLocaleString("en-IN")} /{unit}
                </div>
              )}
            </div>

            <div className="sm:px-4">
              {area ? (
                <>
                  <div className="flex items-baseline gap-2 text-[#111827]">
                    <span className="text-[17px] font-bold leading-[24px]">
                      {area.toLocaleString("en-IN")} {unit}
                    </span>
                    {sqm !== null && (
                      <span className="flex items-center text-[14px] font-normal text-[#4b5563]">
                        ({sqm} sqm)
                        <ChevronDown size={14} className="ml-1 text-[#6b7280]" />
                      </span>
                    )}
                  </div>
                  <div className="text-[14px] leading-[20px] text-[#4b5563]">Plot Area</div>
                </>
              ) : (
                <div className="text-[14px] text-[#9ca3af]">Area not available</div>
              )}
            </div>

            <div className="sm:pl-4">
              <div className="truncate text-[17px] font-bold leading-[24px] text-[#111827]">
                {typeLabel}
              </div>
              {possession && (
                <div className="truncate text-[14px] leading-[20px] text-[#4b5563]">
                  {possession}
                </div>
              )}
            </div>
          </div>

          {/* DESCRIPTION */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-4 flex w-full items-start justify-between gap-3 text-left text-[14px] leading-[20px] text-[#4b5563]"
          >
            <span className={expanded ? "" : "truncate"}>{description}</span>
            <ChevronDown
              size={16}
              className={`mt-[2px] shrink-0 text-[#6b7280] transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between gap-3 bg-[#f4f5f7] px-4 py-3 md:pl-[385px]">
        <div className="text-[14px] leading-[22px] text-[#4b5563]">
          {postedDate && <div>{postedDate}</div>}
          <div className="font-bold text-[#111827]">{postedBy}</div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={href}
            className="rounded-[8px] border border-[#1769aa] bg-white px-6 py-[9px] text-[15px] font-semibold text-[#1769aa] hover:bg-[#f1f7ff]"
          >
            View Number
          </Link>
          <Link
            href={href}
            className="flex items-center gap-2 rounded-[8px] bg-[#1769d8] px-6 py-[10px] text-[15px] font-semibold text-white hover:bg-[#125bc0]"
          >
            <Phone size={16} fill="currentColor" />
            Contact
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function Property() {
  const [all, setAll] = useState<PropertiesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ChipKey[]>([]);
  const [sort, setSort] = useState<SortKey>("latest");
  const [showAllProperties, setShowAllProperties] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/properties?status=published&limit=100", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json: unknown = await res.json();
        const data = json && typeof json === "object" && "items" in json &&
          Array.isArray((json as { items?: unknown }).items)
          ? (json as { items: PropertiesData[] }).items
          : [];

        setAll(data);
      } catch (error) {
        console.error("Failed to fetch properties:", error);
        setAll([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleChip = (key: ChipKey) =>
    setActive((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const list = useMemo(() => {
    const filtered = all.filter((p) =>
      active.every((key) => {
        switch (key) {
          case "owner":
            return isOwner(p);
          case "verified":
            return !!p.verified;
          case "under_construction":
            return isUnderConstruction(p);
          case "ready":
            return isReady(p);
          case "photos":
            return !!getImageSrc(p.image, p.images);
          case "videos":
            return !!p.video;
        }
      })
    );

    return [...filtered].sort((a, b) => {
      if (sort === "price_low") return (getPrice(a) ?? Infinity) - (getPrice(b) ?? Infinity);
      if (sort === "price_high") return (getPrice(b) ?? -1) - (getPrice(a) ?? -1);
      return getTime(b) - getTime(a) || b.id - a.id;
    });
  }, [all, active, sort]);

  const visibleProperties = showAllProperties
    ? list
    : list.slice(0, INITIAL_VISIBLE_PROPERTIES);

  return (
    <section className="w-full">
      <div className="mx-auto max-w-[900px] px-4">
        {/* FILTER BAR */}
        <div className="flex items-center gap-3 rounded-[10px] border border-[#eef0f3] bg-white px-3 py-2">
          <div
            className="flex flex-1 items-center gap-3 overflow-x-auto"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {CHIPS.map((chip) => {
              const on = active.includes(chip.key);
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => toggleChip(chip.key)}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-[6px] text-[14px] transition-colors ${
                    on
                      ? "border-[#1769d8] bg-[#eaf2ff] text-[#1769d8]"
                      : "border-[#d9dde3] bg-white text-[#374151] hover:border-[#9aa4b2]"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          <label className="flex shrink-0 items-center gap-2 border-l border-[#e5e7eb] pl-3 text-[14px] font-semibold text-[#111827]">
            <span>Sort By</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="cursor-pointer bg-transparent text-[13px] font-normal text-[#4b5563] outline-none"
            >
              <option value="latest">Latest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </label>
        </div>

        {/* LIST */}
        <div className="mt-4 flex flex-col gap-5">
          {loading ? (
            [1, 2].map((i) => (
              <div key={i} className="rounded-[14px] bg-white p-4 shadow-sm">
                <div className="flex gap-6">
                  <div className="h-[220px] w-[345px] shrink-0 animate-pulse rounded-[6px] bg-gray-200" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-72 animate-pulse rounded bg-gray-200" />
                    <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            ))
          ) : list.length === 0 ? (
            <p className="py-10 text-center text-gray-400">No properties found.</p>
          ) : (
            visibleProperties.map((p) => <PropertyCard key={p.id} p={p} />)
          )}
        </div>

        {!loading && list.length > INITIAL_VISIBLE_PROPERTIES && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAllProperties((visible) => !visible)}
              aria-expanded={showAllProperties}
              className="rounded-lg border border-[#1769d8] px-6 py-2.5 text-sm font-semibold text-[#1769d8] transition-colors hover:bg-[#eaf2ff]"
            >
              {showAllProperties ? "View Less" : "View More"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}