import { FastifyInstance } from "fastify";

// Product (Catalog, Categories, Pricing, Images, Attributes, Inventory Ledger, Waste, Vendor link)
import { productRoutes } from "../../modules/product/productRoute";
import { productCategoryRoutes } from "../../modules/product/productCategoryRoute";
import { productPriceRoutes } from "../../modules/product/productPrice/productPriceRoute";
import { productImageRoutes } from "../../modules/product/productImage/productImageRoute";
import { productAttributeRoutes } from "../../modules/product/productAttribute/productAttributeRoute";
import { productAttributeValueRoutes } from "../../modules/product/productAttributeValue/productAttributeValueRoute";
import { productInventoryRoutes } from "../../modules/product/productInventory/productInventoryRoute";
import { productWasteRoutes } from "../../modules/product/productWaste/productWasteRoute";
import { vendorProductRoutes } from "../../modules/product/vendorProduct/vendorProductRoute";

// Formula (Formulas, Recipes BOM, Production Batches)
import { productRecipeRoutes } from "../../modules/product/productRecipe/productRecipeRoute";
import { productionBatchRoutes } from "../../modules/product/productionBatch/productionBatchRoute";

// Equipment (Equipment Fleet, Types, Brands, Models, Entities, Features, Maintenance, Parts)
import { equipmentTypeRoutes } from "../../modules/equipment/equipmentType/equipmentTypeRoute";
import { equipmentBrandRoutes } from "../../modules/equipment/equipmentBrand/equipmentBrandRoute";
import { equipmentModelRoutes } from "../../modules/equipment/equipmentModel/equipmentModelRoute";
import { equipmentEntityRoutes } from "../../modules/equipment/equipmentEntity/equipmentEntityRoute";
import { equipmentModelFeatureRoutes } from "../../modules/equipment/equipmentModelFeature/equipmentModelFeatureRoute";
import { equipmentFeatureRoutes } from "../../modules/equipment/equipmentFeature/equipmentFeatureRoute";
import { equipmentMaintenanceRoutes } from "../../modules/equipment/equipmentMaintenance/equipmentMaintenanceRoute";
import { equipmentPartRoutes } from "../../modules/equipment/equipmentPart/equipmentPartRoute";

/**
 * Product Module Routes:
 * - Product (Catalog, Categories, Pricing, Inventory Stock Ledger, Waste)
 * - Formula (Formulas, Recipes BOM, Production Batches)
 * - Equipment (Fleet Machinery, Brands, Models, Features, Maintenance, Parts)
 */
export async function productModuleRoutes(fastify: FastifyInstance, options: any) {
  // Product Catalog & Inventory
  fastify.register(productRoutes);
  fastify.register(productCategoryRoutes);
  fastify.register(productPriceRoutes);
  fastify.register(productImageRoutes);
  fastify.register(productAttributeRoutes);
  fastify.register(productAttributeValueRoutes);
  fastify.register(productInventoryRoutes);
  fastify.register(productWasteRoutes);
  fastify.register(vendorProductRoutes);

  // Formula & Recipes
  fastify.register(productRecipeRoutes);
  fastify.register(productionBatchRoutes);

  // Equipment Fleet
  fastify.register(equipmentTypeRoutes);
  fastify.register(equipmentBrandRoutes);
  fastify.register(equipmentModelRoutes);
  fastify.register(equipmentEntityRoutes);
  fastify.register(equipmentModelFeatureRoutes);
  fastify.register(equipmentFeatureRoutes);
  fastify.register(equipmentMaintenanceRoutes);
  fastify.register(equipmentPartRoutes);
}
