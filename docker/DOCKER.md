# Docker Setup

This project includes Docker configuration to run the complete stack: MongoDB database, backend API, and frontend UI in containers with proper service dependencies and health checks.

**Note:** All Docker-related files are located in the `docker/` folder. Docker commands can be run from the project root using the provided pnpm scripts.

## Prerequisites

- Docker
- Docker Compose

## Quick Start

1. Build and start all services:

   ```bash
   cd docker
   docker compose up --build
   ```

2. Access the applications:
   - Backend API: http://localhost:3000
   - Frontend UI: http://localhost:3030

## Services

### MongoDB (Port 27017)

- MongoDB 7.0 database server
- Stores user accounts and code snippets
- Includes initialization scripts and health checks
- Persistent data storage with Docker volumes

### Backend (Port 3000)

- Express.js API server with TypeScript
- Authentication system with JWT tokens
- Role-based access control (user/moderator/admin)
- AI-powered text summarization
- RESTful API endpoints for auth, snippets, user management, and reporting
- Health checks and automatic restart policies

### Frontend (Port 3030)

- React Router v7 application with SSR
- Authentication flows and protected routes
- Admin interfaces for user management and analytics
- Built with Vite and styled with Tailwind CSS
- Health checks and automatic restart policies

## Development

For development, you can still use the local setup:

```bash
pnpm install
pnpm dev
```

## Production Features

The Docker setup is optimized for production with:

- **Multi-stage builds** for smaller, secure images
- **Production-only dependencies** to minimize attack surface
- **Health checks** for all services with automatic restart policies
- **Service dependencies** ensuring proper startup order
- **Persistent volumes** for MongoDB data retention
- **Environment-based configuration** for secure secret management
- **Container networking** with internal service communication
- **Resource optimization** with appropriate Node.js production settings

## Environment Configuration

The Docker setup requires the following environment variables:

### Required
- `JWT_SECRET`: Secret key for JWT token signing (critical for security)
- `MONGODB_URI_PROD`: MongoDB connection string (defaults to `mongodb://mongodb:27017/hn-challenge-prod`)

### Optional (for AI features)
- `GOOGLE_GENERATIVE_AI_API_KEY`: Google Gemini API key
- `OPENAI_API_KEY`: OpenAI API key

### Example `.env` file:
```env
# Authentication (required)
JWT_SECRET=your-super-secure-jwt-secret-for-production

# Database (optional - has default)
MONGODB_URI_PROD=mongodb://mongodb:27017/hn-challenge-prod

# AI Integration (optional - provide at least one for summarization)
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key_here
OPENAI_API_KEY=your_openai_key_here
```

## Commands

### From Project Root (Recommended)
- Start all services: `pnpm docker:up`
- Start in background: `pnpm docker:up -d`
- Stop services: `pnpm docker:down`
- View logs: `pnpm docker:logs`
- Restart services: `pnpm docker:restart`

### Direct Docker Commands
- Start services: `cd docker && docker compose up`
- Start in background: `cd docker && docker compose up -d`
- Stop services: `cd docker && docker compose down`
- View logs: `cd docker && docker compose logs -f`
- Rebuild: `cd docker && docker compose up --build`

## Service Dependencies

The services start in the following order with health check dependencies:
1. **MongoDB** - Database must be healthy before backend starts
2. **Backend** - API server must be healthy before frontend starts  
3. **Frontend** - Web application starts last

This ensures proper initialization and prevents connection errors during startup.
