// src/db/schema.ts
import {
  mysqlTable,
  int,
  varchar,
  decimal,
  timestamp,
  boolean,
  serial,
  text,
  date,
  json,
  mysqlEnum,
  longtext,
  smallint,
  index,
} from 'drizzle-orm/mysql-core';

// Users Table
export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  memberId: int('memberId'),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  image: varchar('image', { length: 255 }),
  role: varchar("role", { length: 255 }),
  address: varchar('address', { length: 255 }),
  mobile: int('mobile').notNull().default(0),
  country_id: int('country_id'),
  state_id: int('state_id'),
  city_id: int('city_id'),
  fcm_token: varchar('fcm_token', { length: 255 }),
  fcm_platform: varchar('fcm_platform', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const otpVerifications = mysqlTable("otp_verifications", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull(),
  otp: varchar("otp", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").notNull().default(false),
  attempts: int("attempts").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const plans = mysqlTable("plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  price: varchar("price", { length: 50 }).notNull(),
  duration: varchar("duration", { length: 100 }).notNull(),
  // Max properties a user on this plan may list. NULL = unlimited (e.g. Gold).
  listingLimit: int("listing_limit"),
  // Stored as a JSON array of strings, e.g. ["Priority Support", "Unlimited Listings"]
  features: json("features").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const userPlans = mysqlTable("user_plans", {
  id: int("id").autoincrement().primaryKey(),
  user_id: int("user_id").notNull(),
  plan_id: int("plan_id").notNull(),

  start_date: timestamp("start_date"),
  expiry_date: timestamp("expiry_date"),

  status: mysqlEnum("status", ["active", "expired", "cancelled", "inactive"])
    .default("active"),

  created_at: timestamp("created_at"),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Admins Table
export const admins = mysqlTable('admins', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const area = mysqlTable('areas', {
  id: serial('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }),
  country_id: int('country_id'),
  state_id: int('state_id'),
  city_id: int('city_id'),
});

// Properties Table
export const properties = mysqlTable('properties', {
  id: serial('id').primaryKey(),
  user_id: int('user_id'),

  // Contact (contactNumber can hold a phone number, username or e-mail, so it is wider now)
  contactName: varchar('contact_name', { length: 255 }),
  contactNumber: varchar('contact_number', { length: 255 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  sendViaWhatsapp: boolean('send_via_whatsapp').default(false),

  // Basic details
  title: varchar('title', { length: 255 }),
  propertyLocation: varchar('property_location', { length: 255 }),
  propertyFor: varchar('property_for', { length: 255 }),       // Sale | Rent | Paying Guest
  propertyType: varchar('property_type', { length: 255 }),     // Residential | Commercial
  residentialType: varchar('residential_type', { length: 255 }),
  description: text('description'),

  // Rooms
  beds: int('beds'),
  baths: int('baths'),
  balconies: varchar('balconies', { length: 20 }),
  otherRooms: json('other_rooms').$type<string[]>(),

  // Area: squareFt is always stored in sq.ft.; the three values below are as entered, in areaUnit
  squareFt: int('square_ft'),
  carpetArea: decimal('carpet_area', { precision: 12, scale: 2 }),
  builtUpArea: decimal('built_up_area', { precision: 12, scale: 2 }),
  superBuiltUpArea: decimal('super_built_up_area', { precision: 12, scale: 2 }),
  areaUnit: varchar('area_unit', { length: 20 }),

  // Floors
  totalFloors: int('total_floors'),
  floorNo: varchar('floor_no', { length: 20 }),                // Basement | Lower Ground | Ground | 1..30
  duplex: boolean('duplex').default(false),

  // Availability / furnishing / ownership
  availability: varchar('availability', { length: 50 }),
  furnishing: varchar('furnishing', { length: 50 }),
  ownership: varchar('ownership', { length: 50 }),

  // Price (widened: decimal(10,2) topped out below 10 Cr)
  price: decimal('price', { precision: 14, scale: 2 }),
  priceFor: varchar('price_for', { length: 255 }),
  allInclusive: boolean('all_inclusive').default(false),
  negotiable: boolean('negotiable').default(false),
  taxExcluded: boolean('tax_excluded').default(false),

  // Parking
  coveredParking: int('covered_parking').default(0),
  openParking: int('open_parking').default(0),

  // Features
  features: json('features').$type<string[]>(),
  overlooking: json('overlooking').$type<string[]>(),
  openSides: varchar('open_sides', { length: 10 }),
  powerBackup: varchar('power_backup', { length: 20 }),
  facing: varchar('facing', { length: 20 }),
  flooring: varchar('flooring', { length: 50 }),
  roadWidth: decimal('road_width', { precision: 8, scale: 2 }),
  roadWidthUnit: varchar('road_width_unit', { length: 10 }),

  // Location
  country: int('country'),
  state: int('state'),
  city: int('city'),
  area: int('area'),
  landmark: varchar('landmark', { length: 255 }),              // sub locality
  society: varchar('society', { length: 255 }),
  address: varchar('address', { length: 500 }),
  googleLocation: text('google_location'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),

  slug: varchar('slug', { length: 255 }),
  isBankProperty: varchar('is_bank_property', { length: 10 }).default('no'),
  bankPropertyType: varchar('bank_property_type', { length: 255 }),
  customBankType: varchar('custom_bank_type', { length: 255 }),
  image: text('image'),
  status: varchar('status', { length: 10 }),
  paymentstatus: varchar('paymentstatus', { length: 10 }),
  premium: boolean('premium').default(false),
  paymentType: varchar('payment_type', { length: 50 }),
  amount: int('amount'),
  isDeleted: boolean('is_deleted').default(false),
  remark: varchar('remark', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  latLngIdx: index('idx_properties_lat_lng').on(t.latitude, t.longitude),
}));


export const propertiesOLDBY290926 = mysqlTable(
  "properties",
  {
    id: int("id").autoincrement().primaryKey(),
    user_id: int("user_id").notNull(),
    status: varchar("status", {length: 20,}).notNull().default("draft"),
    current_step: smallint("current_step").notNull().default(1),
    looking_to: varchar("looking_to", {length: 20,}),
    property_category: varchar("property_category",{length: 20,}),
    property_type: varchar("property_type",{ length: 100,}),
    retail_space_type: varchar("retail_space_type",{length: 100,}),
    located_inside: varchar("located_inside",{length: 100,}),
    city: varchar("city", {length: 100,}),
    locality: varchar("locality", {length: 150,}),
    sub_locality: varchar("sub_locality",{length: 150,}),
    mall_name: varchar("mall_name", {length: 150}),
    carpet_area: decimal("carpet_area",{precision: 12,scale: 2,}),
    carpet_area_unit: varchar("carpet_area_unit",{length: 20,} ).default("sq.ft."),
    washroom: varchar("washroom", {length: 30,}),
    total_floors: smallint(
      "total_floors"
    ),
    property_on_floor: varchar(
      "property_on_floor",
      {
        length: 20,
      }
    ),

    parking: varchar("parking", {
      length: 30,
    }),

    availability: varchar(
      "availability",
      {
        length: 30,
      }
    ),

    property_age: varchar(
      "property_age",
      {
        length: 30,
      }
    ),

    entrance_width: decimal(
      "entrance_width",
      {
        precision: 10,
        scale: 2,
      }
    ),

    entrance_width_unit: varchar(
      "entrance_width_unit",
      {
        length: 20,
      }
    ).default("ft."),

    ceiling_height: decimal(
      "ceiling_height",
      {
        precision: 10,
        scale: 2,
      }
    ),

    ceiling_height_unit: varchar(
      "ceiling_height_unit",
      {
        length: 20,
      }
    ).default("ft."),

    expected_price: decimal(
      "expected_price",
      {
        precision: 14,
        scale: 2,
      }
    ),

    price_per_sqft: decimal(
      "price_per_sqft",
      {
        precision: 12,
        scale: 2,
      }
    ),

    tax_excluded: boolean(
      "tax_excluded"
    )
      .notNull()
      .default(false),

    price_negotiable: boolean(
      "price_negotiable"
    )
      .notNull()
      .default(false),

    maintenance: decimal(
      "maintenance",
      {
        precision: 12,
        scale: 2,
      }
    ),

    booking_amount: decimal(
      "booking_amount",
      {
        precision: 12,
        scale: 2,
      }
    ),

    pre_leased: varchar(
      "pre_leased",
      {
        length: 5,
      }
    ),

    current_rent: decimal(
      "current_rent",
      {
        precision: 12,
        scale: 2,
      }
    ),

    lease_tenure: smallint(
      "lease_tenure"
    ),

    annual_rent_increase: decimal(
      "annual_rent_increase",
      {
        precision: 5,
        scale: 2,
      }
    ),

    leased_to_type: varchar(
      "leased_to_type",
      {
        length: 100,
      }
    ),

    expected_returns: decimal(
      "expected_returns",
      {
        precision: 5,
        scale: 2,
      }
    ),

    hide_returns: boolean(
      "hide_returns"
    )
      .notNull()
      .default(false),

    /* ========================================================
       STEP 4 - PHOTOS / VIDEO / DESCRIPTION
    ======================================================== */

    youtube_link: varchar(
      "youtube_link",
      {
        length: 500,
      }
    ),

    /*
     * Actual database type from phpMyAdmin:
     * LONGTEXT
     */
    photos: longtext("photos"),

    description: longtext(
      "description"
    ),

    /* ========================================================
       STEP 5 - AMENITIES / FEATURES
    ======================================================== */

    amenities: longtext(
      "amenities"
    ),

    property_features: longtext(
      "property_features"
    ),

    society_features: longtext(
      "society_features"
    ),

    additional_features: longtext(
      "additional_features"
    ),

    main_road_facing: boolean(
      "main_road_facing"
    )
      .notNull()
      .default(false),

    corner_property: boolean(
      "corner_property"
    )
      .notNull()
      .default(false),

    fire_safety: longtext(
      "fire_safety"
    ),

    ownership: varchar(
      "ownership",
      {
        length: 30,
      }
    ),

    property_facing: varchar(
      "property_facing",
      {
        length: 30,
      }
    ),

    facing_road_width: decimal(
      "facing_road_width",
      {
        precision: 10,
        scale: 2,
      }
    ),

    facing_road_width_unit: varchar(
      "facing_road_width_unit",
      {
        length: 20,
      }
    ).default("Feet"),

    located_near: longtext(
      "located_near"
    ),

    suitable_business_type: varchar(
      "suitable_business_type",
      {
        length: 100,
      }
    ),

    location_advantages: longtext(
      "location_advantages"
    ),

    /* ========================================================
       GEOLOCATION
    ======================================================== */

    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    geocoded_address: varchar("geocoded_address", { length: 500 }),
    created_at: timestamp(
      "created_at"
    )
      .notNull()
      .defaultNow(),

    updated_at: timestamp(
      "updated_at"
    )
      .notNull()
      .defaultNow(),
  },

  /* ==========================================================
     INDEXES
  ========================================================== */

  
);

// Minimal database shape used by the add-property API. Keep this aligned with
// the existing properties table; the complete wizard payload is stored in form_data.
export const propertyFormProperties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  user_id: int("user_id"),
  contactName: varchar("contact_name", { length: 255 }),
  contactNumber: varchar("contact_number", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  title: varchar("title", { length: 255 }),
  squareFt: int("square_ft"),
  beds: int("beds"),
  baths: int("baths"),
  price: decimal("price", { precision: 10, scale: 2 }),
  image: text("image"),
  propertyLocation: varchar("property_location", { length: 255 }),
  propertyType: varchar("property_type", { length: 255 }),
  residentialType: varchar("residential_type", { length: 255 }),
  propertyFor: varchar("property_For", { length: 255 }),
  priceFor: varchar("price_for", { length: 255 }),
  country: int("country"),
  state: int("state"),
  city: int("city"),
  landmark: varchar("landmark", { length: 255 }),
  address: varchar("address", { length: 500 }),
  area: int("area"),
  googleLocation: text("google_location"),
  slug: varchar("slug", { length: 255 }),
  status: varchar("status", { length: 10 }),
  paymentstatus: varchar("paymentstatus", { length: 10 }),
  premium: boolean("premium").default(false),
  paymentType: varchar("payment_type", { length: 50 }),
  amount: int("amount"),
  isDeleted: boolean("is_deleted").default(false),
  remark: varchar("remark", { length: 255 }),
  isBankProperty: varchar("is_bank_property", { length: 10 }).default("no"),
  bankPropertyType: varchar("bank_property_type", { length: 255 }),
  customBankType: varchar("custom_bank_type", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  form_data: longtext("form_data"),
});


// export const properties = mysqlTable('properties', {
//   id: serial('id').primaryKey(),
//   user_id: int('user_id'),
//   contactName: varchar('contact_name', { length: 255 }),
//   contactNumber: varchar('contact_number', { length: 20 }),
//   contactEmail: varchar('contact_email', { length: 255 }),
//   title: varchar('title', { length: 255 }),
//   propertyLocation: varchar('property_location', { length: 255 }),
//   propertyFor: varchar('property_for', { length: 255 }),
//   propertyType: varchar('property_type', { length: 255 }),
//   residentialType: varchar('residential_type', { length: 255 }),
//   description: text('description'),
//   squareFt: int('square_ft'),
//   beds: int('beds'),
//   baths: int('baths'),
//   price: decimal('price', { precision: 10, scale: 2 }),
//   priceFor: varchar('price_for', { length: 255 }),
//   country: int('country'),
//   state: int('state'),
//   city: int('city'),
//   area: int('area'),
//   landmark: varchar('landmark', { length: 255 }),
//   address: varchar('address', { length: 500 }),
//   googleLocation: text('google_location'),
//   slug: varchar('slug', { length: 255 }),
//   isBankProperty: varchar('is_bank_property', { length: 10 }).default('no'),
//   bankPropertyType: varchar('bank_property_type', { length: 255 }),
//   customBankType: varchar('custom_bank_type', { length: 255 }),
//   image: text('image'),
//   status: varchar('status', { length: 10 }),
//   paymentstatus: varchar('paymentstatus', { length: 10 }),
//   premium: boolean('premium').default(false),
//   paymentType: varchar('payment_type', { length: 50 }),
//   amount: int('amount'),
//   isDeleted: boolean('is_deleted').default(false),
//   remark: varchar('remark', { length: 255 }),
// });

// NOTE: renamed the underlying table from 'properties' to 'properties_old'.
// It was previously pointing at the SAME table name as `properties` above
// (with a different, older column set) — two schema objects mapped to one
// physical table will conflict when running drizzle-kit generate/migrate.
// If this table is no longer needed, delete this export entirely instead.
export const propertiesOLD = mysqlTable('properties_old', {
  id: serial('id').primaryKey(),
  user_id: int('user_id'),
  title: varchar('title', { length: 255 }),
  squareFt: int('square_ft'),
  beds: int('beds'),
  baths: int('baths'),
  price: decimal('price', { precision: 10, scale: 2 }),
  image: text("image"),
  propertyLocation: varchar('property_location', { length: 255 }),
  propertyType: varchar('property_type', { length: 255 }),
  residentialType: varchar('residential_type', { length: 255 }),
  propertyFor: varchar('property_For', { length: 255 }),
  priceFor: varchar('price_for', { length: 255 }),
  country: int('country'),
  state: int('state'),
  city: int('city'),
  landmark: varchar('landmark', { length: 255 }),
  address: varchar('address', { length: 500 }),
  area: int('area'),
  googleLocation: text("google_location"),
  slug: varchar('slug', { length: 255 }),
  status: varchar('status', { length: 10 }),
  paymentstatus: varchar('paymentstatus', { length: 10 }),
  premium: boolean('premium').default(false),
  paymentType: varchar('payment_type', { length: 50 }),
  amount: int('amount'),
  isDeleted: boolean('is_deleted').default(false),
  remark: varchar('remark', { length: 255 }),
  isBankProperty: varchar("is_bank_property", { length: 10 }).default("no"), // yes / no
  bankPropertyType: varchar("bank_property_type", { length: 255 }), // e.g., Bank Auction Property
  customBankType: varchar("custom_bank_type", { length: 255 }), // user input
});

// Article Properties Table
export const property_article = mysqlTable('property_article', {
  id: serial('id').primaryKey(),
  user_id: int('user_id'),
  image: text("image"),
  propertyLocation: varchar('property_location', { length: 255 }),
  propertyType: varchar('property_type', { length: 255 }),
  residentialType: varchar('residential_type', { length: 255 }),
  propertyFor: varchar('property_For', { length: 255 }),
  country: int('country'),
  state: int('state'),
  city: int('city'),
  description: varchar('description', { length: 500 }),
  area: int('area'),
  slug: varchar('slug', { length: 255 }),
  status: varchar('status', { length: 10 }),
  isDeleted: boolean('is_deleted').default(false),
});

// Countries Table
export const countries = mysqlTable("countries", {
  id: int("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  sortname: varchar("sortname", { length: 100 }).notNull(),
});

// States Table
export const states = mysqlTable("states", {
  id: int("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  countryId: int("country_id").notNull(),
});

// Cities Table
export const cities = mysqlTable("cities", {
  id: int("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  stateId: int("state_id").notNull(),
});

export const contacts = mysqlTable('contacts', {
  id: serial('id').primaryKey(),

  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 150 }).notNull(),
  message: text('message').notNull(),

  phone: varchar('phone', { length: 20 }),
  subject: varchar('subject', { length: 150 }),

  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),

  status: varchar('status', { length: 20 }).default('new'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});