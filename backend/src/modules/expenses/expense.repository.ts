import { Prisma } from "@prisma/client";
import { prisma } from "../../common/config/prisma";

class ExpenseRepository {
    create(data: Prisma.ExpenseCreateInput) {
        return prisma.expense.create({
            data,
            include: {
                vehicle: true,
            },
        });
    }

    findAll() {
        return prisma.expense.findMany({
            include: {
                vehicle: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }

    findById(id: string) {
        return prisma.expense.findUnique({
            where: { id },
            include: {
                vehicle: true,
            },
        });
    }
}

export default new ExpenseRepository();
