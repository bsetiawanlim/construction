import { FastifyInstance } from "fastify";
import { authPreHandler } from "../personal/auth/authController";
import { validateSchema } from "../../plugins/zod";
import validatePermission from "../../plugins/permission";
import {
  createFacilitySchema,
  updateFacilitySchema,
  deleteFacilitySchema,
  getFacilitySchema,
  getFacilitiesSchema,
  createFacilitySectionSchema,
  updateFacilitySectionSchema,
  deleteFacilitySectionSchema,
  getFacilitySectionsSchema,
  createFacilityEmployeeSchema,
  updateFacilityEmployeeSchema,
  deleteFacilityEmployeeSchema,
  getFacilityEmployeesSchema,
  getEmployeeFacilitiesSchema,
  createFacilityProductSchema,
  updateFacilityProductSchema,
  deleteFacilityProductSchema,
  getFacilityProductsSchema,
  createFacilityEquipmentSchema,
  updateFacilityEquipmentSchema,
  deleteFacilityEquipmentSchema,
  getFacilityEquipmentsSchema,
  createFacilityTableSchema,
  updateFacilityTableSchema,
  deleteFacilityTableSchema,
  getFacilityTablesSchema,
} from "./facilitySchema";
import {
  createFacilityController,
  updateFacilityController,
  deleteFacilityController,
  getFacilityController,
  getFacilitiesController,
  createFacilitySectionController,
  updateFacilitySectionController,
  deleteFacilitySectionController,
  getFacilitySectionsController,
  createFacilityEmployeeController,
  updateFacilityEmployeeController,
  deleteFacilityEmployeeController,
  getFacilityEmployeesController,
  getEmployeeFacilitiesController,
  createFacilityProductController,
  updateFacilityProductController,
  deleteFacilityProductController,
  getFacilityProductsController,
  createFacilityEquipmentController,
  updateFacilityEquipmentController,
  deleteFacilityEquipmentController,
  getFacilityEquipmentsController,
  createFacilityTableController,
  updateFacilityTableController,
  deleteFacilityTableController,
  getFacilityTablesController,
} from "./facilityController";

export async function facilityRoutes(fastify: FastifyInstance) {
  // Facility endpoints
  fastify.post("/api/facility/create", {
    preHandler: [validateSchema(createFacilitySchema), authPreHandler, validatePermission],
    handler: createFacilityController,
  });

  fastify.post("/api/facility/update", {
    preHandler: [validateSchema(updateFacilitySchema), authPreHandler, validatePermission],
    handler: updateFacilityController,
  });

  fastify.post("/api/facility/delete", {
    preHandler: [validateSchema(deleteFacilitySchema), authPreHandler, validatePermission],
    handler: deleteFacilityController,
  });

  fastify.post("/api/facility/get", {
    preHandler: [validateSchema(getFacilitySchema), authPreHandler, validatePermission],
    handler: getFacilityController,
  });

  fastify.post("/api/facility/get-all", {
    preHandler: [validateSchema(getFacilitiesSchema), authPreHandler, validatePermission],
    handler: getFacilitiesController,
  });

  // Section endpoints
  fastify.post("/api/facility-section/create", {
    preHandler: [validateSchema(createFacilitySectionSchema), authPreHandler, validatePermission],
    handler: createFacilitySectionController,
  });

  fastify.post("/api/facility-section/update", {
    preHandler: [validateSchema(updateFacilitySectionSchema), authPreHandler, validatePermission],
    handler: updateFacilitySectionController,
  });

  fastify.post("/api/facility-section/delete", {
    preHandler: [validateSchema(deleteFacilitySectionSchema), authPreHandler, validatePermission],
    handler: deleteFacilitySectionController,
  });

  fastify.post("/api/facility-section/get-by-facility", {
    preHandler: [validateSchema(getFacilitySectionsSchema), authPreHandler, validatePermission],
    handler: getFacilitySectionsController,
  });

  // Facility Employees (Many-to-Many Conjunction)
  fastify.post("/api/facility-employee/create", {
    preHandler: [validateSchema(createFacilityEmployeeSchema), authPreHandler, validatePermission],
    handler: createFacilityEmployeeController,
  });

  fastify.post("/api/facility-employee/update", {
    preHandler: [validateSchema(updateFacilityEmployeeSchema), authPreHandler, validatePermission],
    handler: updateFacilityEmployeeController,
  });

  fastify.post("/api/facility-employee/delete", {
    preHandler: [validateSchema(deleteFacilityEmployeeSchema), authPreHandler, validatePermission],
    handler: deleteFacilityEmployeeController,
  });

  fastify.post("/api/facility-employee/get-by-facility", {
    preHandler: [validateSchema(getFacilityEmployeesSchema), authPreHandler, validatePermission],
    handler: getFacilityEmployeesController,
  });

  fastify.post("/api/facility-employee/get-by-employee", {
    preHandler: [validateSchema(getEmployeeFacilitiesSchema), authPreHandler, validatePermission],
    handler: getEmployeeFacilitiesController,
  });

  // Facility Products (Many-to-Many Conjunction)
  fastify.post("/api/facility-product/create", {
    preHandler: [validateSchema(createFacilityProductSchema), authPreHandler, validatePermission],
    handler: createFacilityProductController,
  });

  fastify.post("/api/facility-product/update", {
    preHandler: [validateSchema(updateFacilityProductSchema), authPreHandler, validatePermission],
    handler: updateFacilityProductController,
  });

  fastify.post("/api/facility-product/delete", {
    preHandler: [validateSchema(deleteFacilityProductSchema), authPreHandler, validatePermission],
    handler: deleteFacilityProductController,
  });

  fastify.post("/api/facility-product/get-by-facility", {
    preHandler: [validateSchema(getFacilityProductsSchema), authPreHandler, validatePermission],
    handler: getFacilityProductsController,
  });

  // Facility Equipment (Many-to-Many Conjunction)
  fastify.post("/api/facility-equipment/create", {
    preHandler: [validateSchema(createFacilityEquipmentSchema), authPreHandler, validatePermission],
    handler: createFacilityEquipmentController,
  });

  fastify.post("/api/facility-equipment/update", {
    preHandler: [validateSchema(updateFacilityEquipmentSchema), authPreHandler, validatePermission],
    handler: updateFacilityEquipmentController,
  });

  fastify.post("/api/facility-equipment/delete", {
    preHandler: [validateSchema(deleteFacilityEquipmentSchema), authPreHandler, validatePermission],
    handler: deleteFacilityEquipmentController,
  });

  fastify.post("/api/facility-equipment/get-by-facility", {
    preHandler: [validateSchema(getFacilityEquipmentsSchema), authPreHandler, validatePermission],
    handler: getFacilityEquipmentsController,
  });

  // Facility Tables (Dining / Cafe / Seating)
  fastify.post("/api/facility-table/create", {
    preHandler: [validateSchema(createFacilityTableSchema), authPreHandler, validatePermission],
    handler: createFacilityTableController,
  });

  fastify.post("/api/facility-table/update", {
    preHandler: [validateSchema(updateFacilityTableSchema), authPreHandler, validatePermission],
    handler: updateFacilityTableController,
  });

  fastify.post("/api/facility-table/delete", {
    preHandler: [validateSchema(deleteFacilityTableSchema), authPreHandler, validatePermission],
    handler: deleteFacilityTableController,
  });

  fastify.post("/api/facility-table/get-by-facility", {
    preHandler: [validateSchema(getFacilityTablesSchema), authPreHandler, validatePermission],
    handler: getFacilityTablesController,
  });
}

