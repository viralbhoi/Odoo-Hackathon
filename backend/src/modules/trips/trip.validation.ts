import { z } from "zod";

export const createTripSchema = z.object({
    source: z.string().min(2),
    destination: z.string().min(2),
    cargoWeight: z.number().positive(),
    plannedDistance: z.number().positive(),
    vehicleId: z.string(),
    driverId: z.string(),
});

export const completeTripSchema = z.object({
    actualDistance: z.number().nonnegative().optional(),
    endedOdometer: z.number().nonnegative().optional(),
    notes: z.string().optional(),
});

export type CreateTripDto = z.infer<typeof createTripSchema>;
export type CompleteTripDto = z.infer<typeof completeTripSchema>;
