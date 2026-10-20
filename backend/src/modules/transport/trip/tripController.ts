import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import {
    CreateTripType,
    UpdateTripType,
    DeleteTripType,
    GetTripType,
    GetTripsQueryType,
} from "./tripSchema";

export const createTripController: TypedHandler<CreateTripType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existingTrip = await prisma.trip.findFirst({
        where: { tripNumber: data.tripNumber },
    });
    if (existingTrip) {
        throw AppError.conflict("Trip with this trip number already exists.");
    }

    const vehicle = await prisma.vehicle.findFirst({
        where: { id: data.vehicleId, deletedAt: null },
    });
    if (!vehicle) {
        throw AppError.notFound("Vehicle not found.");
    }

    const driver = await prisma.driver.findFirst({
        where: { id: data.driverId, deletedAt: null },
    });
    if (!driver) {
        throw AppError.notFound("Driver not found.");
    }

    // Auto-calculate distance if start and end odometer are provided
    let calculatedDistance = data.distance;
    if (data.startOdometer !== undefined && data.startOdometer !== null &&
        data.endOdometer !== undefined && data.endOdometer !== null &&
        data.endOdometer >= data.startOdometer) {
        calculatedDistance = data.endOdometer - data.startOdometer;
    }

    const trip = await prisma.trip.create({
        data: {
            tripNumber:       data.tripNumber,
            vehicleId:        data.vehicleId,
            driverId:         data.driverId,
            origin:           data.origin,
            destination:      data.destination,
            departureTime:    data.departureTime ? new Date(data.departureTime) : undefined,
            arrivalTime:      data.arrivalTime ? new Date(data.arrivalTime) : undefined,
            startOdometer:    data.startOdometer ?? undefined,
            endOdometer:      data.endOdometer ?? undefined,
            distance:         calculatedDistance ?? undefined,
            status:           data.status ?? "SCHEDULED",
            cargoDescription: data.cargoDescription ?? undefined,
            notes:            data.notes ?? undefined,
            createdAt:        new Date(),
            updatedAt:        new Date(),
            createdBy:        user.id,
            updatedBy:        user.id,
        },
        include: {
            vehicle: true,
            driver:  true,
        },
    });

    return created(reply, { trip }, "Trip successfully created.");
};

export const updateTripController: TypedHandler<UpdateTripType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Trip id is required");
    }

    const existingTrip = await prisma.trip.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingTrip) {
        throw AppError.notFound("Trip not found.");
    }

    if (data.tripNumber && data.tripNumber !== existingTrip.tripNumber) {
        const duplicate = await prisma.trip.findFirst({
            where: { tripNumber: data.tripNumber, id: { not: data.id } },
        });
        if (duplicate) {
            throw AppError.conflict("Trip with this trip number already exists.");
        }
    }

    if (data.vehicleId) {
        const vehicle = await prisma.vehicle.findFirst({
            where: { id: data.vehicleId, deletedAt: null },
        });
        if (!vehicle) {
            throw AppError.notFound("Vehicle not found.");
        }
    }

    if (data.driverId) {
        const driver = await prisma.driver.findFirst({
            where: { id: data.driverId, deletedAt: null },
        });
        if (!driver) {
            throw AppError.notFound("Driver not found.");
        }
    }

    const startOdom = data.startOdometer !== undefined ? data.startOdometer : Number(existingTrip.startOdometer);
    const endOdom = data.endOdometer !== undefined ? data.endOdometer : Number(existingTrip.endOdometer);
    let calculatedDistance = data.distance;
    if (startOdom !== null && endOdom !== null && !isNaN(startOdom) && !isNaN(endOdom) && endOdom >= startOdom) {
        calculatedDistance = endOdom - startOdom;
    }

    const trip = await prisma.trip.update({
        where: { id: data.id },
        data: {
            ...(data.tripNumber       !== undefined && { tripNumber: data.tripNumber }),
            ...(data.vehicleId        !== undefined && { vehicleId: data.vehicleId }),
            ...(data.driverId         !== undefined && { driverId: data.driverId }),
            ...(data.origin           !== undefined && { origin: data.origin }),
            ...(data.destination      !== undefined && { destination: data.destination }),
            ...(data.departureTime    !== undefined && { departureTime: data.departureTime ? new Date(data.departureTime) : null }),
            ...(data.arrivalTime      !== undefined && { arrivalTime: data.arrivalTime ? new Date(data.arrivalTime) : null }),
            ...(data.startOdometer    !== undefined && { startOdometer: data.startOdometer }),
            ...(data.endOdometer      !== undefined && { endOdometer: data.endOdometer }),
            ...(calculatedDistance    !== undefined && { distance: calculatedDistance }),
            ...(data.status           !== undefined && { status: data.status }),
            ...(data.cargoDescription !== undefined && { cargoDescription: data.cargoDescription }),
            ...(data.notes            !== undefined && { notes: data.notes }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: {
            vehicle: true,
            driver:  true,
        },
    });

    return success(reply, { trip }, "Trip successfully updated.");
};

export const deleteTripController: TypedHandler<DeleteTripType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Trip id is required");
    }

    const existingTrip = await prisma.trip.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingTrip) {
        throw AppError.notFound("Trip not found.");
    }

    const trip = await prisma.trip.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { trip }, "Trip successfully deleted.");
};

export const getTripController: TypedHandler<GetTripType> = async (request, reply) => {
    const data = request.body;

    if (!data?.id) {
        throw AppError.badRequest("Trip id is required");
    }

    const trip = await prisma.trip.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            vehicle:  true,
            driver:   true,
            fuelLogs: { where: { deletedAt: null } },
        },
    });
    if (!trip) {
        throw AppError.notFound("Trip not found.");
    }

    return success(reply, { trip }, "Trip successfully fetched.");
};

export const getTripsController: TypedHandler<unknown, unknown, GetTripsQueryType> = async (request, reply) => {
    const query = request.query;
    const { page, limit, skip, orderBy } = buildPaginationQuery(query);
    const searchFilter = buildSearchFilter(query?.search, ["tripNumber", "origin", "destination", "cargoDescription"]);

    const where = {
        deletedAt: null,
        ...(query?.vehicleId ? { vehicleId: query.vehicleId } : {}),
        ...(query?.driverId  ? { driverId: query.driverId } : {}),
        ...(query?.status    ? { status: query.status } : {}),
        ...(searchFilter ? { OR: searchFilter } : {}),
    };

    const [trips, total] = await Promise.all([
        prisma.trip.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
                vehicle: { select: { id: true, plateNumber: true, model: true } },
                driver:  { select: { id: true, name: true, phoneNumber: true } },
            },
        }),
        prisma.trip.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, trips, meta, "Trips successfully fetched.");
};
