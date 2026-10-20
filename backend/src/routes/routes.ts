import fp from 'fastify-plugin';
import { FastifyInstance } from "fastify";

// Modular Domain Route Registrars
import { systemModuleRoutes } from './modules/systemModuleRoutes';
import { transactionRoutes } from './modules/transactionRoutes';
import { profilesRoutes } from './modules/profilesRoutes';
import { userModuleRoutes } from './modules/userRoutes';
import { productModuleRoutes } from './modules/productRoutes';
import { facilityModuleRoutes } from './modules/facilityModuleRoutes';
import { generalRoutes } from './modules/generalRoutes';
import { adminRoutes } from './modules/adminRoutes';

/**
 * Enterprise Route Registry
 * Grouped into domain modules:
 * - Transaction (Sales, Purchase, Payroll, Rents)
 * - Profiles (Profile, Vendor, Customer, Employee)
 * - User (User, Role, Permissions)
 * - Product (Product, Formula, Equipment)
 * - Facility (Facilities, Sections, Tables)
 * - General (Accounting, Logistics, Work)
 * - System (Module Lifecycle & Feature Toggles)
 */
async function routes(fastify: FastifyInstance, options: any) {
    // 1. System Modules Lifecycle & Feature Toggle API
    fastify.register(systemModuleRoutes);

    // 2. Transaction Module (Sales, Purchase, Payroll, Rents)
    fastify.register(transactionRoutes);

    // 3. Profiles Module (Profile, Vendor, Customer, Employee)
    fastify.register(profilesRoutes);

    // 4. User Module (User, Role, Permissions, Auth)
    fastify.register(userModuleRoutes);

    // 5. Product Module (Product, Formula, Equipment)
    fastify.register(productModuleRoutes);

    // 6. Facility Module (Facilities, Sections, Tables)
    fastify.register(facilityModuleRoutes);

    // 7. General Platform Services (Monetary, Logistics, Work)
    fastify.register(generalRoutes);

    // 8. Admin Services (Database Backup & Restore)
    fastify.register(adminRoutes);
}

export default fp(routes);
