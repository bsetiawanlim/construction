import { z } from "zod";

export const facilityTypeEnum = z.enum(["WAREHOUSE", "STORE", "OFFICE", "FACTORY", "OTHER"]);
export const facilitySectionTypeEnum = z.enum(["ZONE", "AISLE", "RACK", "ROOM", "COUNTER", "DISPLAY", "STAGING", "OTHER"]);

export const createFacilitySchema = z.object({
  facilityCode: z.string().min(2).max(50),
  facilityName: z.string().min(2).max(150),
  type: facilityTypeEnum.default("WAREHOUSE"),
  description: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  isActive: z.boolean().default(true),
  discountEnabled: z.boolean().optional(),
  taxEnabled: z.boolean().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  showTaxBreakdown: z.boolean().optional(),
});

export const updateFacilitySchema = z.object({
  id: z.number().int().positive(),
  facilityCode: z.string().min(2).max(50).optional(),
  facilityName: z.string().min(2).max(150).optional(),
  type: facilityTypeEnum.optional(),
  description: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  isActive: z.boolean().optional(),
  discountEnabled: z.boolean().optional(),
  taxEnabled: z.boolean().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  showTaxBreakdown: z.boolean().optional(),
});

export const deleteFacilitySchema = z.object({
  id: z.number().int().positive(),
});

export const getFacilitySchema = z.object({
  id: z.number().int().positive(),
});

export const getFacilitiesSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  type: facilityTypeEnum.optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
});

// Facility Sections
export const createFacilitySectionSchema = z.object({
  facilityId: z.number().int().positive(),
  sectionCode: z.string().min(1).max(50),
  sectionName: z.string().min(1).max(150),
  type: facilitySectionTypeEnum.default("ZONE"),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateFacilitySectionSchema = z.object({
  id: z.number().int().positive(),
  sectionCode: z.string().min(1).max(50).optional(),
  sectionName: z.string().min(1).max(150).optional(),
  type: facilitySectionTypeEnum.optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const deleteFacilitySectionSchema = z.object({
  id: z.number().int().positive(),
});

export const getFacilitySectionsSchema = z.object({
  facilityId: z.number().int().positive(),
});

// Facility Employees (Many-to-Many)
export const createFacilityEmployeeSchema = z.object({
  facilityId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  isPrimary: z.boolean().optional().default(false),
  role: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateFacilityEmployeeSchema = z.object({
  id: z.number().int().positive(),
  isPrimary: z.boolean().optional(),
  role: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const deleteFacilityEmployeeSchema = z.object({
  id: z.number().int().positive(),
});

export const getFacilityEmployeesSchema = z.object({
  facilityId: z.number().int().positive(),
  search: z.string().optional(),
});

export const getEmployeeFacilitiesSchema = z.object({
  employeeId: z.number().int().positive(),
});

// Facility Products (Many-to-Many with tradeable status per facility)
export const createFacilityProductSchema = z.object({
  facilityId: z.number().int().positive(),
  productId: z.number().int().positive(),
  isTradeable: z.boolean().optional().default(true),
  minStock: z.number().optional().nullable(),
  maxStock: z.number().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  notes: z.string().optional().nullable(),
});

export const updateFacilityProductSchema = z.object({
  id: z.number().int().positive(),
  isTradeable: z.boolean().optional(),
  minStock: z.number().optional().nullable(),
  maxStock: z.number().optional().nullable(),
  isActive: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

export const deleteFacilityProductSchema = z.object({
  id: z.number().int().positive(),
});

export const getFacilityProductsSchema = z.object({
  facilityId: z.number().int().positive(),
  isTradeable: z.boolean().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
});

// Facility Equipment (Many-to-Many)
export const createFacilityEquipmentSchema = z.object({
  facilityId: z.number().int().positive(),
  equipmentEntityId: z.number().int().positive(),
  sectionId: z.number().int().positive().optional().nullable(),
  status: z.string().max(50).optional().default("ACTIVE"),
  quantity: z.number().int().min(1).optional().default(1),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateFacilityEquipmentSchema = z.object({
  id: z.number().int().positive(),
  sectionId: z.number().int().positive().optional().nullable(),
  status: z.string().max(50).optional(),
  quantity: z.number().int().min(1).optional(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const deleteFacilityEquipmentSchema = z.object({
  id: z.number().int().positive(),
});

export const getFacilityEquipmentsSchema = z.object({
  facilityId: z.number().int().positive(),
  sectionId: z.number().int().positive().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});

// Facility Tables (Dining / Cafe / Seating)
export const createFacilityTableSchema = z.object({
  facilityId: z.number().int().positive(),
  sectionId: z.number().int().positive().optional().nullable(),
  tableNumber: z.string().min(1).max(50),
  label: z.string().max(100).optional().nullable(),
  capacity: z.number().int().min(1).optional().default(4),
  status: z.string().max(50).optional().default("AVAILABLE"),
  qrCode: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  notes: z.string().optional().nullable(),
});

export const updateFacilityTableSchema = z.object({
  id: z.number().int().positive(),
  sectionId: z.number().int().positive().optional().nullable(),
  tableNumber: z.string().min(1).max(50).optional(),
  label: z.string().max(100).optional().nullable(),
  capacity: z.number().int().min(1).optional(),
  status: z.string().max(50).optional(),
  qrCode: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

export const deleteFacilityTableSchema = z.object({
  id: z.number().int().positive(),
});

export const getFacilityTablesSchema = z.object({
  facilityId: z.number().int().positive(),
  sectionId: z.number().int().positive().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});

export type CreateFacilityInput = z.infer<typeof createFacilitySchema>;
export type UpdateFacilityInput = z.infer<typeof updateFacilitySchema>;
export type GetFacilitiesQuery = z.infer<typeof getFacilitiesSchema>;
export type CreateFacilitySectionInput = z.infer<typeof createFacilitySectionSchema>;
export type UpdateFacilitySectionInput = z.infer<typeof updateFacilitySectionSchema>;
export type CreateFacilityEmployeeInput = z.infer<typeof createFacilityEmployeeSchema>;
export type UpdateFacilityEmployeeInput = z.infer<typeof updateFacilityEmployeeSchema>;
export type CreateFacilityProductInput = z.infer<typeof createFacilityProductSchema>;
export type UpdateFacilityProductInput = z.infer<typeof updateFacilityProductSchema>;
export type CreateFacilityEquipmentInput = z.infer<typeof createFacilityEquipmentSchema>;
export type UpdateFacilityEquipmentInput = z.infer<typeof updateFacilityEquipmentSchema>;
export type CreateFacilityTableInput = z.infer<typeof createFacilityTableSchema>;
export type UpdateFacilityTableInput = z.infer<typeof updateFacilityTableSchema>;

