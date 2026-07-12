import { prisma } from "../../common/config/prisma";
import { AppError } from "../../common/errors/AppError";

import fuelRepository from "./fuel.repository";
import { CreateFuelLogDto } from "./fuel.validation";

class FuelService {
    async create(data: CreateFuelLogDto) {
        const vehicle = await prisma.vehicle.findUnique({
            where: {
                id: data.vehicleId,
            },
        });

        if (!vehicle) {
            throw new AppError(404, "Vehicle not found");
        }

        if (data.odometer < vehicle.currentOdometer) {
            throw new AppError(
                400,
                "Odometer cannot be less than current vehicle odometer",
            );
        }

        const fuel = await fuelRepository.create({
            liters: data.liters,

            cost: data.cost,

            odometer: data.odometer,

            vehicle: {
                connect: {
                    id: data.vehicleId,
                },
            },
        });

        await prisma.vehicle.update({
            where: {
                id: data.vehicleId,
            },

            data: {
                currentOdometer: data.odometer,
            },
        });

        return fuel;
    }

    getAll() {
        return fuelRepository.findAll();
    }
}

export default new FuelService();
