import { z } from "zod";

export const createMaintenanceSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    // Accept either estimatedCost or cost (frontend uses cost)
    estimatedCost: z.number().nonnegative().optional(),
    cost: z.number().nonnegative().optional(),
    vehicleId: z.string(),
    // Accept maintenanceType (frontend) — stored as description prefix
    maintenanceType: z.string().optional(),
    vendor: z.string().optional(),
    startDate: z.string().optional(),
}).transform((data) => ({
    title: data.title,
    description: data.description ?? data.maintenanceType ?? undefined,
    estimatedCost: data.estimatedCost ?? data.cost ?? undefined,
    vehicleId: data.vehicleId,
}));

export const completeMaintenanceSchema = z.object({
    actualCost: z.number().nonnegative().optional(),
    endDate: z.string().optional(),
});

export type CreateMaintenanceDto = z.infer<typeof createMaintenanceSchema>;
export type CompleteMaintenanceDto = z.infer<typeof completeMaintenanceSchema>;
