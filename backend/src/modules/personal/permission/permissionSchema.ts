import { z } from 'zod';
export const permissionSchema = z.object({
    roleId: z.number(),
    tableName: z.string(),
    actionName: z.string(),
});

export type PermissionType = z.infer<typeof permissionSchema>;

export const protoPermissionSchema = z.object({
    tableName: z.string(),
    actionName: z.string(),
    status: z.boolean().optional().default(false),
});

export type protoPermissionType = z.infer<typeof protoPermissionSchema>;

