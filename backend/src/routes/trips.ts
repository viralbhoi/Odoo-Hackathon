import { Router } from "express";
import { db, tripsTable, vehiclesTable, driversTable } from "@workspace/db";
import { eq, and, or, ilike, desc } from "drizzle-orm";
import { authenticate, type AuthenticatedRequest } from "../middlewares/authenticate";
import {
  CreateTripBody,
  UpdateTripBody,
  GetTripParams,
  UpdateTripParams,
  DispatchTripParams,
  CompleteTripParams,
  CompleteTripBody,
  CancelTripParams,
  ListTripsQueryParams,
} from "@workspace/api-zod";

const router = Router();
router.use(authenticate);

// GET /trips
router.get("/trips", async (req, res): Promise<void> => {
  const query = ListTripsQueryParams.safeParse(req.query);
  const filters = query.success ? query.data : {};

  const trips = await db
    .select({
      trip: tripsTable,
      vehicle: vehiclesTable,
      driver: driversTable,
    })
    .from(tripsTable)
    .leftJoin(vehiclesTable, eq(tripsTable.vehicleId, vehiclesTable.id))
    .leftJoin(driversTable, eq(tripsTable.driverId, driversTable.id))
    .orderBy(desc(tripsTable.createdAt));

  let result = trips;
  if (filters.status) {
    result = result.filter(r => r.trip.status === filters.status);
  }
  if (filters.vehicleId) {
    result = result.filter(r => r.trip.vehicleId === filters.vehicleId);
  }
  if (filters.driverId) {
    result = result.filter(r => r.trip.driverId === filters.driverId);
  }

  res.json(result.map(r => formatTrip(r.trip, r.vehicle, r.driver)));
});

// POST /trips
router.post("/trips", async (req: AuthenticatedRequest, res): Promise<void> => {
  const parsed = CreateTripBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { vehicleId, driverId, cargoWeightKg } = parsed.data;

  // Validate vehicle
  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, vehicleId));
  if (!vehicle) {
    res.status(400).json({ error: "Vehicle not found", code: "VEHICLE_NOT_FOUND" });
    return;
  }
  if (vehicle.status === "retired" || vehicle.status === "in_shop") {
    res.status(400).json({ error: `Vehicle is ${vehicle.status} and cannot be dispatched`, code: "VEHICLE_NOT_AVAILABLE" });
    return;
  }
  if (vehicle.status === "on_trip") {
    res.status(400).json({ error: "Vehicle is already on a trip", code: "VEHICLE_ON_TRIP" });
    return;
  }

  // Capacity check
  const maxCapacity = parseFloat(vehicle.maxLoadCapacityKg);
  if (cargoWeightKg > maxCapacity) {
    res.status(400).json({
      error: `Cargo weight (${cargoWeightKg} kg) exceeds vehicle capacity (${maxCapacity} kg)`,
      code: "CARGO_EXCEEDS_CAPACITY"
    });
    return;
  }

  // Validate driver
  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, driverId));
  if (!driver) {
    res.status(400).json({ error: "Driver not found", code: "DRIVER_NOT_FOUND" });
    return;
  }
  if (driver.status === "suspended") {
    res.status(400).json({ error: "Driver is suspended and cannot be assigned", code: "DRIVER_SUSPENDED" });
    return;
  }
  if (driver.status === "on_trip") {
    res.status(400).json({ error: "Driver is already on a trip", code: "DRIVER_ON_TRIP" });
    return;
  }

  // License check
  const today = new Date().toISOString().split("T")[0];
  if (driver.licenseExpiryDate < today) {
    res.status(400).json({ error: "Driver's license is expired", code: "DRIVER_LICENSE_EXPIRED" });
    return;
  }

  const [trip] = await db.insert(tripsTable).values({
    sourceLocation: parsed.data.sourceLocation,
    destinationLocation: parsed.data.destinationLocation,
    vehicleId,
    driverId,
    cargoWeightKg: String(cargoWeightKg),
    plannedDistanceKm: String(parsed.data.plannedDistanceKm),
    plannedStartAt: parsed.data.plannedStartAt ? new Date(parsed.data.plannedStartAt) : null,
    revenue: parsed.data.revenue ? String(parsed.data.revenue) : null,
    notes: parsed.data.notes ?? null,
    status: "draft",
    createdByUserId: req.user?.userId ?? null,
  }).returning();

  req.log.info({ tripId: trip.id }, "Trip created");
  res.status(201).json(formatTrip(trip, vehicle, driver));
});

// GET /trips/:id
router.get("/trips/:id", async (req, res): Promise<void> => {
  const params = GetTripParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid trip ID" });
    return;
  }

  const [result] = await db
    .select({ trip: tripsTable, vehicle: vehiclesTable, driver: driversTable })
    .from(tripsTable)
    .leftJoin(vehiclesTable, eq(tripsTable.vehicleId, vehiclesTable.id))
    .leftJoin(driversTable, eq(tripsTable.driverId, driversTable.id))
    .where(eq(tripsTable.id, params.data.id));

  if (!result) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  res.json(formatTrip(result.trip, result.vehicle, result.driver));
});

