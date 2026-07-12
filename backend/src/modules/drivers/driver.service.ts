import { AppError } from "../../common/errors/AppError";
import driverRepository from "./driver.repository";
import {
    CreateDriverDto,
    RenewLicenseDto,
    UpdateDriverDto,
} from "./driver.validation";

class DriverService {
    async create(data: CreateDriverDto) {
        const exists = await driverRepository.findByLicense(data.licenseNumber);

        if (exists) {
            throw new AppError(409, "License number already exists");
        }

        return driverRepository.create(data);
    }

    getAll() {
        return driverRepository.findAll();
    }

    getAvailable() {
        return driverRepository.findAvailable();
    }

    async getById(id: string) {
        const driver = await driverRepository.findById(id);

        if (!driver) {
            throw new AppError(404, "Driver not found");
        }

        return driver;
    }

    async update(id: string, data: UpdateDriverDto) {
        await this.getById(id);

        return driverRepository.update(id, data);
    }

    async renewLicense(id: string, data: RenewLicenseDto) {
        await this.getById(id);

        return driverRepository.update(id, {
            licenseExpiry: data.licenseExpiry,
        });
    }

    async suspend(id: string) {
        await this.getById(id);

        return driverRepository.suspend(id);
    }

    async reinstate(id: string) {
        await this.getById(id);

        return driverRepository.reinstate(id);
    }

    async updateStatus(id: string, status: string) {
        await this.getById(id);
        return driverRepository.update(id, { status: status as any });
    }

    async delete(id: string) {
        await this.getById(id);

        return driverRepository.delete(id);
    }
}

export default new DriverService();
