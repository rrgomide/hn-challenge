# Use Node.js 20 Alpine as base image
FROM node:20-alpine AS base

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

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy shared package source and build it first
COPY packages/shared/ ./packages/shared/
RUN pnpm --filter @hn-challenge/shared build

# Copy remaining source code
COPY apps/ ./apps/

# Backend production stage
FROM base AS backend

# Build backend (shared package is already built)
RUN pnpm --filter @hn-challenge/backend build

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Expose backend port
EXPOSE 3000

# Start the backend server
CMD ["pnpm", "--filter", "@hn-challenge/backend", "start"]

# Frontend production stage
FROM base AS frontend

# Build frontend (shared package is already built)
RUN pnpm --filter @hn-challenge/frontend build

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Expose frontend port
EXPOSE 3030

# Start the frontend server
CMD ["pnpm", "--filter", "@hn-challenge/frontend", "start"]
