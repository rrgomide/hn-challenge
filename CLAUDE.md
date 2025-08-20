# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a TypeScript monorepo using pnpm workspaces with the following structure:

- **Backend** (`apps/backend`): Express.js API server with TypeScript, uses Vitest for testing
- **Frontend** (`apps/frontend`): React Router v7 application with Vite, Tailwind CSS
- **Shared** (`packages/shared`): Common utilities and types shared between frontend and backend

The backend implements a snippet creation API with in-memory storage and basic text summarization. The frontend is configured for React Router v7 with server-side rendering capabilities.

## Development Commands

### Root Commands (run from project root)
- `pnpm dev` - Start all services in development mode (backend on :3000, frontend on :3030)
- `pnpm build` - Build all packages in dependency order (shared → backend → frontend)
- `pnpm start` - Start all services in production mode
- `pnpm lint` - Run ESLint across all workspaces
- `pnpm typecheck` - Run TypeScript type checking across all workspaces

### Backend Commands (from `apps/backend`)
- `pnpm dev` - Start backend dev server with tsx watch
- `pnpm test` - Run Vitest in watch mode
- `pnpm test:run` - Run all tests once
- `pnpm build` - Compile TypeScript to dist/
- `pnpm start` - Run compiled JavaScript from dist/

### Frontend Commands (from `apps/frontend`)
- `pnpm dev` - Start React Router dev server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm typegen` - Generate React Router type definitions

### Shared Package Commands (from `packages/shared`)
- `pnpm build` - Compile TypeScript library

## Testing Strategy

- Backend uses **Vitest** with Supertest for integration tests
- Test files are located in `__tests__/` directories
- Integration tests cover the `/snippets` API endpoint comprehensively
- Run `pnpm test:run` from backend directory for CI/test verification

## Key Architecture Patterns

### Backend (Express + TypeScript)
- **Controller-Service pattern**: Controllers handle HTTP concerns, Services contain business logic
- **In-memory storage**: Uses Map for snippet storage (not persistent)
- **ESM modules**: Backend uses ES modules with .js extensions in imports (Node.js ESM requirement)
- **Error handling**: Standardized error responses with appropriate HTTP status codes

### Frontend (React Router v7)
- **File-based routing**: Routes defined in `app/routes.ts`
- **Server-side rendering**: React Router v7 handles SSR out of the box
- **Tailwind CSS**: For styling with Inter font configured
- **Port 3030**: Frontend dev server runs on port 3030 to avoid conflicts

### Shared Package
- **Workspace reference**: Used via `workspace:*` in package.json dependencies
- **Build requirement**: Must be built before backend/frontend can use it
- **TypeScript compilation**: Outputs to dist/ directory

## Docker Setup

Docker configuration is available in the `docker/` directory:
- Run `cd docker && docker compose up --build` to start both services
- Backend available at :3000, Frontend at :3030
- Optimized for production with multi-stage builds

## Important Notes

- **Backend** uses **ES modules** - import statements MUST use `.js` extensions for Node.js ESM compatibility
- **Frontend** uses **ES modules** - import statements should NOT use `.js` extensions (bundler handles resolution)
- **Build order matters**: Shared package must be built before backend/frontend
- **pnpm workspace**: Dependencies between packages use `workspace:*` syntax
- **TypeScript**: Strict mode enabled across all packages
- **Testing**: Backend has comprehensive integration test coverage
- **AI Integration**: Backend includes Google Gemini SDK setup (currently commented out)

## Port Configuration
- Backend development: 3000
- Frontend development: 3030
- Docker backend: 3000
- Docker frontend: 3030