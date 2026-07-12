import { pgTable, serial, text, numeric, pgEnum, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vehicleStatusEnum = pgEnum("vehicle_status", ["available", "on_trip", "in_shop", "retired"]);

export const vehiclesTable = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  registrationNumber: text("registration_number").notNull().unique(),
  vehicleName: text("vehicle_name").notNull(),
  model: text("model"),
  type: text("type").notNull(),
  maxLoadCapacityKg: numeric("max_load_capacity_kg", { precision: 10, scale: 2 }).notNull(),
  currentOdometerKm: numeric("current_odometer_km", { precision: 12, scale: 2 }).notNull().default("0"),
  acquisitionCost: numeric("acquisition_cost", { precision: 14, scale: 2 }).notNull(),
  region: text("region"),
  status: vehicleStatusEnum("status").notNull().default("available"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertVehicleSchema = createInsertSchema(vehiclesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehiclesTable.$inferSelect;
