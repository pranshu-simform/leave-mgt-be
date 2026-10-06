# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
# HUSKY=0: the `prepare` script installs git hooks, which a container has no use for.
ENV HUSKY=0
RUN npm install --global pnpm@11.27.1
WORKDIR /app

# Build: all dependencies, the Prisma client (generated, not committed), then the bundles.
FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# `prisma generate` reads the schema only, but prisma.config.ts insists that DATABASE_URL is set, so a
# placeholder is given for this one command. It is not stored in the image and nothing connects to it.
RUN DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder pnpm prisma:generate \
  && pnpm build

# Runtime: production dependencies only, the two bundles, and the schema and migrations. The container
# only runs the API. Migrations and the seed are run by hand (see the README): `prisma` is installed and
# `dist/seed.js` is built so that `docker compose exec backend …` can do it.
FROM base AS runtime
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# `prepare` runs husky, a dev dependency that is not installed here.
# The package store is removed in the same step, so its copy of every package stays out of the image.
RUN pnpm pkg delete scripts.prepare \
  && pnpm install --prod --frozen-lockfile --store-dir /tmp/pnpm-store \
  && rm -rf /tmp/pnpm-store
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
COPY prisma.config.ts ./
USER node
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["node", "dist/server.js"]
