import { Router } from "express";

import fuelController from "./fuel.controller";

import { authenticate } from "../../common/middleware/auth.middleware";
import { authorize } from "../../common/middleware/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/", fuelController.getAll);

router.post("/", authorize("ADMIN", "FLEET_MANAGER"), fuelController.create);

export default router;
