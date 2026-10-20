import { FastifyInstance } from "fastify";

// User (Organizational user accounts, credentials)
import { userRoutes } from "../../modules/personal/user/userRoute";

// Role (RBAC security roles)
import { roleRoutes } from "../../modules/personal/role/roleRoute";

// Auth & Session
import { authRoutes } from "../../modules/personal/auth/authRoutes";

/**
 * User Module Routes:
 * - User Accounts (Credentials, Profile Links, Active Flags)
 * - Role Management (RBAC Roles, Role Hierarchy)
 * - Permissions & Authentication (Better-Auth, Action Clearances)
 */
export async function userModuleRoutes(fastify: FastifyInstance, options: any) {
  fastify.register(authRoutes);
  fastify.register(userRoutes);
  fastify.register(roleRoutes);
}
