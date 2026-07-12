import dashboardRepository from "./dashboard.repository";

class DashboardService {
    async getDashboard(role: string) {
        switch (role) {
            case "ADMIN":
                return this.getAdminDashboard();
            case "FLEET_MANAGER":
                return this.getFleetDashboard();
            case "FINANCIAL_ANALYST":
                return this.getFinanceDashboard();
            case "SAFETY_OFFICER":
                return this.getSafetyDashboard();
            default:
                return this.getFleetDashboard();
        }
    }

    private async getAdminDashboard() {
        const [
            totalVehicles,
            availableVehicles,
            onTripVehicles,
            vehiclesInMaintenance,
            totalDrivers,
            availableDrivers,
            driversOnDuty,
            suspendedDrivers,
            activeTrips,
            pendingTrips,
            completedTrips,
            fuel,
            expenses,
            expiredLicenses,
            pendingMaintenance,
        ] = await Promise.all([
            dashboardRepository.totalVehicles(),
            dashboardRepository.availableVehicles(),
            dashboardRepository.onTripVehicles(),
            dashboardRepository.vehiclesInMaintenance(),
            dashboardRepository.totalDrivers(),
            dashboardRepository.availableDrivers(),
            dashboardRepository.driversOnDuty(),
            dashboardRepository.suspendedDrivers(),
            dashboardRepository.activeTrips(),
            dashboardRepository.pendingTrips(),
            dashboardRepository.completedTrips(),
            dashboardRepository.totalFuelCost(),
            dashboardRepository.totalExpense(),
            dashboardRepository.expiredLicenses(),
            dashboardRepository.pendingMaintenance(),
        ]);

        const fleetUtilizationPct =
            totalVehicles > 0
                ? parseFloat(((onTripVehicles / totalVehicles) * 100).toFixed(1))
                : 0;

        return {
            role: "ADMIN",
            // Flat KPI fields for easy frontend consumption
            totalVehicles,
            availableVehicles,
            activeVehicles: totalVehicles,
            onTripVehicles,
            vehiclesInMaintenance,
            totalDrivers,
            availableDrivers,
            driversOnDuty,
            suspendedDrivers,
            activeTrips,
            pendingTrips,
            completedTrips,
            fleetUtilizationPct,
            finance: {
                totalFuelCost: fuel._sum.cost ?? 0,
                totalExpense: expenses._sum.amount ?? 0,
            },
            alerts: { expiredLicenses, pendingMaintenance },
        };
    }

    private async getFleetDashboard() {
        const [
            totalVehicles,
            availableVehicles,
            onTripVehicles,
            vehiclesInMaintenance,
            totalDrivers,
            availableDrivers,
            driversOnDuty,
            activeTrips,
            pendingTrips,
        ] = await Promise.all([
            dashboardRepository.totalVehicles(),
            dashboardRepository.availableVehicles(),
            dashboardRepository.onTripVehicles(),
            dashboardRepository.vehiclesInMaintenance(),
            dashboardRepository.totalDrivers(),
            dashboardRepository.availableDrivers(),
            dashboardRepository.driversOnDuty(),
            dashboardRepository.activeTrips(),
            dashboardRepository.pendingTrips(),
        ]);

        const fleetUtilizationPct =
            totalVehicles > 0
                ? parseFloat(((onTripVehicles / totalVehicles) * 100).toFixed(1))
                : 0;

        return {
            role: "FLEET_MANAGER",
            totalVehicles,
            availableVehicles,
            activeVehicles: totalVehicles,
            onTripVehicles,
            vehiclesInMaintenance,
            totalDrivers,
            availableDrivers,
            driversOnDuty,
            activeTrips,
            pendingTrips,
            fleetUtilizationPct,
        };
    }

    private async getFinanceDashboard() {
        const [fuel, expenses, totalVehicles, availableVehicles, activeTrips] =
            await Promise.all([
                dashboardRepository.totalFuelCost(),
                dashboardRepository.totalExpense(),
                dashboardRepository.totalVehicles(),
                dashboardRepository.availableVehicles(),
                dashboardRepository.activeTrips(),
            ]);

        return {
            role: "FINANCIAL_ANALYST",
            totalVehicles,
            availableVehicles,
            activeVehicles: totalVehicles,
            activeTrips,
            pendingTrips: 0,
            driversOnDuty: 0,
            vehiclesInMaintenance: 0,
            fleetUtilizationPct: 0,
            finance: {
                totalFuelCost: fuel._sum.cost ?? 0,
                totalExpense: expenses._sum.amount ?? 0,
                totalOperationalCost:
                    (fuel._sum.cost ?? 0) + (expenses._sum.amount ?? 0),
            },
        };
    }

    private async getSafetyDashboard() {
        const [expiredLicenses, suspendedDrivers, pendingMaintenance, totalVehicles, availableVehicles, activeTrips] =
            await Promise.all([
                dashboardRepository.expiredLicenses(),
                dashboardRepository.suspendedDrivers(),
                dashboardRepository.pendingMaintenance(),
                dashboardRepository.totalVehicles(),
                dashboardRepository.availableVehicles(),
                dashboardRepository.activeTrips(),
            ]);

        return {
            role: "SAFETY_OFFICER",
            totalVehicles,
            availableVehicles,
            activeVehicles: totalVehicles,
            activeTrips,
            pendingTrips: 0,
            driversOnDuty: 0,
            vehiclesInMaintenance: 0,
            fleetUtilizationPct: 0,
            compliance: { expiredLicenses, suspendedDrivers, pendingMaintenance },
        };
    }
}

export default new DashboardService();
