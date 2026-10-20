import { FastifyRequest, FastifyReply } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../../../plugins/auth";
import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { success, created } from "../../../utils/response";
import { SignUpEmailInput, DeactivateUserInput, ReactivateUserInput } from "./authSchema";

export async function authPreHandler(request: FastifyRequest, reply: FastifyReply) {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
        throw AppError.unauthorized("Authentication required");
    }

    request.session = session;
}

export async function signUpEmail(
    request: FastifyRequest<{ Body: SignUpEmailInput }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized();
    }

    const newUser = await createUser(user, data);
    return created(reply, newUser, "User successfully created.");
}

export async function deactivate(
    request: FastifyRequest<{ Body: DeactivateUserInput }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized();
    }

    const result = await deactivateUser(user, data.userId, data.userEmail);
    return success(reply, result, "User successfully deactivated.");
}

export async function reactivate(
    request: FastifyRequest<{ Body: ReactivateUserInput }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized();
    }

    const result = await reactivateUser(user, data.userId, data.userEmail);
    return success(reply, result, "User successfully reactivated.");
}

export async function createUser(user: { id: string }, data: SignUpEmailInput) {
    const existingUser = await prisma.user.findFirst({
        where: {
            email: data.email,
            deletedAt: null
        }
    });

    if (existingUser) {
        throw AppError.conflict("User with this email already exists!");
    }

    const result = await auth.api.signUpEmail({
        returnHeaders: true,
        body: {
            profileId: data.profileId ?? undefined,
            email: data.email,
            password: data.password,
            name: data.name,
            roleId: data.roleId ?? undefined,
            isSuperAdmin: data.isSuperAdmin || false,
            createdBy: user.id
        }
    });

    return result;
}

export async function getUser(userId: string) {
    const context = await auth.$context;
    return await context.internalAdapter.findUserById(userId);
}

export async function assignUserToProfile(user: { id: string }, userId: string, profileId: number) {
    const updated = await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            profileId: profileId,
            updatedBy: user.id,
        }
    });
    return { statusCode: 200, message: "User successfully assigned to profile.", user: updated };
}

export async function deleteUser(user: { id: string }, userId?: string, userEmail?: string, profileId?: number) {
    if (!userId && !userEmail && !profileId) {
        throw AppError.badRequest("At least one identifier (userId, userEmail, profileId) must be provided.");
    }

    return await prisma.user.delete({
        where: {
            id: userId ?? undefined,
            email: userEmail ?? undefined,
            profileId: profileId ?? undefined,
        }
    });
}

export async function deactivateUser(user: { id: string }, userId?: string, userEmail?: string) {
    if (!userId && !userEmail) {
        throw AppError.badRequest("User ID or Email is required!");
    }

    const existingUser = await prisma.user.findFirst({
        where: {
            id: userId ?? undefined,
            email: userEmail ?? undefined,
            deletedAt: null
        }
    });

    if (!existingUser) {
        throw AppError.notFound("User not found!");
    }

    await prisma.user.update({
        where: {
            id: existingUser.id
        },
        data: {
            deletedAt: new Date(),
            updatedBy: user.id
        }
    });

    return { statusCode: 200, message: "User successfully deactivated." };
}

export async function reactivateUser(user: { id: string }, userId?: string, userEmail?: string) {
    if (!userId && !userEmail) {
        throw AppError.badRequest("User ID or Email is required!");
    }

    const existingUser = await prisma.user.findFirst({
        where: {
            id: userId ?? undefined,
            email: userEmail ?? undefined
        }
    });

    if (!existingUser) {
        throw AppError.notFound("User not found!");
    }

    if (!existingUser.deletedAt) {
        throw AppError.badRequest("User is already active!");
    }

    await prisma.user.update({
        where: {
            id: existingUser.id
        },
        data: {
            deletedAt: null,
            updatedBy: user.id,
        }
    });

    return { statusCode: 200, message: "User successfully reactivated." };
}