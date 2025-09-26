#!/bin/bash

# Hanumo Property Rental System - Stop Script
# This script stops the FastAPI application gracefully

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
PID_FILE="$APP_DIR/hanumo.pid"
LOG_DIR="$APP_DIR/logs"

echo -e "${BLUE}Stopping $APP_NAME...${NC}"

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
    echo -e "${YELLOW}No PID file found. Application may not be running.${NC}"
    
    # Try to find and kill any uvicorn processes
    UVICORN_PIDS=$(pgrep -f "uvicorn main:app" || true)
    if [ -n "$UVICORN_PIDS" ]; then
        echo -e "${YELLOW}Found running uvicorn processes: $UVICORN_PIDS${NC}"
        echo -e "${BLUE}Killing uvicorn processes...${NC}"
        kill $UVICORN_PIDS
        sleep 2
        
        # Force kill if still running
        UVICORN_PIDS=$(pgrep -f "uvicorn main:app" || true)
        if [ -n "$UVICORN_PIDS" ]; then
            echo -e "${YELLOW}Force killing remaining processes...${NC}"
            kill -9 $UVICORN_PIDS
        fi
        
        echo -e "${GREEN}✓ Application stopped${NC}"
    else
        echo -e "${YELLOW}No running application found${NC}"
    fi
    exit 0
fi

# Read PID from file
PID=$(cat "$PID_FILE")

# Check if process is running
if ! ps -p "$PID" > /dev/null 2>&1; then
    echo -e "${YELLOW}Process with PID $PID is not running${NC}"
    echo -e "${YELLOW}Removing stale PID file${NC}"
    rm -f "$PID_FILE"
    exit 0
fi

echo -e "${BLUE}Stopping application with PID $PID...${NC}"

# Try graceful shutdown first
kill -TERM "$PID"

# Wait for graceful shutdown
TIMEOUT=10
COUNT=0
while ps -p "$PID" > /dev/null 2>&1 && [ $COUNT -lt $TIMEOUT ]; do
    sleep 1
    COUNT=$((COUNT + 1))
    echo -e "${YELLOW}Waiting for graceful shutdown... ($COUNT/$TIMEOUT)${NC}"
done

# Force kill if still running
if ps -p "$PID" > /dev/null 2>&1; then
    echo -e "${YELLOW}Graceful shutdown timeout. Force killing...${NC}"
    kill -9 "$PID"
    sleep 1
fi

# Verify process is stopped
if ps -p "$PID" > /dev/null 2>&1; then
    echo -e "${RED}✗ Failed to stop application${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Application stopped successfully${NC}"
    rm -f "$PID_FILE"
fi

# Clean up any remaining uvicorn processes
REMAINING_PIDS=$(pgrep -f "uvicorn main:app" || true)
if [ -n "$REMAINING_PIDS" ]; then
    echo -e "${YELLOW}Cleaning up remaining uvicorn processes...${NC}"
    kill -9 $REMAINING_PIDS
fi

echo -e "${GREEN}✓ All processes stopped${NC}"
