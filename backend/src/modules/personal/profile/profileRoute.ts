import {
    createProfileController,
    deleteProfileController,
    updateMyProfileController,
    updateProfileController,
    getMyProfileController,
    getAllProfilesController,
    getProfileByIdController,
    grantSuperUserController,
    revokeSuperUserController,
    associateProfileUser
} from "./profileController";
import { FastifyInstance } from "fastify";
import { profileSchema, deleteProfileSchema } from "./profileSchema";
import { authPreHandler } from "../auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";

export async function profileRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/profile/create", {
        preHandler: [authPreHandler, validateSchema(profileSchema), validatePermission],
        handler: createProfileController
    });

    fastify.get("/api/profile/get-me", {
        preHandler: [authPreHandler, validatePermission],
        handler: getMyProfileController
    });

    fastify.get("/api/profile/get-all", {
        preHandler: [authPreHandler, validatePermission],
        handler: getAllProfilesController
    });

    fastify.post("/api/profile/get-id", {
        preHandler: [authPreHandler, validatePermission],
        handler: getProfileByIdController
    });

    fastify.post("/api/profile/update-me", {
        preHandler: [authPreHandler, validateSchema(profileSchema), validatePermission],
        handler: updateMyProfileController
    });
    fastify.post("/api/profile/update", {
        preHandler: [authPreHandler, validateSchema(profileSchema), validatePermission],
        handler: updateProfileController
    });

    fastify.post("/api/profile/delete", {
        preHandler: [authPreHandler, validateSchema(deleteProfileSchema), validatePermission],
        handler: deleteProfileController
    });

    fastify.post("/api/profile/grant-superuser", {
        preHandler: [authPreHandler, validateSchema(deleteProfileSchema), validatePermission],
        handler: grantSuperUserController
    });

    fastify.post("/api/profile/revoke-superuser", {
        preHandler: [authPreHandler, validateSchema(deleteProfileSchema), validatePermission],
        handler: revokeSuperUserController
    });

    fastify.post("/api/profile/associate-user", {
        preHandler: [authPreHandler, validatePermission],
        handler: associateProfileUser
    });

};