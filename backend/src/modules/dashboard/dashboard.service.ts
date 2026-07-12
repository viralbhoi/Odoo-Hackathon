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
                return {};
        }
    }

    private async getAdminDashboard() {
        const [
            totalVehicles,
            availableVehicles,

            totalDrivers,
            availableDrivers,
            suspendedDrivers,

            activeTrips,
            completedTrips,

            vehiclesInMaintenance,

            fuel,

            expenses,

            expiredLicenses,

            pendingMaintenance,
        ] = await Promise.all([
            dashboardRepository.totalVehicles(),
            dashboardRepository.availableVehicles(),
            dashboardRepository.totalDrivers(),
            dashboardRepository.availableDrivers(),
            dashboardRepository.suspendedDrivers(),
            dashboardRepository.activeTrips(),
            dashboardRepository.completedTrips(),
            dashboardRepository.vehiclesInMaintenance(),
            dashboardRepository.totalFuelCost(),
            dashboardRepository.totalExpense(),
            dashboardRepository.expiredLicenses(),
            dashboardRepository.pendingMaintenance(),
        ]);

        return {
            role: "ADMIN",

            overview: {
                totalVehicles,
                availableVehicles,
                totalDrivers,
                availableDrivers,
                suspendedDrivers,
                activeTrips,
                completedTrips,
                vehiclesInMaintenance,
            },

            finance: {
                totalFuelCost: fuel._sum.cost ?? 0,
                totalExpense: expenses._sum.amount ?? 0,
            },

            alerts: {
                expiredLicenses,
                pendingMaintenance,
            },
        };
    }

    private async getFleetDashboard() {
        const [
            totalVehicles,
            availableVehicles,
            totalDrivers,
            availableDrivers,
            activeTrips,
            vehiclesInMaintenance,
        ] = await Promise.all([
            dashboardRepository.totalVehicles(),
            dashboardRepository.availableVehicles(),
            dashboardRepository.totalDrivers(),
            dashboardRepository.availableDrivers(),
            dashboardRepository.activeTrips(),
            dashboardRepository.vehiclesInMaintenance(),
        ]);

        return {
            role: "FLEET_MANAGER",

            operations: {
                totalVehicles,
                availableVehicles,
                totalDrivers,
                availableDrivers,
                activeTrips,
                vehiclesInMaintenance,
            },
        };
    }

    private async getFinanceDashboard() {
        const [fuel, expenses] = await Promise.all([
            dashboardRepository.totalFuelCost(),
            dashboardRepository.totalExpense(),
        ]);

        return {
            role: "FINANCIAL_ANALYST",

            finance: {
                totalFuelCost: fuel._sum.cost ?? 0,
                totalExpense: expenses._sum.amount ?? 0,
            },
        };
    }

    private async getSafetyDashboard() {
        const [expiredLicenses, suspendedDrivers, pendingMaintenance] =
            await Promise.all([
                dashboardRepository.expiredLicenses(),
                dashboardRepository.suspendedDrivers(),
                dashboardRepository.pendingMaintenance(),
            ]);

        return {
            role: "SAFETY_OFFICER",

            compliance: {
                expiredLicenses,
                suspendedDrivers,
                pendingMaintenance,
            },
        };
    }
}

export default new DashboardService();
