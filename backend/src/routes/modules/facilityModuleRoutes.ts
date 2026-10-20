import { FastifyInstance } from "fastify";
import { facilityRoutes } from "../../modules/facility/facilityRoute";

/**
 * Facility Module Routes:
 * - Physical Facilities & Store Outlets
 * - Facility Section Stations & Order Displays (KDS)
 * - Tables & QR Dine-in Tokens
 */
export async function facilityModuleRoutes(fastify: FastifyInstance, options: any) {
  fastify.register(facilityRoutes);
}
