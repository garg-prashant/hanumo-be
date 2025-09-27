#!/bin/bash

# Hanumo Property Rental System - Status Script
# This script checks the status of the Node.js TypeScript application

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
PORT=${PORT:-3000}

echo -e "${BLUE}$APP_NAME Status (Node.js TypeScript)${NC}"
echo "=========================================="

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
                
                # Get health response
                HEALTH_RESPONSE=$(curl -s "http://localhost:$PORT/health" | jq -r '.message // "Unknown"' 2>/dev/null || echo "Unknown")
                echo -e "${BLUE}Health Status:${NC} $HEALTH_RESPONSE"
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
        
        # Check Node.js version
        NODE_VERSION=$(node --version 2>/dev/null || echo "Unknown")
        echo -e "${BLUE}Node.js Version:${NC} $NODE_VERSION"
        
        # Check if dist directory exists
        if [ -d "$APP_DIR/dist" ]; then
            echo -e "${GREEN}✓ TypeScript build exists${NC}"
        else
            echo -e "${YELLOW}⚠ TypeScript build not found${NC}"
        fi
        
        # Check if node_modules exists
        if [ -d "$APP_DIR/node_modules" ]; then
            echo -e "${GREEN}✓ Dependencies installed${NC}"
        else
            echo -e "${YELLOW}⚠ Dependencies not installed${NC}"
        fi
        
        echo ""
        echo -e "${BLUE}Application URLs:${NC}"
        echo "  • API Server: http://localhost:$PORT"
        echo "  • Health Check: http://localhost:$PORT/health"
        
    else
        echo -e "${RED}✗ Application is not running (stale PID file)${NC}"
        echo -e "${YELLOW}Removing stale PID file...${NC}"
        rm -f "$PID_FILE"
    fi
else
    echo -e "${YELLOW}⚠ No PID file found${NC}"
    
    # Check for any Node.js processes running the app
    NODE_PIDS=$(pgrep -f "node dist/index.js" || true)
    if [ -n "$NODE_PIDS" ]; then
        echo -e "${YELLOW}⚠ Found Node.js processes without PID file: $NODE_PIDS${NC}"
        echo -e "${BLUE}Process Details:${NC}"
        ps -p $NODE_PIDS -o pid,ppid,cmd --no-headers | sed 's/^/  /'
    else
        echo -e "${RED}✗ Application is not running${NC}"
    fi
fi

# Check system resources
echo ""
echo -e "${BLUE}System Resources:${NC}"
if command -v free > /dev/null 2>&1; then
    MEMORY_INFO=$(free -h | grep "Mem:" | awk '{print "Used: " $3 " / " $2 " (" $3/$2*100 "%)"}')
    echo -e "${BLUE}Memory:${NC} $MEMORY_INFO"
fi

if command -v df > /dev/null 2>&1; then
    DISK_INFO=$(df -h . | tail -1 | awk '{print "Used: " $3 " / " $2 " (" $5 ")"}')
    echo -e "${BLUE}Disk:${NC} $DISK_INFO"
fi

echo ""
echo -e "${BLUE}Quick Commands:${NC}"
echo "  • Start: ./start.sh"
echo "  • Stop: ./stop.sh"
echo "  • View Logs: tail -f $LOG_DIR/app.log"
echo "  • Test API: curl http://localhost:$PORT/health"
echo "  • Rebuild: npm run build"
