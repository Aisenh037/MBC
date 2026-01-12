#!/bin/bash

# Production Deployment Script for MBC Department Management System
# This script handles the complete deployment process

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${PURPLE}${1}${NC}"
}

# Configuration
DEPLOYMENT_ENV=${1:-production}
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
COMPOSE_FILE="docker-compose.prod.yml"

log_header "🚀 MBC Production Deployment Script"
echo "Deployment Environment: $DEPLOYMENT_ENV"
echo "Timestamp: $(date)"
echo ""

# Check prerequisites
check_prerequisites() {
    log_header "📋 Checking Prerequisites"
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker is not running"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if required files exist
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Docker Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    # Check environment files
    if [ ! -f "mbc-backend/.env.production" ]; then
        log_warning "Production environment file not found: mbc-backend/.env.production"
        log_info "Creating from .env.example..."
        if [ -f "mbc-backend/.env.example" ]; then
            cp mbc-backend/.env.example mbc-backend/.env.production
        else
            log_error "No .env.example found to copy from"
            exit 1
        fi
    fi
    
    log_success "All prerequisites satisfied"
    echo ""
}

# Backup existing data
backup_data() {
    log_header "💾 Creating Backup"
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database if running
    if docker-compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
        log_info "Backing up PostgreSQL database..."
        docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U mbc_user mbc_db > "$BACKUP_DIR/database.sql"
        log_success "Database backup created"
    else
        log_warning "PostgreSQL not running, skipping database backup"
    fi
    
    # Backup uploaded files
    if [ -d "uploads" ]; then
        log_info "Backing up uploaded files..."
        cp -r uploads "$BACKUP_DIR/"
        log_success "Files backup created"
    fi
    
    # Backup configuration files
    log_info "Backing up configuration files..."
    cp -r mbc-backend/.env* "$BACKUP_DIR/" 2>/dev/null || true
    cp -r mbc-frontend/.env* "$BACKUP_DIR/" 2>/dev/null || true
    cp -r ai-service/.env* "$BACKUP_DIR/" 2>/dev/null || true
    
    log_success "Backup completed: $BACKUP_DIR"
    echo ""
}

# Build and deploy services
deploy_services() {
    log_header "🔨 Building and Deploying Services"
    
    # Pull latest images
    log_info "Pulling latest base images..."
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Build services
    log_info "Building application images..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    
    # Stop existing services
    log_info "Stopping existing services..."
    docker-compose -f "$COMPOSE_FILE" down
    
    # Start database services first
    log_info "Starting database services..."
    docker-compose -f "$COMPOSE_FILE" up -d postgres redis
    
    # Wait for databases to be ready
    log_info "Waiting for databases to be ready..."
    sleep 30
    
    # Run database migrations
    log_info "Running database migrations..."
    docker-compose -f "$COMPOSE_FILE" run --rm backend npm run db:migrate
    
    # Start all services
    log_info "Starting all services..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log_success "Services deployed successfully"
    echo ""
}

# Health checks
run_health_checks() {
    log_header "🏥 Running Health Checks"
    
    # Wait for services to start
    log_info "Waiting for services to start..."
    sleep 60
    
    # Check backend health
    log_info "Checking backend health..."
    for i in {1..10}; do
        if curl -f http://localhost:5000/api/v1/health &> /dev/null; then
            log_success "Backend is healthy"
            break
        else
            if [ $i -eq 10 ]; then
                log_error "Backend health check failed"
                return 1
            fi
            log_info "Waiting for backend... (attempt $i/10)"
            sleep 10
        fi
    done
    
    # Check frontend health
    log_info "Checking frontend health..."
    for i in {1..10}; do
        if curl -f http://localhost:80/health &> /dev/null; then
            log_success "Frontend is healthy"
            break
        else
            if [ $i -eq 10 ]; then
                log_error "Frontend health check failed"
                return 1
            fi
            log_info "Waiting for frontend... (attempt $i/10)"
            sleep 10
        fi
    done
    
    # Check AI service health
    log_info "Checking AI service health..."
    for i in {1..10}; do
        if curl -f http://localhost:5001/health &> /dev/null; then
            log_success "AI service is healthy"
            break
        else
            if [ $i -eq 10 ]; then
                log_warning "AI service health check failed (optional service)"
                break
            fi
            log_info "Waiting for AI service... (attempt $i/10)"
            sleep 10
        fi
    done
    
    log_success "Health checks completed"
    echo ""
}

