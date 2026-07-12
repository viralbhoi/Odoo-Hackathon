import { pgTable, serial, text, numeric, pgEnum, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { vehiclesTable } from "./vehicles";
import { driversTable } from "./drivers";
import { usersTable } from "./users";

export const tripStatusEnum = pgEnum("trip_status", ["draft", "dispatched", "completed", "cancelled"]);

export const tripsTable = pgTable("trips", {
  id: serial("id").primaryKey(),
  sourceLocation: text("source_location").notNull(),
  destinationLocation: text("destination_location").notNull(),
  vehicleId: integer("vehicle_id").references(() => vehiclesTable.id),
  driverId: integer("driver_id").references(() => driversTable.id),
  cargoWeightKg: numeric("cargo_weight_kg", { precision: 10, scale: 2 }).notNull(),
  plannedDistanceKm: numeric("planned_distance_km", { precision: 10, scale: 2 }).notNull(),
  actualDistanceKm: numeric("actual_distance_km", { precision: 10, scale: 2 }),
  plannedStartAt: timestamp("planned_start_at", { withTimezone: true }),
  dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  finalOdometerKm: numeric("final_odometer_km", { precision: 12, scale: 2 }),
  revenue: numeric("revenue", { precision: 14, scale: 2 }),
  notes: text("notes"),
  status: tripStatusEnum("status").notNull().default("draft"),
  createdByUserId: integer("created_by_user_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTripSchema = createInsertSchema(tripsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof tripsTable.$inferSelect;
