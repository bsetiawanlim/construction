import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, PaginationQuery } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import { calculateSalary, calculateBaseSalary, ComponentInput, PayrollFrequency } from "../payrollCalculation";
import {
    GenerateSalaryRecordType,
    UpdateSalaryRecordType,
    DeleteSalaryRecordType,
    GetSalaryRecordType,
    GetSalaryRecordsByPeriodType,
} from "./salaryRecordSchema";

export const generateSalaryRecordController: TypedHandler<GenerateSalaryRecordType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existingPeriod = await prisma.payrollPeriod.findFirst({
        where: { id: data.periodId, deletedAt: null },
    });
    if (!existingPeriod) {
        throw AppError.notFound("Payroll period not found.");
    }

    const existingEmployee = await prisma.employee.findFirst({
        where: { id: data.employeeId, deletedAt: null },
    });
    if (!existingEmployee) {
        throw AppError.notFound("Employee not found.");
    }

    const duplicate = await prisma.salaryRecord.findFirst({
        where: { periodId: data.periodId, employeeId: data.employeeId, deletedAt: null },
    });
    if (duplicate && duplicate.status !== "PENDING") {
        throw AppError.conflict(`Salary record already exists and is ${duplicate.status} for this employee in this period.`);
    }

    // Determine effective salaryBasis and payFrequency
    const effectiveSalaryBasis: PayrollFrequency = (data.salaryBasis as PayrollFrequency) ||
        (existingEmployee.salaryBasis as PayrollFrequency) ||
        "monthly";
    const effectivePayFrequency: PayrollFrequency = (data.payFrequency as PayrollFrequency) ||
        (existingPeriod.frequency as PayrollFrequency) ||
        (existingEmployee.payFrequency as PayrollFrequency) ||
        "monthly";

    // Resolve attendance metrics
    let attendedDays = data.attendedDays;
    let loggedHours = data.loggedHours;

    if (attendedDays === undefined || loggedHours === undefined) {
        const pStart = new Date(existingPeriod.startDate);
        const pEnd = new Date(existingPeriod.endDate);
        pEnd.setHours(23, 59, 59, 999);

        const attendanceLogs = await prisma.attendance.findMany({
            where: {
                employeeId: data.employeeId,
                date: {
                    gte: pStart,
                    lte: pEnd,
                },
                status: {
                    in: ["PRESENT", "LATE"],
                },
                deletedAt: null,
            },
        });

        if (attendedDays === undefined) {
            const uniqueDays = new Set(attendanceLogs.map((a) => a.date.toISOString().split("T")[0]));
            attendedDays = uniqueDays.size;
        }
        if (loggedHours === undefined) {
            const totalMinutes = attendanceLogs.reduce(
                (sum, a) => sum + (a.workDurationMinutes || 480),
                0
            );
            loggedHours = Math.round(totalMinutes / 60);
        }
    }

    // Fetch component definitions
    const componentIds = (data.components || []).map((c) => c.componentId);
    const dbComponents = componentIds.length > 0
        ? await prisma.payrollComponent.findMany({
            where: { id: { in: componentIds }, deletedAt: null },
        })
        : [];
    const componentMap = new Map(dbComponents.map((c) => [c.id, c]));

    const missingIds = componentIds.filter((id) => !componentMap.has(id));
    if (missingIds.length > 0) {
        throw AppError.notFound(`Payroll components not found: ${missingIds.join(", ")}`);
    }

    // Check if basic salary should be auto-computed
    const baseWageResult = calculateBaseSalary({
        salaryBasis:  effectiveSalaryBasis,
        payFrequency: effectivePayFrequency,
        rates: {
            hourlyRate:    existingEmployee.hourlyRate ? Number(existingEmployee.hourlyRate) : undefined,
            dailyRate:     existingEmployee.dailyRate ? Number(existingEmployee.dailyRate) : undefined,
            weeklyRate:    existingEmployee.weeklyRate ? Number(existingEmployee.weeklyRate) : undefined,
            biWeeklyRate:  existingEmployee.biWeeklyRate ? Number(existingEmployee.biWeeklyRate) : undefined,
            monthlySalary: existingEmployee.monthlySalary ? Number(existingEmployee.monthlySalary) : undefined,
        },
        attendance: {
            attendedDays,
            loggedHours,
        },
    });

    // Build calculation input
    const calculationInput: ComponentInput[] = (data.components || []).map((entry) => {
        const comp = componentMap.get(entry.componentId)!;
        let amount = entry.amount;

        // Auto-calculate base if component is basic and autoCalculateBase is requested or amount is 0
        if (comp.type === "basic" && (data.autoCalculateBase || amount <= 0)) {
            amount = baseWageResult.baseSalary;
        }

        return {
            id:              comp.id,
            type:            comp.type,
            calculationType: comp.calculationType,
            amount,
        };
    });

    // Ensure basic component exists and is included in calculation
    const hasBasic = calculationInput.some((c) => c.type === "basic");
    if (!hasBasic) {
        let basicDbComp = await prisma.payrollComponent.findFirst({
            where: { type: "basic", deletedAt: null },
        });
        if (!basicDbComp) {
            basicDbComp = await prisma.payrollComponent.create({
                data: {
                    name: "Gaji Pokok (Basic Salary)",
                    type: "basic",
                    calculationType: "fixedAmount",
                    defaultAmount: 0,
                    isTaxable: true,
                    description: "Standard basic salary component",
                    createdBy: user.id,
                    createdAt: new Date(),
                },
            });
        }
        calculationInput.unshift({
            id:              basicDbComp.id,
            type:            "basic",
            calculationType: basicDbComp.calculationType,
            amount:          baseWageResult.baseSalary,
        });
    }

    const calculationResult = calculateSalary(calculationInput, { attendedDays, loggedHours });

    // Save record + details atomically
    const salaryRecord = await prisma.$transaction(async (tx) => {
        let record;
        if (duplicate) {
            record = await tx.salaryRecord.update({
                where: { id: duplicate.id },
                data: {
                    salaryBasis:     effectiveSalaryBasis,
                    payFrequency:    effectivePayFrequency,
                    basicSalary:     calculationResult.basicSalary,
                    totalAllowances: calculationResult.totalAllowances,
                    totalDeductions: calculationResult.totalDeductions,
                    netSalary:       calculationResult.netSalary,
                    notes:           data.notes ?? duplicate.notes,
                    updatedAt:       new Date(),
                    updatedBy:       user.id,
                },
            });
            await tx.salaryRecordDetail.deleteMany({
                where: { salaryRecordId: record.id },
            });
        } else {
            record = await tx.salaryRecord.create({
                data: {
                    periodId:        data.periodId,
                    employeeId:      data.employeeId,
                    salaryBasis:     effectiveSalaryBasis,
                    payFrequency:    effectivePayFrequency,
                    basicSalary:     calculationResult.basicSalary,
                    totalAllowances: calculationResult.totalAllowances,
                    totalDeductions: calculationResult.totalDeductions,
                    netSalary:       calculationResult.netSalary,
                    status:          "PENDING",
                    notes:           data.notes ?? undefined,
                    createdAt:       new Date(),
                    updatedAt:       new Date(),
                    createdBy:       user.id,
                    updatedBy:       user.id,
                },
            });
        }

        await tx.salaryRecordDetail.createMany({
            data: calculationResult.details.map((detail) => ({
                salaryRecordId: record.id,
                componentId:    detail.componentId,
                amount:         detail.amount,
                createdAt:      new Date(),
                updatedAt:      new Date(),
            })),
        });

        return tx.salaryRecord.findUnique({
            where:   { id: record.id },
            include: {
                period:   true,
                employee: {
                    include: {
                        profile:  true,
                        position: true,
                    },
                },
                details: {
                    include: { component: true },
                },
            },
        });
    });

    return created(reply, { salaryRecord }, "Salary record successfully generated.");
};

