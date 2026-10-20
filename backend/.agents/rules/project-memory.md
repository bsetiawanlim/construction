# Project Z — Condensed Project Memory

## 1. System Topology & Ports
- **Backend**: Fastify v5 + Prisma + PostgreSQL (`localhost:5432`). Port: `3000`. API Docs: `http://localhost:3000/documentation`.
- **Frontend**: Turborepo monorepo.
  - Web App: Next.js 15 App Router (`apps/web`), Port: `3001`.
  - Mobile: React Native / Expo (`apps/mobile`).
  - Shared: `@pz/shared` (`packages/shared`).

## 2. Essential Commands
- **Backend Start**: `pnpm start` (in `backend/`)
- **Backend Migrate**: `pnpm prisma migrate dev` (migrations: `src/plugins/prisma/migrations/`)
- **Frontend Dev**: `pnpm dev` (in `frontend/`, runs Next.js on `:3001`)
- **Shared Lib Build**: `pnpm --filter @pz/shared build` (MUST run after modifying `packages/shared/src/`)
- **Typecheck**: `pnpm run typecheck` (frontend) / `pnpm exec tsc --noEmit` (backend)

## 3. Data & Entity Conventions
- **Associates (Customer, Employee, Vendor)**:
  - Linked to a `profile` record (`id`, `firstName`, `lastName`, `phoneNumber`, `address`, `city`, `province`, `postalCode`, `country`, `isCompany`).
  - `profile` columns include separated structured address (`city`, `province`, `postalCode`, `country`) with database indexes on `city`, `province`, and `country`.
  - Can link to an existing person profile via `profileId` or auto-create inline if omitted.
  - Employees must be individuals (`isCompany: false`).
- **Product & Pricing**:
  - `product` stores metadata; pricing lives in `productPrice` (`priceType: "retail"`, currency `IDR`).
  - Controllers flatten/map `retailPrice` (number) onto returned product objects for UI/POS.
  - POS `salesOrderItem` requires valid `productId` foreign keys.
  - Category hierarchy: `productCategory` supports parent-child relations limited to at most 5 steps of relations from root, with cycle detection and descendant depth validation.
- **POS Calculations & State**:
  - Core math in `@pz/shared` (`calculateItemTotals`, `calculateOrderTotals`).
  - Vanilla Zustand store `cartStore` in `@pz/shared`.

- **Role & Permissions**:
  - Validated against `tableActions` dictionary in `backend/src/modules/personal/role/tableActions.ts`.
  - Permission items contain `tableName`, `actionName`, and `status: boolean` (defaults `true`).

## 4. Frontend Standards
- **Styling**: Vanilla CSS + CSS variables in `globals.css` (Glassmorphism, dark palette). No Tailwind unless requested.
- **Auth**: Better-Auth session cookies (`withCredentials: true`), prehandler `authPreHandler`.
- **Toolbars & Navigation**: Sidebar and header task bar host primary operational links (`/pos`, `/pos/orders`, `/pos/reports`, `/products`, `/customers`, `/employees`, `/vendors`, and `/roles` for Super Admin).
