import { prisma } from "../../common/config/prisma";
import { env } from "../../common/config/env";
import { AppError } from "../../common/errors/AppError";
import jwt from "jsonwebtoken";

class DriverAuthService {
  async login(licenseNumber: string) {
    const driver = await prisma.driver.findUnique({ where: { licenseNumber } });
    if (!driver) {
      throw new AppError(401, "Driver not found. Check your license number.");
    }
    if (driver.status === "SUSPENDED") {
      throw new AppError(403, "Your account is suspended. Contact your fleet manager.");
    }

    // Issue a driver-scoped JWT (role: DRIVER)
    const token = jwt.sign(
      { driverId: driver.id, role: "DRIVER", fullName: driver.fullName },
      env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    return {
      token,
      driver: {
        id: driver.id,
        fullName: driver.fullName,
        licenseNumber: driver.licenseNumber,
        licenseCategory: driver.licenseCategory,
        safetyScore: driver.safetyScore,
        status: driver.status,
      },
    };
  }

  async getMyTrips(driverId: string) {
    const trips = await prisma.trip.findMany({
      where: { driverId },
      include: {
        vehicle: { select: { registrationNumber: true, model: true, type: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return trips;
  }

  async completeTrip(driverId: string, tripId: string, actualDistance: number) {
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, driverId },
    });

    if (!trip) throw new AppError(404, "Trip not found or does not belong to you.");
    if (trip.status !== "DISPATCHED") {
      throw new AppError(400, `Trip cannot be completed from status: ${trip.status}`);
    }

    // Complete the trip and free up driver + vehicle
    const [updatedTrip] = await prisma.$transaction([
      prisma.trip.update({
        where: { id: tripId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          actualDistance,
        },
      }),
      prisma.driver.update({
        where: { id: driverId },
        data: { status: "AVAILABLE" },
      }),
      prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: "AVAILABLE", currentOdometer: { increment: actualDistance } },
      }),
    ]);

    return updatedTrip;
  }
}

export default new DriverAuthService();
