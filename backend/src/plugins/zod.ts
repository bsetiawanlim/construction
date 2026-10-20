import { z } from "zod";
import { FastifyRequest, FastifyReply } from "fastify";

export type ValidationTarget = "body" | "query" | "params";

export const validateSchema = (
    schema: z.ZodTypeAny,
    target: ValidationTarget = "body"
) => {
    return async (req: FastifyRequest | any, reply: FastifyReply | any) => {
        try {
            const sourceData = target === "query"
                ? req.query
                : target === "params"
                    ? req.params
                    : req.body;

            const result = await schema.safeParseAsync(sourceData);

            if (!result.success) {
                const formattedErrors = result.error.issues.map((issue) => ({
                    field: issue.path.join(".") || target,
                    message: issue.message,
                    code: issue.code
                }));

                return reply.status(400).send({
                    success: false,
                    statusCode: 400,
                    code: "VALIDATION_ERROR",
                    error: formattedErrors[0]?.message || "Invalid data. Check Schema.",
                    message: formattedErrors[0]?.message || "Validation failed.",
                    details: formattedErrors
                });
            }

            if (target === "query") {
                req.query = result.data;
            } else if (target === "params") {
                req.params = result.data;
            } else {
                req.body = result.data;
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    statusCode: 400,
                    code: "VALIDATION_ERROR",
                    error: "Validation failed",
                    details: error.issues
                });
            }
            throw error;
        }
    };
};