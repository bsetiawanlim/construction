import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { getProfileById } from "./profileController";
import { extractFieldForUpdate } from "../../../utils/prismaUtils";
import { AppError } from "../../../utils/errors";
import { success, created } from "../../../utils/response";
import {
    profileSocialMediaType,
    updateProfileSocialMediaType,
    deleteProfileSocialMediaType,
    getProfileSocialMediaType
} from "./profileSocialMediaSchema";

export async function addSocialMediaController(
    request: FastifyRequest<{ Body: profileSocialMediaType }>,
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

    const normalizedPlatform = data.platform.trim().toLowerCase();

    // Check if platform + username/url already exists for this profile
    const existing = await prisma.profileSocialMedia.findFirst({
        where: {
            profileId: data.profileId,
            platform: { equals: normalizedPlatform, mode: "insensitive" },
            deletedAt: null,
            ...(data.username ? { username: { equals: data.username.trim(), mode: "insensitive" } } : {})
        }
    });

    if (existing && data.username) {
        throw AppError.conflict(`Social media account on ${data.platform} for username "${data.username}" already exists.`);
    }

    const socialMedia = await prisma.profileSocialMedia.create({
        data: {
            profileId: data.profileId,
            platform: normalizedPlatform,
            username: data.username ? data.username.trim() : null,
            url: data.url.trim(),
            notes: data.notes ? data.notes.trim() : null,
            createdBy: user.id,
            updatedBy: user.id,
        }
    });

    return created(reply, socialMedia, "Profile social media account successfully added.");
}

export async function deleteSocialMediaController(
    request: FastifyRequest<{ Body: deleteProfileSocialMediaType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existing = await prisma.profileSocialMedia.findFirst({
        where: {
            id: data.id,
            deletedAt: null
        }
    });

    if (!existing) {
        throw AppError.notFound("Profile social media record not found!");
    }

    const updated = await prisma.profileSocialMedia.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        }
    });

    return success(reply, updated, "Profile social media account successfully deleted.");
}

export async function updateSocialMediaController(
    request: FastifyRequest<{ Body: updateProfileSocialMediaType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existing = await prisma.profileSocialMedia.findFirst({
        where: {
            id: data.id,
            deletedAt: null
        }
    });

    if (!existing) {
        throw AppError.notFound("Profile social media record not found!");
    }

    const updatePayload: Record<string, any> = {
        updatedAt: new Date(),
        updatedBy: user.id
    };

    if (data.platform !== undefined) {
        updatePayload.platform = data.platform.trim().toLowerCase();
    }
    if (data.username !== undefined) {
        updatePayload.username = data.username ? data.username.trim() : null;
    }
    if (data.url !== undefined) {
        updatePayload.url = data.url.trim();
    }
    if (data.notes !== undefined) {
        updatePayload.notes = data.notes ? data.notes.trim() : null;
    }

    const updated = await prisma.profileSocialMedia.update({
        where: { id: data.id },
        data: updatePayload
    });

    return success(reply, updated, "Profile social media account successfully updated.");
}

export async function getSocialMediaController(
    request: FastifyRequest<{ Body: getProfileSocialMediaType }>,
    reply: FastifyReply
) {
    const data = request.body;

    const items = await prisma.profileSocialMedia.findMany({
        where: {
            profileId: data.profileId,
            deletedAt: null
        },
        orderBy: {
            createdAt: "asc"
        }
    });

    return success(reply, items, "Profile social media accounts retrieved successfully.");
}
