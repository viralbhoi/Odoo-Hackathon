import { Router } from "express";
import authController from "./auth.controller";
import { authenticate } from "../../common/middleware/auth.middleware";

const router = Router();

router.post("/login", authController.login);

router.get("/me", authenticate, authController.me);

export default router;
