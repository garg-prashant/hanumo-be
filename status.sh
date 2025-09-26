#!/bin/bash

# Hanumo Property Rental System - Status Script
# This script checks the status of the FastAPI application

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
PORT=${PORT:-8000}

echo -e "${BLUE}$APP_NAME Status${NC}"
echo "=================="

# Check PID file
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    echo -e "${BLUE}PID File:${NC} $PID_FILE (PID: $PID)"
    
    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Application is running${NC}"
        
        # Get process info
        PROCESS_INFO=$(ps -p "$PID" -o pid,ppid,cmd --no-headers)
        echo -e "${BLUE}Process Info:${NC}"
        echo "  $PROCESS_INFO"
        
        # Check if port is listening
        if lsof -i :$PORT > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Port $PORT is listening${NC}"
        else
            echo -e "${YELLOW}⚠ Port $PORT is not listening${NC}"
        fi
        
        # Check API health
        if command -v curl > /dev/null 2>&1; then
            if curl -s -f "http://localhost:$PORT/health" > /dev/null 2>&1; then
                echo -e "${GREEN}✓ API is responding${NC}"
            else
                echo -e "${YELLOW}⚠ API is not responding${NC}"
            fi
        fi
        
        # Show log file info
        if [ -f "$LOG_DIR/app.log" ]; then
            LOG_SIZE=$(du -h "$LOG_DIR/app.log" | cut -f1)
            echo -e "${BLUE}Log File:${NC} $LOG_DIR/app.log (Size: $LOG_SIZE)"
            
            # Show last few lines of log
            echo -e "${BLUE}Recent Log Entries:${NC}"
            tail -n 3 "$LOG_DIR/app.log" | sed 's/^/  /'
        fi
        
        echo ""
        echo -e "${BLUE}Application URLs:${NC}"
        echo "  • API Server: http://localhost:$PORT"
        echo "  • API Documentation: http://localhost:$PORT/docs"
        echo "  • ReDoc Documentation: http://localhost:$PORT/redoc"
        
    else
        echo -e "${RED}✗ Application is not running (stale PID file)${NC}"
        echo -e "${YELLOW}Removing stale PID file...${NC}"
        rm -f "$PID_FILE"
    fi
else
    echo -e "${YELLOW}⚠ No PID file found${NC}"
    
    # Check for any uvicorn processes
    UVICORN_PIDS=$(pgrep -f "uvicorn main:app" || true)
    if [ -n "$UVICORN_PIDS" ]; then
        echo -e "${YELLOW}⚠ Found uvicorn processes without PID file: $UVICORN_PIDS${NC}"
        echo -e "${BLUE}Process Details:${NC}"
        ps -p $UVICORN_PIDS -o pid,ppid,cmd --no-headers | sed 's/^/  /'
    else
        echo -e "${RED}✗ Application is not running${NC}"
    fi
fi

echo ""
echo -e "${BLUE}Quick Commands:${NC}"
echo "  • Start: ./start.sh"
echo "  • Stop: ./stop.sh"
echo "  • View Logs: tail -f $LOG_DIR/app.log"
echo "  • Test API: curl http://localhost:$PORT/health"
