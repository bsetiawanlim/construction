import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { checkPermissionInput, deleteRolePermissions, setRolePermissions, setRoleFacilityPermissions, getPermission } from "../permission/permissionController";
import { extractFieldForUpdate } from "../../../utils/prismaUtils";
import { AppError } from "../../../utils/errors";
import { success, created, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationParams } from "../../../utils/pagination";
import { createRoleType, deleteRoleType, updateRoleType, getRoleType } from "./roleSchema";

export async function createRoleController(
    request: FastifyRequest<{ Body: createRoleType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }
    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const permissions = data.permissions;
    const facilityPermissions = data.facilityPermissions;

    // Check if role name or role abbr already exists
    const existingRole = await prisma.role.findFirst({
        where: {
            deletedAt: null,
            OR: [
                { roleName: data.roleName },
                { roleAbbr: data.roleAbbr }
            ]
        }
    });

    if (existingRole) {
        throw AppError.conflict("Role with this name or abbreviation already exists");
    }

    if (permissions && permissions.length > 0) {
        await checkPermissionInput(permissions);
    }

    const role = await prisma.role.create({
        data: {
            roleName: data.roleName,
            roleAbbr: data.roleAbbr,
            description: data.description ?? null,
            updatedAt: new Date(),
            createdAt: new Date(),
            roleCreatedBy: { connect: { id: user.id } },
            roleUpdatedBy: { connect: { id: user.id } },
        }
    });

    if (permissions && permissions.length > 0) {
        await setRolePermissions(role.id, permissions, user.id);
    }

    if (facilityPermissions && facilityPermissions.length > 0) {
        await setRoleFacilityPermissions(role.id, facilityPermissions, user.id);
    }

    return created(reply, role, "Role successfully created.");
}

export async function getRolesController(
    request: FastifyRequest<{ Querystring: PaginationParams; Body?: PaginationParams }>,
    reply: FastifyReply
) {
    const params = (request.query && Object.keys(request.query).length > 0)
        ? request.query
        : (request.body || {});

    const { page, limit, skip, take, orderBy } = buildPaginationQuery(params, {
        defaultSortBy: "createdAt",
        defaultSortOrder: "desc"
    });

    const searchFilter = buildSearchFilter(params.search, ["roleName", "roleAbbr", "description"]);
    const where: any = {
        deletedAt: null,
        ...(searchFilter ? { OR: searchFilter } : {})
    };

    const [roles, total] = await Promise.all([
        prisma.role.findMany({
            where,
            skip,
            take,
            orderBy,
            include: {
                permissions: {
                    where: { deletedAt: null }
                },
                facilityPermissions: {
                    where: { deletedAt: null },
                    include: {
                        facility: {
                            select: {
                                id: true,
                                facilityCode: true,
                                facilityName: true,
                                type: true,
                                city: true,
                            }
                        }
                    }
                }
            }
        }),
        prisma.role.count({ where })
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, roles, meta, "Roles successfully fetched.", "roles");
}

export async function deleteRoleController(
    request: FastifyRequest<{ Body: deleteRoleType }>,
    reply: FastifyReply
) {
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }
    const { id: roleId } = request.body;

    const existingRole = await prisma.role.findFirst({
        where: {
            id: roleId,
            deletedAt: null
        },
    });

    if (!existingRole) {
        throw AppError.notFound("Role not found!");
    }

    await prisma.role.update({
        where: { id: roleId },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            roleUpdatedBy: { connect: { id: user.id } },
        }
    });

    await deleteRolePermissions(roleId, user.id);
    return success(reply, existingRole, "Role successfully deleted.");
}

export async function updateRoleController(
    request: FastifyRequest<{ Body: updateRoleType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }
    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existingRoleById = await prisma.role.findFirst({
        where: {
            id: data.id,
            deletedAt: null
        }
    });

    if (!existingRoleById) {
        throw AppError.notFound("Role not found!");
    }

    const existingRoleByName = await prisma.role.findFirst({
        where: {
            deletedAt: null,
            id: { not: data.id },
            OR: [
                { roleName: data.roleName },
                { roleAbbr: data.roleAbbr }
            ]
        }
    });

    if (existingRoleByName) {
        throw AppError.conflict("Another role with this name or abbreviation already exists");
    }

    const permissions = data.permissions;
    if (permissions && permissions.length > 0) {
        await checkPermissionInput(permissions);
    }

    const facilityPermissions = data.facilityPermissions;

    const { permissions: _perms, facilityPermissions: _facPerms, ...roleData } = data;
    const extractedData = extractFieldForUpdate(existingRoleById, roleData);
    const changedPermission = permissions
        ? await setRolePermissions(existingRoleById.id, permissions, user.id)
        : false;

    const changedFacilityPermission = facilityPermissions
        ? await setRoleFacilityPermissions(existingRoleById.id, facilityPermissions, user.id)
        : false;

    if (extractedData === null && !changedPermission && !changedFacilityPermission) {
        return success(reply, existingRoleById, "No changes detected.");
    }

    if (extractedData !== null) {
        await prisma.role.update({
            where: { id: data.id },
            data: {
                roleName: data.roleName,
                roleAbbr: data.roleAbbr,
                description: data.description ?? null,
                updatedAt: new Date(),
                roleUpdatedBy: { connect: { id: user.id } },
            }
        });
    }

    const updatedRole = await prisma.role.findFirst({
        where: { id: data.id },
        include: {
            permissions: {
                where: { deletedAt: null },
                select: {
                    actionName: true,
                    tableName: true,
                }
            },
            facilityPermissions: {
                where: { deletedAt: null },
                include: {
                    facility: {
                        select: {
                            id: true,
                            facilityCode: true,
                            facilityName: true,
                            type: true,
                            city: true,
                        }
                    }
                }
            }
        }
    });

    return success(reply, updatedRole, "Role successfully updated.");
}

export async function getRoleByIdController(
    request: FastifyRequest<{ Body: getRoleType; Querystring: { id?: string } }>,
    reply: FastifyReply
) {
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const idFromQuery = request.query?.id ? Number(request.query.id) : undefined;
    const id = request.body?.id ?? idFromQuery ?? user.roleId;

    if (!id) {
        throw AppError.badRequest("Role ID is required");
    }

    // A user can always view their own assigned role.
    // Otherwise, superAdmin or role view permissions are required.
    if (!user.isSuperAdmin && user.roleId !== id) {
        const canView = user.roleId && (
            await getPermission(user.roleId, "role", "get") ||
            await getPermission(user.roleId, "role", "get-id") ||
            await getPermission(user.roleId, "role", "get-all")
        );
        if (!canView) {
            throw AppError.forbidden("Permission denied to view this role.");
        }
    }

    const role = await prisma.role.findFirst({
        where: {
            id,
            deletedAt: null
        },
        include: {
            permissions: {
                where: { deletedAt: null },
                select: {
                    id: true,
                    roleId: true,
                    tableName: true,
                    actionName: true
                }
            },
            facilityPermissions: {
                where: { deletedAt: null },
                include: {
                    facility: {
                        select: {
                            id: true,
                            facilityCode: true,
                            facilityName: true,
                            type: true,
                            city: true,
                        }
                    }
                }
            }
        }
    });

    if (!role) {
        throw AppError.notFound("Role not found!");
    }

    return success(reply, role, "Role successfully fetched.");
}

