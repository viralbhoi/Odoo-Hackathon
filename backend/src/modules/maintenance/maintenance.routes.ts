import { Router } from "express";

import maintenanceController from "./maintenance.controller";

import { authenticate } from "../../common/middleware/auth.middleware";
import { authorize } from "../../common/middleware/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/", maintenanceController.getAll);

router.post(
    "/",
    authorize("ADMIN", "FLEET_MANAGER"),
    maintenanceController.create,
);

router.patch(
    "/:id/complete",
    authorize("FLEET_MANAGER"),
    maintenanceController.complete,
);

export default router;
