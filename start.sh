#!/bin/bash

# Hanumo Property Rental System - Start Script
# This script starts the FastAPI application with proper configuration

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
VENV_DIR="$APP_DIR/venv"
LOG_DIR="$APP_DIR/logs"
PID_FILE="$APP_DIR/hanumo.pid"
PORT=${PORT:-8000}
HOST=${HOST:-0.0.0.0}

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

echo -e "${BLUE}Starting $APP_NAME...${NC}"

# Check if virtual environment exists
if [ ! -d "$VENV_DIR" ]; then
    echo -e "${RED}Error: Virtual environment not found at $VENV_DIR${NC}"
    echo -e "${YELLOW}Please run: python -m venv venv${NC}"
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

# Activate virtual environment
echo -e "${BLUE}Activating virtual environment...${NC}"
source "$VENV_DIR/bin/activate"

# Check if dependencies are installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    pip install -r requirements.txt
fi

# Create .env file if it doesn't exist
if [ ! -f "$APP_DIR/.env" ]; then
    echo -e "${YELLOW}Creating .env file from config.py...${NC}"
    cat > "$APP_DIR/.env" << EOF
DATABASE_URL=sqlite:///./hanumo_rental.db
SECRET_KEY=your-super-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
OPENAI_API_KEY=demo-key
X402_PROVIDER_URL=https://api.x402provider.com
X402_API_KEY=demo-x402-key
BACKEND_URL=http://localhost:$PORT
ENVIRONMENT=development
EOF
fi

# Start the application
echo -e "${BLUE}Starting FastAPI server on $HOST:$PORT...${NC}"
echo -e "${GREEN}Application will be available at:${NC}"
echo -e "  • API Server: http://localhost:$PORT"
echo -e "  • API Documentation: http://localhost:$PORT/docs"
echo -e "  • ReDoc Documentation: http://localhost:$PORT/redoc"
echo ""

# Start uvicorn in background and save PID
nohup uvicorn main:app --host "$HOST" --port "$PORT" --reload \
    --log-level info \
    --access-log \
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
else
    echo -e "${RED}✗ Failed to start application${NC}"
    echo -e "${RED}Check logs at: $LOG_DIR/app.log${NC}"
    rm -f "$PID_FILE"
    exit 1
fi
