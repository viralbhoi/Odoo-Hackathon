import { Router } from "express";
import { db, vehiclesTable, tripsTable, fuelLogsTable, maintenanceLogsTable, expensesTable } from "@workspace/db";
import { eq, sql, sum, count, ne, desc } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";

const router = Router();
router.use(authenticate);

// GET /reports/fleet-utilization
router.get("/reports/fleet-utilization", async (_req, res): Promise<void> => {
  const vehicleStats = await db.select({
    status: vehiclesTable.status,
    type: vehiclesTable.type,
    region: vehiclesTable.region,
    cnt: count(),
  }).from(vehiclesTable).groupBy(vehiclesTable.status, vehiclesTable.type, vehiclesTable.region);

  const onTripTotal = vehicleStats.filter(r => r.status === "on_trip").reduce((a, r) => a + Number(r.cnt), 0);
  const activeTotal = vehicleStats.filter(r => r.status !== "retired").reduce((a, r) => a + Number(r.cnt), 0);
  const utilizationPct = activeTotal > 0 ? Math.round((onTripTotal / activeTotal) * 100 * 10) / 10 : 0;

  // By type
  const typeMap: Record<string, { onTrip: number; total: number }> = {};
  vehicleStats.filter(r => r.status !== "retired").forEach(r => {
    const t = r.type;
    if (!typeMap[t]) typeMap[t] = { onTrip: 0, total: 0 };
    typeMap[t].total += Number(r.cnt);
    if (r.status === "on_trip") typeMap[t].onTrip += Number(r.cnt);
  });

  // By region
  const regionMap: Record<string, { onTrip: number; total: number }> = {};
  vehicleStats.filter(r => r.status !== "retired").forEach(r => {
    const reg = r.region ?? "Unknown";
    if (!regionMap[reg]) regionMap[reg] = { onTrip: 0, total: 0 };
    regionMap[reg].total += Number(r.cnt);
    if (r.status === "on_trip") regionMap[reg].onTrip += Number(r.cnt);
  });

  res.json({
    utilizationPct,
    vehiclesOnTrip: onTripTotal,
    totalActiveVehicles: activeTotal,
    byType: Object.entries(typeMap).map(([label, v]) => ({
      label,
      onTrip: v.onTrip,
      total: v.total,
      pct: v.total > 0 ? Math.round((v.onTrip / v.total) * 100 * 10) / 10 : 0,
    })),
    byRegion: Object.entries(regionMap).map(([label, v]) => ({
      label,
      onTrip: v.onTrip,
      total: v.total,
      pct: v.total > 0 ? Math.round((v.onTrip / v.total) * 100 * 10) / 10 : 0,
    })),
  });
});

// GET /reports/fuel-efficiency
router.get("/reports/fuel-efficiency", async (_req, res): Promise<void> => {
  // Fuel efficiency = total distance (from completed trips) / total fuel (liters)
  const completedTrips = await db
    .select({
      vehicleId: tripsTable.vehicleId,
      totalDistance: sum(tripsTable.actualDistanceKm),
    })
    .from(tripsTable)
    .where(eq(tripsTable.status, "completed"))
    .groupBy(tripsTable.vehicleId);

  const fuelByVehicle = await db
    .select({
      vehicleId: fuelLogsTable.vehicleId,
      totalLiters: sum(fuelLogsTable.liters),
    })
    .from(fuelLogsTable)
    .groupBy(fuelLogsTable.vehicleId);

  const vehicles = await db.select().from(vehiclesTable);

  const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));
  const distMap = Object.fromEntries(completedTrips.map(r => [r.vehicleId, parseFloat(r.totalDistance ?? "0")]));
  const fuelMap = Object.fromEntries(fuelByVehicle.map(r => [r.vehicleId, parseFloat(r.totalLiters ?? "0")]));

  const result = vehicles
    .filter(v => fuelMap[v.id] && fuelMap[v.id] > 0)
    .map(v => ({
      vehicleId: v.id,
      vehicleName: v.vehicleName,
      registrationNumber: v.registrationNumber,
      totalDistanceKm: distMap[v.id] ?? 0,
      totalLiters: fuelMap[v.id] ?? 0,
      efficiencyKmPerLiter: fuelMap[v.id] > 0
        ? Math.round(((distMap[v.id] ?? 0) / fuelMap[v.id]) * 100) / 100
        : 0,
    }))
    .sort((a, b) => b.efficiencyKmPerLiter - a.efficiencyKmPerLiter);

  res.json(result);
});

