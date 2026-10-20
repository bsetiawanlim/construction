import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { success, created, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationParams } from "../../../utils/pagination";
import { CreateEquipmentEntityType, UpdateEquipmentEntityType, GetEquipmentDepreciationType } from "./equipmentEntitySchema";

export interface DepreciationScheduleItem {
    year: number;
    beginningBookValue: number;
    depreciationExpense: number;
    accumulatedDepreciation: number;
    endingBookValue: number;
    percentDepreciated: number;
}

export interface DepreciationCalculationResult {
    cost: number;
    salvageValue: number;
    usefulLifeYears: number;
    depreciationMethod: string;
    acquisitionDate: string;
    asOfDate: string;
    ageMonths: number;
    depreciableBase: number;
    annualDepreciation: number;
    monthlyDepreciation: number;
    accumulatedDepreciation: number;
    currentBookValue: number;
    percentDepreciated: number;
    isFullyDepreciated: boolean;
    remainingLifeMonths: number;
    schedule: DepreciationScheduleItem[];
}

export function computeEquipmentDepreciation(
    costNum: number,
    salvageNum: number,
    usefulLife: number,
    method: string,
    acqDate: Date,
    targetDate: Date = new Date()
): DepreciationCalculationResult {
    const cost = Math.max(0, Number(costNum) || 0);
    const salvageValue = Math.min(cost, Math.max(0, Number(salvageNum) || 0));
    const usefulLifeYears = Math.max(1, Number(usefulLife) || 5);
    const depreciationMethod = method === "DOUBLE_DECLINING" ? "DOUBLE_DECLINING" : "STRAIGHT_LINE";
    const depreciableBase = Math.max(0, cost - salvageValue);

    // Calculate age in months
    const acqYear = acqDate.getFullYear();
    const acqMonth = acqDate.getMonth();
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    const rawMonths = (targetYear - acqYear) * 12 + (targetMonth - acqMonth);
    const ageMonths = Math.max(0, rawMonths);

    const schedule: DepreciationScheduleItem[] = [];
    let currentBookVal = cost;
    let totalAccDep = 0;

    if (depreciationMethod === "STRAIGHT_LINE") {
        const annualDep = depreciableBase / usefulLifeYears;
        const monthlyDep = annualDep / 12;

        for (let yr = 1; yr <= usefulLifeYears; yr++) {
            const startVal = currentBookVal;
            const expense = Math.min(startVal - salvageValue, annualDep);
            const endVal = Math.max(salvageValue, startVal - expense);
            const acc = totalAccDep + expense;
            totalAccDep = acc;
            currentBookVal = endVal;

            schedule.push({
                year: yr,
                beginningBookValue: Number(startVal.toFixed(2)),
                depreciationExpense: Number(expense.toFixed(2)),
                accumulatedDepreciation: Number(acc.toFixed(2)),
                endingBookValue: Number(endVal.toFixed(2)),
                percentDepreciated: depreciableBase > 0 ? Number(((acc / depreciableBase) * 100).toFixed(1)) : 100,
            });
        }

        const elapsedDep = Math.min(depreciableBase, monthlyDep * ageMonths);
        const currentNBV = Math.max(salvageValue, cost - elapsedDep);
        const remMonths = Math.max(0, (usefulLifeYears * 12) - ageMonths);

        return {
            cost: Number(cost.toFixed(2)),
            salvageValue: Number(salvageValue.toFixed(2)),
            usefulLifeYears,
            depreciationMethod,
            acquisitionDate: acqDate.toISOString(),
            asOfDate: targetDate.toISOString(),
            ageMonths,
            depreciableBase: Number(depreciableBase.toFixed(2)),
            annualDepreciation: Number(annualDep.toFixed(2)),
            monthlyDepreciation: Number(monthlyDep.toFixed(2)),
            accumulatedDepreciation: Number(elapsedDep.toFixed(2)),
            currentBookValue: Number(currentNBV.toFixed(2)),
            percentDepreciated: depreciableBase > 0 ? Number(((elapsedDep / depreciableBase) * 100).toFixed(1)) : 100,
            isFullyDepreciated: elapsedDep >= depreciableBase,
            remainingLifeMonths: remMonths,
            schedule,
        };
    } else {
        // DOUBLE DECLINING BALANCE
        const straightLineRate = 1 / usefulLifeYears;
        const ddbRate = Math.min(1, straightLineRate * 2);

        for (let yr = 1; yr <= usefulLifeYears; yr++) {
            const startVal = currentBookVal;
            let expense = startVal * ddbRate;
            if (startVal - expense < salvageValue) {
                expense = Math.max(0, startVal - salvageValue);
            }
            if (yr === usefulLifeYears) {
                expense = Math.max(0, startVal - salvageValue);
            }

            const endVal = Math.max(salvageValue, startVal - expense);
            const acc = totalAccDep + expense;
            totalAccDep = acc;
            currentBookVal = endVal;

            schedule.push({
                year: yr,
                beginningBookValue: Number(startVal.toFixed(2)),
                depreciationExpense: Number(expense.toFixed(2)),
                accumulatedDepreciation: Number(acc.toFixed(2)),
                endingBookValue: Number(endVal.toFixed(2)),
                percentDepreciated: depreciableBase > 0 ? Number(((acc / depreciableBase) * 100).toFixed(1)) : 100,
            });
        }

        let elapsedDep = 0;
        let remainingMonthsToSimulate = ageMonths;

        for (const item of schedule) {
            if (remainingMonthsToSimulate <= 0) break;
            const monthsInThisYear = Math.min(12, remainingMonthsToSimulate);
            const portionOfYear = monthsInThisYear / 12;
            const depThisPeriod = item.depreciationExpense * portionOfYear;
            elapsedDep += depThisPeriod;
            remainingMonthsToSimulate -= monthsInThisYear;
        }

        elapsedDep = Math.min(depreciableBase, Math.max(0, elapsedDep));
        const currentNBV = Math.max(salvageValue, cost - elapsedDep);
        const remMonths = Math.max(0, (usefulLifeYears * 12) - ageMonths);
        const annualDep = schedule.length > 0 ? (schedule[0]?.depreciationExpense ?? 0) : 0;
        const monthlyDep = annualDep / 12;

        return {
            cost: Number(cost.toFixed(2)),
            salvageValue: Number(salvageValue.toFixed(2)),
            usefulLifeYears,
            depreciationMethod,
            acquisitionDate: acqDate.toISOString(),
            asOfDate: targetDate.toISOString(),
            ageMonths,
            depreciableBase: Number(depreciableBase.toFixed(2)),
            annualDepreciation: Number(annualDep.toFixed(2)),
            monthlyDepreciation: Number(monthlyDep.toFixed(2)),
            accumulatedDepreciation: Number(elapsedDep.toFixed(2)),
            currentBookValue: Number(currentNBV.toFixed(2)),
            percentDepreciated: depreciableBase > 0 ? Number(((elapsedDep / depreciableBase) * 100).toFixed(1)) : 100,
            isFullyDepreciated: elapsedDep >= depreciableBase,
            remainingLifeMonths: remMonths,
            schedule,
        };
    }
}

