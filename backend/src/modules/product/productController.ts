import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../plugins/prisma";
import { AppError } from "../../utils/errors";
import { success, created, paginated } from "../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationParams } from "../../utils/pagination";
import {
    CreateProductType,
    UpdateProductType,
    DeleteProductType,
    GetProductType,
    GetProductsType
} from "./productSchema";
import { computeProducibleQuantity } from "../pos/salesOrder/recipeDeduction";

async function generateSKU(productName: string, categoryId?: number): Promise<string> {
    let prefix = "PRD";
    if (categoryId) {
        const category = await prisma.productCategory.findFirst({
            where: { id: categoryId, deletedAt: null }
        });
        if (category) {
            prefix = category.categoryName.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase();
        }
    }

    const prodPart = productName.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase();
    let isUnique = false;
    let sku = "";
    let attempt = 0;

    while (!isUnique) {
        const count = await prisma.product.count();
        const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
        sku = `${prefix}-${prodPart}-${String(count + 1 + attempt).padStart(4, "0")}-${randomHex}`;

        const existing = await prisma.product.findFirst({
            where: { sku, deletedAt: null }
        });
        if (!existing) {
            isUnique = true;
        } else {
            attempt++;
        }
    }
    return sku;
}

export async function createProductController(
    request: FastifyRequest<{ Body: CreateProductType }>,
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

    let sku = data.sku;
    if (!sku) {
        sku = await generateSKU(data.productName, data.productCategoryId ?? undefined);
    } else {
        const existingProduct = await prisma.product.findFirst({
            where: { sku, deletedAt: null },
        });
        if (existingProduct) {
            throw AppError.conflict("Product with this SKU already exists.");
        }
    }

    if (data.productCategoryId) {
        const existingCategory = await prisma.productCategory.findFirst({
            where: { id: data.productCategoryId, deletedAt: null },
        });
        if (!existingCategory) {
            throw AppError.notFound("Product category not found.");
        }
    }

    let unitLabel = data.unitLabel;
    if (data.unitId !== undefined && data.unitId !== null) {
        const existingUnit = await prisma.unit.findFirst({
            where: { id: data.unitId, deletedAt: null },
        });
        if (!existingUnit) {
            throw AppError.notFound("Unit not found.");
        }
        if (!unitLabel) {
            unitLabel = existingUnit.abbr;
        }
    } else if (data.unitId === null) {
        if (unitLabel === undefined) {
            unitLabel = null;
        }
    }

    const product = await prisma.product.create({
        data: {
            productName: data.productName,
            description: data.description ?? null,
            sku,
            barcode: data.barcode ?? null,
            unitId: data.unitId !== undefined ? data.unitId : null,
            unitLabel: unitLabel !== undefined ? unitLabel : null,
            productCategoryId: data.productCategoryId ?? null,
            parentProductId: data.parentProductId ?? null,
            isTradeable: data.isTradeable !== undefined ? data.isTradeable : true,
            isLowStockAlertEnabled: data.isLowStockAlertEnabled !== undefined ? data.isLowStockAlertEnabled : true,
            hasFormula: data.hasFormula !== undefined ? data.hasFormula : false,
            minStock: data.minStock !== undefined ? data.minStock : 0,
            createdBy: user.id,
            updatedBy: user.id,
        },
        include: {
            category: true,
            unit: true,
            parentProduct: true,
            subProducts: {
                where: { deletedAt: null },
                include: {
                    category: true,
                    unit: true,
                    productPrice: { where: { deletedAt: null } },
                },
            },
        }
    });

    const priceAmount = data.retailPrice ?? data.price;
    if (priceAmount !== undefined && priceAmount !== null) {
        await prisma.productPrice.create({
            data: {
                productId: product.id,
                amount: priceAmount,
                priceType: "retail",
                currency: "IDR",
                createdBy: user.id,
                updatedBy: user.id,
            }
        });
    }

    if (data.imageUrl && data.imageUrl.trim()) {
        await prisma.productImage.create({
            data: {
                productId: product.id,
                imageUrl: data.imageUrl.trim(),
                altText: product.productName,
                isPrimary: true,
                sortOrder: 1,
                createdBy: user.id,
                updatedBy: user.id,
            },
        });
    }

    const mappedSubProducts = product.subProducts?.map((sub) => {
        const subRetailPriceObj = sub.productPrice?.find((pr) => pr.priceType === "retail") || sub.productPrice?.[0];
        return {
            ...sub,
            retailPrice: subRetailPriceObj ? Number(subRetailPriceObj.amount) : null,
        };
    });

    const responseProduct = {
        ...product,
        retailPrice: priceAmount ?? null,
        subProducts: mappedSubProducts ?? [],
        variants: mappedSubProducts ?? [],
    };

    return created(reply, responseProduct, "Product successfully created.");
}

