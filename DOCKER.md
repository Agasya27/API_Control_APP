# Docker Setup Guide

This guide will help you run the API Insight Studio using Docker.

## Prerequisites

- Docker installed on your system ([Download Docker](https://www.docker.com/get-started))
- Docker Compose (usually comes with Docker Desktop)

## Quick Start

### 1. Set up environment variables (Optional)

If you want to use the AI insights feature, you'll need an OpenRouter API key:

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your OPENROUTER_API_KEY
# nano .env  # or use your preferred editor
```

### 2. Build and run the application

```bash
# Build and start all services
docker-compose up -d

# View logs (optional)
docker-compose logs -f
```

### 3. Access the application

Once the containers are running:

- **Frontend:** Open your browser and go to [http://localhost](http://localhost)
- **Backend API:** Available at [http://localhost:3001](http://localhost:3001)

## Docker Commands

### Start the application
```bash
docker-compose up -d
```

### Stop the application
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Remove containers and volumes
```bash
docker-compose down -v
```

## Troubleshooting

### Port already in use

If port 80 or 3001 are already in use, you can modify the ports in `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Use port 8080 instead of 80
  
  backend:
    ports:
      - "3002:3001"  # Use port 3002 instead of 3001
```

Don't forget to update the `CORS_ORIGIN` in the backend service to match the new frontend port.

### Container fails to start

Check the logs:
```bash
docker-compose logs backend
docker-compose logs frontend
```

### Rebuild from scratch

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Architecture

The Docker setup consists of two services:

1. **Backend**: Node.js Express server running on port 3001
2. **Frontend**: React application served by Nginx on port 80

Both services communicate through a Docker network called `app-network`.

## Production Deployment

For production deployment, consider:

1. Using a reverse proxy (nginx, Caddy) for SSL/TLS
2. Setting proper environment variables
3. Using Docker secrets for sensitive data
4. Implementing proper logging and monitoring
5. Setting resource limits in docker-compose.yml

Example resource limits:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

## Development Mode

To run in development mode with hot-reload, use the standard development commands instead of Docker:

```bash
# Backend
cd server
npm install
npm run dev

# Frontend (in another terminal)
npm install
npm run dev
```
