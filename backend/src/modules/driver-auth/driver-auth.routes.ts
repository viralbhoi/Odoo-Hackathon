import { Router } from "express";
import driverAuthController, { authenticateDriver } from "./driver-auth.controller";

const router = Router();

// Public: Driver logs in with license number
router.post("/login", driverAuthController.login);

// Protected: Driver views their own trips
router.get("/trips", authenticateDriver, driverAuthController.getMyTrips);

// Protected: Driver marks a trip as complete
router.patch("/trips/:id/complete", authenticateDriver, driverAuthController.completeTrip);

export default router;
