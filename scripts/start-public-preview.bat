@echo off
REM HRhubly Public Preview Tunnel Setup Script (Windows)
REM This script helps you quickly create a public URL for your development environment

echo.
echo ================================================================================
echo.
echo                   🌐 HRhubly Public Preview Setup 🌐
echo.
echo ================================================================================
echo.

REM Check if dev server is running
echo Step 1: Checking your development environment...
echo.

curl -s -o nul http://localhost:3000
if %errorlevel% equ 0 (
    set DEV_PORT=3000
    echo ✓ Development server detected on port 3000
    goto :check_tunnel
)

curl -s -o nul http://localhost:8000
if %errorlevel% equ 0 (
    set DEV_PORT=8000
    echo ✓ Development server detected on port 8000
    goto :check_tunnel
)

echo ⚠️  No development server detected on port 3000 or 8000
echo.
echo Please start your development server first:
echo.
echo   Option 1 (Local development):
echo     pnpm dev
echo.
echo   Option 2 (Docker):
echo     cd docker ^&^& docker-compose up -d
echo.
exit /b 1

:check_tunnel
echo.
echo Step 2: Selecting tunnel service...
echo.

REM Check which tunnel service is available
where cloudflared >nul 2>&1
if %errorlevel% equ 0 (
    set TUNNEL_SERVICE=cloudflared
    echo ✓ cloudflared is installed ^(Recommended^)
    goto :start_tunnel
)

where ngrok >nul 2>&1
if %errorlevel% equ 0 (
    set TUNNEL_SERVICE=ngrok
    echo ✓ ngrok is installed
    goto :start_tunnel
)

where lt >nul 2>&1
if %errorlevel% equ 0 (
    set TUNNEL_SERVICE=localtunnel
    echo ✓ localtunnel is installed
    goto :start_tunnel
)

echo ⚠️  No tunnel service found
echo.
echo Please install one of the following:
echo.
echo   Cloudflare Tunnel ^(Recommended - Free, No Sign-up^):
echo     Download from: https://github.com/cloudflare/cloudflared/releases/latest
echo     Or use: winget install --id Cloudflare.cloudflared
echo.
echo   ngrok ^(Alternative - Requires Free Account^):
echo     Download from: https://ngrok.com/download
echo     Or use: choco install ngrok
echo.
echo   localtunnel ^(Alternative - No Sign-up^):
echo     npm install -g localtunnel
echo.
echo See PUBLIC_PREVIEW.md for detailed instructions.
exit /b 1

:start_tunnel
echo.
echo Step 3: Creating public tunnel...
echo.

if "%TUNNEL_SERVICE%"=="cloudflared" (
    echo Starting Cloudflare Tunnel...
    echo Your public URL will appear below. Press Ctrl+C to stop the tunnel.
    echo.
    cloudflared tunnel --url http://localhost:%DEV_PORT%
) else if "%TUNNEL_SERVICE%"=="ngrok" (
    echo Starting ngrok tunnel...
    echo Your public URL will appear below. Press Ctrl+C to stop the tunnel.
    echo.
    ngrok http %DEV_PORT%
) else if "%TUNNEL_SERVICE%"=="localtunnel" (
    echo Starting localtunnel...
    echo Your public URL will appear below. Press Ctrl+C to stop the tunnel.
    echo.
    lt --port %DEV_PORT%
)

echo.
echo Tunnel stopped.
echo.
echo Remember to update your BASE_URL in .env file with your tunnel URL!
echo See PUBLIC_PREVIEW.md for more information.
