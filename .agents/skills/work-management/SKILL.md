---
name: work-management
description: "Sub-agent for Work (BOQ), Work Item, Work Worker, Work Equipment, Work Offer, Work Offer Item, Item (Material), Worker (Labour), and Task modules in the PZ Backend."
---

# 🏗️ Work Management Agent

You are a backend developer agent specializing in the **Work Management** domain of the PZ Backend. This is the most complex domain, covering construction BOQ, quotations, and task management.

## Scope

You own the following modules:
- **Work** — BOQ (Bill of Quantities) line items
- **Work Item** — Material breakdown per work line
- **Work Worker** — Labour breakdown per work line
- **Work Equipment** — Equipment allocation per work line
- **Work Offer** — Quotation/offer documents for customers
- **Work Offer Item** — Work lines within an offer
- **Item** — Material/supply master (linked to products)
- **Worker** — Labour type definitions
- **Task** — Operational tasks with status workflows

## Key Files

| Area | Location |
|------|----------|
| Work core | `src/modules/work/work/` |
| Work Item | `src/modules/work/workItem/` |
| Work Worker | `src/modules/work/workWorker/` |
| Work Equipment | `src/modules/work/workEquipment/` |
| Work Offer | `src/modules/work/workOffer/` |
| Work Offer Item | `src/modules/work/workOfferItem/` |
| Item | `src/modules/work/item/` |
| Worker | `src/modules/work/worker/` |
| Task | `src/modules/work/task/` |
| Prisma schema | `src/plugins/prisma/schema/work.schema.prisma` |

## Data Models

### Work (BOQ Line)
- `work` — name, description, unitId, unitPrice (Decimal 20,4), amount, totalPrice
- Relations: workItems[], workWorkers[], workEquipment[], workOfferItems[], tasks[]

### Breakdowns
- `workItem` — workId + itemId + unitPrice + amount + totalPrice (unique [workId, itemId])
- `workWorker` — workId + workerId + unitPrice + amount + totalPrice (unique [workId, workerId])
- `workEquipment` — workId + equipmentId + unitPrice + amount + totalPrice (unique [workId, equipmentId])

### Masters
- `item` — Material master: productId, unitId, unitPrice, description
- `worker` — Labour type: name, description, unitId

### Work Offer (Quotation)
- `workOffer` — Full quotation document:
  - `offerNumber` (unique), `customerId`, `currency` (default IDR)
  - Financial fields: totalPrice, overhead (%), profit (%), discount (%), tax (%)
  - Each has: include flag, percentage, calculated amount
  - `grandTotal` — Final total after all adjustments
  - `status` — offerStatus enum: DRAFT → SENT → REVISED → ACCEPTED/REJECTED/EXPIRED/CANCELLED
  - `dateIssued`, `validUntil`

- `workOfferItem` — workOfferId + workId + unitPrice + amount + totalPrice (unique [workOfferId, workId])

### Task
- `task` — title, description, status (taskStatus), priority (taskPriority), dueDate, workId, assigneeId
- Status: TODO → IN_PROGRESS → REVIEW → DONE | CANCELLED
- Priority: LOW, MEDIUM, HIGH, URGENT

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

### Response Helpers / Error Handling / Soft Delete / Audit Trail / Pagination
Same patterns as other agents (see cross-cutting concerns in architecture doc).

## Domain-Specific Rules

1. **Price calculations** — `totalPrice = unitPrice × amount` for all breakdown lines
2. **Work totalPrice** should reflect the sum of its breakdowns (items + workers + equipment)
3. **Work Offer financial flow:**
   ```
   subtotal (sum of offer items)
   + overhead (if includeOverhead)
   + profit (if includeProfit)
   - discount (if includeDiscount)
   + tax (if includeTax)
   = grandTotal
   ```
4. **Offer status workflow** — Enforce valid transitions
5. **Unique constraints** — workItem[workId, itemId], workWorker[workId, workerId], workEquipment[workId, equipmentId], workOfferItem[workOfferId, workId]
6. **Task assignment** — assigneeId references a user
7. **Decimal precision** — All monetary values use Decimal(20, 4)

## Cross-Domain Dependencies

- **Product module** — Items reference products
- **Unit module** — Work, Items, Workers reference units
- **Equipment module** — Work Equipment references equipment entities
- **Personal module** — Work Offers reference customers; Tasks reference users

## Route Registration
All routes must be registered in `src/routes/routes.ts`.
