"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { ChangeEvent, KeyboardEvent, Dispatch, SetStateAction, ReactNode } from "react";
import Swal from "sweetalert2";
import { displayPhone } from "@/lib/contactSplit";
import Sidebar from "@/components/Sidebar";
import Wrapper from "../components/wrapper";
import "../../../styles/AddPropertyStyles.css";


const STR_KEYS = [
  "propertyType", "listingTitle", "contactNumber", "contactEmail",
  "countryId", "country", "stateId", "state", "cityId", "city", "areaId",
  "locality", "subLocality", "society", "towerBlock", "unitNumber",
  "latitude", "longitude", "placeId", "formattedAddress",
  "beds", "baths", "balconies",
  "plotArea", "plotLength", "plotBreadth", "floorsAllowed", "boundaryWall", "constructionDone",
  "plotPurpose", "plotApprovalStatus", "plotAccess", "plotRoadWidth", "plotRoadWidthUnit",
  "carpetArea", "carpetAreaUnit", "builtUpArea", "superBuiltUpArea",
  "totalFloors", "propertyOnFloor",
  "availability", "propertyAge", "possessionBy", "reraId", "availableFrom",
  "entranceWidth", "entranceWidthUnit", "ceilingHeight", "ceilingHeightUnit",
  "expectedPrice", "pricePerSqft", "maintenance", "maintenancePeriod", "bookingAmount",
  "securityDepositType", "securityDeposit",
  "preLeased", "currentRent", "leaseTenure", "annualRentIncrease", "leasedToType", "expectedReturns",
  "pgSuitableFor", "pgTotalBeds", "pgFoodIncluded", "pgNoticePeriod",
  "pgBathroomCount", "pgBathroomType", "moveInPreference",
  "locatedInside", "zoneType", "washrooms", "pantry", "minSeats", "maxSeats", "cabins", "meetingRooms",
  "warehouseCapacity", "loadingDocks", "powerLoad", "powerLoadUnit", "hotelRooms", "hotelCategory",
  "furnishing", "youtubeLink", "description",
  "ownership", "propertyFacing", "facingRoadWidth", "facingRoadWidthUnit",
  "openSides", "powerBackup", "flooring", "suitableBusinessType",
  "brokerage", "brokerageUnit", "termsAndConditions",
] as const;

const BOOL_KEYS = [
  "taxExcluded", "priceNegotiable", "allInclusive", "hideReturns", "duplex", "sendViaWhatsapp",
] as const;

const NUM_KEYS = ["coveredParking", "openParking"] as const;

const ARR_KEYS = [
  "preferredTenants", "pgSharing", "otherRooms", "amenities", "propertyFeatures",
  "overlooking", "fireSafety", "locatedNear", "locationAdvantages", "pgServices", "pgHouseRules",
] as const;

type Looking = "sell" | "rent" | "pg";

type FD = { [K in (typeof STR_KEYS)[number]]?: string } & {
  [K in (typeof BOOL_KEYS)[number]]?: boolean;
} & { [K in (typeof NUM_KEYS)[number]]?: number } & {
  [K in (typeof ARR_KEYS)[number]]?: string[];
} & {
  lookingTo?: Looking;
  propertyCategory?: "Residential" | "Commercial";
  photos?: string[];
  furnishingItems?: Record<string, number>;
};

type PartialFD = Partial<FD>;

/* ============================================================
   CONSTANTS
============================================================ */

const TOTAL_STEPS = 5;
const INITIAL_VISIBLE_COUNT = 4;
const MAX_PHOTOS = 50;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const MIN_DESC = 30;
const MAX_ROAD_WIDTH = 100;
const PG_TYPE = "PG / Co-living";
const ALLOWED_PHOTO_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "heic", "heif"];

const STEP_BASE_SCORE: Record<number, number> = { 1: 20, 2: 25, 3: 62, 4: 62, 5: 75 };

const RES_TYPES = [
  "Flat / Apartment", "Independent House / Villa", "Independent / Builder Floor", "Plot / Land",
  "1 RK / Studio Apartment", "Serviced Apartment", "Farmhouse", "Penthouse", "Row House", "Other",
];
const COM_TYPES = [
  "Office Space", "Co-working Space", "Shop", "Showroom", "Commercial Land", "Agricultural Land",
  "Industrial Land", "Warehouse / Godown", "Cold Storage", "Factory", "Manufacturing Unit",
  "Industrial Building", "Hotel / Resort", "Guest House", "Banquet Hall", "Restaurant / Cafe",
  "Clinic / Healthcare", "School / Educational", "Business Centre", "Other",
];
const PLOT_TYPES = ["Plot / Land", "Commercial Land", "Agricultural Land", "Industrial Land"];
const OFFICE_TYPES = ["Office Space", "Co-working Space"];
const RETAIL_TYPES = ["Shop", "Showroom"];
const HOUSE_TYPES = ["Independent House / Villa", "Independent / Builder Floor", "Farmhouse"];
const WAREHOUSE_TYPES = ["Warehouse / Godown", "Cold Storage"];
const HOSPITALITY_TYPES = ["Hotel / Resort", "Guest House", "Banquet Hall"];

const BEDS = ["1", "2", "3", "4", "5", "5+"];
const BATHS = ["1", "2", "3", "4", "4+"];
const BALCONIES = ["0", "1", "2", "3", "More than 3"];
const AREA_UNITS = [
  "sq.ft.", "sq.yards", "sq.m.", "acres", "marla", "cents", "bigha", "kottah", "kanal",
  "grounds", "ares", "biswa", "guntha", "aankadam", "hectares", "rood", "chataks", "perch",
];
const FLOORS = ["Basement", "Lower Ground", "Ground", ...Array.from({ length: 30 }, (_, i) => String(i + 1))];
const AVAILABILITY = ["Ready to move", "Under construction"];
const AGE_OPTIONS = ["0-1 years", "1-5 years", "5-10 years", "10+ years"];
const YEAR = new Date().getFullYear();
const POSSESSION = [
  "Within 3 months", "Within 6 months",
  ...[0, 1, 2, 3, 4].map((i) => `By ${YEAR + i}`),
];
const OWNERSHIP_OPTIONS = ["Dealer", "Owner", "Freehold", "Leasehold", "Co-operative society", "Power of Attorney"];
const MAINT_PERIOD = ["Monthly", "Quarterly", "Yearly", "One time"];
const DEPOSIT_TYPES = ["None", "Fixed", "Multiple of rent"];
const TENANTS = ["Family", "Bachelor Men", "Bachelor Women", "Company"];
const PG_FOR = ["Boys", "Girls", "Any"];
const PG_SHARING = ["Single", "Double", "Triple", "4+ sharing"];
const YES_NO = ["Yes", "No"];
const PG_NOTICE = ["None", "15 days", "1 month", "2 months"];
const MOVE_IN_OPTIONS = ["Immediate", "Within 15 days", "Within 30 days", "Flexible"];
const PLOT_PURPOSES = ["Residential", "Commercial", "Industrial", "Agricultural", "Mixed use"];
const PLOT_APPROVALS = ["Approved", "Approval in progress", "Not approved", "Not applicable"];
const PLOT_ACCESS = ["Main road", "Internal road", "Corner plot", "No direct road access"];
const ROAD_WIDTH_UNITS = ["Feet", "Meter"];
const HOTEL_CATEGORIES = ["Budget", "3 star", "4 star", "5 star", "Other"];
const PG_BATHROOM_TYPES = ["Attached", "Shared", "Both"];
const PG_SERVICES = ["Meals", "Housekeeping", "Laundry", "Wi-Fi", "Air conditioning", "Power backup", "Security", "Parking"];
const PG_HOUSE_RULES = ["No smoking", "No alcohol", "Visitors by permission", "Curfew applies", "No specific rules"];
const BROKERAGE_UNITS = ["Fixed amount", "Percent of transaction"];
const LOCATED_INSIDE = [
  "Mall", "Commercial Project", "Residential Project", "Retail Complex / Building",
  "Market / High Street", "Others",
];
const ZONES = [
  "Industrial", "Commercial", "Residential", "Transport and Communication", "Public Utilities",
  "Public and Semi-Public Use", "Open Spaces", "Agricultural Zone", "Special Economic Zone",
  "Natural Conservation Zone", "Government Use", "Others",
];
const WASHROOMS = ["Private", "Shared", "No washroom"];
const PANTRY = ["Private", "Shared", "No pantry"];
const OTHER_ROOMS = ["Pooja Room", "Study Room", "Servant Room", "Store Room", "Others"];
const FURNISHING = ["Unfurnished", "Semi-Furnished", "Furnished"];
const COUNTED_ITEMS = ["Light", "Fans", "AC", "TV", "Beds", "Wardrobe", "Geyser"];
const AMENITIES = [
  "Maintenance Staff", "Water Storage", "Security / Fire Alarm", "Visitor Parking", "Park", "Lift",
  "Rain Water Harvesting", "Swimming Pool", "Fitness Centre / Gym", "Club House / Community Center",
  "Kids Play Area", "CCTV Surveillance", "Gated Society", "Intercom Facility", "Waste Disposal",
  "Sewage Treatment Plant", "Shopping Centre", "Laundry Service", "Internet / Wi-Fi", "Piped Gas",
  "Water Purifier",
];
const FEATURES = [
  "Recently Renovated", "Vaastu Compliant", "High Ceiling Height", "False Ceiling Lighting",
  "Centrally Air Conditioned", "Private Garden / Terrace", "Natural Light", "Airy Rooms",
  "Spacious Interiors", "Corner Property", "Pet Friendly", "Wheelchair Friendly",
];
const LOCATION_ADV = [
  "Close to Metro Station", "Close to School", "Close to Hospital", "Close to Market",
  "Close to Railway Station", "Close to Airport", "Close to Mall", "Close to Highway", "Close to Bus Stop",
];
const OPEN_SIDES = ["1", "2", "3", "3+"];
const OVERLOOKING = ["Pool", "Park / Garden", "Club", "Main Road", "Others", "Sea Facing"];
const POWER = ["None", "Partial", "Full"];
const FACING = ["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"];
const FLOORING = ["Marble", "Vitrified", "Ceramic", "Granite", "Wooden", "Mosaic", "Cement", "Other"];
const FIRE_SAFETY = ["Fire Extinguisher", "Fire Sensors", "Sprinklers", "Fire Hose"];
const LOCATED_NEAR = ["Entrance", "Elevator", "Stairs"];
const BUSINESS_TYPES = [
  "Retail / Apparel", "Food & Beverage", "Electronics", "Grocery / Supermarket", "Salon / Spa",
  "Pharmacy", "Bank / ATM", "Showroom", "Other",
];

const GEO_RESET: PartialFD = {
  cityId: "", city: "", areaId: "", locality: "", subLocality: "", society: "",
  latitude: "", longitude: "", placeId: "", formattedAddress: "",
};

/* ============================================================
   HELPERS
============================================================ */

function warn(title: string, text: string): false {
  Swal.fire({ icon: "warning", title, text, confirmButtonText: "Okay", confirmButtonColor: "#087f45" });
  return false;
}

/**
 * Live price in Indian format with Crore / Lakh words.
 * 2500000   -> "₹ 25,00,000 (25 Lakh)"
 * 15000000  -> "₹ 1,50,00,000 (1.5 Cr)"
 * 75000     -> "₹ 75,000 (75 Thousand)"
 * 500       -> "₹ 500"
 */
function numberToIndianWords(numStr?: string): string {
  if (!numStr) return "";
  const n = Number(numStr);
  if (Number.isNaN(n) || n <= 0) return "";

  const trim = (v: number) => String(Number(v.toFixed(2)));

  let words = "";
  if (n >= 10000000) words = `${trim(n / 10000000)} Cr`;
  else if (n >= 100000) words = `${trim(n / 100000)} Lakh`;
  else if (n >= 1000) words = `${trim(n / 1000)} Thousand`;

  const full = `₹ ${n.toLocaleString("en-IN")}`;
  return words ? `${full} (${words})` : full;
}

/** Keeps a numeric string between 0 and max (used for road width, max 100). */
function clampMax(value: string, max: number): string {
  if (value === "") return "";
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  if (n < 0) return "0";
  if (n > max) return String(max);
  return value;
}

/* ---------- Contact helpers (separate mobile + email fields) ---------- */

/** Returns only the 10 national digits of a stored / typed mobile number. */
function mobileDigits(value?: string): string {
  const raw = String(value ?? "").trim();
  const withoutCode = raw.startsWith("+91") ? raw.slice(3) : raw;
  let digits = withoutCode.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  return digits.slice(0, 10);
}

/** Stored form value, e.g. "+91 9876543210" (empty string when no digits). */
function toStoredMobile(digits: string): string {
  return digits ? `+91 ${digits}` : "";
}

