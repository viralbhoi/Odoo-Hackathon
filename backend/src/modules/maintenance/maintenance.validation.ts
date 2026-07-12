import { z } from "zod";

export const createMaintenanceSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    estimatedCost: z.number().positive().optional(),
    vehicleId: z.string(),
});

export const completeMaintenanceSchema = z.object({
    actualCost: z.number().positive(),
});

export type CreateMaintenanceDto = z.infer<typeof createMaintenanceSchema>;
export type CompleteMaintenanceDto = z.infer<typeof completeMaintenanceSchema>;
