import { Router } from "express";
import { prisma } from "../common/config/prisma";

import authRoutes from "../modules/auth/auth.routes";
import vehicleRoutes from "../modules/vehicles/vehicle.routes";
import driverRoutes from "../modules/drivers/driver.routes";
import tripRoutes from "../modules/trips/trip.routes";
import maintenanceRoutes from "../modules/maintenance/maintenance.routes";
import fuelRoutes from "../modules/fuel/fuel.routes";
import expenseRoutes from "../modules/expenses/expense.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import reportsRoutes from "../modules/reports/reports.routes";

const router = Router();

router.get("/", async (_, res) => {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
        success: true,
        message: "TransitOps API Running 🚛",
    });
});

router.use("/auth", authRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/drivers", driverRoutes);
router.use("/trips", tripRoutes);
router.use("/maintenance", maintenanceRoutes);
router.use("/fuel", fuelRoutes);
router.use("/expenses", expenseRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/reports", reportsRoutes);

export default router;
