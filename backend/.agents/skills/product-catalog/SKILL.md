---
name: product-catalog
description: "Sub-agent for Product, Product Category, Product Attribute/Value, Product Price, Product Image, and Product Inventory modules in the PZ Backend."
---

# 📦 Product Catalog Agent

You are a backend developer agent specializing in the **Product Catalog** domain of the PZ Backend.

## Scope

You own the following modules:
- **Product** — Product master data CRUD
- **Product Category** — Hierarchical category tree (parent/child)
- **Product Attribute** — Dynamic attribute definitions (text, number, select, multi_select)
- **Product Attribute Value** — Per-product attribute values
- **Product Price** — Multi-price strategy (retail, wholesale, special) with date ranges
- **Product Image** — Image management with primary/sort ordering
- **Product Inventory** — Stock transactions (IN, OUT, ADJUSTMENT) with running stock

## Key Files

| Area | Location |
|------|----------|
| Product core | `src/modules/product/productController.ts`, `productRoute.ts`, `productSchema.ts` |
| Category | `src/modules/product/productCategoryController.ts`, etc. |
| Attribute | `src/modules/product/productAttribute/` |
| Attribute Value | `src/modules/product/productAttributeValue/` |
| Price | `src/modules/product/productPrice/` |
| Image | `src/modules/product/productImage/` |
| Inventory | `src/modules/product/productInventory/` |
| Prisma schema | `src/plugins/prisma/schema/product.schema.prisma` |

## Data Models

### Product
- `product` — Core: productName, sku (unique), barcode (unique), currentStock, unitId, productCategoryId
- Relations: unit, category, inventory[], prices[], images[], attributeValues[], rfqProducts[], purchaseOrderProducts[], items[]

### Product Category
- `productCategory` — Hierarchical: categoryName, parentCategoryId (self-referencing)
- Limited to at most 5 steps of parent-child relations (enforced with cycle detection and subtree depth validation)

### Product Attribute
- `productAttribute` — name, type (text/number/select/multi_select), options (JSON text for select types)

### Product Attribute Value
- `productAttributeValue` — productId + attributeId + value (text)
- Cascade delete with product

### Product Price
- `productPrice` — amount (Decimal 12,2), priceType, startDate, endDate, currency (default IDR)
- Cascade delete with product

### Product Image
- `productImage` — imageUrl, altText, isPrimary, sortOrder
- Cascade delete with product

### Product Inventory
- `productInventory` — transactionType (IN/OUT/ADJUSTMENT), quantity, currentStock (snapshot after transaction), reference, transactionDate

## Patterns You Must Follow

### 3-File Module Pattern
1. `*Schema.ts` — Zod schemas + `z.infer<>` type exports
2. `*Controller.ts` — Business logic as `TypedHandler<T>` functions
3. `*Route.ts` — Fastify route registration

### Route Pipeline
```typescript
fastify.post("/api/resource/create", {
    preHandler: [validateSchema(schema), authPreHandler, validatePermission],
    handler: controllerFunction,
});
```

### Response Helpers (from `src/utils/response.ts`)
- `success(reply, data, message)` → 200
- `created(reply, data, message)` → 201
- `paginated(reply, items, meta, message)` → 200 with pagination

### Error Handling
- Always throw `AppError.*` (never raw `Error`)

### Soft Delete
- Filter: `where: { deletedAt: null }`
- Delete: `update({ data: { deletedAt: new Date() } })`

### Audit Trail
- Set `createdBy` / `updatedBy` from `request.session?.user?.id`

### Pagination
- Use `buildPaginationQuery()`, `buildSearchFilter()`, `buildPaginationMeta()` from `src/utils/pagination.ts`

## Domain-Specific Rules

1. **SKU must be unique** — validate before create/update
2. **Barcode is optional but unique** when provided
3. **currentStock** on `product` should stay in sync with inventory transactions
4. **Inventory transactions** must record `currentStock` snapshot (stock after the transaction)
5. **Product prices** support overlapping date ranges — the application layer determines which price is active
6. **Category hierarchy** — when deleting a parent, consider orphan subcategories
7. **Unit dependency** — products reference `unit` from the Unit module

## Cross-Domain Dependencies

- **Unit module** — Products reference units for measurement
- **Order module** — RFQ and PO products reference this product
- **Work module** — Items (materials) reference products
- **Request module** — Request products reference this product

## Route Registration
All routes must be registered in `src/routes/routes.ts`.
