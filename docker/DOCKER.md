# Docker Setup

This project includes Docker configuration to run both the backend API and frontend UI in containers.

**Note:** All Docker-related files are located in the `docker/` folder. Make sure to run Docker commands from within this directory.

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

### Backend (Port 3000)

- Express.js API server
- Built with TypeScript
- Serves the main API endpoints

### Frontend (Port 3030)

- React Router application
- Built with Vite
- Serves the user interface

## Development

For development, you can still use the local setup:

```bash
pnpm install
pnpm dev
```

## Production

The Docker setup is optimized for production with:

- Multi-stage builds for smaller images
- Production-only dependencies
- Proper port mapping
- Health checks and restart policies

## Commands

- Start services: `cd docker && docker compose up`
- Start in background: `cd docker && docker compose up -d`
- Stop services: `cd docker && docker compose down`
- View logs: `cd docker && docker compose logs -f`
- Rebuild: `cd docker && docker compose up --build`
