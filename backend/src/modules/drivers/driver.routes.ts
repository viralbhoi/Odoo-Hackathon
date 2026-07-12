import { Router } from "express";
import driverController from "./driver.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { authorize } from "../../common/middleware/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/", driverController.getAll);
router.get("/available", driverController.getAvailable);

router.get("/:id", driverController.getById);

router.post("/", authorize("ADMIN", "FLEET_MANAGER"), driverController.create);

router.patch(
    "/:id",
    authorize("ADMIN", "FLEET_MANAGER"),
    driverController.update,
);

router.patch(
    "/:id/license",
    authorize("SAFETY_OFFICER"),
    driverController.renewLicense,
);

router.patch(
    "/:id/suspend",
    authorize("SAFETY_OFFICER"),
    driverController.suspend,
);

router.patch(
    "/:id/reinstate",
    authorize("SAFETY_OFFICER"),
    driverController.reinstate,
);

router.delete("/:id", authorize("ADMIN"), driverController.delete);

export default router;