# Security hardening
apply_security_hardening() {
    log_header "🔒 Applying Security Hardening"
    
    # Set proper file permissions
    log_info "Setting file permissions..."
    find . -name "*.env*" -exec chmod 600 {} \;
    find . -name "*.key" -exec chmod 600 {} \;
    find . -name "*.pem" -exec chmod 600 {} \;
    
    # Remove development files in production
    if [ "$DEPLOYMENT_ENV" = "production" ]; then
        log_info "Removing development files..."
        rm -f mbc-backend/.env.development
        rm -f mbc-frontend/.env.development
        rm -f ai-service/.env.development
    fi
    
    log_success "Security hardening applied"
    echo ""
}

# Performance optimization
optimize_performance() {
    log_header "⚡ Performance Optimization"
    
    # Clean up unused Docker resources
    log_info "Cleaning up unused Docker resources..."
    docker system prune -f
    
    # Optimize Docker images
    log_info "Optimizing Docker images..."
    docker image prune -f
    
    log_success "Performance optimization completed"
    echo ""
}

# Monitoring setup
setup_monitoring() {
    log_header "📊 Setting up Monitoring"
    
    # Start monitoring services if profile is enabled
    if [ "$DEPLOYMENT_ENV" = "production" ]; then
        log_info "Starting monitoring services..."
        docker-compose -f "$COMPOSE_FILE" --profile monitoring up -d prometheus grafana
        log_success "Monitoring services started"
        log_info "Grafana available at: http://localhost:3000"
        log_info "Prometheus available at: http://localhost:9090"
    else
        log_info "Monitoring services skipped for non-production environment"
    fi
    
    echo ""
}

# Display deployment summary
show_deployment_summary() {
    log_header "📋 Deployment Summary"
    
    echo "Deployment completed successfully!"
    echo ""
    echo "🌐 Application URLs:"
    echo "   Frontend:     http://localhost:80"
    echo "   Backend API:  http://localhost:5000"
    echo "   AI Service:   http://localhost:5001"
    echo "   API Docs:     http://localhost:5000/api-docs"
    echo ""
    echo "📊 Monitoring (if enabled):"
    echo "   Grafana:      http://localhost:3000"
    echo "   Prometheus:   http://localhost:9090"
    echo ""
    echo "🔧 Management Commands:"
    echo "   View logs:    docker-compose -f $COMPOSE_FILE logs -f [service]"
    echo "   Stop all:     docker-compose -f $COMPOSE_FILE down"
    echo "   Restart:      docker-compose -f $COMPOSE_FILE restart [service]"
    echo "   Scale:        docker-compose -f $COMPOSE_FILE up -d --scale [service]=[count]"
    echo ""
    echo "💾 Backup Location: $BACKUP_DIR"
    echo ""
    log_success "Deployment completed at $(date)"
}

# Rollback function
rollback_deployment() {
    log_header "🔄 Rolling Back Deployment"
    
    log_info "Stopping current services..."
    docker-compose -f "$COMPOSE_FILE" down
    
    if [ -d "$BACKUP_DIR" ]; then
        log_info "Restoring from backup: $BACKUP_DIR"
        
        # Restore database
        if [ -f "$BACKUP_DIR/database.sql" ]; then
            log_info "Restoring database..."
            docker-compose -f "$COMPOSE_FILE" up -d postgres
            sleep 30
            docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U mbc_user -d mbc_db < "$BACKUP_DIR/database.sql"
        fi
        
        # Restore files
        if [ -d "$BACKUP_DIR/uploads" ]; then
            log_info "Restoring uploaded files..."
            rm -rf uploads
            cp -r "$BACKUP_DIR/uploads" ./
        fi
        
        log_success "Rollback completed"
    else
        log_error "No backup found for rollback"
        exit 1
    fi
}

# Error handling
handle_error() {
    log_error "Deployment failed at step: $1"
    log_info "Check logs with: docker-compose -f $COMPOSE_FILE logs"
    
    read -p "Do you want to rollback? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rollback_deployment
    fi
    
    exit 1
}

# Trap errors
trap 'handle_error "Unknown step"' ERR

# Main deployment process
main() {
    log_header "Starting deployment process..."
    
    check_prerequisites || handle_error "Prerequisites check"
    backup_data || handle_error "Backup creation"
    deploy_services || handle_error "Service deployment"
    run_health_checks || handle_error "Health checks"
    apply_security_hardening || handle_error "Security hardening"
    optimize_performance || handle_error "Performance optimization"
    setup_monitoring || handle_error "Monitoring setup"
    show_deployment_summary
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback_deployment
        ;;
    "health")
        run_health_checks
        ;;
    "backup")
        backup_data
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health|backup}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Full deployment process (default)"
        echo "  rollback - Rollback to previous backup"
        echo "  health   - Run health checks only"
        echo "  backup   - Create backup only"
        exit 1
        ;;
esac