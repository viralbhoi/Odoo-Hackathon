import { Router } from "express";

import expenseController from "./expense.controller";

import { authenticate } from "../../common/middleware/auth.middleware";
import { authorize } from "../../common/middleware/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/", expenseController.getAll);

router.post(
    "/",
    authorize("ADMIN", "FLEET_MANAGER", "FINANCIAL_ANALYST"),
    expenseController.create,
);

export default router;
