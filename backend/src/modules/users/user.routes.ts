import { Router } from "express";
import { authenticate } from "../../common/middleware/auth.middleware";
import { authorize } from "../../common/middleware/role.middleware";
import userController from "./user.controller";

const router = Router();

// All routes require ADMIN role
router.get("/", authenticate, authorize("ADMIN"), userController.list);
router.post("/", authenticate, authorize("ADMIN"), userController.create);
router.patch("/:id/toggle-status", authenticate, authorize("ADMIN"), userController.toggleStatus);

export default router;
