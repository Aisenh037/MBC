# MBC Department Management System - Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the modernized MBC Department Management System in production environments. The system is containerized using Docker and includes automated CI/CD pipelines for seamless deployment.

## Architecture

The system consists of the following components:
- **Frontend**: React TypeScript application served by Nginx
- **Backend**: Node.js TypeScript API server
- **Database**: PostgreSQL with Supabase integration
- **Cache**: Redis for session management and caching
- **File Storage**: Cloudinary for file uploads and management
- **AI Service**: Python-based ML service for intelligent recommendations

## Prerequisites

### System Requirements
- **CPU**: Minimum 2 cores, Recommended 4+ cores
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 20GB, Recommended 50GB+
- **OS**: Linux (Ubuntu 20.04+ recommended), Windows Server, or macOS

### Software Dependencies
- Docker Engine 20.10+
- Docker Compose 2.0+
- Git
- Node.js 18+ (for development)
- Python 3.9+ (for AI service)

## Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mbc-department-management
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Configure the following environment variables:

```env
# Database Configuration
POSTGRES_DB=mbc_production
POSTGRES_USER=mbc_user
POSTGRES_PASSWORD=your_secure_password
DATABASE_URL=postgresql://mbc_user:your_secure_password@postgres:5432/mbc_production

# Redis Configuration
REDIS_URL=redis://:your_redis_password@redis:6379
REDIS_PASSWORD=your_redis_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_minimum_32_characters

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=MBC Department Management

# Application Configuration
NODE_ENV=production
FRONTEND_URL=https://mbc.yourdomain.com
BACKEND_URL=https://api.mbc.yourdomain.com
```

### 3. SSL Certificate Setup

For production deployment, set up SSL certificates:

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Option 1: Use Let's Encrypt (recommended)
sudo apt install certbot
sudo certbot certonly --standalone -d mbc.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/mbc.yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/mbc.yourdomain.com/privkey.pem nginx/ssl/key.pem

# Option 2: Use self-signed certificates (development only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=mbc.yourdomain.com"
```

## Deployment Methods

### Method 1: Docker Compose (Recommended)

#### Production Deployment

1. **Build and start services:**

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

2. **Initialize the database:**

```bash
# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

# Seed initial data (optional)
docker-compose -f docker-compose.prod.yml exec backend npm run seed
```

3. **Verify deployment:**

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Test health endpoints
curl https://mbc.yourdomain.com/health
curl https://api.mbc.yourdomain.com/api/v1/health
```

#### Development Deployment

```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f
```

### Method 2: Manual Deployment

#### Backend Deployment

1. **Install dependencies:**

```bash
cd mbc-backend
npm ci --production
```

2. **Build the application:**

```bash
npm run build
```

3. **Set up database:**

```bash
npx prisma generate
npx prisma migrate deploy
```

4. **Start the server:**

```bash
npm start
```

#### Frontend Deployment

1. **Install dependencies:**

```bash
cd mbc-frontend
npm ci --production
```

2. **Build the application:**

```bash
npm run build
```

3. **Serve with Nginx:**

```bash
# Copy build files to web server
sudo cp -r dist/* /var/www/html/

# Configure Nginx (see nginx/nginx.prod.conf)
sudo systemctl restart nginx
```

### Method 3: CI/CD Pipeline

The project includes GitHub Actions workflows for automated deployment:

1. **Set up GitHub Secrets:**

```
DOCKER_USERNAME
DOCKER_PASSWORD
PRODUCTION_HOST
PRODUCTION_USER
PRODUCTION_SSH_KEY
DATABASE_URL
REDIS_URL
JWT_SECRET
SUPABASE_URL
SUPABASE_SERVICE_KEY
```

2. **Deploy via Git:**

```bash
# Deploy to staging
git push origin main

# Deploy to production
git push origin production
```

## Database Setup

### 1. PostgreSQL Configuration

```sql
-- Create database and user
CREATE DATABASE mbc_production;
CREATE USER mbc_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE mbc_production TO mbc_user;

-- Enable required extensions
\c mbc_production;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### 2. Supabase Setup

1. Create a new Supabase project
2. Configure Row Level Security (RLS) policies
3. Set up authentication providers
4. Configure storage buckets for file uploads

### 3. Data Migration

If migrating from an existing system:

```bash
# Run migration script
docker-compose exec backend npm run migrate:data