export async function updateProductController(
    request: FastifyRequest<{ Body: UpdateProductType }>,
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

    const existingProduct = await prisma.product.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingProduct) {
        throw AppError.notFound("Product not found.");
    }

    if (data.sku && data.sku !== existingProduct.sku) {
        const skuConflict = await prisma.product.findFirst({
            where: { sku: data.sku, deletedAt: null, id: { not: data.id } },
        });
        if (skuConflict) {
            throw AppError.conflict("A product with this SKU already exists.");
        }
    }

    if (data.productCategoryId) {
        const existingCategory = await prisma.productCategory.findFirst({
            where: { id: data.productCategoryId, deletedAt: null },
        });
        if (!existingCategory) {
            throw AppError.notFound("Product category not found.");
        }
    }

    let unitLabel = data.unitLabel;
    if (data.unitId !== undefined && data.unitId !== null) {
        const existingUnit = await prisma.unit.findFirst({
            where: { id: data.unitId, deletedAt: null },
        });
        if (!existingUnit) {
            throw AppError.notFound("Unit not found.");
        }
        if (unitLabel === undefined || unitLabel === null) {
            unitLabel = existingUnit.abbr;
        }
    } else if (data.unitId === null) {
        if (unitLabel === undefined) {
            unitLabel = null;
        }
    }

    const product = await prisma.product.update({
        where: { id: data.id },
        data: {
            ...(data.productName !== undefined && { productName: data.productName }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.sku !== undefined && { sku: data.sku }),
            ...(data.barcode !== undefined && { barcode: data.barcode }),
            ...(data.unitId !== undefined && { unitId: data.unitId }),
            ...(unitLabel !== undefined && { unitLabel }),
            ...(data.productCategoryId !== undefined && { productCategoryId: data.productCategoryId }),
            ...(data.parentProductId !== undefined && { parentProductId: data.parentProductId }),
            ...(data.isTradeable !== undefined && { isTradeable: data.isTradeable }),
            ...(data.isLowStockAlertEnabled !== undefined && { isLowStockAlertEnabled: data.isLowStockAlertEnabled }),
            ...(data.hasFormula !== undefined && { hasFormula: data.hasFormula }),
            ...(data.minStock !== undefined && { minStock: data.minStock }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: {
            category: true,
            unit: true,
            parentProduct: true,
            subProducts: {
                where: { deletedAt: null },
                include: {
                    category: true,
                    unit: true,
                    productImages: { where: { deletedAt: null } },
                    productPrice: { where: { deletedAt: null } },
                },
            },
        },
    });

    const priceAmount = data.retailPrice ?? data.price;
    if (priceAmount !== undefined && priceAmount !== null) {
        await prisma.productPrice.create({
            data: {
                productId: product.id,
                amount: priceAmount,
                priceType: "retail",
                currency: "IDR",
                createdBy: user.id,
                updatedBy: user.id,
            }
        });
    }

    if (data.imageUrl !== undefined) {
        if (data.imageUrl && data.imageUrl.trim()) {
            const existingPrimary = await prisma.productImage.findFirst({
                where: { productId: data.id, isPrimary: true, deletedAt: null },
            });
            if (existingPrimary) {
                await prisma.productImage.update({
                    where: { id: existingPrimary.id },
                    data: {
                        imageUrl: data.imageUrl.trim(),
                        altText: data.productName || product.productName,
                        updatedBy: user.id,
                        updatedAt: new Date(),
                    },
                });
            } else {
                await prisma.productImage.create({
                    data: {
                        productId: data.id,
                        imageUrl: data.imageUrl.trim(),
                        altText: data.productName || product.productName,
                        isPrimary: true,
                        sortOrder: 1,
                        createdBy: user.id,
                        updatedBy: user.id,
                    },
                });
            }
        }
    }

    const mappedSubProducts = product.subProducts?.map((sub) => {
        const subRetailPriceObj = sub.productPrice?.find((pr) => pr.priceType === "retail") || sub.productPrice?.[0];
        return {
            ...sub,
            retailPrice: subRetailPriceObj ? Number(subRetailPriceObj.amount) : null,
        };
    });

    const responseProduct = {
        ...product,
        retailPrice: priceAmount ?? undefined,
        subProducts: mappedSubProducts ?? [],
        variants: mappedSubProducts ?? [],
    };

    return success(reply, responseProduct, "Product successfully updated.");
}

export async function deleteProductController(
    request: FastifyRequest<{ Body: DeleteProductType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }
    if (!data?.id) {
        throw AppError.badRequest("Product id is required.");
    }

    const existingProduct = await prisma.product.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingProduct) {
        throw AppError.notFound("Product not found.");
    }

    const product = await prisma.product.update({
        where: { id: data.id },
        data: { deletedAt: new Date(), updatedAt: new Date(), updatedBy: user.id },
    });

    return success(reply, product, "Product successfully deleted.");
}