const isValidMobile = (value?: string) => mobileDigits(value).length === 10;
const isValidEmail = (value?: string) => /^\S+@\S+\.\S+$/.test(String(value ?? "").trim());
const isUsableMobile = (value: unknown) => {
  const normalized = String(value ?? "").trim();
  return normalized !== "" && normalized !== "0" && !normalized.includes("@");
};

const draftIdKey = (userId: number) => `addPropertyDraftId_${userId}`;

function readStoredDraftId(userId: number): number | null {
  try {
    const raw = localStorage.getItem(draftIdKey(userId));
    const parsed = raw ? Number(raw) : null;
    return Number.isInteger(parsed) && parsed! > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function writeStoredDraftId(userId: number, id: number | null) {
  try {
    if (id === null) localStorage.removeItem(draftIdKey(userId));
    else localStorage.setItem(draftIdKey(userId), String(id));
  } catch {
    /* ignore */
  }
}

/** Reads the cached login profile and returns its mobile and email separately. */
function getSavedContact(): { mobile: string; email: string } {
  try {
    const stored = localStorage.getItem("user");
    if (!stored || stored === "undefined" || stored === "null") return { mobile: "", email: "" };
    const parsed = JSON.parse(stored);
    const user = parsed?.user ?? parsed?.data ?? parsed;
    const mobile = [user?.mobile, user?.phone, user?.mobileNumber, user?.phoneNumber, user?.contactNumber].find(
      isUsableMobile
    );
    const email = String(user?.email ?? "").trim();
    return { mobile: mobile == null ? "" : String(mobile).trim(), email };
  } catch {
    return { mobile: "", email: "" };
  }
}

const photoFileName = (value: string) => String(value).split("/").pop() || String(value);
const toSnake = (key: string) => key.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());

/* Lookup APIs (country / states / cities / area).
   If your API lives on a different domain, set NEXT_PUBLIC_API_BASE_URL. */
const configuredApiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "";
const API_BASE = /\/api$/i.test(configuredApiBase) ? configuredApiBase : `${configuredApiBase}/api`;

async function apiGet(path: string) {
  const route = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${API_BASE}${route}`);
  if (!res.ok) {
    throw new Error(`Location lookup failed (${res.status} ${res.statusText})`);
  }
  return res.json();
}

type LookupItem = { id: number; name: string };

const normalizeLocationName = (value: string) =>
  value
    .toLowerCase()
    .replace(/\b(division|district|city|municipal corporation)\b/g, "")
    .replace(/[^a-z0-9]/g, "");

function lookupItems(response: any): LookupItem[] {
  const candidates = [response, response?.data, response?.result, response?.data?.data, response?.result?.data];
  const list = candidates.find(Array.isArray);
  return (list || [])
    .map((item: any) => ({
      id: Number(item.id ?? item.value ?? item.countryId ?? item.stateId ?? item.cityId ?? item.areaId ?? item.area_id),
      name: String(
        item.name ?? item.country_name ?? item.state_name ?? item.city_name ?? item.area_name ??
        item.areaName ?? item.cityName ?? item.label ?? item.title ?? ""
      ).trim(),
    }))
    .filter((i: LookupItem) => Number.isFinite(i.id) && i.name);
}

/* ============================================================
   CATEGORY + CLEAN FORM
============================================================ */

function categorize(d: FD) {
  const isPG = d.lookingTo === "pg";
  const isRent = d.lookingTo === "rent";
  const isSell = d.lookingTo === "sell";
  const isRes = d.propertyCategory === "Residential";
  const type = d.propertyType || "";
  const isPlot = !isPG && PLOT_TYPES.includes(type);
  const isOffice = !isPG && OFFICE_TYPES.includes(type);
  const isRetail = !isPG && (RETAIL_TYPES.includes(type) || type === "Restaurant / Cafe");
  const isWarehouse = !isPG && WAREHOUSE_TYPES.includes(type);
  const isHospitality = !isPG && HOSPITALITY_TYPES.includes(type);
  const hasBuilding = !isPG && !isPlot;
  const hasRooms = hasBuilding && isRes;
  const isCommercial = hasBuilding && !isRes;
  return {
    isPG, isRent, isSell, isRes, isPlot, isOffice, isRetail, isWarehouse,
    isHospitality, hasBuilding, hasRooms, isCommercial,
  };
}

/** Clears fields that are not relevant to the current selection. */
function cleanForm(f: FD): FD {
  const c = categorize(f);
  const o: FD = { ...f };
  const reset = (p: PartialFD) => Object.assign(o, p);

  if (!c.isPlot)
    reset({
      plotArea: "", plotLength: "", plotBreadth: "", floorsAllowed: "", boundaryWall: "",
      constructionDone: "", plotPurpose: "", plotApprovalStatus: "", plotAccess: "",
      plotRoadWidth: "", plotRoadWidthUnit: "",
    });

  if (!c.hasBuilding)
    reset({
      carpetArea: "", builtUpArea: "", superBuiltUpArea: "", totalFloors: "", propertyOnFloor: "",
      availability: "", propertyAge: "", reraId: "", maintenance: "", maintenancePeriod: "",
      coveredParking: 0, openParking: 0, overlooking: [], powerBackup: "", flooring: "", propertyFeatures: [],
    });

  if (!c.hasRooms) reset({ beds: "", baths: "", balconies: "", duplex: false, otherRooms: [] });
  if (!c.hasRooms) reset({ furnishing: "", furnishingItems: {} });

  if (o.furnishing === "Furnished" || o.furnishing === "Semi-Furnished") {
    const kept: Record<string, number> = {};
    Object.entries(f.furnishingItems || {}).forEach(([k, v]) => {
      if (v > 0) kept[k] = v;
    });
    reset({ furnishingItems: kept });
  } else {
    reset({ furnishingItems: {} });
  }

  if (f.availability !== "Ready to move") reset({ propertyAge: "" });
  if (!c.isPlot && f.availability !== "Under construction") reset({ possessionBy: "" });

  if (!c.isSell)
    reset({
      allInclusive: false, taxExcluded: false, reraId: "", bookingAmount: "",
      preLeased: "", currentRent: "", leaseTenure: "", annualRentIncrease: "", leasedToType: "",
      expectedReturns: "", hideReturns: false,
    });
  if (c.isSell) reset({ availableFrom: "", securityDepositType: "", securityDeposit: "" });
  if (!c.isRent) reset({ preferredTenants: [] });
  if (!f.securityDepositType || f.securityDepositType === "None") reset({ securityDeposit: "" });

  if (f.preLeased !== "Yes") reset({ currentRent: "", leaseTenure: "", annualRentIncrease: "", leasedToType: "" });

  if (!c.isPG)
    reset({
      pgSuitableFor: "", pgSharing: [], pgTotalBeds: "", pgFoodIncluded: "", pgNoticePeriod: "",
      pgBathroomCount: "", pgBathroomType: "", pgServices: [], pgHouseRules: [],
    });
  if (!c.isPG && !c.isRent) reset({ moveInPreference: "" });

  if (!c.isCommercial) reset({ locatedInside: "", zoneType: "", washrooms: "", fireSafety: [], locatedNear: [], suitableBusinessType: "" });
  if (!c.isOffice) reset({ pantry: "", minSeats: "", maxSeats: "", cabins: "", meetingRooms: "" });
  if (!c.isRetail) reset({ locatedInside: "", entranceWidth: "", ceilingHeight: "" });
  if (!c.isWarehouse) reset({ warehouseCapacity: "", loadingDocks: "" });
  if (!c.isCommercial) reset({ powerLoad: "", powerLoadUnit: "", hotelRooms: "", hotelCategory: "" });
  if (!c.isHospitality) reset({ hotelRooms: "", hotelCategory: "" });

  if (c.isPG) reset({ ownership: "", openSides: "", propertyFacing: "", facingRoadWidth: "" });
  if (c.isPlot) reset({ amenities: [] });

  return o;
}

/* ============================================================
   DB ROW -> FORM DATA
============================================================ */

function rowToFormData(row: Record<string, unknown>): FD {
  const out: Record<string, unknown> = {};

  STR_KEYS.forEach((k) => {
    const v = row[toSnake(k)];
    if (v !== null && v !== undefined) out[k] = String(v);
  });
  BOOL_KEYS.forEach((k) => {
    out[k] = Boolean(row[toSnake(k)]);
  });
  NUM_KEYS.forEach((k) => {
    out[k] = Number(row[toSnake(k)]) || 0;
  });
  ARR_KEYS.forEach((k) => {
    const v = row[toSnake(k)];
    if (Array.isArray(v)) out[k] = v;
  });

  const subLocality = [row.sub_locality, row.subLocality, row.landmark]
    .find((value) => typeof value === "string" && value.trim());
  if (typeof subLocality === "string") out.subLocality = subLocality;

  const lookingTo = row.looking_to;
  if (lookingTo === "sell" || lookingTo === "rent" || lookingTo === "pg") out.lookingTo = lookingTo;

  const cat = row.property_category;
  if (cat === "Residential" || cat === "Commercial") out.propertyCategory = cat;

  out.photos = Array.isArray(row.photos)
    ? row.photos.filter((i): i is string => typeof i === "string" && i.trim() !== "")
    : undefined;

  let items = row.furnishing_items;
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      items = {};
    }
  }
  out.furnishingItems = items && typeof items === "object" ? items : {};

  /* Older drafts may have an email stored in the contact number field: move it to the email field. */
  if (typeof out.contactNumber === "string" && out.contactNumber.includes("@")) {
    if (!out.contactEmail) out.contactEmail = out.contactNumber;
    out.contactNumber = "";
  }

  /* Show the saved phone (+91XXXXXXXXXX) in the form format (+91 XXXXXXXXXX) */
  if (typeof out.contactNumber === "string" && out.contactNumber) {
    out.contactNumber = displayPhone(out.contactNumber);
  }

  return out as FD;
}

/* ============================================================
   VALIDATION (step wise, page level so submit can re-check all)
============================================================ */

function validateStep(step: number, d: FD): string | null {
  const c = categorize(d);

  if (step === 1) {
    if (!d.lookingTo) return "Please select Sell, Rent / Lease or Paying Guest.";
    if (!c.isPG) {
      if (!d.propertyCategory) return "Please select Residential or Commercial.";
      if (!d.propertyType) return "Please select your property type.";
    }
    if (!mobileDigits(d.contactNumber)) return "Please enter your mobile number.";
    if (!isValidMobile(d.contactNumber)) return "Mobile number must be exactly 10 digits.";
    if (!d.contactEmail?.trim()) return "Please enter your email address.";
    if (!isValidEmail(d.contactEmail)) return "Please enter a valid email address.";
  }

  if (step === 2) {
    if (!d.countryId) return "Please select a country.";
    if (!d.stateId) return "Please select a state.";
    if (!d.city?.trim()) return "Please select a city.";
    if (!d.cityId) return "Please choose a city from the list or the suggestions that matches the selected state.";
    if (!d.locality?.trim()) return "Please select a locality.";
    if (!d.latitude || !d.longitude)
      return "Map position not found. Please select the city again from the list.";
  }

  if (step === 3) {
    if (c.isPlot && !(Number(d.plotArea) > 0)) return "Plot area is mandatory.";
    if (c.hasBuilding && !(Number(d.carpetArea) > 0 || Number(d.builtUpArea) > 0 || Number(d.superBuiltUpArea) > 0))
      return "At least one area type (carpet / built-up / super built-up) is mandatory.";
    if (!(Number(d.expectedPrice) > 0)) return c.isSell ? "Expected price is required." : "Expected rent is required.";
    if (c.isPG && (!d.pgSuitableFor || !d.pgSharing?.length || !(Number(d.pgTotalBeds) > 0)))
      return "Please specify PG suitability, sharing type, and total beds.";
    if (d.brokerage && Number(d.brokerage) < 0)
      return "Brokerage cannot be a negative amount.";
    if (d.brokerageUnit === "Percent of transaction" && Number(d.brokerage) > 100)
      return "Brokerage percentage must be between 0 and 100.";
    if (d.pgBathroomCount && Number(d.pgBathroomCount) < 0)
      return "Bathroom count cannot be negative.";
    if (d.warehouseCapacity && Number(d.warehouseCapacity) < 0)
      return "Storage capacity cannot be negative.";
    if (d.loadingDocks && Number(d.loadingDocks) < 0)
      return "Loading dock count cannot be negative.";
    if (d.hotelRooms && Number(d.hotelRooms) < 0)
      return "Room count cannot be negative.";
    if (d.powerLoad && Number(d.powerLoad) < 0)
      return "Power load cannot be negative.";
    if (d.plotRoadWidth && Number(d.plotRoadWidth) < 0)
      return "Road width cannot be negative.";
    if (d.plotRoadWidth && Number(d.plotRoadWidth) > MAX_ROAD_WIDTH)
      return `Road width cannot be more than ${MAX_ROAD_WIDTH}.`;
    if (c.isSell && d.preLeased === "Yes") {
      if (!(Number(d.currentRent) > 0)) return "Please enter the current monthly rent.";
      if (!(Number(d.leaseTenure) > 0)) return "Please enter the lease tenure in years.";
    }
    if (d.expectedReturns && (Number(d.expectedReturns) < 0 || Number(d.expectedReturns) > 100))
      return "Expected annual returns should be between 0% and 100%.";
  }

  if (step === 4) {
    const desc = d.description?.trim() || "";
    if (desc && desc.length < MIN_DESC) return `Description needs at least ${MIN_DESC} characters.`;
    if (d.youtubeLink?.trim() && !/^https?:\/\//i.test(d.youtubeLink.trim()))
      return "Video link must start with http:// or https://";
  }

  if (step === 5) {
    if (d.facingRoadWidth && Number(d.facingRoadWidth) < 0)
      return "Width of facing road cannot be negative.";
    if (d.facingRoadWidth && Number(d.facingRoadWidth) > MAX_ROAD_WIDTH)
      return `Width of facing road cannot be more than ${MAX_ROAD_WIDTH}.`;
  }

  return null;
}

/* ============================================================
   GOOGLE MAPS
============================================================ */

const GOOGLE_SCRIPT_ID = "google-maps-script";
let googleMapsPromise: Promise<any> | null = null;

function loadGoogleMaps(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("Window is not available"));
  const w = window as any;
  if (w.google?.maps?.places) return Promise.resolve(w.google.maps);
  if (googleMapsPromise) return googleMapsPromise;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing"));

  googleMapsPromise = new Promise((resolve, reject) => {
    const onReady = () => {
      if (w.google?.maps?.places) resolve(w.google.maps);
      else {
        googleMapsPromise = null;
        reject(new Error("Google Maps Places library not available"));
      }
    };
    const onError = () => {
      googleMapsPromise = null;
      reject(new Error("Google Maps JavaScript API failed to load"));
    };

    const existing = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener("error", onError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = onReady;
    script.onerror = onError;
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

async function getPlaceDetails(placeId: string): Promise<any | null> {
  try {
    const maps = await loadGoogleMaps();
    return await new Promise((resolve) => {
      const service = new maps.places.PlacesService(document.createElement("div"));
      service.getDetails(
        { placeId, fields: ["place_id", "formatted_address", "geometry", "address_components", "name"] },
        (place: any, status: string) => resolve(status === "OK" && place ? place : null)
      );
    });
  } catch (error) {
    console.error("Place details error:", error);
    return null;
  }
}

/** Finds a map position for a typed address (used when Google has no suggestion for it). */
async function geocodeText(
  address: string
): Promise<{ lat: number; lng: number; placeId: string; formatted: string } | null> {
  try {
    const maps = await loadGoogleMaps();
    return await new Promise((resolve) => {
      new maps.Geocoder().geocode(
        { address, componentRestrictions: { country: "IN" } },
        (results: any[] | null, status: string) => {
          if (status === "OK" && results?.length) {
            const r = results[0];
            resolve({
              lat: r.geometry.location.lat(),
              lng: r.geometry.location.lng(),
              placeId: r.place_id,
              formatted: r.formatted_address,
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  } catch {
    return null;
  }
}

const addressPart = (place: any, types: string[]): string =>
  place?.address_components?.find((c: any) => c.types.some((t: string) => types.includes(t)))?.long_name || "";

/** Converts lat / lng / placeId / address into a form patch. */
function geoPatch(place: any, prediction: any, prev: FD): PartialFD {
  const lat = place?.geometry?.location?.lat?.();
  const lng = place?.geometry?.location?.lng?.();
  return {
    latitude: lat !== undefined ? String(lat) : prev.latitude || "",
    longitude: lng !== undefined ? String(lng) : prev.longitude || "",
    placeId: place?.place_id || prediction.place_id,
    formattedAddress: place?.formatted_address || prev.formattedAddress || "",
  };
}

/** Distance in km between two coordinates (used to reject far-away geocode results). */
function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(rad(bLat - aLat) / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(rad(bLng - aLng) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Google place types that are shops / hotels / clinics etc. Never a society or colony. */
const NON_SOCIETY_TYPES = [
  "lodging", "restaurant", "cafe", "bar", "food", "meal_takeaway", "store", "clothing_store",
  "electronics_store", "supermarket", "shopping_mall", "beauty_salon", "hair_care", "spa", "gym",
  "bank", "atm", "finance", "hospital", "doctor", "dentist", "pharmacy", "health", "school",
  "university", "gas_station", "car_repair", "car_dealer", "travel_agency", "real_estate_agency",
  "lawyer", "movie_theater", "place_of_worship", "parking", "transit_station", "bus_station",
  "train_station",
];

const isSocietyPrediction = (p: any): boolean =>
  !(p.types ?? []).some((t: string) => NON_SOCIETY_TYPES.includes(t));

/* ============================================================
   SMALL SHARED COMPONENTS
============================================================ */

interface StepProps {
  data: FD;
  update: (partial: PartialFD) => void;
  onContinue: () => void;
  onBack?: () => void;
  saving: boolean;
}

function makeForm(data: FD, update: (p: PartialFD) => void) {
  const set = (k: keyof FD, v: unknown) => update({ [k]: v } as PartialFD);
  const text =
    (k: keyof FD) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      set(k, e.target.value);
  const pick = (k: keyof FD, v: string) => set(k, (data[k] as unknown) === v ? "" : v);
  const toggle = (k: keyof FD, v: string) => {
    const list = (data[k] as string[] | undefined) || [];
    set(k, list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  };
  /* Number input that can never go above `max` (used for road width) */
  const limited =
    (k: keyof FD, max: number) => (e: ChangeEvent<HTMLInputElement>) =>
      set(k, clampMax(e.target.value, max));
  return { set, text, pick, toggle, limited };
}

function Pill({
  label, selected = false, onClick, prefix,
}: { label: string; selected?: boolean; onClick: () => void; prefix?: boolean }) {
  return (
    <button type="button" className={`pill ${selected ? "active" : ""}`} onClick={onClick}>
      {prefix && !selected ? "+ " : ""}
      {label}
    </button>
  );
}

function Chips({
  options, value, onChange, plus,
}: { options: string[]; value?: string | string[]; onChange: (v: string) => void; plus?: boolean }) {
  return (
    <div className="pill-row">
      {options.map((o) => (
        <Pill
          key={o}
          label={o}
          selected={Array.isArray(value) ? value.includes(o) : value === o}
          onClick={() => onChange(o)}
          prefix={plus}
        />
      ))}
    </div>
  );
}

function RevealSection({ children }: { children: ReactNode }) {
  return <div className="reveal-section">{children}</div>;
}

function ExpandablePillGroup({
  options, selected, onSelect, initialVisible = INITIAL_VISIBLE_COUNT,
}: { options: string[]; selected?: string; onSelect: (v: string) => void; initialVisible?: number }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [options]);

  const hasMore = options.length > initialVisible;
  const visible = expanded ? options : options.slice(0, initialVisible);

  return (
    <div className="pill-container">
      {visible.map((t) => (
        <Pill key={t} label={t} selected={selected === t} onClick={() => onSelect(t)} />
      ))}
      {hasMore && (
        <button type="button" className="view-more-toggle" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "View less" : `View more (+${options.length - initialVisible})`}
        </button>
      )}
    </div>
  );
}

/** Section title + stacked content */
function Sec({
  title, required, optional, help, children,
}: { title: string; required?: boolean; optional?: boolean; help?: string; children: ReactNode }) {
  return (
    <>
      <div className="section-title">
        {title}
        {required && <span className="required-star">*</span>}
        {optional && <span className="field-hint">(Optional)</span>}
      </div>
      {help && <p className="description-text">{help}</p>}
      <div className="field-group">
        <div className="stack">{children}</div>
      </div>
    </>
  );
}

function Inp({
  label, value, onChange, type = "text", placeholder, min, max, required,
}: {
  label?: string; value?: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string; min?: string; max?: string; required?: boolean;
}) {
  return (
    <div className="input-with-label">
      {label && (
        <label>
          {label}
          {required && <span className="required-star">*</span>}
        </label>
      )}
      <input type={type} min={min} max={max} placeholder={placeholder} value={value || ""} onChange={onChange} />
    </div>
  );
}

/** Rupee input with a live "₹ 25,00,000 (25 Lakh)" line shown below it. */
function Money({
  label, value, onChange, placeholder, required, showWords = true,
}: {
  label?: string; value?: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; required?: boolean; showWords?: boolean;
}) {
  const words = showWords ? numberToIndianWords(value) : "";
  return (
    <div className="input-with-label">
      {label && (
        <label>
          {label}
          {required && <span className="required-star">*</span>}
        </label>
      )}
      <div className="prefix-input">
        <span>₹</span>
        <input type="number" min="0" placeholder={placeholder} value={value || ""} onChange={onChange} />
      </div>
      {words && <p className="helper-text">{words}</p>}
    </div>
  );
}

function Sel({
  label, value, onChange, options, placeholder,
}: { label?: string; value?: string; onChange: (e: ChangeEvent<HTMLSelectElement>) => void; options: string[]; placeholder: string }) {
  return (
    <div className="input-with-label">
      {label && <label>{label}</label>}
      <select value={value || ""} onChange={onChange}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="checkbox-option">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function Counter({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="counter-row">
      <span>{label}</span>
      <div className="counter">
        <button type="button" disabled={value <= 0} onClick={() => onChange(value - 1)}>−</button>
        <b>{value}</b>
        <button type="button" onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  );
}

function ActionBar({
  info, help, label, saving, onClick,
}: { info: string; help: string; label: string; saving: boolean; onClick: () => void }) {
  return (
    <div className="action-area">
      <div className="action-info">
        <span className="required-info">{info}</span>
        <span className="action-help">{help}</span>
      </div>
      <button type="button" className="primary-btn" onClick={onClick} disabled={saving}>
        {saving ? "Saving..." : label}
        {!saving && <span className="arrow">→</span>}
      </button>
    </div>
  );
}

/* ============================================================
   SEARCHABLE SELECT (Country / State / City)
   A dropdown that shows a search box at the top of its list.
============================================================ */

function SearchableSelect({
  id, label, required, placeholder, searchPlaceholder = "Search...", options, value, disabled, onChange, help,
}: {
  id: string; label: string; required?: boolean; placeholder: string; searchPlaceholder?: string;
  options: LookupItem[]; value: string; disabled?: boolean; help?: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const selected = options.find((o) => String(o.id) === value);
  const filtered = options.filter((o) => o.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="input-with-label searchable-select" ref={boxRef}>
      <label htmlFor={id}>
        {label}
        {required && <span className="required-star">*</span>}
      </label>

      <button
        id={id}
        type="button"
        className={`select-trigger ${open ? "open" : ""}`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={selected ? "" : "select-placeholder"}>{selected ? selected.name : placeholder}</span>
        <span className="select-caret">▾</span>
      </button>

      {open && !disabled && (
        <div className="select-panel">
          <input
            type="search"
            autoFocus
            className="select-search"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Enter") {
                e.preventDefault();
                if (filtered[0]) {
                  onChange(String(filtered[0].id));
                  setOpen(false);
                }
              }
            }}
          />
          <div className="select-options" role="listbox">
            {filtered.length === 0 ? (
              <div className="select-empty">No results found</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  role="option"
                  aria-selected={String(o.id) === value}
                  className={`select-option ${String(o.id) === value ? "selected" : ""}`}
                  onClick={() => {
                    onChange(String(o.id));
                    setOpen(false);
                  }}
                >
                  {o.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {help && <span className="input-help">{help}</span>}
    </div>
  );
}

/* ============================================================
   GOOGLE LOCATION AUTOCOMPLETE (city / locality / sub-locality / society)
   - "Use what I typed" is always the FIRST row, so a local colony /
     builder floor that Google doesn't know can be added right away.
   - For society search, shops / hotels / clinics are filtered out.
============================================================ */

type AutoKind = "city" | "locality" | "sublocality" | "society";

function LocationAutocomplete({
  id, label, required, optional, placeholder, value, disabled, kind, context, help, onInput, onSelect, onManual,
}: {
  id: string; label: string; required?: boolean; optional?: boolean; placeholder: string;
  value: string; disabled?: boolean; kind: AutoKind; context?: string; help?: string;
  onInput: (value: string) => void; onSelect: (prediction: any) => void;
  onManual?: (value: string) => void;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(-1);

  const service = useRef<any>(null);
  const seq = useRef(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mine = ++seq.current;
    const q = value.trim();

    if (!open || disabled || q.length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const maps = await loadGoogleMaps();
        if (mine !== seq.current) return;

        if (!service.current) service.current = new maps.places.AutocompleteService();

        const request: any = {
          input: context ? `${q}, ${context}` : q,
          componentRestrictions: { country: "in" },
        };
        // society: no type filter, so societies, projects, builder floors
        // and street addresses can all show up. Shops / hotels are removed below.
        if (kind === "city") request.types = ["(cities)"];
        else if (kind !== "society") request.types = ["(regions)"];

        const results: any[] = await new Promise((resolve, reject) => {
          service.current.getPlacePredictions(request, (r: any[] | null, status: string) => {
            if (status === maps.places.PlacesServiceStatus.OK && r) resolve(r);
            else if (status === maps.places.PlacesServiceStatus.ZERO_RESULTS) resolve([]);
            else reject(new Error(`Places status: ${status}`));
          });
        });

        if (mine !== seq.current) return;
        const list = kind === "society" ? results.filter(isSocietyPrediction) : results;
        setItems(list.slice(0, 6));
        setFocused(-1);
      } catch (error) {
        console.error("Location autocomplete error:", error);
        if (mine === seq.current) setItems([]);
      } finally {
        if (mine === seq.current) setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [value, open, disabled, kind, context]);

  useEffect(() => {
    const outside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const choose = (p: any) => {
    seq.current += 1;
    setOpen(false);
    setItems([]);
    setLoading(false);
    onSelect(p);
  };

  const typed = value.trim();

  const chooseManual = () => {
    seq.current += 1;
    setOpen(false);
    setItems([]);
    setLoading(false);
    onManual?.(typed);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") return setOpen(false);
    if (!items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocused((c) => (c < items.length - 1 ? c + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocused((c) => (c > 0 ? c - 1 : items.length - 1));
    } else if (e.key === "Enter" && items[focused]) {
      e.preventDefault();
      choose(items[focused]);
    }
  };

  // Shown immediately (does not wait for Google) and always as the FIRST row.
  const showManual = !!onManual && open && !disabled && typed.length >= 2;
  const showEmpty = !onManual && open && !loading && items.length === 0 && typed.length >= 2 && !disabled;

  return (
    <div className="input-with-label location-autocomplete" ref={boxRef}>
      <label htmlFor={id}>
        {label}
        {required && <span className="required-star">*</span>}
        {optional && <span className="optional-text">Optional</span>}
      </label>

      <div className="input-wrapper">
        <input
          id={id}
          type="text"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => {
            setOpen(true);
            onInput(e.target.value);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
        />
        {loading && <span className="input-spinner" />}
      </div>

      {open && (items.length > 0 || showManual) && (
        <div className="suggestion-dropdown" role="listbox">
          {showManual && (
            <button
              type="button"
              className="suggestion-item suggestion-item--manual"
              onMouseDown={(e) => e.preventDefault()}
              onClick={chooseManual}
            >
              <div className="suggestion-icon">✏️</div>
              <div className="suggestion-content">
                <div className="suggestion-main">Use “{typed}”</div>
                <div className="suggestion-secondary">Can’t find it? Save exactly what you typed</div>
              </div>
            </button>
          )}

          {items.map((p, i) => (
            <button
              key={`${p.place_id}-${i}`}
              type="button"
              role="option"
              aria-selected={focused === i}
              className={`suggestion-item ${focused === i ? "suggestion-active" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(p)}
              onMouseEnter={() => setFocused(i)}
            >
              <div className="suggestion-icon">{kind === "city" ? "🏙️" : "📍"}</div>
              <div className="suggestion-content">
                <div className="suggestion-main">{p.structured_formatting?.main_text || p.description}</div>
                {p.structured_formatting?.secondary_text && (
                  <div className="suggestion-secondary">{p.structured_formatting.secondary_text}</div>
                )}
              </div>
            </button>
          ))}

          {items.length > 0 && <div className="google-attribution">Powered by Google</div>}
        </div>
      )}

      {showEmpty && (
        <div className="suggestion-dropdown">
          <div className="suggestion-empty">
            <div className="empty-icon">⌕</div>
            <div>
              <div className="empty-title">No locations found</div>
              <div className="empty-text">Try a different spelling or nearby area.</div>
            </div>
          </div>
        </div>
      )}

      {help && <span className="input-help">{help}</span>}
    </div>
  );
}

