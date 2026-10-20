import { prisma } from "../../../plugins/prisma";
import { protoPermissionType } from "./permissionSchema";
import { tableActions } from "../role/tableActions";
import { AppError } from "../../../utils/errors";

export async function getPermission(roleId: number, tableName: string, actionName: string) {
    const perm = await prisma.permission.findFirst({
        where: {
            roleId,
            tableName,
            actionName,
            deletedAt: null
        }
    });
    return perm ?? false;
}

export async function getPermissionIncludingDeleted(roleId: number, tableName: string, actionName: string) {
    return await prisma.permission.findFirst({
        where: {
            roleId,
            tableName,
            actionName
        }
    });
}

export async function getRolePermissions(roleId: number) {
    return await prisma.permission.findMany({
        where: {
            roleId,
            deletedAt: null
        }
    });
}

export async function removeRolePermission(roleId: number, tableName: string, actionName: string, userId: string) {
    const permission = await getPermission(roleId, tableName, actionName);
    if (permission) {
        return await prisma.permission.update({
            where: {
                id: permission.id
            },
            data: {
                deletedAt: new Date(),
                updatedAt: new Date(),
                updatedBy: userId,
            }
        });
    }
}

export async function grantRolePermission(roleId: number, tableName: string, actionName: string, userId: string) {
    const permission = await getPermissionIncludingDeleted(roleId, tableName, actionName);
    if (!permission) {
        return await prisma.permission.create({
            data: {
                roleId,
                tableName,
                actionName,
                updatedAt: new Date(),
                createdAt: new Date(),
                updatedBy: userId,
                createdBy: userId,
            }
        });
    } else if (permission.deletedAt !== null) {
        return await prisma.permission.update({
            where: {
                id: permission.id
            },
            data: {
                deletedAt: null,
                updatedAt: new Date(),
                updatedBy: userId,
            }
        });
    }
}

export async function deleteRolePermissions(roleId: number, userId: string) {
    await prisma.permission.updateMany({
        where: {
            roleId,
            deletedAt: null
        },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: userId,
        }
    });
    return true;
}

export async function checkPermissionInput(permissions: protoPermissionType[]) {
    for (const permission of permissions) {
        if (!tableActions.hasOwnProperty(permission.tableName)) {
            throw AppError.badRequest(`Table '${permission.tableName}' does not exist in tableActions.`);
        }
        const allowedActions = tableActions[permission.tableName as keyof typeof tableActions];
        if (!allowedActions || !allowedActions.includes(permission.actionName)) {
            throw AppError.badRequest(`Action '${permission.actionName}' is not allowed for table '${permission.tableName}'.`);
        }
    }
    return true;
}

export async function setRolePermissions(
    roleId: number,
    permissions: protoPermissionType[],
    userId: string
) {
    let changed = false;
    for (const permission of permissions) {
        const existingPermission = await getPermission(roleId, permission.tableName, permission.actionName);
        if (permission.status && !existingPermission) {
            await grantRolePermission(roleId, permission.tableName, permission.actionName, userId);
            changed = true;
        } else if (!permission.status && existingPermission) {
            await removeRolePermission(roleId, permission.tableName, permission.actionName, userId);
            changed = true;
        }
    }
    return changed;
}

export async function setRoleFacilityPermissions(
    roleId: number,
    facilityPermissions: Array<{
        facilityId: number;
        canView?: boolean;
        canManageStock?: boolean;
        canTransact?: boolean;
    }>,
    userId: string
) {
    let changed = false;

    for (const fp of facilityPermissions) {
        const existing = await prisma.roleFacilityPermission.findFirst({
            where: {
                roleId,
                facilityId: fp.facilityId,
            },
        });

        const canView = fp.canView !== false;
        const canManageStock = Boolean(fp.canManageStock);
        const canTransact = Boolean(fp.canTransact);

        if (!existing) {
            await prisma.roleFacilityPermission.create({
                data: {
                    roleId,
                    facilityId: fp.facilityId,
                    canView,
                    canManageStock,
                    canTransact,
                    createdBy: userId,
                    updatedBy: userId,
                },
            });
            changed = true;
        } else {
            if (
                existing.canView !== canView ||
                existing.canManageStock !== canManageStock ||
                existing.canTransact !== canTransact ||
                existing.deletedAt !== null
            ) {
                await prisma.roleFacilityPermission.update({
                    where: { id: existing.id },
                    data: {
                        canView,
                        canManageStock,
                        canTransact,
                        deletedAt: null,
                        updatedAt: new Date(),
                        updatedBy: userId,
                    },
                });
                changed = true;
            }
        }
    }

    return changed;
}

export async function grantSuperUser(userId: string, whoGrants: string) {
    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            deletedAt: null
        }
    });

    if (!user) {
        throw AppError.notFound("User not found");
    }
    if (user.isSuperAdmin) {
        throw AppError.conflict("User is already a super admin");
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            isSuperAdmin: true,
            updatedAt: new Date(),
            updatedBy: whoGrants,
        }
    });
    return true;
}

export async function revokeSuperUser(userId: string, whoRevokes: string) {
    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            deletedAt: null
        }
    });

    if (!user) {
        throw AppError.notFound("User not found");
    }
    if (!user.isSuperAdmin) {
        throw AppError.badRequest("User is not a super admin");
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            isSuperAdmin: false,
            updatedAt: new Date(),
            updatedBy: whoRevokes,
        }
    });
    return true;
}