export async function getProductController(
    request: FastifyRequest<{ Body: GetProductType }>,
    reply: FastifyReply
) {
    const data = request.body;
    if (!data?.id) {
        throw AppError.badRequest("Product id is required.");
    }

    const product = await prisma.product.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            category: true,
            unit: true,
            parentProduct: true,
            subProducts: {
                where: { deletedAt: null },
                include: {
                    category: true,
                    unit: true,
                    productImages: { where: { deletedAt: null } },
                    productPrice: { where: { deletedAt: null } },
                    recipes: {
                        where: { deletedAt: null },
                        include: {
                            ingredient: {
                                select: {
                                    id: true,
                                    productName: true,
                                    sku: true,
                                    unitLabel: true,
                                },
                            },
                            unit: true,
                        },
                    },
                    productAttributeValue: {
                        where: { deletedAt: null },
                        include: { attribute: true },
                    },
                    storageStocks: true,
                },
            },
            productImages: { where: { deletedAt: null }, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
            productPrice: { where: { deletedAt: null } },
            storageStocks: true,
            recipes: {
                where: { deletedAt: null },
                include: {
                    ingredient: {
                        select: {
                            id: true,
                            productName: true,
                            sku: true,
                            unitLabel: true,
                            currentStock: true,
                            storageStocks: true,
                        },
                    },
                    unit: true,
                },
            },
            productAttributeValue: {
                where: { deletedAt: null },
                include: { attribute: true },
            },
            vendorProducts: {
                where: { deletedAt: null },
                include: {
                    vendor: {
                        include: {
                            profile: true,
                        },
                    },
                },
            },
        },
    });

    if (!product) {
        throw AppError.notFound("Product not found.");
    }

    const retailPriceObj = product.productPrice?.find((pr) => pr.priceType === "retail") || product.productPrice?.[0];
    const facilityId = (data as any)?.facilityId ? Number((data as any).facilityId) : undefined;
    let currentStockNum = Number(product.currentStock ?? 0);
    let minStockNum = Number(product.minStock ?? 0);

    if (facilityId) {
        const facilityStocks = (product.storageStocks || []).filter((s: any) => s.facilityId === facilityId);
        currentStockNum = facilityStocks.reduce((sum: number, s: any) => sum + Number(s.stock), 0);
        const facilityMin = facilityStocks.find((s: any) => Number(s.minStock) > 0);
        if (facilityMin) {
            minStockNum = Number(facilityMin.minStock);
        }
    }

    const isAlertEnabled = product.isLowStockAlertEnabled !== false;
    const isLowStock = isAlertEnabled && minStockNum > 0 && currentStockNum <= minStockNum;

    const mappedSubProducts = product.subProducts?.map((sub) => {
        const subRetailPriceObj = sub.productPrice?.find((pr) => pr.priceType === "retail") || sub.productPrice?.[0];
        let subStock = Number(sub.currentStock ?? 0);
        let subMin = Number(sub.minStock ?? 0);

        if (facilityId) {
            const subFacilityStocks = (sub.storageStocks || []).filter((s) => s.facilityId === facilityId);
            subStock = subFacilityStocks.reduce((sum, s) => sum + Number(s.stock), 0);
            const subFMin = subFacilityStocks.find((s) => Number(s.minStock) > 0);
            if (subFMin) subMin = Number(subFMin.minStock);
        }

        const subAlertEnabled = sub.isLowStockAlertEnabled !== false;
        const subIsFormula = Boolean(sub.hasFormula || (sub.recipes && sub.recipes.length > 0));
        const subProducible = subIsFormula ? computeProducibleQuantity(sub.recipes, facilityId) : 0;
        const subCanSell = subIsFormula ? (subStock > 0 || subProducible > 0) : subStock > 0;
        return {
            ...sub,
            currentStock: subStock,
            minStock: subMin,
            isLowStock: subAlertEnabled && subMin > 0 && subStock <= subMin,
            retailPrice: subRetailPriceObj ? Number(subRetailPriceObj.amount) : null,
            recipes: sub.recipes ?? [],
            hasFormula: subIsFormula,
            producibleStock: subProducible,
            canBeSold: subCanSell,
            availableStock: subStock > 0 ? subStock : subProducible,
        };
    });

    const isFormula = Boolean(product.hasFormula || (product.recipes && product.recipes.length > 0));
    const producibleStock = isFormula ? computeProducibleQuantity(product.recipes, facilityId) : 0;
    const canBeSold = isFormula ? (currentStockNum > 0 || producibleStock > 0) : currentStockNum > 0;

    const mappedProduct = {
        ...product,
        currentStock: currentStockNum,
        minStock: minStockNum,
        isLowStock,
        retailPrice: retailPriceObj ? Number(retailPriceObj.amount) : null,
        subProducts: mappedSubProducts ?? [],
        variants: mappedSubProducts ?? [],
        recipes: product.recipes ?? [],
        hasFormula: isFormula,
        producibleStock,
        canBeSold,
        availableStock: currentStockNum > 0 ? currentStockNum : producibleStock,
    };

    return success(reply, mappedProduct, "Product successfully fetched.");
}

