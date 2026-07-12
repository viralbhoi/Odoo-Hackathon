import {
    PrismaClient,
    UserRole,
    UserStatus,
    VehicleStatus,
    VehicleType,
    DriverStatus,
    LicenseCategory,
    TripStatus,
    MaintenanceStatus,
    ExpenseType,
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // ── Users ──────────────────────────────────────────────────────────────────
    const password = await bcrypt.hash("Admin@123", 10);

    const admin = await prisma.user.upsert({
        where: { email: "admin@transitops.com" },
        update: {},
        create: { name: "System Admin", email: "admin@transitops.com", role: UserRole.ADMIN, password, status: UserStatus.ACTIVE },
    });
    await prisma.user.upsert({
        where: { email: "fleet@transitops.com" },
        update: {},
        create: { name: "Raj Mehta", email: "fleet@transitops.com", role: UserRole.FLEET_MANAGER, password, status: UserStatus.ACTIVE },
    });
    await prisma.user.upsert({
        where: { email: "safety@transitops.com" },
        update: {},
        create: { name: "Priya Sharma", email: "safety@transitops.com", role: UserRole.SAFETY_OFFICER, password, status: UserStatus.ACTIVE },
    });
    await prisma.user.upsert({
        where: { email: "finance@transitops.com" },
        update: {},
        create: { name: "Amit Patel", email: "finance@transitops.com", role: UserRole.FINANCIAL_ANALYST, password, status: UserStatus.ACTIVE },
    });

    console.log("✅ Users seeded");

    // ── Vehicles ───────────────────────────────────────────────────────────────
    const v1 = await prisma.vehicle.upsert({
        where: { registrationNumber: "GJ01AB1234" },
        update: {},
        create: { registrationNumber: "GJ01AB1234", model: "Tata Prima 4028.S", type: VehicleType.TRUCK, maxLoadCapacity: 25000, currentOdometer: 84320, acquisitionCost: 3200000, status: VehicleStatus.AVAILABLE },
    });
    const v2 = await prisma.vehicle.upsert({
        where: { registrationNumber: "GJ01CD5678" },
        update: {},
        create: { registrationNumber: "GJ01CD5678", model: "Ashok Leyland 2518", type: VehicleType.TRUCK, maxLoadCapacity: 18000, currentOdometer: 112450, acquisitionCost: 2800000, status: VehicleStatus.ON_TRIP },
    });
    const v3 = await prisma.vehicle.upsert({
        where: { registrationNumber: "GJ02EF9012" },
        update: {},
        create: { registrationNumber: "GJ02EF9012", model: "Mahindra Furio 17", type: VehicleType.VAN, maxLoadCapacity: 8500, currentOdometer: 56780, acquisitionCost: 1500000, status: VehicleStatus.AVAILABLE },
    });
    const v4 = await prisma.vehicle.upsert({
        where: { registrationNumber: "GJ03GH3456" },
        update: {},
        create: { registrationNumber: "GJ03GH3456", model: "Eicher Pro 6031", type: VehicleType.TRAILER, maxLoadCapacity: 31000, currentOdometer: 203100, acquisitionCost: 4500000, status: VehicleStatus.IN_SHOP },
    });
    const v5 = await prisma.vehicle.upsert({
        where: { registrationNumber: "GJ04IJ7890" },
        update: {},
        create: { registrationNumber: "GJ04IJ7890", model: "Force Traveller 3700", type: VehicleType.VAN, maxLoadCapacity: 3500, currentOdometer: 31200, acquisitionCost: 850000, status: VehicleStatus.AVAILABLE },
    });
    const v6 = await prisma.vehicle.upsert({
        where: { registrationNumber: "GJ05KL2345" },
        update: {},
        create: { registrationNumber: "GJ05KL2345", model: "Tata LPT 1613", type: VehicleType.TRUCK, maxLoadCapacity: 16000, currentOdometer: 168900, acquisitionCost: 2100000, status: VehicleStatus.AVAILABLE },
    });
    const v7 = await prisma.vehicle.upsert({
        where: { registrationNumber: "GJ06MN6789" },
        update: {},
        create: { registrationNumber: "GJ06MN6789", model: "Bharat Benz 2823R", type: VehicleType.TRUCK, maxLoadCapacity: 28000, currentOdometer: 94500, acquisitionCost: 3800000, status: VehicleStatus.RETIRED },
    });

    console.log("✅ Vehicles seeded");

    // ── Drivers ────────────────────────────────────────────────────────────────
    const d1 = await prisma.driver.upsert({
        where: { licenseNumber: "GJ0120190012345" },
        update: {},
        create: { fullName: "Suresh Kumar", phone: "9876543210", email: "suresh@example.com", licenseNumber: "GJ0120190012345", licenseCategory: LicenseCategory.HMV, licenseExpiry: new Date("2027-06-30"), safetyScore: 94, status: DriverStatus.AVAILABLE },
    });
    const d2 = await prisma.driver.upsert({
        where: { licenseNumber: "GJ0220181234567" },
        update: {},
        create: { fullName: "Ravi Verma", phone: "9898989898", email: "ravi@example.com", licenseNumber: "GJ0220181234567", licenseCategory: LicenseCategory.HMV, licenseExpiry: new Date("2025-09-15"), safetyScore: 78, status: DriverStatus.ON_TRIP, emergencyContact: "9898989800" },
    });
    const d3 = await prisma.driver.upsert({
        where: { licenseNumber: "GJ0320217654321" },
        update: {},
        create: { fullName: "Mahesh Prajapati", phone: "9712345678", licenseNumber: "GJ0320217654321", licenseCategory: LicenseCategory.TRANSPORT, licenseExpiry: new Date("2028-03-20"), safetyScore: 88, status: DriverStatus.AVAILABLE },
    });
    const d4 = await prisma.driver.upsert({
        where: { licenseNumber: "GJ0420159988776" },
        update: {},
        create: { fullName: "Dinesh Solanki", phone: "9654321098", licenseNumber: "GJ0420159988776", licenseCategory: LicenseCategory.HMV, licenseExpiry: new Date("2024-11-01"), safetyScore: 62, status: DriverStatus.SUSPENDED, emergencyContact: "9654321000" },
    });
    const d5 = await prisma.driver.upsert({
        where: { licenseNumber: "GJ0520223344556" },
        update: {},
        create: { fullName: "Kamlesh Thakor", phone: "9543210987", email: "kamlesh@example.com", licenseNumber: "GJ0520223344556", licenseCategory: LicenseCategory.LMV, licenseExpiry: new Date("2029-07-10"), safetyScore: 97, status: DriverStatus.AVAILABLE },
    });
    const d6 = await prisma.driver.upsert({
        where: { licenseNumber: "GJ0620175566778" },
        update: {},
        create: { fullName: "Pravin Bhatt", phone: "9432109876", licenseNumber: "GJ0620175566778", licenseCategory: LicenseCategory.HMV, licenseExpiry: new Date("2026-12-25"), safetyScore: 85, status: DriverStatus.OFF_DUTY },
    });

    console.log("✅ Drivers seeded");

    // ── Trips ──────────────────────────────────────────────────────────────────
    const now = new Date();
    const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

    const t1 = await prisma.trip.create({
        data: {
            source: "Ahmedabad", destination: "Mumbai", cargoWeight: 12000, plannedDistance: 524,
            actualDistance: 531, status: TripStatus.COMPLETED,
            startedOdometer: 84000, endedOdometer: 84531,
            dispatchedAt: daysAgo(10), completedAt: daysAgo(9),
            vehicleId: v1.id, driverId: d1.id,
        },
    });
    const t2 = await prisma.trip.create({
        data: {
            source: "Surat", destination: "Delhi", cargoWeight: 16500, plannedDistance: 1150,
            status: TripStatus.DISPATCHED,
            startedOdometer: 112000, dispatchedAt: daysAgo(1),
            vehicleId: v2.id, driverId: d2.id,
        },
    });
    await prisma.trip.create({
        data: {
            source: "Rajkot", destination: "Pune", cargoWeight: 7200, plannedDistance: 700,
            actualDistance: 695, status: TripStatus.COMPLETED,
            startedOdometer: 56100, endedOdometer: 56795,
            dispatchedAt: daysAgo(20), completedAt: daysAgo(19),
            vehicleId: v3.id, driverId: d3.id,
        },
    });
    await prisma.trip.create({
        data: {
            source: "Vadodara", destination: "Hyderabad", cargoWeight: 9800, plannedDistance: 876,
            status: TripStatus.DRAFT,
            vehicleId: v5.id, driverId: d5.id,
        },
    });
    await prisma.trip.create({
        data: {
            source: "Ahmedabad", destination: "Jaipur", cargoWeight: 14000, plannedDistance: 660,
            actualDistance: 670, status: TripStatus.COMPLETED,
            startedOdometer: 168200, endedOdometer: 168870,
            dispatchedAt: daysAgo(5), completedAt: daysAgo(4),
            vehicleId: v6.id, driverId: d6.id,
        },
    });
    await prisma.trip.create({
        data: {
            source: "Gandhinagar", destination: "Nagpur", cargoWeight: 11000, plannedDistance: 800,
            status: TripStatus.CANCELLED,
            vehicleId: v1.id, driverId: d3.id,
        },
    });

    console.log("✅ Trips seeded");

    // ── Maintenance ────────────────────────────────────────────────────────────
    await prisma.maintenance.createMany({
        data: [
            { title: "Engine Overhaul", description: "Full engine inspection and repair", estimatedCost: 85000, actualCost: 92000, status: MaintenanceStatus.COMPLETED, vehicleId: v4.id },
            { title: "Tyre Replacement (All 6)", description: "Replace all tyres due to wear", estimatedCost: 45000, actualCost: 44500, status: MaintenanceStatus.IN_PROGRESS, vehicleId: v4.id },
            { title: "Annual Service", description: "Oil change, filter replacement, brake check", estimatedCost: 12000, status: MaintenanceStatus.PENDING, vehicleId: v2.id },
            { title: "AC Repair", description: "AC compressor replacement", estimatedCost: 18000, actualCost: 17500, status: MaintenanceStatus.COMPLETED, vehicleId: v3.id },
            { title: "Brake Pad Replacement", description: "Front and rear brake pad replacement", estimatedCost: 8000, status: MaintenanceStatus.PENDING, vehicleId: v6.id },
        ],
    });

    console.log("✅ Maintenance seeded");

    // ── Fuel Logs ──────────────────────────────────────────────────────────────
    await prisma.fuelLog.createMany({
        data: [
            { liters: 180, cost: 19800, odometer: 84100, vehicleId: v1.id },
            { liters: 220, cost: 24200, odometer: 112100, vehicleId: v2.id },
            { liters: 95, cost: 10450, odometer: 56400, vehicleId: v3.id },
            { liters: 150, cost: 16500, odometer: 168500, vehicleId: v6.id },
            { liters: 210, cost: 23100, odometer: 84250, vehicleId: v1.id },
            { liters: 65, cost: 7150, odometer: 31100, vehicleId: v5.id },
            { liters: 185, cost: 20350, odometer: 112300, vehicleId: v2.id },
        ],
    });

    console.log("✅ Fuel logs seeded");

    // ── Expenses ───────────────────────────────────────────────────────────────
    await prisma.expense.createMany({
        data: [
            { title: "Toll — Ahmedabad-Mumbai expressway", amount: 3200, type: ExpenseType.TOLL, vehicleId: v1.id },
            { title: "Toll — NH48 Delhi section", amount: 2800, type: ExpenseType.TOLL, vehicleId: v2.id },
            { title: "Engine Overhaul Cost", amount: 92000, type: ExpenseType.MAINTENANCE, vehicleId: v4.id },
            { title: "AC Compressor Replacement", amount: 17500, type: ExpenseType.MAINTENANCE, vehicleId: v3.id },
            { title: "Driver allowance — long haul", amount: 5000, type: ExpenseType.OTHER },
            { title: "Insurance renewal — GJ01AB1234", amount: 28000, type: ExpenseType.OTHER, vehicleId: v1.id },
            { title: "Fuel top-up — emergency", amount: 4500, type: ExpenseType.FUEL, vehicleId: v5.id },
            { title: "Parking fees — Mumbai warehouse", amount: 1200, type: ExpenseType.OTHER, vehicleId: v2.id },
        ],
    });

    console.log("✅ Expenses seeded");

    // ── Notifications ──────────────────────────────────────────────────────────
    await prisma.notification.createMany({
        data: [
            { title: "License Expiring Soon", message: "Driver Ravi Verma's license expires on Sep 15, 2025. Please renew.", type: "WARNING", userId: admin.id },
            { title: "License Expired", message: "Driver Dinesh Solanki's license expired on Nov 1, 2024. Suspended from duty.", type: "ERROR", userId: admin.id },
            { title: "Maintenance Due", message: "Vehicle GJ02EF9012 annual service is overdue by 2,000 km.", type: "WARNING", userId: admin.id },
            { title: "Trip Completed", message: "Trip Ahmedabad → Mumbai completed successfully. Distance: 531 km.", type: "SUCCESS", userId: admin.id },
        ],
    });

    console.log("✅ Notifications seeded");
    console.log("\n🎉 Database fully seeded!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  Users:        4");
    console.log("  Vehicles:     7");
    console.log("  Drivers:      6");
    console.log("  Trips:        6");
    console.log("  Maintenance:  5");
    console.log("  Fuel Logs:    7");
    console.log("  Expenses:     8");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });