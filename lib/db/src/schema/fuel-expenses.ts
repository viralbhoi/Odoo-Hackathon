import { pgTable, serial, text, numeric, pgEnum, timestamp, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { vehiclesTable } from "./vehicles";
import { tripsTable } from "./trips";
import { usersTable } from "./users";

export const expenseTypeEnum = pgEnum("expense_type", ["fuel", "toll", "maintenance", "other"]);

export const fuelLogsTable = pgTable("fuel_logs", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehiclesTable.id),
  tripId: integer("trip_id").references(() => tripsTable.id),
  date: date("date", { mode: "string" }).notNull(),
  liters: numeric("liters", { precision: 10, scale: 2 }).notNull(),
  cost: numeric("cost", { precision: 14, scale: 2 }).notNull(),
  odometerReadingKm: numeric("odometer_reading_km", { precision: 12, scale: 2 }),
  fuelStation: text("fuel_station"),
  notes: text("notes"),
  createdByUserId: integer("created_by_user_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const expensesTable = pgTable("expenses", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehiclesTable.id),
  tripId: integer("trip_id").references(() => tripsTable.id),
  expenseType: expenseTypeEnum("expense_type").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  date: date("date", { mode: "string" }).notNull(),
  description: text("description"),
  createdByUserId: integer("created_by_user_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFuelLogSchema = createInsertSchema(fuelLogsTable).omit({ id: true, createdAt: true });
export type InsertFuelLog = z.infer<typeof insertFuelLogSchema>;
export type FuelLog = typeof fuelLogsTable.$inferSelect;

export const insertExpenseSchema = createInsertSchema(expensesTable).omit({ id: true, createdAt: true });
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expensesTable.$inferSelect;
