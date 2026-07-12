import { z } from "zod";

export const createFuelLogSchema = z.object({
    vehicleId: z.string(),
    liters: z.coerce.number().positive(),
    cost: z.coerce.number().positive(),
    // Accept both "odometer" (backend) and "odometerReadingKm" (frontend alias) — optional
    odometer: z.coerce.number().nonnegative().optional(),
    odometerReadingKm: z.coerce.number().nonnegative().optional(),
    fuelStation: z.string().optional(),
    date: z.string().optional(),
}).transform((data) => ({
    vehicleId: data.vehicleId,
    liters: data.liters,
    cost: data.cost,
    odometer: data.odometer ?? data.odometerReadingKm,  // undefined = use vehicle current
    fuelStation: data.fuelStation,
}));

export type CreateFuelLogDto = z.infer<typeof createFuelLogSchema>;
