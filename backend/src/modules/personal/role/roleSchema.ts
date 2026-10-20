import { z } from 'zod';
import { protoPermissionSchema } from '../permission/permissionSchema';

export const roleFacilityPermissionInputSchema = z.object({
    facilityId: z.number().int().positive(),
    canView: z.boolean().default(true),
    canManageStock: z.boolean().default(false),
    canTransact: z.boolean().default(false),
});

export type RoleFacilityPermissionInputType = z.infer<typeof roleFacilityPermissionInputSchema>;

export const createRoleSchema = z.object({
    roleName: z.string(),
    roleAbbr: z.string(),
    description: z.string().nullish(),
    permissions: z.array(protoPermissionSchema).nullish(),
    facilityPermissions: z.array(roleFacilityPermissionInputSchema).nullish(),
});

export type createRoleType = z.infer<typeof createRoleSchema>;

export const deleteRoleSchema = z.object({
    id: z.number(),
});

export type deleteRoleType = z.infer<typeof deleteRoleSchema>;

export const updateRoleSchema = z.object({
    id: z.number(),
    roleName: z.string(),
    roleAbbr: z.string(),
    description: z.string().nullish(),
    permissions: z.array(protoPermissionSchema).nullish(),
    facilityPermissions: z.array(roleFacilityPermissionInputSchema).nullish(),
});

export type updateRoleType = z.infer<typeof updateRoleSchema>;

export const getRoleSchema = z.object({
    id: z.number().optional(),
}).optional().default({});

export type getRoleType = z.infer<typeof getRoleSchema>;