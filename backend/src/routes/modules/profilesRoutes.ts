import { FastifyInstance } from "fastify";

// Profile (Master person profile, contacts, documents, social media)
import { profileRoutes } from "../../modules/personal/profile/profileRoute";
import { profileContactRoutes } from "../../modules/personal/profile/profileContactRoute";
import { profileDocumentRoutes } from "../../modules/personal/profile/profileDocumentRoute";
import { profileSocialMediaRoutes } from "../../modules/personal/profile/profileSocialMediaRoute";

// Vendor (Suppliers, procurement partners)
import { vendorRoutes } from "../../modules/personal/associate/vendorRoute";

// Customer (Client profiles, customer tiers)
import { customerRoutes } from "../../modules/personal/associate/customerRoute";

// Employee (Staff directory, positions, attendance)
import { employeeRoutes } from "../../modules/employee/employee/employeeRoute";
import { positionRoutes } from "../../modules/employee/position/positionRoute";
import { attendanceRoutes } from "../../modules/employee/attendance/attendanceRoute";
import { scheduleRoutes } from "../../modules/employee/schedule/scheduleRoutes";

/**
 * Profiles Module Routes:
 * - Profile (Master Identity Records, Contacts, Documents, Social Links)
 * - Vendor (Suppliers & Procurement Contacts)
 * - Customer (Clients, Loyalty, CRM)
 * - Employee (Staff, Internal Positions, Attendance)
 */
export async function profilesRoutes(fastify: FastifyInstance, options: any) {
  // Profile
  fastify.register(profileRoutes);
  fastify.register(profileContactRoutes);
  fastify.register(profileDocumentRoutes);
  fastify.register(profileSocialMediaRoutes);

  // Vendor
  fastify.register(vendorRoutes);

  // Customer
  fastify.register(customerRoutes);

  // Employee
  fastify.register(employeeRoutes);
  fastify.register(positionRoutes);
  fastify.register(attendanceRoutes);
  fastify.register(scheduleRoutes);
}