# Verify migration
docker-compose exec backend npm run migrate:verify
```

## Monitoring and Logging

### 1. Health Checks

The system provides multiple health check endpoints:

- `/api/v1/health` - Basic health status
- `/api/v1/health/detailed` - Detailed system information
- `/api/v1/health/ready` - Readiness probe
- `/api/v1/health/live` - Liveness probe

### 2. Logging Configuration

Logs are stored in the `logs/` directory:

```bash
# View application logs
tail -f logs/app.log

# View error logs
tail -f logs/error.log

# View access logs
tail -f logs/nginx/access.log
```

### 3. Monitoring Setup

Configure monitoring tools:

```bash
# Prometheus metrics endpoint
curl http://localhost:5000/metrics

# Grafana dashboard
# Import dashboard from monitoring/grafana-dashboard.json
```

## Security Configuration

### 1. Firewall Setup

```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. Security Headers

The Nginx configuration includes security headers:
- HSTS (HTTP Strict Transport Security)
- CSP (Content Security Policy)
- X-Frame-Options
- X-Content-Type-Options

### 3. Rate Limiting

API rate limiting is configured:
- 10 requests per second for general API endpoints
- 1 request per second for authentication endpoints

## Backup and Recovery

### 1. Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U mbc_user mbc_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose exec -T postgres psql -U mbc_user mbc_production < backup_file.sql
```

### 2. File Storage Backup

```bash
# Backup uploaded files (if using local storage)
tar -czf files_backup_$(date +%Y%m%d_%H%M%S).tar.gz public/uploads/

# Cloudinary files are automatically backed up in the cloud
```

### 3. Configuration Backup

```bash
# Backup configuration files
tar -czf config_backup_$(date +%Y%m%d_%H%M%S).tar.gz .env docker-compose.prod.yml nginx/
```

## Scaling and Performance

### 1. Horizontal Scaling

Scale backend services:

```bash
# Scale backend instances
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Update Nginx load balancer configuration
# Edit nginx/nginx.prod.conf upstream section
```

### 2. Database Optimization

```sql
-- Add indexes for better performance
CREATE INDEX CONCURRENTLY idx_students_user_id ON students(user_id);
CREATE INDEX CONCURRENTLY idx_courses_branch_id ON courses(branch_id);
CREATE INDEX CONCURRENTLY idx_assignments_course_id ON assignments(course_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM students WHERE user_id = 'uuid';
```

### 3. Redis Optimization

```bash
# Configure Redis for production
echo "maxmemory 2gb" >> redis.conf
echo "maxmemory-policy allkeys-lru" >> redis.conf
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues:**
```bash
# Check database status
docker-compose exec postgres pg_isready

# Check connection from backend
docker-compose exec backend npm run db:test
```

2. **Redis Connection Issues:**
```bash
# Check Redis status
docker-compose exec redis redis-cli ping

# Check Redis logs
docker-compose logs redis
```

3. **SSL Certificate Issues:**
```bash
# Verify certificate
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Test SSL connection
openssl s_client -connect mbc.yourdomain.com:443
```

4. **Performance Issues:**
```bash
# Check resource usage
docker stats

# Check application metrics
curl http://localhost:5000/api/v1/health/detailed
```

### Log Analysis

```bash
# Search for errors
grep -i error logs/app.log

# Monitor real-time logs
docker-compose logs -f --tail=100

# Check specific service logs
docker-compose logs backend
```

## Maintenance

### 1. Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Update Docker images
docker-compose pull
docker-compose up -d
```

### 2. Database Maintenance

```bash
# Vacuum database
docker-compose exec postgres psql -U mbc_user -d mbc_production -c "VACUUM ANALYZE;"

# Check database size
docker-compose exec postgres psql -U mbc_user -d mbc_production -c "SELECT pg_size_pretty(pg_database_size('mbc_production'));"
```

### 3. Log Rotation

```bash
# Configure logrotate
sudo nano /etc/logrotate.d/mbc

# Add configuration:
/path/to/mbc/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 www-data www-data
}
```

## Support and Documentation

### API Documentation
- Swagger UI: `https://api.mbc.yourdomain.com/api-docs`
- OpenAPI Spec: `https://api.mbc.yourdomain.com/api-docs.json`

### Additional Resources
- [System Requirements](./requirements.md)
- [Development Guide](./DEVELOPMENT.md)
- [API Reference](./API.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

### Getting Help
- Create an issue in the GitHub repository
- Check the troubleshooting section
- Review application logs for error details

---

**Note**: This deployment guide assumes a production environment. For development or testing, use the standard `docker-compose.yml` file and adjust configurations accordingly.