export async function getProductsController(
    request: FastifyRequest<{ Querystring: PaginationParams & { categoryId?: number }; Body?: GetProductsType }>,
    reply: FastifyReply
) {
    const params = (request.query && Object.keys(request.query).length > 0)
        ? request.query
        : (request.body || {});

    const { page, limit, skip, take, orderBy } = buildPaginationQuery(params, {
        defaultLimit: 20,
        defaultSortBy: "createdAt",
        defaultSortOrder: "desc"
    });

    const categoryId = (params as any).categoryId ? Number((params as any).categoryId) : undefined;
    const parentProductId = (params as any).parentProductId ? Number((params as any).parentProductId) : undefined;
    const rootOnly = (params as any).rootOnly === true || (params as any).rootOnly === "true";
    const lowStockOnly = (params as any).lowStockOnly === true || (params as any).lowStockOnly === "true";
    const searchFilter = buildSearchFilter(params.search, [
        "productName",
        "sku",
        "barcode",
        "description"
    ]);

    const isTradeable = (params as any).isTradeable !== undefined ? ((params as any).isTradeable === true || (params as any).isTradeable === "true") : undefined;
    const hasFormula = (params as any).hasFormula !== undefined ? ((params as any).hasFormula === true || (params as any).hasFormula === "true") : undefined;

    const where: any = {
        deletedAt: null,
        ...(categoryId ? { productCategoryId: categoryId } : {}),
        ...(parentProductId !== undefined ? { parentProductId } : rootOnly ? { parentProductId: null } : {}),
        ...(isTradeable !== undefined ? { isTradeable } : {}),
        ...(hasFormula !== undefined ? { hasFormula } : {}),
        ...(searchFilter ? { OR: searchFilter } : {})
    };

    const facilityId = (params as any).facilityId ? Number((params as any).facilityId) : undefined;

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            skip: lowStockOnly ? undefined : skip,
            take: lowStockOnly ? undefined : take,
            include: {
                category: true,
                unit: true,
                parentProduct: true,
                recipes: {
                    where: { deletedAt: null },
                    include: {
                        ingredient: {
                            select: {
                                id: true,
                                productName: true,
                                sku: true,
                                unitLabel: true,
                                currentStock: true,
                                storageStocks: true,
                            },
                        },
                        unit: true,
                    },
                },
                subProducts: {
                    where: { deletedAt: null },
                    include: {
                        productPrice: { where: { deletedAt: null } },
                        productImages: { where: { deletedAt: null, isPrimary: true } },
                        recipes: {
                            where: { deletedAt: null },
                            include: {
                                ingredient: {
                                    select: {
                                        id: true,
                                        productName: true,
                                        sku: true,
                                        unitLabel: true,
                                        currentStock: true,
                                        storageStocks: true,
                                    },
                                },
                                unit: true,
                            },
                        },
                        storageStocks: {
                            include: {
                                facility: { select: { id: true, facilityName: true, facilityCode: true } },
                                section: { select: { id: true, sectionName: true, sectionCode: true } },
                            },
                        },
                    },
                },
                productImages: { where: { deletedAt: null, isPrimary: true } },
                productPrice: { where: { deletedAt: null } },
                storageStocks: {
                    include: {
                        facility: { select: { id: true, facilityName: true, facilityCode: true } },
                        section: { select: { id: true, sectionName: true, sectionCode: true } },
                    },
                },
                vendorProducts: {
                    where: { deletedAt: null },
                    include: {
                        vendor: {
                            include: {
                                profile: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        isCompany: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy,
        }),
        prisma.product.count({ where }),
    ]);

    let mappedProducts = products.map((p) => {
        const retailPriceObj = p.productPrice?.find((pr) => pr.priceType === "retail") || p.productPrice?.[0];
        const primaryImg = p.productImages?.[0]?.imageUrl || null;
        let currentStockNum = Number(p.currentStock ?? 0);
        let minStockNum = Number(p.minStock ?? 0);

        if (facilityId) {
            const facilityStocks = (p.storageStocks || []).filter((s) => s.facilityId === facilityId);
            currentStockNum = facilityStocks.reduce((sum, s) => sum + Number(s.stock), 0);
            const facilityMin = facilityStocks.find((s) => Number(s.minStock) > 0);
            if (facilityMin) {
                minStockNum = Number(facilityMin.minStock);
            }
        }

        const isAlertEnabled = p.isLowStockAlertEnabled !== false;
        const isLowStock = isAlertEnabled && minStockNum > 0 && currentStockNum <= minStockNum;

        const mappedSubProducts = p.subProducts?.map((sub) => {
            const subRetailPriceObj = sub.productPrice?.find((pr) => pr.priceType === "retail") || sub.productPrice?.[0];
            const subImg = sub.productImages?.[0]?.imageUrl || primaryImg || null;
            let subStock = Number(sub.currentStock ?? 0);
            let subMin = Number(sub.minStock ?? 0);

            if (facilityId) {
                const subFacilityStocks = (sub.storageStocks || []).filter((s) => s.facilityId === facilityId);
                subStock = subFacilityStocks.reduce((sum, s) => sum + Number(s.stock), 0);
                const subFMin = subFacilityStocks.find((s) => Number(s.minStock) > 0);
                if (subFMin) subMin = Number(subFMin.minStock);
            }

            const subAlertEnabled = sub.isLowStockAlertEnabled !== false;
            const subIsFormula = Boolean(sub.hasFormula || (sub.recipes && sub.recipes.length > 0));
            const subProducible = subIsFormula ? computeProducibleQuantity(sub.recipes, facilityId) : 0;
            const subCanSell = subIsFormula ? (subStock > 0 || subProducible > 0) : subStock > 0;
            return {
                ...sub,
                currentStock: subStock,
                minStock: subMin,
                isLowStock: subAlertEnabled && subMin > 0 && subStock <= subMin,
                retailPrice: subRetailPriceObj ? Number(subRetailPriceObj.amount) : null,
                imageUrl: subImg,
                recipes: sub.recipes ?? [],
                hasFormula: subIsFormula,
                producibleStock: subProducible,
                canBeSold: subCanSell,
                availableStock: subStock > 0 ? subStock : subProducible,
                storageStocks: sub.storageStocks?.map((s) => ({
                    ...s,
                    stock: Number(s.stock),
                    minStock: Number(s.minStock),
                })) ?? [],
            };
        });

        const isFormula = Boolean(p.hasFormula || (p.recipes && p.recipes.length > 0));
        const producibleStock = isFormula ? computeProducibleQuantity(p.recipes, facilityId) : 0;
        const canBeSold = isFormula ? (currentStockNum > 0 || producibleStock > 0) : currentStockNum > 0;

        return {
            ...p,
            currentStock: currentStockNum,
            minStock: minStockNum,
            isLowStock,
            retailPrice: retailPriceObj ? Number(retailPriceObj.amount) : null,
            imageUrl: primaryImg,
            hasFormula: isFormula,
            producibleStock,
            canBeSold,
            availableStock: currentStockNum > 0 ? currentStockNum : producibleStock,
            storageStocks: p.storageStocks?.map((s) => ({
                ...s,
                stock: Number(s.stock),
                minStock: Number(s.minStock),
            })) ?? [],
            subProducts: mappedSubProducts ?? [],
            variants: mappedSubProducts ?? [],
            recipes: p.recipes ?? [],
        };
    });

    if (lowStockOnly) {
        mappedProducts = mappedProducts.filter((p) => p.isLowStock);
    }

    const meta = buildPaginationMeta(lowStockOnly ? mappedProducts.length : total, page, limit);
    const paginatedItems = lowStockOnly ? mappedProducts.slice(skip, skip + take) : mappedProducts;

    return paginated(reply, paginatedItems, meta, "Products successfully fetched.", "products");
}
