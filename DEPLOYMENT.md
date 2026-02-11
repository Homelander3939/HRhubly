# Deployment Guide

This guide covers various deployment options for HRhubly.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment Options](#deployment-options)
- [Docker Deployment](#docker-deployment)
- [Cloud Platforms](#cloud-platforms)
- [Database Migrations](#database-migrations)
- [Post-Deployment](#post-deployment)

## Prerequisites

Before deploying, ensure you have:

- [ ] Production environment variables configured
- [ ] Database set up and accessible
- [ ] Redis instance available
- [ ] MinIO or S3-compatible storage configured
- [ ] Email service configured (Resend recommended)
- [ ] Domain name and DNS configured (if applicable)
- [ ] SSL certificates (if not using a platform that provides them)

## Environment Setup

### 1. Production Environment Variables

Create a `.env.production` file or configure environment variables in your hosting platform:

```env
# Application
NODE_ENV=production
BASE_URL=https://yourdomain.com
APP_NAME=HRhubly

# Security - MUST BE STRONG IN PRODUCTION
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars-production
ADMIN_PASSWORD=your-strong-admin-password

# Database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Redis
REDIS_URL=redis://user:password@host:6379

# Storage (MinIO/S3)
MINIO_ENDPOINT=your-minio-endpoint.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET=hrhubly-production

# Email (Resend)
RESEND_API_KEY=re_your-production-api-key
EMAIL_FROM=noreply@yourdomain.com

# AI Services (Optional)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
OPENROUTER_API_KEY=sk-or-your-openrouter-key

# Database Safety
ALLOW_DATABASE_RESET=false
```

### 2. Build the Application

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Generate Prisma Client
pnpm prisma generate

# Build for production
NODE_ENV=production pnpm build
```

## Deployment Options

### Option 1: Docker Deployment (Recommended)

Best for: Any infrastructure that supports Docker (VPS, AWS, GCP, Azure, etc.)

#### Step 1: Prepare Docker Compose

```bash
# Navigate to docker directory
cd docker

# Copy and configure environment
cp ../.env.example ../.env
# Edit .env with production values
```

#### Step 2: Deploy with Docker Compose

```bash
# Pull latest images
docker-compose pull

# Build and start services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f app
```

#### Step 3: Run Database Migrations

```bash
# Run migrations in the app container
docker-compose exec app pnpm db:migrate
```

### Option 2: VPS Deployment (Ubuntu/Debian)

Best for: DigitalOcean, Linode, Vultr, custom VPS

#### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install and start Docker (for MinIO)
curl -fsSL https://get.docker.com | sh
sudo systemctl start docker
sudo systemctl enable docker
```

#### Step 2: Database Setup

```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE hrhubly;
CREATE USER hrhubly_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE hrhubly TO hrhubly_user;
\q
```

#### Step 3: Application Setup

```bash
# Clone repository
git clone https://github.com/Homelander3939/HRhubly.git
cd HRhubly

# Install dependencies
pnpm install --frozen-lockfile

# Configure environment
cp .env.example .env
nano .env  # Edit with production values

# Generate Prisma Client
pnpm prisma generate

# Run migrations
pnpm db:migrate

# Build application
NODE_ENV=production pnpm build
```

#### Step 4: Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start pnpm --name "hrhubly" -- start

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
```

#### Step 5: Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/hrhubly
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/hrhubly /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Set up SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Option 3: Cloud Platform Deployment

#### Vercel (Recommended for Quick Deploy)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

3. Configure environment variables in Vercel dashboard

**Note:** Vercel has limitations with server-side features. You'll need external services for:
- PostgreSQL (Vercel Postgres, Supabase, or Neon)
- Redis (Upstash recommended)
- MinIO (Use S3 instead)

#### Railway

1. Connect your GitHub repository to Railway
2. Add PostgreSQL, Redis plugins
3. Configure environment variables
4. Railway will automatically deploy

#### Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create hrhubly-production

# Add addons
heroku addons:create heroku-postgresql:mini
heroku addons:create heroku-redis:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set BASE_URL=https://your-app.herokuapp.com
# ... set other env vars

# Deploy
git push heroku main

# Run migrations
heroku run pnpm db:migrate
```

#### AWS (EC2 + RDS)

1. Launch EC2 instance (Ubuntu 22.04)
2. Set up RDS PostgreSQL database
3. Set up ElastiCache Redis
4. Configure S3 bucket for storage
5. Follow VPS deployment steps above
6. Use AWS Application Load Balancer for SSL

## Database Migrations

### Running Migrations in Production

```bash
# Generate migration from schema changes
pnpm db:generate

# Apply migrations
pnpm db:migrate
```

### Rollback (if needed)

```bash
# Prisma doesn't have built-in rollback
# You need to create a new migration that reverts changes
# Or restore from database backup
```

### Database Backup

```bash
# Backup PostgreSQL database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql $DATABASE_URL < backup_file.sql
```

## Post-Deployment

### 1. Health Check

```bash
# Check if app is running
curl https://yourdomain.com

# Check database connection
docker-compose exec app pnpm prisma db execute --stdin <<< "SELECT 1"
```

### 2. Monitoring

Set up monitoring for:
- Application uptime
- Database performance
- API response times
- Error rates
- Disk space
- Memory usage

Tools:
- **UptimeRobot** - Free uptime monitoring
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **DataDog/New Relic** - Full observability

### 3. Backups

Set up automated backups:

```bash
# Daily database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL | gzip > /backups/db_$DATE.sql.gz

# Keep only last 7 days
find /backups -name "db_*.sql.gz" -mtime +7 -delete
```

Add to crontab:
```bash
0 2 * * * /path/to/backup-script.sh
```

### 4. SSL/HTTPS

Always use HTTPS in production:

```bash
# With Certbot (Let's Encrypt)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### 5. Security Checklist

- [ ] Environment variables secured (not in code)
- [ ] Strong JWT secret (32+ characters)
- [ ] Database SSL enabled
- [ ] HTTPS/SSL configured
- [ ] Firewall configured (only necessary ports open)
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] Security headers set
- [ ] Dependencies updated
- [ ] Secrets rotated regularly

### 6. Performance Optimization

```bash
# Enable Node.js production optimizations
NODE_ENV=production

# Use PM2 cluster mode
pm2 start ecosystem.config.js

# Enable gzip compression (in Nginx)
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript;
```

## Scaling

### Horizontal Scaling

1. **Load Balancer**: Use Nginx or cloud load balancer
2. **Multiple App Instances**: Run multiple containers/servers
3. **Database**: Use read replicas for read-heavy workloads
4. **Redis**: Use Redis Cluster for high availability
5. **CDN**: Use Cloudflare or similar for static assets

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Implement caching strategies
- Use database connection pooling

## Troubleshooting

### App Won't Start

```bash
# Check logs
docker-compose logs app
# or
pm2 logs hrhubly

# Check environment variables
env | grep -E "(DATABASE|REDIS|NODE)"

# Check disk space
df -h
```

### Database Connection Issues

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Check if database is running
docker-compose ps postgres
# or
sudo systemctl status postgresql
```

### High Memory Usage

```bash
# Restart app
pm2 restart hrhubly
# or
docker-compose restart app

# Check memory usage
free -h
docker stats
```

## Rollback Procedure

If deployment fails:

```bash
# With Docker
docker-compose down
git checkout previous-working-commit
docker-compose up -d --build

# With PM2
pm2 stop hrhubly
git checkout previous-working-commit
pnpm install
pnpm build
pm2 restart hrhubly
```

## Support

For deployment issues:
- Check logs first
- Review environment variables
- Consult the documentation
- Open an issue on GitHub

## Updates

### Updating the Application

```bash
# With Docker
cd HRhubly
git pull origin main
cd docker
docker-compose up -d --build

# Without Docker
cd HRhubly
git pull origin main
pnpm install
pnpm db:migrate
pnpm build
pm2 restart hrhubly
```

---

**Remember:** Always test deployments in a staging environment before production!
