import { Prisma } from "@prisma/client";
import { prisma } from "../../common/config/prisma";

class MaintenanceRepository {
    create(data: Prisma.MaintenanceCreateInput) {
        return prisma.maintenance.create({
            data,
            include: {
                vehicle: true,
            },
        });
    }

    findAll() {
        return prisma.maintenance.findMany({
            include: {
                vehicle: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }

    findById(id: string) {
        return prisma.maintenance.findUnique({
            where: { id },
            include: {
                vehicle: true,
            },
        });
    }
}

export default new MaintenanceRepository();
