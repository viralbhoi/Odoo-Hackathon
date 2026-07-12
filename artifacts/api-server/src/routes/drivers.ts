import { Router } from "express";
import { db, driversTable } from "@workspace/db";
import { eq, and, or, ilike, lte } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";
import {
  CreateDriverBody,
  UpdateDriverBody,
  GetDriverParams,
  UpdateDriverParams,
  SuspendDriverParams,
  UpdateDriverStatusParams,
  UpdateDriverStatusBody,
  ListDriversQueryParams,
} from "@workspace/api-zod";

const router = Router();
router.use(authenticate);

function isLicenseExpired(expiryDate: string): boolean {
  return new Date(expiryDate) < new Date();
}

// GET /drivers
router.get("/drivers", async (req, res): Promise<void> => {
  const query = ListDriversQueryParams.safeParse(req.query);
  const filters = query.success ? query.data : {};

  let dbQuery = db.select().from(driversTable).$dynamic();
  const conditions = [];

  if (filters.status) conditions.push(eq(driversTable.status, filters.status as "available" | "on_trip" | "off_duty" | "suspended"));
  if (filters.region) conditions.push(eq(driversTable.region, filters.region));
  if (filters.search) conditions.push(
    or(
      ilike(driversTable.fullName, `%${filters.search}%`),
      ilike(driversTable.licenseNumber, `%${filters.search}%`)
    )
  );
  if (filters.expiringLicense) {
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    conditions.push(lte(driversTable.licenseExpiryDate, thirtyDays.toISOString().split("T")[0]));
  }

  if (conditions.length > 0) dbQuery = dbQuery.where(and(...conditions));

  const drivers = await dbQuery.orderBy(driversTable.fullName);
  res.json(drivers.map(formatDriver));
});

// GET /drivers/available
router.get("/drivers/available", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const drivers = await db
    .select()
    .from(driversTable)
    .where(
      and(
        eq(driversTable.status, "available"),
        // license not expired
      )
    )
    .orderBy(driversTable.fullName);

  // Filter out expired licenses in app layer
  const eligible = drivers.filter((d) => d.licenseExpiryDate >= today);
  res.json(eligible.map(formatDriver));
});

// POST /drivers
router.post("/drivers", async (req, res): Promise<void> => {
  const parsed = CreateDriverBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Check license uniqueness
  const [existing] = await db
    .select()
    .from(driversTable)
    .where(eq(driversTable.licenseNumber, parsed.data.licenseNumber));
  if (existing) {
    res.status(409).json({ error: "License number already exists", code: "DUPLICATE_LICENSE" });
    return;
  }

  const [driver] = await db.insert(driversTable).values({
    fullName: parsed.data.fullName,
    licenseNumber: parsed.data.licenseNumber,
    licenseCategory: parsed.data.licenseCategory,
    licenseExpiryDate: parsed.data.licenseExpiryDate,
    contactNumber: parsed.data.contactNumber,
    safetyScore: String(parsed.data.safetyScore ?? 100),
    region: parsed.data.region ?? null,
    status: parsed.data.status ?? "available",
  }).returning();

  req.log.info({ driverId: driver.id }, "Driver created");
  res.status(201).json(formatDriver(driver));
});

// GET /drivers/:id
router.get("/drivers/:id", async (req, res): Promise<void> => {
  const params = GetDriverParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid driver ID" });
    return;
  }

  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, params.data.id));
  if (!driver) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }
  res.json(formatDriver(driver));
});

// PATCH /drivers/:id
router.patch("/drivers/:id", async (req, res): Promise<void> => {
  const params = UpdateDriverParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid driver ID" });
    return;
  }

  const parsed = UpdateDriverBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(driversTable).where(eq(driversTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.fullName !== undefined) updateData.fullName = parsed.data.fullName;
  if (parsed.data.licenseNumber !== undefined) updateData.licenseNumber = parsed.data.licenseNumber;
  if (parsed.data.licenseCategory !== undefined) updateData.licenseCategory = parsed.data.licenseCategory;
  if (parsed.data.licenseExpiryDate !== undefined) updateData.licenseExpiryDate = parsed.data.licenseExpiryDate;
  if (parsed.data.contactNumber !== undefined) updateData.contactNumber = parsed.data.contactNumber;
  if (parsed.data.safetyScore !== undefined) updateData.safetyScore = String(parsed.data.safetyScore);
  if (parsed.data.region !== undefined) updateData.region = parsed.data.region;

  const [updated] = await db
    .update(driversTable)
    .set(updateData)
    .where(eq(driversTable.id, params.data.id))
    .returning();

  res.json(formatDriver(updated));
});

// PATCH /drivers/:id/suspend
router.patch("/drivers/:id/suspend", async (req, res): Promise<void> => {
  const params = SuspendDriverParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid driver ID" });
    return;
  }

  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, params.data.id));
  if (!driver) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }

  if (driver.status === "on_trip") {
    res.status(400).json({ error: "Cannot suspend a driver currently on a trip" });
    return;
  }

  const [updated] = await db
    .update(driversTable)
    .set({ status: "suspended" })
    .where(eq(driversTable.id, params.data.id))
    .returning();

  req.log.info({ driverId: driver.id }, "Driver suspended");
  res.json(formatDriver(updated));
});

// PATCH /drivers/:id/status
router.patch("/drivers/:id/status", async (req, res): Promise<void> => {
  const params = UpdateDriverStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid driver ID" });
    return;
  }

  const parsed = UpdateDriverStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Don't allow setting to on_trip directly
  if (parsed.data.status === "on_trip") {
    res.status(400).json({ error: "Cannot manually set a driver to On Trip status" });
    return;
  }

  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, params.data.id));
  if (!driver) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }

  if (driver.status === "on_trip") {
    res.status(400).json({ error: "Cannot change status of a driver on a trip" });
    return;
  }

  const [updated] = await db
    .update(driversTable)
    .set({ status: parsed.data.status })
    .where(eq(driversTable.id, params.data.id))
    .returning();

  res.json(formatDriver(updated));
});

function formatDriver(d: typeof driversTable.$inferSelect) {
  return {
    id: d.id,
    fullName: d.fullName,
    licenseNumber: d.licenseNumber,
    licenseCategory: d.licenseCategory,
    licenseExpiryDate: d.licenseExpiryDate,
    contactNumber: d.contactNumber,
    safetyScore: parseFloat(d.safetyScore),
    region: d.region,
    status: d.status,
    tripCompletionRate: d.tripCompletionRate ? parseFloat(d.tripCompletionRate) : null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

export default router;
