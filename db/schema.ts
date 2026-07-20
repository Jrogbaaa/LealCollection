import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const slotEnum = pgEnum("slot", ["full_day", "morning", "afternoon"]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
]);

export const boats = pgTable("boats", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameEs: text("name_es").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionEs: text("description_es").notNull(),
  lengthFt: integer("length_ft").notNull(),
  capacity: integer("capacity").notNull(),
  cabins: integer("cabins").notNull(),
  homeMarina: text("home_marina").notNull(),
  priceFullDay: integer("price_full_day").notNull(),
  priceMorning: integer("price_morning").notNull(),
  priceAfternoon: integer("price_afternoon").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const boatImages = pgTable("boat_images", {
  id: serial("id").primaryKey(),
  boatId: integer("boat_id")
    .notNull()
    .references(() => boats.id, { onDelete: "cascade" }),
  blobUrl: text("blob_url").notNull(),
  altEn: text("alt_en").notNull(),
  altEs: text("alt_es").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const extras = pgTable("extras", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  labelEn: text("label_en").notNull(),
  labelEs: text("label_es").notNull(),
  price: integer("price").notNull(),
  isIncluded: boolean("is_included").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  boatId: integer("boat_id")
    .notNull()
    .references(() => boats.id),
  bookingDate: date("booking_date").notNull(),
  slot: slotEnum("slot").notNull(),
  customerName: text("customer_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  notes: text("notes"),
  guests: integer("guests").notNull(),
  locale: text("locale").notNull().default("en"),
  subtotal: integer("subtotal").notNull(),
  depositAmount: integer("deposit_amount").notNull(),
  currency: text("currency").notNull().default("EUR"),
  status: bookingStatusEnum("status").notNull().default("pending"),
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntent: text("stripe_payment_intent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bookingExtras = pgTable("booking_extras", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  extraId: integer("extra_id")
    .notNull()
    .references(() => extras.id),
  qty: integer("qty").notNull().default(1),
  unitPriceAtBooking: integer("unit_price_at_booking").notNull(),
});

export const boatsRelations = relations(boats, ({ many }) => ({
  images: many(boatImages),
}));

export const boatImagesRelations = relations(boatImages, ({ one }) => ({
  boat: one(boats, { fields: [boatImages.boatId], references: [boats.id] }),
}));

export const bookingsRelations = relations(bookings, ({ many, one }) => ({
  extras: many(bookingExtras),
  boat: one(boats, { fields: [bookings.boatId], references: [boats.id] }),
}));

export const bookingExtrasRelations = relations(bookingExtras, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingExtras.bookingId],
    references: [bookings.id],
  }),
  extra: one(extras, {
    fields: [bookingExtras.extraId],
    references: [extras.id],
  }),
}));

export const blockedDates = pgTable("blocked_dates", {
  id: serial("id").primaryKey(),
  boatId: integer("boat_id").references(() => boats.id, {
    onDelete: "cascade",
  }),
  date: date("date").notNull(),
  slot: slotEnum("slot"),
  reason: text("reason"),
});
