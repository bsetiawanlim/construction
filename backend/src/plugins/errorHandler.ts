import { FastifyInstance, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { ZodError } from "zod";
import { AppError, handlePrismaError } from "../utils/errors";

const errorHandlerPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    fastify.setErrorHandler((error, request, reply) => {
        // 1. AppError (operational business/application errors)
        if (error instanceof AppError) {
            return reply.status(error.statusCode).send({
                success: false,
                statusCode: error.statusCode,
                code: error.code,
                error: error.message,
                message: error.message,
                details: error.details ?? null
            });
        }

        // 2. Zod validation errors
        if (error instanceof ZodError) {
            const formattedErrors = error.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
                code: issue.code
            }));

            return reply.status(400).send({
                success: false,
                statusCode: 400,
                code: "VALIDATION_ERROR",
                error: "Validation failed",
                message: "Validation failed",
                details: formattedErrors
            });
        }

        // 3. Prisma errors
        if (
            (error as any)?.code?.startsWith("P") ||
            (error as any)?.name?.includes("Prisma")
        ) {
            const appErr = handlePrismaError(error);
            return reply.status(appErr.statusCode).send({
                success: false,
                statusCode: appErr.statusCode,
                code: appErr.code,
                error: appErr.message,
                message: appErr.message,
                details: appErr.details ?? null
            });
        }

        // 4. Fastify schema validation errors
        const err = error as any;
        if (err?.validation) {
            return reply.status(400).send({
                success: false,
                statusCode: 400,
                code: "SCHEMA_VALIDATION_ERROR",
                error: err.message,
                message: err.message,
                details: err.validation
            });
        }

        // 5. Unknown internal server errors
        const statusCode = typeof err?.statusCode === "number" ? err.statusCode : 500;
        request.log.error(error);

        return reply.status(statusCode).send({
            success: false,
            statusCode,
            code: "INTERNAL_SERVER_ERROR",
            error: statusCode === 500 && process.env.NODE_ENV === "production"
                ? "An unexpected internal server error occurred"
                : err?.message || "Internal server error"
        });
    });
};

export default fp(errorHandlerPlugin, {
    name: "error-handler"
});
