import { prisma } from "../../common/config/prisma";

class ReportsService {
    /** Fuel efficiency: KM/Liter per vehicle */
    async getFuelEfficiency() {
        const vehicles = await prisma.vehicle.findMany({
            include: { fuelLogs: true, trips: true },
        });

        return vehicles
            .filter((v) => v.fuelLogs.length > 0)
            .map((v) => {
                const totalLiters = v.fuelLogs.reduce((s, f) => s + f.liters, 0);
                const totalCost = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
                const totalDistance = v.trips
                    .filter((t) => t.status === "COMPLETED")
                    .reduce((s, t) => s + (t.actualDistance ?? t.plannedDistance), 0);
                return {
                    vehicleId: v.id,
                    registrationNumber: v.registrationNumber,
                    vehicleName: v.model,
                    totalLiters: parseFloat(totalLiters.toFixed(2)),
                    totalFuelCost: parseFloat(totalCost.toFixed(2)),
                    totalDistanceKm: parseFloat(totalDistance.toFixed(2)),
                    efficiencyKmPerLiter:
                        totalLiters > 0
                            ? parseFloat((totalDistance / totalLiters).toFixed(2))
                            : 0,
                };
            })
            .sort((a, b) => b.efficiencyKmPerLiter - a.efficiencyKmPerLiter);
    }

    /** Operational cost: Fuel + Maintenance per vehicle */
    async getOperationalCost() {
        const vehicles = await prisma.vehicle.findMany({
            include: {
                fuelLogs: true,
                maintenanceRecords: true,
                expenses: true,
            },
        });

        return vehicles.map((v) => {
            const fuelCost = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
            const maintCost = v.maintenanceRecords.reduce(
                (s, m) => s + (m.actualCost ?? m.estimatedCost ?? 0),
                0
            );
            const expenseCost = v.expenses.reduce((s, e) => s + e.amount, 0);
            return {
                vehicleId: v.id,
                registrationNumber: v.registrationNumber,
                vehicleName: v.model,
                acquisitionCost: v.acquisitionCost,
                fuelCost: parseFloat(fuelCost.toFixed(2)),
                maintenanceCost: parseFloat(maintCost.toFixed(2)),
                expenseCost: parseFloat(expenseCost.toFixed(2)),
                totalCost: parseFloat((fuelCost + maintCost + expenseCost).toFixed(2)),
            };
        });
    }

    /** Vehicle ROI: (Revenue - Cost) / AcquisitionCost */
    async getVehicleRoi() {
        const costs = await this.getOperationalCost();

        return costs.map((c) => {
            const roi =
                c.acquisitionCost > 0
                    ? parseFloat(
                          (((0 - c.totalCost) / c.acquisitionCost) * 100).toFixed(2)
                      )
                    : null;
            return {
                ...c,
                totalRevenue: 0, // Revenue tracking not in current schema
                roi,
                roiAvailable: false,
            };
        });
    }

    /** Monthly trend: Fuel + Expense cost per month (last 12 months) */
    async getMonthlyTrend() {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const [fuels, expenses] = await Promise.all([
            prisma.fuelLog.findMany({
                where: { createdAt: { gte: twelveMonthsAgo } },
                orderBy: { createdAt: "asc" },
            }),
            prisma.expense.findMany({
                where: { createdAt: { gte: twelveMonthsAgo } },
                orderBy: { createdAt: "asc" },
            }),
        ]);

        const monthMap: Record<string, { month: string; fuelCost: number; expenseCost: number; totalCost: number }> = {};

        fuels.forEach((f) => {
            const key = f.createdAt.toISOString().slice(0, 7); // "2025-07"
            if (!monthMap[key]) monthMap[key] = { month: key, fuelCost: 0, expenseCost: 0, totalCost: 0 };
            monthMap[key].fuelCost += f.cost;
            monthMap[key].totalCost += f.cost;
        });

        expenses.forEach((e) => {
            const key = e.createdAt.toISOString().slice(0, 7);
            if (!monthMap[key]) monthMap[key] = { month: key, fuelCost: 0, expenseCost: 0, totalCost: 0 };
            monthMap[key].expenseCost += e.amount;
            monthMap[key].totalCost += e.amount;
        });

        return Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
    }

    /** CSV export */
    async exportCsv(type: string): Promise<{ filename: string; content: string }> {
        switch (type) {
            case "trips": {
                const trips = await prisma.trip.findMany({
                    include: { vehicle: true, driver: true },
                    orderBy: { createdAt: "desc" },
                });
                const rows = [
                    ["ID", "Source", "Destination", "Status", "Vehicle", "Driver", "Cargo (kg)", "Planned KM", "Actual KM", "Created At"],
                    ...trips.map((t) => [
                        t.id, t.source, t.destination, t.status,
                        t.vehicle.registrationNumber, t.driver.fullName,
                        t.cargoWeight, t.plannedDistance, t.actualDistance ?? "",
                        t.createdAt.toISOString(),
                    ]),
                ];
                return { filename: "trips.csv", content: rows.map((r) => r.join(",")).join("\n") };
            }
            case "fuel-logs":
            case "fuel": {
                const logs = await prisma.fuelLog.findMany({
                    include: { vehicle: true },
                    orderBy: { createdAt: "desc" },
                });
                const rows = [
                    ["ID", "Vehicle", "Liters", "Cost", "Odometer", "Date"],
                    ...logs.map((l) => [
                        l.id, l.vehicle.registrationNumber,
                        l.liters, l.cost, l.odometer, l.createdAt.toISOString(),
                    ]),
                ];
                return { filename: "fuel_logs.csv", content: rows.map((r) => r.join(",")).join("\n") };
            }
            case "expenses": {
                const exps = await prisma.expense.findMany({
                    include: { vehicle: true },
                    orderBy: { createdAt: "desc" },
                });
                const rows = [
                    ["ID", "Title", "Type", "Amount", "Vehicle", "Date"],
                    ...exps.map((e) => [
                        e.id, e.title, e.type, e.amount,
                        e.vehicle?.registrationNumber ?? "General",
                        e.createdAt.toISOString(),
                    ]),
                ];
                return { filename: "expenses.csv", content: rows.map((r) => r.join(",")).join("\n") };
            }
            default:
                throw new Error("Unknown export type");
        }
    }
}

export default new ReportsService();
