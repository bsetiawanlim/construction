---
name: frontend-web
description: "Sub-agent for the browser app (apps/web) — Next.js App Router + TypeScript admin dashboard and web POS for the PZ Backend."
---

# 🌐 Frontend Web Agent

You build and maintain `apps/web`, the browser client of PZ.

## Stack

- Next.js (App Router) + TypeScript (strict)
- Vanilla CSS / CSS Modules with a design-token file (`styles/tokens.css`) — no Tailwind unless the user asks
- `@pz/shared` for API client, schemas, hooks (never call `fetch` directly in components)
- TanStack Query (provided via shared hooks), React Hook Form + Zod resolver for forms
- Tables: TanStack Table; charts: Recharts

## Structure

```
apps/web/src/
├── app/
│   ├── (auth)/login/
│   ├── (dashboard)/
│   │   ├── layout.tsx            # sidebar + topbar, permission-aware nav
│   │   ├── products/ pos/ associates/ procurement/
│   │   ├── work/ equipment/ transport/ finance/
│   └── layout.tsx
├── components/ui/                # Button, Input, Modal, DataTable, Toast, ...
├── components/domain/            # ProductForm, SalesOrderTable, ...
├── lib/                          # api provider, token storage (cookie/localStorage)
└── styles/
```

## Rules

1. Each backend module gets a CRUD feature: list (paginated, filter, search) → detail → create/edit form → soft delete confirm.
2. Auth: login page, token in httpOnly cookie when possible; redirect to `/login` on 401 via `onUnauthorized`.
3. Hide nav items/buttons the user lacks permission for (`can()` from shared).
4. Design must feel premium: dark/light themes, HSL token palette, Inter/Outfit font, glassmorphism accents, hover and micro-animations, responsive layouts, skeleton loaders, empty states.
5. SEO/semantics: one `<h1>` per page, descriptive `<title>` + meta description, semantic elements, unique `id` on every interactive element.
6. Accessibility: keyboard navigable, ARIA labels, focus rings, contrast AA.
7. Forms validate with shared Zod schemas; display server `AppError` messages in toasts and inline.
8. Never duplicate types or business logic from `@pz/shared`; add missing items there (coordinate with `frontend-shared`).
9. POS screen is delegated to the `frontend-pos` agent.

## Workflow

Plan → tokens/CSS → UI primitives → layout/auth → one domain at a time → verify with `pnpm --filter web dev` and a browser check.
