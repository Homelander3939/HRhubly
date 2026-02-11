#!/bin/bash

# Quick Preview Script - Get a public URL in seconds!
# This script automatically sets up everything you need for public preview

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

clear

echo -e "${BLUE}${BOLD}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║        🌐  INSTANT PUBLIC PREVIEW SETUP  🌐                   ║
║                                                               ║
║     Access your HR platform from ANY device, ANYWHERE        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install cloudflared
install_cloudflared() {
    echo -e "${YELLOW}Installing Cloudflare Tunnel...${NC}"
    echo
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            echo "Using Homebrew to install..."
            brew install cloudflare/cloudflare/cloudflared
        else
            echo -e "${RED}Homebrew not found. Please install from: https://brew.sh${NC}"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo "Downloading cloudflared for Linux..."
        wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
        echo "Installing..."
        sudo dpkg -i cloudflared-linux-amd64.deb
        rm cloudflared-linux-amd64.deb
        echo -e "${GREEN}✓ Cloudflared installed successfully${NC}"
    else
        echo -e "${RED}Unsupported OS. Please install manually from:${NC}"
        echo "https://github.com/cloudflare/cloudflared/releases/latest"
        exit 1
    fi
}

# Step 1: Check/Install Cloudflared
echo -e "${BOLD}Step 1: Checking for Cloudflare Tunnel...${NC}"
echo

if command_exists cloudflared; then
    echo -e "${GREEN}✓ Cloudflared is installed${NC}"
else
    echo -e "${YELLOW}⚠️  Cloudflared not found${NC}"
    echo
    read -p "Would you like to install it now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_cloudflared
    else
        echo -e "${RED}Cannot continue without cloudflared. Exiting.${NC}"
        exit 1
    fi
fi

echo

# Step 2: Check if dev server is running
echo -e "${BOLD}Step 2: Checking development server...${NC}"
echo

check_dev_server() {
    curl -s -o /dev/null -w "%{http_code}" "http://localhost:$1" 2>/dev/null
}

DEV_PORT=""
if [ "$(check_dev_server 3000)" = "200" ]; then
    DEV_PORT="3000"
    echo -e "${GREEN}✓ Dev server running on port 3000${NC}"
elif [ "$(check_dev_server 8000)" = "200" ]; then
    DEV_PORT="8000"
    echo -e "${GREEN}✓ Dev server running on port 8000${NC}"
else
    echo -e "${YELLOW}⚠️  No dev server detected${NC}"
    echo
    echo "Starting dev server for you..."
    echo
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        echo -e "${RED}Error: Not in HRhubly directory${NC}"
        echo "Please cd to the HRhubly directory first"
        exit 1
    fi
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        pnpm install
        echo
    fi
    
    # Start dev server in background
    echo "Starting development server..."
    pnpm dev > dev-server.log 2>&1 &
    DEV_SERVER_PID=$!
    
    echo "Waiting for server to start..."
    sleep 5
    
    # Check if server started
    for _ in {1..12}; do
        if [ "$(check_dev_server 3000)" = "200" ]; then
            DEV_PORT="3000"
            echo -e "${GREEN}✓ Dev server started successfully on port 3000${NC}"
            break
        fi
        sleep 2
        echo -n "."
    done
    
    if [ -z "$DEV_PORT" ]; then
        echo -e "\n${RED}Failed to start dev server${NC}"
        kill $DEV_SERVER_PID 2>/dev/null
        exit 1
    fi
fi

echo

# Step 3: Create public tunnel
echo -e "${BOLD}Step 3: Creating your public URL...${NC}"
echo
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo
echo -e "${GREEN}${BOLD}Your development server is ready!${NC}"
echo
echo -e "Public URL will appear below shortly..."
echo -e "This URL can be accessed from ${BOLD}ANY browser, ANY device, ANYWHERE${NC}"
echo
echo -e "${YELLOW}Keep this terminal open to maintain the tunnel${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the tunnel${NC}"
echo
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo

# Start the tunnel
cloudflared tunnel --url "http://localhost:${DEV_PORT}"
