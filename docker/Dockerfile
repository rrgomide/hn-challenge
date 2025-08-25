# Dependencies stage - install all dependencies once
FROM node:20-alpine AS deps

# Install pnpm
RUN npm install -g pnpm@10.14.0

# Set working directory
WORKDIR /app

# Copy workspace configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for all workspaces
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (skip postinstall scripts to avoid build issues)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build stage - build all packages
FROM deps AS build

# Copy all source code
COPY packages/shared/ ./packages/shared/
COPY apps/ ./apps/

# Build packages in dependency order (shared → backend → frontend)
RUN pnpm --filter @hn-challenge/shared build
RUN pnpm --filter @hn-challenge/backend build
RUN pnpm --filter @hn-challenge/frontend build

# Backend production stage
FROM node:20-alpine AS backend

# Install pnpm and curl for health checks
RUN apk add --no-cache curl && npm install -g pnpm@10.14.0

# Set working directory
WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for all workspaces (needed for pnpm filter)
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies (skip postinstall scripts)
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy built packages
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/backend/dist ./apps/backend/dist

# Expose backend port
EXPOSE 3000

# Start the backend server
CMD ["pnpm", "--filter", "@hn-challenge/backend", "start"]

# Frontend production stage
FROM node:20-alpine AS frontend

# Install pnpm and curl for health checks
RUN apk add --no-cache curl && npm install -g pnpm@10.14.0

# Set working directory
WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for all workspaces (needed for pnpm filter)
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies (skip postinstall scripts)
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy built packages
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/frontend/build ./apps/frontend/build

# Expose frontend port
EXPOSE 3030

# Start the frontend server
CMD ["pnpm", "--filter", "@hn-challenge/frontend", "start"]
