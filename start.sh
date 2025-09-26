#!/bin/bash

# Hanumo Property Rental System - Start Script
# This script starts the Node.js TypeScript application with proper configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="Hanumo Property Rental System"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$APP_DIR/logs"
PID_FILE="$APP_DIR/hanumo.pid"
PORT=${PORT:-3000}
HOST=${HOST:-0.0.0.0}
NODE_ENV=${NODE_ENV:-development}

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

echo -e "${BLUE}Starting $APP_NAME (Node.js TypeScript)...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo -e "${YELLOW}Please install Node.js 18+ from https://nodejs.org/${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js version 18+ is required (current: $(node --version))${NC}"
    exit 1
fi

# Check if application is already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}Application is already running with PID $PID${NC}"
        echo -e "${YELLOW}Use './stop.sh' to stop it first${NC}"
        exit 1
    else
        echo -e "${YELLOW}Removing stale PID file${NC}"
        rm -f "$PID_FILE"
    fi
fi

# Check if node_modules exists
if [ ! -d "$APP_DIR/node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Check if dist directory exists
if [ ! -d "$APP_DIR/dist" ]; then
    echo -e "${YELLOW}Building TypeScript application...${NC}"
    npm run build
fi

# Create .env file if it doesn't exist
if [ ! -f "$APP_DIR/.env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > "$APP_DIR/.env" << EOF
# Database
DATABASE_URL="file:./dev.db"

# Server Configuration
PORT=$PORT
NODE_ENV=$NODE_ENV
BACKEND_URL=http://localhost:$PORT

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Privy Configuration
PRIVY_APP_ID=cmfyc5hpa005el40cc5k9ilbj
PRIVY_APP_SECRET=28XTtRYMCie6ngeDMVbMM3hcREgd8A1DDE9ihwrGytTgPFmLy8CpC93g2v4LnYpzykmV1jQb5fi9GrWph396iBDQ

# OpenAI Configuration
OPENAI_API_KEY=demo-key

# X402 Payment Configuration
X402_PROVIDER_URL=https://api.x402provider.com
X402_API_KEY=demo-x402-key

# CORS Configuration
CORS_ORIGIN=http://localhost:$PORT

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
fi

# Setup database
echo -e "${BLUE}Setting up database...${NC}"
npx prisma generate
npx prisma db push

# Start the application
echo -e "${BLUE}Starting Node.js server on $HOST:$PORT...${NC}"
echo -e "${GREEN}Application will be available at:${NC}"
echo -e "  • API Server: http://localhost:$PORT"
echo -e "  • Swagger UI: http://localhost:$PORT/api-docs"
echo -e "  • Health Check: http://localhost:$PORT/health"
echo ""

# Start Node.js in background and save PID
nohup node dist/index.js \
    > "$LOG_DIR/app.log" 2>&1 &

PID=$!
echo $PID > "$PID_FILE"

# Wait a moment for the server to start
sleep 3

# Check if the server started successfully
if ps -p "$PID" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Application started successfully!${NC}"
    echo -e "${GREEN}✓ PID: $PID${NC}"
    echo -e "${GREEN}✓ Logs: $LOG_DIR/app.log${NC}"
    echo ""
    echo -e "${BLUE}To stop the application, run: ./stop.sh${NC}"
    echo -e "${BLUE}To view logs, run: tail -f $LOG_DIR/app.log${NC}"
    echo -e "${BLUE}To check status, run: ./status.sh${NC}"
else
    echo -e "${RED}✗ Failed to start application${NC}"
    echo -e "${RED}Check logs at: $LOG_DIR/app.log${NC}"
    rm -f "$PID_FILE"
    exit 1
fi
