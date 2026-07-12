import vehicleRepository from "./vehicle.repository";
import { AppError } from "../../common/errors/AppError";
import { CreateVehicleDto } from "./vehicle.validation";
import { prisma } from "../../common/config/prisma";

const VALID_STATUSES = ["AVAILABLE", "IN_SHOP", "RETIRED"] as const;

class VehicleService {
    async create(data: CreateVehicleDto) {
        const exists = await vehicleRepository.findByRegistration(
            data.registrationNumber,
        );

        if (exists) {
            throw new AppError(409, "Vehicle already exists");
        }

        return vehicleRepository.create(data);
    }

    async getAll() {
        return vehicleRepository.findAll();
    }

    async getAvailable() {
        return vehicleRepository.findAll({ status: "AVAILABLE" });
    }

    async getById(id: string) {
        const vehicle = await vehicleRepository.findById(id);

        if (!vehicle) {
            throw new AppError(404, "Vehicle not found");
        }

        return vehicle;
    }

    async delete(id: string) {
        await this.getById(id);
        return vehicleRepository.delete(id);
    }

    async updateStatus(id: string, status: string) {
        await this.getById(id);
        if (!VALID_STATUSES.includes(status as any)) {
            throw new AppError(400, `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`);
        }
        return prisma.vehicle.update({
            where: { id },
            data: { status: status as any },
        });
    }
}

export default new VehicleService();
