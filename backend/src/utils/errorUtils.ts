import { AppError, handlePrismaError } from "./errors";

/**
 * @deprecated Use AppError from "./errors" instead.
 */
export class CustomError extends AppError {
    constructor(message: string, code: number = 400) {
        super(message, code, "CUSTOM_ERROR");
    }
}

/**
 * Legacy catchErrorReply function maintained for backward compatibility.
 * Wherever possible, prefer throwing AppError and letting the global error handler handle it.
 */
export async function catchErrorReply(reply: any, error: unknown) {
    if (error instanceof AppError) {
        return reply.code(error.statusCode).send({
            success: false,
            statusCode: error.statusCode,
            code: error.code,
            error: error.message,
            message: error.message,
            details: error.details ?? null
        });
    }

    if (error instanceof CustomError) {
        return reply.code(error.statusCode).send({
            success: false,
            statusCode: error.statusCode,
            error: error.message,
            message: error.message
        });
    }

    if ((error as any)?.code?.startsWith?.("P") || (error as any)?.name?.includes?.("Prisma")) {
        const appErr = handlePrismaError(error);
        return reply.code(appErr.statusCode).send({
            success: false,
            statusCode: appErr.statusCode,
            code: appErr.code,
            error: appErr.message,
            message: appErr.message
        });
    }

    const statusCode = typeof (error as any)?.statusCode === "number"
        ? (error as any).statusCode
        : typeof (error as any)?.code === "number"
            ? (error as any).code
            : 500;

    return reply.code(statusCode).send({
        success: false,
        statusCode,
        error: (error as any)?.message || "Internal server error",
        message: (error as any)?.message || "Internal server error"
    });
}

/**
 * @deprecated Use handlePrismaError from "./errors" instead.
 */
export function catchPrismaError(error: any): never {
    throw handlePrismaError(error);
}

export { AppError, handlePrismaError };