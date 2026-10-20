import { z } from "zod";

export const createUserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters long"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    profileId: z.number().int().positive().nullable().optional(),
    roleId: z.number().int().positive().nullable().optional(),
    isSuperAdmin: z.boolean().default(false).optional()
});

export const updateUserSchema = z.object({
    id: z.string().min(1, "User ID is required"),
    name: z.string().min(2, "Name must be at least 2 characters long").optional(),
    profileId: z.number().int().positive().nullable().optional(),
    roleId: z.number().int().positive().nullable().optional(),
    isSuperAdmin: z.boolean().optional()
});

export const deleteUserSchema = z.object({
    id: z.string().min(1, "User ID is required")
});

export const toggleUserStatusSchema = z.object({
    id: z.string().min(1, "User ID is required")
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
export type ToggleUserStatusInput = z.infer<typeof toggleUserStatusSchema>;
