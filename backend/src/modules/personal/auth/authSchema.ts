import { z } from "zod";

export const signUpEmailSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    name: z.string().min(2, "Name must be at least 2 characters long"),
    profileId: z.number().int().positive().optional(),
    roleId: z.number().int().positive().optional(),
    isSuperAdmin: z.boolean().default(false).optional()
});

export const deactivateUserSchema = z.object({
    userId: z.string().optional(),
    userEmail: z.string().email().optional()
}).refine((data) => data.userId || data.userEmail, {
    message: "Either userId or userEmail is required"
});

export const reactivateUserSchema = z.object({
    userId: z.string().optional(),
    userEmail: z.string().email().optional()
}).refine((data) => data.userId || data.userEmail, {
    message: "Either userId or userEmail is required"
});

export type SignUpEmailInput = z.infer<typeof signUpEmailSchema>;
export type DeactivateUserInput = z.infer<typeof deactivateUserSchema>;
export type ReactivateUserInput = z.infer<typeof reactivateUserSchema>;
