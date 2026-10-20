import { prisma } from "../../plugins/prisma";
import { AppError } from "../../utils/errors";
import { created, success, paginated } from "../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationQuery } from "../../utils/pagination";
import { TypedHandler } from "../../types/fastify";
import {
    baseQuantity,
    unitType,
    UnitType,
    GetUnitByQuantityType,
    ConvertUnitType,
    DeleteUnitType,
} from "./unitSchema";

export function validateFunction(stringFunction: string): boolean {
    try {
        const fn = new Function("x", "return " + stringFunction.toString());
        return Number.isFinite(fn(1));
    } catch {
        return false;
    }
}

export function validateFunctionUnit(unit: { baseQuantity: string; toBase: string; fromBase: string }) {
    if (!Object.prototype.hasOwnProperty.call(baseQuantity, unit.baseQuantity)) {
        throw AppError.badRequest(`${unit.baseQuantity} is not found in standard base quantities`);
    }
    if (!validateFunction(unit.toBase)) {
        throw AppError.badRequest(`toBase function '${unit.toBase}' is not valid.`);
    }
    if (!validateFunction(unit.fromBase)) {
        throw AppError.badRequest(`fromBase function '${unit.fromBase}' is not valid.`);
    }
    return true;
}

export async function convertToBase(unit: { toBase: string }, value: number): Promise<number> {
    const fn = new Function("x", "return " + unit.toBase.toString());
    return fn(value);
}

export async function convertFromBase(unit: { fromBase: string }, value: number): Promise<number> {
    const fn = new Function("x", "return " + unit.fromBase.toString());
    return fn(value);
}

export async function getUnitByQuantity(quantity: string) {
    return prisma.unit.findMany({
        where: {
            baseQuantity: quantity,
            deletedAt: null,
        },
    });
}

export const createUnitController: TypedHandler<UnitType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existingUnit = await prisma.unit.findFirst({
        where: {
            deletedAt: null,
            unit: data.unit,
            abbr: data.abbr,
        },
    });
    if (existingUnit) {
        throw AppError.conflict("Unit already exists");
    }

    validateFunctionUnit(data);

    const unit = await prisma.unit.create({
        data: {
            baseQuantity: data.baseQuantity,
            unit: data.unit,
            abbr: data.abbr,
            toBase: data.toBase,
            fromBase: data.fromBase,
            description: data.description ?? "",
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: user.id,
            updatedBy: user.id,
        },
    });

    return created(reply, { unit }, "Unit successfully created.");
};

export const deleteUnitController: TypedHandler<DeleteUnitType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Unit id is required");
    }

    const existingUnit = await prisma.unit.findFirst({
        where: {
            id: data.id,
            deletedAt: null,
        },
    });
    if (!existingUnit) {
        throw AppError.notFound("Unit not found.");
    }

    const products = await prisma.product.findMany({
        where: {
            unitId: data.id,
            deletedAt: null,
        },
    });
    if (products.length > 0) {
        throw AppError.badRequest(`Unit cannot be deleted because it is used by ${products.length} product(s).`);
    }

    const unit = await prisma.unit.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { unit }, "Unit successfully deleted.");
};

export const updateUnitController: TypedHandler<UnitType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Unit id is required");
    }

    const existingUnit = await prisma.unit.findFirst({
        where: {
            id: data.id,
            deletedAt: null,
        },
    });
    if (!existingUnit) {
        throw AppError.notFound("Unit not found.");
    }

    const duplicate = await prisma.unit.findFirst({
        where: {
            baseQuantity: data.baseQuantity,
            deletedAt: null,
            unit: data.unit,
            id: { not: data.id },
        },
    });
    if (duplicate) {
        throw AppError.conflict("Unit already exists.");
    }

    validateFunctionUnit(data);

    const unit = await prisma.unit.update({
        where: { id: data.id },
        data: {
            baseQuantity: data.baseQuantity,
            unit: data.unit,
            abbr: data.abbr,
            toBase: data.toBase,
            fromBase: data.fromBase,
            description: data.description !== undefined ? (data.description ?? "") : undefined,
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { unit }, "Unit successfully updated.");
};

export const getUnitsController: TypedHandler<GetUnitByQuantityType> = async (request, reply) => {
    const data = request.body;
    if (!data?.baseQuantity) {
        throw AppError.badRequest("baseQuantity is required.");
    }

    const units = await getUnitByQuantity(data.baseQuantity);
    return success(reply, { units }, "Units successfully fetched.");
};

export const getAllUnitsController: TypedHandler<unknown, unknown, PaginationQuery> = async (request, reply) => {
    const { page, limit, skip } = buildPaginationQuery(request.query);
    const searchFilter = buildSearchFilter(request.query.search, ["unit", "abbr", "baseQuantity", "description"]);

    const where = {
        deletedAt: null,
        ...searchFilter,
    };

    const [units, total] = await Promise.all([
        prisma.unit.findMany({
            where,
            skip,
            take: limit,
            orderBy: { unit: "asc" },
        }),
        prisma.unit.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, units, meta, "Units retrieved successfully");
};

export const convertUnit: TypedHandler<ConvertUnitType> = async (request, reply) => {
    const data = request.body;

    if (!data?.unitId1 || !data?.unitId2 || data.value === undefined) {
        throw AppError.badRequest("unitId1, unitId2, and value are required");
    }

    const [unit1, unit2] = await Promise.all([
        prisma.unit.findFirst({ where: { id: data.unitId1, deletedAt: null } }),
        prisma.unit.findFirst({ where: { id: data.unitId2, deletedAt: null } }),
    ]);

    if (!unit1) {
        throw AppError.notFound("First unit not found.");
    }
    if (!unit2) {
        throw AppError.notFound("Second unit not found.");
    }

    if (unit1.baseQuantity !== unit2.baseQuantity) {
        throw AppError.badRequest(`Units are not compatible: '${unit1.unit}' (${unit1.baseQuantity}) vs '${unit2.unit}' (${unit2.baseQuantity})`);
    }

    const baseValue = await convertToBase(unit1, data.value);
    const convertedValue = await convertFromBase(unit2, baseValue);

    return success(reply, {
        originalValue: data.value,
        convertedValue,
        fromUnit: unit1,
        toUnit: unit2,
    }, "Unit converted successfully.");
};
