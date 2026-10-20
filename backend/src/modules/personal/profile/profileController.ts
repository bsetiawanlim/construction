import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { extractFieldForUpdate } from "../../../utils/prismaUtils";
import { grantSuperUser, revokeSuperUser } from "../permission/permissionController";
import { AppError } from "../../../utils/errors";
import { success, created, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationParams } from "../../../utils/pagination";
import { auth } from "../../../plugins/auth";
import { assignUserToProfile, createUser } from "../auth/authController";
import { profileSchema, profileType, deleteProfileType } from "./profileSchema";

export async function createProfileController(
    request: FastifyRequest<{ Body: profileType & { user?: any; isSuperAdmin?: boolean } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized();
    }
    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    let userData = null;
    if (data.user) {
        userData = { ...data.user };
        delete data.user;
    }
    const profileData = { ...data };
    let userCreated: any = null;

    await checkProfile(profileData);

    if (userData && userData.email && userData.password) {
        userCreated = await createUser(user, {
            ...userData,
            name: combineName(profileData.firstName, profileData.lastName || "")
        });
    }

    const profileRes = profileSchema.safeParse(profileData);
    if (!profileRes.success) {
        throw AppError.badRequest("Invalid profile data", profileRes.error.issues);
    }

    const profile = await createProfile(user, profileRes.data);

    // Save initial social media links if provided
    if (profileData.socialMedia && Array.isArray(profileData.socialMedia) && profileData.socialMedia.length > 0) {
        for (const sm of profileData.socialMedia) {
            if (sm.platform && sm.url) {
                await prisma.profileSocialMedia.create({
                    data: {
                        profileId: profile.id,
                        platform: sm.platform.trim().toLowerCase(),
                        username: sm.username ? sm.username.trim() : null,
                        url: sm.url.trim(),
                        notes: sm.notes ? sm.notes.trim() : null,
                        createdBy: user.id,
                        updatedBy: user.id
                    }
                });
            }
        }
    }

    if (data.isSuperAdmin && userCreated?.response?.user?.id) {
        await grantSuperUser(userCreated.response.user.id, user.id);
    }

    if (userCreated?.response?.user?.id) {
        await assignUserToProfile(user, userCreated.response.user.id, profile.id);
    }

    return created(reply, profile, "Profile successfully created.");
}

export async function getMyProfileController(request: FastifyRequest, reply: FastifyReply) {
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existingProfile = await getProfileByUserId(user.id);
    if (!existingProfile) {
        throw AppError.notFound("Profile not found!");
    }

    return success(reply, existingProfile, "Profile retrieved successfully.");
}

export async function deleteProfileController(
    request: FastifyRequest<{ Body: deleteProfileType }>,
    reply: FastifyReply
) {
    const { profileId } = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existingProfile = await prisma.profile.findFirst({
        where: {
            deletedAt: null,
            id: profileId
        }
    });

    if (!existingProfile) {
        throw AppError.notFound("Profile not found!");
    }

    // Safety checks for active associations
    const linkedUser = await prisma.user.findFirst({
        where: { profileId, deletedAt: null }
    });
    if (linkedUser) {
        throw AppError.badRequest(`Cannot delete profile linked to active user account (${linkedUser.email}). Please unlink or remove the user account first.`);
    }

    const linkedCustomer = await prisma.customer.findFirst({
        where: { profileId, deletedAt: null }
    });
    if (linkedCustomer) {
        throw AppError.badRequest("Cannot delete profile linked to an active customer record. Please remove customer association first.");
    }

    const linkedVendor = await prisma.vendor.findFirst({
        where: { profileId, deletedAt: null }
    });
    if (linkedVendor) {
        throw AppError.badRequest("Cannot delete profile linked to an active vendor record. Please remove vendor association first.");
    }

    const linkedEmployee = await prisma.employee.findFirst({
        where: { profileId, deletedAt: null }
    });
    if (linkedEmployee) {
        throw AppError.badRequest("Cannot delete profile linked to an active employee record. Please remove employee association first.");
    }

    const linkedMonetary = await prisma.monetaryAccount.findFirst({
        where: { profileId, deletedAt: null }
    });
    if (linkedMonetary) {
        throw AppError.badRequest("Cannot delete profile linked to an active monetary account. Please close or reassign the account first.");
    }

    const now = new Date();
    await prisma.$transaction([
        prisma.profile.update({
            where: { id: profileId },
            data: {
                deletedAt: now,
                updatedAt: now,
                profileupdatedBy: { connect: { id: user.id } },
            }
        }),
        prisma.profileSocialMedia.updateMany({
            where: { profileId, deletedAt: null },
            data: {
                deletedAt: now,
                updatedAt: now,
                updatedBy: user.id
            }
        }),
        prisma.profileContact.updateMany({
            where: {
                OR: [
                    { profileId, deletedAt: null },
                    { contactPersonId: profileId, deletedAt: null }
                ]
            },
            data: {
                deletedAt: now,
                updatedAt: now,
                updatedBy: user.id
            }
        })
    ]);

    return success(reply, null, "Profile successfully deleted.");
}

