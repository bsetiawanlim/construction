import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { getProfileById } from "../profile/profileController";
import { extractFieldForUpdate } from "../../../utils/prismaUtils";
import { AppError } from "../../../utils/errors";
import { success, created, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationParams } from "../../../utils/pagination";
import { customerType, deleteCustomerType, restoreCustomerType } from "./customerSchema";

export async function createCustomerController(
    request: FastifyRequest<{ Body: customerType }>,
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
                email: data.email?.trim() || null,
                address: data.address?.trim() || null,
                city: data.city?.trim() || null,
                province: data.province?.trim() || null,
                postalCode: data.postalCode?.trim() || null,
                country: data.country?.trim() || "Indonesia",
                isCompany: data.isCompany ?? false,
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

        const existingCustomer = await prisma.customer.findFirst({
            where: {
                profileId,
                deletedAt: null
            }
        });

        if (existingCustomer) {
            throw AppError.conflict("Customer already exists for this profile.");
        }
    }

    const customer = await prisma.customer.create({
        data: {
            profileId,
            customergroup: data.customergroup ?? 1,
            departReason: data.departReason ?? null,
            updatedAt: new Date(),
            createdAt: new Date(),
            createdBy: user.id,
            updatedBy: user.id,
        },
        include: {
            profile: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    address: true,
                    phoneNumber: true,
                }
            }
        }
    });

    return created(reply, customer, "Customer successfully created.");
}

export async function deleteCustomerController(
    request: FastifyRequest<{ Body: deleteCustomerType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existingCustomer = await prisma.customer.findFirst({
        where: {
            id: data.id,
            deletedAt: null
        }
    });
    if (!existingCustomer) {
        throw AppError.notFound("Customer not found!");
    }

    const customer = await prisma.customer.update({
        where: { id: data.id },
        data: {
            departReason: data.departReason ?? null,
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        }
    });

    return success(reply, customer, "Customer successfully deleted.");
}

export async function restoreCustomerController(
    request: FastifyRequest<{ Body: restoreCustomerType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const customer = await prisma.customer.findFirst({
        where: { id: data.id }
    });
    if (!customer) {
        throw AppError.notFound("Customer not found!");
    }
    if (!customer.deletedAt) {
        return success(reply, customer, "Customer is already active.");
    }

    const restored = await prisma.customer.update({
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

    return success(reply, restored, "Customer successfully restored.");
}

export async function updateCustomerController(
    request: FastifyRequest<{ Body: Partial<customerType> & { id: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const customer = await prisma.customer.findFirst({
        where: {
            id: data.id,
            deletedAt: null
        }
    });
    if (!customer) {
        throw AppError.notFound("Customer not found!");
    }

    const fields = extractFieldForUpdate(customer, data);
    if (!fields) {
        return success(reply, customer, "No fields to update.");
    }

    const { id: _id, ...cleanFields } = fields;

    const updatedCustomer = await prisma.customer.update({
        where: { id: data.id },
        data: {
            ...cleanFields,
            updatedAt: new Date(),
            customerUpdatedBy: { connect: { id: user.id } },
        },
        include: {
            profile: true,
        }
    });

    return success(reply, updatedCustomer, "Customer successfully updated.");
}

export async function getCustomersController(
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
        "profile.email",
        "profile.phoneNumber",
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

    const [customers, total] = await Promise.all([
        prisma.customer.findMany({
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
                        email: true,
                        phoneNumber: true,
                        isCompany: true,
                        address: true,
                        city: true,
                        province: true,
                        postalCode: true,
                        country: true,
                    }
                }
            }
        }),
        prisma.customer.count({ where })
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, customers, meta, "Customers successfully fetched.", "customers");
}
