import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { getProfileById } from "../../personal/profile/profileController";
import { extractFieldForUpdate } from "../../../utils/prismaUtils";
import { deactivateUser } from "../../personal/auth/authController";
import { AppError } from "../../../utils/errors";
import { success, created, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationParams } from "../../../utils/pagination";
import { employeeType, deleteEmployeeType } from "./employeeSchema";

export async function createEmployeeController(
    request: FastifyRequest<{ Body: employeeType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    let profileId = data.profileId;

    if (!profileId) {
        if (!data.firstName || data.firstName.trim().length < 2) {
            throw AppError.badRequest("Either profileId or a valid firstName (at least 2 characters) must be provided.");
        }

        const newProfile = await prisma.profile.create({
            data: {
                firstName: data.firstName.trim(),
                lastName: data.lastName?.trim() || null,
                phoneNumber: data.phoneNumber?.trim() || null,
                address: data.address?.trim() || null,
                city: data.city?.trim() || null,
                province: data.province?.trim() || null,
                postalCode: data.postalCode?.trim() || null,
                country: data.country?.trim() || "Indonesia",
                isCompany: false,
                createdBy: user.id,
                updatedBy: user.id,
            }
        });
        profileId = newProfile.id;
    } else {
        const profile = await getProfileById(profileId);
        if (!profile) {
            throw AppError.notFound("Profile not found!");
        }
        if (profile.isCompany) {
            throw AppError.badRequest("Profile is a company. Employees must be individuals.");
        }

        const existingEmployee = await prisma.employee.findFirst({
            where: {
                profileId,
                deletedAt: null
            }
        });

        if (existingEmployee) {
            throw AppError.conflict("Employee record already exists for this profile.");
        }
    }

    const employee = await prisma.employee.create({
        data: {
            profileId,
            positionId: data.positionId ?? null,
            facilityId: data.facilityId ?? null,
            employmentType: data.employmentType ?? 'MONTHLY',
            salaryBasis: data.salaryBasis ?? 'monthly',
            payFrequency: data.payFrequency ?? 'monthly',
            hourlyRate: data.hourlyRate ?? null,
            dailyRate: data.dailyRate ?? null,
            weeklyRate: data.weeklyRate ?? null,
            biWeeklyRate: data.biWeeklyRate ?? null,
            monthlySalary: data.monthlySalary ?? null,
            contractRate: data.contractRate ?? null,
            startDate: data.startDate ?? new Date(),
            endDate: data.endDate ?? null,
            departReason: data.departReason ?? null,
            updatedAt: new Date(),
            createdAt: new Date(),
            createdBy: user.id,
            updatedBy: user.id,
        },
        include: {
            profile: true,
            position: true,
            facility: true,
        }
    });

    if (data.facilityId) {
        await prisma.facilityEmployee.upsert({
            where: {
                facilityId_employeeId: {
                    facilityId: data.facilityId,
                    employeeId: employee.id,
                },
            },
            create: {
                facilityId: data.facilityId,
                employeeId: employee.id,
                isPrimary: true,
                createdBy: user.id,
            },
            update: {
                isPrimary: true,
                deletedAt: null,
                updatedAt: new Date(),
                updatedBy: user.id,
            },
        });
    }

    return created(reply, employee, "Employee successfully created.");
}

export async function deleteEmployeeController(
    request: FastifyRequest<{ Body: deleteEmployeeType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const result = await deleteEmployee(user, data);
    return success(reply, result, "Employee successfully deleted.");
}

export async function updateEmployeeController(
    request: FastifyRequest<{ Body: Partial<employeeType> & { id: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existingEmployee = await prisma.employee.findFirst({
        where: {
            id: data.id,
            deletedAt: null
        }
    });

    if (!existingEmployee) {
        throw AppError.notFound("Employee not found!");
    }

    const fields = extractFieldForUpdate(existingEmployee, data);
    if (!fields && data.positionId === undefined && data.facilityId === undefined) {
        return success(reply, existingEmployee, "No fields to update.");
    }

    const { id: _id, positionId: _posId, facilityId: _facId, ...cleanFields } = (fields || {});
    const updateData: any = {
        ...cleanFields,
        updatedAt: new Date(),
        employeeUpdatedBy: { connect: { id: user.id } },
    };

    if (data.positionId !== undefined) {
        if (data.positionId) {
            updateData.position = { connect: { id: data.positionId } };
        } else {
            updateData.position = { disconnect: true };
        }
    }

    if (data.facilityId !== undefined) {
        if (data.facilityId) {
            updateData.facility = { connect: { id: data.facilityId } };
            // Demote other primary assignments for this employee
            await prisma.facilityEmployee.updateMany({
                where: { employeeId: data.id, isPrimary: true },
                data: { isPrimary: false, updatedAt: new Date(), updatedBy: user.id },
            });
            // Upsert the facilityEmployee conjunction
            await prisma.facilityEmployee.upsert({
                where: {
                    facilityId_employeeId: {
                        facilityId: data.facilityId,
                        employeeId: data.id,
                    },
                },
                create: {
                    facilityId: data.facilityId,
                    employeeId: data.id,
                    isPrimary: true,
                    createdBy: user.id,
                },
                update: {
                    isPrimary: true,
                    deletedAt: null,
                    updatedAt: new Date(),
                    updatedBy: user.id,
                },
            });
        } else {
            updateData.facility = { disconnect: true };
            await prisma.facilityEmployee.updateMany({
                where: { employeeId: data.id, isPrimary: true },
                data: { isPrimary: false, updatedAt: new Date(), updatedBy: user.id },
            });
        }
    }

    const updatedEmployee = await prisma.employee.update({
        where: { id: data.id },
        data: updateData,
        include: {
            profile: true,
            position: true,
            facility: true,
        }
    });

    return success(reply, updatedEmployee, "Employee successfully updated.");
}

export async function getEmployeesController(
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
        "profile.firstName",
        "profile.lastName",
        "profile.address",
        "profile.city",
        "profile.province",
        "profile.country",
        "profile.postalCode",
        "position.name",
        "facility.facilityName",
        "facility.facilityCode"
    ]);

    const where: any = {
        deletedAt: (params as any).status === "deactivated" ? { not: null } : (params as any).status === "all" ? undefined : null,
        ...(params as any).facilityId ? { facilityId: Number((params as any).facilityId) } : {},
        ...(searchFilter ? { OR: searchFilter } : {})
    };

    const [employees, total] = await Promise.all([
        prisma.employee.findMany({
            where,
            skip,
            take,
            orderBy,
            include: {
                profile: {
                    include: {
                        userProfile: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
                position: true,
                facility: true,
            }
        }),
        prisma.employee.count({ where })
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, employees, meta, "Employees successfully fetched.", "employees");
}

export async function reassignEmployee(
    request: FastifyRequest<{
        Body: {
            profileId?: number;
            employeeId?: number;
            positionId: number;
            startDate?: Date;
            departReason?: string;
        }
    }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    let employee = null;
    if (data.employeeId) {
        employee = await getEmployeeById(data.employeeId);
    } else if (data.profileId) {
        const employees = await getEmployeeByProfile(data.profileId);
        employee = employees[0] ?? null;
    }

    if (!employee) {
        throw AppError.notFound("Employee not found for reassignment!");
    }

    await deleteEmployee(user, { id: employee.id, departReason: data.departReason });
    const newEmployee = await assignProfileToEmployee(user, employee.profileId, data.positionId, data.startDate);

    return success(reply, newEmployee, "Employee successfully reassigned.");
}

export async function dismissEmployee(
    request: FastifyRequest<{
        Body: {
            profileId: number;
            departReason?: string;
            endDate?: Date;
        }
    }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const profile = await getProfileById(data.profileId);
    if (!profile) {
        throw AppError.notFound("Profile not found!");
    }

    const employees = await getEmployeeByProfile(data.profileId);
    for (const emp of employees) {
        await deleteEmployee(user, { id: emp.id, departReason: data.departReason, endDate: data.endDate });
    }

    const userFound = await prisma.user.findFirst({
        where: {
            profileId: data.profileId,
            deletedAt: null
        }
    });

    if (userFound) {
        await deactivateUser(user, userFound.id);
    }

    return success(reply, null, "Employee successfully dismissed.");
}

export async function assignProfileToEmployee(
    user: { id: string },
    profileId: number,
    positionId: number,
    startDate?: Date | null
) {
    return await prisma.employee.create({
        data: {
            profile: { connect: { id: profileId } },
            position: { connect: { id: positionId } },
            startDate: startDate ?? new Date(),
            createdAt: new Date(),
            employeeCreatedBy: { connect: { id: user.id } },
        }
    });
}

export async function deleteEmployee(user: { id: string }, data: { id: number; departReason?: string | null; endDate?: Date | null }) {
    const existingEmployee = await prisma.employee.findFirst({
        where: {
            id: data.id,
            deletedAt: null
        }
    });

    if (!existingEmployee) {
        throw AppError.notFound("Employee not found!");
    }

    await prisma.employee.update({
        where: { id: data.id },
        data: {
            endDate: data.endDate ?? new Date(),
            departReason: data.departReason ?? null,
            deletedAt: new Date(),
            updatedBy: user.id,
        }
    });

    return { statusCode: 200, message: "Employee successfully deleted." };
}

export async function getEmployeeByProfile(profileId: number) {
    return await prisma.employee.findMany({
        where: {
            profileId,
            deletedAt: null
        }
    });
}

export async function getEmployeeById(id: number) {
    return await prisma.employee.findFirst({
        where: {
            id,
            deletedAt: null
        },
        include: {
            profile: true
        }
    });
}
