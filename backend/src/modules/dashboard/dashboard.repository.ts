import { prisma } from "../../common/config/prisma";

class DashboardRepository {
    totalVehicles() {
        return prisma.vehicle.count();
    }

    availableVehicles() {
        return prisma.vehicle.count({ where: { status: "AVAILABLE" } });
    }

    onTripVehicles() {
        return prisma.vehicle.count({ where: { status: "ON_TRIP" } });
    }

    activeTrips() {
        return prisma.trip.count({ where: { status: "DISPATCHED" } });
    }

    pendingTrips() {
        return prisma.trip.count({ where: { status: "DRAFT" } });
    }

    completedTrips() {
        return prisma.trip.count({ where: { status: "COMPLETED" } });
    }

    totalDrivers() {
        return prisma.driver.count();
    }

    availableDrivers() {
        return prisma.driver.count({ where: { status: "AVAILABLE" } });
    }

    driversOnDuty() {
        return prisma.driver.count({ where: { status: "ON_TRIP" } });
    }

    suspendedDrivers() {
        return prisma.driver.count({ where: { status: "SUSPENDED" } });
    }

    vehiclesInMaintenance() {
        return prisma.vehicle.count({ where: { status: "IN_SHOP" } });
    }

    totalFuelCost() {
        return prisma.fuelLog.aggregate({ _sum: { cost: true } });
    }

    totalExpense() {
        return prisma.expense.aggregate({ _sum: { amount: true } });
    }

    expiredLicenses() {
        return prisma.driver.count({
            where: { licenseExpiry: { lt: new Date() } },
        });
    }

    pendingMaintenance() {
        return prisma.maintenance.count({ where: { status: "PENDING" } });
    }
}

export default new DashboardRepository();
