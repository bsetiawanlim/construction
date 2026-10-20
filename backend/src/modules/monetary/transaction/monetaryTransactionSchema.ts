import { z } from "zod";

export const monetaryTransactionSchema = z.object({
    id:              z.number().nullish(),
    sourceAccountId: z.number().int().positive("Source account id is required"),
    targetAccountId: z.number().int().positive("Target account id is required"),
    description:     z.string().optional().nullable(),
    transactionFlow: z.enum(["cash", "credit", "electronic"]),
    amount:          z.number().positive("Amount must be greater than 0"),
    currency:        z.string().max(3).optional(),
    status:          z.enum(["pending", "completed", "cancelled", "reversed", "partialSettled"]).default("pending"),
});

export const updateMonetaryTransactionSchema = z.object({
    id:              z.number().positive("Transaction id must be greater than 0"),
    description:     z.string().optional().nullable(),
    transactionFlow: z.enum(["cash", "credit", "electronic"]).optional(),
    amount:          z.number().positive().optional(),
    status:          z.enum(["pending", "completed", "cancelled", "reversed", "partialSettled"]).optional(),
});

export const deleteMonetaryTransactionSchema = z.object({
    id: z.number().int().positive("Transaction id must be positive"),
});

export const getMonetaryTransactionsByAccountSchema = z.object({
    accountId: z.number().int().positive("Account id must be positive"),
});

export type MonetaryTransactionType = z.infer<typeof monetaryTransactionSchema>;
export type UpdateMonetaryTransactionType = z.infer<typeof updateMonetaryTransactionSchema>;
export type DeleteMonetaryTransactionType = z.infer<typeof deleteMonetaryTransactionSchema>;
export type deleteMonetaryTransactionType = DeleteMonetaryTransactionType;
export type GetMonetaryTransactionsByAccountType = z.infer<typeof getMonetaryTransactionsByAccountSchema>;
export type getMonetaryTransactionsByAccountType = GetMonetaryTransactionsByAccountType;
