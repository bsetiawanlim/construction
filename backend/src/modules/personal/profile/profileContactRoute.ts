import {
    addContactController,
    deleteContactController,
    updateContactController,
    getContactsController
} from "./profileContactController";
import { FastifyInstance } from "fastify";
import { profileContactSchema, deleteProfileContactSchema, getProfileContactSchema } from "./profileContactSchema";
import { authPreHandler } from "../auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";

export async function profileContactRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/profileContact/create", {
        preHandler: [authPreHandler, validateSchema(profileContactSchema), validatePermission],
        handler: addContactController
    });

    fastify.post("/api/profileContact/delete", {
        preHandler: [authPreHandler, validateSchema(deleteProfileContactSchema), validatePermission],
        handler: deleteContactController
    });

    fastify.post("/api/profileContact/get", {
        preHandler: [authPreHandler, validateSchema(getProfileContactSchema), validatePermission],
        handler: getContactsController
    });

    fastify.post("/api/profileContact/update", {
        preHandler: [authPreHandler, validatePermission],
        handler: updateContactController
    })

};