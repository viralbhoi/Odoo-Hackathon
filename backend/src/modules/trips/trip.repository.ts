import { Prisma } from "@prisma/client";
import { prisma } from "../../common/config/prisma";

class TripRepository {
    create(data: Prisma.TripCreateInput) {
        return prisma.trip.create({
            data,
            include: {
                vehicle: true,
                driver: true,
            },
        });
    }

    findAll() {
        return prisma.trip.findMany({
            include: {
                vehicle: true,
                driver: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }

    findById(id: string) {
        return prisma.trip.findUnique({
            where: { id },
            include: {
                vehicle: true,
                driver: true,
            },
        });
    }

    update(id: string, data: Prisma.TripUpdateInput) {
        return prisma.trip.update({
            where: { id },
            data,
        });
    }

    delete(id: string) {
        return prisma.trip.delete({
            where: { id },
        });
    }
}

export default new TripRepository();
