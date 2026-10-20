import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { success, created } from "../../../utils/response";
import { createUser } from "../auth/authController";
import { CreateUserInput, UpdateUserInput, DeleteUserInput, ToggleUserStatusInput } from "./userSchema";

export async function getUsersController(request: FastifyRequest, reply: FastifyReply) {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            roleId: true,
            profileId: true,
            isSuperAdmin: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            role: {
                select: {
                    id: true,
                    roleName: true,
                    roleAbbr: true
                }
            },
            userProfile: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    isCompany: true,
                    phoneNumber: true
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    return success(reply, users, "Users retrieved successfully");
}

export async function createUserController(
    request: FastifyRequest<{ Body: CreateUserInput }>,
    reply: FastifyReply
) {
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const newUser = await createUser(user, {
        email: request.body.email,
        name: request.body.name,
        password: request.body.password,
        profileId: request.body.profileId ?? undefined,
        roleId: request.body.roleId ?? undefined,
        isSuperAdmin: request.body.isSuperAdmin ?? false,
    });

    return created(reply, newUser, "User successfully created");
}

export async function updateUserController(
    request: FastifyRequest<{ Body: UpdateUserInput }>,
    reply: FastifyReply
) {
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const { id, name, roleId, profileId, isSuperAdmin } = request.body;

    const existingUser = await prisma.user.findUnique({
        where: { id }
    });

    if (!existingUser) {
        throw AppError.notFound("User not found");
    }

    const updatedUser = await prisma.user.update({
        where: { id },
        data: {
            name: name !== undefined ? name : undefined,
            roleId: roleId !== undefined ? roleId : undefined,
            profileId: profileId !== undefined ? profileId : undefined,
            isSuperAdmin: isSuperAdmin !== undefined ? isSuperAdmin : undefined,
            updatedBy: user.id
        },
        select: {
            id: true,
            name: true,
            email: true,
            roleId: true,
            profileId: true,
            isSuperAdmin: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            role: {
                select: {
                    id: true,
                    roleName: true,
                    roleAbbr: true
                }
            },
            userProfile: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    isCompany: true,
                    phoneNumber: true
                }
            }
        }
    });

    return success(reply, updatedUser, "User successfully updated");
}

export async function toggleUserStatusController(
    request: FastifyRequest<{ Body: ToggleUserStatusInput }>,
    reply: FastifyReply
) {
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const { id } = request.body;

    const existingUser = await prisma.user.findUnique({
        where: { id }
    });

    if (!existingUser) {
        throw AppError.notFound("User not found");
    }

    const isDeactivated = existingUser.deletedAt !== null;
    const updated = await prisma.user.update({
        where: { id },
        data: {
            deletedAt: isDeactivated ? null : new Date(),
            updatedBy: user.id
        }
    });

    return success(
        reply,
        updated,
        isDeactivated ? "User successfully reactivated" : "User successfully deactivated"
    );
}

