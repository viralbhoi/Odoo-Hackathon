import { Router, type IRouter } from "express";
import healthRouter from "./health";
import docsRouter from "./docs";
import authRouter from "./auth";
import vehiclesRouter from "./vehicles";
import driversRouter from "./drivers";
import tripsRouter from "./trips";
import maintenanceRouter from "./maintenance";
import fuelExpensesRouter from "./fuel-expenses";
import dashboardRouter from "./dashboard";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(docsRouter);   // public — no auth required
router.use(authRouter);
router.use(vehiclesRouter);
router.use(driversRouter);
router.use(tripsRouter);
router.use(maintenanceRouter);
router.use(fuelExpensesRouter);
router.use(dashboardRouter);
router.use(reportsRouter);

export default router;
