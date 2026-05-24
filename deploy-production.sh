#!/bin/bash

# 🚀 PRODUCTION DEPLOYMENT SCRIPT
# This script prepares and deploys the Z-App to production

set -e  # Exit on any error

echo "🚀 Starting Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if required files exist
print_status "Checking required files..."

if [ ! -f "backend/.env.production" ]; then
    print_error "backend/.env.production not found!"
    print_warning "Please copy backend/.env.production.template to backend/.env.production and configure it"
    exit 1
fi

if [ ! -f "frontend/.env.production" ]; then
    print_error "frontend/.env.production not found!"
    print_warning "Please create frontend/.env.production with your production URLs"
    exit 1
fi

print_success "Required files found"

# Install dependencies
print_status "Installing backend dependencies..."
cd backend
npm install --production
print_success "Backend dependencies installed"

cd ../frontend
print_status "Installing frontend dependencies..."
npm install
print_success "Frontend dependencies installed"

# Generate Prisma client
print_status "Generating Prisma client..."
cd ../backend
npx prisma generate
print_success "Prisma client generated"

# Build frontend
print_status "Building frontend for production..."
cd ../frontend
npm run build
print_success "Frontend built successfully"

# Copy frontend build to backend public folder
print_status "Copying frontend build to backend..."
rm -rf ../backend/public
cp -r dist ../backend/public
print_success "Frontend copied to backend"

# Run database migrations (if needed)
print_status "Running database migrations..."
cd ../backend
if [ "$1" = "--migrate" ]; then
    npx prisma db push
    print_success "Database migrations completed"
else
    print_warning "Skipping database migrations (use --migrate flag to run)"
fi

# Create production build info
print_status "Creating build info..."
cat > ../backend/public/build-info.json << EOF
{
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "2.0.0",
  "environment": "production",
  "commit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
}
EOF

print_success "Build info created"

# Final checks
print_status "Running final checks..."

# Check if all required environment variables are set
cd ../backend
if ! grep -q "DATABASE_URL=" .env.production; then
    print_error "DATABASE_URL not set in .env.production"
    exit 1
fi

if ! grep -q "JWT_SECRET=" .env.production; then
    print_error "JWT_SECRET not set in .env.production"
    exit 1
fi

print_success "Environment variables validated"

# Display deployment summary
echo ""
echo "🎉 DEPLOYMENT READY!"
echo "===================="
echo ""
echo "✅ Backend dependencies installed"
echo "✅ Frontend built and copied"
echo "✅ Prisma client generated"
echo "✅ Environment variables validated"
echo ""
echo "📋 Next Steps:"
echo "1. Deploy the backend folder to your hosting service"
echo "2. Set up your database (PostgreSQL)"
echo "3. Configure your domain and SSL"
echo "4. Update CORS origins in production"
echo ""
echo "🚀 Start command: npm start (from backend folder)"
echo ""

print_success "Production deployment preparation completed!"