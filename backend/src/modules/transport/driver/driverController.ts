import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationQuery } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import {
    CreateDriverType,
    UpdateDriverType,
    DeleteDriverType,
    GetDriverType,
} from "./driverSchema";

export const createDriverController: TypedHandler<CreateDriverType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existing = await prisma.driver.findFirst({
        where: { licenseNumber: data.licenseNumber },
    });
    if (existing) {
        throw AppError.conflict("Driver with this license number already exists.");
    }

    if (data.profileId) {
        const profile = await prisma.profile.findFirst({
            where: { id: data.profileId, deletedAt: null },
        });
        if (!profile) {
            throw AppError.notFound("Associated profile not found.");
        }
    }

    if (data.employeeId) {
        const employee = await prisma.employee.findFirst({
            where: { id: data.employeeId, deletedAt: null },
        });
        if (!employee) {
            throw AppError.notFound("Associated employee not found.");
        }
    }

    const driver = await prisma.driver.create({
        data: {
            profileId:      data.profileId ?? undefined,
            employeeId:     data.employeeId ?? undefined,
            name:           data.name,
            licenseNumber:  data.licenseNumber,
            licenseType:    data.licenseType,
            licenseExpired: data.licenseExpired ? new Date(data.licenseExpired) : undefined,
            phoneNumber:    data.phoneNumber ?? undefined,
            status:         data.status ?? "AVAILABLE",
            notes:          data.notes ?? undefined,
            createdAt:      new Date(),
            updatedAt:      new Date(),
            createdBy:      user.id,
            updatedBy:      user.id,
        },
    });

    return created(reply, { driver }, "Driver successfully created.");
};

export const updateDriverController: TypedHandler<UpdateDriverType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Driver id is required");
    }

    const existing = await prisma.driver.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existing) {
        throw AppError.notFound("Driver not found.");
    }

    if (data.licenseNumber && data.licenseNumber !== existing.licenseNumber) {
        const duplicate = await prisma.driver.findFirst({
            where: { licenseNumber: data.licenseNumber, id: { not: data.id } },
        });
        if (duplicate) {
            throw AppError.conflict("Driver with this license number already exists.");
        }
    }

    const driver = await prisma.driver.update({
        where: { id: data.id },
        data: {
            ...(data.profileId      !== undefined && { profileId: data.profileId }),
            ...(data.employeeId     !== undefined && { employeeId: data.employeeId }),
            ...(data.name           !== undefined && { name: data.name }),
            ...(data.licenseNumber  !== undefined && { licenseNumber: data.licenseNumber }),
            ...(data.licenseType    !== undefined && { licenseType: data.licenseType }),
            ...(data.licenseExpired !== undefined && { licenseExpired: data.licenseExpired ? new Date(data.licenseExpired) : null }),
            ...(data.phoneNumber    !== undefined && { phoneNumber: data.phoneNumber }),
            ...(data.status         !== undefined && { status: data.status }),
            ...(data.notes          !== undefined && { notes: data.notes }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { driver }, "Driver successfully updated.");
};

export const deleteDriverController: TypedHandler<DeleteDriverType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Driver id is required");
    }

    const existing = await prisma.driver.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existing) {
        throw AppError.notFound("Driver not found.");
    }

    const driver = await prisma.driver.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { driver }, "Driver successfully deleted.");
};

export const getDriverController: TypedHandler<GetDriverType> = async (request, reply) => {
    const data = request.body;

    if (!data?.id) {
        throw AppError.badRequest("Driver id is required");
    }

    const driver = await prisma.driver.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            trips: { where: { deletedAt: null }, take: 5, orderBy: { createdAt: "desc" } },
        },
    });
    if (!driver) {
        throw AppError.notFound("Driver not found.");
    }

    return success(reply, { driver }, "Driver successfully fetched.");
};

export const getDriversController: TypedHandler<unknown, unknown, PaginationQuery> = async (request, reply) => {
    const { page, limit, skip } = buildPaginationQuery(request.query);
    const searchFilter = buildSearchFilter(request.query.search, ["name", "licenseNumber", "phoneNumber", "notes"]);

    const where = {
        deletedAt: null,
        ...searchFilter,
    };

    const [drivers, total] = await Promise.all([
        prisma.driver.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: "asc" },
        }),
        prisma.driver.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, drivers, meta, "Drivers successfully fetched.");
};
