import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { getProfileById } from "../profile/profileController";
import { extractFieldForUpdate } from "../../../utils/prismaUtils";
import { AppError } from "../../../utils/errors";
import { success, created, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationParams } from "../../../utils/pagination";
import { vendorType, deletevendorType, restorevendorType } from "./vendorSchema";

export async function createVendorController(
    request: FastifyRequest<{ Body: vendorType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    let profileId = data.profileId;

    if (!profileId) {
        if (!data.firstName || data.firstName.trim().length < 2) {
            throw AppError.badRequest("Either profileId or a valid firstName (at least 2 characters) must be provided.");
        }

        const newProfile = await prisma.profile.create({
            data: {
                firstName: data.firstName.trim(),
                lastName: data.lastName?.trim() || null,
                phoneNumber: data.phoneNumber?.trim() || null,
                address: data.address?.trim() || null,
                city: data.city?.trim() || null,
                province: data.province?.trim() || null,
                postalCode: data.postalCode?.trim() || null,
                country: data.country?.trim() || "Indonesia",
                isCompany: data.isCompany ?? true,
                createdBy: user.id,
                updatedBy: user.id,
            }
        });
        profileId = newProfile.id;
    } else {
        const profile = await getProfileById(profileId);
        if (!profile) {
            throw AppError.notFound("Profile not found!");
        }

        const existingVendor = await prisma.vendor.findFirst({
            where: {
                profileId,
                deletedAt: null
            }
        });

        if (existingVendor) {
            throw AppError.conflict("Vendor already exists for this profile.");
        }
    }

    const vendor = await prisma.vendor.create({
        data: {
            profileId,
            vendorgroup: data.vendorgroup ?? null,
            departReason: data.departReason || null,
            updatedAt: new Date(),
            createdAt: new Date(),
            createdBy: user.id,
            updatedBy: user.id,
        },
        include: {
            profile: true
        }
    });

    return created(reply, vendor, "Vendor successfully created.");
}

export async function deleteVendorController(
    request: FastifyRequest<{ Body: deletevendorType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const vendor = await prisma.vendor.findFirst({
        where: {
            id: data.id,
            deletedAt: null
        }
    });
    if (!vendor) {
        throw AppError.notFound("Vendor not found!");
    }

    const updatedVendor = await prisma.vendor.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
            departReason: data.departReason || null,
        }
    });

    return success(reply, updatedVendor, "Vendor successfully deleted.");
}

export async function restoreVendorController(
    request: FastifyRequest<{ Body: restorevendorType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const vendor = await prisma.vendor.findFirst({
        where: { id: data.id }
    });
    if (!vendor) {
        throw AppError.notFound("Vendor not found!");
    }
    if (!vendor.deletedAt) {
        return success(reply, vendor, "Vendor is already active.");
    }

    const restored = await prisma.vendor.update({
        where: { id: data.id },
        data: {
            deletedAt: null,
            departReason: null,
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: {
            profile: true,
        }
    });

    return success(reply, restored, "Vendor successfully restored.");
}

export async function updateVendorController(
    request: FastifyRequest<{ Body: Partial<vendorType> & { id: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const vendor = await prisma.vendor.findFirst({
        where: {
            id: data.id,
            deletedAt: null
        }
    });
    if (!vendor) {
        throw AppError.notFound("Vendor not found!");
    }

    const fields = extractFieldForUpdate(vendor, data);
    if (!fields) {
        return success(reply, vendor, "No fields to update.");
    }

    const { id: _id, ...cleanFields } = fields;

    const updatedVendor = await prisma.vendor.update({
        where: { id: data.id },
        data: {
            ...cleanFields,
            updatedAt: new Date(),
            vendorUpdatedBy: { connect: { id: user.id } },
        },
        include: {
            profile: true,
        }
    });

    return success(reply, updatedVendor, "Vendor successfully updated.");
}

export async function getVendorsController(
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

    const searchFilter = buildSearchFilter(params.search, [
        "profile.firstName",
        "profile.lastName",
        "profile.address",
        "profile.city",
        "profile.province",
        "profile.country",
        "profile.postalCode"
    ]);

    const where: any = {
        deletedAt: (params as any).status === "deactivated" ? { not: null } : (params as any).status === "all" ? undefined : null,
        ...(searchFilter ? { OR: searchFilter } : {})
    };

    const [vendors, total] = await Promise.all([
        prisma.vendor.findMany({
            where,
            skip,
            take,
            orderBy,
            include: {
                profile: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        isCompany: true,
                        phoneNumber: true,
                        address: true,
                        city: true,
                        province: true,
                        postalCode: true,
                        country: true,
                    }
                },
                vendorProducts: {
                    where: { deletedAt: null },
                    include: {
                        product: {
                            select: {
                                id: true,
                                productName: true,
                                sku: true,
                                currentStock: true,
                            }
                        }
                    }
                }
            }
        }),
        prisma.vendor.count({ where })
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, vendors, meta, "Vendors successfully fetched.", "vendors");
}