# Stage 1: Build the React frontend
FROM oven/bun:1 AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/bun.lock* ./
RUN bun install --frozen-lockfile
COPY frontend/ .
COPY tsconfig.base.json ../tsconfig.base.json
RUN bun run build

# Stage 2: Backend runtime
FROM oven/bun:1 AS runner
WORKDIR /app
COPY backend/package.json ./
RUN bun install --production
COPY backend/ .
# Copy built frontend assets so Hono can serve them
COPY --from=frontend-builder /app/frontend/dist ./dist
EXPOSE 4000
CMD ["bun", "index.ts"]
