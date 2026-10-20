# AWS Amplify Hosting Setup for Next.js 15 Monorepo

AWS Amplify Hosting is the fastest, fully managed solution for deploying Next.js 15 App Router applications with SSR and ISR support.

## 1. Connecting the Repository
1. Navigate to the **AWS Amplify Console** in your AWS Management Console.
2. Click **Host web app** -> Choose **GitHub** (or your git provider) -> Authorize AWS.
3. Select the repository and the production branch (e.g., `main` or `release`).

## 2. Monorepo App Root Configuration
Since the repository is structured with the frontend in `frontend/apps/web`, specify the Monorepo settings:
- **Monorepo**: Checked / Enabled.
- **App Root**: `frontend` (or `frontend/apps/web` depending on Turborepo config).

## 3. Amplify Build Specification (`amplify.yml`)
Save this file at the root of `frontend/` or configure it in the Amplify Console under **App settings > Build settings**:

```yaml
version: 1
applications:
  - appRoot: frontend
    frontend:
      phases:
        preBuild:
          commands:
            - corepack enable
            - corepack prepare pnpm@latest --activate
            - pnpm install --frozen-lockfile
            - pnpm --filter @pz/shared build
        build:
          commands:
            - pnpm --filter web build
      artifacts:
        baseDirectory: apps/web/.next
        files:
          - '**/*'
      cache:
        paths:
          - .pnpm-store/**/*
          - node_modules/**/*
          - apps/web/.next/cache/**/*
```

## 4. Environment Variables in Amplify Console
Under **App settings > Environment variables**, add:
- `NEXT_PUBLIC_API_URL`: `https://api.yourdomain.com` (Your backend production URL)
- `NODE_VERSION`: `20` (or `22`)
- Any other client-accessible public variables prefixed with `NEXT_PUBLIC_`.

## 5. Custom Domain & SSL
1. Under **App settings > Domain management**, click **Add domain**.
2. Enter your root domain or subdomain (e.g. `app.yourdomain.com`).
3. Amplify will automatically generate an AWS Certificate Manager (ACM) SSL certificate and provide the CNAME DNS records to add to Route 53 or your DNS registrar.
