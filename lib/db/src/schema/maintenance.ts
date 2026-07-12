import { pgTable, serial, text, numeric, pgEnum, timestamp, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { vehiclesTable } from "./vehicles";
import { usersTable } from "./users";

export const maintenanceStatusEnum = pgEnum("maintenance_status", ["open", "closed"]);

export const maintenanceLogsTable = pgTable("maintenance_logs", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehiclesTable.id),
  title: text("title").notNull(),
  description: text("description"),
  maintenanceType: text("maintenance_type").notNull(), // Oil Change, Tire Replacement, etc.
  startDate: date("start_date", { mode: "string" }).notNull(),
  expectedEndDate: date("expected_end_date", { mode: "string" }),
  endDate: date("end_date", { mode: "string" }),
  cost: numeric("cost", { precision: 14, scale: 2 }).notNull().default("0"),
  vendor: text("vendor"),
  status: maintenanceStatusEnum("status").notNull().default("open"),
  notes: text("notes"),
  createdByUserId: integer("created_by_user_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMaintenanceLogSchema = createInsertSchema(maintenanceLogsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMaintenanceLog = z.infer<typeof insertMaintenanceLogSchema>;
export type MaintenanceLog = typeof maintenanceLogsTable.$inferSelect;