export async function updateMyProfileController(
    request: FastifyRequest<{ Body: Partial<profileType> }>,
    reply: FastifyReply
) {
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }
    const data = request.body;

    let profile: any = await getProfileByUserId(user.id);
    if (!profile) {
        profile = await createMyProfile(user, data);
    } else {
        const fields = extractFieldForUpdate(profile, data);
        if (!fields) {
            return success(reply, profile, "No fields to update.");
        }
        profile = await updateProfile(user, fields);
    }

    return success(reply, profile, "Profile successfully updated.");
}

export async function updateProfileController(
    request: FastifyRequest<{ Body: Partial<profileType> & { id: number } }>,
    reply: FastifyReply
) {
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }
    const data = request.body;

    const profile = await getProfileById(data.id);
    if (!profile) {
        throw AppError.notFound("Profile not found!");
    }

    const fields = extractFieldForUpdate(profile, data);
    if (!fields) {
        return success(reply, profile, "No fields to update.");
    }

    const updatedProfile = await updateProfile(user, fields);
    return success(reply, updatedProfile, "Profile successfully updated.");
}

export async function getAllProfilesController(
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
        "firstName",
        "lastName",
        "address",
        "city",
        "province",
        "country",
        "postalCode",
        "phoneNumber",
        "email",
        "socialId",
        "taxId"
    ]);

    const rawParams = params as Record<string, any>;
    const isCompanyFilter = rawParams.isCompany !== undefined
        ? (rawParams.isCompany === true || rawParams.isCompany === "true" || rawParams.isCompany === 1 || rawParams.isCompany === "1")
            ? true
            : (rawParams.isCompany === false || rawParams.isCompany === "false" || rawParams.isCompany === 0 || rawParams.isCompany === "0")
                ? false
                : undefined
        : undefined;

    const where: any = {
        deletedAt: null,
        ...(isCompanyFilter !== undefined ? { isCompany: isCompanyFilter } : {}),
        ...(rawParams.role === "customer" || rawParams.isCustomer === true || rawParams.isCustomer === "true"
            ? { customer: { some: { deletedAt: null } } }
            : {}),
        ...(rawParams.role === "vendor" || rawParams.isVendor === true || rawParams.isVendor === "true"
            ? { vendor: { some: { deletedAt: null } } }
            : {}),
        ...(rawParams.role === "employee" || rawParams.isEmployee === true || rawParams.isEmployee === "true"
            ? { employee: { some: { deletedAt: null } } }
            : {}),
        ...(rawParams.city ? { city: { contains: rawParams.city, mode: "insensitive" } } : {}),
        ...(rawParams.province ? { province: { contains: rawParams.province, mode: "insensitive" } } : {}),
        ...(rawParams.country ? { country: { contains: rawParams.country, mode: "insensitive" } } : {}),
        ...(rawParams.postalCode ? { postalCode: { contains: rawParams.postalCode, mode: "insensitive" } } : {}),
        ...(searchFilter ? { OR: searchFilter } : {})
    };

    const [profiles, total] = await Promise.all([
        prisma.profile.findMany({
            where,
            skip,
            take,
            orderBy,
            include: {
                socialMedia: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: "asc" }
                },
                customer: {
                    where: { deletedAt: null },
                    select: { id: true, customergroup: true, createdAt: true }
                },
                vendor: {
                    where: { deletedAt: null },
                    select: { id: true, vendorgroup: true, createdAt: true }
                },
                employee: {
                    where: { deletedAt: null },
                    select: {
                        id: true,
                        positionId: true,
                        facilityId: true,
                        facility: { select: { id: true, facilityCode: true, facilityName: true } },
                        startDate: true,
                        position: { select: { id: true, name: true } }
                    }
                }
            }
        }),
        prisma.profile.count({ where })
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, profiles, meta, "Profiles successfully fetched.", "profiles");
}

