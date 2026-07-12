import { Request, Response, NextFunction } from "express";
import driverAuthService from "./driver-auth.service";
import { env } from "../../common/config/env";
import jwt from "jsonwebtoken";

// Middleware to authenticate driver JWT
export function authenticateDriver(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No driver token provided." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as any;
    if (payload.role !== "DRIVER") {
      return res.status(403).json({ success: false, message: "Not a driver token." });
    }
    (req as any).driverId = payload.driverId;
    (req as any).driverName = payload.fullName;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired driver token." });
  }
}

class DriverAuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { licenseNumber } = req.body;
      if (!licenseNumber) {
        return res.status(400).json({ success: false, message: "License number is required." });
      }
      const result = await driverAuthService.login(licenseNumber);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getMyTrips(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = (req as any).driverId;
      const trips = await driverAuthService.getMyTrips(driverId);
      res.json({ success: true, data: trips });
    } catch (err) {
      next(err);
    }
  }

  async completeTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = (req as any).driverId;
      const { id } = req.params;
      const { actualDistance } = req.body;
      const trip = await driverAuthService.completeTrip(driverId, id, Number(actualDistance ?? 0));
      res.json({ success: true, data: trip, message: "Trip marked as completed. Great work!" });
    } catch (err) {
      next(err);
    }
  }
}

export default new DriverAuthController();
