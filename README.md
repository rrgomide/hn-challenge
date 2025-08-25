# House Numbers Challenge

A modern full-stack application for creating and managing code snippets with AI-powered text summarization. Built with TypeScript, React Router v7, Express.js, and MongoDB.

## TLDR;

- Setup your `.env` keys in `app/backend` based on `app/backend/.env.example`
- Ensure you have `pnpm v10.14.0` or greater
- Ensure you have `node.js v20.x` or greater
- Run `pnpm install`
- Run `pnpm dev` to develop
- Run `pnpm docker:up` to run all apps in Docker Containers

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
- **User Authentication**: Secure registration and login with JWT tokens and bcrypt password hashing
- **Role-Based Access Control**: Multi-tier user system (user/moderator/admin) with different permissions
- **User Management**: Admin interface for managing user roles and permissions
- **Analytics & Reporting**: Admin dashboard with user activity reports and snippet statistics
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
- **MongoDB** for data persistence with dual collections (snippets & users)
- **Authentication System** with JWT tokens, bcrypt password hashing, and middleware protection
- **Role-Based Access Control** supporting user, moderator, and admin roles
- **AI Integration** with Google Gemini (primary) and OpenAI (fallback)
- **Comprehensive API** with endpoints for auth, snippets, user management, and reporting
- **Vitest** for testing with comprehensive coverage including integration tests

### Frontend

- **React Router v7** with file-based routing and SSR
- **Authentication Context** with protected routes and session management
- **Multi-page Application** with auth, snippets, config, and reporting interfaces
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling with custom theme system
- **Comprehensive accessibility** features and form handling
- **Admin Interfaces** for user management and analytics dashboards

### Shared Package

- Common TypeScript interfaces and utilities
- **Authentication Types**: User, JWT payload, and auth request/response interfaces
- **API Contracts**: Shared types for snippets, users, and administrative operations
- Shared between frontend and backend for end-to-end type safety

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
   MONGODB_URI_DEV=mongodb://localhost:27017/hn-challenge-dev
   MONGODB_URI_PROD=mongodb://localhost:27017/hn-challenge-prod
   JWT_SECRET=your_jwt_secret_key_for_development

   # Provide at least one of those for AI summarization
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key
   OPENAI_API_KEY=your_openai_key
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
# Database Configuration
MONGODB_URI_DEV=mongodb://localhost:27017/hn-challenge-dev
MONGODB_URI_PROD=mongodb://localhost:27017/hn-challenge-prod

# Authentication (required for user registration/login)
JWT_SECRET=your-secure-jwt-secret-key-here

# AI Integration (provide at least one for summarization features)
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
```

**Frontend** (optional):

```env
VITE_API_BASE_URL=http://localhost:3030  # Custom API base URL
```

### API Key Setup Instructions

#### Google Generative AI (Gemini) API Key

1. **Visit Google AI Studio**

   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account

2. **Create API Key**

   - Click "Create API Key" button
   - Choose "Create API Key" from the dropdown
   - Your API key will be generated and displayed

3. **Copy and Store Securely**

   - Copy the generated API key
   - Add it to your `apps/backend/.env` file as `GOOGLE_GENERATIVE_AI_API_KEY=your_key_here`
   - **Important**: Never commit API keys to version control

4. **Usage Limits**
   - Free tier includes 15 requests per minute
   - Monitor usage in the [Google AI Studio dashboard](https://makersuite.google.com/app/apikey)

#### OpenAI API Key

1. **Visit OpenAI Platform**

   - Go to [OpenAI Platform](https://platform.openai.com/api-keys)
   - Sign in or create an account

2. **Create API Key**

   - Click "Create new secret key"
   - Give your key a descriptive name (e.g., "House Numbers Challenge")
   - Click "Create secret key"

3. **Copy and Store Securely**

   - Copy the generated API key immediately (it won't be shown again)
   - Add it to your `apps/backend/.env` file as `OPENAI_API_KEY=your_key_here`
   - **Important**: Never commit API keys to version control

4. **Usage Limits**
   - Free tier includes $5 credit for new accounts
   - Monitor usage in the [OpenAI Platform dashboard](https://platform.openai.com/usage)
   - Set up billing to avoid service interruptions

#### Security Best Practices

- **Environment Variables**: Always use environment variables, never hardcode API keys
- **Git Ignore**: Ensure `.env` files are in your `.gitignore`
- **Key Rotation**: Regularly rotate your API keys
- **Access Control**: Only share API keys with trusted team members
- **Monitoring**: Set up usage alerts to avoid unexpected charges

#### Troubleshooting

- **Invalid API Key**: Verify the key is copied correctly without extra spaces
- **Rate Limiting**: Check your API usage limits in the respective dashboards
- **Service Unavailable**: The app will gracefully fallback between Google and OpenAI if one service is down

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
│   │   │   ├── controllers/     # HTTP request handlers (auth, snippets, config, reports)
│   │   │   ├── services/        # Business logic (AI, snippets)
│   │   │   ├── repositories/    # Data access layer (MongoDB snippets & users)
│   │   │   ├── middleware/      # Auth middleware and error handling
│   │   │   ├── models/          # TypeScript models (User, Snippet)
│   │   │   ├── utils/           # Validation and error utilities
│   │   │   ├── config/          # Database and environment configuration
│   │   │   └── __tests__/       # Integration and unit test files
│   │   └── package.json
│   ├── frontend/
│   │   ├── app/
│   │   │   ├── routes/          # File-based routing (auth, config, report, snippets)
│   │   │   ├── components/      # React components and UI library
│   │   │   ├── contexts/        # Auth and theme context providers  
│   │   │   ├── services/        # API service layer
│   │   │   ├── server/          # Server-side utilities (session, snippets)
│   │   │   ├── lib/             # Client utilities (API, cookies, storage)
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   └── __tests__/       # Component and integration test files
│   │   └── package.json
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── types/           # Shared TypeScript types (User, Auth, Snippet, API)
│       │   └── utils/           # Common utilities (sanitization)
│       └── package.json
├── docker/                      # Docker configuration with health checks
│   ├── DOCKER.md               # Docker documentation
│   ├── Dockerfile              # Multi-stage build for backend & frontend
│   ├── docker-compose.yml      # Services: MongoDB, Backend, Frontend
│   └── mongo-init.js           # MongoDB initialization
├── scripts/                     # Build and utility scripts
└── package.json                 # Workspace configuration
```