export const updateSalaryRecordController: TypedHandler<UpdateSalaryRecordType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Salary record id is required");
    }

    const existing = await prisma.salaryRecord.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existing) {
        throw AppError.notFound("Salary record not found.");
    }

    const salaryRecord = await prisma.salaryRecord.update({
        where: { id: data.id },
        data: {
            ...(data.status !== undefined && { status: data.status }),
            ...(data.notes  !== undefined && { notes: data.notes }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: {
            period:   true,
            employee: {
                include: {
                    profile:  true,
                    position: true,
                },
            },
            details: {
                include: { component: true },
            },
        },
    });

    return success(reply, { salaryRecord }, "Salary record successfully updated.");
};

export const deleteSalaryRecordController: TypedHandler<DeleteSalaryRecordType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Salary record id is required");
    }

    const existing = await prisma.salaryRecord.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existing) {
        throw AppError.notFound("Salary record not found.");
    }

    const salaryRecord = await prisma.salaryRecord.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { salaryRecord }, "Salary record successfully deleted.");
};

export const getSalaryRecordController: TypedHandler<GetSalaryRecordType> = async (request, reply) => {
    const data = request.body;

    if (!data?.id) {
        throw AppError.badRequest("Salary record id is required");
    }

    const salaryRecord = await prisma.salaryRecord.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            period:   true,
            employee: {
                include: {
                    profile:  true,
                    position: true,
                },
            },
            details: {
                include: { component: true },
            },
        },
    });
    if (!salaryRecord) {
        throw AppError.notFound("Salary record not found.");
    }

    return success(reply, { salaryRecord }, "Salary record successfully fetched.");
};