/* ============================================================
   STEP 1 — BASIC DETAILS
   Contact details: both mobile and email are required. Whichever one
   the login profile did not provide shows up empty so the user must
   fill it in.
============================================================ */

function Step1BasicDetails({ data, update, onContinue, saving }: StepProps) {
  const { set, text } = makeForm(data, update);
  const c = categorize(data);

  const hasMobile = isValidMobile(data.contactNumber);
  const hasEmail = isValidEmail(data.contactEmail);

  const changeLookingTo = (value: Looking) => {
    if (value === "pg") {
      update({ lookingTo: value, propertyCategory: "Residential", propertyType: PG_TYPE });
    } else {
      update({
        lookingTo: value,
        propertyType: data.lookingTo === "pg" ? "" : data.propertyType,
      });
    }
  };

  const setCategory = (category: "Residential" | "Commercial") => {
    if (data.propertyCategory === category) return;
    update({ propertyCategory: category, propertyType: "", locatedInside: "" });
  };

  const options = data.propertyCategory === "Commercial" ? COM_TYPES : RES_TYPES;

  /* Contextual help depending on which contact value is missing */
  let contactHelp = "Mobile number (10 digits) and email buyers can reach you on.";
  if (hasEmail && !hasMobile) contactHelp = "Your email is added from your account. Please add your mobile number.";
  else if (hasMobile && !hasEmail) contactHelp = "Your mobile number is added from your account. Please add your email address.";

  return (
    <div className="step step-1">
      <div className="step-header">
        <div className="step-badge">Step 1</div>
        <div>
          <h1 className="page-title">Fill out basic details</h1>
          <p className="page-subtitle">Tell us a little about your property to get started.</p>
        </div>
      </div>

      <section className="form-section">
        <div className="section-heading">
          <span className="section-number">01</span>
          <div>
            <label className="field-label">
              I&apos;m looking to<span className="required-star">*</span>
            </label>
            <p className="field-help">Choose what you want to do with this property.</p>
          </div>
        </div>
        <div className="pill-container">
          <Pill label="Sell" selected={data.lookingTo === "sell"} onClick={() => changeLookingTo("sell")} />
          <Pill label="Rent / Lease" selected={data.lookingTo === "rent"} onClick={() => changeLookingTo("rent")} />
          {/* <Pill label="Paying Guest" selected={data.lookingTo === "pg"} onClick={() => changeLookingTo("pg")} /> */}
        </div>
      </section>

      {data.lookingTo && !c.isPG && (
        <RevealSection>
          <section className="form-section">
            <div className="section-heading">
              <span className="section-number">02</span>
              <div>
                <label className="field-label">
                  What kind of property do you have?<span className="required-star">*</span>
                </label>
                <p className="field-help">Select residential or commercial.</p>
              </div>
            </div>

            <div className="category-grid">
              {(["Residential", "Commercial"] as const).map((cat) => (
                <label key={cat} className={`category-card ${data.propertyCategory === cat ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="propertyCategory"
                    checked={data.propertyCategory === cat}
                    onChange={() => setCategory(cat)}
                  />
                  <span className="radio-circle"><span /></span>
                  <span className="category-content">
                    <strong>{cat}</strong>
                    <small>{cat === "Residential" ? "Homes, flats, villas" : "Shops, offices, land"}</small>
                  </span>
                </label>
              ))}
            </div>

            {data.propertyCategory && (
              <RevealSection>
                <div className="sub-section">
                  <label className="field-label">
                    Select property type<span className="required-star">*</span>
                  </label>
                  <p className="field-help">Choose the type that best describes your property.</p>
                  <div className="property-types">
                    <ExpandablePillGroup
                      options={options}
                      selected={data.propertyType}
                      onSelect={(v) => set("propertyType", v)}
                    />
                  </div>
                </div>
              </RevealSection>
            )}
          </section>
        </RevealSection>
      )}

      {data.lookingTo && (
        <RevealSection>
          <section className="form-section">
            <div className="section-heading">
              <span className="section-number">{c.isPG ? "02" : "03"}</span>
              <div>
                <label className="field-label">
                  Contact details<span className="required-star">*</span>
                </label>
                <p className="field-help">{contactHelp}</p>
              </div>
            </div>

            <div className="input-with-label">
              <label>
                Mobile number<span className="required-star">*</span>
              </label>
              <div className="prefix-input">
                <span>+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={mobileDigits(data.contactNumber)}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                    set("contactNumber", toStoredMobile(digits));
                  }}
                />
              </div>

            </div>

            <div className="input-with-label">
              <label>
                Email address<span className="required-star">*</span>
              </label>
              <input
                type="email"
                inputMode="email"
                placeholder="Email address"
                value={data.contactEmail || ""}
                onChange={(e) => set("contactEmail", e.target.value)}
              />
            </div>

            <Inp
              label="Listing title (Optional)"
              placeholder="Example: Spacious 3 BHK apartment in Gomti Nagar"
              value={data.listingTitle}
              onChange={text("listingTitle")}
            />
          </section>
        </RevealSection>
      )}

      <ActionBar
        info="* Required fields"
        help="Complete the required details, then save and continue."
        label="Save & Next"
        saving={saving}
        onClick={onContinue}
      />
    </div>
  );
}

/* ============================================================
   STEP 2 — LOCATION (Country > State > City with search, then Google Locality / Sub-locality / Society)
   Latitude, longitude, placeId and formattedAddress are stored in
   form state (and saved to the DB) but are NOT shown on the page.
============================================================ */

function Step2Location({ data, update, onContinue, onBack, saving }: StepProps) {
  const { text } = makeForm(data, update);
  const c = categorize(data);

  const [countries, setCountries] = useState<LookupItem[]>([]);
  const [states, setStates] = useState<LookupItem[]>([]);
  const [cities, setCities] = useState<LookupItem[]>([]);
  const [areas, setAreas] = useState<LookupItem[]>([]);

  // Map position of the selected city: fallback pin when a typed locality can't be found.
  const [cityGeo, setCityGeo] = useState<PartialFD | null>(null);

  // Load countries from the existing API.
  useEffect(() => {
    apiGet("/country")
      .then((r) => setCountries(lookupItems(r)))
      .catch((e) => console.error("Country fetch error:", e));
  }, []);

  // Default to India only when the form does not already have a country selected.
  useEffect(() => {
    if (countries.length === 0 || data.countryId) return;

    const india = countries.find(
      (item) => item.name.trim().toLowerCase() === "india"
    );

    if (india) {
      update({
        countryId: String(india.id),
        country: india.name,
        stateId: "",
        state: "",
        cityId: "",
        city: "",
        areaId: "",
        locality: "",
        subLocality: "",
        society: "",
        ...GEO_RESET,
      });
    }
  }, [countries, data.countryId, update]);

  useEffect(() => {
    if (!data.countryId) {
      setStates([]);
      return;
    }

    let cancelled = false;
    apiGet(`/states?countryId=${encodeURIComponent(data.countryId)}`)
      .then((r) => {
        if (!cancelled) setStates(lookupItems(r));
      })
      .catch(() => {
        if (!cancelled) setStates([]);
      });

    return () => {
      cancelled = true;
    };
  }, [data.countryId]);

  useEffect(() => {
    if (!data.stateId) {
      setCities([]);
      return;
    }

    let cancelled = false;
    apiGet(`/cities?stateId=${encodeURIComponent(data.stateId)}`)
      .then((r) => {
        if (!cancelled) setCities(lookupItems(r));
      })
      .catch(() => {
        if (!cancelled) setCities([]);
      });

    return () => {
      cancelled = true;
    };
  }, [data.stateId]);

  useEffect(() => {
    if (cities.length === 0) return;
    const matchedCity = data.cityId
      ? cities.find((item) => String(item.id) === data.cityId)
      : /^\d+$/.test(data.city || "")
        ? cities.find((item) => String(item.id) === data.city)
        : undefined;
    if (!matchedCity) return;

    const changes: PartialFD = {};
    if (data.city !== matchedCity.name) changes.city = matchedCity.name;
    if (!data.cityId) changes.cityId = String(matchedCity.id);
    if (Object.keys(changes).length > 0) update(changes);
  }, [cities, data.city, data.cityId, update]);

  useEffect(() => {
    if (!data.cityId) return setAreas([]);
    apiGet(`/area?cityId=${data.cityId}`).then((r) => setAreas(lookupItems(r))).catch(() => setAreas([]));
  }, [data.cityId]);

  const onCountry = (id: string) => {
    const name = countries.find((i) => String(i.id) === id)?.name || "";
    setCityGeo(null);
    update({
      countryId: id,
      country: name,
      stateId: "",
      state: "",
      cityId: "",
      city: "",
      areaId: "",
      locality: "",
      subLocality: "",
      society: "",
      ...GEO_RESET,
    });
  };

  const onState = (id: string) => {
    const name = states.find((i) => String(i.id) === id)?.name || "";
    setCityGeo(null);
    update({
      stateId: id,
      state: name,
      cityId: "",
      city: "",
      areaId: "",
      locality: "",
      subLocality: "",
      society: "",
      ...GEO_RESET,
    });
  };

  /* ---- CITY (picked from the searchable DB list) ---- */
  const selectCityFromList = async (id: string) => {
    const item = cities.find((i) => String(i.id) === id);
    if (!item) return;

    setCityGeo(null);
    update({
      city: item.name,
      cityId: id,
      areaId: "", locality: "", subLocality: "", society: "",
      latitude: "", longitude: "", placeId: "", formattedAddress: "",
    });

    // Resolve coordinates through Google so latitude / longitude are saved
    try {
      const maps = await loadGoogleMaps();
      const service = new maps.places.AutocompleteService();
      const predictions: any[] = await new Promise((resolve) => {
        service.getPlacePredictions(
          {
            input: `${item.name}, ${data.state || ""}`,
            componentRestrictions: { country: "in" },
            types: ["(cities)"],
          },
          (r: any[] | null) => resolve(r || [])
        );
      });
      if (predictions[0]) {
        const place = await getPlaceDetails(predictions[0].place_id);
        if (place) {
          const patch = geoPatch(place, predictions[0], {});
          update(patch);
          setCityGeo(patch);
        }
      }
    } catch (error) {
      console.error("City geocode error:", error);
    }
  };

  /* ---- LOCALITY ---- */
  const selectLocality = async (prediction: any) => {
    const place = await getPlaceDetails(prediction.place_id);
    if (!place) return;

    const name =
      addressPart(place, ["sublocality", "sublocality_level_1", "locality", "neighborhood", "postal_code"]) ||
      prediction.structured_formatting?.main_text || "";

    const target = normalizeLocationName(name);
    const match = areas
      .map((item) => ({ item, n: normalizeLocationName(item.name) }))
      .filter(({ n }) => n === target || (target.length >= 4 && n.includes(target)))
      .sort((a, b) => a.n.length - b.n.length)[0]?.item;

    update({
      locality: name,
      areaId: match ? String(match.id) : "",
      subLocality: "", society: "",
      ...geoPatch(place, prediction, data),
    });
  };

  /* ---- SOCIETY ---- */
  const selectSociety = async (prediction: any) => {
    const place = await getPlaceDetails(prediction.place_id);
    if (!place) return;
    update({
      society: place.name || prediction.structured_formatting?.main_text || "",
      ...geoPatch(place, prediction, data),
    });
  };

  /* ---- LOCALITY typed by hand (not in Google) ---- */
  const applyTypedLocality = async (typed: string) => {
    const target = normalizeLocationName(typed);
    const match = areas.find((item) => normalizeLocationName(item.name) === target);

    update({ locality: typed, areaId: match ? String(match.id) : "", subLocality: "", society: "" });

    const found = await geocodeText([typed, data.city, data.state].filter(Boolean).join(", "));
    if (found) {
      update({
        latitude: String(found.lat),
        longitude: String(found.lng),
        placeId: found.placeId,
        formattedAddress: found.formatted,
      });
    } else if (cityGeo) {
      update(cityGeo); // fall back to the city pin
    }
  };

  /* ---- SOCIETY / COLONY / BUILDER FLOOR typed by hand (not in Google) ----
     The name is saved exactly as typed. The map pin is refined only when the
     found place is within 3 km of the locality pin, so a vague name can never
     move the property to a far-away place. */
  const applyTypedSociety = async (typed: string) => {
    update({ society: typed });

    const found = await geocodeText(
      [typed, data.locality, data.city, data.state].filter(Boolean).join(", ")
    );
    if (!found) return; // keep the locality pin

    const currentLat = Number(data.latitude);
    const currentLng = Number(data.longitude);
    if (
      Number.isFinite(currentLat) &&
      Number.isFinite(currentLng) &&
      distanceKm(currentLat, currentLng, found.lat, found.lng) > 3
    ) {
      return; // too far from the locality, ignore
    }

    update({ latitude: String(found.lat), longitude: String(found.lng) });
  };

  const areaContext = [data.locality, data.city].filter(Boolean).join(", ");
  const isHouseType = HOUSE_TYPES.includes(data.propertyType || "");

  return (
    <div className="step step-2">
      <button type="button" className="back-link" onClick={onBack}>← Back</button>

      <div className="step-header">
        <div className="step-badge">Step 2</div>
        <div>
          <h1 className="page-title">Where is your property located?</h1>
          <p className="page-subtitle">Select locations from the suggestions. If yours is not listed, type it and click “Use …”.</p>
        </div>
      </div>

      <div className="location-card">
        <SearchableSelect
          id="country"
          label="Country"
          required
          placeholder="Select country"
          searchPlaceholder="Search country..."
          options={countries}
          value={data.countryId || ""}
          onChange={onCountry}
        />

        <SearchableSelect
          id="state"
          label="State"
          required
          placeholder={data.countryId ? "Select state" : "Select country first"}
          searchPlaceholder="Search state..."
          options={states}
          value={data.stateId || ""}
          disabled={!data.countryId}
          onChange={onState}
        />

        <SearchableSelect
          id="cityList"
          label="City"
          required
          placeholder={data.stateId ? "Select city" : "Select state first"}
          searchPlaceholder="Search city..."
          options={cities}
          value={data.cityId || ""}
          disabled={!data.stateId}
          onChange={selectCityFromList}
        />

        <LocationAutocomplete
          id="locality" label="Locality" required kind="locality"
          placeholder={data.city ? `e.g. Gomti Nagar, ${data.city}` : "e.g. Gomti Nagar"}
          value={data.locality || ""} disabled={!data.city} context={data.city}
          help="Locality not in the list? Type its name and click “Use …”."
          onInput={(v) => update({ locality: v, areaId: "", subLocality: "", society: "" })}
          onSelect={selectLocality}
          onManual={applyTypedLocality}
        />

        {!c.isPlot && (
          <LocationAutocomplete
            id="society" optional kind="society"
            label={
              c.isPG
                ? "PG / Building Name"
                : isHouseType
                  ? "Colony / Street / Builder Floor name"
                  : "Apartment / Society / Project"
            }
            placeholder={
              c.isPG
                ? "Search PG / building"
                : isHouseType
                  ? "Type colony / street / builder floor name"
                  : "Search apartment / society / project"
            }
            value={data.society || ""} disabled={!data.locality} context={areaContext}
            help="Not found? Type the name and click “Use …”, it will be saved as you typed."
            onInput={(v) => update({ society: v })}
            onSelect={selectSociety}
            onManual={applyTypedSociety}
          />
        )}

        {!c.isPlot && (
          <div className="two-col">
            <Inp
              label="Tower / Block (Optional)"
              value={data.towerBlock}
              onChange={text("towerBlock")}
            />
            <Inp
              label="Unit / Door number (Optional)"
              value={data.unitNumber}
              onChange={text("unitNumber")}
            />
          </div>
        )}

        {/* Stored silently – saved with the form, not shown to the user */}
        <input type="hidden" name="latitude" value={data.latitude || ""} readOnly />
        <input type="hidden" name="longitude" value={data.longitude || ""} readOnly />
        <input type="hidden" name="placeId" value={data.placeId || ""} readOnly />
        <input type="hidden" name="formattedAddress" value={data.formattedAddress || ""} readOnly />
      </div>

      <ActionBar
        info="* Required fields"
        help="Complete the required location details, then save and continue."
        label="Save & Next"
        saving={saving}
        onClick={onContinue}
      />
    </div>
  );
}

/* ============================================================
   STEP 3 — PROPERTY DETAILS
   (PG / rooms / commercial / plot / area / floor / availability / price / tenants)
============================================================ */

function Step3PropertyProfile({ data, update, onContinue, onBack, saving }: StepProps) {
  const { set, text, pick, toggle, limited } = makeForm(data, update);
  const c = categorize(data);

  const [showBuiltUp, setShowBuiltUp] = useState(!!data.builtUpArea);
  const [showSuper, setShowSuper] = useState(!!data.superBuiltUpArea);

  const unit = data.carpetAreaUnit || "sq.ft.";
  const unitSelect = (
    <select value={unit} onChange={text("carpetAreaUnit")}>
      {AREA_UNITS.map((u) => (
        <option key={u}>{u}</option>
      ))}
    </select>
  );

  const areaValue = Number(data.plotArea || data.carpetArea || data.builtUpArea || data.superBuiltUpArea);
  const priceValue = Number(data.expectedPrice);
  const perUnit = c.isSell && areaValue > 0 && priceValue > 0 ? Math.round(priceValue / areaValue) : 0;

  return (
    <div className="step step-3">
      <button type="button" className="back-link" onClick={onBack}>← Back</button>

      <h1 className="page-title">Tell us about your property</h1>
      <p className="page-subtitle">Add important details about your property to help buyers understand it better.</p>

      {/* PG */}
      {c.isPG && (
        <Sec title="PG Details">
          <div className="sub-title">PG is suitable for</div>
          <Chips options={PG_FOR} value={data.pgSuitableFor} onChange={(v) => pick("pgSuitableFor", v)} />
          <div className="sub-title">Room sharing</div>
          <Chips plus options={PG_SHARING} value={data.pgSharing} onChange={(v) => toggle("pgSharing", v)} />
          <Inp label="Total number of beds" type="number" min="1" value={data.pgTotalBeds} onChange={text("pgTotalBeds")} />
          <div className="sub-title">Meals included</div>
          <Chips options={YES_NO} value={data.pgFoodIncluded} onChange={(v) => pick("pgFoodIncluded", v)} />
          <div className="sub-title">Notice period</div>
          <Chips options={PG_NOTICE} value={data.pgNoticePeriod} onChange={(v) => pick("pgNoticePeriod", v)} />
          <div className="two-col">
            <Inp
              label="Bathrooms / washrooms"
              type="number"
              min="0"
              value={data.pgBathroomCount}
              onChange={text("pgBathroomCount")}
            />
            <Sel
              label="Bathroom arrangement"
              placeholder="Select"
              options={PG_BATHROOM_TYPES}
              value={data.pgBathroomType}
              onChange={text("pgBathroomType")}
            />
          </div>
          <div className="sub-title">Move-in preference</div>
          <Chips
            options={MOVE_IN_OPTIONS}
            value={data.moveInPreference}
            onChange={(v) => pick("moveInPreference", v)}
          />
        </Sec>
      )}

      {/* ROOMS */}
      {c.hasRooms && (
        <Sec title="Room Details">
          <div className="sub-title">Bedrooms</div>
          <Chips options={BEDS} value={data.beds} onChange={(v) => pick("beds", v)} />
          <div className="sub-title">Bathrooms</div>
          <Chips options={BATHS} value={data.baths} onChange={(v) => pick("baths", v)} />
          <div className="sub-title">Balconies</div>
          <Chips options={BALCONIES} value={data.balconies} onChange={(v) => set("balconies", v)} />
        </Sec>
      )}

      {/* COMMERCIAL */}
      {c.isCommercial && (
        <Sec title="Commercial Details">
          {c.isRetail && (
            <>
              <div className="sub-title">Located inside</div>
              <Chips options={LOCATED_INSIDE} value={data.locatedInside} onChange={(v) => pick("locatedInside", v)} />
            </>
          )}
          <Sel label="Zone type" placeholder="Select zone type" options={ZONES} value={data.zoneType} onChange={text("zoneType")} />
          <div className="sub-title">Washrooms</div>
          <Chips options={WASHROOMS} value={data.washrooms} onChange={(v) => pick("washrooms", v)} />

          {c.isOffice && (
            <>
              <div className="sub-title">Pantry</div>
              <Chips options={PANTRY} value={data.pantry} onChange={(v) => pick("pantry", v)} />
              <div className="two-col">
                <Inp type="number" min="0" placeholder="Min. seats" value={data.minSeats} onChange={text("minSeats")} />
                <Inp type="number" min="0" placeholder="Max. seats" value={data.maxSeats} onChange={text("maxSeats")} />
              </div>
              <div className="two-col">
                <Inp type="number" min="0" placeholder="Cabins" value={data.cabins} onChange={text("cabins")} />
                <Inp type="number" min="0" placeholder="Meeting rooms" value={data.meetingRooms} onChange={text("meetingRooms")} />
              </div>
            </>
          )}
          {c.isWarehouse && (
            <div className="two-col">
              <Inp
                label="Storage capacity (Optional)"
                type="number"
                min="0"
                value={data.warehouseCapacity}
                onChange={text("warehouseCapacity")}
              />
              <Inp
                label="Loading docks (Optional)"
                type="number"
                min="0"
                value={data.loadingDocks}
                onChange={text("loadingDocks")}
              />
            </div>
          )}
          {c.isCommercial && (
            <div className="unit-input" style={{ maxWidth: 420 }}>
              <Inp
                label="Power load (Optional)"
                type="number"
                min="0"
                value={data.powerLoad}
                onChange={text("powerLoad")}
              />
              <Sel
                label="Unit"
                placeholder="Unit"
                options={["kW", "kVA"]}
                value={data.powerLoadUnit}
                onChange={text("powerLoadUnit")}
              />
            </div>
          )}
          {c.isHospitality && (
            <div className="two-col">
              <Inp
                label="Number of rooms (Optional)"
                type="number"
                min="0"
                value={data.hotelRooms}
                onChange={text("hotelRooms")}
              />
              <Sel
                label="Property category (Optional)"
                placeholder="Select"
                options={HOTEL_CATEGORIES}
                value={data.hotelCategory}
                onChange={text("hotelCategory")}
              />
            </div>
          )}
        </Sec>
      )}

      {/* PLOT */}
      {c.isPlot && (
        <Sec title="Plot Details" required>
          <div className="unit-input" style={{ maxWidth: 320 }}>
            <input type="number" min="0" placeholder="Plot Area *" value={data.plotArea || ""} onChange={text("plotArea")} />
            {unitSelect}
          </div>
          <div className="two-col">
            <Inp type="number" min="0" placeholder="Plot length" value={data.plotLength} onChange={text("plotLength")} />
            <Inp type="number" min="0" placeholder="Plot breadth" value={data.plotBreadth} onChange={text("plotBreadth")} />
          </div>
          <Inp label="Floors allowed" type="number" min="0" placeholder="Number of floors" value={data.floorsAllowed} onChange={text("floorsAllowed")} />
          <div className="sub-title">Boundary wall</div>
          <Chips options={YES_NO} value={data.boundaryWall} onChange={(v) => pick("boundaryWall", v)} />
          <div className="sub-title">Construction done</div>
          <Chips options={YES_NO} value={data.constructionDone} onChange={(v) => pick("constructionDone", v)} />
          <Sel
            label="Intended land use (Optional)"
            placeholder="Select use"
            options={PLOT_PURPOSES}
            value={data.plotPurpose}
            onChange={text("plotPurpose")}
          />
          <Sel
            label="Approval status (Optional)"
            placeholder="Select status"
            options={PLOT_APPROVALS}
            value={data.plotApprovalStatus}
            onChange={text("plotApprovalStatus")}
          />
          <Sel
            label="Road access (Optional)"
            placeholder="Select access"
            options={PLOT_ACCESS}
            value={data.plotAccess}
            onChange={text("plotAccess")}
          />
          <div className="unit-input" style={{ maxWidth: 320 }}>
            <input
              type="number"
              min="0"
              max={MAX_ROAD_WIDTH}
              placeholder={`Road width (Optional, max ${MAX_ROAD_WIDTH})`}
              value={data.plotRoadWidth || ""}
              onChange={limited("plotRoadWidth", MAX_ROAD_WIDTH)}
            />
            <select
              value={data.plotRoadWidthUnit || "Feet"}
              onChange={text("plotRoadWidthUnit")}
            >
              {ROAD_WIDTH_UNITS.map((unitName) => <option key={unitName}>{unitName}</option>)}
            </select>
          </div>
        </Sec>
      )}

      {/* AREA */}
      {c.hasBuilding && (
        <Sec title="Add Area Details" required help="At least one area type is mandatory.">
          <div className="unit-input" style={{ maxWidth: 320 }}>
            <input type="number" min="0" placeholder="Carpet Area" value={data.carpetArea || ""} onChange={text("carpetArea")} />
            {unitSelect}
          </div>

          {showBuiltUp ? (
            <div style={{ maxWidth: 320 }}>
              <Inp type="number" min="0" placeholder="Built-up Area" value={data.builtUpArea} onChange={text("builtUpArea")} />
            </div>
          ) : (
            <button type="button" className="link-btn" onClick={() => setShowBuiltUp(true)}>+ Built-up Area</button>
          )}

          {showSuper ? (
            <div style={{ maxWidth: 320 }}>
              <Inp type="number" min="0" placeholder="Super Built-up Area" value={data.superBuiltUpArea} onChange={text("superBuiltUpArea")} />
            </div>
          ) : (
            <button type="button" className="link-btn" onClick={() => setShowSuper(true)}>+ Super Built-up Area</button>
          )}
        </Sec>
      )}

      {/* FLOOR */}
      {c.hasBuilding && (
        <Sec title="Floor Details" optional>
          <div className="two-col">
            <Inp label="Total Floors" type="number" min="0" value={data.totalFloors} onChange={text("totalFloors")} />
            <Sel label="Property on floor" placeholder="Select" options={FLOORS} value={data.propertyOnFloor} onChange={text("propertyOnFloor")} />
          </div>
          {c.hasRooms && (
            <Check label="This property is a Duplex" checked={!!data.duplex} onChange={(v) => set("duplex", v)} />
          )}
        </Sec>
      )}

      {/* AVAILABILITY */}
      {c.hasBuilding && (
        <Sec title="Availability Status">
          <Chips options={AVAILABILITY} value={data.availability} onChange={(v) => set("availability", v)} />

          {data.availability === "Ready to move" && (
            <>
              <div className="sub-title">Age of property</div>
              <Chips options={AGE_OPTIONS} value={data.propertyAge} onChange={(v) => pick("propertyAge", v)} />
            </>
          )}

          {data.availability === "Under construction" && (
            <>
              <div className="sub-title">Possession by</div>
              <Chips options={POSSESSION} value={data.possessionBy} onChange={(v) => pick("possessionBy", v)} />
            </>
          )}

          {c.isSell && (
            <Inp label="RERA registration no. (Optional)" value={data.reraId} onChange={text("reraId")} />
          )}
        </Sec>
      )}

      {/* SHOP FACADE */}
      {c.isRetail && (
        <Sec title="Shop facade size" optional help="Shop - front related details">
          <div className="two-col">
            <div className="unit-input">
              <input type="number" placeholder="Entrance width" value={data.entranceWidth || ""} onChange={text("entranceWidth")} />
              <select value={data.entranceWidthUnit || "ft."} onChange={text("entranceWidthUnit")}>
                <option>ft.</option>
                <option>m.</option>
              </select>
            </div>
            <div className="unit-input">
              <input type="number" placeholder="Ceiling Height" value={data.ceilingHeight || ""} onChange={text("ceilingHeight")} />
              <select value={data.ceilingHeightUnit || "ft."} onChange={text("ceilingHeightUnit")}>
                <option>ft.</option>
                <option>m.</option>
              </select>
            </div>
          </div>
        </Sec>
      )}

      {/* PRICE */}
      <Sec title={c.isSell ? "Price Details" : "Rent Details"}>
        <div className="two-col">
          <Money
            required
            label={c.isSell ? "Expected Price" : c.isPG ? "Rent per bed / month" : "Expected Rent / month"}
            value={data.expectedPrice}
            onChange={text("expectedPrice")}
          />
          {c.isSell && (
            <div className="input-with-label">
              <label>₹ Price per {unit}</label>
              <input type="text" readOnly value={perUnit > 0 ? perUnit.toLocaleString("en-IN") : data.pricePerSqft || ""} />
            </div>
          )}
        </div>

        <div className="checkbox-row">
          {c.isSell && <Check label="All inclusive price" checked={!!data.allInclusive} onChange={(v) => set("allInclusive", v)} />}
          <Check
            label={c.isSell ? "Price Negotiable" : "Rent Negotiable"}
            checked={!!data.priceNegotiable}
            onChange={(v) => set("priceNegotiable", v)}
          />
          {c.isSell && <Check label="Tax and Govt. charges excluded" checked={!!data.taxExcluded} onChange={(v) => set("taxExcluded", v)} />}
        </div>

        {c.hasBuilding && (
          <>
            <div className="sub-title">Maintenance charges</div>
            <Money placeholder="Maintenance amount" value={data.maintenance} onChange={text("maintenance")} />
            <Chips options={MAINT_PERIOD} value={data.maintenancePeriod} onChange={(v) => pick("maintenancePeriod", v)} />
          </>
        )}

        {c.isSell && (
          <Money label="Booking Amount (Optional)" value={data.bookingAmount} onChange={text("bookingAmount")} />
        )}

        {!c.isSell && (
          <>
            <div className="sub-title">Security deposit</div>
            <Chips options={DEPOSIT_TYPES} value={data.securityDepositType} onChange={(v) => pick("securityDepositType", v)} />
            {data.securityDepositType && data.securityDepositType !== "None" && (
              <>
                <Inp
                  type="number"
                  placeholder={data.securityDepositType === "Multiple of rent" ? "Number of months' rent" : "Deposit amount"}
                  value={data.securityDeposit}
                  onChange={text("securityDeposit")}
                />
                {data.securityDepositType === "Fixed" && numberToIndianWords(data.securityDeposit) && (
                  <p className="helper-text">{numberToIndianWords(data.securityDeposit)}</p>
                )}
              </>
            )}
          </>
        )}

        <div className="sub-title">Brokerage / transaction charges (Optional)</div>
        <div className="two-col">
          <Money
            placeholder="Brokerage amount or percentage"
            value={data.brokerage}
            onChange={text("brokerage")}
            showWords={data.brokerageUnit !== "Percent of transaction"}
          />
          <Sel
            placeholder="Charge type"
            options={BROKERAGE_UNITS}
            value={data.brokerageUnit}
            onChange={text("brokerageUnit")}
          />
        </div>
      </Sec>

      {/* PRE LEASED + RETURNS (sell + building only) */}
      {c.isSell && c.hasBuilding && (
        <>
          <Sec title="Is it Pre-leased / Pre-Rented?" optional help="For properties that are already rented out.">
            <Chips options={YES_NO} value={data.preLeased} onChange={(v) => pick("preLeased", v)} />

            {data.preLeased === "Yes" && (
              <>
                <Money required label="Current rent per month" value={data.currentRent} onChange={text("currentRent")} />
                <Inp required label="Lease tenure in years" type="number" min="1" value={data.leaseTenure} onChange={text("leaseTenure")} />
                <Inp label="Annual rent increase in % (Optional)" type="number" value={data.annualRentIncrease} onChange={text("annualRentIncrease")} />
                <Inp label="Leased to - Business Type (Optional)" value={data.leasedToType} onChange={text("leasedToType")} />
              </>
            )}
          </Sec>

          <Sec title="Expected Annual Returns" optional help="Based on cost of the property & current monthly rent.">
            <div style={{ maxWidth: 320 }}>
              <Inp label="Expected Annual Returns in %" type="number" min="0" value={data.expectedReturns} onChange={text("expectedReturns")} />
            </div>
            <Check label="Hide expected returns" checked={!!data.hideReturns} onChange={(v) => set("hideReturns", v)} />
          </Sec>
        </>
      )}

      {/* TENANTS */}
      {c.isRent && (
        <Sec title="Preferred Tenants" optional>
          <Chips plus options={TENANTS} value={data.preferredTenants} onChange={(v) => toggle("preferredTenants", v)} />
        </Sec>
      )}

      {/* AVAILABLE FROM */}
      {!c.isSell && (
        <Sec title="Available From" optional>
          <div style={{ maxWidth: 320 }}>
            <Inp type="date" min={new Date().toISOString().slice(0, 10)} value={data.availableFrom} onChange={text("availableFrom")} />
          </div>
          {!c.isPG && (
            <>
              <div className="sub-title">Move-in preference</div>
              <Chips
                options={MOVE_IN_OPTIONS}
                value={data.moveInPreference}
                onChange={(v) => pick("moveInPreference", v)}
              />
            </>
          )}
        </Sec>
      )}

      <ActionBar
        info="* Required fields"
        help="Complete all required details, then save and continue."
        label="Save & Next"
        saving={saving}
        onClick={onContinue}
      />
    </div>
  );
}

/* ============================================================
   STEP 4 — ROOMS, PARKING, DESCRIPTION, VIDEO & PHOTOS
   - savedPhotos  : filenames already stored on the server (data.photos)
   - pendingFiles : real File objects, uploaded on Save & Next
============================================================ */

function Step4Photos({
  data, update, pendingFiles, setPendingFiles, autoFillDescription, setAutoFillDescription, onContinue, onBack, saving,
}: StepProps & {
  pendingFiles: File[];
  setPendingFiles: Dispatch<SetStateAction<File[]>>;
  autoFillDescription: boolean;
  setAutoFillDescription: Dispatch<SetStateAction<boolean>>;
}) {
  const { set, text, pick, toggle } = makeForm(data, update);
  const c = categorize(data);

  const description = data.description || "";
  const generatedDescription = Object.entries(data)
    .flatMap(([key, value]) => {
      if ([
        "description", "contactNumber", "contactEmail", "countryId", "stateId", "cityId", "areaId",
        "latitude", "longitude", "placeId", "formattedAddress", "unitNumber", "youtubeLink",
        "photos", "sendViaWhatsapp", "hideReturns",
      ].includes(key)) return [];

      if (key === "lookingTo") {
        const purpose = value === "sell" ? "For sale" : value === "rent" ? "For rent" : value === "pg" ? "PG / Co-living" : "";
        return purpose ? [`Listing purpose: ${purpose}`] : [];
      }
      if (key === "furnishingItems" && value && typeof value === "object" && !Array.isArray(value)) {
        const items = Object.entries(value)
          .filter(([, count]) => count > 0)
          .map(([item, count]) => `${item}: ${count}`);
        return items.length > 0 ? [`Furnishing items: ${items.join(", ")}`] : [];
      }

      if (typeof value === "string" && value.trim()) {
        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
        return [`${label}: ${value.trim()}`];
      }
      if (typeof value === "number" && value > 0) {
        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
        return [`${label}: ${value}`];
      }
      if (typeof value === "boolean" && value) {
        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
        return [`${label}: Yes`];
      }
      if (Array.isArray(value) && value.length > 0) {
        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
        return [`${label}: ${value.join(", ")}`];
      }
      return [];
    })
    .join("\n")
    .slice(0, 5000);

  useEffect(() => {
    if (autoFillDescription && description !== generatedDescription) {
      update({ description: generatedDescription });
    }
  }, [autoFillDescription, description, generatedDescription, update]);

  const savedPhotos: string[] = data.photos || [];
  const totalCount = savedPhotos.length + pendingFiles.length;
  const items = data.furnishingItems || {};
  const furnished = data.furnishing === "Furnished" || data.furnishing === "Semi-Furnished";

  const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    if (totalCount + files.length > MAX_PHOTOS) {
      warn("Maximum 50 photos allowed", `You already selected ${totalCount} photo(s). You can upload a maximum of ${MAX_PHOTOS} photos.`);
      return;
    }

    const oversized = files.find((f) => f.size > MAX_PHOTO_SIZE);
    if (oversized) {
      warn("File size exceeded", `"${oversized.name}" is larger than 10 MB. Please select an image smaller than 10 MB.`);
      return;
    }

    const invalid = files.find((f) => !ALLOWED_PHOTO_EXTENSIONS.includes(f.name.split(".").pop()?.toLowerCase() || ""));
    if (invalid) {
      warn("Invalid image format", `"${invalid.name}" is not a supported image format. Please use PNG, JPG, JPEG, GIF, WEBP, HEIC or HEIF.`);
      return;
    }

    setPendingFiles((prev) => [...prev, ...files]);
  };

  const confirmRemove = async () => {
    const result = await Swal.fire({
      icon: "question",
      title: "Remove this photo?",
      text: "This photo will be removed from your selected photos.",
      showCancelButton: true,
      confirmButtonText: "Remove",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d92d20",
      cancelButtonColor: "#667085",
    });
    return result.isConfirmed;
  };

  const removeSaved = async (index: number) => {
    if (!(await confirmRemove())) return;
    update({ photos: savedPhotos.filter((_, i) => i !== index) });
  };

  const removePending = async (index: number) => {
    if (!(await confirmRemove())) return;
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="step step-4">
      <button type="button" className="back-link" onClick={onBack}>← Back</button>

      <h1 className="page-title">Photos, video &amp; description</h1>
      <p className="page-subtitle">A video is worth a thousand pictures. Properties with videos get higher page views.</p>

      {/* OTHER ROOMS + FURNISHING */}
      {c.hasRooms && (
        <Sec title="Room & Furnishing" optional>
          <div className="sub-title">Other rooms</div>
          <Chips plus options={OTHER_ROOMS} value={data.otherRooms} onChange={(v) => toggle("otherRooms", v)} />
          <div className="sub-title">Furnishing</div>
          <Chips options={FURNISHING} value={data.furnishing} onChange={(v) => pick("furnishing", v)} />
          {furnished &&
            COUNTED_ITEMS.map((item) => (
              <Counter
                key={item}
                label={item}
                value={items[item] || 0}
                onChange={(n) => set("furnishingItems", { ...items, [item]: n })}
              />
            ))}
        </Sec>
      )}

      {/* PARKING */}
      {c.hasBuilding && (
        <Sec title="Parking" optional>
          <Counter label="Covered Parking" value={data.coveredParking || 0} onChange={(v) => set("coveredParking", v)} />
          <Counter label="Open Parking" value={data.openParking || 0} onChange={(v) => set("openParking", v)} />
        </Sec>
      )}

      {/* YOUTUBE */}
      <div className="field-group">
        <div className="input-with-label">
          <label>📺 YouTube Link<span className="field-hint"> (Optional)</span></label>
          <input
            type="url"
            placeholder="Paste YouTube / video link of your property"
            value={data.youtubeLink || ""}
            onChange={text("youtubeLink")}
          />
        </div>
      </div>

      {/* PHOTOS */}
      <div className="photos-heading">
        <h2>Add photos of your property <span className="field-hint">(Optional)</span></h2>
        <p>A picture is worth a thousand words. 87% of buyers look at photos before buying.</p>
      </div>

      <div className="field-group">
        <label className="field-label">Upload images</label>

        <div className="upload-box">
          <div className="upload-icon">📷</div>
          <div className="upload-title">+ Add at least 5 photos</div>
          <p className="upload-sub">
            Up to 50 photos • Max size 10 MB
            <br />
            Formats: png, jpg, jpeg, gif, webp, heic, heif.
          </p>
          <label className="primary-btn upload-button">
            Upload Photos Now
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/gif,image/webp,image/heic,image/heif"
              style={{ display: "none" }}
              onChange={handleFiles}
            />
          </label>
        </div>

        {totalCount > 0 && (
          <div className="selected-photos">
            <div className="selected-header">
              <strong>{totalCount} photo{totalCount !== 1 ? "s" : ""} selected</strong>
            </div>

            {savedPhotos.map((photo, index) => (
              <div className="photo-item" key={`saved-${photo}`}>
                <div className="photo-info">
                  <span className="photo-number">{index + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="photo-thumb" src={`/api/uploads/${encodeURIComponent(photoFileName(photo))}`} alt="" />
                  <div>
                    <div className="photo-name">{photoFileName(photo)}</div>
                    <div className="photo-size">Saved</div>
                  </div>
                </div>
                <button type="button" className="remove-photo" onClick={() => removeSaved(index)}>Remove</button>
              </div>
            ))}

            {pendingFiles.map((file, index) => (
              <div className="photo-item" key={`new-${file.name}-${index}`}>
                <div className="photo-info">
                  <span className="photo-number">{savedPhotos.length + index + 1}</span>
                  <div>
                    <div className="photo-name">{file.name}</div>
                    <div className="photo-size">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • will upload on Save &amp; Next
                    </div>
                  </div>
                </div>
                <button type="button" className="remove-photo" onClick={() => removePending(index)}>Remove</button>
              </div>
            ))}
          </div>
        )}

        <div className="photo-warning">⚠ Without photos your ad may get less attention from buyers.</div>

        <div style={{ marginTop: 12 }}>
          <Check
            label="I will send photos over WhatsApp"
            checked={!!data.sendViaWhatsapp}
            onChange={(v) => set("sendViaWhatsapp", v)}
          />
        </div>
      </div>

      {/* DESCRIPTION */}
      <div className="field-group">
        <label className="field-label">
          What makes your property unique?<span className="field-hint"> (Optional)</span>
        </label>
        <p className="page-subtitle description-help">
          Adding description will increase your listing visibility (minimum {MIN_DESC} characters if added).
        </p>
        <div style={{ marginBottom: 10 }}>
          <Check
            label="Automatically fill this description with the property details entered above"
            checked={autoFillDescription}
            onChange={(checked) => {
              setAutoFillDescription(checked);
              if (!checked) update({ description: "" });
            }}
          />
          <p className="helper-text">Uncheck this option to write or edit the description yourself.</p>
        </div>
        <textarea
          className="textarea-input"
          placeholder="Share some details about your property like spacious area, nearby markets, metro connectivity and more"
          value={autoFillDescription ? generatedDescription : description}
          maxLength={5000}
          onChange={text("description")}
          readOnly={autoFillDescription}
        />
        <div className="char-count">{(autoFillDescription ? generatedDescription : description).length}/5000</div>
      </div>

      <div className="field-group">
        <label className="field-label">Additional terms / conditions (Optional)</label>
        <textarea
          className="textarea-input"
          placeholder="Add important terms such as maintenance, usage restrictions, or included services."
          value={data.termsAndConditions || ""}
          maxLength={3000}
          onChange={text("termsAndConditions")}
        />
        <div className="char-count">{(data.termsAndConditions || "").length}/3000</div>
      </div>

      <ActionBar
        info="Photos and description are optional."
        help="You can save and continue without adding photos."
        label="Save & Next"
        saving={saving}
        onClick={onContinue}
      />
    </div>
  );
}

/* ============================================================
   STEP 5 — AMENITIES & FEATURES
============================================================ */

function Step5Amenities({
  data, update, onSubmit, onBack, saving,
}: { data: FD; update: (p: PartialFD) => void; onSubmit: () => void; onBack: () => void; saving: boolean }) {
  const { text, pick, toggle, limited } = makeForm(data, update);
  const c = categorize(data);

  const [moreAmenities, setMoreAmenities] = useState(false);
  const [moreFeatures, setMoreFeatures] = useState(false);

  const showOpenSides = c.isPlot || c.isCommercial || HOUSE_TYPES.includes(data.propertyType || "");

  const handleSubmit = async () => {
    const result = await Swal.fire({
      icon: "question",
      title: "Submit property?",
      text: "Are you sure you want to save and submit this property listing?",
      showCancelButton: true,
      confirmButtonText: "Yes, Submit",
      cancelButtonText: "Review",
      confirmButtonColor: "#087f45",
      cancelButtonColor: "#667085",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    onSubmit();
  };

  return (
    <div className="step step-5">
      <button type="button" className="back-link" onClick={onBack}>← Back</button>

      <h1 className="page-title">Add amenities / unique features</h1>
      <p className="page-subtitle">
        These fields are used to populate USP &amp; caption. All fields on this page are optional.
      </p>

      {c.isPG && (
        <Sec title="PG Services & House Rules" optional>
          <div className="sub-title">Services included</div>
          <Chips plus options={PG_SERVICES} value={data.pgServices} onChange={(v) => toggle("pgServices", v)} />
          <div className="sub-title">House rules</div>
          <Chips plus options={PG_HOUSE_RULES} value={data.pgHouseRules} onChange={(v) => toggle("pgHouseRules", v)} />
        </Sec>
      )}

      {/* {!c.isPG && (
        <Sec title="Ownership" optional>
          <Chips options={OWNERSHIP_OPTIONS} value={data.ownership} onChange={(v) => pick("ownership", v)} />
        </Sec>
      )} */}

      {!c.isPlot && (
        <Sec title="Amenities" optional>
          <Chips
            plus
            options={moreAmenities ? AMENITIES : AMENITIES.slice(0, 8)}
            value={data.amenities}
            onChange={(v) => toggle("amenities", v)}
          />
          {!moreAmenities && (
            <button type="button" className="link-btn" onClick={() => setMoreAmenities(true)}>+ More amenities</button>
          )}
        </Sec>
      )}

      {c.hasBuilding && (
        <Sec title="Property Features" optional>
          <Chips
            plus
            options={moreFeatures ? FEATURES : FEATURES.slice(0, 6)}
            value={data.propertyFeatures}
            onChange={(v) => toggle("propertyFeatures", v)}
          />
          {!moreFeatures && (
            <button type="button" className="link-btn" onClick={() => setMoreFeatures(true)}>+ More property features</button>
          )}
        </Sec>
      )}

      {c.isCommercial && (
        <Sec title="Fire safety measures include" optional>
          <Chips plus options={FIRE_SAFETY} value={data.fireSafety} onChange={(v) => toggle("fireSafety", v)} />
        </Sec>
      )}

      {showOpenSides && (
        <Sec title="Open sides" optional>
          <Chips options={OPEN_SIDES} value={data.openSides} onChange={(v) => pick("openSides", v)} />
        </Sec>
      )}

      {c.hasBuilding && (
        <>
          <Sec title="Overlooking" optional>
            <Chips plus options={OVERLOOKING} value={data.overlooking} onChange={(v) => toggle("overlooking", v)} />
          </Sec>

          <Sec title="Power Backup" optional>
            <Chips options={POWER} value={data.powerBackup} onChange={(v) => pick("powerBackup", v)} />
          </Sec>

          <Sec title="Flooring" optional>
            <div style={{ maxWidth: 320 }}>
              <Sel placeholder="Select flooring" options={FLOORING} value={data.flooring} onChange={text("flooring")} />
            </div>
          </Sec>
        </>
      )}

      {!c.isPG && (
        <>
          <Sec title="Property Facing" optional>
            <Chips options={FACING} value={data.propertyFacing} onChange={(v) => pick("propertyFacing", v)} />
          </Sec>

          <Sec title="Width of facing road" optional help={`Maximum ${MAX_ROAD_WIDTH}`}>
            <div className="unit-input" style={{ maxWidth: 320 }}>
              <input
                type="number"
                min="0"
                max={MAX_ROAD_WIDTH}
                placeholder={`Enter the width (max ${MAX_ROAD_WIDTH})`}
                value={data.facingRoadWidth || ""}
                onChange={limited("facingRoadWidth", MAX_ROAD_WIDTH)}
              />
              <select value={data.facingRoadWidthUnit || "Feet"} onChange={text("facingRoadWidthUnit")}>
                <option>Feet</option>
                <option>Meter</option>
              </select>
            </div>
          </Sec>
        </>
      )}

      {c.isCommercial && (
        <>
          <Sec title="Located Near" optional>
            <Chips plus options={LOCATED_NEAR} value={data.locatedNear} onChange={(v) => toggle("locatedNear", v)} />
          </Sec>

          <Sec title="Suitable for business types" optional>
            <div style={{ maxWidth: 320 }}>
              <Sel placeholder="Select business type" options={BUSINESS_TYPES} value={data.suitableBusinessType} onChange={text("suitableBusinessType")} />
            </div>
          </Sec>
        </>
      )}

      <Sec title="Nearby Locations" optional help="Highlight the nearby landmarks">
        <Chips plus options={LOCATION_ADV} value={data.locationAdvantages} onChange={(v) => toggle("locationAdvantages", v)} />
        <p className="helper-text">*Please provide correct information, otherwise your listing might get blocked.</p>
      </Sec>

      <ActionBar
        info="All fields are optional"
        help="Add details to make your property listing more informative."
        label="Save and Submit"
        saving={saving}
        onClick={handleSubmit}
      />
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function AddPropertyPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [data, setData] = useState<FD>({});
  const [autoFillDescription, setAutoFillDescription] = useState(false);
  const [dbId, setDbId] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* Real image files chosen in Step 4, uploaded on the next save */
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const dbIdRef = useRef<number | null>(null);

  /* Requests run one after another, so "create" always finishes before the next "update". */
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());

  /* AUTH */
  useEffect(() => {
    const storedId = localStorage.getItem("userId");
    const parsed = storedId ? Number(storedId) : null;
    setUserId(Number.isFinite(parsed) && parsed! > 0 ? parsed : null);
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    dbIdRef.current = dbId;
  }, [dbId]);

  /* RESUME DRAFT */
  useEffect(() => {
    if (!authChecked || !userId) {
      setHydrated(true);
      return;
    }

    const storedId = readStoredDraftId(userId);
    if (storedId === null) {
      setHydrated(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/properties/${storedId}?userId=${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        if (cancelled) return;

        if (res.ok && json.success && json.property) {
          setDbId(storedId);
          setData(rowToFormData(json.property));

          const resumed = Number(json.property.current_step);
          if (Number.isFinite(resumed) && resumed >= 1 && resumed <= TOTAL_STEPS) setStep(resumed);
        } else {
          writeStoredDraftId(userId, null);
        }
      } catch {
        /* keep stored ID so next refresh can retry */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authChecked, userId]);

  /* Fill the contact mobile and email separately from the signed-in profile,
     without overwriting draft values or anything the user has already typed.
     A value the profile does not have is left empty, so the user must enter it in Step 1. */
  useEffect(() => {
    if (!authChecked || !hydrated || !userId) return;

    let cancelled = false;

    const applyContact = (mobileRaw: string, emailRaw: string) => {
      const mobile = isUsableMobile(mobileRaw) ? displayPhone(mobileRaw.trim()) : "";
      const email = emailRaw.trim();
      if (!mobile && !email) return;
      setData((previous) => ({
        ...previous,
        contactNumber: previous.contactNumber?.trim() || mobile,
        contactEmail: previous.contactEmail?.trim() || email,
      }));
    };

    const applySavedFallback = () => {
      const saved = getSavedContact();
      applyContact(saved.mobile, saved.email);
    };

    (async () => {
      try {
        const response = await fetch(`/api/profile?userId=${encodeURIComponent(String(userId))}`);
        if (!response.ok) {
          if (response.status === 404) {
            if (cancelled) return;
            applySavedFallback();
            return;
          }
          throw new Error(`Profile lookup failed (${response.status} ${response.statusText})`);
        }

        const profile = await response.json();
        if (cancelled) return;

        applyContact(String(profile.mobile ?? ""), String(profile.email ?? ""));
      } catch (error) {
        console.error("Property contact autofill error:", error);
        if (cancelled) return;
        applySavedFallback();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authChecked, hydrated, userId]);

  /* FORM UPDATE */
  const update = useCallback((partial: PartialFD) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const goTo = (next: number) => setStep(next);
  const back = () => setStep((cur) => Math.max(cur - 1, 1));

  /* RESET */
  const resetAll = useCallback(() => {
    setData({});
    setAutoFillDescription(false);
    setPendingFiles([]);
    setStep(1);
    setDbId(null);
    dbIdRef.current = null;
    setSyncError(null);
    if (userId) writeStoredDraftId(userId, null);
  }, [userId]);

  const saveToServer = useCallback(
    (payload: { formData: FD; step: number; status?: "active"; images?: File[] }): Promise<string | null> => {
      const run = async (): Promise<string | null> => {
        setIsSyncing(true);
        setSyncError(null);

        try {
          const existingId = dbIdRef.current;
          const status = payload.status ?? "draft";

          /* ---------- CREATE ---------- */
          if (existingId === null) {
            const res = await fetch("/api/properties", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, formData: payload.formData, step: payload.step, status }),
            });

            let json: any = null;
            try {
              json = await res.json();
            } catch {
              throw new Error(`Server returned an invalid response (${res.status}).`);
            }

            if (!res.ok || !json?.success) throw new Error(json?.error || json?.message || "Failed to create listing");

            const newId = json.id ?? json.property?.id ?? null;
            if (newId === null) throw new Error("Property was created but no property ID was returned.");

            const numericId = Number(newId);
            if (!Number.isInteger(numericId) || numericId <= 0) throw new Error("Invalid property ID returned by server.");

            dbIdRef.current = numericId;
            setDbId(numericId);
            if (userId) writeStoredDraftId(userId, numericId);

            return null;
          }

          /* ---------- UPDATE (with images) ---------- */
          const fd = new FormData();
          fd.append("userId", String(userId));
          fd.append("step", String(payload.step));
          fd.append("status", status);
          fd.append("formData", JSON.stringify(payload.formData));
          fd.append("photos", JSON.stringify(payload.formData.photos ?? []));

          payload.images?.forEach((file) => {
            if (file instanceof File && file.size > 0) fd.append("images", file, file.name);
          });

          const token = localStorage.getItem("token");
          const res = await fetch(`/api/properties/${existingId}`, {
            method: "PATCH",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: fd,
          });

          let json: any = null;
          try {
            json = await res.json();
          } catch {
            throw new Error(`Server returned an invalid response (${res.status}).`);
          }

          if (!res.ok || !json?.success) throw new Error(json?.error || json?.message || "Failed to save listing");

          const returnedId = Number(json.id ?? json.property?.id ?? existingId);
          if (Number.isInteger(returnedId) && returnedId > 0) {
            dbIdRef.current = returnedId;
            setDbId(returnedId);
            if (userId) writeStoredDraftId(userId, returnedId);
          }

          const serverPhotos: string[] = Array.isArray(json.property?.photos)
            ? json.property.photos.filter((i: unknown): i is string => typeof i === "string")
            : [];

          update({ photos: serverPhotos });

          if (payload.images && payload.images.length > 0) setPendingFiles([]);

          return null;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to save listing";
          console.error("saveToServer error:", error);
          setSyncError(message);
          return message;
        } finally {
          setIsSyncing(false);
        }
      };

      const promise = queueRef.current.then(run, run);
      queueRef.current = promise;
      return promise;
    },
    [userId, update]
  );

  const handleSaveAndNext = async () => {
    if (isSyncing || isSubmitting) return;

    if (!userId) {
      warn("Login required", "Please log in to save your listing.");
      return;
    }

    const validationError = validateStep(step, data);
    if (validationError) {
      warn("Please check this field", validationError);
      return;
    }

    const targetStep = Math.min(step + 1, TOTAL_STEPS);

    const error = await saveToServer({ formData: cleanForm(data), step: targetStep, images: pendingFiles });

    if (error) {
      await Swal.fire({
        icon: "error", title: "Could not save", text: error,
        confirmButtonText: "Try again", confirmButtonColor: "#087f45",
      });
      return;
    }

    setStep(targetStep);
  };

  /* SUBMIT (publish) — the overlay is shown only while the network request runs */
  const handleSubmit = async () => {
    if (isSubmitting || isSyncing) return;

    if (!userId) {
      warn("Login required", "Please log in to save your listing.");
      return;
    }

    for (let s = 1; s <= TOTAL_STEPS; s++) {
      const validationError = validateStep(s, data);
      if (validationError) {
        setStep(s);
        warn("Please check this field", validationError);
        return;
      }
    }

    setIsSubmitting(true);
    setSyncError(null);

    let error: string | null = null;

    try {
      error = await saveToServer({
        formData: cleanForm(data),
        step: TOTAL_STEPS,
        status: "active",
        images: pendingFiles,
      });
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to publish property";
      setSyncError(error);
    } finally {
      setIsSubmitting(false);
    }

    if (error) {
      await Swal.fire({
        icon: "error", title: "Could not publish", text: error,
        confirmButtonText: "Try again", confirmButtonColor: "#087f45",
      });
      return;
    }

    await Swal.fire({
      icon: "success",
      title: "Property published!",
      text: "Your property listing has been saved and published.",
      confirmButtonText: "Great",
      confirmButtonColor: "#087f45",
    });

    resetAll();
    const role = localStorage.getItem("role");
    const redirectPath =
      role === "admin"
        ? "/dashboard/PropertyListPage"
        : role === "agent"
          ? "/dashboard/agentProperty"
          : role === "owner"
            ? "/dashboard/userProperty"
            : role === "dealer"
            ? "/dashboard/userProperty"
            : role === "builder"
            ? "/dashboard/userProperty"
            : "/dashboard";
    window.location.href = redirectPath;
  };

  if (!authChecked || !hydrated) return null;

  const busy = isSyncing || isSubmitting;

  return (
    <Wrapper>
      <div className="property-page">
        <div className="topbar">
          <div className="brand">101acres</div>
          <button type="button" className="reset-btn" onClick={resetAll} disabled={busy}>
            Reset
          </button>
        </div>

        {!userId && (
          <div className="login-warning">⚠ You are not logged in. Please log in to save your listing.</div>
        )}

        <div className="layout">
          <aside className="sidebar-area">
            <Sidebar
              currentStep={step}
              data={data as any}
              onEditStep={goTo}
              scorePercent={STEP_BASE_SCORE[step]}
            />

            <div className={`saved-indicator ${syncError ? "has-error" : isSyncing ? "is-saving" : "is-saved"}`}>
              <span className="status-dot" />
              <span>{syncError ? syncError : isSyncing ? "Saving..." : "Saved on Save & Next"}</span>
            </div>
          </aside>

          <main className="main-panel">
            {step === 1 && (
              <Step1BasicDetails data={data} update={update} onContinue={handleSaveAndNext} saving={busy} />
            )}

            {step === 2 && (
              <Step2Location data={data} update={update} onContinue={handleSaveAndNext} onBack={back} saving={busy} />
            )}

            {step === 3 && (
              <Step3PropertyProfile data={data} update={update} onContinue={handleSaveAndNext} onBack={back} saving={busy} />
            )}

            {step === 4 && (
              <Step4Photos
                data={data}
                update={update}
                pendingFiles={pendingFiles}
                setPendingFiles={setPendingFiles}
                autoFillDescription={autoFillDescription}
                setAutoFillDescription={setAutoFillDescription}
                onContinue={handleSaveAndNext}
                onBack={back}
                saving={busy}
              />
            )}

            {step === 5 && (
              <Step5Amenities data={data} update={update} onSubmit={handleSubmit} onBack={back} saving={busy} />
            )}
          </main>
        </div>

        {isSubmitting && (
          <div className="submitting-overlay">
            <div className="loading-card">
              <div className="spinner" />
              <strong>Publishing property...</strong>
              <span>Please wait while we publish your listing.</span>
            </div>
          </div>
        )}
      </div>

    </Wrapper>
  );
}