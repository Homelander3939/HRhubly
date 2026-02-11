# Development Environment Setup Guide

This guide will help you set up your development environment for HRhubly and understand how to work with the codebase.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Environment Options](#development-environment-options)
- [Working with the Database](#working-with-the-database)
- [Environment Variables](#environment-variables)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)
- [Preview Environment](#preview-environment)

## Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Node.js**: Version 20.x or higher
  ```bash
  node --version  # Should be v20.x or higher
  ```
- **pnpm**: Package manager (recommended)
  ```bash
  npm install -g pnpm
  ```

### Optional (for Docker setup)
- **Docker Desktop**: Version 20.x or higher
- **Docker Compose**: Usually included with Docker Desktop

## Quick Start

Get up and running in 5 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/Homelander3939/HRhubly.git
cd HRhubly

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Start development server (choose one option below)
```

### Option A: Docker (Recommended - Full Stack)
```bash
cd docker
docker-compose up -d
```
Access the app at: http://localhost:8000

### Option B: Local Development
```bash
# Make sure PostgreSQL, Redis, and MinIO are running
pnpm db:push
pnpm dev
```
Access the app at: http://localhost:3000

## Development Environment Options

### 1. Docker Environment (Recommended)

**Advantages:**
- Complete environment with all services
- Consistent across all machines
- Easy setup and teardown
- Includes database admin tools

**Setup:**
```bash
cd docker
docker-compose up -d
```

**Services:**
- **App**: http://localhost:8000
- **Adminer** (Database Admin): http://localhost:8000/adminer
- **MinIO Console**: http://localhost:9001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

**Commands:**
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Restart a service
docker-compose restart app

# Rebuild and restart
docker-compose up -d --build
```

### 2. Local Development

**Advantages:**
- Faster hot-reload
- Direct access to code
- Easier debugging

**Prerequisites:**
- PostgreSQL 16+
- Redis 7+
- MinIO (optional, for file uploads)

**Setup:**
```bash
# Install PostgreSQL (macOS)
brew install postgresql@16
brew services start postgresql@16

# Install Redis (macOS)
brew install redis
brew services start redis

# Install MinIO (optional)
brew install minio/stable/minio
minio server ~/minio-data

# Or use Docker for services only
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16
docker run -d -p 6379:6379 redis:7
```

**Run the app:**
```bash
pnpm db:push
pnpm dev
```

### 3. Hybrid Approach

Use Docker for services, local for app:

```bash
# Start only the services
docker-compose up postgres redis minio -d

# Run app locally
pnpm dev
```

## Working with the Database

### Database Schema

The database schema is defined in `schema.prisma`. After making changes:

```bash
# Generate Prisma Client
pnpm prisma generate

# Push changes to database (development)
pnpm db:push

# Create a migration (for production)
pnpm db:generate

# Run migrations
pnpm db:migrate
```

### Database Tools

**Prisma Studio** (Visual Database Editor):
```bash
pnpm db:studio
```

**Adminer** (if using Docker):
- URL: http://localhost:8000/adminer
- Auto-login configured

**psql** (Command Line):
```bash
psql postgresql://postgres:postgres@localhost:5432/app
```

### Database Scripts

The project includes helpful scripts:

```bash
# Reset a password
pnpm reset-gensweaty-password

# Diagnose login issues
pnpm diagnose-login

# Test email system
pnpm test-email

# Fix email routing
pnpm fix-email-routing
```

## Environment Variables

### Required Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Essential variables:**
```env
# App
BASE_URL=http://localhost:3000
NODE_ENV=development

# Security
JWT_SECRET=your-secret-key-min-32-chars

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app

# Admin
ADMIN_PASSWORD=your-admin-password
```

**Optional but recommended:**
```env
# AI Features
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# Storage
MINIO_ENDPOINT=localhost
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=your-secret
```

### Environment Variable Validation

The app validates environment variables on startup using Zod. Check `src/server/env.ts` for the schema.

## Common Tasks

### Starting Development

```bash
# Start development server
pnpm dev

# With type checking
pnpm typecheck --watch & pnpm dev
```

### Code Quality

```bash
# Lint code
pnpm lint

# Format code
pnpm format

# Type check
pnpm typecheck
```

### Building for Production

```bash
# Build
pnpm build

# Start production server
pnpm start
```

### Working with Git

```bash
# Create a feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to your fork
git push origin feature/my-feature
```

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 pnpm dev
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Prisma Client Issues

```bash
# Regenerate Prisma Client
pnpm prisma generate

# Reset database (development only!)
pnpm db:push --force-reset
```

### Docker Issues

```bash
# Reset everything
docker-compose down -v
docker-compose up -d --build

# Clean Docker system
docker system prune -a
```

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

## Preview Environment

### Local Preview

Test the production build locally:

```bash
# Build
pnpm build

# Start
pnpm start

# Access at http://localhost:3000
```

### GitHub Actions Preview

Every push triggers:
1. **Linting** - Code quality checks
2. **Type Checking** - TypeScript validation
3. **Build** - Production build test
4. **Docker Build** - Container build test

Check workflow status at:
https://github.com/Homelander3939/HRhubly/actions

### Continuous Development

This repository supports continuous development workflow:

1. **Make changes** in your local environment
2. **Test locally** using `pnpm dev`
3. **Commit and push** to your branch
4. **CI runs automatically** to validate changes
5. **Review in preview** before merging

## Development Tips

### Hot Reload

The development server supports hot module replacement (HMR). Changes to most files will reload automatically.

### Debugging

Use browser DevTools and React DevTools:
- **React DevTools**: Browser extension for inspecting React components
- **TanStack Router DevTools**: Included in dev mode (bottom of page)
- **Console Logging**: `console.log()` works in both client and server code

### VS Code Extensions (Recommended)

- ESLint
- Prettier
- Prisma
- TailwindCSS IntelliSense
- Error Lens

### Performance

Development mode is slower than production. For testing performance:
```bash
pnpm build
pnpm start
```

## Next Steps

1. ✅ Set up your development environment
2. ✅ Run the application locally
3. ✅ Explore the codebase structure
4. ✅ Make your first change
5. ✅ Read [CONTRIBUTING.md](./CONTRIBUTING.md)
6. ✅ Start building features!

## Getting Help

- 📖 Documentation: Check this guide and README.md
- 🐛 Issues: https://github.com/Homelander3939/HRhubly/issues
- 💬 Discussions: Open an issue for questions

Happy coding! 🚀