// GET /reports/operational-cost
router.get("/reports/operational-cost", async (_req, res): Promise<void> => {
  const fuelCosts = await db
    .select({ vehicleId: fuelLogsTable.vehicleId, total: sum(fuelLogsTable.cost) })
    .from(fuelLogsTable)
    .groupBy(fuelLogsTable.vehicleId);

  const maintenanceCosts = await db
    .select({ vehicleId: maintenanceLogsTable.vehicleId, total: sum(maintenanceLogsTable.cost) })
    .from(maintenanceLogsTable)
    .groupBy(maintenanceLogsTable.vehicleId);

  const otherExpenses = await db
    .select({ vehicleId: expensesTable.vehicleId, total: sum(expensesTable.amount) })
    .from(expensesTable)
    .where(ne(expensesTable.expenseType, "fuel"))
    .groupBy(expensesTable.vehicleId);

  const vehicles = await db.select().from(vehiclesTable);

  const fuelMap = Object.fromEntries(fuelCosts.map(r => [r.vehicleId, parseFloat(r.total ?? "0")]));
  const maintMap = Object.fromEntries(maintenanceCosts.map(r => [r.vehicleId, parseFloat(r.total ?? "0")]));
  const otherMap = Object.fromEntries(otherExpenses.map(r => [r.vehicleId, parseFloat(r.total ?? "0")]));

  const result = vehicles.map(v => {
    const fuel = fuelMap[v.id] ?? 0;
    const maint = maintMap[v.id] ?? 0;
    const other = otherMap[v.id] ?? 0;
    return {
      vehicleId: v.id,
      vehicleName: v.vehicleName,
      registrationNumber: v.registrationNumber,
      fuelCost: fuel,
      maintenanceCost: maint,
      otherExpenses: other,
      totalCost: fuel + maint + other,
    };
  }).sort((a, b) => b.totalCost - a.totalCost);

  res.json(result);
});

// GET /reports/vehicle-roi
router.get("/reports/vehicle-roi", async (_req, res): Promise<void> => {
  const revenues = await db
    .select({ vehicleId: tripsTable.vehicleId, total: sum(tripsTable.revenue) })
    .from(tripsTable)
    .where(eq(tripsTable.status, "completed"))
    .groupBy(tripsTable.vehicleId);

  const fuelCosts = await db
    .select({ vehicleId: fuelLogsTable.vehicleId, total: sum(fuelLogsTable.cost) })
    .from(fuelLogsTable).groupBy(fuelLogsTable.vehicleId);

  const maintCosts = await db
    .select({ vehicleId: maintenanceLogsTable.vehicleId, total: sum(maintenanceLogsTable.cost) })
    .from(maintenanceLogsTable).groupBy(maintenanceLogsTable.vehicleId);

  const vehicles = await db.select().from(vehiclesTable);

  const revMap = Object.fromEntries(revenues.map(r => [r.vehicleId, parseFloat(r.total ?? "0")]));
  const fuelMap = Object.fromEntries(fuelCosts.map(r => [r.vehicleId, parseFloat(r.total ?? "0")]));
  const maintMap = Object.fromEntries(maintCosts.map(r => [r.vehicleId, parseFloat(r.total ?? "0")]));

  const result = vehicles.map(v => {
    const revenue = revMap[v.id] ?? null;
    const fuel = fuelMap[v.id] ?? 0;
    const maint = maintMap[v.id] ?? 0;
    const totalCost = fuel + maint;
    const acquisitionCost = parseFloat(v.acquisitionCost);
    const roiAvailable = revenue !== null && acquisitionCost > 0;
    const roi = roiAvailable ? Math.round(((revenue! - totalCost) / acquisitionCost) * 10000) / 100 : null;

    return {
      vehicleId: v.id,
      vehicleName: v.vehicleName,
      registrationNumber: v.registrationNumber,
      acquisitionCost,
      totalRevenue: revenue,
      totalCost,
      roi,
      roiAvailable,
    };
  });

  res.json(result);
});

// GET /reports/monthly-fuel-trend
router.get("/reports/monthly-fuel-trend", async (_req, res): Promise<void> => {
  const fuelByMonth = await db
    .select({
      month: sql<string>`to_char(${fuelLogsTable.date}::date, 'YYYY-MM')`,
      fuelCost: sum(fuelLogsTable.cost),
    })
    .from(fuelLogsTable)
    .groupBy(sql`to_char(${fuelLogsTable.date}::date, 'YYYY-MM')`)
    .orderBy(sql`to_char(${fuelLogsTable.date}::date, 'YYYY-MM')`);

  const maintByMonth = await db
    .select({
      month: sql<string>`to_char(${maintenanceLogsTable.startDate}::date, 'YYYY-MM')`,
      maintCost: sum(maintenanceLogsTable.cost),
    })
    .from(maintenanceLogsTable)
    .groupBy(sql`to_char(${maintenanceLogsTable.startDate}::date, 'YYYY-MM')`)
    .orderBy(sql`to_char(${maintenanceLogsTable.startDate}::date, 'YYYY-MM')`);

  // Merge by month
  const monthMap: Record<string, { fuelCost: number; maintenanceCost: number }> = {};
  fuelByMonth.forEach(r => {
    if (!monthMap[r.month]) monthMap[r.month] = { fuelCost: 0, maintenanceCost: 0 };
    monthMap[r.month].fuelCost = parseFloat(r.fuelCost ?? "0");
  });
  maintByMonth.forEach(r => {
    if (!monthMap[r.month]) monthMap[r.month] = { fuelCost: 0, maintenanceCost: 0 };
    monthMap[r.month].maintenanceCost = parseFloat(r.maintCost ?? "0");
  });

  const result = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month,
      fuelCost: v.fuelCost,
      maintenanceCost: v.maintenanceCost,
      totalCost: v.fuelCost + v.maintenanceCost,
    }));

  res.json(result);
});

