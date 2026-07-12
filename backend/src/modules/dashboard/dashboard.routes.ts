import { Router } from "express";

import dashboardController from "./dashboard.controller";

import { authenticate } from "../../common/middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", dashboardController.getDashboard);

export default router;
