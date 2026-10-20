import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationQuery } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import {
    CreateVehicleType,
    UpdateVehicleType,
    DeleteVehicleType,
    GetVehicleType,
} from "./vehicleSchema";

export const createVehicleController: TypedHandler<CreateVehicleType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existing = await prisma.vehicle.findFirst({
        where: { plateNumber: data.plateNumber },
    });
    if (existing) {
        throw AppError.conflict("Vehicle with this plate number already exists.");
    }

    const vehicle = await prisma.vehicle.create({
        data: {
            plateNumber:     data.plateNumber,
            model:           data.model,
            brand:           data.brand,
            type:            data.type ?? "truck",
            year:            data.year ?? undefined,
            capacity:        data.capacity ?? undefined,
            status:          data.status ?? "AVAILABLE",
            fuelType:        data.fuelType ?? undefined,
            currentOdometer: data.currentOdometer ?? 0,
            notes:           data.notes ?? undefined,
            createdAt:       new Date(),
            updatedAt:       new Date(),
            createdBy:       user.id,
            updatedBy:       user.id,
        },
    });

    return created(reply, { vehicle }, "Vehicle successfully created.");
};

export const updateVehicleController: TypedHandler<UpdateVehicleType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Vehicle id is required");
    }

    const existing = await prisma.vehicle.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existing) {
        throw AppError.notFound("Vehicle not found.");
    }

    if (data.plateNumber && data.plateNumber !== existing.plateNumber) {
        const duplicate = await prisma.vehicle.findFirst({
            where: { plateNumber: data.plateNumber, id: { not: data.id } },
        });
        if (duplicate) {
            throw AppError.conflict("Vehicle with this plate number already exists.");
        }
    }

    const vehicle = await prisma.vehicle.update({
        where: { id: data.id },
        data: {
            ...(data.plateNumber     !== undefined && { plateNumber: data.plateNumber }),
            ...(data.model           !== undefined && { model: data.model }),
            ...(data.brand           !== undefined && { brand: data.brand }),
            ...(data.type            !== undefined && { type: data.type }),
            ...(data.year            !== undefined && { year: data.year }),
            ...(data.capacity        !== undefined && { capacity: data.capacity }),
            ...(data.status          !== undefined && { status: data.status }),
            ...(data.fuelType        !== undefined && { fuelType: data.fuelType }),
            ...(data.currentOdometer !== undefined && { currentOdometer: data.currentOdometer }),
            ...(data.notes           !== undefined && { notes: data.notes }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { vehicle }, "Vehicle successfully updated.");
};

export const deleteVehicleController: TypedHandler<DeleteVehicleType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Vehicle id is required");
    }

    const existing = await prisma.vehicle.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existing) {
        throw AppError.notFound("Vehicle not found.");
    }

    const vehicle = await prisma.vehicle.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { vehicle }, "Vehicle successfully deleted.");
};

export const getVehicleController: TypedHandler<GetVehicleType> = async (request, reply) => {
    const data = request.body;

    if (!data?.id) {
        throw AppError.badRequest("Vehicle id is required");
    }

    const vehicle = await prisma.vehicle.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            trips:    { where: { deletedAt: null }, take: 5, orderBy: { createdAt: "desc" } },
            fuelLogs: { where: { deletedAt: null }, take: 5, orderBy: { date: "desc" } },
        },
    });
    if (!vehicle) {
        throw AppError.notFound("Vehicle not found.");
    }

    return success(reply, { vehicle }, "Vehicle successfully fetched.");
};

export const getVehiclesController: TypedHandler<unknown, unknown, PaginationQuery> = async (request, reply) => {
    const { page, limit, skip } = buildPaginationQuery(request.query);
    const searchFilter = buildSearchFilter(request.query.search, ["plateNumber", "model", "brand", "notes"]);

    const where = {
        deletedAt: null,
        ...searchFilter,
    };

    const [vehicles, total] = await Promise.all([
        prisma.vehicle.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.vehicle.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, vehicles, meta, "Vehicles successfully fetched.");
};
