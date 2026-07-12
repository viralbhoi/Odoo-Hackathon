import { MaintenanceStatus, VehicleStatus } from "@prisma/client";

import { prisma } from "../../common/config/prisma";
import { AppError } from "../../common/errors/AppError";

import maintenanceRepository from "./maintenance.repository";
import {
    CreateMaintenanceDto,
    CompleteMaintenanceDto,
} from "./maintenance.validation";

class MaintenanceService {
    async create(data: CreateMaintenanceDto) {
        const vehicle = await prisma.vehicle.findUnique({
            where: {
                id: data.vehicleId,
            },
        });

        if (!vehicle) {
            throw new AppError(404, "Vehicle not found");
        }

        if (vehicle.status === VehicleStatus.ON_TRIP) {
            throw new AppError(400, "Vehicle is currently on trip");
        }

        const maintenance = await maintenanceRepository.create({
            title: data.title,
            description: data.description,
            estimatedCost: data.estimatedCost,

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
                status: VehicleStatus.IN_SHOP,
            },
        });

        return maintenance;
    }

    getAll() {
        return maintenanceRepository.findAll();
    }

    async complete(id: string, data: CompleteMaintenanceDto) {
        const maintenance = await maintenanceRepository.findById(id);

        if (!maintenance) {
            throw new AppError(404, "Maintenance not found");
        }

        await prisma.$transaction(async (tx) => {
            await tx.maintenance.update({
                where: {
                    id,
                },
                data: {
                    status: MaintenanceStatus.COMPLETED,
                    actualCost: data.actualCost,
                },
            });

            await tx.vehicle.update({
                where: {
                    id: maintenance.vehicleId,
                },
                data: {
                    status: VehicleStatus.AVAILABLE,
                },
            });
        });

        return maintenanceRepository.findById(id);
    }
}

export default new MaintenanceService();
