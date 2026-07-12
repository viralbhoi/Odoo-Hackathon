import { prisma } from "../../common/config/prisma";
import { AppError } from "../../common/errors/AppError";

import expenseRepository from "./expense.repository";
import { CreateExpenseDto } from "./expense.validation";

class ExpenseService {
    async create(data: CreateExpenseDto) {
        if (data.vehicleId) {
            const vehicle = await prisma.vehicle.findUnique({
                where: {
                    id: data.vehicleId,
                },
            });

            if (!vehicle) {
                throw new AppError(404, "Vehicle not found");
            }
        }

        return expenseRepository.create({
            title: data.title,

            amount: data.amount,

            type: data.type,

            vehicle: data.vehicleId
                ? {
                      connect: {
                          id: data.vehicleId,
                      },
                  }
                : undefined,
        });
    }

    getAll() {
        return expenseRepository.findAll();
    }
}

export default new ExpenseService();
