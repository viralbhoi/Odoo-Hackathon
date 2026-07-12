import { z } from "zod";

export const createExpenseSchema = z.object({
    title: z.string().min(3),
    amount: z.number().positive(),
    type: z.enum(["FUEL", "MAINTENANCE", "TOLL", "OTHER"]),
    vehicleId: z.string().optional(),
});

export type CreateExpenseDto = z.infer<typeof createExpenseSchema>;
