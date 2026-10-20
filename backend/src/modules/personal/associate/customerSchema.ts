import { z } from 'zod';

export const customerSchema = z.object({
    id: z.number().nullish(),
    profileId: z.number().nullish(),
    firstName: z.string().min(2, "First name must be at least 2 characters").optional(),
    lastName: z.string().optional(),
    phoneNumber: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
    isCompany: z.boolean().optional(),
    customergroup: z.number().nullish(),
    departReason: z.string().nullish(),
});

export type customerType = z.infer<typeof customerSchema>;

export const deleteCustomerSchema = z.object({
    id: z.number(),
    departReason: z.string().nullish(),
});

export type deleteCustomerType = z.infer<typeof deleteCustomerSchema>;

export const restoreCustomerSchema = z.object({
    id: z.number(),
});

export type restoreCustomerType = z.infer<typeof restoreCustomerSchema>;