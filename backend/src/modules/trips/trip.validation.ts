import { z } from "zod";

export const createTripSchema = z.object({
    source: z.string().min(2),
    destination: z.string().min(2),
    cargoWeight: z.number().positive(),
    plannedDistance: z.number().positive(),
    vehicleId: z.string(),
    driverId: z.string(),
});

export type CreateTripDto = z.infer<typeof createTripSchema>;
