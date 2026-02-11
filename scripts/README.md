# Scripts Directory

This directory contains utility scripts for the HRhubly project.

## Public Preview Scripts

### `preview.cjs` (Cross-platform launcher)

A Node.js script that automatically detects your operating system and runs the appropriate platform-specific script.

**Usage:**
```bash
pnpm preview
# or
node scripts/preview.cjs
```

This is the recommended way to start a public tunnel as it works on all platforms.

### `start-public-preview.sh` (Linux/macOS)

Creates a public tunnel to your local development server, allowing you to access your app from any browser worldwide.

**Usage:**
```bash
./scripts/start-public-preview.sh
```

Or with pnpm:
```bash
pnpm preview
```

**Requirements:**
- Development server running (`pnpm dev` or `docker-compose up`)
- One of the following tunnel services installed:
  - cloudflared (recommended)
  - ngrok
  - localtunnel

### `start-public-preview.bat` (Windows)

Windows version of the public preview script.

**Usage:**
```cmd
scripts\start-public-preview.bat
```

## What These Scripts Do

1. **Detect Development Server**: Checks if your app is running on port 3000 or 8000
2. **Select Tunnel Service**: Finds which tunnel tool you have installed
3. **Create Public URL**: Starts a tunnel and provides a public URL
4. **Live Updates**: Your code changes are reflected in real-time on the public URL

## Installation Help

If no tunnel service is found, the script will show installation instructions.

**Quick Install (Recommended):**

```bash
# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux (Debian/Ubuntu)
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Or install localtunnel (cross-platform)
npm install -g localtunnel
```

## More Information

See [PUBLIC_PREVIEW.md](../PUBLIC_PREVIEW.md) for detailed documentation, troubleshooting, and advanced usage.