export async function createEquipmentEntityController(
    request: FastifyRequest<{ Body: CreateEquipmentEntityType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    if (data.brandId) {
        const brandExists = await prisma.equipmentBrand.findFirst({ where: { id: data.brandId, deletedAt: null } });
        if (!brandExists) throw AppError.notFound("Equipment brand not found.");
    }

    if (data.modelId) {
        const modelExists = await prisma.equipmentModel.findFirst({ where: { id: data.modelId, deletedAt: null } });
        if (!modelExists) throw AppError.notFound("Equipment model not found.");
    }

    const equipmentEntity = await prisma.equipmentEntity.create({
        data: {
            equipmentTypeId: data.equipmentTypeId ?? null,
            brandId: data.brandId ?? null,
            modelId: data.modelId ?? null,
            code: data.code ?? null,
            name: data.name,
            description: data.description ?? null,
            unitId: data.unitId ?? null,
            unitPrice: data.unitPrice,
            salvageValue: data.salvageValue !== undefined && data.salvageValue !== null ? data.salvageValue : 0,
            usefulLifeYears: data.usefulLifeYears !== undefined && data.usefulLifeYears !== null ? data.usefulLifeYears : 5,
            depreciationMethod: data.depreciationMethod || "STRAIGHT_LINE",
            acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : new Date(),
            createdBy: user.id,
            updatedBy: user.id,
        },
        include: {
            brand: true,
            model: true,
            equipmentFeature: true,
            equipmentMaintenance: true,
        },
    });

    const cost = Number(equipmentEntity.unitPrice);
    const salvage = Number(equipmentEntity.salvageValue ?? 0);
    const usefulLife = equipmentEntity.usefulLifeYears ?? 5;
    const method = equipmentEntity.depreciationMethod || "STRAIGHT_LINE";
    const acqDate = equipmentEntity.acquisitionDate ? new Date(equipmentEntity.acquisitionDate) : equipmentEntity.createdAt;
    const depreciation = computeEquipmentDepreciation(cost, salvage, usefulLife, method, acqDate);

    return created(reply, { ...equipmentEntity, depreciation }, "Equipment entity successfully created.");
}

export async function updateEquipmentEntityController(
    request: FastifyRequest<{ Body: UpdateEquipmentEntityType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existing = await prisma.equipmentEntity.findFirst({ where: { id: data.id, deletedAt: null } });
    if (!existing) {
        throw AppError.notFound("Equipment entity not found.");
    }

    if (data.brandId) {
        const brandExists = await prisma.equipmentBrand.findFirst({ where: { id: data.brandId, deletedAt: null } });
        if (!brandExists) throw AppError.notFound("Equipment brand not found.");
    }

    if (data.modelId) {
        const modelExists = await prisma.equipmentModel.findFirst({ where: { id: data.modelId, deletedAt: null } });
        if (!modelExists) throw AppError.notFound("Equipment model not found.");
    }

    const equipmentEntity = await prisma.equipmentEntity.update({
        where: { id: data.id },
        data: {
            ...(data.equipmentTypeId !== undefined && { equipmentTypeId: data.equipmentTypeId }),
            ...(data.code !== undefined && { code: data.code }),
            ...(data.name !== undefined && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.unitId !== undefined && { unitId: data.unitId }),
            ...(data.unitPrice !== undefined && { unitPrice: data.unitPrice }),
            ...(data.salvageValue !== undefined && { salvageValue: data.salvageValue }),
            ...(data.usefulLifeYears !== undefined && { usefulLifeYears: data.usefulLifeYears }),
            ...(data.depreciationMethod !== undefined && { depreciationMethod: data.depreciationMethod }),
            ...(data.acquisitionDate !== undefined && { acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : null }),
            ...(data.brandId !== undefined && { brandId: data.brandId }),
            ...(data.modelId !== undefined && { modelId: data.modelId }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: {
            brand: true,
            model: true,
            equipmentFeature: true,
            equipmentMaintenance: true,
        },
    });

    const cost = Number(equipmentEntity.unitPrice);
    const salvage = Number(equipmentEntity.salvageValue ?? 0);
    const usefulLife = equipmentEntity.usefulLifeYears ?? 5;
    const method = equipmentEntity.depreciationMethod || "STRAIGHT_LINE";
    const acqDate = equipmentEntity.acquisitionDate ? new Date(equipmentEntity.acquisitionDate) : equipmentEntity.createdAt;
    const depreciation = computeEquipmentDepreciation(cost, salvage, usefulLife, method, acqDate);

    return success(reply, { ...equipmentEntity, depreciation }, "Equipment entity successfully updated.");
}

export async function deleteEquipmentEntityController(
    request: FastifyRequest<{ Body: { id: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existing = await prisma.equipmentEntity.findFirst({ where: { id: data.id, deletedAt: null } });
    if (!existing) {
        throw AppError.notFound("Equipment entity not found.");
    }

    const equipmentEntity = await prisma.equipmentEntity.update({
        where: { id: data.id },
        data: { deletedAt: new Date(), updatedAt: new Date(), updatedBy: user.id },
    });

    return success(reply, equipmentEntity, "Equipment entity successfully deleted.");
}

export async function getEquipmentEntityController(
    request: FastifyRequest<{ Body: { id: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const equipmentEntity = await prisma.equipmentEntity.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            brand: true,
            model: { include: { type: true, equipmentModelFeature: true } },
            equipmentFeature: true,
            equipmentMaintenance: true,
            workEquipment: true,
            prices: true,
        },
    });

    if (!equipmentEntity) {
        throw AppError.notFound("Equipment entity not found.");
    }

    const cost = Number(equipmentEntity.unitPrice);
    const salvage = Number(equipmentEntity.salvageValue ?? 0);
    const usefulLife = equipmentEntity.usefulLifeYears ?? 5;
    const method = equipmentEntity.depreciationMethod || "STRAIGHT_LINE";
    const acqDate = equipmentEntity.acquisitionDate ? new Date(equipmentEntity.acquisitionDate) : equipmentEntity.createdAt;
    const depreciation = computeEquipmentDepreciation(cost, salvage, usefulLife, method, acqDate);

    return success(reply, { ...equipmentEntity, depreciation }, "Equipment entity successfully retrieved.");
}

export async function getEquipmentDepreciationController(
    request: FastifyRequest<{ Body: GetEquipmentDepreciationType }>,
    reply: FastifyReply
) {
    const { id, asOfDate } = request.body;
    const equipmentEntity = await prisma.equipmentEntity.findFirst({
        where: { id, deletedAt: null },
        include: {
            brand: true,
            model: true,
        },
    });

    if (!equipmentEntity) {
        throw AppError.notFound("Equipment entity not found.");
    }

    const cost = Number(equipmentEntity.unitPrice);
    const salvage = Number(equipmentEntity.salvageValue ?? 0);
    const usefulLife = equipmentEntity.usefulLifeYears ?? 5;
    const method = equipmentEntity.depreciationMethod || "STRAIGHT_LINE";
    const acqDate = equipmentEntity.acquisitionDate ? new Date(equipmentEntity.acquisitionDate) : equipmentEntity.createdAt;
    const targetDate = asOfDate ? new Date(asOfDate) : new Date();

    const calculation = computeEquipmentDepreciation(cost, salvage, usefulLife, method, acqDate, targetDate);

    return success(reply, {
        equipment: equipmentEntity,
        depreciation: calculation,
    }, "Equipment depreciation calculated successfully.");
}

export async function getAllEquipmentEntitiesController(
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
        "name",
        "code",
        "description",
        "brand.name",
        "model.name"
    ]);

    const where: any = {
        deletedAt: null,
        ...(searchFilter ? { OR: searchFilter } : {})
    };

    const [equipmentEntities, total] = await Promise.all([
        prisma.equipmentEntity.findMany({
            where,
            skip,
            take,
            orderBy,
            include: {
                brand: true,
                model: { include: { type: true } },
                equipmentFeature: true,
                equipmentMaintenance: true,
                prices: true,
            },
        }),
        prisma.equipmentEntity.count({ where })
    ]);

    const enriched = equipmentEntities.map((eq) => {
        const cost = Number(eq.unitPrice);
        const salvage = Number(eq.salvageValue ?? 0);
        const usefulLife = eq.usefulLifeYears ?? 5;
        const method = eq.depreciationMethod || "STRAIGHT_LINE";
        const acqDate = eq.acquisitionDate ? new Date(eq.acquisitionDate) : eq.createdAt;
        const depreciation = computeEquipmentDepreciation(cost, salvage, usefulLife, method, acqDate);
        return {
            ...eq,
            depreciation,
        };
    });

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, enriched, meta, "Equipment entities successfully retrieved.", "equipmentEntities");
}

