import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../plugins/prisma";
import { AppError } from "../../utils/errors";
import { success, created } from "../../utils/response";
import {
    CreateProductCategoryType,
    UpdateProductCategoryType,
    DeleteProductCategoryType,
    GetProductCategoryType
} from "./productCategorySchema";

export const MAX_CATEGORY_STEPS = 5;

/**
 * Calculates the number of parent-child relation steps from root for a given category.
 * A root category (parentCategoryId === null) has 0 steps.
 * A child of root has 1 step.
 * Returns the number of steps and the list of ancestor IDs.
 */
export async function getCategoryDepthSteps(
    categoryId: number
): Promise<{ steps: number; ancestorIds: number[] }> {
    const ancestorIds: number[] = [];
    let currentId: number | null = categoryId;
    const visited = new Set<number>();

    while (currentId !== null) {
        if (visited.has(currentId)) {
            throw AppError.badRequest("Circular reference detected in category hierarchy.");
        }
        visited.add(currentId);

        const category: { id: number; parentCategoryId: number | null } | null =
            await prisma.productCategory.findFirst({
                where: { id: currentId, deletedAt: null },
                select: { id: true, parentCategoryId: true },
            });

        if (!category) {
            break;
        }

        if (category.parentCategoryId) {
            ancestorIds.push(category.parentCategoryId);
            currentId = category.parentCategoryId;
        } else {
            break;
        }
    }

    return {
        steps: ancestorIds.length,
        ancestorIds,
    };
}

/**
 * Calculates the maximum downward depth (in steps) of any active descendant in the subtree.
 * A category with no subcategories has 0 downward steps.
 */
export async function getCategorySubtreeMaxDepth(
    categoryId: number,
    currentDepth = 0
): Promise<number> {
    if (currentDepth >= MAX_CATEGORY_STEPS + 2) return currentDepth;
    const children: { id: number }[] = await prisma.productCategory.findMany({
        where: { parentCategoryId: categoryId, deletedAt: null },
        select: { id: true },
    });

    if (children.length === 0) {
        return 0;
    }

    let maxChildDepth = 0;
    for (const child of children) {
        const depth = await getCategorySubtreeMaxDepth(child.id, currentDepth + 1);
        if (depth + 1 > maxChildDepth) {
            maxChildDepth = depth + 1;
        }
    }

    return maxChildDepth;
}

export async function createProductCategoryController(
    request: FastifyRequest<{ Body: CreateProductCategoryType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }
    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existingProductCategory = await prisma.productCategory.findFirst({
        where: {
            deletedAt: null,
            categoryName: data.categoryName,
        },
    });
    if (existingProductCategory) {
        throw AppError.conflict("Product category with this name already exists.");
    }

    if (data.parentCategoryId) {
        const parentCategory = await prisma.productCategory.findFirst({
            where: { id: data.parentCategoryId, deletedAt: null },
        });
        if (!parentCategory) {
            throw AppError.notFound("Parent product category not found.");
        }

        const { steps: parentSteps } = await getCategoryDepthSteps(data.parentCategoryId);
        if (parentSteps + 1 > MAX_CATEGORY_STEPS) {
            throw AppError.badRequest(
                `Category hierarchy cannot exceed ${MAX_CATEGORY_STEPS} steps of parent-child relations. Parent is already at step ${parentSteps}.`
            );
        }
    }

    const productCategory = await prisma.productCategory.create({
        data: {
            categoryName: data.categoryName,
            parentCategoryId: data.parentCategoryId ?? null,
            description: data.description ?? null,
            createdBy: user.id,
            updatedBy: user.id,
        },
        include: {
            parentCategory: {
                select: { id: true, categoryName: true },
            },
        },
    });

    return created(reply, productCategory, "Product category successfully created.");
}

