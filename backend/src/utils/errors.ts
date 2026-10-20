export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly details?: unknown;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number = 400, code: string = "BAD_REQUEST", details?: unknown) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message = "Bad request", details?: unknown, code = "BAD_REQUEST"): AppError {
        return new AppError(message, 400, code, details);
    }

    static unauthorized(message = "Unauthorized", details?: unknown, code = "UNAUTHORIZED"): AppError {
        return new AppError(message, 401, code, details);
    }

    static forbidden(message = "Forbidden", details?: unknown, code = "FORBIDDEN"): AppError {
        return new AppError(message, 403, code, details);
    }

    static notFound(message = "Resource not found", details?: unknown, code = "NOT_FOUND"): AppError {
        return new AppError(message, 404, code, details);
    }

    static conflict(message = "Resource already exists or conflict occurred", details?: unknown, code = "CONFLICT"): AppError {
        return new AppError(message, 409, code, details);
    }

    static unprocessable(message = "Unprocessable entity", details?: unknown, code = "UNPROCESSABLE_ENTITY"): AppError {
        return new AppError(message, 422, code, details);
    }

    static internal(message = "Internal server error", details?: unknown, code = "INTERNAL_SERVER_ERROR"): AppError {
        return new AppError(message, 500, code, details);
    }
}

export function handlePrismaError(error: any): AppError {
    if (error instanceof AppError) {
        return error;
    }

    // Check Prisma Known Request Errors by code
    const code = error?.code;
    if (code) {
        switch (code) {
            case "P2002": {
                const target = Array.isArray(error.meta?.target)
                    ? error.meta.target.join(", ")
                    : error.meta?.target || "unique field";
                return AppError.conflict(`Duplicate entry for ${target}. Resource already exists.`);
            }
            case "P2025": {
                return AppError.notFound(error.meta?.cause || "Record not found.");
            }
            case "P2003": {
                const field = error.meta?.field_name || "foreign key";
                return AppError.badRequest(`Foreign key constraint failed on: ${field}.`);
            }
            case "P2014": {
                return AppError.badRequest("The change you are trying to make violates a required relation.");
            }
            default:
                break;
        }
    }

    // Check Prisma error by name
    const errorName = error?.name;
    if (errorName === "PrismaClientValidationError") {
        console.error("PrismaClientValidationError details:", error?.message);
        return AppError.badRequest(`Database validation error: ${error?.message || "Invalid input data provided."}`);
    }
    if (errorName === "PrismaClientInitializationError") {
        return AppError.internal("Database connection failed. Please ensure the database is running.");
    }

    return AppError.badRequest(error?.message || "Database operation failed.");
}
