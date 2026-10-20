import { FastifyInstance } from "fastify";
import { auth } from "../../../plugins/auth";
import { fromNodeHeaders } from "better-auth/node";
import { signUpEmail, deactivate, reactivate, authPreHandler } from "./authController";
import { signUpEmailSchema, deactivateUserSchema, reactivateUserSchema } from "./authSchema";
import validatePermission from "../../../plugins/permission";
import { validateSchema } from "../../../plugins/zod";

export async function authRoutes(fastify: FastifyInstance) {
    fastify.post("/api/auth/sign-up/email", {
        preHandler: [authPreHandler, validateSchema(signUpEmailSchema), validatePermission],
        handler: signUpEmail
    });

    fastify.post("/api/auth/deactivate", {
        preHandler: [authPreHandler, validateSchema(deactivateUserSchema), validatePermission],
        handler: deactivate
    });

    fastify.post("/api/auth/reactivate", {
        preHandler: [authPreHandler, validateSchema(reactivateUserSchema), validatePermission],
        handler: reactivate
    });

    // Delegate remaining /api/auth routes to Better Auth handler
    fastify.all("/api/auth/*", {
        async handler(request, reply) {
            try {
                const url = new URL(request.url, `http://${request.headers.host}`);
                const headers = fromNodeHeaders(request.headers);
                headers.set("Origin", `http://${request.headers.host}` || "");

                const req = new Request(url.toString(), {
                    method: request.method,
                    headers,
                    ...(request.body && request.method !== "GET" && request.method !== "HEAD"
                        ? { body: JSON.stringify(request.body) }
                        : {}),
                });

                const response = await auth.handler(req);
                reply.status(response.status);
                response.headers.forEach((value, key) => reply.header(key, value));
                return reply.send(response.body ? await response.text() : null);
            } catch (error) {
                fastify.log.error(error, "Authentication Error");
                return reply.status(500).send({
                    success: false,
                    error: "Internal authentication error",
                    code: "AUTH_FAILURE"
                });
            }
        }
    });
}
