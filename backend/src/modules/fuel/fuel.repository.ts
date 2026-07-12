import { Prisma } from "@prisma/client";
import { prisma } from "../../common/config/prisma";

class FuelRepository {
    create(data: Prisma.FuelLogCreateInput) {
        return prisma.fuelLog.create({
            data,
            include: {
                vehicle: true,
            },
        });
    }

    findAll() {
        return prisma.fuelLog.findMany({
            include: {
                vehicle: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }

    findById(id: string) {
        return prisma.fuelLog.findUnique({
            where: { id },
            include: {
                vehicle: true,
            },
        });
    }
}

export default new FuelRepository();
