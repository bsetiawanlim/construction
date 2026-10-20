import { z } from "zod";

export const monetaryAccountSchema = z.object({
    id: z.number().int().positive().optional(),
    institute: z.string().max(50).nullish(),
    accountName: z.string().min(1, "Account name is required").max(50),
    accountId: z.string().max(50).nullish(),
    profileId: z.number().int().positive().nullish(),
    accountType: z.enum(["bankAccount", "cashAccount", "loanAccount", "savingAccount", "creditCardAccount"]),
    description: z.string().max(255).nullish(),
    balance: z.number().default(0).nullish(),
});

export const getByProfileSchema = z.object({
    profileId: z.number().int().positive("Profile id must be positive"),
});

export const deleteMonetaryAccountSchema = z.object({
    id: z.number().int().positive("Account id must be positive"),
});

export type MonetaryAccountType = z.infer<typeof monetaryAccountSchema>;
export type GetByProfileType = z.infer<typeof getByProfileSchema>;
export type DeleteMonetaryAccountType = z.infer<typeof deleteMonetaryAccountSchema>;
