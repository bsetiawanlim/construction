import {
    addProfileDocumentController,
    deleteProfileDocumentController,
    updateProfileDocumentController,
    getProfileDocumentsController
} from "./profileDocumentController";
import { FastifyInstance } from "fastify";
import { profileDocumentSchema, deleteProfileDocumentSchema, getProfileDocumentSchema } from "./profileDocumentSchema";
import { authPreHandler } from "../auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";

export async function profileDocumentRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/profileDocument/create", {
        preHandler: [authPreHandler, validateSchema(profileDocumentSchema), validatePermission],
        handler: addProfileDocumentController
    });

    fastify.post("/api/profileDocument/delete", {
        preHandler: [authPreHandler, validateSchema(deleteProfileDocumentSchema), validatePermission],
        handler: deleteProfileDocumentController
    });

    fastify.post("/api/profileDocument/get", {
        preHandler: [authPreHandler, validateSchema(getProfileDocumentSchema), validatePermission],
        handler: getProfileDocumentsController
    });

    fastify.post("/api/profileDocument/update", {
        preHandler: [authPreHandler, validatePermission],
        handler: updateProfileDocumentController
    });
}
