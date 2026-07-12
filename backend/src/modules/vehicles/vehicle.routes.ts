import { Router } from "express";
import vehicleController from "./vehicle.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { authorize } from "../../common/middleware/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/", vehicleController.getAll);
router.get("/available", vehicleController.getAvailable);

router.get("/:id", vehicleController.getById);

router.post("/", authorize("ADMIN", "FLEET_MANAGER"), vehicleController.create);

router.patch("/:id/status", authorize("ADMIN", "FLEET_MANAGER"), vehicleController.updateStatus);

router.delete("/:id", authorize("ADMIN"), vehicleController.delete);

export default router;
