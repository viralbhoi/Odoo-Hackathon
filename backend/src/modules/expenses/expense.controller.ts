import { Request, Response } from "express";

import { asyncHandler } from "../../common/utils/asyncHandler";

import expenseService from "./expense.service";

import { createExpenseSchema } from "./expense.validation";

class ExpenseController {
    create = asyncHandler(async (req: Request, res: Response) => {
        const data = createExpenseSchema.parse(req.body);

        const expense = await expenseService.create(data);

        res.status(201).json({
            success: true,
            data: expense,
        });
    });

    getAll = asyncHandler(async (_: Request, res: Response) => {
        const expenses = await expenseService.getAll();

        res.json({
            success: true,
            data: expenses,
        });
    });
}

export default new ExpenseController();
