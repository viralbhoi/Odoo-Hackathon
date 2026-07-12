/**
 * Seed script for TransitOps demo data.
 * Run: pnpm --filter @workspace/api-server run seed
 */
import { db, rolesTable, usersTable, vehiclesTable, driversTable, tripsTable, maintenanceLogsTable, fuelLogsTable, expensesTable } from "@workspace/db";
import { hashPassword } from "./lib/auth";
import { eq } from "drizzle-orm";
import { logger } from "./lib/logger";

async function main() {
  logger.info("Seeding database...");

  // ── Roles ──────────────────────────────────────────────────────────────────
  const roleNames = [
    { name: "fleet_manager", description: "Full access to all fleet operations and management" },
    { name: "dispatcher", description: "Create and manage trip dispatch operations" },
    { name: "safety_officer", description: "Monitor driver safety scores and maintenance records" },
    { name: "financial_analyst", description: "View expenses, fuel costs, and financial reports" },
  ];

  const roles: Record<string, number> = {};
  for (const role of roleNames) {
    const [existing] = await db.select().from(rolesTable).where(eq(rolesTable.name, role.name));
    if (existing) {
      roles[role.name] = existing.id;
    } else {
      const [r] = await db.insert(rolesTable).values(role).returning();
      roles[role.name] = r.id;
    }
  }
  logger.info({ roles }, "Roles seeded");

  // ── Users ──────────────────────────────────────────────────────────────────
  const passwordHash = await hashPassword("password123");
  const usersData = [
    { fullName: "Marcus Wells", email: "fleet@transitops.io", roleId: roles.fleet_manager },
    { fullName: "Priya Sharma", email: "dispatch@transitops.io", roleId: roles.dispatcher },
    { fullName: "Carlos Rivera", email: "safety@transitops.io", roleId: roles.safety_officer },
    { fullName: "Aisha Thompson", email: "finance@transitops.io", roleId: roles.financial_analyst },
  ];

  const userIds: number[] = [];
  for (const user of usersData) {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, user.email));
    if (existing) {
      userIds.push(existing.id);
    } else {
      const [u] = await db.insert(usersTable).values({ ...user, passwordHash, isActive: true }).returning();
      userIds.push(u.id);
    }
  }
  logger.info({ count: userIds.length }, "Users seeded");

  // ── Vehicles ───────────────────────────────────────────────────────────────
  const vehiclesData = [
    {
      registrationNumber: "TRK-001-NG",
      vehicleName: "Iron Horse",
      model: "Scania R500",
      type: "Heavy Truck",
      maxLoadCapacityKg: "15000",
      currentOdometerKm: "142500",
      acquisitionCost: "85000",
      region: "North",
      status: "available" as const,
    },
    {
      registrationNumber: "TRK-002-NG",
      vehicleName: "Atlas Prime",
      model: "MAN TGX 26.480",
      type: "Heavy Truck",
      maxLoadCapacityKg: "18000",
      currentOdometerKm: "98200",
      acquisitionCost: "92000",
      region: "South",
      status: "on_trip" as const,
    },
    {
      registrationNumber: "VAN-003-NG",
      vehicleName: "Swift Courier",
      model: "Mercedes-Benz Sprinter",
      type: "Van",
      maxLoadCapacityKg: "1500",
      currentOdometerKm: "55400",
      acquisitionCost: "35000",
      region: "East",
      status: "available" as const,
    },
    {
      registrationNumber: "TRK-004-NG",
      vehicleName: "Titan Hauler",
      model: "Volvo FH16",
      type: "Heavy Truck",
      maxLoadCapacityKg: "20000",
      currentOdometerKm: "210000",
      acquisitionCost: "110000",
      region: "West",
      status: "in_shop" as const,
    },
    {
      registrationNumber: "PKP-005-NG",
      vehicleName: "Road Runner",
      model: "Toyota Hilux",
      type: "Pickup",
      maxLoadCapacityKg: "1200",
      currentOdometerKm: "78900",
      acquisitionCost: "28000",
      region: "North",
      status: "available" as const,
    },
    {
      registrationNumber: "TRK-006-NG",
      vehicleName: "Desert Fox",
      model: "DAF XF 530",
      type: "Heavy Truck",
      maxLoadCapacityKg: "17000",
      currentOdometerKm: "315000",
      acquisitionCost: "95000",
      region: "South",
      status: "retired" as const,
    },
  ];

  const vehicleIds: number[] = [];
  for (const v of vehiclesData) {
    const [existing] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.registrationNumber, v.registrationNumber));
    if (existing) {
      vehicleIds.push(existing.id);
    } else {
      const [created] = await db.insert(vehiclesTable).values(v).returning();
      vehicleIds.push(created.id);
    }
  }
  logger.info({ count: vehicleIds.length }, "Vehicles seeded");

  // ── Drivers ────────────────────────────────────────────────────────────────
  const driversData = [
    {
      fullName: "James Okafor",
      licenseNumber: "DL-A-10234-NG",
      licenseCategory: "HMV",
      licenseExpiryDate: "2026-11-15",
      contactNumber: "+234-803-100-0001",
      safetyScore: "94.5",
      region: "North",
      status: "on_trip" as const,
    },
    {
      fullName: "Fatima Usman",
      licenseNumber: "DL-A-20891-NG",
      licenseCategory: "HMV",
      licenseExpiryDate: "2025-03-20",  // EXPIRED — triggers warning
      contactNumber: "+234-806-100-0002",
      safetyScore: "88.0",
      region: "South",
      status: "off_duty" as const,
    },
    {
      fullName: "Emmanuel Eze",
      licenseNumber: "DL-B-30442-NG",
      licenseCategory: "LMV",
      licenseExpiryDate: "2027-06-30",
      contactNumber: "+234-812-100-0003",
      safetyScore: "97.2",
      region: "East",
      status: "available" as const,
    },
    {
      fullName: "Grace Adeleke",
      licenseNumber: "DL-A-41100-NG",
      licenseCategory: "HMV",
      licenseExpiryDate: "2026-09-01",
      contactNumber: "+234-815-100-0004",
      safetyScore: "91.8",
      region: "West",
      status: "available" as const,
    },
    {
      fullName: "Seun Adeyemi",
      licenseNumber: "DL-C-55002-NG",
      licenseCategory: "LMV",
      licenseExpiryDate: "2026-12-15",
      contactNumber: "+234-817-100-0005",
      safetyScore: "72.0",
      region: "North",
      status: "suspended" as const,
    },
  ];

  const driverIds: number[] = [];
  for (const d of driversData) {
    const [existing] = await db.select().from(driversTable).where(eq(driversTable.licenseNumber, d.licenseNumber));
    if (existing) {
      driverIds.push(existing.id);
    } else {
      const [created] = await db.insert(driversTable).values(d).returning();
      driverIds.push(created.id);
    }
  }
  logger.info({ count: driverIds.length }, "Drivers seeded");

  // ── Trips ──────────────────────────────────────────────────────────────────
  const tripsData = [
    {
      sourceLocation: "Lagos Port",
      destinationLocation: "Kano Distribution Center",
      vehicleId: vehicleIds[1], // Atlas Prime (on_trip)
      driverId: driverIds[0],  // James Okafor (on_trip)
      cargoWeightKg: "12500",
      plannedDistanceKm: "1050",
      actualDistanceKm: null,
      status: "dispatched" as const,
      dispatchedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      revenue: "4200",
      notes: "Fragile electronics cargo",
    },
    {
      sourceLocation: "Abuja Depot",
      destinationLocation: "Port Harcourt Terminal",
      vehicleId: vehicleIds[0], // Iron Horse
      driverId: driverIds[2],  // Emmanuel
      cargoWeightKg: "8000",
      plannedDistanceKm: "640",
      actualDistanceKm: null,
      status: "draft" as const,
      revenue: "2800",
    },
    {
      sourceLocation: "Ibadan Factory",
      destinationLocation: "Lagos Market",
      vehicleId: vehicleIds[2], // Swift Courier
      driverId: driverIds[3],  // Grace
      cargoWeightKg: "900",
      plannedDistanceKm: "120",
      actualDistanceKm: "118",
      status: "completed" as const,
      dispatchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
      finalOdometerKm: "55518",
      revenue: "450",
    },
    {
      sourceLocation: "Enugu Warehouse",
      destinationLocation: "Onitsha Hub",
      vehicleId: vehicleIds[0],
      driverId: driverIds[3],
      cargoWeightKg: "3000",
      plannedDistanceKm: "90",
      actualDistanceKm: null,
      status: "cancelled" as const,
      cancelledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      notes: "Customer order cancelled",
    },
    {
      sourceLocation: "Kaduna Factory",
      destinationLocation: "Abuja Central",
      vehicleId: vehicleIds[4], // Road Runner
      driverId: driverIds[2],  // Emmanuel
      cargoWeightKg: "700",
      plannedDistanceKm: "190",
      actualDistanceKm: "188",
      status: "completed" as const,
      dispatchedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 5.5 * 24 * 60 * 60 * 1000),
      finalOdometerKm: "79088",
      revenue: "680",
    },
  ];

  const tripIds: number[] = [];
  for (const t of tripsData) {
    // Simple idempotency check: look for existing trip with same source+dest
    const [existing] = await db.select().from(tripsTable)
      .where(eq(tripsTable.sourceLocation, t.sourceLocation));
    if (existing) {
      tripIds.push(existing.id);
      continue;
    }
    const insertData: Record<string, unknown> = {
      sourceLocation: t.sourceLocation,
      destinationLocation: t.destinationLocation,
      vehicleId: t.vehicleId,
      driverId: t.driverId,
      cargoWeightKg: t.cargoWeightKg,
      plannedDistanceKm: t.plannedDistanceKm,
      status: t.status,
      createdByUserId: userIds[0],
    };
    if (t.actualDistanceKm) insertData.actualDistanceKm = t.actualDistanceKm;
    if (t.dispatchedAt) insertData.dispatchedAt = t.dispatchedAt;
    if (t.completedAt) insertData.completedAt = t.completedAt;
    if (t.cancelledAt) insertData.cancelledAt = t.cancelledAt;
    if (t.finalOdometerKm) insertData.finalOdometerKm = t.finalOdometerKm;
    if (t.revenue) insertData.revenue = t.revenue;
    if (t.notes) insertData.notes = t.notes;
    const [created] = await db.insert(tripsTable).values(insertData as Parameters<typeof db.insert>[0]['$inferInsert'] extends never ? never : typeof insertData as any).returning();
    tripIds.push(created.id);
  }
  logger.info({ count: tripIds.length }, "Trips seeded");

  // ── Maintenance Logs ───────────────────────────────────────────────────────
  const maintenanceData = [
    {
      vehicleId: vehicleIds[3], // Titan Hauler (in_shop)
      title: "Engine Overhaul",
      maintenanceType: "Engine Repair",
      description: "Full engine overhaul after 210k km service milestone",
      startDate: "2026-07-08",
      expectedEndDate: "2026-07-20",
      cost: "8500",
      vendor: "AutoTech Engineering",
      status: "open" as const,
    },
    {
      vehicleId: vehicleIds[0], // Iron Horse
      title: "Scheduled Oil Change",
      maintenanceType: "Oil Change",
      description: "15,000 km scheduled oil and filter change",
      startDate: "2026-06-15",
      endDate: "2026-06-15",
      cost: "320",
      vendor: "Quick Lube Lagos",
      status: "closed" as const,
    },
    {
      vehicleId: vehicleIds[1], // Atlas Prime
      title: "Tire Replacement - Front Axle",
      maintenanceType: "Tire Replacement",
      description: "Replaced worn front axle tires",
      startDate: "2026-05-20",
      endDate: "2026-05-21",
      cost: "1200",
      vendor: "TireZone Abuja",
      status: "closed" as const,
    },
    {
      vehicleId: vehicleIds[2], // Swift Courier
      title: "Brake System Service",
      maintenanceType: "Brake Repair",
      description: "Brake pads and rotor replacement",
      startDate: "2026-07-01",
      endDate: "2026-07-02",
      cost: "650",
      vendor: "Auto First Ibadan",
      status: "closed" as const,
    },
  ];

  for (const m of maintenanceData) {
    // Idempotency: check for existing maintenance with same vehicle+title
    const [existing] = await db.select().from(maintenanceLogsTable)
      .where(eq(maintenanceLogsTable.title, m.title));
    if (!existing) {
      await db.insert(maintenanceLogsTable).values({
        ...m,
        endDate: m.endDate ?? null,
        notes: null,
        description: m.description ?? null,
        vendor: m.vendor ?? null,
        createdByUserId: userIds[0],
      });
    }
  }
  logger.info("Maintenance logs seeded");

  // ── Fuel Logs ──────────────────────────────────────────────────────────────
  const fuelLogsData = [
    { vehicleId: vehicleIds[0], date: "2026-07-01", liters: "85", cost: "127.50", odometerReadingKm: "142200", fuelStation: "Total Energies Lagos" },
    { vehicleId: vehicleIds[1], date: "2026-07-05", liters: "110", cost: "165.00", odometerReadingKm: "97800", fuelStation: "Ardova Abuja" },
    { vehicleId: vehicleIds[2], date: "2026-07-08", liters: "40", cost: "60.00", odometerReadingKm: "55200", fuelStation: "MRS Ibadan" },
    { vehicleId: vehicleIds[4], date: "2026-07-10", liters: "35", cost: "52.50", odometerReadingKm: "78700", fuelStation: "Conoil Kaduna" },
    { vehicleId: vehicleIds[0], date: "2026-06-20", liters: "90", cost: "135.00", odometerReadingKm: "141800", fuelStation: "Total Energies Lagos" },
    { vehicleId: vehicleIds[1], date: "2026-06-25", liters: "105", cost: "157.50", odometerReadingKm: "97200", fuelStation: "Ardova Port Harcourt" },
    { vehicleId: vehicleIds[0], date: "2026-05-15", liters: "80", cost: "120.00", odometerReadingKm: "141200", fuelStation: "Total Energies Lagos" },
    { vehicleId: vehicleIds[2], date: "2026-05-22", liters: "38", cost: "57.00", odometerReadingKm: "55000", fuelStation: "MRS Ibadan" },
  ];

  for (const f of fuelLogsData) {
    await db.insert(fuelLogsTable).values({ ...f, notes: null, tripId: null, createdByUserId: userIds[1] });
  }
  logger.info("Fuel logs seeded");

  // ── Expenses ───────────────────────────────────────────────────────────────
  const expensesData = [
    { vehicleId: vehicleIds[0], expenseType: "toll" as const, amount: "45.00", date: "2026-07-02", description: "Lagos-Ibadan Expressway toll" },
    { vehicleId: vehicleIds[1], expenseType: "toll" as const, amount: "120.00", date: "2026-07-06", description: "Abuja-Kaduna highway tolls" },
    { vehicleId: vehicleIds[3], expenseType: "maintenance" as const, amount: "8500.00", date: "2026-07-08", description: "Engine overhaul at AutoTech" },
    { vehicleId: vehicleIds[0], expenseType: "other" as const, amount: "200.00", date: "2026-06-30", description: "Driver allowance - Lagos run" },
    { vehicleId: vehicleIds[2], expenseType: "toll" as const, amount: "30.00", date: "2026-07-08", description: "Toll gate Ibadan bypass" },
    { vehicleId: vehicleIds[4], expenseType: "other" as const, amount: "150.00", date: "2026-07-10", description: "Cargo loading assistance" },
  ];

  for (const e of expensesData) {
    await db.insert(expensesTable).values({ ...e, tripId: null, createdByUserId: userIds[3] });
  }
  logger.info("Expenses seeded");

  logger.info("Seed complete.");
}

main().catch((err) => {
  logger.error(err, "Seed failed");
  process.exit(1);
});