export async function getUserRelatedRecords(userId: string): Promise<string[]> {
    const related: string[] = [];

    // 1. Check user and linked profile
    const existing = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            userProfile: true
        }
    });

    if (!existing) return related;

    if (existing.profileId) {
        const name = [existing.userProfile?.firstName, existing.userProfile?.lastName].filter(Boolean).join(" ");
        related.push(name ? `Linked Profile (${name})` : `Linked Profile #${existing.profileId}`);
    }

    // 2. Run checks on all entities that reference this user
    const checks = await Promise.all([
        prisma.user.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.customer.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.employee.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.vendor.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.profile.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.role.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.permission.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.profileContact.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.profileDocument.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.profileSocialMedia.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.product.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.productCategory.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.productInventory.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.productPrice.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.productImage.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.productAttribute.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.productAttributeValue.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.productRecipe.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.unit.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.monetaryAccount.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.monetaryTransaction.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.monetaryTransactionReference.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.salesOrder.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.vendorProduct.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.rfq.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.rfqProduct.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.purchaseOrder.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.purchaseOrderProduct.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.request.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.requestProduct.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.requestSource.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.equipmentEntity.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.equipmentType.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.equipmentBrand.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.equipmentModel.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.equipmentModelFeature.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.equipmentFeature.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.equipmentMaintenance.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.equipmentPart.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.equipmentPrice.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.work.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.workEquipment.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.workWorker.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.workItem.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.workOffer.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.workOfferItem.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.worker.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.item.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.position.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.task.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }, { assigneeId: userId }] } }),
        prisma.payrollPeriod.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.payrollComponent.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.salaryRecord.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.vehicle.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.driver.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.trip.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.fuelLog.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
        prisma.attendance.count({ where: { OR: [{ createdBy: userId }, { updatedBy: userId }] } }),
    ]);

    const labels = [
        "Created/Updated User Accounts",
        "Customers",
        "Employees",
        "Vendors",
        "Profiles",
        "Roles",
        "Permissions",
        "Profile Contacts",
        "Profile Documents",
        "Profile Social Media",
        "Products",
        "Product Categories",
        "Product Inventory",
        "Product Prices",
        "Product Images",
        "Product Attributes",
        "Product Attribute Values",
        "Product Recipes",
        "Units",
        "Monetary Accounts",
        "Monetary Transactions",
        "Transaction References",
        "Sales Orders",
        "Vendor Products",
        "RFQs",
        "RFQ Products",
        "Purchase Orders",
        "PO Products",
        "Requests",
        "Request Products",
        "Request Sources",
        "Equipment",
        "Equipment Types",
        "Equipment Brands",
        "Equipment Models",
        "Equipment Model Features",
        "Equipment Features",
        "Equipment Maintenance",
        "Equipment Parts",
        "Equipment Prices",
        "Work BOQs",
        "Work Equipment",
        "Work Workers",
        "Work Items",
        "Work Offers",
        "Work Offer Items",
        "Workers",
        "Items (Materials)",
        "Positions",
        "Tasks",
        "Payroll Periods",
        "Payroll Components",
        "Salary Records",
        "Vehicles",
        "Drivers",
        "Trips",
        "Fuel Logs",
        "Attendance Records",
    ];

    labels.forEach((label, idx) => {
        const count = checks[idx];
        if (typeof count === "number" && count > 0) {
            related.push(`${count} ${label}`);
        }
    });

    return related;
}

export async function checkUserDeleteController(
    request: FastifyRequest<{ Body: DeleteUserInput }>,
    reply: FastifyReply
) {
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const { id } = request.body;

    const existingUser = await prisma.user.findUnique({
        where: { id }
    });

    if (!existingUser) {
        throw AppError.notFound("User not found");
    }

    const isSelf = user.id === id;
    const isDeactivated = existingUser.deletedAt !== null;
    const relatedRecords = await getUserRelatedRecords(id);

    return success(reply, {
        canDelete: !isSelf && isDeactivated && relatedRecords.length === 0,
        isSelf,
        isDeactivated,
        relatedRecords,
    }, "User delete check completed");
}

export async function deleteUserController(
    request: FastifyRequest<{ Body: DeleteUserInput }>,
    reply: FastifyReply
) {
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const { id } = request.body;

    const existingUser = await prisma.user.findUnique({
        where: { id }
    });

    if (!existingUser) {
        throw AppError.notFound("User not found");
    }

    if (user.id === id) {
        throw AppError.badRequest("You cannot delete your own user account.");
    }

    if (!existingUser.deletedAt) {
        throw AppError.badRequest("Only deactivated users can be deleted. Please deactivate the user first.");
    }

    const relatedRecords = await getUserRelatedRecords(id);
    if (relatedRecords.length > 0) {
        throw AppError.badRequest(
            `Cannot delete user "${existingUser.name}" (${existingUser.email}) because they have related data in the system: ${relatedRecords.join(", ")}.`,
            { relatedRecords }
        );
    }

    try {
        // Permanent delete (associated account and session cascade delete)
        await prisma.user.delete({
            where: { id }
        });
    } catch (error: any) {
        if (error?.code === "P2003") {
            throw AppError.badRequest("Cannot delete user because of related foreign key records in the database.");
        }
        throw error;
    }

    return success(reply, { id }, "User successfully deleted permanently");
}
