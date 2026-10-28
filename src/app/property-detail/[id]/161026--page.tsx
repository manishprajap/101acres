'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import {
  FiPhone,
  FiCamera,
  FiX,
  FiHeart,
  FiShare2,
  FiCheckCircle,
  FiMapPin,
  FiHome,
  FiUser,
  FiChevronRight,
  FiShield,
} from 'react-icons/fi';

import { LiaCompressArrowsAltSolid } from 'react-icons/lia';

import Navbar from '@/app/landing/components/navbar';
import Footer from '@/app/landing/components/footer';
import Switcher from '@/app/landing/components/switcher';

import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

/* =========================================================
   TYPES
   (Field names match the DB columns returned by the API)
========================================================= */

interface Property {
  id?: number | string;
  status?: string;

  looking_to?: string;
  property_category?: string;
  property_type?: string;
  retail_space_type?: string;
  located_inside?: string;
  mall_name?: string;

  city?: string;
  locality?: string;
  sub_locality?: string;

  carpet_area?: string | number;
  carpet_area_unit?: string;

  expected_price?: string | number;
  price_per_sqft?: string | number;
  maintenance?: string | number;
  current_rent?: string | number;
  price_negotiable?: boolean | number;
  tax_excluded?: boolean | number;

  total_floors?: string | number;
  property_on_floor?: string;
  washroom?: string;
  parking?: string;
  availability?: string;
  property_age?: string;
  ownership?: string;
  property_facing?: string;
  pre_leased?: string;

  description?: string;

  photos?: unknown;
  amenities?: unknown;
  property_features?: unknown;
  society_features?: unknown;
  additional_features?: unknown;
  fire_safety?: unknown;
  located_near?: unknown;
  location_advantages?: unknown;

  [key: string]: unknown;
}

interface DetailItem {
  label: string;
  value: string;
  icon: React.ReactNode;
}

/* =========================================================
   CONSTANTS
========================================================= */

const PAYMENT_DETAILS = {
  accountName: '101ACRES.COM',
  accountNumber: '8054278341',
  ifsc: 'IDIB000M175',
  bank: 'Indian Bank',
  branch:
    'IND MSME BRANCH NEW DELHI, INDER ENCLAVE, NEW DELHI 110087',
  upiId: '101acrescom@indianbk',
  whatsappNumber: '+919217703975',
  qrImage: '/uploads/payment-qr.jpeg',
};

/* =========================================================
   HELPERS
========================================================= */

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function extractProperty(
  response: unknown
): Property | null {
  if (!isObject(response)) return null;

  if (isObject(response.property)) {
    return response.property as Property;
  }

  if (isObject(response.data)) {
    return response.data as Property;
  }

  return null;
}

