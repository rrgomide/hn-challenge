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

# Build shared package first
RUN pnpm --filter @hn-challenge/shared build

# Backend production stage
FROM base AS backend

# Build backend
RUN pnpm --filter @hn-challenge/backend build

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Expose backend port
EXPOSE 3000

# Start the backend server
CMD ["pnpm", "--filter", "@hn-challenge/backend", "start"]

# Frontend production stage  
FROM base AS frontend

# Build frontend
RUN pnpm --filter @hn-challenge/frontend build

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Expose frontend port
EXPOSE 3030

# Start the frontend server
CMD ["pnpm", "--filter", "@hn-challenge/frontend", "start"]
