import { Router } from "express";
import { db, fuelLogsTable, expensesTable, vehiclesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { authenticate, type AuthenticatedRequest } from "../middlewares/authenticate";
import {
  CreateFuelLogBody,
  CreateExpenseBody,
  ListFuelLogsQueryParams,
  ListExpensesQueryParams,
} from "@workspace/api-zod";

const router = Router();
router.use(authenticate);

// GET /fuel-logs
router.get("/fuel-logs", async (req, res): Promise<void> => {
  const query = ListFuelLogsQueryParams.safeParse(req.query);
  const filters = query.success ? query.data : {};

  const logs = await db
    .select({ log: fuelLogsTable, vehicle: vehiclesTable })
    .from(fuelLogsTable)
    .leftJoin(vehiclesTable, eq(fuelLogsTable.vehicleId, vehiclesTable.id))
    .orderBy(desc(fuelLogsTable.createdAt));

  let result = logs;
  if (filters.vehicleId) result = result.filter(r => r.log.vehicleId === filters.vehicleId);
  if (filters.tripId) result = result.filter(r => r.log.tripId === filters.tripId);

  res.json(result.map(r => formatFuelLog(r.log, r.vehicle)));
});

// POST /fuel-logs
router.post("/fuel-logs", async (req: AuthenticatedRequest, res): Promise<void> => {
  const parsed = CreateFuelLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, parsed.data.vehicleId));
  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  const [log] = await db.insert(fuelLogsTable).values({
    vehicleId: parsed.data.vehicleId,
    tripId: parsed.data.tripId ?? null,
    date: parsed.data.date,
    liters: String(parsed.data.liters),
    cost: String(parsed.data.cost),
    odometerReadingKm: parsed.data.odometerReadingKm ? String(parsed.data.odometerReadingKm) : null,
    fuelStation: parsed.data.fuelStation ?? null,
    notes: parsed.data.notes ?? null,
    createdByUserId: req.user?.userId ?? null,
  }).returning();

  res.status(201).json(formatFuelLog(log, vehicle));
});

// GET /expenses
router.get("/expenses", async (req, res): Promise<void> => {
  const query = ListExpensesQueryParams.safeParse(req.query);
  const filters = query.success ? query.data : {};

  const expenses = await db
    .select({ expense: expensesTable, vehicle: vehiclesTable })
    .from(expensesTable)
    .leftJoin(vehiclesTable, eq(expensesTable.vehicleId, vehiclesTable.id))
    .orderBy(desc(expensesTable.createdAt));

  let result = expenses;
  if (filters.vehicleId) result = result.filter(r => r.expense.vehicleId === filters.vehicleId);
  if (filters.tripId) result = result.filter(r => r.expense.tripId === filters.tripId);
  if (filters.type) result = result.filter(r => r.expense.expenseType === filters.type);

  res.json(result.map(r => formatExpense(r.expense, r.vehicle)));
});

// POST /expenses
router.post("/expenses", async (req: AuthenticatedRequest, res): Promise<void> => {
  const parsed = CreateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, parsed.data.vehicleId));
  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  const [expense] = await db.insert(expensesTable).values({
    vehicleId: parsed.data.vehicleId,
    tripId: parsed.data.tripId ?? null,
    expenseType: parsed.data.expenseType,
    amount: String(parsed.data.amount),
    date: parsed.data.date,
    description: parsed.data.description ?? null,
    createdByUserId: req.user?.userId ?? null,
  }).returning();

  res.status(201).json(formatExpense(expense, vehicle));
});

function formatFuelLog(l: typeof fuelLogsTable.$inferSelect, v: typeof vehiclesTable.$inferSelect | null) {
  return {
    id: l.id,
    vehicleId: l.vehicleId,
    vehicleName: v?.vehicleName ?? null,
    registrationNumber: v?.registrationNumber ?? null,
    tripId: l.tripId,
    date: l.date,
    liters: parseFloat(l.liters),
    cost: parseFloat(l.cost),
    odometerReadingKm: l.odometerReadingKm ? parseFloat(l.odometerReadingKm) : null,
    fuelStation: l.fuelStation,
    notes: l.notes,
    createdAt: l.createdAt.toISOString(),
  };
}

function formatExpense(e: typeof expensesTable.$inferSelect, v: typeof vehiclesTable.$inferSelect | null) {
  return {
    id: e.id,
    vehicleId: e.vehicleId,
    vehicleName: v?.vehicleName ?? null,
    registrationNumber: v?.registrationNumber ?? null,
    tripId: e.tripId,
    expenseType: e.expenseType,
    amount: parseFloat(e.amount),
    date: e.date,
    description: e.description,
    createdAt: e.createdAt.toISOString(),
  };
}

export default router;
