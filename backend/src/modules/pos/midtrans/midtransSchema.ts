import { z } from "zod";

export const midtransSnapTokenSchema = z.object({
    salesOrderId: z.number().int().positive("Sales order ID must be greater than 0"),
    customerDetails: z.object({
        name: z.string().max(100).optional(),
        email: z.string().email().optional(),
        phone: z.string().max(30).optional(),
    }).optional(),
});
export type MidtransSnapTokenInput = z.infer<typeof midtransSnapTokenSchema>;

export const midtransChargeSchema = z.object({
    salesOrderId: z.number().int().positive("Sales order ID must be greater than 0"),
    paymentType: z.enum(["qris", "bank_transfer", "gopay", "shopeepay"]).default("qris"),
    bank: z.enum(["bca", "bni", "bri", "permata"]).optional(),
    customerDetails: z.object({
        name: z.string().max(100).optional(),
        email: z.string().email().optional(),
        phone: z.string().max(30).optional(),
    }).optional(),
});
export type MidtransChargeInput = z.infer<typeof midtransChargeSchema>;

export const midtransNotificationSchema = z.object({
    order_id: z.string(),
    status_code: z.string(),
    gross_amount: z.string(),
    signature_key: z.string(),
    transaction_status: z.string(),
    fraud_status: z.string().optional().nullable(),
    payment_type: z.string().optional().nullable(),
    transaction_id: z.string().optional().nullable(),
    settlement_time: z.string().optional().nullable(),
    transaction_time: z.string().optional().nullable(),
    va_numbers: z.array(z.object({
        bank: z.string(),
        va_number: z.string(),
    })).optional(),
    actions: z.array(z.object({
        name: z.string(),
        method: z.string(),
        url: z.string(),
    })).optional(),
}).passthrough();
export type MidtransNotificationPayload = z.infer<typeof midtransNotificationSchema>;

export const midtransSimulatePaymentSchema = z.object({
    salesOrderId: z.number().int().positive("Sales order ID must be greater than 0"),
    paymentType: z.string().optional().default("qris"),
});
export type MidtransSimulatePaymentInput = z.infer<typeof midtransSimulatePaymentSchema>;
