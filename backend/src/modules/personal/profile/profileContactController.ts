import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { getProfileById } from "./profileController";
import { extractFieldForUpdate } from "../../../utils/prismaUtils";
import { AppError } from "../../../utils/errors";
import { success, created } from "../../../utils/response";
import { profileContactType, deleteProfileContactType, getProfileContactType } from "./profileContactSchema";

export async function addContactController(
    request: FastifyRequest<{ Body: profileContactType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    if (data.profileId === data.contactPersonId) {
        throw AppError.badRequest("Profile and contact person cannot be the same.");
    }

    const profile = await getProfileById(data.profileId);
    if (!profile) {
        throw AppError.notFound("Profile not found!");
    }

    const contactPerson = await getProfileById(data.contactPersonId);
    if (!contactPerson) {
        throw AppError.notFound("Contact person not found!");
    }

    if (!profile.isCompany) {
        throw AppError.badRequest("Profile must be a company.");
    }

    if (contactPerson.isCompany) {
        throw AppError.badRequest("Contact person must be an individual, not a company.");
    }

    const existingContactPerson = await prisma.profileContact.findFirst({
        where: {
            profileId: data.profileId,
            contactPersonId: data.contactPersonId,
            deletedAt: null
        }
    });

    if (existingContactPerson) {
        throw AppError.conflict("Profile contact relationship already exists.");
    }

    const profileContact = await prisma.profileContact.create({
        data: {
            profileId: data.profileId,
            contactPersonId: data.contactPersonId,
            position: data.position ?? null,
            updatedAt: new Date(),
            createdAt: new Date(),
            createdBy: user.id,
            updatedBy: user.id,
        }
    });

    return created(reply, profileContact, "Profile contact successfully created.");
}

export async function deleteContactController(
    request: FastifyRequest<{ Body: deleteProfileContactType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existingContactPerson = await prisma.profileContact.findFirst({
        where: {
            id: data.id,
            deletedAt: null
        }
    });

    if (!existingContactPerson) {
        throw AppError.notFound("Profile contact not found!");
    }

    const profileContact = await prisma.profileContact.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        }
    });

    return success(reply, profileContact, "Profile contact successfully deleted.");
}

export async function updateContactController(
    request: FastifyRequest<{ Body: Partial<profileContactType> & { id: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const profileContact = await prisma.profileContact.findFirst({
        where: {
            id: data.id,
            deletedAt: null
        }
    });

    if (!profileContact) {
        throw AppError.notFound("Profile contact not found!");
    }

    const fields = extractFieldForUpdate(profileContact, data);
    if (!fields) {
        return success(reply, profileContact, "No fields to update.");
    }

    const updatedProfileContact = await prisma.profileContact.update({
        where: { id: data.id },
        data: {
            ...fields,
            updatedAt: new Date(),
            updatedBy: user.id
        }
    });

    return success(reply, updatedProfileContact, "Profile contact successfully updated.");
}

export async function getContactsController(
    request: FastifyRequest<{ Body: getProfileContactType }>,
    reply: FastifyReply
) {
    const data = request.body;

    const profileContacts = await prisma.profileContact.findMany({
        where: {
            profileId: data.profileId,
            deletedAt: null
        },
        include: {
            profile: true,
            contactPerson: true
        }
    });

    return success(reply, profileContacts, "Profile contacts successfully retrieved.", 200, {
        profileContacts
    });
}

export async function assignContactPerson(user: { id: string }, profileId: number, contactPersonId: number) {
    const profile = await getProfileById(profileId);
    const contactPerson = await getProfileById(contactPersonId);

    if (!profile) {
        throw AppError.notFound("Profile not found!");
    }
    if (!contactPerson) {
        throw AppError.notFound("Contact person not found!");
    }

    const existingContactPerson = await prisma.profileContact.findFirst({
        where: {
            profileId: profile.id,
            contactPersonId: contactPerson.id,
            deletedAt: null
        }
    });

    if (existingContactPerson) {
        throw AppError.conflict("Contact person has already been assigned to this profile!");
    }

    return await prisma.profileContact.create({
        data: {
            profile: { connect: { id: profile.id } },
            contactPerson: { connect: { id: contactPerson.id } },
            updatedAt: new Date(),
            createdAt: new Date(),
            contactPersonCreatedBy: { connect: { id: user.id } },
            contactPersonUpdatedBy: { connect: { id: user.id } },
        }
    });
}
