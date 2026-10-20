import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationQuery } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import {
    CreatePayrollComponentType,
    UpdatePayrollComponentType,
    DeletePayrollComponentType,
    GetPayrollComponentType,
} from "./payrollComponentSchema";

export const createPayrollComponentController: TypedHandler<CreatePayrollComponentType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existing = await prisma.payrollComponent.findFirst({
        where: { name: data.name, deletedAt: null },
    });
    if (existing) {
        throw AppError.conflict("Payroll component with this name already exists.");
    }

    const payrollComponent = await prisma.payrollComponent.create({
        data: {
            name:            data.name,
            type:            data.type,
            calculationType: data.calculationType,
            defaultAmount:   data.defaultAmount ?? 0,
            isTaxable:       data.isTaxable ?? true,
            description:     data.description ?? undefined,
            createdAt:       new Date(),
            updatedAt:       new Date(),
            createdBy:       user.id,
            updatedBy:       user.id,
        },
    });

    return created(reply, { payrollComponent }, "Payroll component successfully created.");
};

export const updatePayrollComponentController: TypedHandler<UpdatePayrollComponentType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Component id is required");
    }

    const existing = await prisma.payrollComponent.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existing) {
        throw AppError.notFound("Payroll component not found.");
    }

    if (data.name && data.name !== existing.name) {
        const duplicate = await prisma.payrollComponent.findFirst({
            where: { name: data.name, id: { not: data.id }, deletedAt: null },
        });
        if (duplicate) {
            throw AppError.conflict("Payroll component with this name already exists.");
        }
    }

    const payrollComponent = await prisma.payrollComponent.update({
        where: { id: data.id },
        data: {
            ...(data.name            !== undefined && { name: data.name }),
            ...(data.type            !== undefined && { type: data.type }),
            ...(data.calculationType !== undefined && { calculationType: data.calculationType }),
            ...(data.defaultAmount   !== undefined && { defaultAmount: data.defaultAmount }),
            ...(data.isTaxable       !== undefined && { isTaxable: data.isTaxable }),
            ...(data.description     !== undefined && { description: data.description }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { payrollComponent }, "Payroll component successfully updated.");
};

export const deletePayrollComponentController: TypedHandler<DeletePayrollComponentType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Component id is required");
    }

    const existing = await prisma.payrollComponent.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existing) {
        throw AppError.notFound("Payroll component not found.");
    }

    const payrollComponent = await prisma.payrollComponent.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { payrollComponent }, "Payroll component successfully deleted.");
};

export const getPayrollComponentController: TypedHandler<GetPayrollComponentType> = async (request, reply) => {
    const data = request.body;

    if (!data?.id) {
        throw AppError.badRequest("Component id is required");
    }

    const payrollComponent = await prisma.payrollComponent.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!payrollComponent) {
        throw AppError.notFound("Payroll component not found.");
    }

    return success(reply, { payrollComponent }, "Payroll component successfully fetched.");
};

export const getPayrollComponentsController: TypedHandler<unknown, unknown, PaginationQuery> = async (request, reply) => {
    const { page, limit, skip } = buildPaginationQuery(request.query);
    const searchFilter = buildSearchFilter(request.query.search, ["name", "description"]);

    const where = {
        deletedAt: null,
        ...searchFilter,
    };

    const [payrollComponents, total] = await Promise.all([
        prisma.payrollComponent.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: "asc" },
        }),
        prisma.payrollComponent.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, payrollComponents, meta, "Payroll components successfully fetched.");
};
