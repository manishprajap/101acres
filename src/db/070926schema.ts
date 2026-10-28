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
  date
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
  contactName: varchar('contact_name', { length: 255 }),
  contactNumber: varchar('contact_number', { length: 20 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  title: varchar('title', { length: 255 }),
  propertyLocation: varchar('property_location', { length: 255 }),
  propertyFor: varchar('property_for', { length: 255 }),
  propertyType: varchar('property_type', { length: 255 }),
  residentialType: varchar('residential_type', { length: 255 }),
  description: text('description'),
  squareFt: int('square_ft'),
  beds: int('beds'),
  baths: int('baths'),
  price: decimal('price', { precision: 10, scale: 2 }),
  priceFor: varchar('price_for', { length: 255 }),
  country: int('country'),
  state: int('state'),
  city: int('city'),
  area: int('area'),
  landmark: varchar('landmark', { length: 255 }),
  address: varchar('address', { length: 500 }),
  googleLocation: text('google_location'),
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
});


export const propertiesOLD = mysqlTable('properties', {
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