// PATCH /trips/:id
router.patch("/trips/:id", async (req, res): Promise<void> => {
  const params = UpdateTripParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid trip ID" });
    return;
  }

  const parsed = UpdateTripBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(tripsTable).where(eq(tripsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  if (existing.status !== "draft") {
    res.status(400).json({ error: "Only draft trips can be updated" });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.sourceLocation) updateData.sourceLocation = parsed.data.sourceLocation;
  if (parsed.data.destinationLocation) updateData.destinationLocation = parsed.data.destinationLocation;
  if (parsed.data.vehicleId) updateData.vehicleId = parsed.data.vehicleId;
  if (parsed.data.driverId) updateData.driverId = parsed.data.driverId;
  if (parsed.data.cargoWeightKg !== undefined) updateData.cargoWeightKg = String(parsed.data.cargoWeightKg);
  if (parsed.data.plannedDistanceKm !== undefined) updateData.plannedDistanceKm = String(parsed.data.plannedDistanceKm);
  if (parsed.data.revenue !== undefined) updateData.revenue = String(parsed.data.revenue);
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

  const [updated] = await db.update(tripsTable).set(updateData).where(eq(tripsTable.id, params.data.id)).returning();
  const vehicle = updated.vehicleId ? (await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, updated.vehicleId)))[0] : null;
  const driver = updated.driverId ? (await db.select().from(driversTable).where(eq(driversTable.id, updated.driverId)))[0] : null;
  res.json(formatTrip(updated, vehicle ?? null, driver ?? null));
});

// POST /trips/:id/dispatch
router.post("/trips/:id/dispatch", async (req, res): Promise<void> => {
  const params = DispatchTripParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid trip ID" });
    return;
  }

  // Transaction: re-validate and update atomically
  const [result] = await db
    .select({ trip: tripsTable, vehicle: vehiclesTable, driver: driversTable })
    .from(tripsTable)
    .leftJoin(vehiclesTable, eq(tripsTable.vehicleId, vehiclesTable.id))
    .leftJoin(driversTable, eq(tripsTable.driverId, driversTable.id))
    .where(eq(tripsTable.id, params.data.id));

  if (!result) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }

  const { trip, vehicle, driver } = result;

  if (trip.status !== "draft") {
    res.status(400).json({ error: `Trip cannot be dispatched from ${trip.status} state` });
    return;
  }

  if (!vehicle || !driver) {
    res.status(400).json({ error: "Trip must have both a vehicle and driver assigned" });
    return;
  }

  // Re-validate vehicle
  if (vehicle.status !== "available") {
    res.status(400).json({ error: `Vehicle is ${vehicle.status} and cannot be dispatched`, code: "VEHICLE_NOT_AVAILABLE" });
    return;
  }

  // Re-validate driver
  if (driver.status !== "available") {
    res.status(400).json({ error: `Driver is ${driver.status} and cannot be dispatched`, code: "DRIVER_NOT_AVAILABLE" });
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  if (driver.licenseExpiryDate < today) {
    res.status(400).json({ error: "Driver's license is expired", code: "DRIVER_LICENSE_EXPIRED" });
    return;
  }

  // Capacity re-check
  const maxCapacity = parseFloat(vehicle.maxLoadCapacityKg);
  const cargo = parseFloat(trip.cargoWeightKg);
  if (cargo > maxCapacity) {
    res.status(400).json({ error: `Cargo weight exceeds vehicle capacity`, code: "CARGO_EXCEEDS_CAPACITY" });
    return;
  }

  // Atomically update trip, vehicle, and driver
  const [updatedTrip] = await db.transaction(async (tx) => {
    const [t] = await tx.update(tripsTable)
      .set({ status: "dispatched", dispatchedAt: new Date() })
      .where(eq(tripsTable.id, params.data.id))
      .returning();
    await tx.update(vehiclesTable).set({ status: "on_trip" }).where(eq(vehiclesTable.id, vehicle.id));
    await tx.update(driversTable).set({ status: "on_trip" }).where(eq(driversTable.id, driver.id));
    return [t];
  });

  req.log.info({ tripId: updatedTrip.id, vehicleId: vehicle.id, driverId: driver.id }, "Trip dispatched");

  const updatedVehicle = (await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, vehicle.id)))[0];
  const updatedDriver = (await db.select().from(driversTable).where(eq(driversTable.id, driver.id)))[0];
  res.json(formatTrip(updatedTrip, updatedVehicle ?? null, updatedDriver ?? null));
});

