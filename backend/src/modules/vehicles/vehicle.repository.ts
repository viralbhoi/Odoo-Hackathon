import { prisma } from "../../common/config/prisma";
import { Prisma } from "@prisma/client";

class VehicleRepository {
    create(data: Prisma.VehicleCreateInput) {
        return prisma.vehicle.create({
            data,
        });
    }

    findByRegistration(registrationNumber: string) {
        return prisma.vehicle.findUnique({
            where: {
                registrationNumber,
            },
        });
    }

    findById(id: string) {
        return prisma.vehicle.findUnique({
            where: {
                id,
            },
        });
    }

    findAll() {
        return prisma.vehicle.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });
    }

    update(id: string, data: Prisma.VehicleUpdateInput) {
        return prisma.vehicle.update({
            where: {
                id,
            },
            data,
        });
    }

    delete(id: string) {
        return prisma.vehicle.delete({
            where: {
                id,
            },
        });
    }
}

export default new VehicleRepository();
