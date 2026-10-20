import { z } from 'zod';

export const vendorSchema = z.object({
    id: z.number().nullish(),
    profileId: z.number().nullish(),
    firstName: z.string().min(2, "First name must be at least 2 characters").optional(),
    lastName: z.string().optional(),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
    isCompany: z.boolean().optional(),
    vendorgroup: z.number().nullish(),
    departReason: z.string().nullish(),
});

export type vendorType = z.infer<typeof vendorSchema>;

export const deletevendorSchema = z.object({
    id: z.number(),
    departReason: z.string().nullish(),
});

export type deletevendorType = z.infer<typeof deletevendorSchema>;

export const restorevendorSchema = z.object({
    id: z.number(),
});

export type restorevendorType = z.infer<typeof restorevendorSchema>;

