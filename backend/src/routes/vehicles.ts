import { Router } from "express";
import { db, vehiclesTable } from "@workspace/db";
import { eq, and, or, ilike, sql } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";
import {
  CreateVehicleBody,
  UpdateVehicleBody,
  GetVehicleParams,
  UpdateVehicleParams,
  RetireVehicleParams,
  ListVehiclesQueryParams,
} from "@workspace/api-zod";

const router = Router();
router.use(authenticate);

// GET /vehicles
router.get("/vehicles", async (req, res): Promise<void> => {
  const query = ListVehiclesQueryParams.safeParse(req.query);
  const filters = query.success ? query.data : {};

  let dbQuery = db.select().from(vehiclesTable).$dynamic();

  const conditions = [];
  if (filters.status) conditions.push(eq(vehiclesTable.status, filters.status as "available" | "on_trip" | "in_shop" | "retired"));
  if (filters.type) conditions.push(eq(vehiclesTable.type, filters.type));
  if (filters.region) conditions.push(eq(vehiclesTable.region, filters.region));
  if (filters.search) conditions.push(
    or(
      ilike(vehiclesTable.registrationNumber, `%${filters.search}%`),
      ilike(vehiclesTable.vehicleName, `%${filters.search}%`)
    )
  );

  if (conditions.length > 0) dbQuery = dbQuery.where(and(...conditions));

  const vehicles = await dbQuery.orderBy(vehiclesTable.createdAt);
  res.json(vehicles.map(formatVehicle));
});

// GET /vehicles/available
router.get("/vehicles/available", async (_req, res): Promise<void> => {
  const vehicles = await db
    .select()
    .from(vehiclesTable)
    .where(eq(vehiclesTable.status, "available"))
    .orderBy(vehiclesTable.vehicleName);
  res.json(vehicles.map(formatVehicle));
});

// POST /vehicles
router.post("/vehicles", async (req, res): Promise<void> => {
  const parsed = CreateVehicleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Check uniqueness
  const [existing] = await db
    .select()
    .from(vehiclesTable)
    .where(eq(vehiclesTable.registrationNumber, parsed.data.registrationNumber));
  if (existing) {
    res.status(409).json({ error: "Registration number already exists", code: "DUPLICATE_REGISTRATION" });
    return;
  }

  const [vehicle] = await db.insert(vehiclesTable).values({
    registrationNumber: parsed.data.registrationNumber,
    vehicleName: parsed.data.vehicleName,
    model: parsed.data.model ?? null,
    type: parsed.data.type,
    maxLoadCapacityKg: String(parsed.data.maxLoadCapacityKg),
    currentOdometerKm: String(parsed.data.currentOdometerKm ?? 0),
    acquisitionCost: String(parsed.data.acquisitionCost),
    region: parsed.data.region ?? null,
    status: "available",
  }).returning();

  req.log.info({ vehicleId: vehicle.id }, "Vehicle created");
  res.status(201).json(formatVehicle(vehicle));
});

// GET /vehicles/:id
router.get("/vehicles/:id", async (req, res): Promise<void> => {
  const params = GetVehicleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid vehicle ID" });
    return;
  }

  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, params.data.id));
  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }
  res.json(formatVehicle(vehicle));
});

// PATCH /vehicles/:id
router.patch("/vehicles/:id", async (req, res): Promise<void> => {
  const params = UpdateVehicleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid vehicle ID" });
    return;
  }

  const parsed = UpdateVehicleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.vehicleName !== undefined) updateData.vehicleName = parsed.data.vehicleName;
  if (parsed.data.model !== undefined) updateData.model = parsed.data.model;
  if (parsed.data.type !== undefined) updateData.type = parsed.data.type;
  if (parsed.data.maxLoadCapacityKg !== undefined) updateData.maxLoadCapacityKg = String(parsed.data.maxLoadCapacityKg);
  if (parsed.data.currentOdometerKm !== undefined) updateData.currentOdometerKm = String(parsed.data.currentOdometerKm);
  if (parsed.data.acquisitionCost !== undefined) updateData.acquisitionCost = String(parsed.data.acquisitionCost);
  if (parsed.data.region !== undefined) updateData.region = parsed.data.region;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;

  const [updated] = await db
    .update(vehiclesTable)
    .set(updateData)
    .where(eq(vehiclesTable.id, params.data.id))
    .returning();

  res.json(formatVehicle(updated));
});

// PATCH /vehicles/:id/retire
router.patch("/vehicles/:id/retire", async (req, res): Promise<void> => {
  const params = RetireVehicleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid vehicle ID" });
    return;
  }

  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, params.data.id));
  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  if (vehicle.status === "on_trip") {
    res.status(400).json({ error: "Cannot retire a vehicle that is on a trip", code: "VEHICLE_ON_TRIP" });
    return;
  }

  const [updated] = await db
    .update(vehiclesTable)
    .set({ status: "retired" })
    .where(eq(vehiclesTable.id, params.data.id))
    .returning();

  req.log.info({ vehicleId: vehicle.id }, "Vehicle retired");
  res.json(formatVehicle(updated));
});

function formatVehicle(v: typeof vehiclesTable.$inferSelect) {
  return {
    id: v.id,
    registrationNumber: v.registrationNumber,
    vehicleName: v.vehicleName,
    model: v.model,
    type: v.type,
    maxLoadCapacityKg: parseFloat(v.maxLoadCapacityKg),
    currentOdometerKm: parseFloat(v.currentOdometerKm),
    acquisitionCost: parseFloat(v.acquisitionCost),
    region: v.region,
    status: v.status,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  };
}

export default router;
