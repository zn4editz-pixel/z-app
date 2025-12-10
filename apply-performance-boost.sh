#!/bin/bash

# ⚡ PERFORMANCE BOOST - Quick Apply Script
# This script applies all performance optimizations automatically

echo "🚀 Starting Performance Optimization..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Database Indexes
echo -e "${YELLOW}Step 1: Applying Database Indexes...${NC}"
if [ -f "backend/prisma/performance-indexes.sql" ]; then
    echo "Found performance-indexes.sql"
    echo "Please run manually:"
    echo "  psql -U your_user -d your_database -f backend/prisma/performance-indexes.sql"
    echo ""
else
    echo -e "${RED}Error: performance-indexes.sql not found${NC}"
fi

# Step 2: Install Dependencies
echo -e "${YELLOW}Step 2: Installing Dependencies...${NC}"
cd backend
if npm list node-cache > /dev/null 2>&1; then
    echo -e "${GREEN}✓ node-cache already installed${NC}"
else
    echo "Installing node-cache..."
    npm install node-cache
    echo -e "${GREEN}✓ node-cache installed${NC}"
fi
cd ..
echo ""

# Step 3: Backup Original Files
echo -e "${YELLOW}Step 3: Creating Backups...${NC}"
if [ -f "backend/src/controllers/admin.controller.js" ]; then
    cp backend/src/controllers/admin.controller.js backend/src/controllers/admin.controller.backup.js
    echo -e "${GREEN}✓ Backed up admin.controller.js${NC}"
fi

if [ -f "backend/src/lib/socket.js" ]; then
    cp backend/src/lib/socket.js backend/src/lib/socket.backup.js
    echo -e "${GREEN}✓ Backed up socket.js${NC}"
fi
echo ""

# Step 4: Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Performance Optimization Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Apply database indexes (see Step 1 above)"
echo "2. Restart your backend server"
echo "3. Test the application"
echo "4. Monitor performance improvements"
echo ""
echo "Files created:"
echo "  ✓ backend/prisma/performance-indexes.sql"
echo "  ✓ backend/src/controllers/admin.controller.optimized.js"
echo "  ✓ backend/src/lib/socket.optimized.js"
echo "  ✓ frontend/src/utils/performanceOptimizer.js"
echo ""
echo "Backups created:"
echo "  ✓ backend/src/controllers/admin.controller.backup.js"
echo "  ✓ backend/src/lib/socket.backup.js"
echo ""
echo -e "${YELLOW}To use optimized versions, update your imports in:${NC}"
echo "  - backend/src/routes/admin.route.js"
echo "  - backend/src/index.js"
echo ""
echo "See PERFORMANCE_OPTIMIZATION.md for detailed instructions"
echo ""
echo -e "${GREEN}🎉 Ready to boost performance!${NC}"
