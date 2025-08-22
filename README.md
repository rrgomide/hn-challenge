# House Numbers Challenge

A modern full-stack application for creating and managing code snippets with AI-powered text summarization. Built with TypeScript, React Router v7, Express.js, and MongoDB.

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
  - [Backend](#backend)
  - [Frontend](#frontend)
  - [Shared Package](#shared-package)
- [🚀 Quick Start](#-quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [🐳 Docker Development](#-docker-development)
- [📋 Available Scripts](#-available-scripts)
  - [Root Level Commands](#root-level-commands)
  - [Backend Commands](#backend-commands-from-appsbackend)
  - [Frontend Commands](#frontend-commands-from-appsfrontend)
- [🧪 Testing](#-testing)
- [🔑 Environment Configuration](#-environment-configuration)
  - [Required Environment Variables](#required-environment-variables)
- [🤖 AI Integration](#-ai-integration)
- [🎨 Theming and Accessibility](#-theming-and-accessibility)
- [🚀 Deployment](#-deployment)
  - [Production Build](#production-build)
  - [Docker Production](#docker-production)
- [📁 Project Structure](#-project-structure)
- [🛠️ Development Guidelines](#️-development-guidelines)
- [🔄 Post-challenge reflection](#-post-challenge-reflection)
  - [Future Improvements](#future-improvements)
  - [Trade-offs Made](#trade-offs-made)
- [🤝 Contributing](#-contributing)
- [📝 License](#-license)

## ✨ Features

- **Snippet Management**: Create, store, and retrieve code snippets with syntax highlighting
- **AI-Powered Summarization**: Automatic text summarization using Google Gemini or OpenAI
- **Modern Frontend**: React Router v7 with server-side rendering and dark/light theme
- **Full Accessibility**: Comprehensive a11y features with keyboard navigation
- **Type-Safe**: End-to-end TypeScript with shared type definitions
- **Docker Ready**: Complete containerization for easy deployment

## 🏗️ Architecture

This is a TypeScript monorepo using pnpm workspaces:

```
hn-challenge/
├── apps/
│   ├── backend/     # Express.js API server
│   └── frontend/    # React Router v7 application
├── packages/
│   └── shared/      # Shared types and utilities
└── docker/          # Docker configuration
```

### Backend

- **Express.js** with TypeScript and ES modules
- **MongoDB** for data persistence
- **AI Integration** with Google Gemini (primary) and OpenAI (fallback)
- **Vitest** for testing with comprehensive coverage

### Frontend

- **React Router v7** with file-based routing and SSR
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling with custom theme system
- **Comprehensive accessibility** features

### Shared Package

- Common TypeScript interfaces and utilities
- Shared between frontend and backend for type safety

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- MongoDB (or use Docker)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd hn-challenge
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   # Backend environment
   cp apps/backend/.env.example apps/backend/.env
   ```

   Configure your `.env` file with:

   ```env
   MONGODB_URI_DEV=mongodb://localhost:27017/hn-challenge
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key  # Optional
   OPENAI_API_KEY=your_openai_key                   # Optional
   ```

4. **Start development servers**
   ```bash
   pnpm dev
   ```

This will start:

- MongoDB service
- Backend API server on http://localhost:3000
- Frontend application on http://localhost:3030

## 🐳 Docker Development

For a complete containerized setup:

```bash
# Start all services with Docker
pnpm docker:up

# View logs
pnpm docker:logs

# Stop services
pnpm docker:down
```

## 📋 Available Scripts

### Root Level Commands

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all packages
- `pnpm start` - Start production servers
- `pnpm test:backend` - Run backend tests
- `pnpm test:frontend` - Run frontend tests
- `pnpm lint` - Lint all packages
- `pnpm typecheck` - Type check all packages

### Backend Commands (from `apps/backend/`)

- `pnpm dev` - Start backend development server
- `pnpm test` - Run tests in watch mode
- `pnpm test:run` - Run all tests once
- `pnpm build` - Build for production

### Frontend Commands (from `apps/frontend/`)

- `pnpm dev` - Start frontend development server
- `pnpm build` - Build for production
- `pnpm typegen` - Generate route type definitions

## 🧪 Testing

The project includes comprehensive test coverage:

- **Backend**: Integration tests for API endpoints and unit tests for services
- **Frontend**: Component tests with React Testing Library and accessibility testing

```bash
# Run all tests
pnpm test:backend
pnpm test:frontend

# Run tests in watch mode
cd apps/backend && pnpm test
cd apps/frontend && pnpm test
```

## 🔑 Environment Configuration

### Required Environment Variables

**Backend** (`apps/backend/.env`):

```env
MONGODB_URI_DEV=mongodb://localhost:27017/hn-challenge-dev
MONGODB_URI_PROD=mongodb://localhost:27017/hn-challenge
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here  # Optional but recommended
OPENAI_API_KEY=your_key_here                # Optional fallback
```

**Frontend** (optional):

```env
VITE_API_BASE_URL=http://localhost:3000  # Custom API base URL
```

## 🤖 AI Integration

The application supports dual AI providers for text summarization:

1. **Google Gemini** (Primary) - Set `GOOGLE_GENERATIVE_AI_API_KEY`
2. **OpenAI** (Fallback) - Set `OPENAI_API_KEY`

If no API keys are provided, the summarization feature will be disabled gracefully.

## 🎨 Theming and Accessibility

- **Theme System**: Automatic dark/light mode based on system preference
- **Accessibility**: WCAG compliant with keyboard navigation, ARIA labels, and skip links
- **Typography**: Inter font with optimized loading
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## 🚀 Deployment

### Production Build

```bash
pnpm build
pnpm start
```

### Docker Production

```bash
docker compose -f docker-compose.yml up --build
```

## 📁 Project Structure

```
hn-challenge/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── controllers/     # HTTP request handlers
│   │   │   ├── services/        # Business logic
│   │   │   ├── repositories/    # Data access layer
│   │   │   └── __tests__/       # Test files
│   │   └── package.json
│   ├── frontend/
│   │   ├── app/
│   │   │   ├── routes/          # File-based routing
│   │   │   ├── components/      # React components
│   │   │   └── __tests__/       # Test files
│   │   └── package.json
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── types/           # Shared TypeScript types
│       │   └── utils/           # Common utilities
│       └── package.json
├── docker/                      # Docker configuration
├── docker-compose.yml
└── package.json                 # Workspace configuration
```

## 🛠️ Development Guidelines

- **TypeScript**: Strict mode enabled across all packages
- **ES Modules**: Backend uses `.js` extensions in imports for Node.js ESM compatibility
- **Workspace Dependencies**: Use `workspace:*` for internal package references
- **Build Order**: Shared package must be built before backend/frontend
- **Testing**: Write tests for new features and maintain existing coverage

## 🔄 Post-challenge reflection

### Future Improvements

**Performance Optimization:**

- Implement caching layer (Redis) for frequently accessed snippets
- Add database indexing and query optimization
- Implement CDN for static assets and image optimization
- Add pagination for large snippet collections

**Enhanced Features:**

- User authentication and authorization
- Snippet versioning and revision history
- Real-time collaboration with WebSocket integration
- Advanced search with full-text indexing and filtering
- Schema validation (zod)

**Production Readiness:**

- Comprehensive logging and monitoring
- Rate limiting and DDoS protection
- Database migrations and backup strategies
- CI/CD pipeline with automated testing and deployment
- Load balancing and horizontal scaling configuration

**Developer Experience:**

- Advanced error boundaries and error reporting
- API documentation with OpenAPI/Swagger
- Component library with Storybook
- Performance monitoring and bundle analysis

### Trade-offs Made

**Architecture Decisions:**

- **MongoDB over relational DB**: Chosen for flexibility and rapid development, but lacks strong schema enforcement and ACID transactions across collections
- **Dual AI providers**: Increases complexity but provides fallback reliability when API services are unavailable
- **Monorepo structure**: Better code sharing but longer CI/CD pipelines and more complex dependency management

**Performance vs Development Speed:**

- **Server-side rendering**: Improves initial load times but might add complexity to state management
- **TypeScript strict mode**: Better type safety but more verbose code and longer compile times

**Security vs Convenience:**

- **Environment-based config**: Simple setup but requires manual secret management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests
4. Run linting and type checking: `pnpm lint && pnpm typecheck`
5. Run tests: `pnpm test:backend && pnpm test:frontend`
6. Commit your changes: `git commit -m 'Add some feature'`
7. Push to the branch: `git push origin feature/your-feature`
8. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

---

Built with ❤️ using TypeScript, React Router v7, Express.js, and MongoDB.
