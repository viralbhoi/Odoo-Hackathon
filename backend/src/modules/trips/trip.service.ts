import { DriverStatus, TripStatus, VehicleStatus } from "@prisma/client";

import { prisma } from "../../common/config/prisma";
import { AppError } from "../../common/errors/AppError";
import tripRepository from "./trip.repository";
import { CreateTripDto } from "./trip.validation";

class TripService {
    async create(data: CreateTripDto) {
        const vehicle = await prisma.vehicle.findUnique({
            where: {
                id: data.vehicleId,
            },
        });

        if (!vehicle) throw new AppError(404, "Vehicle not found");

        const driver = await prisma.driver.findUnique({
            where: {
                id: data.driverId,
            },
        });

        if (!driver) throw new AppError(404, "Driver not found");

        if (vehicle.status !== VehicleStatus.AVAILABLE)
            throw new AppError(400, "Vehicle unavailable");

        if (driver.status !== DriverStatus.AVAILABLE)
            throw new AppError(400, "Driver unavailable");

        if (driver.licenseExpiry < new Date())
            throw new AppError(400, "License expired");

        if (data.cargoWeight > vehicle.maxLoadCapacity)
            throw new AppError(400, "Vehicle capacity exceeded");

        return tripRepository.create({
            source: data.source,
            destination: data.destination,
            cargoWeight: data.cargoWeight,
            plannedDistance: data.plannedDistance,

            vehicle: {
                connect: {
                    id: data.vehicleId,
                },
            },

            driver: {
                connect: {
                    id: data.driverId,
                },
            },
        });
    }

    getAll() {
        return tripRepository.findAll();
    }

    async dispatch(id: string) {
        const trip = await tripRepository.findById(id);

        if (!trip) {
            throw new AppError(404, "Trip not found");
        }

        if (trip.status !== TripStatus.DRAFT) {
            throw new AppError(400, "Trip already dispatched");
        }

        await prisma.$transaction(async (tx) => {
            await tx.vehicle.update({
                where: {
                    id: trip.vehicleId,
                },
                data: {
                    status: VehicleStatus.ON_TRIP,
                },
            });

            await tx.driver.update({
                where: {
                    id: trip.driverId,
                },
                data: {
                    status: DriverStatus.ON_TRIP,
                },
            });

            await tx.trip.update({
                where: {
                    id,
                },
                data: {
                    status: TripStatus.DISPATCHED,
                    dispatchedAt: new Date(),
                },
            });
        });

        return tripRepository.findById(id);
    }

    async complete(id: string) {
        const trip = await tripRepository.findById(id);

        if (!trip) {
            throw new AppError(404, "Trip not found");
        }

        if (trip.status !== TripStatus.DISPATCHED) {
            throw new AppError(400, "Trip is not dispatched");
        }

        await prisma.$transaction(async (tx) => {
            await tx.vehicle.update({
                where: {
                    id: trip.vehicleId,
                },
                data: {
                    status: VehicleStatus.AVAILABLE,
                },
            });

            await tx.driver.update({
                where: {
                    id: trip.driverId,
                },
                data: {
                    status: DriverStatus.AVAILABLE,
                },
            });

            await tx.trip.update({
                where: {
                    id,
                },
                data: {
                    status: TripStatus.COMPLETED,
                    completedAt: new Date(),
                },
            });
        });

        return tripRepository.findById(id);
    }

    async cancel(id: string) {
        const trip = await tripRepository.findById(id);

        if (!trip) throw new AppError(404, "Trip not found");

        if (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED) {
            throw new AppError(400, "Trip already finished");
        }

        await prisma.$transaction(async (tx) => {
            // Free vehicle and driver back to available if trip was dispatched
            if (trip.status === TripStatus.DISPATCHED) {
                await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: VehicleStatus.AVAILABLE } });
                await tx.driver.update({ where: { id: trip.driverId }, data: { status: DriverStatus.AVAILABLE } });
            }

            await tx.trip.update({
                where: { id },
                data: { status: TripStatus.CANCELLED },
            });
        });

        return tripRepository.findById(id);
    }
}

export default new TripService();
