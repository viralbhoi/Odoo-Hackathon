import { pgTable, serial, text, numeric, pgEnum, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const driverStatusEnum = pgEnum("driver_status", ["available", "on_trip", "off_duty", "suspended"]);

export const driversTable = pgTable("drivers", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  licenseNumber: text("license_number").notNull().unique(),
  licenseCategory: text("license_category").notNull(), // LMV, HMV, etc.
  licenseExpiryDate: date("license_expiry_date", { mode: "string" }).notNull(),
  contactNumber: text("contact_number").notNull(),
  safetyScore: numeric("safety_score", { precision: 5, scale: 2 }).notNull().default("100"),
  region: text("region"),
  status: driverStatusEnum("status").notNull().default("available"),
  tripCompletionRate: numeric("trip_completion_rate", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDriverSchema = createInsertSchema(driversTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof driversTable.$inferSelect;
