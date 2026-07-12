import { Router } from "express";
import { db, vehiclesTable, driversTable, tripsTable, maintenanceLogsTable, fuelLogsTable, expensesTable } from "@workspace/db";
import { eq, and, ne, desc, count, sum, sql } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";

const router = Router();
router.use(authenticate);

// GET /dashboard/kpis
router.get("/dashboard/kpis", async (_req, res): Promise<void> => {
  const [
    vehicleStats,
    driverStats,
    tripStats,
  ] = await Promise.all([
    db.select({
      status: vehiclesTable.status,
      cnt: count(),
    }).from(vehiclesTable).groupBy(vehiclesTable.status),

    db.select({
      status: driversTable.status,
      cnt: count(),
    }).from(driversTable).groupBy(driversTable.status),

    db.select({
      status: tripsTable.status,
      cnt: count(),
    }).from(tripsTable).groupBy(tripsTable.status),
  ]);

  const vStats = Object.fromEntries(vehicleStats.map(r => [r.status, Number(r.cnt)]));
  const dStats = Object.fromEntries(driverStats.map(r => [r.status, Number(r.cnt)]));
  const tStats = Object.fromEntries(tripStats.map(r => [r.status, Number(r.cnt)]));

  const availableVehicles = vStats.available ?? 0;
  const vehiclesOnTrip = vStats.on_trip ?? 0;
  const vehiclesInMaintenance = vStats.in_shop ?? 0;
  const retiredVehicles = vStats.retired ?? 0;
  const activeVehicles = availableVehicles + vehiclesOnTrip + vehiclesInMaintenance;

  const totalDrivers = Object.values(dStats).reduce((a, b) => a + b, 0);
  const driversOnDuty = (dStats.available ?? 0) + (dStats.on_trip ?? 0);
  const availableDrivers = dStats.available ?? 0;
  const suspendedDrivers = dStats.suspended ?? 0;

  const activeTrips = tStats.dispatched ?? 0;
  const pendingTrips = tStats.draft ?? 0;

  const fleetUtilizationPct = activeVehicles > 0
    ? Math.round((vehiclesOnTrip / activeVehicles) * 100 * 10) / 10
    : 0;

  res.json({
    activeVehicles,
    availableVehicles,
    vehiclesInMaintenance,
    vehiclesOnTrip,
    retiredVehicles,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    totalDrivers,
    availableDrivers,
    suspendedDrivers,
    fleetUtilizationPct,
  });
});

// GET /dashboard/recent-trips
router.get("/dashboard/recent-trips", async (_req, res): Promise<void> => {
  const trips = await db
    .select({
      trip: tripsTable,
      vehicle: vehiclesTable,
      driver: driversTable,
    })
    .from(tripsTable)
    .leftJoin(vehiclesTable, eq(tripsTable.vehicleId, vehiclesTable.id))
    .leftJoin(driversTable, eq(tripsTable.driverId, driversTable.id))
    .orderBy(desc(tripsTable.updatedAt))
    .limit(10);

  res.json(trips.map(r => ({
    id: r.trip.id,
    sourceLocation: r.trip.sourceLocation,
    destinationLocation: r.trip.destinationLocation,
    vehicleId: r.trip.vehicleId,
    driverId: r.trip.driverId,
    vehicleName: r.vehicle?.vehicleName ?? null,
    driverName: r.driver?.fullName ?? null,
    registrationNumber: r.vehicle?.registrationNumber ?? null,
    cargoWeightKg: parseFloat(r.trip.cargoWeightKg),
    plannedDistanceKm: parseFloat(r.trip.plannedDistanceKm),
    actualDistanceKm: r.trip.actualDistanceKm ? parseFloat(r.trip.actualDistanceKm) : null,
    plannedStartAt: r.trip.plannedStartAt?.toISOString() ?? null,
    dispatchedAt: r.trip.dispatchedAt?.toISOString() ?? null,
    completedAt: r.trip.completedAt?.toISOString() ?? null,
    cancelledAt: r.trip.cancelledAt?.toISOString() ?? null,
    finalOdometerKm: r.trip.finalOdometerKm ? parseFloat(r.trip.finalOdometerKm) : null,
    revenue: r.trip.revenue ? parseFloat(r.trip.revenue) : null,
    notes: r.trip.notes,
    status: r.trip.status,
    createdAt: r.trip.createdAt.toISOString(),
    updatedAt: r.trip.updatedAt.toISOString(),
  })));
});

// GET /dashboard/vehicle-status-summary
router.get("/dashboard/vehicle-status-summary", async (_req, res): Promise<void> => {
  const stats = await db.select({
    status: vehiclesTable.status,
    cnt: count(),
  }).from(vehiclesTable).groupBy(vehiclesTable.status);

  const statMap = Object.fromEntries(stats.map(r => [r.status, Number(r.cnt)]));
  res.json({
    available: statMap.available ?? 0,
    onTrip: statMap.on_trip ?? 0,
    inShop: statMap.in_shop ?? 0,
    retired: statMap.retired ?? 0,
  });
});

export default router;
