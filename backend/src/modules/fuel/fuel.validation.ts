import { z } from "zod";

export const createFuelLogSchema = z.object({
    vehicleId: z.string(),
    liters: z.number().positive(),
    cost: z.number().positive(),
    odometer: z.number().positive(),
});

export type CreateFuelLogDto = z.infer<typeof createFuelLogSchema>;
