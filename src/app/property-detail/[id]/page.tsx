'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import {
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

import { decodePropertyId, getRoleLabel, cleanPlace } from '@/lib/propertyId';

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
  city_name?: string;
  locality?: string;
  sub_locality?: string;
  address?: string;
  location?: string;
  propertyLocation?: string;

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
  /** users.role of the person who added the property (agent / user / dealer / builder). */
  poster_role?: string;
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

type LeadType = 'contact_owner' | 'view_number' | 'enquiry';

interface LeadForm {
  name: string;
  mobile: string;
  email: string;
  message: string;
  /** Honeypot field, real users never fill it. */
  website: string;
}

const emptyLead: LeadForm = {
  name: '',
  mobile: '',
  email: '',
  message: '',
  website: '',
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
   LEAD (enquiry email) HELPERS
========================================================= */

function normalizePhone(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

/** Returns an error message, or an empty string when the form is valid. */
function validateLead(form: LeadForm): string {
  if (form.name.trim().length < 2) {
    return 'Please enter your name.';
  }

  if (!/^[6-9]\d{9}$/.test(normalizePhone(form.mobile))) {
    return 'Please enter a valid 10-digit mobile number.';
  }

  const email = form.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Please enter a valid email address.';
  }

  return '';
}

/** Sends the lead to the API, which emails the property owner. */
async function sendLead(
  propertyId: string,
  type: LeadType,
  form: LeadForm
): Promise<{ contactNumber: string }> {
  const response = await fetch(
    `/api/properties/${encodeURIComponent(propertyId)}/enquiry`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        type,
        name: form.name.trim(),
        mobile: form.mobile,
        email: form.email.trim(),
        message:
          form.message.trim() ||
          'I am interested in this property. Please contact me.',
        website: form.website,
        pageUrl: window.location.href,
      }),
    }
  );

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // non-JSON response
  }

  if (!response.ok || (isObject(data) && data.success === false)) {
    throw new Error(
      isObject(data) && typeof data.error === 'string'
        ? data.error
        : 'Could not send your request. Please try again.'
    );
  }

  return { contactNumber: isObject(data) ? text(data.contactNumber) : '' };
}

const inputClass =
  'h-10 w-full rounded border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400';

const honeypotStyle: React.CSSProperties = {
  position: 'absolute',
  left: '-9999px',
  width: 0,
  height: 0,
  opacity: 0,
};

/* =========================================================
   PAGE
========================================================= */

