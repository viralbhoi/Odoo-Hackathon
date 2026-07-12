import { Router } from "express";
import { authenticate } from "../../common/middleware/auth.middleware";
import reportsController from "./reports.controller";

const router = Router();

router.use(authenticate);

router.get("/fuel-efficiency", reportsController.getFuelEfficiency);
router.get("/operational-cost", reportsController.getOperationalCost);
router.get("/vehicle-roi", reportsController.getVehicleRoi);
router.get("/monthly-trend", reportsController.getMonthlyTrend);
router.get("/export/csv", reportsController.exportCsv);

export default router;
