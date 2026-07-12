import { z } from "zod";

export const createDriverSchema = z.object({
    fullName: z.string().min(3),
    phone: z.string().min(10).max(15),
    email: z.string().email().optional(),
    emergencyContact: z.string().optional(),
    licenseNumber: z.string().min(5),
    licenseCategory: z.enum(["LMV", "HMV", "TRANSPORT"]),
    licenseExpiry: z.coerce.date(),
});

export const updateDriverSchema = createDriverSchema.partial();

export const renewLicenseSchema = z.object({
    licenseExpiry: z.coerce.date(),
});

export type CreateDriverDto = z.infer<typeof createDriverSchema>;
export type UpdateDriverDto = z.infer<typeof updateDriverSchema>;
export type RenewLicenseDto = z.infer<typeof renewLicenseSchema>;