export default function PropertiesDetail() {
  const params = useParams();

  const rawId = params?.id;
  const rawToken = Array.isArray(rawId) ? rawId[0] : rawId;

  // The URL carries an encoded token; decode it to the real numeric id.
  const propertyId = useMemo(
    () => decodePropertyId(rawToken),
    [rawToken]
  );

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [isOpen, setIsOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  /* Contact Owner / View Number popup */
  const [modalType, setModalType] = useState<
    'contact_owner' | 'view_number' | null
  >(null);
  const [modalForm, setModalForm] = useState<LeadForm>(emptyLead);
  const [modalError, setModalError] = useState('');
  const [modalSending, setModalSending] = useState(false);
  const [modalDone, setModalDone] = useState(false);
  const [revealedNumber, setRevealedNumber] = useState('');

  /* Inline "Send enquiry" form */
  const [inlineForm, setInlineForm] = useState<LeadForm>(emptyLead);
  const [inlineAgree, setInlineAgree] = useState(true);
  const [inlineSending, setInlineSending] = useState(false);
  const [inlineStatus, setInlineStatus] = useState<{
    kind: 'success' | 'error';
    message: string;
  } | null>(null);

  /* -------------------------------------------------------
     FETCH PROPERTY
  ------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function fetchProperty() {
      if (!propertyId) {
        setErrorMessage(
          rawToken ? 'Invalid property link.' : 'Property ID is missing.'
        );
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
  }, [propertyId, rawToken]);

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
     LEAD HANDLERS
  ------------------------------------------------------- */

  const openModal = (type: 'contact_owner' | 'view_number') => {
    setModalType(type);
    setModalError('');
    // The number was already revealed once: show it again without asking.
    setModalDone(type === 'view_number' && Boolean(revealedNumber));
  };

  const closeModal = () => {
    setModalType(null);
    setModalError('');
  };

  const setModalField = (key: keyof LeadForm, value: string) => {
    setModalForm((previous) => ({ ...previous, [key]: value }));
  };

  const setInlineField = (key: keyof LeadForm, value: string) => {
    setInlineForm((previous) => ({ ...previous, [key]: value }));
  };

  const submitModal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!modalType || !propertyId || modalSending) return;

    const problem = validateLead(modalForm);
    if (problem) {
      setModalError(problem);
      return;
    }

    try {
      setModalSending(true);
      setModalError('');

      const result = await sendLead(String(propertyId), modalType, modalForm);

      if (modalType === 'view_number') {
        setRevealedNumber(result.contactNumber);
      }
      setModalDone(true);
    } catch (error) {
      setModalError(
        error instanceof Error
          ? error.message
          : 'Could not send your request. Please try again.'
      );
    } finally {
      setModalSending(false);
    }
  };

  const submitInline = async () => {
    if (!propertyId || inlineSending) return;

    if (!inlineAgree) {
      setInlineStatus({
        kind: 'error',
        message: 'Please accept the Terms & Privacy Policy.',
      });
      return;
    }

    const problem = validateLead(inlineForm);
    if (problem) {
      setInlineStatus({ kind: 'error', message: problem });
      return;
    }

    try {
      setInlineSending(true);
      setInlineStatus(null);

      await sendLead(String(propertyId), 'enquiry', inlineForm);

      setInlineStatus({
        kind: 'success',
        message:
          'Your enquiry has been sent. They will contact you soon.',
      });
      setInlineForm((previous) => ({ ...previous, message: '' }));
    } catch (error) {
      setInlineStatus({
        kind: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Could not send your enquiry. Please try again.',
      });
    } finally {
      setInlineSending(false);
    }
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

  // `city` stores a city id (e.g. 707), so numeric / generic values are dropped.
  const locality = cleanPlace(property.locality);

  const locationParts = [
    cleanPlace(property.sub_locality),
    locality,
    cleanPlace(property.city_name) || cleanPlace(property.city),
  ].filter(Boolean);

  const location =
    locationParts.length > 0
      ? locationParts.join(', ')
      : cleanPlace(property.address) ||
        cleanPlace(property.location) ||
        cleanPlace(property.propertyLocation) ||
        'Location not available';

  const title = [
    propertyType,
    isForRent ? 'for Rent' : 'for Sale',
    locality ? `in ${locality}` : '',
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

  // Role of the user who added the property (users.role): Owner / Agent / Dealer / Builder.
  // Falls back to the `ownership` column, then to "Owner".
  const ownership =
    getRoleLabel(property.poster_role) ||
    text(property.ownership) ||
    'Owner';

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
      { label: 'Listed By', value: ownership },
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
    locality ? `Located in ${locality}` : '',
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
                      onClick={() => openModal('contact_owner')}
                      className="h-11 rounded-md bg-[#0078d4] hover:bg-[#0067b8] text-white text-sm font-medium"
                    >
                      Contact {ownership}
                    </button>

                    <button
                      type="button"
                      onClick={() => openModal('view_number')}
                      className="h-11 rounded-md border border-[#0078d4] text-[#0078d4] hover:bg-blue-50 text-sm font-medium"
                    >
                      {revealedNumber || 'View Number'}
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

            {/* LISTED BY (dynamic from users.role) */}

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
                    onClick={() => openModal('view_number')}
                    className="mt-5 bg-[#12a85b] hover:bg-[#0d944e] text-white text-xs px-5 py-2.5 rounded-md"
                  >
                    {revealedNumber || 'View Phone Number'}
                  </button>
                </div>

                {/* SEND ENQUIRY */}

                <div>
                  <h3 className="text-base font-semibold text-slate-800 mb-4">
                    Send enquiry
                  </h3>

                  <div className="relative grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={inlineForm.name}
                      maxLength={80}
                      onChange={(event) =>
                        setInlineField('name', event.target.value)
                      }
                      className={inputClass}
                    />

                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="Your Mobile Number"
                      value={inlineForm.mobile}
                      maxLength={15}
                      onChange={(event) =>
                        setInlineField('mobile', event.target.value)
                      }
                      className={inputClass}
                    />

                    <input
                      type="email"
                      placeholder="Your Email (optional)"
                      value={inlineForm.email}
                      maxLength={120}
                      onChange={(event) =>
                        setInlineField('email', event.target.value)
                      }
                      className={`${inputClass} md:col-span-2`}
                    />

                    {/* honeypot */}
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      style={honeypotStyle}
                      value={inlineForm.website}
                      onChange={(event) =>
                        setInlineField('website', event.target.value)
                      }
                    />
                  </div>

                  <textarea
                    rows={3}
                    maxLength={1000}
                    placeholder="I am interested in this property..."
                    value={inlineForm.message}
                    onChange={(event) =>
                      setInlineField('message', event.target.value)
                    }
                    className="mt-3 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
                  />

                  {inlineStatus && (
                    <p
                      role="status"
                      className={`mt-3 text-xs ${
                        inlineStatus.kind === 'success'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {inlineStatus.message}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                    <label className="flex items-center gap-2 text-xs text-slate-500">
                      <input
                        type="checkbox"
                        checked={inlineAgree}
                        onChange={(event) =>
                          setInlineAgree(event.target.checked)
                        }
                        className="accent-blue-600"
                      />
                      I agree to the Terms &amp; Privacy Policy
                    </label>

                    <button
                      type="button"
                      onClick={submitInline}
                      disabled={inlineSending}
                      className="bg-[#0078d4] hover:bg-[#0067b8] disabled:opacity-60 text-white text-xs px-5 py-2.5 rounded-md"
                    >
                      {inlineSending ? 'Sending...' : 'Send enquiry'}
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

      {/* CONTACT OWNER / VIEW NUMBER POPUP */}

      {modalType && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-4"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-md rounded-lg bg-white shadow-lg p-6 max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-3 right-3 text-slate-500 hover:text-slate-800"
              aria-label="Close"
            >
              <FiX size={22} />
            </button>

            {modalDone ? (
              <div className="text-center py-4">
                <FiCheckCircle
                  size={44}
                  className="mx-auto text-green-500"
                />

                <h4 className="text-lg font-semibold text-slate-900 mt-4">
                  {modalType === 'view_number'
                    ? `${ownership} phone number`
                    : 'Request sent'}
                </h4>

                {modalType === 'view_number' && revealedNumber ? (
                  <>
                    <a
                      href={`tel:${revealedNumber}`}
                      className="block mt-3 text-2xl font-bold text-[#0078d4]"
                    >
                      {revealedNumber}
                    </a>

                    <p className="text-xs text-slate-500 mt-2">
                      The {ownership.toLowerCase()} has also been notified by
                      email.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-600 mt-2">
                    The {ownership.toLowerCase()} has been notified by email
                    and will contact you soon.
                  </p>
                )}

                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-6 h-10 px-6 rounded-md bg-[#0078d4] hover:bg-[#0067b8] text-white text-sm font-medium"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={submitModal} noValidate>
                <h4 className="text-lg font-semibold text-slate-900 pr-6">
                  {modalType === 'view_number'
                    ? 'View phone number'
                    : `Contact ${ownership}`}
                </h4>

                <p className="text-xs text-slate-500 mt-1">{title}</p>

                <p className="text-xs text-slate-500 mt-3">
                  {modalType === 'view_number'
                    ? `Share your details to see the ${ownership.toLowerCase()}'s number. The ${ownership.toLowerCase()} will be notified by email.`
                    : `Share your details. The ${ownership.toLowerCase()} will receive your request by email and contact you.`}
                </p>

                <div className="relative mt-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={modalForm.name}
                    maxLength={80}
                    onChange={(event) =>
                      setModalField('name', event.target.value)
                    }
                    className={inputClass}
                  />

                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="Your Mobile Number"
                    value={modalForm.mobile}
                    maxLength={15}
                    onChange={(event) =>
                      setModalField('mobile', event.target.value)
                    }
                    className={inputClass}
                  />

                  <input
                    type="email"
                    placeholder="Your Email (optional)"
                    value={modalForm.email}
                    maxLength={120}
                    onChange={(event) =>
                      setModalField('email', event.target.value)
                    }
                    className={inputClass}
                  />

                  {modalType === 'contact_owner' && (
                    <textarea
                      rows={3}
                      maxLength={1000}
                      placeholder="I am interested in this property..."
                      value={modalForm.message}
                      onChange={(event) =>
                        setModalField('message', event.target.value)
                      }
                      className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
                    />
                  )}

                  {/* honeypot */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    style={honeypotStyle}
                    value={modalForm.website}
                    onChange={(event) =>
                      setModalField('website', event.target.value)
                    }
                  />
                </div>

                {modalError && (
                  <p role="alert" className="mt-3 text-xs text-red-600">
                    {modalError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={modalSending}
                  className="mt-5 w-full h-11 rounded-md bg-[#0078d4] hover:bg-[#0067b8] disabled:opacity-60 text-white text-sm font-medium"
                >
                  {modalSending
                    ? 'Sending...'
                    : modalType === 'view_number'
                      ? 'View Phone Number'
                      : `Contact ${ownership}`}
                </button>

                <p className="mt-3 text-[11px] text-slate-400 text-center">
                  By continuing you agree to the Terms &amp; Privacy Policy.
                </p>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
      <Switcher />
    </>
  );
}