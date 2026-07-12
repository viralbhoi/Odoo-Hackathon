import { Router } from "express";

import tripController from "./trip.controller";

import { authenticate } from "../../common/middleware/auth.middleware";
import { authorize } from "../../common/middleware/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/", tripController.getAll);

router.post("/", authorize("ADMIN", "FLEET_MANAGER"), tripController.create);

router.patch(
    "/:id/dispatch",
    authorize("FLEET_MANAGER"),
    tripController.dispatch,
);

router.patch(
    "/:id/complete",
    authorize("FLEET_MANAGER"),
    tripController.complete,
);

export default router;
