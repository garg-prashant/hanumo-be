#!/bin/bash

# Hanumo Property Rental System - Logs Script
# This script displays application logs with various options

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$APP_DIR/logs"
LOG_FILE="$LOG_DIR/app.log"

# Default options
LINES=50
FOLLOW=false
ERRORS_ONLY=false

# Function to show usage
show_usage() {
    echo -e "${BLUE}Usage: $0 [OPTIONS]${NC}"
    echo ""
    echo -e "${BLUE}Options:${NC}"
    echo "  -f, --follow     Follow log output (like tail -f)"
    echo "  -e, --errors     Show only error lines"
    echo "  -n, --lines N    Show last N lines (default: 50)"
    echo "  -h, --help       Show this help message"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo "  $0                    # Show last 50 lines"
    echo "  $0 -f                # Follow logs in real-time"
    echo "  $0 -n 100            # Show last 100 lines"
    echo "  $0 -e                # Show only errors"
    echo "  $0 -f -e             # Follow only error lines"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -e|--errors)
            ERRORS_ONLY=true
            shift
            ;;
        -n|--lines)
            LINES="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_usage
            exit 1
            ;;
    esac
done

# Check if log file exists
if [ ! -f "$LOG_FILE" ]; then
    echo -e "${RED}✗ Log file not found: $LOG_FILE${NC}"
    echo -e "${YELLOW}Make sure the application is running${NC}"
    exit 1
fi

# Check if log file is readable
if [ ! -r "$LOG_FILE" ]; then
    echo -e "${RED}✗ Cannot read log file: $LOG_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}Hanumo Property Rental System - Logs${NC}"
echo "======================================"
echo -e "${BLUE}Log File:${NC} $LOG_FILE"
echo -e "${BLUE}File Size:${NC} $(du -h "$LOG_FILE" | cut -f1)"
echo ""

# Show log content based on options
if [ "$FOLLOW" = true ]; then
    if [ "$ERRORS_ONLY" = true ]; then
        echo -e "${YELLOW}Following ERROR logs (Press Ctrl+C to stop)...${NC}"
        echo ""
        tail -f "$LOG_FILE" | grep --line-buffered -i "error\|exception\|traceback\|failed"
    else
        echo -e "${YELLOW}Following logs (Press Ctrl+C to stop)...${NC}"
        echo ""
        tail -f "$LOG_FILE"
    fi
else
    if [ "$ERRORS_ONLY" = true ]; then
        echo -e "${YELLOW}Last $LINES ERROR lines:${NC}"
        echo ""
        tail -n "$LINES" "$LOG_FILE" | grep -i "error\|exception\|traceback\|failed" || echo -e "${GREEN}No errors found in last $LINES lines${NC}"
    else
        echo -e "${YELLOW}Last $LINES lines:${NC}"
        echo ""
        tail -n "$LINES" "$LOG_FILE"
    fi
fi
