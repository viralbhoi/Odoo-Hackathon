import { Prisma, DriverStatus } from "@prisma/client";
import { prisma } from "../../common/config/prisma";

class DriverRepository {
    findAll() {
        return prisma.driver.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });
    }

    findById(id: string) {
        return prisma.driver.findUnique({
            where: { id },
        });
    }

    findByLicense(licenseNumber: string) {
        return prisma.driver.findUnique({
            where: { licenseNumber },
        });
    }

    create(data: Prisma.DriverCreateInput) {
        return prisma.driver.create({
            data,
        });
    }

    update(id: string, data: Prisma.DriverUpdateInput) {
        return prisma.driver.update({
            where: { id },
            data,
        });
    }

    suspend(id: string) {
        return prisma.driver.update({
            where: { id },
            data: {
                status: DriverStatus.SUSPENDED,
            },
        });
    }

    reinstate(id: string) {
        return prisma.driver.update({
            where: { id },
            data: {
                status: DriverStatus.AVAILABLE,
            },
        });
    }

    delete(id: string) {
        return prisma.driver.delete({
            where: { id },
        });
    }
}

export default new DriverRepository();
