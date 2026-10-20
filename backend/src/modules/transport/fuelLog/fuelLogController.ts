import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import {
    CreateFuelLogType,
    UpdateFuelLogType,
    DeleteFuelLogType,
    GetFuelLogType,
    GetFuelLogsQueryType,
} from "./fuelLogSchema";

export const createFuelLogController: TypedHandler<CreateFuelLogType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const vehicle = await prisma.vehicle.findFirst({
        where: { id: data.vehicleId, deletedAt: null },
    });
    if (!vehicle) {
        throw AppError.notFound("Vehicle not found.");
    }

    if (data.tripId) {
        const trip = await prisma.trip.findFirst({
            where: { id: data.tripId, deletedAt: null },
        });
        if (!trip) {
            throw AppError.notFound("Trip not found.");
        }
    }

    // Auto calculate total cost if not explicitly provided
    const totalCost = data.totalCost !== undefined && data.totalCost !== null
        ? data.totalCost
        : data.liters * data.pricePerLiter;

    const fuelLog = await prisma.fuelLog.create({
        data: {
            vehicleId:     data.vehicleId,
            tripId:        data.tripId ?? null,
            date:          data.date ? new Date(data.date) : new Date(),
            odometer:      data.odometer !== undefined && data.odometer !== null ? data.odometer : null,
            liters:        data.liters,
            pricePerLiter: data.pricePerLiter,
            totalCost:     totalCost,
            gasStation:    data.gasStation ?? null,
            receiptNumber: data.receiptNumber ?? null,
            notes:         data.notes ?? null,
            createdBy:     user.id,
        },
    });

    // Update vehicle odometer if fuel log odometer is greater
    if (data.odometer !== undefined && data.odometer !== null) {
        const currentOdo = vehicle.currentOdometer ? Number(vehicle.currentOdometer) : 0;
        if (data.odometer > currentOdo) {
            await prisma.vehicle.update({
                where: { id: vehicle.id },
                data: {
                    currentOdometer: data.odometer,
                    updatedAt: new Date(),
                    updatedBy: user.id,
                },
            });
        }
    }

    return created(reply, { fuelLog }, "Fuel log successfully created.");
};

export const updateFuelLogController: TypedHandler<UpdateFuelLogType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Fuel log id is required");
    }

    const existingLog = await prisma.fuelLog.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingLog) {
        throw AppError.notFound("Fuel log not found.");
    }

    if (data.vehicleId && data.vehicleId !== existingLog.vehicleId) {
        const vehicle = await prisma.vehicle.findFirst({
            where: { id: data.vehicleId, deletedAt: null },
        });
        if (!vehicle) {
            throw AppError.notFound("Vehicle not found.");
        }
    }

    if (data.tripId !== undefined && data.tripId !== null && data.tripId !== existingLog.tripId) {
        const trip = await prisma.trip.findFirst({
            where: { id: data.tripId, deletedAt: null },
        });
        if (!trip) {
            throw AppError.notFound("Trip not found.");
        }
    }

    const newLiters = data.liters !== undefined ? data.liters : Number(existingLog.liters);
    const newPricePerLiter = data.pricePerLiter !== undefined ? data.pricePerLiter : Number(existingLog.pricePerLiter);
    let newTotalCost = data.totalCost !== undefined ? data.totalCost : undefined;

    if (newTotalCost === undefined && (data.liters !== undefined || data.pricePerLiter !== undefined)) {
        newTotalCost = newLiters * newPricePerLiter;
    }

    const fuelLog = await prisma.fuelLog.update({
        where: { id: data.id },
        data: {
            vehicleId:     data.vehicleId ?? undefined,
            tripId:        data.tripId !== undefined ? data.tripId : undefined,
            date:          data.date ? new Date(data.date) : undefined,
            odometer:      data.odometer !== undefined ? data.odometer : undefined,
            liters:        data.liters !== undefined ? data.liters : undefined,
            pricePerLiter: data.pricePerLiter !== undefined ? data.pricePerLiter : undefined,
            totalCost:     newTotalCost !== undefined ? newTotalCost : undefined,
            gasStation:    data.gasStation !== undefined ? data.gasStation : undefined,
            receiptNumber: data.receiptNumber !== undefined ? data.receiptNumber : undefined,
            notes:         data.notes !== undefined ? data.notes : undefined,
            updatedAt:     new Date(),
            updatedBy:     user.id,
        },
    });

    return success(reply, { fuelLog }, "Fuel log successfully updated.");
};

export const deleteFuelLogController: TypedHandler<DeleteFuelLogType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Fuel log id is required");
    }

    const existingLog = await prisma.fuelLog.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingLog) {
        throw AppError.notFound("Fuel log not found.");
    }

    const fuelLog = await prisma.fuelLog.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { fuelLog }, "Fuel log successfully deleted.");
};

export const getFuelLogController: TypedHandler<GetFuelLogType> = async (request, reply) => {
    const data = request.body;

    if (!data?.id) {
        throw AppError.badRequest("Fuel log id is required");
    }

    const fuelLog = await prisma.fuelLog.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            vehicle: true,
            trip:    true,
        },
    });
    if (!fuelLog) {
        throw AppError.notFound("Fuel log not found.");
    }

    return success(reply, { fuelLog }, "Fuel log successfully fetched.");
};

export const getFuelLogsController: TypedHandler<unknown, unknown, GetFuelLogsQueryType> = async (request, reply) => {
    const query = request.query;
    const { page, limit, skip, orderBy } = buildPaginationQuery(query);
    const searchFilter = buildSearchFilter(query?.search, ["gasStation", "receiptNumber", "notes"]);

    const where = {
        deletedAt: null,
        ...(query?.vehicleId ? { vehicleId: query.vehicleId } : {}),
        ...(query?.tripId    ? { tripId: query.tripId } : {}),
        ...(query?.startDate || query?.endDate ? {
            date: {
                ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
                ...(query.endDate   ? { lte: new Date(query.endDate) } : {}),
            }
        } : {}),
        ...(searchFilter ? { OR: searchFilter } : {}),
    };

    const [fuelLogs, total] = await Promise.all([
        prisma.fuelLog.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
                vehicle: { select: { id: true, plateNumber: true, model: true } },
                trip:    { select: { id: true, tripNumber: true, origin: true, destination: true } },
            },
        }),
        prisma.fuelLog.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, fuelLogs, meta, "Fuel logs successfully fetched.");
};
