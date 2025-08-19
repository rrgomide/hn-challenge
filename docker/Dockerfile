# Use Node.js 20 Alpine as base image
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10.14.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build stage for frontend
FROM base AS frontend-builder
WORKDIR /app
RUN pnpm --filter @hn-challenge/frontend build

# Build stage for backend
FROM base AS backend-builder
WORKDIR /app
RUN pnpm --filter @hn-challenge/backend build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built applications
COPY --from=frontend-builder /app/apps/frontend/build ./apps/frontend/build
COPY --from=backend-builder /app/apps/backend/dist ./apps/backend/dist

# Copy shared package
COPY packages/shared ./packages/shared

# Expose ports
EXPOSE 3000 3030

