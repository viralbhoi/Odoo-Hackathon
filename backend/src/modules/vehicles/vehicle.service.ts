import vehicleRepository from "./vehicle.repository";
import { AppError } from "../../common/errors/AppError";
import { CreateVehicleDto } from "./vehicle.validation";

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
}

export default new VehicleService();
