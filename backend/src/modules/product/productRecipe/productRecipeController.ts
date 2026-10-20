import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success, paginated } from "../../../utils/response";
import { buildPaginationMeta } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import {
  CreateProductRecipeType,
  UpdateProductRecipeType,
  DeleteProductRecipeType,
  SetProductRecipeType,
  GetProductRecipeQueryType,
} from "./productRecipeSchema";

/**
 * Cycle detection helper to prevent circular recipes (e.g. A uses B, B uses A)
 */
async function wouldCauseCycle(productId: number, targetIngredientId: number): Promise<boolean> {
  if (productId === targetIngredientId) return true;

  const visited = new Set<number>();
  const queue: number[] = [targetIngredientId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === productId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const subRecipes = await prisma.productRecipe.findMany({
      where: { productId: current, deletedAt: null },
      select: { ingredientProductId: true },
    });

    for (const r of subRecipes) {
      if (!visited.has(r.ingredientProductId)) {
        queue.push(r.ingredientProductId);
      }
    }
  }

  return false;
}

const ingredientInclude = {
  select: {
    id: true,
    productName: true,
    sku: true,
    currentStock: true,
    unitId: true,
    unitLabel: true,
    productPrice: { where: { deletedAt: null } },
    vendorProducts: { where: { deletedAt: null } },
  },
};

function formatRecipeWithPricing(r: any) {
  if (!r) return r;
  const pPrice = r.ingredient?.productPrice?.find((pr: any) => pr.priceType === "retail") || r.ingredient?.productPrice?.[0];
  const vPrice = r.ingredient?.vendorProducts?.find((vp: any) => vp.vendorPrice !== null) || r.ingredient?.vendorProducts?.[0];
  const unitCost = pPrice ? Number(pPrice.amount) : vPrice?.vendorPrice ? Number(vPrice.vendorPrice) : 0;
  return {
    ...r,
    ingredient: r.ingredient
      ? {
          id: r.ingredient.id,
          productName: r.ingredient.productName,
          sku: r.ingredient.sku,
          currentStock: r.ingredient.currentStock ? Number(r.ingredient.currentStock) : 0,
          unitId: r.ingredient.unitId,
          unitLabel: r.ingredient.unitLabel,
          retailPrice: unitCost,
          unitCost,
        }
      : undefined,
  };
}

export const createProductRecipeController: TypedHandler<CreateProductRecipeType> = async (request, reply) => {
  const data = request.body;
  const user = request.session?.user;

  if (!user) {
    throw AppError.unauthorized("Authentication required");
  }

  if (data.productId === data.ingredientProductId) {
    throw AppError.badRequest("A product cannot be an ingredient of itself");
  }

  const [parentProduct, ingredientProduct] = await Promise.all([
    prisma.product.findFirst({ where: { id: data.productId, deletedAt: null } }),
    prisma.product.findFirst({ where: { id: data.ingredientProductId, deletedAt: null } }),
  ]);

  if (!parentProduct) throw AppError.notFound("Target product not found");
  if (!ingredientProduct) throw AppError.notFound("Ingredient product not found");

  if (await wouldCauseCycle(data.productId, data.ingredientProductId)) {
    throw AppError.badRequest("Adding this ingredient would create a circular recipe dependency loop");
  }

  const existing = await prisma.productRecipe.findFirst({
    where: {
      productId: data.productId,
      ingredientProductId: data.ingredientProductId,
      deletedAt: null,
    },
  });

  if (existing) {
    throw AppError.badRequest("This ingredient is already in the product's recipe");
  }

  const recipeItem = await prisma.productRecipe.create({
    data: {
      productId: data.productId,
      ingredientProductId: data.ingredientProductId,
      quantity: data.quantity,
      unitId: data.unitId ?? ingredientProduct.unitId,
      unitLabel: data.unitLabel ?? ingredientProduct.unitLabel,
      notes: data.notes,
      createdBy: user.id,
      updatedBy: user.id,
    },
    include: {
      product: { select: { id: true, productName: true, sku: true } },
      ingredient: ingredientInclude,
      unit: true,
    },
  });

  return created(reply, formatRecipeWithPricing(recipeItem), "Recipe item added successfully");
};

export const updateProductRecipeController: TypedHandler<UpdateProductRecipeType> = async (request, reply) => {
  const data = request.body;
  const user = request.session?.user;

  if (!user) {
    throw AppError.unauthorized("Authentication required");
  }

  const existing = await prisma.productRecipe.findFirst({
    where: { id: data.id, deletedAt: null },
  });

  if (!existing) {
    throw AppError.notFound("Recipe item not found");
  }

  const updated = await prisma.productRecipe.update({
    where: { id: data.id },
    data: {
      quantity: data.quantity !== undefined ? data.quantity : existing.quantity,
      unitId: data.unitId !== undefined ? data.unitId : existing.unitId,
      unitLabel: data.unitLabel !== undefined ? data.unitLabel : existing.unitLabel,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      updatedBy: user.id,
      updatedAt: new Date(),
    },
    include: {
      product: { select: { id: true, productName: true, sku: true } },
      ingredient: ingredientInclude,
      unit: true,
    },
  });

  return success(reply, formatRecipeWithPricing(updated), "Recipe item updated successfully");
};

