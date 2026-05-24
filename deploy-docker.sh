#!/bin/bash

# 🐳 DOCKER DEPLOYMENT SCRIPT FOR Z-APP (Linux/Mac)
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Z-App Docker Deployment${NC}"
echo ""

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    echo "Please install Docker from https://docker.com/get-started"
    exit 1
fi
print_success "Docker is installed"

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available"
    echo "Please update Docker to the latest version"
    exit 1
fi
print_success "Docker Compose is available"

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running"
    echo "Please start Docker and try again"
    exit 1
fi
print_success "Docker daemon is running"

echo ""
print_status "Setting up environment..."

# Check if environment file exists
if [ ! -f ".env.docker" ]; then
    if [ -f ".env.docker.example" ]; then
        print_status "Creating .env.docker from example..."
        cp .env.docker.example .env.docker
        echo ""
        print_warning "IMPORTANT: Please edit .env.docker with your configuration"
        echo "    - Database passwords"
        echo "    - JWT secrets"
        echo "    - Domain names"
        echo "    - Email settings"
        echo ""
        echo "Press Enter after editing .env.docker..."
        read -r
    else
        print_error ".env.docker.example not found"
        echo "Please ensure you're in the correct directory"
        exit 1
    fi
else
    print_success "Environment file exists"
fi

echo ""
print_status "Building and starting containers..."

# Stop any existing containers
print_status "Stopping existing containers..."
docker compose -f docker-compose.production.yml down

# Build and start containers
print_status "Starting Z-App containers..."
if docker compose -f docker-compose.production.yml up -d --build; then
    print_success "Containers started successfully"
else
    print_error "Failed to start containers"
    echo ""
    print_status "Checking logs..."
    docker compose -f docker-compose.production.yml logs
    exit 1
fi

echo ""
print_status "Waiting for services to start..."
sleep 30

echo ""
print_status "Checking container status..."
docker compose -f docker-compose.production.yml ps

echo ""
print_status "Running health checks..."

# Check backend health
print_status "Checking backend health..."
if curl -f http://localhost:5001/health &> /dev/null; then
    print_success "Backend is healthy"
else
    print_warning "Backend health check failed - this is normal on first startup"
    echo "    The backend may still be initializing..."
fi

# Check frontend health
print_status "Checking frontend health..."
if curl -f http://localhost/health &> /dev/null; then
    print_success "Frontend is healthy"
else
    print_warning "Frontend health check failed - this is normal on first startup"
fi

echo ""
print_success "Deployment completed!"
echo ""
echo "📊 Your Z-App is now running:"
echo "    Frontend:  http://localhost"
echo "    Backend:   http://localhost:5001"
echo "    Database:  PostgreSQL on localhost:5432"
echo "    Redis:     Redis on localhost:6379"
echo ""
echo "🔧 Useful commands:"
echo "    View logs:     docker compose -f docker-compose.production.yml logs -f"
echo "    Stop app:      docker compose -f docker-compose.production.yml down"
echo "    Restart app:   docker compose -f docker-compose.production.yml restart"
echo "    Update app:    git pull && docker compose -f docker-compose.production.yml up -d --build"
echo ""
echo "📚 For detailed documentation, see: DOCKER_DEPLOYMENT_GUIDE.md"
echo ""

# Try to open browser (Linux with GUI)
if command -v xdg-open &> /dev/null; then
    print_status "Opening application in browser..."
    xdg-open http://localhost &> /dev/null || true
elif command -v open &> /dev/null; then
    # macOS
    print_status "Opening application in browser..."
    open http://localhost &> /dev/null || true
fi

echo ""
print_success "Z-App Docker deployment successful!"