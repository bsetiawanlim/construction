# Docker Standalone Setup for Next.js 15 (Turborepo)

For deploying Next.js 15 on **AWS App Runner**, **AWS ECS Fargate**, or **EC2 / Lightsail**.

## 1. Enable Standalone Output in `next.config.js` or `next.config.ts`

In `frontend/apps/web/next.config.ts` (or `.js`):

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@pz/shared"],
  // Ensure experimental or monorepo package resolution works seamlessly:
};

export default nextConfig;
```

## 2. Multi-stage Dockerfile for Monorepo Web App

Create `frontend/apps/web/Dockerfile`:

```dockerfile
# Base node image
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# Dependencies
FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .

# Build shared library first, then web app
RUN pnpm --filter @pz/shared build
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter web build

# Runner (Production standalone image)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and standalone server output
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3001

CMD ["node", "apps/web/server.js"]
```

## 3. Deployment to AWS App Runner
1. Push Docker image to Amazon ECR.
2. Go to **AWS App Runner** > **Create service**.
3. Source: **Container registry** > Amazon ECR > Select your image and tag.
4. Port: `3001`.
5. Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://api.yourdomain.com`
   - `NODE_ENV`: `production`
6. App Runner provides automatic HTTPS and custom domain support out of the box.
