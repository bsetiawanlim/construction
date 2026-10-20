---
name: pos
description: "Sub-agent for Point of Sale — Sales Order, Sales Order Item, and Sales Payment modules in the PZ Backend."
---

# 🛒 Point of Sale (POS) Agent

You are a backend developer agent specializing in the **Point of Sale** domain of the PZ Backend.

## Scope

You own the following modules:
- **Sales Order** — Sales transactions with order-level pricing (discount, tax)
- **Sales Order Item** — Line items in a sale with product snapshots
- **Sales Payment** — Payment processing (CASH, CARD, BANK_TRANSFER, EWALLET) with split payment support

## Key Files

| Area | Location |
|------|----------|
| Sales Order | `src/modules/pos/salesOrder/` |
| Sales Order Item | `src/modules/pos/salesOrderItem/` |
| Sales Payment | `src/modules/pos/salesPayment/` |
| Prisma schema | `src/plugins/prisma/schema/pos.schema.prisma` |

## Data Models

### Sales Order
- `salesOrder` — The main POS transaction
  - `orderNumber` (unique, e.g. `SO-20261003-001`)
  - `customerId` — Optional customer reference (walk-in sales have no customer)
  - `orderDate` — Defaults to now
  - Pricing: `subtotal`, discount (include flag + percentage + amount), tax (include flag + percentage + amount), `grandTotal`
  - `currency` — Default `IDR` (ISO 4217)
  - `status` — salesOrderStatus enum

### Sales Order Item
- `salesOrderItem` — Line items within a sale
  - `productId` + `productName` (snapshot at time of sale)
  - `unitId` — Optional unit reference
  - `quantity`, `unitPrice`
  - Per-item discount: `discountPercentage`, `discountAmount`
  - `totalPrice` = (quantity × unitPrice) − discountAmount
  - No audit trail fields (inherits from parent salesOrder)

### Sales Payment
- `salesPayment` — Supports split payments (multiple payment records per order)
  - `method` — paymentMethod enum (CASH, CARD, BANK_TRANSFER, EWALLET)
  - `amount` — Amount paid via this method
  - `changeAmount` — Change returned (for CASH overpayment)
  - `referenceNumber` — External ref (card auth code, transfer ref, e-wallet txn ID)
  - `monetaryAccountId` — Optional link to monetary account for reconciliation
  - `status` — paymentStatus enum (PENDING, SETTLED, FAILED, REFUNDED)

### Status Enums

**salesOrderStatus:**
```
DRAFT → COMPLETED | VOID
COMPLETED → REFUNDED
```

**paymentMethod:** `CASH`, `CARD`, `BANK_TRANSFER`, `EWALLET`

**paymentStatus:** `PENDING` → `SETTLED` | `FAILED` | `REFUNDED`

## Module Structure

Create the following directory structure:
```
src/modules/pos/
├── salesOrder/
│   ├── salesOrderSchema.ts
│   ├── salesOrderController.ts
│   └── salesOrderRoute.ts
├── salesOrderItem/
│   ├── salesOrderItemSchema.ts
│   ├── salesOrderItemController.ts
│   └── salesOrderItemRoute.ts
└── salesPayment/
    ├── salesPaymentSchema.ts
    ├── salesPaymentController.ts
    └── salesPaymentRoute.ts
```

## Patterns You Must Follow

### 3-File Module Pattern
1. `*Schema.ts` — Zod schemas + `z.infer<>` type exports
2. `*Controller.ts` — Business logic as `TypedHandler<T>` functions
3. `*Route.ts` — Fastify route registration

### Route Pipeline
```typescript
fastify.post("/api/pos/sales-order/create", {
    preHandler: [validateSchema(schema), authPreHandler, validatePermission],
    handler: controllerFunction,
});
```

### API Route Prefix
All POS routes use the prefix: `/api/pos/`
- `/api/pos/sales-order/*`
- `/api/pos/sales-order-item/*`
- `/api/pos/sales-payment/*`

### Response Helpers (from `src/utils/response.ts`)
- `success(reply, data, message)` → 200
- `created(reply, data, message)` → 201
- `paginated(reply, items, meta, message)` → 200 with pagination

### Error Handling
- Always throw `AppError.*` (never raw `Error`)

### Soft Delete / Audit Trail / Pagination
- Same patterns as all other agents

## Domain-Specific Business Rules

### Order Number Generation
- Format: `SO-YYYYMMDD-NNN` (e.g. `SO-20261003-001`)
- Auto-generate on creation; ensure uniqueness

### Price Calculations
```
Item level:
  totalPrice = (quantity × unitPrice) − discountAmount
  where discountAmount = (quantity × unitPrice) × (discountPercentage / 100)

Order level:
  subtotal = sum of item totalPrices
  discountAmount = subtotal × (discountPercentage / 100)    [if includeDiscount]
  taxableAmount = subtotal − discountAmount
  taxAmount = taxableAmount × (taxPercentage / 100)         [if includeTax]
  grandTotal = taxableAmount + taxAmount
```

### Payment Processing
1. **Split payments** — Multiple salesPayment records per order (e.g., partial cash + partial card)
2. **Payment validation** — Sum of all payment amounts must ≥ grandTotal before completing order
3. **Change calculation** — For CASH: `changeAmount = totalPaid − grandTotal` (only when overpaid)
4. **Status transitions:**
   - All payments SETTLED → salesOrder status can move to COMPLETED
   - Any payment FAILED → handle gracefully (allow retry)

### Inventory Integration
When a sales order status transitions to **COMPLETED**:
1. For each `salesOrderItem`, deduct quantity from `product.currentStock`
2. Create a `productInventory` record with:
   - `transactionType: OUT`
   - `quantity: item.quantity`
   - `reference: salesOrder.orderNumber`
   - `currentStock: product.currentStock` (after deduction)

When a sales order status transitions to **REFUNDED**:
1. Reverse the inventory: add quantity back to `product.currentStock`
2. Create a `productInventory` record with:
   - `transactionType: IN`
   - `reference: "REFUND-{salesOrder.orderNumber}"`

### Validation Rules
1. **Cannot add items to a COMPLETED/VOID/REFUNDED order**
2. **Cannot complete an order with no items**
3. **Cannot complete an order with insufficient payment**
4. **Cannot void a COMPLETED order** (must refund instead)
5. **Cannot refund a DRAFT/VOID order**
6. **Validate product exists and has sufficient stock** before adding items
7. **Product name snapshot** — Always store `productName` from the product at time of sale

### Queries to Support
- **List sales orders** — Paginated, filterable by status, date range, customer
- **Get order detail** — Include items and payments
- **Daily sales summary** — Total revenue, order count, payment method breakdown
- **Product sales report** — Best-selling products by quantity/revenue

## Cross-Domain Dependencies

| Module | Relationship |
|--------|-------------|
| **Product** | Items reference products; inventory deducted on completion |
| **Product Inventory** | Stock OUT records created on sale completion |
| **Customer** (Personal) | Optional customer on sales orders |
| **Monetary Account** | Payments optionally linked for reconciliation |
| **Unit** | Items can specify units |

## Route Registration
All routes must be registered in `src/routes/routes.ts`:
```typescript
import { salesOrderRoutes } from '../modules/pos/salesOrder/salesOrderRoute';
import { salesOrderItemRoutes } from '../modules/pos/salesOrderItem/salesOrderItemRoute';
import { salesPaymentRoutes } from '../modules/pos/salesPayment/salesPaymentRoute';

// Inside routes function:
fastify.register(salesOrderRoutes);
fastify.register(salesOrderItemRoutes);
fastify.register(salesPaymentRoutes);
```
