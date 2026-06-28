# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /usr/src/app

# Copy workspace manifests first for better layer caching
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci --workspace=apps/api --workspace=@your-own/shared --omit=dev --no-audit --no-fund

COPY packages/shared packages/shared
COPY apps/api apps/api

# --- Runtime stage ---
FROM node:20-alpine AS runtime
WORKDIR /usr/src/app

ENV NODE_ENV=production

# Run as a non-root user — never run the production process as root.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build --chown=appuser:appgroup /usr/src/app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /usr/src/app/apps/api ./apps/api
COPY --from=build --chown=appuser:appgroup /usr/src/app/packages/shared ./packages/shared
COPY --from=build --chown=appuser:appgroup /usr/src/app/package.json ./package.json

USER appuser

WORKDIR /usr/src/app/apps/api

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||5000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
