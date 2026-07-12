import { z } from "zod";

export const createVehicleSchema = z.object({
    registrationNumber: z.string().min(3).max(20),

    model: z.string().min(2),

    type: z.enum(["TRUCK", "VAN", "PICKUP", "TRAILER", "BUS"]),

    maxLoadCapacity: z.number().positive(),

    currentOdometer: z.number().min(0),

    acquisitionCost: z.number().positive(),
});

export type CreateVehicleDto = z.infer<typeof createVehicleSchema>;