export const getSalaryRecordsByPeriodController: TypedHandler<GetSalaryRecordsByPeriodType> = async (request, reply) => {
    const data = request.body;

    if (!data?.periodId) {
        throw AppError.badRequest("periodId is required");
    }

    const salaryRecords = await prisma.salaryRecord.findMany({
        where:   { periodId: data.periodId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
            employee: {
                include: {
                    profile:  true,
                    position: true,
                },
            },
            details: {
                include: { component: true },
            },
        },
    });

    return success(reply, { salaryRecords }, "Salary records successfully fetched.");
};

export const getAllSalaryRecordsController: TypedHandler<unknown, unknown, PaginationQuery> = async (request, reply) => {
    const { page, limit, skip } = buildPaginationQuery(request.query);
    const query = (request.query as any) || {};

    const where: any = {
        deletedAt: null,
    };
    if (query.employeeId) {
        where.employeeId = Number(query.employeeId);
    }
    if (query.periodId && query.periodId !== "ALL") {
        where.periodId = Number(query.periodId);
    }
    if (query.status && query.status !== "ALL") {
        where.status = query.status;
    }

    if (query.facilityId && query.facilityId !== "ALL") {
        const facId = Number(query.facilityId);
        where.employee = {
            deletedAt: null,
            OR: [
                { facilityId: facId },
                { facilityEmployees: { some: { facilityId: facId, deletedAt: null } } }
            ]
        };
    }

    if (query.search && String(query.search).trim()) {
        const q = String(query.search).trim();
        where.employee = {
            ...(where.employee || { deletedAt: null }),
            profile: {
                OR: [
                    { firstName: { contains: q, mode: "insensitive" } },
                    { lastName: { contains: q, mode: "insensitive" } },
                    { email: { contains: q, mode: "insensitive" } },
                ]
            }
        };
    }

    const [salaryRecords, total] = await Promise.all([
        prisma.salaryRecord.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                period:   true,
                employee: {
                    include: {
                        profile:  true,
                        position: true,
                        facility: true,
                        facilityEmployees: {
                            where: { deletedAt: null },
                            include: { facility: true },
                        },
                    },
                },
                details: {
                    include: { component: true },
                },
            },
        }),
        prisma.salaryRecord.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, salaryRecords, meta, "Salary records successfully fetched.");
};
