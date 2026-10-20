# Project Z — Unified Workspace Agents & Architecture

## 🚨 CRITICAL RULE: Server Execution
When the user asks to **"run the server"**, **"run server"**, **"start server"**, **"start the server"**, **"run frontend and backend server"**, **"start servers"**, **"run both servers"**, or any phrase asking to start/run the server(s):
- **DO NOT ASK ANY QUESTIONS, CONFIRMATIONS, PERMISSIONS, OR OPTIONS.**
- **IMMEDIATELY RUN BOTH SERVERS WITHOUT PROMPTING:**
  1. Backend: `pnpm --dir backend start` (Fastify listening on `http://localhost:3000`) as a background daemon process (`IsDaemon: true`).
  2. Frontend: `pnpm --dir frontend dev` (Next.js listening on `http://localhost:3001`) as a background daemon process (`IsDaemon: true`).
- Verify ports 3000 and 3001 are listening and `http://localhost:3000/api/health` returns `status: "ok"`.
- Output the running URLs and status directly.

---

## 🏗️ Workspace Layout & Ports

| Component | Path | Technology | Default Port | Documentation / URL |
|---|---|---|---|---|
| **Backend API** | `backend/` | Fastify v5 + Prisma + PostgreSQL | `3000` | `http://localhost:3000/documentation` |
| **Web Client** | `frontend/apps/web/` | Next.js 15 App Router | `3001` | `http://localhost:3001` |
| **Android Mobile** | `frontend/apps/mobile/` | React Native + Expo | `8081` | Android Emulator / Physical Device |
| **Shared Foundation** | `frontend/packages/shared/` | TypeScript + Zod + Zustand | — | Monorepo `@pz/shared` library |

---

## 🤖 Unified Agents Topology (`.agents/skills/`)

### 🚀 Full-Stack Feature Lead
- **`fullstack-dev`**: End-to-end fullstack feature development coordinating Prisma models, Fastify controllers, `@pz/shared` validation schemas, Next.js UI, and React Native mobile screens.

---

### 🌐 Web & Mobile Platform Agents (`frontend/`)

#### 1. Web Client (`frontend/apps/web/`)
- **`frontend-web`**: Next.js 15 App Router client. Layouts, responsive sidebar, clean header, Vanilla CSS design tokens (`src/styles/tokens.css`), glassmorphism, UI primitives (`components/ui/`), Better-Auth session handling, and TanStack Table/Query features.
- **`web-pos`**: Desktop two-pane cashier register terminal (`/pos`), barcode scanning, cart state (`cartStore`), keyboard shortcuts (`F2`, `F8`), split tender checkout (Cash, Card, Transfer, E-Wallet), printable receipts, and daily sales reports.
- **`web-associates-auth`**: Users, Roles permission matrix (`tableActions`), and Associates (Customers, Employees, Vendors) auto-linked with `profile` records via `PersonPicker`.

#### 2. Android Mobile (`frontend/apps/mobile/`)
- **`frontend-android`**: React Native / Expo Android client. Android navigation (Expo Router), 48dp+ touch targets, Android emulator networking (`10.0.2.2:3000`), token storage adapter (`TokenStorage`), and safe area handling.
- **`android-pos`**: Mobile Point of Sale flow. Touch catalog, persistent bottom-sheet cart, camera barcode scanning (`expo-camera`), single-hand ergonomics, and mobile checkout.

#### 3. Shared Foundation (`frontend/packages/shared/`)
- **`frontend-shared`**: Monorepo shared package `@pz/shared`. Platform-agnostic API client factory, Zod schemas mirroring Fastify routes, TypeScript definitions, Zustand stores (`cartStore`), calculation math, and utility functions.
- **Rule**: ALWAYS run `pnpm --dir frontend --filter @pz/shared build` after editing `packages/shared/src/`.

---

### ⚙️ Backend Domain Agents (`backend/`)

- **`pos`**: Fastify Sales Order, Sales Order Item, and Sales Payment routes, calculations, and order status transitions.
- **`product-catalog`**: Product, Product Category tree (max 5 levels), Product Attribute/Value, Multi-Price tiers, Images, and Inventory transactions (IN/OUT/ADJUSTMENT).
- **`procurement`**: RFQ, RFQ Product, Purchase Order, PO Product, Material Requests, and Request Sources.
- **`personal-auth`**: Better-Auth, Profile, Contact, Documents, Role, Permission matrix, and Associates (Vendor, Customer, Employee, Position).
- **`equipment`**: Equipment Type, Brand, Model, Entity, Features, Maintenance, and Spare Parts.
- **`finance`**: Monetary Accounts, Transactions, References, Payroll Periods, Salary Records, and Components.
- **`transport`**: Vehicles, Drivers, Trips, and Fuel Logs.
- **`work-management`**: Work (BOQ), Work Items, Workers, Equipment assignments, Work Offers, Items (Materials), and Tasks.
- **`aws-deployment`**: AWS deployment strategies (Lightsail / EC2 with PM2 & Nginx, Amplify Gen 2 hosting for Next.js SSR, ECS Fargate, ECR Docker containers, and SSL/DNS).

---

## 🛠️ Global Project Commands

| Action | Command | Working Directory / Note |
|---|---|---|
| **Run Both Servers** | Backend: `pnpm --dir backend start`<br/>Frontend: `pnpm --dir frontend dev` | Background daemon (`IsDaemon: true`) |
| **Build Shared Lib** | `pnpm --dir frontend --filter @pz/shared build` | Required after any change to `@pz/shared` |
| **Typecheck Frontend** | `pnpm --dir frontend run typecheck` | Validates shared, web, and mobile types |
| **Typecheck Backend** | `pnpm --dir backend exec tsc --noEmit` | Validates Fastify & Prisma types |
| **Prisma Migrations** | `pnpm --dir backend prisma migrate dev` | Applies new database migrations |
| **Run Android App** | `pnpm --dir frontend --filter mobile android` | Starts Expo dev server for Android |

