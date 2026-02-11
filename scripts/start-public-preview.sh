#!/bin/bash

# HRhubly Public Preview Tunnel Setup Script
# This script helps you quickly create a public URL for your development environment

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                              ║"
echo "║                   🌐 HRhubly Public Preview Setup 🌐                         ║"
echo "║                                                                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if curl is available
if ! command_exists curl; then
    echo -e "${RED}⚠️  curl is not installed${NC}"
    echo
    echo "curl is required to check if your dev server is running."
    echo "Please install curl first:"
    echo
    echo -e "  macOS:   ${GREEN}brew install curl${NC} (usually pre-installed)"
    echo -e "  Linux:   ${GREEN}sudo apt install curl${NC} or ${GREEN}sudo yum install curl${NC}"
    echo
    exit 1
fi

# Function to check if dev server is running
check_dev_server() {
    local port=$1
    local http_code
    
    # Try to get HTTP status code, handle curl errors gracefully
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${port}" 2>/dev/null)
    local curl_exit=$?
    
    # Check if curl succeeded (exit code 0) and got a 200 response
    if [ $curl_exit -eq 0 ] && [ "$http_code" = "200" ]; then
        return 0
    else
        # Connection failed or non-200 response
        return 1
    fi
}

# Detect which port the dev server should be on
detect_port() {
    if check_dev_server 3000; then
        echo "3000"
    elif check_dev_server 8000; then
        echo "8000"
    else
        echo ""
    fi
}

# Main script
echo -e "${GREEN}Step 1: Checking your development environment...${NC}"
echo

# Check if dev server is running
DEV_PORT=$(detect_port)

if [ -z "$DEV_PORT" ]; then
    echo -e "${YELLOW}⚠️  No development server detected on port 3000 or 8000${NC}"
    echo
    echo "Please start your development server first:"
    echo
    echo "  Option 1 (Local development):"
    echo -e "    ${GREEN}pnpm dev${NC}"
    echo
    echo "  Option 2 (Docker):"
    echo -e "    ${GREEN}cd docker && docker-compose up -d${NC}"
    echo
    exit 1
else
    echo -e "${GREEN}✓ Development server detected on port ${DEV_PORT}${NC}"
fi

echo
echo -e "${GREEN}Step 2: Selecting tunnel service...${NC}"
echo

# Check which tunnel service is available
if command_exists cloudflared; then
    TUNNEL_SERVICE="cloudflared"
    echo -e "${GREEN}✓ cloudflared is installed (Recommended)${NC}"
elif command_exists ngrok; then
    TUNNEL_SERVICE="ngrok"
    echo -e "${GREEN}✓ ngrok is installed${NC}"
elif command_exists lt; then
    TUNNEL_SERVICE="localtunnel"
    echo -e "${GREEN}✓ localtunnel is installed${NC}"
else
    echo -e "${YELLOW}⚠️  No tunnel service found${NC}"
    echo
    echo "Please install one of the following:"
    echo
    echo "  Cloudflare Tunnel (Recommended - Free, No Sign-up):"
    echo -e "    macOS:   ${GREEN}brew install cloudflare/cloudflare/cloudflared${NC}"
    echo -e "    Linux:   ${GREEN}wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && sudo dpkg -i cloudflared-linux-amd64.deb${NC}"
    echo
    echo "  ngrok (Alternative - Requires Free Account):"
    echo -e "    ${GREEN}brew install ngrok${NC}"
    echo -e "    ${GREEN}# Or download from: https://ngrok.com/download${NC}"
    echo
    echo "  localtunnel (Alternative - No Sign-up):"
    echo -e "    ${GREEN}npm install -g localtunnel${NC}"
    echo
    echo "See PUBLIC_PREVIEW.md for detailed instructions."
    exit 1
fi

echo
echo -e "${GREEN}Step 3: Creating public tunnel...${NC}"
echo

# Start the appropriate tunnel
case $TUNNEL_SERVICE in
    cloudflared)
        echo -e "${BLUE}Starting Cloudflare Tunnel...${NC}"
        echo -e "${YELLOW}Your public URL will appear below. Press Ctrl+C to stop the tunnel.${NC}"
        echo
        cloudflared tunnel --url "http://localhost:${DEV_PORT}"
        ;;
    ngrok)
        echo -e "${BLUE}Starting ngrok tunnel...${NC}"
        echo -e "${YELLOW}Your public URL will appear below. Press Ctrl+C to stop the tunnel.${NC}"
        echo
        ngrok http "${DEV_PORT}"
        ;;
    localtunnel)
        echo -e "${BLUE}Starting localtunnel...${NC}"
        echo -e "${YELLOW}Your public URL will appear below. Press Ctrl+C to stop the tunnel.${NC}"
        echo
        lt --port "${DEV_PORT}"
        ;;
esac

# This part only runs if tunnel is stopped
echo
echo -e "${YELLOW}Tunnel stopped.${NC}"
echo
echo -e "${GREEN}Remember to update your BASE_URL in .env file with your tunnel URL!${NC}"
echo "See PUBLIC_PREVIEW.md for more information."
