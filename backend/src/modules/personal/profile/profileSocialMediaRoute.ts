import { FastifyInstance } from "fastify";
import {
    addSocialMediaController,
    deleteSocialMediaController,
    updateSocialMediaController,
    getSocialMediaController
} from "./profileSocialMediaController";
import {
    profileSocialMediaSchema,
    updateProfileSocialMediaSchema,
    deleteProfileSocialMediaSchema,
    getProfileSocialMediaSchema
} from "./profileSocialMediaSchema";
import { authPreHandler } from "../auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";

export async function profileSocialMediaRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/profileSocialMedia/create", {
        preHandler: [authPreHandler, validateSchema(profileSocialMediaSchema), validatePermission],
        handler: addSocialMediaController
    });

    fastify.post("/api/profileSocialMedia/delete", {
        preHandler: [authPreHandler, validateSchema(deleteProfileSocialMediaSchema), validatePermission],
        handler: deleteSocialMediaController
    });

    fastify.post("/api/profileSocialMedia/get", {
        preHandler: [authPreHandler, validateSchema(getProfileSocialMediaSchema), validatePermission],
        handler: getSocialMediaController
    });

    fastify.post("/api/profileSocialMedia/update", {
        preHandler: [authPreHandler, validateSchema(updateProfileSocialMediaSchema), validatePermission],
        handler: updateSocialMediaController
    });
}
