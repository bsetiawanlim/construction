import { FastifyRequest, FastifyReply, RouteGenericInterface } from "fastify";

export interface SessionUser {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    emailVerified?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    profileId?: number | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    isSuperAdmin?: boolean;
    roleId?: number | null;
    [key: string]: unknown;
}

export interface UserSession {
    session: {
        id: string;
        userId: string;
        expiresAt: Date;
        token?: string;
        ipAddress?: string | null;
        userAgent?: string | null;
        createdAt?: Date;
        updatedAt?: Date;
        [key: string]: unknown;
    };
    user: SessionUser;
}

declare module "fastify" {
    interface FastifyRequest {
        session?: UserSession;
    }
}

export type TypedHandler<
    TBody = unknown,
    TParams = unknown,
    TQuery = unknown,
    THeaders = unknown
> = (
    request: FastifyRequest<{
        Body: TBody;
        Params: TParams;
        Querystring: TQuery;
        Headers: THeaders;
    }>,
    reply: FastifyReply
) => Promise<unknown> | unknown;
