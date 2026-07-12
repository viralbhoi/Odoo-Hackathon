import { z } from "zod";

// Accept both uppercase (TOLL) and lowercase (toll) type values from frontend
const expenseTypeEnum = z.enum(["FUEL", "MAINTENANCE", "TOLL", "OTHER"]);
const expenseTypeLower = z.enum(["fuel", "maintenance", "toll", "other"]).transform((v) =>
    v.toUpperCase() as "FUEL" | "MAINTENANCE" | "TOLL" | "OTHER"
);

export const createExpenseSchema = z
    .object({
        // Accept 'title' or 'description' (frontend sends description)
        title: z.string().optional(),
        description: z.string().optional(),
        amount: z.number().positive(),
        // Accept 'type' (backend) or 'expenseType' (frontend alias)
        type: z.union([expenseTypeEnum, expenseTypeLower]).optional(),
        expenseType: z.union([expenseTypeEnum, expenseTypeLower]).optional(),
        vehicleId: z.string().optional(),
        date: z.string().optional(),
    })
    .transform((data) => ({
        title: data.title ?? data.description ?? "Expense",
        amount: data.amount,
        type: (data.type ?? data.expenseType ?? "OTHER") as "FUEL" | "MAINTENANCE" | "TOLL" | "OTHER",
        vehicleId: data.vehicleId,
    }));

export type CreateExpenseDto = z.infer<typeof createExpenseSchema>;
