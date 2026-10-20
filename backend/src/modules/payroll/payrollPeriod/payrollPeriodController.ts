import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationQuery } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import {
    CreatePayrollPeriodType,
    UpdatePayrollPeriodType,
    DeletePayrollPeriodType,
    GetPayrollPeriodType,
} from "./payrollPeriodSchema";

export const createPayrollPeriodController: TypedHandler<CreatePayrollPeriodType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const payrollPeriod = await prisma.payrollPeriod.create({
        data: {
            name:        data.name,
            frequency:   data.frequency ?? "monthly",
            startDate:   new Date(data.startDate),
            endDate:     new Date(data.endDate),
            paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
            status:      data.status ?? "DRAFT",
            notes:       data.notes ?? undefined,
            createdAt:   new Date(),
            updatedAt:   new Date(),
            createdBy:   user.id,
            updatedBy:   user.id,
        },
    });

    return created(reply, { payrollPeriod }, "Payroll period successfully created.");
};

export const updatePayrollPeriodController: TypedHandler<UpdatePayrollPeriodType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Period id is required");
    }

    const existing = await prisma.payrollPeriod.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existing) {
        throw AppError.notFound("Payroll period not found.");
    }

    const payrollPeriod = await prisma.payrollPeriod.update({
        where: { id: data.id },
        data: {
            ...(data.name        !== undefined && { name: data.name }),
            ...(data.frequency   !== undefined && { frequency: data.frequency }),
            ...(data.startDate   !== undefined && { startDate: new Date(data.startDate) }),
            ...(data.endDate     !== undefined && { endDate: new Date(data.endDate) }),
            ...(data.paymentDate !== undefined && { paymentDate: data.paymentDate ? new Date(data.paymentDate) : null }),
            ...(data.status      !== undefined && { status: data.status }),
            ...(data.notes       !== undefined && { notes: data.notes }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { payrollPeriod }, "Payroll period successfully updated.");
};

export const deletePayrollPeriodController: TypedHandler<DeletePayrollPeriodType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Period id is required");
    }

    const existing = await prisma.payrollPeriod.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existing) {
        throw AppError.notFound("Payroll period not found.");
    }

    const payrollPeriod = await prisma.payrollPeriod.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { payrollPeriod }, "Payroll period successfully deleted.");
};

export const getPayrollPeriodController: TypedHandler<GetPayrollPeriodType> = async (request, reply) => {
    const data = request.body;

    if (!data?.id) {
        throw AppError.badRequest("Period id is required");
    }

    const payrollPeriod = await prisma.payrollPeriod.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            salaryRecords: {
                where: { deletedAt: null },
                include: {
                    employee: {
                        include: {
                            profile: true,
                            position: true,
                        },
                    },
                },
            },
        },
    });
    if (!payrollPeriod) {
        throw AppError.notFound("Payroll period not found.");
    }

    return success(reply, { payrollPeriod }, "Payroll period successfully fetched.");
};

export const getPayrollPeriodsController: TypedHandler<unknown, unknown, PaginationQuery> = async (request, reply) => {
    const { page, limit, skip } = buildPaginationQuery(request.query);
    const searchFilter = buildSearchFilter(request.query.search, ["name", "notes"]);

    const where = {
        deletedAt: null,
        ...searchFilter,
    };

    const [payrollPeriods, total] = await Promise.all([
        prisma.payrollPeriod.findMany({
            where,
            skip,
            take: limit,
            orderBy: { startDate: "desc" },
            include: {
                _count: {
                    select: { salaryRecords: true },
                },
            },
        }),
        prisma.payrollPeriod.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, payrollPeriods, meta, "Payroll periods successfully fetched.");
};
