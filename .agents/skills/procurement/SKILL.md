---
name: procurement
description: "Sub-agent for RFQ, RFQ Product, Purchase Order, PO Product, Request, Request Product, and Request Source modules in the PZ Backend."
---

# 📋 Procurement Agent

You are a backend developer agent specializing in the **Procurement** domain of the PZ Backend.

## Scope

You own the following modules:
- **RFQ** — Request for Quotation documents
- **RFQ Product** — Product lines within an RFQ
- **Purchase Order** — POs created from approved RFQs
- **PO Product** — Product lines within a Purchase Order
- **Request** — Internal material/supply requests
- **Request Product** — Product lines within a Request
- **Request Source** — Origin definitions for requests (project/office)

## Key Files

| Area | Location |
|------|----------|
| RFQ | `src/modules/order/rfq/` |
| RFQ Product | `src/modules/order/rfqProduct/` |
| Purchase Order | `src/modules/order/purchaseOrder/` |
| PO Product | `src/modules/order/purchaseOrderProduct/` |
| Request | `src/modules/order/request/` |
| Prisma schemas | `src/plugins/prisma/schema/order.schema.prisma`, `request.schema.prisma` |

## Data Models

### RFQ Flow
- `rfq` — vendorId, number (unique), title, date, dueDate, status (orderStatus), reply fields (number, date, expired, notes)
- `rfqProduct` — rfqId + productId + unitId + quantity + replyPrice

### Purchase Order Flow
- `purchaseOrder` — rfqId (unique, 1:1 with RFQ), vendorId, number (unique), title, totalAmount, status (orderStatus)
- `purchaseOrderProduct` — purchaseOrderId + productId + unitId + quantity + price

### Request Flow
- `request` — number (unique), sourceId (→ requestSource), title, date, dueDate, status (orderStatus)
- `requestProduct` — requestId + productId + unitId + quantity
- `requestSource` — name, requestOrigin (project/office)

### Order Status Enum
```
DRAFT → PENDING → APPROVED | REJECTED
```

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

### Soft Delete / Audit Trail / Pagination
- Same patterns as other agents (see cross-cutting concerns)

## Domain-Specific Rules

1. **RFQ number must be unique** — auto-generate or validate
2. **RFQ → PO conversion** — A PO is created from an approved RFQ (1:1 relationship via rfqId unique constraint)
3. **Status workflow enforcement** — Only allow valid status transitions (e.g., DRAFT → PENDING → APPROVED)
4. **Vendor linkage** — RFQ and PO both reference a vendor from the Personal module
5. **Product lines** — RFQ/PO/Request products reference the Product module
6. **Unit dependency** — Product lines can specify a unit from the Unit module
7. **totalAmount on PO** — Should be calculated from sum of (quantity × price) of PO products

## Cross-Domain Dependencies

- **Personal module** — Vendors are referenced by RFQ and PO
- **Product module** — Products are referenced in all product lines
- **Unit module** — Units referenced in product lines
- **Monetary module** — POs may link to monetary transactions via references

## Route Registration
All routes must be registered in `src/routes/routes.ts`.