export async function getProfileByIdController(
    request: FastifyRequest<{ Body: { id: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    if (!data?.id) {
        throw AppError.badRequest("Profile ID is required.");
    }

    const profile = await getProfileById(data.id);
    if (!profile) {
        throw AppError.notFound("Profile not found!");
    }

    return success(reply, profile, "Profile successfully retrieved.");
}

export async function getProfiles(args?: any): Promise<any> {
    return await prisma.profile.findMany({
        where: {
            deletedAt: null,
            ...(args?.where || {})
        }
    });
}

export async function createMyProfile(user: { id: string }, data: any) {
    const { user: _u, socialMedia: _sm, ...profileData } = data;
    return await prisma.profile.create({
        data: {
            ...profileData,
            userProfile: { connect: { id: user.id } },
            createdAt: new Date(),
            profilecreatedBy: { connect: { id: user.id } },
        }
    });
}

export async function createProfile(user: { id: string }, data: any) {
    const { user: _u, socialMedia: _sm, ...profileData } = data;
    return await prisma.profile.create({
        data: {
            ...profileData,
            createdAt: new Date(),
            profilecreatedBy: { connect: { id: user.id } },
        }
    });
}

export async function checkProfile(args: any) {
    const searchConditions: any[] = [];

    if (args.dateOfBirth && args.firstName && args.lastName) {
        searchConditions.push({
            deletedAt: null,
            firstName: args.firstName,
            lastName: args.lastName,
            dateOfBirth: args.dateOfBirth
        });
    }

    if (args.isCompany && !args.dateOfBirth && args.firstName) {
        searchConditions.push({
            deletedAt: null,
            firstName: args.firstName,
            isCompany: true
        });
    }

    if (args.socialId) {
        searchConditions.push({
            deletedAt: null,
            socialId: args.socialId
        });
    }

    if (args.taxId) {
        searchConditions.push({
            deletedAt: null,
            taxId: args.taxId
        });
    }

    if (searchConditions.length === 0) {
        return true;
    }

    const existingProfiles = await prisma.profile.findMany({
        where: {
            OR: searchConditions
        }
    });

    for (const existingProfile of existingProfiles) {
        if (!args.dateOfBirth && args.isCompany && existingProfile.isCompany && args.firstName === existingProfile.firstName) {
            throw AppError.conflict("Profile with the same company name already exists!");
        }
        if (args.dateOfBirth && existingProfile.dateOfBirth &&
            existingProfile.firstName === args.firstName &&
            existingProfile.lastName === args.lastName &&
            new Date(existingProfile.dateOfBirth).getTime() === new Date(args.dateOfBirth).getTime()) {
            throw AppError.conflict("Profile with the same name and date of birth already exists!");
        }
        if (args.socialId && existingProfile.socialId === args.socialId) {
            throw AppError.conflict("Profile with the same social ID already exists!");
        }
        if (args.taxId && existingProfile.taxId === args.taxId) {
            throw AppError.conflict("Profile with the same tax ID already exists!");
        }
    }

    return true;
}

export async function updateProfile(user: { id: string }, args: any) {
    const { id, user: _u, socialMedia: _sm, ...updateData } = args;
    return await prisma.profile.update({
        where: {
            id,
            deletedAt: null
        },
        data: {
            ...updateData,
            updatedAt: new Date(),
            profileupdatedBy: { connect: { id: user.id } },
        }
    });
}

export async function getProfileById(profileId: number) {
    return await prisma.profile.findFirst({
        where: {
            deletedAt: null,
            id: profileId
        },
        include: {
            socialMedia: {
                where: {
                    deletedAt: null
                },
                orderBy: {
                    createdAt: "asc"
                }
            },
            customer: {
                where: { deletedAt: null },
                select: { id: true, customergroup: true, createdAt: true }
            },
            vendor: {
                where: { deletedAt: null },
                select: { id: true, vendorgroup: true, createdAt: true }
            },
            employee: {
                where: { deletedAt: null },
                select: {
                    id: true,
                    positionId: true,
                    facilityId: true,
                    facility: { select: { id: true, facilityCode: true, facilityName: true } },
                    startDate: true,
                    position: { select: { id: true, name: true } }
                }
            }
        }
    });
}

export async function getProfileByUserId(userId: string) {
    const existingUser = await prisma.user.findFirst({
        where: {
            deletedAt: null,
            id: userId
        },
        include: {
            userProfile: {
                where: {
                    deletedAt: null
                },
                include: {
                    socialMedia: {
                        where: {
                            deletedAt: null
                        },
                        orderBy: {
                            createdAt: "asc"
                        }
                    }
                }
            }
        }
    });

    return existingUser?.userProfile ?? null;
}

export async function grantSuperUserController(
    request: FastifyRequest<{ Body: { profileId: number } }>,
    reply: FastifyReply
) {
    const { profileId } = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const userFound = await prisma.user.findFirst({
        where: {
            deletedAt: null,
            profileId
        }
    });

    if (!userFound) {
        throw AppError.notFound("Profile has no associated user account!");
    }
    if (userFound.isSuperAdmin) {
        throw AppError.conflict("User is already a super user!");
    }

    await grantSuperUser(userFound.id, user.id);
    return success(reply, null, "Profile successfully granted super user status.");
}

export async function revokeSuperUserController(
    request: FastifyRequest<{ Body: { profileId: number } }>,
    reply: FastifyReply
) {
    const { profileId } = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const userFound = await prisma.user.findFirst({
        where: {
            deletedAt: null,
            profileId
        }
    });

    if (!userFound) {
        throw AppError.notFound("Profile has no associated user account!");
    }
    if (!userFound.isSuperAdmin) {
        throw AppError.badRequest("Profile is not a super user!");
    }

    await revokeSuperUser(userFound.id, user.id);
    return success(reply, null, "Profile successfully revoked super user status.");
}

export async function associateProfileUser(
    request: FastifyRequest<{ Body: { profileId: number; userEmail: string } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const context = await auth.$context;
    const userFound = await context.internalAdapter.findUserByEmail(data.userEmail);
    if (!userFound) {
        throw AppError.notFound("User not found!");
    }

    const existingProfile = await getProfileById(data.profileId);
    if (!existingProfile) {
        throw AppError.notFound("Profile not found!");
    }

    const existingUser = await prisma.user.findFirst({
        where: {
            deletedAt: null,
            email: data.userEmail
        }
    });
    if (!existingUser) {
        throw AppError.notFound("User not found!");
    }

    const userProfile = await getProfileByUserId(existingUser.id);
    if (userProfile) {
        if (userProfile.id === data.profileId) {
            throw AppError.badRequest("Profile is already associated with this user!");
        }
        throw AppError.conflict("User already has an associated profile!");
    }

    const existingUserForProfile = await prisma.user.findFirst({
        where: {
            profileId: existingProfile.id,
            deletedAt: null
        }
    });

    if (existingUserForProfile) {
        throw AppError.badRequest("Profile is already associated with another user!");
    }

    await prisma.user.update({
        where: { id: existingUser.id },
        data: {
            profileId: existingProfile.id,
            updatedBy: user.id
        }
    });

    return success(reply, null, "Profile successfully associated with user.");
}

export function combineName(firstName: string, lastName: string) {
    return lastName ? `${firstName} ${lastName}` : firstName;
}