export async function updateProductCategoryController(
    request: FastifyRequest<{ Body: UpdateProductCategoryType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }
    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existingProductCategory = await prisma.productCategory.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingProductCategory) {
        throw AppError.notFound("Product category not found.");
    }

    if (data.categoryName && data.categoryName !== existingProductCategory.categoryName) {
        const nameConflict = await prisma.productCategory.findFirst({
            where: {
                categoryName: data.categoryName,
                deletedAt: null,
                id: { not: data.id },
            },
        });
        if (nameConflict) {
            throw AppError.conflict("A product category with this name already exists.");
        }
    }

    if (data.parentCategoryId !== undefined) {
        if (data.parentCategoryId !== null) {
            if (data.parentCategoryId === data.id) {
                throw AppError.badRequest("A category cannot be its own parent.");
            }
            const parentCategory = await prisma.productCategory.findFirst({
                where: { id: data.parentCategoryId, deletedAt: null },
            });
            if (!parentCategory) {
                throw AppError.notFound("Parent product category not found.");
            }

            // Cycle detection: ensure the new parent is not a descendant of data.id
            const { steps: parentSteps, ancestorIds } = await getCategoryDepthSteps(data.parentCategoryId);
            if (ancestorIds.includes(data.id)) {
                throw AppError.badRequest(
                    "Cannot set a descendant category as parent (circular reference detected)."
                );
            }

            // Descendant subtree depth check: ensure none of its subcategories exceed MAX_CATEGORY_STEPS
            const subtreeMaxDepth = await getCategorySubtreeMaxDepth(data.id);
            const totalSteps = parentSteps + 1 + subtreeMaxDepth;
            if (totalSteps > MAX_CATEGORY_STEPS) {
                throw AppError.badRequest(
                    `Moving this category would exceed the maximum hierarchy limit of ${MAX_CATEGORY_STEPS} steps (resulting depth: ${totalSteps} steps).`
                );
            }
        }
    }

    const productCategory = await prisma.productCategory.update({
        where: { id: data.id },
        data: {
            ...(data.categoryName !== undefined && { categoryName: data.categoryName }),
            ...(data.parentCategoryId !== undefined && { parentCategoryId: data.parentCategoryId }),
            ...(data.description !== undefined && { description: data.description }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: {
            parentCategory: {
                select: { id: true, categoryName: true },
            },
        },
    });

    return success(reply, productCategory, "Product category successfully updated.");
}

export async function deleteProductCategoryController(
    request: FastifyRequest<{ Body: DeleteProductCategoryType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }
    if (!data?.id) {
        throw AppError.badRequest("Category id is required.");
    }

    const existingProductCategory = await prisma.productCategory.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingProductCategory) {
        throw AppError.notFound("Product category not found.");
    }

    // Check if category has subcategories
    const hasSubCategories = await prisma.productCategory.findFirst({
        where: { parentCategoryId: data.id, deletedAt: null },
    });
    if (hasSubCategories) {
        throw AppError.conflict("Cannot delete category with active subcategories. Delete or reassign subcategories first.");
    }

    // Check if category has products
    const hasProducts = await prisma.product.findFirst({
        where: { productCategoryId: data.id, deletedAt: null },
    });
    if (hasProducts) {
        throw AppError.conflict("Cannot delete category with associated products. Reassign products first.");
    }

    const productCategory = await prisma.productCategory.update({
        where: { id: data.id },
        data: { deletedAt: new Date(), updatedAt: new Date(), updatedBy: user.id },
    });

    return success(reply, productCategory, "Product category successfully deleted.");
}

export async function getProductCategoryController(
    _request: FastifyRequest,
    reply: FastifyReply
) {
    const productCategories = await prisma.productCategory.findMany({
        where: { deletedAt: null },
        include: {
            parentCategory: {
                select: { id: true, categoryName: true },
            },
            subCategories: {
                where: { deletedAt: null },
                select: { id: true, categoryName: true },
            },
        },
        orderBy: { categoryName: "asc" },
    });

    return success(reply, productCategories, "Product categories successfully fetched.", 200, {
        productCategories
    });
}

export async function getProductCategoryByIdController(
    request: FastifyRequest<{ Body: GetProductCategoryType }>,
    reply: FastifyReply
) {
    const data = request.body;
    if (!data?.id) {
        throw AppError.badRequest("Category id is required.");
    }

    const productCategory = await prisma.productCategory.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            subCategories: {
                where: { deletedAt: null },
            },
            parentCategory: true,
            products: {
                where: { deletedAt: null },
                select: {
                    id: true,
                    productName: true,
                    sku: true,
                    currentStock: true,
                    unit: true,
                },
            },
        },
    });

    if (!productCategory) {
        throw AppError.notFound("Product category not found.");
    }

    return success(reply, productCategory, "Product category successfully fetched.");
}