function text(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function parseJsonValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function itemToString(item: unknown): string {
  if (typeof item === 'string' || typeof item === 'number') {
    return String(item).trim();
  }

  if (isObject(item)) {
    for (const key of [
      'url',
      'src',
      'path',
      'name',
      'label',
      'title',
      'value',
    ]) {
      const v = item[key];
      if (typeof v === 'string' && v.trim()) {
        return v.trim();
      }
    }
  }

  return '';
}

function parseStringArray(value: unknown): string[] {
  const parsed = parseJsonValue(value);

  if (Array.isArray(parsed)) {
    return parsed.map(itemToString).filter(Boolean);
  }

  if (typeof parsed === 'string') {
    return parsed
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  // e.g. { lift: true, parking: false } -> ["lift"]
  if (isObject(parsed)) {
    return Object.entries(parsed)
      .filter(
        ([, v]) =>
          v === true || v === 1 || v === '1' || v === 'true' || v === 'yes'
      )
      .map(([key]) => key);
  }

  return [];
}

function normalizeImagePath(image: string): string {
  const cleaned = image
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');

  if (
    cleaned.startsWith('http://') ||
    cleaned.startsWith('https://') ||
    cleaned.startsWith('data:')
  ) {
    return cleaned;
  }

  if (cleaned.startsWith('uploads/')) {
    return `/${cleaned}`;
  }

  return `/uploads/${cleaned}`;
}

function formatPrice(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'Price on request';
  }

  const n = Number(value);

  if (!Number.isFinite(n) || n <= 0) {
    return 'Price on request';
  }

  if (n >= 10000000) {
    return `₹${parseFloat((n / 10000000).toFixed(2))} Cr`;
  }

  if (n >= 100000) {
    return `₹${parseFloat((n / 100000).toFixed(2))} Lac`;
  }

  return `₹${n.toLocaleString('en-IN')}`;
}

function isTruthyFlag(value: unknown): boolean {
  return (
    value === true ||
    value === 1 ||
    value === '1' ||
    value === 'true' ||
    value === 'yes'
  );
}

function humanize(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* =========================================================
   PAGE
========================================================= */

export default function PropertiesDetail() {
  const params = useParams();

  const rawId = params?.id;
  const propertyId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [isOpen, setIsOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  /* -------------------------------------------------------
     FETCH PROPERTY
  ------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function fetchProperty() {
      if (!propertyId) {
        setErrorMessage('Property ID is missing.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage('');

        const response = await fetch(
          `/api/properties/${encodeURIComponent(String(propertyId))}`,
          {
            method: 'GET',
            headers: { Accept: 'application/json' },
            cache: 'no-store',
          }
        );

        const contentType = response.headers.get('content-type') || '';

        if (!contentType.includes('application/json')) {
          throw new Error(
            `API returned status ${response.status}`
          );
        }

        const responseData: unknown = await response.json();

        if (!response.ok) {
          let message = `Unable to load property. Status: ${response.status}`;

          if (isObject(responseData)) {
            // API sends `error`, some routes send `message`
            if (typeof responseData.error === 'string') {
              message = responseData.error;
            } else if (typeof responseData.message === 'string') {
              message = responseData.message;
            }
          }

          throw new Error(message);
        }

        const propertyData = extractProperty(responseData);

        if (!propertyData) {
          throw new Error('Property data was not found.');
        }

        if (!cancelled) {
          setProperty(propertyData);
        }
      } catch (error) {
        console.error('Failed to fetch property:', error);

        if (!cancelled) {
          setProperty(null);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Failed to load property.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProperty();

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  /* -------------------------------------------------------
     HOOKS THAT DEPEND ON PROPERTY
     (must run BEFORE any early return)
  ------------------------------------------------------- */

  const imageUrls = useMemo(
    () =>
      parseStringArray(property?.photos).map(normalizeImagePath),
    [property?.photos]
  );

  const slides = useMemo(
    () => imageUrls.map((src) => ({ src })),
    [imageUrls]
  );

  const handleClick = (index: number) => {
    if (imageUrls.length === 0) return;
    setPhotoIndex(index);
    setIsOpen(true);
  };

  /* -------------------------------------------------------
     LOADING
  ------------------------------------------------------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8fb] flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin mx-auto" />
          <p className="text-slate-500 text-sm mt-4">
            Loading property...
          </p>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------
     NOT FOUND
  ------------------------------------------------------- */

  if (!property) {
    return (
      <>
        <Navbar navClass="" topnavClass="" tagline={false} />

        <main className="min-h-[70vh] bg-[#f6f8fb] pt-28 pb-16">
          <div className="container mx-auto max-w-[1280px] px-4">
            <div className="bg-white border border-slate-200 rounded-lg p-10 text-center shadow-sm">
              <FiHome size={42} className="mx-auto text-slate-300" />

              <h1 className="text-xl font-semibold text-slate-800 mt-4">
                Property not found
              </h1>

              <p className="text-sm text-slate-500 mt-2">
                {errorMessage ||
                  'The property you are looking for could not be found.'}
              </p>

              <Link
                href="/"
                className="inline-flex items-center justify-center mt-6 px-5 py-2.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </main>

        <Footer />
        <Switcher />
      </>
    );
  }

  /* -------------------------------------------------------
     DERIVED VALUES
  ------------------------------------------------------- */

  const transactionValue = text(property.looking_to).toLowerCase();

  const isForRent =
    transactionValue.includes('rent') ||
    transactionValue.includes('lease');

  const listingLabel = isForRent ? 'For Rent' : 'For Sale';

  const propertyType =
    text(property.retail_space_type) ||
    text(property.property_type) ||
    text(property.property_category) ||
    'Property';

  const category = text(property.property_category);

  const locationParts = [
    property.sub_locality,
    property.locality,
    property.city,
  ]
    .map(text)
    .filter(Boolean);

  const location =
    locationParts.length > 0
      ? locationParts.join(', ')
      : 'Location not available';

  const title = [
    propertyType,
    isForRent ? 'for Rent' : 'for Sale',
    text(property.locality) ? `in ${text(property.locality)}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const carpetArea = text(property.carpet_area);
  const areaUnit = text(property.carpet_area_unit) || 'sq.ft';
  const areaLabel = carpetArea
    ? `${Number(carpetArea) || carpetArea} ${areaUnit}`
    : '';

  const price = formatPrice(property.expected_price);

  const description =
    text(property.description) ||
    'This property offers convenient access to nearby facilities and essential amenities.';

  // Value of the `ownership` column from the properties table
  // (e.g. "Owner", "Agent", "Builder"). Falls back to "Owner" if empty.
  const ownership = text(property.ownership) || 'Owner';
  const availability =
    text(property.availability) ||
    (isForRent ? 'Available for Rent' : 'Ready to Move');

  /* -------------------------------------------------------
     DETAILS (only fields that actually have a value)
  ------------------------------------------------------- */

  const propertyDetails: DetailItem[] = (
    [
      {
        label: 'Property Type',
        value: propertyType,
        icon: <FiHome />,
      },
      {
        label: 'Category',
        value: category,
        icon: <FiHome />,
      },
      {
        label: 'Carpet Area',
        value: areaLabel,
        icon: <LiaCompressArrowsAltSolid />,
      },
      {
        label: 'Floor',
        value: text(property.property_on_floor)
          ? `${text(property.property_on_floor)}${
              text(property.total_floors)
                ? ` of ${text(property.total_floors)}`
                : ''
            }`
          : '',
        icon: <FiHome />,
      },
      {
        label: 'Washroom',
        value: text(property.washroom),
        icon: <FiCheckCircle />,
      },
      {
        label: 'Parking',
        value: text(property.parking),
        icon: <FiCheckCircle />,
      },
      {
        label: 'Property Age',
        value: text(property.property_age),
        icon: <FiCheckCircle />,
      },
      {
        label: 'Facing',
        value: text(property.property_facing),
        icon: <FiMapPin />,
      },
      {
        label: 'Availability',
        value: availability,
        icon: <FiCheckCircle />,
      },
      {
        label: 'Listed By',
        value: ownership,
        icon: <FiUser />,
      },
    ] as DetailItem[]
  ).filter((item) => item.value);

  const overviewItems: { label: string; value: string }[] = (
    [
      { label: 'Property Type', value: propertyType },
      { label: 'Transaction', value: listingLabel },
      { label: 'Carpet Area', value: areaLabel },
      { label: 'Floor', value: text(property.property_on_floor) },
      { label: 'Parking', value: text(property.parking) },
      { label: 'Ownership', value: ownership },
    ] as { label: string; value: string }[]
  ).map((item) => ({ ...item, value: item.value || '-' }));

  /* -------------------------------------------------------
     AMENITIES / FEATURES
  ------------------------------------------------------- */

  const allAmenities = Array.from(
    new Set(
      [
        ...parseStringArray(property.amenities),
        ...parseStringArray(property.property_features),
        ...parseStringArray(property.society_features),
        ...parseStringArray(property.additional_features),
        ...parseStringArray(property.fire_safety),
      ].map(humanize)
    )
  );

  const nearbyPlaces = Array.from(
    new Set([
      ...parseStringArray(property.located_near),
      ...parseStringArray(property.location_advantages),
    ])
  );

  const highlights = [
    text(property.locality) ? `Located in ${text(property.locality)}` : '',
    availability,
    ownership,
    isTruthyFlag(property.price_negotiable) ? 'Price Negotiable' : '',
    text(property.pre_leased) && text(property.pre_leased) !== 'No'
      ? 'Pre-leased'
      : '',
  ].filter(Boolean);

  const priceSubText = [
    areaLabel,
    text(property.price_per_sqft)
      ? `₹${Number(property.price_per_sqft).toLocaleString('en-IN')}/${areaUnit}`
      : '',
    isTruthyFlag(property.price_negotiable) ? 'Negotiable' : '',
  ]
    .filter(Boolean)
    .join(' • ');

  /* -------------------------------------------------------
     RETURN
  ------------------------------------------------------- */

  return (
    <>
      <Navbar navClass="" topnavClass="" tagline={false} />

      <main className="bg-[#f6f8fb] pt-24 pb-16">
        <div className="container mx-auto max-w-[1280px] px-4">
          {/* BREADCRUMB */}

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-4">
            <Link href="/" className="hover:text-blue-600">
              Home
            </Link>

            <FiChevronRight size={12} />
            <span>{category || propertyType}</span>

            <FiChevronRight size={12} />
            <span>{listingLabel}</span>

            <FiChevronRight size={12} />
            <span className="text-slate-700">Property Details</span>
          </div>

          {/* PROPERTY CARD */}

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            {/* TOP INFORMATION */}

            <div className="px-5 md:px-7 py-5 border-b border-slate-200">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-green-50 text-green-700 text-xs font-medium">
                      {listingLabel}
                    </span>

                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                      {category || propertyType}
                    </span>
                  </div>

                  <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
                    {title}
                  </h1>

                  <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                    <FiMapPin className="text-blue-600 shrink-0" />
                    <span>{location}</span>
                  </div>
                </div>

                {/* PRICE */}

                <div className="lg:text-right shrink-0">
                  <div className="text-2xl md:text-3xl font-bold text-slate-900">
                    {price}
                  </div>

                  {priceSubText && (
                    <div className="text-xs text-slate-500 mt-1">
                      {priceSubText}
                    </div>
                  )}

                  <div className="flex items-center lg:justify-end gap-2 mt-3">
                    <button
                      type="button"
                      aria-label="Add property to favourites"
                      className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-200"
                    >
                      <FiHeart />
                    </button>

                    <button
                      type="button"
                      aria-label="Share property"
                      className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200"
                    >
                      <FiShare2 />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* GALLERY + SUMMARY */}

            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-[58%_42%] gap-5">
                {/* GALLERY */}

                <div className="grid grid-cols-12 gap-2 h-[390px] md:h-[440px]">
                  <div className="col-span-8 relative rounded-lg overflow-hidden bg-slate-100">
                    {imageUrls.length > 0 ? (
                      <Image
                        src={imageUrls[0]}
                        alt={title}
                        fill
                        sizes="60vw"
                        unoptimized
                        className="object-cover cursor-pointer"
                        onClick={() => handleClick(0)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        No image available
                      </div>
                    )}

                    {imageUrls.length > 0 && (
                      <div className="absolute bottom-3 left-3">
                        <button
                          type="button"
                          onClick={() => handleClick(0)}
                          className="inline-flex items-center gap-2 rounded-md bg-black/70 text-white px-3 py-2 text-xs hover:bg-black/80"
                        >
                          <FiCamera />
                          View Photos ({imageUrls.length})
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="col-span-4 grid grid-rows-2 gap-2">
                    {[1, 2].map((index) => (
                      <div
                        key={index}
                        className="relative rounded-lg overflow-hidden bg-slate-100"
                      >
                        {imageUrls[index] ? (
                          <Image
                            src={imageUrls[index]}
                            alt={`${title} ${index + 1}`}
                            fill
                            sizes="30vw"
                            unoptimized
                            className="object-cover cursor-pointer hover:scale-105 transition"
                            onClick={() => handleClick(index)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                            No image
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* SUMMARY */}

                <div className="border border-slate-200 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-semibold text-lg text-slate-900">
                      Property Overview
                    </h2>

                    <span className="text-xs text-slate-400">
                      Verified Listing
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-5 gap-y-5">
                    {overviewItems.map((item) => (
                      <div key={item.label}>
                        <p className="text-xs text-slate-400">
                          {item.label}
                        </p>

                        <p className="text-sm font-medium text-slate-800 mt-1">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-7">
                    <button
                      type="button"
                      onClick={() => setIsPaymentOpen(false)}
                      className="h-11 rounded-md bg-[#0078d4] hover:bg-[#0067b8] text-white text-sm font-medium"
                    >
                      Contact {ownership}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPaymentOpen(false)}
                      className="h-11 rounded-md border border-[#0078d4] text-[#0078d4] hover:bg-blue-50 text-sm font-medium"
                    >
                      View Number
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* HIGHLIGHTS */}

            {highlights.length > 0 && (
              <div className="px-4 md:px-6 pb-6">
                <div className="rounded-md bg-[#f3f9fd] border border-blue-100 px-4 py-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {highlights.map((item, index) => (
                      <div
                        key={`${item}-${index}`}
                        className="flex items-center gap-2 text-sm text-slate-700"
                      >
                        <FiCheckCircle className="text-green-500 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PROPERTY DETAILS */}

            <div className="border-t border-slate-200 px-4 md:px-6 py-5">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                {propertyDetails.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>

                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ABOUT */}

            <div className="border-t border-slate-200 px-4 md:px-6 py-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                About Property
              </h2>

              <p className="text-sm leading-6 text-slate-600 max-w-5xl whitespace-pre-line">
                {description}
              </p>
            </div>

            {/* AMENITIES */}

            <div className="border-t border-slate-200 px-4 md:px-6 py-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  Amenities
                </h2>

                {allAmenities.length > 0 && (
                  <span className="text-xs text-blue-600">
                    {allAmenities.length} amenities
                  </span>
                )}
              </div>

              {allAmenities.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {allAmenities.map((amenity, index) => (
                    <div
                      key={`${amenity}-${index}`}
                      className="border border-slate-200 rounded-md p-4 bg-white"
                    >
                      <div className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                        <FiCheckCircle />
                      </div>

                      <p className="text-xs text-slate-700 font-medium">
                        {amenity}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-400">
                  No amenities listed for this property.
                </div>
              )}
            </div>

            {/* NEARBY */}

            {nearbyPlaces.length > 0 && (
              <div className="border-t border-slate-200 px-4 md:px-6 py-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Places nearby
                    </h2>

                    <p className="text-xs text-slate-400 mt-1">
                      Important places around this property
                    </p>
                  </div>

                  <FiMapPin className="text-blue-600" size={22} />
                </div>

                <div className="flex flex-wrap gap-2">
                  {nearbyPlaces.map((place) => (
                    <span
                      key={place}
                      className="inline-flex items-center gap-1.5 border border-slate-200 rounded px-3 py-2 text-xs text-slate-600 bg-white"
                    >
                      <FiMapPin className="text-blue-500" />
                      {place}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* OWNER / LISTED BY (dynamic from `ownership`) */}

            <div className="border-t border-slate-200 bg-[#f8fafc] px-4 md:px-6 py-7">
              <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-7">
                <div>
                  <p className="text-xs text-slate-400 mb-2">
                    {ownership} Details
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                      <FiUser size={28} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-800">
                        Property {ownership}
                      </h3>

                      <p className="text-xs text-slate-500 mt-1">
                        {ownership} of this property
                      </p>

                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <FiShield />
                        Verified listing
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPaymentOpen(false)}
                    className="mt-5 bg-[#12a85b] hover:bg-[#0d944e] text-white text-xs px-5 py-2.5 rounded-md"
                  >
                    View Phone Number
                  </button>
                </div>

                {/* CONTACT */}

                <div>
                  <h3 className="text-base font-semibold text-slate-800 mb-4">
                    Send enquiry
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Your Name"
                      className="h-10 rounded border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                    />

                    <input
                      type="tel"
                      placeholder="Your Mobile Number"
                      className="h-10 rounded border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                    />
                  </div>

                  <textarea
                    rows={3}
                    placeholder="I am interested in this property..."
                    className="mt-3 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                    <label className="flex items-center gap-2 text-xs text-slate-500">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="accent-blue-600"
                      />
                      I agree to the Terms &amp; Privacy Policy
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsPaymentOpen(false)}
                      className="bg-[#0078d4] hover:bg-[#0067b8] text-white text-xs px-5 py-2.5 rounded-md"
                    >
                      Send enquiry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LIGHTBOX */}

          {slides.length > 0 && (
            <Lightbox
              open={isOpen}
              close={() => setIsOpen(false)}
              slides={slides}
              index={photoIndex}
            />
          )}
        </div>
      </main>

      {/* PAYMENT MODAL */}

      {isPaymentOpen && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-4"
          onClick={() => setIsPaymentOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl rounded-lg bg-white shadow-lg p-6 max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsPaymentOpen(false)}
              className="absolute top-3 right-3 text-slate-500 hover:text-slate-800"
              aria-label="Close payment modal"
            >
              <FiX size={22} />
            </button>

            <h4 className="text-xl font-semibold text-center mb-6 text-black">
              Scan &amp; Pay to Book This Property
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="flex flex-col items-center text-center">
                <Image
                  src={PAYMENT_DETAILS.qrImage}
                  alt="Payment QR Code"
                  width={260}
                  height={340}
                  unoptimized
                  className="rounded-md border"
                />

                <p className="text-sm text-slate-500 mt-3">
                  UPI ID:{' '}
                  <span className="font-medium">
                    {PAYMENT_DETAILS.upiId}
                  </span>
                </p>
              </div>

              <div className="rounded-md bg-slate-50 p-4 text-sm space-y-2 text-slate-700">
                <p>
                  <span className="font-medium">Account Name:</span>{' '}
                  {PAYMENT_DETAILS.accountName}
                </p>

                <p>
                  <span className="font-medium">Account Number:</span>{' '}
                  {PAYMENT_DETAILS.accountNumber}
                </p>

                <p>
                  <span className="font-medium">Bank:</span>{' '}
                  {PAYMENT_DETAILS.bank}
                </p>

                <p>
                  <span className="font-medium">IFSC Code:</span>{' '}
                  {PAYMENT_DETAILS.ifsc}
                </p>

                <p>
                  <span className="font-medium">Branch:</span>{' '}
                  {PAYMENT_DETAILS.branch}
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <h5 className="font-semibold text-black mb-1">
                Share Screenshot of Payment
              </h5>

              <p className="text-sm text-slate-500">
                After payment, please share the screenshot on WhatsApp to:
              </p>

              <a
                href={`https://wa.me/${PAYMENT_DETAILS.whatsappNumber.replace(
                  '+',
                  ''
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-2 text-green-600 font-medium hover:underline"
              >
                <FiPhone />
                {PAYMENT_DETAILS.whatsappNumber}
              </a>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <Switcher />
    </>
  );
}