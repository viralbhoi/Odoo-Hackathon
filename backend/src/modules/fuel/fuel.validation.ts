import { z } from "zod";

export const createFuelLogSchema = z.object({
    vehicleId: z.string(),
    liters: z.number().positive(),
    cost: z.number().positive(),
    // Accept both "odometer" (backend) and "odometerReadingKm" (frontend alias) — optional
    odometer: z.number().nonnegative().optional(),
    odometerReadingKm: z.number().nonnegative().optional(),
    fuelStation: z.string().optional(),
    date: z.string().optional(),
}).transform((data) => ({
    vehicleId: data.vehicleId,
    liters: data.liters,
    cost: data.cost,
    odometer: data.odometer ?? data.odometerReadingKm ?? 0,
    fuelStation: data.fuelStation,
}));

export type CreateFuelLogDto = z.infer<typeof createFuelLogSchema>;
