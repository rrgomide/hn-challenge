# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a TypeScript monorepo using pnpm workspaces with the following structure:

- **Backend** (`apps/backend`): Express.js API server with TypeScript, MongoDB integration, AI-powered text summarization
- **Frontend** (`apps/frontend`): React Router v7 application with Vite, Tailwind CSS, server-side rendering
- **Shared** (`packages/shared`): Common utilities, types, and interfaces shared between frontend and backend

The backend implements a snippet creation and retrieval API with MongoDB persistence and AI-powered text summarization using Google Gemini or OpenAI. The frontend provides a modern interface built with React Router v7 and comprehensive accessibility features.

## Development Commands

### Root Commands (run from project root)
- `pnpm dev` - Start MongoDB service and all development servers (backend on :3000, frontend on :3030)
- `pnpm build` - Build all packages in dependency order (shared → backend → frontend)
- `pnpm start` - Start all services in production mode
- `pnpm lint` - Run ESLint across all workspaces
- `pnpm typecheck` - Run TypeScript type checking across all workspaces
- `pnpm test:backend` - Run backend tests
- `pnpm test:frontend` - Run frontend tests
- `pnpm docker:up` - Start all services with Docker Compose
- `pnpm docker:down` - Stop Docker services
- `pnpm docker:logs` - View Docker container logs

### Backend Commands (from `apps/backend`)
- `pnpm dev` - Start backend dev server with tsx watch
- `pnpm test` - Run Vitest in watch mode
- `pnpm test:run` - Run all tests once
- `pnpm build` - Compile TypeScript to dist/
- `pnpm start` - Run compiled JavaScript from dist/
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm lint` - Run ESLint

### Frontend Commands (from `apps/frontend`)
- `pnpm dev` - Start React Router dev server on port 3030
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm typegen` - Generate React Router type definitions
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm lint` - Run ESLint
- `pnpm test` - Run Vitest in watch mode
- `pnpm test:run` - Run all tests once

### Shared Package Commands (from `packages/shared`)
- `pnpm build` - Compile TypeScript library
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm lint` - Run ESLint

## Testing Strategy

- **Backend**: Uses **Vitest** with Supertest for integration tests and unit tests
  - Integration tests cover the `/snippets` API endpoints comprehensively
  - Service layer unit tests for AI integration and business logic
  - Test files located in `__tests__/` directories and service subdirectories

- **Frontend**: Uses **Vitest** with React Testing Library and jsdom
  - Component tests for UI components with accessibility testing
  - Test setup includes jsdom environment for DOM testing
  - Test files located in `__tests__/` directories within component folders

## Key Architecture Patterns

### Backend (Express + TypeScript + MongoDB)
- **Repository pattern**: Abstracted data access with MongoDB implementation
- **Controller-Service pattern**: Controllers handle HTTP, Services contain business logic
- **AI Integration**: Dual provider support (Google Gemini + OpenAI) with automatic fallback
- **Database**: MongoDB with connection pooling and proper error handling
- **ESM modules**: Uses ES modules with .js extensions in imports (Node.js ESM requirement)
- **Environment-based configuration**: Supports development and production MongoDB URIs

### Frontend (React Router v7)
- **File-based routing**: Routes defined in `app/routes.ts`
- **Server-side rendering**: React Router v7 handles SSR out of the box
- **Theme system**: Dark/light mode with system preference detection
- **Accessibility**: Comprehensive a11y features including skip links and ARIA labels
- **Component architecture**: Reusable UI components with TypeScript
- **Tailwind CSS**: For styling with Inter font and custom theme variables

### Shared Package
- **Type definitions**: Shared interfaces for API contracts (Snippet, CreateSnippetRequest, etc.)
- **Utilities**: Common functions like `sanitizeJsonString` for data processing
- **Workspace reference**: Used via `workspace:*` in package.json dependencies
- **Build requirement**: Must be built before backend/frontend can use it

## AI Integration

The backend integrates with AI services for text summarization:
- **Primary**: Google Gemini (gemini-1.5-flash model)
- **Fallback**: OpenAI (gpt-4o-mini model)
- **Configuration**: Set `GOOGLE_GENERATIVE_AI_API_KEY` or `OPENAI_API_KEY` environment variables
- **Error handling**: Graceful degradation with detailed error messages

## Database Configuration

- **MongoDB**: Primary database for snippet storage
- **Development**: Uses `MONGODB_URI_DEV` environment variable
- **Production**: Uses `MONGODB_URI_PROD` environment variable
- **Connection**: Singleton pattern with proper connection management
- **Docker**: Includes MongoDB service in docker-compose.yml

## Docker Setup

Comprehensive Docker configuration in the `docker/` directory:
- **Services**: MongoDB, Backend, Frontend
- **Multi-stage builds**: Optimized for production with separate build stages
- **Environment**: Production-ready with proper service dependencies
- **Ports**: Backend :3000, Frontend :3030, MongoDB :27017
- **Commands**: Use `pnpm docker:up` to start all services

## Important Notes

- **Backend** uses **ES modules** - import statements MUST use `.js` extensions for Node.js ESM compatibility
- **Frontend** uses **ES modules** - import statements should NOT use `.js` extensions (bundler handles resolution)
- **Build order matters**: Shared package must be built before backend/frontend
- **pnpm workspace**: Dependencies between packages use `workspace:*` syntax
- **TypeScript**: Strict mode enabled across all packages with comprehensive type checking
- **Testing**: Both backend and frontend have comprehensive test coverage
- **Environment variables**: Properly configured for development and production environments
- **Accessibility**: Frontend includes comprehensive accessibility features and testing

## Port Configuration
- **Backend development**: 3000
- **Frontend development**: 3030
- **MongoDB development**: 27017
- **Docker backend**: 3000
- **Docker frontend**: 3030
- **Docker MongoDB**: 27017

## Environment Variables

### Backend Required
- `MONGODB_URI_DEV` - Development MongoDB connection string
- `MONGODB_URI_PROD` - Production MongoDB connection string
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google AI API key (optional, primary AI provider)
- `OPENAI_API_KEY` - OpenAI API key (optional, fallback AI provider)

### Frontend Optional
- `VITE_API_BASE_URL` - Custom API base URL for client-side requests