## 🛠️ Development Guidelines

- **TypeScript**: Strict mode enabled across all packages
- **ES Modules**: Backend uses `.js` extensions in imports for Node.js ESM compatibility
- **Workspace Dependencies**: Use `workspace:*` for internal package references
- **Build Order**: Shared package must be built before backend/frontend
- **Testing**: Write tests for new features and maintain existing coverage

## 🔄 Post-challenge reflection

### Current Implementation Status

**✅ Completed Features:**

- **Authentication & Authorization**: JWT-based auth with role-based access control (user/moderator/admin)
- **User Management**: Complete CRUD operations for user accounts with role management
- **Admin Dashboard**: Analytics and reporting interface for administrators
- **Security**: Password hashing with bcrypt, protected routes, and middleware validation
- **Multi-page Application**: Auth flows, snippet management, configuration, and reporting pages

### Future Improvements

**Performance Optimization:**

- Implement caching layer (Redis) for frequently accessed snippets and user sessions
- Add database indexing and query optimization for user and snippet collections
- Implement CDN for static assets and image optimization
- Add pagination for large snippet and user collections

**Enhanced Features:**

- **Advanced RBAC**: More granular permissions and resource-based access control
- **Snippet versioning and revision history** with diff viewing
- **Real-time collaboration** with WebSocket integration for live editing
- **Advanced search** with full-text indexing, filtering, and user-scoped search
- **Schema validation** (zod) for robust API input validation
- **Audit logging** for administrative actions and security events

**Production Readiness:**

- Comprehensive logging and monitoring with structured logs
- Rate limiting and DDoS protection per user/IP
- Database migrations and backup strategies
- CI/CD pipeline with automated testing and deployment
- Load balancing and horizontal scaling configuration
- **Session management** improvements with refresh tokens

**Developer Experience:**

- Advanced error boundaries and error reporting
- API documentation with OpenAPI/Swagger
- Component library with Storybook
- Performance monitoring and bundle analysis

### Trade-offs Made

**Architecture Decisions:**

- **MongoDB over relational DB**: Chosen for flexibility and rapid development, but lacks strong schema enforcement and ACID transactions across collections. Authentication implementation works well with document-based user profiles.
- **JWT tokens**: Stateless authentication scales well but requires careful secret management and doesn't support easy token revocation
- **Role-based access control**: Simple three-tier system (user/moderator/admin) provides good security boundaries without over-complicating the authorization logic
- **Dual AI providers**: Increases complexity but provides fallback reliability when API services are unavailable
- **Monorepo structure**: Better code sharing (especially for auth types) but longer CI/CD pipelines and more complex dependency management

**Performance vs Development Speed:**

- **Server-side rendering**: Improves initial load times but adds complexity to auth state management across client/server boundaries
- **TypeScript strict mode**: Better type safety (critical for auth flows) but more verbose code and longer compile times
- **Bcrypt password hashing**: Secure but computationally expensive; could benefit from async queuing in high-load scenarios

**Security vs Convenience:**

- **Environment-based config**: Simple setup but requires manual secret management for JWT secrets and API keys
- **Role-based middleware**: Provides good protection but could be more granular for complex permission scenarios
- **Client-side auth state**: Convenient for UX but requires careful handling of token expiration and refresh flows

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
