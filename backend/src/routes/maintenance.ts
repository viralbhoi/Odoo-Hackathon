import { Router } from "express";
import { db, maintenanceLogsTable, vehiclesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { authenticate, type AuthenticatedRequest } from "../middlewares/authenticate";
import {
  CreateMaintenanceBody,
  CloseMaintenanceBody,
  GetMaintenanceParams,
  CloseMaintenanceParams,
  ListMaintenanceQueryParams,
} from "@workspace/api-zod";

const router = Router();
router.use(authenticate);

// GET /maintenance
router.get("/maintenance", async (req, res): Promise<void> => {
  const query = ListMaintenanceQueryParams.safeParse(req.query);
  const filters = query.success ? query.data : {};

  const records = await db
    .select({ log: maintenanceLogsTable, vehicle: vehiclesTable })
    .from(maintenanceLogsTable)
    .leftJoin(vehiclesTable, eq(maintenanceLogsTable.vehicleId, vehiclesTable.id))
    .orderBy(desc(maintenanceLogsTable.createdAt));

  let result = records;
  if (filters.vehicleId) result = result.filter(r => r.log.vehicleId === filters.vehicleId);
  if (filters.status) result = result.filter(r => r.log.status === filters.status);

  res.json(result.map(r => formatMaintenance(r.log, r.vehicle)));
});

// POST /maintenance
router.post("/maintenance", async (req: AuthenticatedRequest, res): Promise<void> => {
  const parsed = CreateMaintenanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, parsed.data.vehicleId));
  if (!vehicle) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  if (vehicle.status === "on_trip") {
    res.status(400).json({ error: "Cannot open maintenance for a vehicle currently on a trip" });
    return;
  }

  // Validate end date
  if (parsed.data.expectedEndDate && parsed.data.expectedEndDate < parsed.data.startDate) {
    res.status(400).json({ error: "End date cannot be before start date" });
    return;
  }

  const [log] = await db.transaction(async (tx) => {
    const [l] = await tx.insert(maintenanceLogsTable).values({
      vehicleId: parsed.data.vehicleId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      maintenanceType: parsed.data.maintenanceType,
      startDate: parsed.data.startDate,
      expectedEndDate: parsed.data.expectedEndDate ?? null,
      cost: String(parsed.data.cost),
      vendor: parsed.data.vendor ?? null,
      notes: parsed.data.notes ?? null,
      status: "open",
      createdByUserId: req.user?.userId ?? null,
    }).returning();

    // Set vehicle to in_shop
    await tx.update(vehiclesTable)
      .set({ status: "in_shop" })
      .where(eq(vehiclesTable.id, parsed.data.vehicleId));

    return [l];
  });

  req.log.info({ maintenanceId: log.id, vehicleId: log.vehicleId }, "Maintenance opened");

  const updatedVehicle = (await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, parsed.data.vehicleId)))[0];
  res.status(201).json(formatMaintenance(log, updatedVehicle ?? null));
});

// GET /maintenance/:id
router.get("/maintenance/:id", async (req, res): Promise<void> => {
  const params = GetMaintenanceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid maintenance ID" });
    return;
  }

  const [result] = await db
    .select({ log: maintenanceLogsTable, vehicle: vehiclesTable })
    .from(maintenanceLogsTable)
    .leftJoin(vehiclesTable, eq(maintenanceLogsTable.vehicleId, vehiclesTable.id))
    .where(eq(maintenanceLogsTable.id, params.data.id));

  if (!result) {
    res.status(404).json({ error: "Maintenance record not found" });
    return;
  }
  res.json(formatMaintenance(result.log, result.vehicle));
});

// POST /maintenance/:id/close
router.post("/maintenance/:id/close", async (req, res): Promise<void> => {
  const params = CloseMaintenanceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid maintenance ID" });
    return;
  }

  const parsed = CloseMaintenanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [result] = await db
    .select({ log: maintenanceLogsTable, vehicle: vehiclesTable })
    .from(maintenanceLogsTable)
    .leftJoin(vehiclesTable, eq(maintenanceLogsTable.vehicleId, vehiclesTable.id))
    .where(eq(maintenanceLogsTable.id, params.data.id));

  if (!result) {
    res.status(404).json({ error: "Maintenance record not found" });
    return;
  }

  if (result.log.status === "closed") {
    res.status(400).json({ error: "Maintenance record is already closed" });
    return;
  }

  const [updatedLog] = await db.transaction(async (tx) => {
    const [l] = await tx.update(maintenanceLogsTable).set({
      status: "closed",
      endDate: parsed.data.endDate,
      notes: parsed.data.notes ?? result.log.notes,
      cost: parsed.data.finalCost ? String(parsed.data.finalCost) : result.log.cost,
    }).where(eq(maintenanceLogsTable.id, params.data.id)).returning();

    // Restore vehicle to available unless retired
    if (result.vehicle && result.vehicle.status !== "retired") {
      await tx.update(vehiclesTable)
        .set({ status: "available" })
        .where(eq(vehiclesTable.id, result.log.vehicleId));
    }
    return [l];
  });

  req.log.info({ maintenanceId: updatedLog.id }, "Maintenance closed");

  const updatedVehicle = (await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, updatedLog.vehicleId)))[0];
  res.json(formatMaintenance(updatedLog, updatedVehicle ?? null));
});

function formatMaintenance(l: typeof maintenanceLogsTable.$inferSelect, v: typeof vehiclesTable.$inferSelect | null) {
  return {
    id: l.id,
    vehicleId: l.vehicleId,
    vehicleName: v?.vehicleName ?? null,
    registrationNumber: v?.registrationNumber ?? null,
    title: l.title,
    description: l.description,
    maintenanceType: l.maintenanceType,
    startDate: l.startDate,
    expectedEndDate: l.expectedEndDate,
    endDate: l.endDate,
    cost: parseFloat(l.cost),
    vendor: l.vendor,
    status: l.status,
    notes: l.notes,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

export default router;
