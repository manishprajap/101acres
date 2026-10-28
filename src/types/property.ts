import { ReactNode } from "react";

export interface Property {
    area_name: ReactNode;
    city_name: ReactNode;
    state_name: ReactNode;
    country_name: string;
    propertyLocation: string;
    type: string;
    description: string;
    residentialType: string;
    category: string;
    id: number;
    title: string;
    image: string;
    squareFt: number;
    beds: number;
    baths: number;
    price: number;
    rating?: number;
    propertyFor?: string;
    propertyType?: string;
  }
   
  export interface PhotoMeta {
  name: string;
  size: number;
}
  export interface PropertyFormData {
  // Step 1 — Basic Details
  lookingTo?: "sell" | "rent";
  propertyCategory?: "Residential" | "Commercial";
  propertyType?: string;
  retailSpaceType?: string;
  locatedInside?: string;
  // Step 2 — Location Details
  city?: string;
  locality?: string;
  subLocality?: string;
  mallName?: string;
  latitude?: string;
  longitude?: string;
  geocoded_address?: string;

  // Step 3 — Property Profile
  carpetArea?: string;
  carpetAreaUnit?: string;
  washroom?: string;
  totalFloors?: string;
  propertyOnFloor?: string;
  parking?: string;
  availability?: string;
  propertyAge?: string;
  entranceWidth?: string;
  entranceWidthUnit?: string;
  ceilingHeight?: string;
  ceilingHeightUnit?: string;
  expectedPrice?: string;
  pricePerSqft?: string;
  taxExcluded?: boolean;
  priceNegotiable?: boolean;
  maintenance?: string;
  bookingAmount?: string;
  preLeased?: "Yes" | "No";
  currentRent?: string;
  leaseTenure?: string;
  annualRentIncrease?: string;
  leasedToType?: string;
  expectedReturns?: string;
  hideReturns?: boolean;

  // Step 4 — Photos, Videos & Voice-over
  youtubeLink?: string;
 photos?: string[];
  description?: string;

  // Step 5 — Amenities section
  amenities?: string[];
  propertyFeatures?: string[];
  societyFeatures?: string[];
  additionalFeatures?: string[];
  mainRoadFacing?: boolean;
  cornerProperty?: boolean;
  fireSafety?: string[];
  ownership?: string;
  propertyFacing?: string;
  facingRoadWidth?: string;
  facingRoadWidthUnit?: string;
  locatedNear?: string[];
  suitableBusinessType?: string;
  locationAdvantages?: string[];
}

/** Allows updating any subset of fields at once, e.g. update({ city, locality }) */
export type PartialFormData = Partial<PropertyFormData>;

export interface Draft {
  formData: PropertyFormData;
  step: number;
  updatedAt: string;
}