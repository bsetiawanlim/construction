# Project Z — Unified Workspace Project Memory

## 1. System Topology & Ports
- **Workspace Root**: `d:/Work/Programming/PZ`
- **Backend API**: Fastify v5 + Prisma + PostgreSQL (`localhost:5432`). Port: `3000`. API Docs: `http://localhost:3000/documentation`.
- **Frontend Monorepo**: Turborepo + pnpm
  - **Web Client**: Next.js 15 App Router (`frontend/apps/web`), Port: `3001`. URL: `http://localhost:3001`
  - **Android Mobile**: React Native / Expo (`frontend/apps/mobile`), Metro Port: `8081`.
  - **Shared Foundation**: `@pz/shared` (`frontend/packages/shared`).

## 2. Essential Commands & Server Execution
- **Run Dev Servers**:
  - Backend: `pnpm --dir backend start` (port 3000)
  - Frontend: `pnpm --dir frontend dev` (port 3001)
  - Mobile: `pnpm --dir frontend --filter mobile android`
- **Shared Lib Build**: `pnpm --dir frontend --filter @pz/shared build` (MUST run after modifying `packages/shared/src/`)
- **Backend Migrations**: `pnpm --dir backend prisma migrate dev`
- **Typecheck**:
  - Frontend: `pnpm --dir frontend run typecheck`
  - Backend: `pnpm --dir backend exec tsc --noEmit`

## 3. Data & Entity Conventions
- **Associates (Customer, Employee, Vendor)**:
  - Linked to a `profile` record (`id`, `firstName`, `lastName`, `phoneNumber`, `address`, `city`, `province`, `postalCode`, `country`, `isCompany`).
  - Employees must be individuals (`isCompany: false`).
  - Front-end uses `PersonPicker` to link existing or create inline.
- **Product & Pricing**:
  - `product` stores metadata; pricing lives in `productPrice` (`priceType: "retail"`, currency `IDR`).
  - Controllers flatten `retailPrice` (number) onto returned product objects.
  - POS `salesOrderItem` requires valid `productId` foreign keys.
  - Category hierarchy: `productCategory` supports parent-child relations limited to at most 5 levels with cycle detection.
- **POS Calculations & State**:
  - Calculations in `@pz/shared` (`calculateItemTotals`, `calculateOrderTotals`).
  - Vanilla Zustand store `cartStore` in `@pz/shared`.
- **Role & Permissions**:
  - Validated against `tableActions` dictionary in `backend/src/modules/personal/role/tableActions.ts`.
  - Checked in frontend with `can(tableName, actionName)` from `lib/permissions.ts`.

## 4. Frontend Standards
- **Web Styling**: Vanilla CSS + CSS variables in `src/styles/tokens.css` (Glassmorphism, dark palette). No Tailwind unless requested.
- **Auth**: Better-Auth session cookies (`withCredentials: true`), backend `authPreHandler`.
- **Navigation**: Sidebar and header taskbar host primary links (`/pos`, `/pos/orders`, `/pos/reports`, `/products`, `/customers`, `/employees`, `/vendors`, `/roles`).
