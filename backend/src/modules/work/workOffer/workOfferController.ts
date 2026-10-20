import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationQuery } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import {
    CreateWorkOfferType,
    UpdateWorkOfferType,
    DeleteWorkOfferType,
    GetWorkOfferType,
} from "./workOfferSchema";

export const createWorkOfferController: TypedHandler<CreateWorkOfferType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existingCustomer = await prisma.customer.findFirst({
        where: { id: data.customerId, deletedAt: null },
    });
    if (!existingCustomer) {
        throw AppError.notFound("Customer not found.");
    }

    const existingOffer = await prisma.workOffer.findFirst({
        where: { offerNumber: data.offerNumber },
    });
    if (existingOffer) {
        throw AppError.conflict("Offer number already exists.");
    }

    const workOffer = await prisma.workOffer.create({
        data: {
            offerNumber:        data.offerNumber,
            customerId:         data.customerId,
            currency:           data.currency ?? "IDR",
            notes:              data.notes ?? undefined,
            dateIssued:         new Date(data.dateIssued),
            validUntil:         new Date(data.validUntil),
            status:             data.status,
            totalPrice:         data.totalPrice,
            includeOverhead:    data.includeOverhead ?? false,
            overHeadPercentage: data.overHeadPercentage,
            overHeadAmount:     data.overHeadAmount,
            includeProfit:      data.includeProfit ?? false,
            profitPercentage:   data.profitPercentage,
            profitAmount:       data.profitAmount,
            includeDiscount:    data.includeDiscount ?? false,
            discountPercentage: data.discountPercentage,
            discountAmount:     data.discountAmount,
            includeTax:         data.includeTax ?? false,
            taxPercentage:      data.taxPercentage,
            taxAmount:          data.taxAmount,
            grandTotal:         data.grandTotal,
            createdAt:          new Date(),
            updatedAt:          new Date(),
            createdBy:          user.id,
            updatedBy:          user.id,
        },
        include: {
            workOfferCustomer: true,
            workOfferItem:     true,
        },
    });

    return created(reply, { workOffer }, "WorkOffer successfully created.");
};

export const updateWorkOfferController: TypedHandler<UpdateWorkOfferType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("WorkOffer id is required");
    }

    const existingWorkOffer = await prisma.workOffer.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingWorkOffer) {
        throw AppError.notFound("WorkOffer not found.");
    }

    if (data.customerId !== undefined) {
        const existingCustomer = await prisma.customer.findFirst({
            where: { id: data.customerId, deletedAt: null },
        });
        if (!existingCustomer) {
            throw AppError.notFound("Customer not found.");
        }
    }

    if (data.offerNumber && data.offerNumber !== existingWorkOffer.offerNumber) {
        const duplicate = await prisma.workOffer.findFirst({
            where: { offerNumber: data.offerNumber, id: { not: data.id } },
        });
        if (duplicate) {
            throw AppError.conflict("Offer number already exists.");
        }
    }

    const workOffer = await prisma.workOffer.update({
        where: { id: data.id },
        data: {
            ...(data.offerNumber        !== undefined && { offerNumber: data.offerNumber }),
            ...(data.customerId         !== undefined && { customerId: data.customerId }),
            ...(data.currency           !== undefined && { currency: data.currency }),
            ...(data.notes              !== undefined && { notes: data.notes }),
            ...(data.dateIssued         !== undefined && { dateIssued: new Date(data.dateIssued) }),
            ...(data.validUntil         !== undefined && { validUntil: new Date(data.validUntil) }),
            ...(data.status             !== undefined && { status: data.status }),
            ...(data.totalPrice         !== undefined && { totalPrice: data.totalPrice }),
            ...(data.includeOverhead    !== undefined && { includeOverhead: data.includeOverhead }),
            ...(data.overHeadPercentage !== undefined && { overHeadPercentage: data.overHeadPercentage }),
            ...(data.overHeadAmount     !== undefined && { overHeadAmount: data.overHeadAmount }),
            ...(data.includeProfit      !== undefined && { includeProfit: data.includeProfit }),
            ...(data.profitPercentage   !== undefined && { profitPercentage: data.profitPercentage }),
            ...(data.profitAmount       !== undefined && { profitAmount: data.profitAmount }),
            ...(data.includeDiscount    !== undefined && { includeDiscount: data.includeDiscount }),
            ...(data.discountPercentage !== undefined && { discountPercentage: data.discountPercentage }),
            ...(data.discountAmount     !== undefined && { discountAmount: data.discountAmount }),
            ...(data.includeTax         !== undefined && { includeTax: data.includeTax }),
            ...(data.taxPercentage      !== undefined && { taxPercentage: data.taxPercentage }),
            ...(data.taxAmount          !== undefined && { taxAmount: data.taxAmount }),
            ...(data.grandTotal         !== undefined && { grandTotal: data.grandTotal }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: {
            workOfferCustomer: true,
            workOfferItem:     true,
        },
    });

    return success(reply, { workOffer }, "WorkOffer successfully updated.");
};

export const deleteWorkOfferController: TypedHandler<DeleteWorkOfferType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("WorkOffer id is required");
    }

    const existingWorkOffer = await prisma.workOffer.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingWorkOffer) {
        throw AppError.notFound("WorkOffer not found.");
    }

    const workOffer = await prisma.workOffer.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { workOffer }, "WorkOffer successfully deleted.");
};

export const getWorkOfferController: TypedHandler<GetWorkOfferType> = async (request, reply) => {
    const data = request.body;

    if (!data?.id) {
        throw AppError.badRequest("WorkOffer id is required");
    }

    const workOffer = await prisma.workOffer.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            workOfferCustomer: true,
            workOfferItem: {
                include: { work: true },
            },
        },
    });
    if (!workOffer) {
        throw AppError.notFound("WorkOffer not found.");
    }

    return success(reply, { workOffer }, "WorkOffer successfully fetched.");
};

export const getWorkOffersController: TypedHandler<unknown, unknown, PaginationQuery> = async (request, reply) => {
    const { page, limit, skip } = buildPaginationQuery(request.query);
    const searchFilter = buildSearchFilter(request.query.search, ["offerNumber", "notes"]);

    const where = {
        deletedAt: null,
        ...searchFilter,
    };

    const [workOffers, total] = await Promise.all([
        prisma.workOffer.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                workOfferCustomer: true,
                workOfferItem:     true,
            },
        }),
        prisma.workOffer.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, workOffers, meta, "WorkOffers successfully fetched.");
};
