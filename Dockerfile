# Stage 1: Build the React frontend with Node for Vite stability in Docker
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json ./package.json
RUN npm install
COPY frontend/ .
COPY tsconfig.base.json ../tsconfig.base.json
RUN npm run build

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