export const deleteProductRecipeController: TypedHandler<DeleteProductRecipeType> = async (request, reply) => {
  const data = request.body;
  const user = request.session?.user;

  if (!user) {
    throw AppError.unauthorized("Authentication required");
  }

  const existing = await prisma.productRecipe.findFirst({
    where: { id: data.id, deletedAt: null },
  });

  if (!existing) {
    throw AppError.notFound("Recipe item not found");
  }

  // Soft delete
  await prisma.productRecipe.update({
    where: { id: data.id },
    data: {
      deletedAt: new Date(),
      updatedBy: user.id,
    },
  });

  return success(reply, { id: data.id }, "Recipe item deleted successfully");
};

export const setProductRecipeController: TypedHandler<SetProductRecipeType> = async (request, reply) => {
  const data = request.body;
  const user = request.session?.user;

  if (!user) {
    throw AppError.unauthorized("Authentication required");
  }

  const parentProduct = await prisma.product.findFirst({
    where: { id: data.productId, deletedAt: null },
  });

  if (!parentProduct) {
    throw AppError.notFound("Target product not found");
  }

  // Check self-inclusion or duplicate ingredients
  const ingredientSet = new Set<number>();
  for (const item of data.items) {
    if (item.ingredientProductId === data.productId) {
      throw AppError.badRequest("A product cannot be an ingredient of itself");
    }
    if (ingredientSet.has(item.ingredientProductId)) {
      throw AppError.badRequest(`Duplicate ingredient specified: ID ${item.ingredientProductId}`);
    }
    ingredientSet.add(item.ingredientProductId);
  }

  // Validate cycle for each ingredient
  for (const item of data.items) {
    if (await wouldCauseCycle(data.productId, item.ingredientProductId)) {
      throw AppError.badRequest(`Ingredient ID ${item.ingredientProductId} causes a circular recipe loop`);
    }
  }

  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    // Delete existing recipe items
    await tx.productRecipe.updateMany({
      where: { productId: data.productId, deletedAt: null },
      data: { deletedAt: now, updatedBy: user.id },
    });

    // Create new items
    for (const item of data.items) {
      const ingredient = await tx.product.findFirst({
        where: { id: item.ingredientProductId, deletedAt: null },
      });

      await tx.productRecipe.create({
        data: {
          productId: data.productId,
          ingredientProductId: item.ingredientProductId,
          quantity: item.quantity,
          unitId: item.unitId ?? ingredient?.unitId,
          unitLabel: item.unitLabel ?? ingredient?.unitLabel,
          notes: item.notes,
          createdBy: user.id,
          updatedBy: user.id,
        },
      });
    }

    // Auto-sync product hasFormula column
    await tx.product.update({
      where: { id: data.productId },
      data: {
        hasFormula: data.items.length > 0,
        updatedAt: now,
        updatedBy: user.id,
      },
    });

    return tx.productRecipe.findMany({
      where: { productId: data.productId, deletedAt: null },
      include: {
        ingredient: ingredientInclude,
        unit: true,
      },
    });
  });

  return success(reply, result.map(formatRecipeWithPricing), "Product recipe saved successfully");
};

export const getProductRecipesController: TypedHandler<GetProductRecipeQueryType> = async (request, reply) => {
  const query = request.body || {};
  const { productId, ingredientProductId, page = 1, limit = 50 } = query;
  const skip = (page - 1) * limit;

  const where: any = { deletedAt: null };
  if (productId) where.productId = productId;
  if (ingredientProductId) where.ingredientProductId = ingredientProductId;

  const [items, total] = await Promise.all([
    prisma.productRecipe.findMany({
      where,
      skip,
      take: limit,
      include: {
        product: { select: { id: true, productName: true, sku: true } },
        ingredient: ingredientInclude,
        unit: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.productRecipe.count({ where }),
  ]);

  const meta = buildPaginationMeta(total, page, limit);
  return paginated(reply, items.map(formatRecipeWithPricing), meta, "Product recipes retrieved successfully");
};

export const getRecipeByProductController = async (request: any, reply: any) => {
  const productId = Number(request.params?.productId);
  if (!productId || isNaN(productId)) {
    throw AppError.badRequest("Invalid product ID");
  }

  const items = await prisma.productRecipe.findMany({
    where: { productId, deletedAt: null },
    include: {
      ingredient: ingredientInclude,
      unit: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return success(reply, items.map(formatRecipeWithPricing), "Product recipe items retrieved successfully");
};