// GET /reports/export/csv
router.get("/reports/export/csv", async (req, res): Promise<void> => {
  const type = req.query.type as string;
  const allowedTypes = ["vehicles", "drivers", "trips", "fuel-logs", "expenses", "maintenance"];

  if (!type || !allowedTypes.includes(type)) {
    res.status(400).json({ error: "Invalid export type" });
    return;
  }

  let csv = "";

  if (type === "vehicles") {
    const data = await db.select().from(vehiclesTable).orderBy(vehiclesTable.registrationNumber);
    csv = "ID,Registration Number,Name,Type,Max Load (kg),Odometer (km),Acquisition Cost,Region,Status\n";
    csv += data.map(v => [v.id, v.registrationNumber, v.vehicleName, v.type, v.maxLoadCapacityKg, v.currentOdometerKm, v.acquisitionCost, v.region ?? "", v.status].join(",")).join("\n");
  } else if (type === "drivers") {
    const data = await db.select().from(driversTable).orderBy(driversTable.fullName);
    csv = "ID,Name,License No,Category,Expiry Date,Contact,Safety Score,Region,Status\n";
    csv += data.map(d => [d.id, d.fullName, d.licenseNumber, d.licenseCategory, d.licenseExpiryDate, d.contactNumber, d.safetyScore, d.region ?? "", d.status].join(",")).join("\n");
  } else if (type === "trips") {
    const data = await db
      .select({ trip: tripsTable, vehicle: vehiclesTable, driver: driversTable })
      .from(tripsTable)
      .leftJoin(vehiclesTable, eq(tripsTable.vehicleId, vehiclesTable.id))
      .leftJoin(driversTable, eq(tripsTable.driverId, driversTable.id))
      .orderBy(desc(tripsTable.createdAt));
    csv = "ID,Source,Destination,Vehicle,Driver,Cargo (kg),Planned Distance (km),Actual Distance (km),Revenue,Status\n";
    csv += data.map(r => [r.trip.id, r.trip.sourceLocation, r.trip.destinationLocation, r.vehicle?.vehicleName ?? "", r.driver?.fullName ?? "", r.trip.cargoWeightKg, r.trip.plannedDistanceKm, r.trip.actualDistanceKm ?? "", r.trip.revenue ?? "", r.trip.status].join(",")).join("\n");
  } else if (type === "fuel-logs") {
    const data = await db.select({ log: fuelLogsTable, vehicle: vehiclesTable }).from(fuelLogsTable).leftJoin(vehiclesTable, eq(fuelLogsTable.vehicleId, vehiclesTable.id)).orderBy(desc(fuelLogsTable.createdAt));
    csv = "ID,Vehicle,Date,Liters,Cost,Odometer (km),Station\n";
    csv += data.map(r => [r.log.id, r.vehicle?.vehicleName ?? "", r.log.date, r.log.liters, r.log.cost, r.log.odometerReadingKm ?? "", r.log.fuelStation ?? ""].join(",")).join("\n");
  } else if (type === "expenses") {
    const data = await db.select({ expense: expensesTable, vehicle: vehiclesTable }).from(expensesTable).leftJoin(vehiclesTable, eq(expensesTable.vehicleId, vehiclesTable.id)).orderBy(desc(expensesTable.createdAt));
    csv = "ID,Vehicle,Type,Amount,Date,Description\n";
    csv += data.map(r => [r.expense.id, r.vehicle?.vehicleName ?? "", r.expense.expenseType, r.expense.amount, r.expense.date, r.expense.description ?? ""].join(",")).join("\n");
  } else if (type === "maintenance") {
    const data = await db.select({ log: maintenanceLogsTable, vehicle: vehiclesTable }).from(maintenanceLogsTable).leftJoin(vehiclesTable, eq(maintenanceLogsTable.vehicleId, vehiclesTable.id)).orderBy(desc(maintenanceLogsTable.createdAt));
    csv = "ID,Vehicle,Title,Type,Start Date,End Date,Cost,Vendor,Status\n";
    csv += data.map(r => [r.log.id, r.vehicle?.vehicleName ?? "", r.log.title, r.log.maintenanceType, r.log.startDate, r.log.endDate ?? "", r.log.cost, r.log.vendor ?? "", r.log.status].join(",")).join("\n");
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${type}-export.csv"`);
  res.send(csv);
});

export default router;