// POST /trips/:id/complete
router.post("/trips/:id/complete", async (req, res): Promise<void> => {
  const params = CompleteTripParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid trip ID" });
    return;
  }

  const parsed = CompleteTripBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [result] = await db
    .select({ trip: tripsTable, vehicle: vehiclesTable, driver: driversTable })
    .from(tripsTable)
    .leftJoin(vehiclesTable, eq(tripsTable.vehicleId, vehiclesTable.id))
    .leftJoin(driversTable, eq(tripsTable.driverId, driversTable.id))
    .where(eq(tripsTable.id, params.data.id));

  if (!result) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }

  if (result.trip.status !== "dispatched") {
    res.status(400).json({ error: "Only dispatched trips can be completed" });
    return;
  }

  const [updatedTrip] = await db.transaction(async (tx) => {
    const [t] = await tx.update(tripsTable).set({
      status: "completed",
      completedAt: new Date(),
      actualDistanceKm: String(parsed.data.actualDistanceKm),
      finalOdometerKm: String(parsed.data.finalOdometerKm),
      revenue: parsed.data.revenue ? String(parsed.data.revenue) : result.trip.revenue,
      notes: parsed.data.notes ?? result.trip.notes,
    }).where(eq(tripsTable.id, params.data.id)).returning();

    if (result.vehicle) {
      await tx.update(vehiclesTable)
        .set({ status: "available", currentOdometerKm: String(parsed.data.finalOdometerKm) })
        .where(eq(vehiclesTable.id, result.vehicle.id));
    }
    if (result.driver) {
      await tx.update(driversTable)
        .set({ status: "available" })
        .where(eq(driversTable.id, result.driver.id));
    }
    return [t];
  });

  req.log.info({ tripId: updatedTrip.id }, "Trip completed");

  const updatedVehicle = result.vehicle ? (await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, result.vehicle.id)))[0] : null;
  const updatedDriver = result.driver ? (await db.select().from(driversTable).where(eq(driversTable.id, result.driver.id)))[0] : null;
  res.json(formatTrip(updatedTrip, updatedVehicle ?? null, updatedDriver ?? null));
});

// POST /trips/:id/cancel
router.post("/trips/:id/cancel", async (req, res): Promise<void> => {
  const params = CancelTripParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid trip ID" });
    return;
  }

  const [result] = await db
    .select({ trip: tripsTable, vehicle: vehiclesTable, driver: driversTable })
    .from(tripsTable)
    .leftJoin(vehiclesTable, eq(tripsTable.vehicleId, vehiclesTable.id))
    .leftJoin(driversTable, eq(tripsTable.driverId, driversTable.id))
    .where(eq(tripsTable.id, params.data.id));

  if (!result) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }

  const { trip, vehicle, driver } = result;

  if (trip.status === "completed" || trip.status === "cancelled") {
    res.status(400).json({ error: "Trip is already completed or cancelled" });
    return;
  }

  const wasDispatched = trip.status === "dispatched";

  const [updatedTrip] = await db.transaction(async (tx) => {
    const [t] = await tx.update(tripsTable)
      .set({ status: "cancelled", cancelledAt: new Date() })
      .where(eq(tripsTable.id, params.data.id))
      .returning();

    // Restore resources only if was dispatched
    if (wasDispatched) {
      if (vehicle) await tx.update(vehiclesTable).set({ status: "available" }).where(eq(vehiclesTable.id, vehicle.id));
      if (driver) await tx.update(driversTable).set({ status: "available" }).where(eq(driversTable.id, driver.id));
    }
    return [t];
  });

  req.log.info({ tripId: updatedTrip.id, wasDispatched }, "Trip cancelled");

  const updatedVehicle = vehicle ? (await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, vehicle.id)))[0] : null;
  const updatedDriver = driver ? (await db.select().from(driversTable).where(eq(driversTable.id, driver.id)))[0] : null;
  res.json(formatTrip(updatedTrip, updatedVehicle ?? null, updatedDriver ?? null));
});

function formatTrip(
  t: typeof tripsTable.$inferSelect,
  v: typeof vehiclesTable.$inferSelect | null,
  d: typeof driversTable.$inferSelect | null
) {
  return {
    id: t.id,
    sourceLocation: t.sourceLocation,
    destinationLocation: t.destinationLocation,
    vehicleId: t.vehicleId,
    driverId: t.driverId,
    vehicleName: v?.vehicleName ?? null,
    driverName: d?.fullName ?? null,
    registrationNumber: v?.registrationNumber ?? null,
    cargoWeightKg: parseFloat(t.cargoWeightKg),
    plannedDistanceKm: parseFloat(t.plannedDistanceKm),
    actualDistanceKm: t.actualDistanceKm ? parseFloat(t.actualDistanceKm) : null,
    plannedStartAt: t.plannedStartAt?.toISOString() ?? null,
    dispatchedAt: t.dispatchedAt?.toISOString() ?? null,
    completedAt: t.completedAt?.toISOString() ?? null,
    cancelledAt: t.cancelledAt?.toISOString() ?? null,
    finalOdometerKm: t.finalOdometerKm ? parseFloat(t.finalOdometerKm) : null,
    revenue: t.revenue ? parseFloat(t.revenue) : null,
    notes: t.notes,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export default router;
