import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { getProfileById } from "./profileController";
import { extractFieldForUpdate } from "../../../utils/prismaUtils";
import { AppError } from "../../../utils/errors";
import { success, created } from "../../../utils/response";
import { ProfileDocumentType, deleteProfileDocumentType, getProfileDocumentType } from "./profileDocumentSchema";

export async function addProfileDocumentController(
    request: FastifyRequest<{ Body: ProfileDocumentType }>,
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

    const profileDocument = await prisma.profileDocument.create({
        data: {
            profile: { connect: { id: data.profileId } },
            documentType: data.documentType,
            documentName: data.documentName,
            documentPath: data.documentPath,
            issueDate: data.issueDate ?? null,
            expiredDate: data.expiredDate ?? null,
            updatedAt: new Date(),
            createdAt: new Date(),
            profileDocumentCreatedBy: { connect: { id: user.id } },
            profileDocumentUpdatedBy: { connect: { id: user.id } },
        }
    });

    return created(reply, profileDocument, "Profile document successfully created.");
}

export async function deleteProfileDocumentController(
    request: FastifyRequest<{ Body: deleteProfileDocumentType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existingDocument = await prisma.profileDocument.findFirst({
        where: {
            id: data.id,
            deletedAt: null
        }
    });

    if (!existingDocument) {
        throw AppError.notFound("Profile document not found!");
    }

    const profileDocument = await prisma.profileDocument.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        }
    });

    return success(reply, profileDocument, "Profile document successfully deleted.");
}

export async function updateProfileDocumentController(
    request: FastifyRequest<{ Body: Partial<ProfileDocumentType> & { id: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const profileDocument = await prisma.profileDocument.findFirst({
        where: {
            id: data.id,
            deletedAt: null
        }
    });

    if (!profileDocument) {
        throw AppError.notFound("Profile document not found!");
    }

    const fields = extractFieldForUpdate(profileDocument, data);
    if (!fields) {
        return success(reply, profileDocument, "No fields to update.");
    }

    const updatedProfileDocument = await prisma.profileDocument.update({
        where: { id: data.id },
        data: {
            ...fields,
            updatedAt: new Date(),
            profileDocumentUpdatedBy: { connect: { id: user.id } },
        }
    });

    return success(reply, updatedProfileDocument, "Profile document successfully updated.");
}

export async function getProfileDocumentsController(
    request: FastifyRequest<{ Body: getProfileDocumentType }>,
    reply: FastifyReply
) {
    const data = request.body;

    const profile = await getProfileById(data.profileId);
    if (!profile) {
        throw AppError.notFound("Profile not found!");
    }

    const profileDocuments = await prisma.profileDocument.findMany({
        where: {
            profileId: data.profileId,
            deletedAt: null
        }
    });

    return success(reply, profileDocuments, "Profile documents successfully retrieved.", 200, {
        profileDocuments
    });
}
