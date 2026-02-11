# 🌐 Public Preview Access Guide

This guide explains how to access your HRhubly platform through a public URL that can be accessed from any browser, anywhere in the world.

## 🚀 Quick Start - Get Your Public Link Now!

### Option 1: Using Cloudflare Tunnel (Recommended - Free & No Sign-up Required)

Cloudflare Tunnel provides a free, secure way to expose your local development server to the internet.

**Step 1: Install cloudflared**

```bash
# For macOS
brew install cloudflare/cloudflare/cloudflared

# For Linux (Debian/Ubuntu)
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# For Linux (Other)
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# For Windows
# Download from: https://github.com/cloudflare/cloudflared/releases/latest
# Or use: winget install --id Cloudflare.cloudflared
```

**Step 2: Start your development server**

```bash
# Option A: Without Docker
pnpm dev

# Option B: With Docker
cd docker
docker-compose up -d
```

**Step 3: Create a public tunnel**

Open a new terminal and run:

```bash
# If using pnpm dev (port 3000)
cloudflared tunnel --url http://localhost:3000

# If using Docker (port 8000)
cloudflared tunnel --url http://localhost:8000
```

**Step 4: Get your public URL**

You'll see output like:
```
Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):
https://random-word-random-word.trycloudflare.com
```

🎉 **That's your public preview link!** Copy it and access it from any browser, anywhere.

**Step 5: Update BASE_URL (Important!)**

To ensure all features work correctly, update your `.env` file:

```bash
# Add your cloudflare tunnel URL
BASE_URL=https://your-tunnel-url.trycloudflare.com
```

Then restart your development server for changes to take effect.

### Option 2: Using ngrok (Alternative - Requires Free Account)

ngrok is another popular tunneling service.

**Step 1: Install ngrok**

```bash
# For macOS
brew install ngrok

# For Linux/Windows
# Download from: https://ngrok.com/download
```

**Step 2: Sign up and authenticate** (one-time setup)

```bash
# Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

**Step 3: Start your development server**

```bash
pnpm dev  # or docker-compose up -d
```

**Step 4: Create a public tunnel**

```bash
# If using pnpm dev (port 3000)
ngrok http 3000

# If using Docker (port 8000)
ngrok http 8000
```

**Step 5: Get your public URL**

You'll see output with your public URL:
```
Forwarding https://random-string.ngrok-free.app -> http://localhost:3000
```

**Step 6: Update BASE_URL**

Update your `.env` file:
```bash
BASE_URL=https://your-ngrok-url.ngrok-free.app
```

### Option 3: Using localtunnel (Alternative - No Sign-up Required)

**Step 1: Install localtunnel**

```bash
npm install -g localtunnel
```

**Step 2: Start your development server**

```bash
pnpm dev  # or docker-compose up -d
```

**Step 3: Create a public tunnel**

```bash
# If using pnpm dev (port 3000)
lt --port 3000

# If using Docker (port 8000)
lt --port 8000

# Optional: Use a custom subdomain
lt --port 3000 --subdomain my-hr-preview
```

**Step 4: Get your public URL**

You'll see output like:
```
your url is: https://random-string.loca.lt
```

**Step 5: Update BASE_URL**

Update your `.env` file:
```bash
BASE_URL=https://your-localtunnel-url.loca.lt
```

## 🔄 Live Updates & Hot Reload

Once your public tunnel is active:

✅ **Code changes are reflected immediately** (hot reload)
✅ **No need to restart the tunnel** when you edit code
✅ **Share the link** with anyone - no login required for public pages
✅ **Test from different devices** - mobile, tablet, desktop

### Testing Your Public Link

1. **Open the public URL in an incognito/private window** to test without login
2. **Access public pages** like:
   - Vacancy pages: `https://your-url.com/businessname/vacancy/[vacancy-id]`
   - Test pages: `https://your-url.com/test/[test-id]`
   - General application: `https://your-url.com/apply`
3. **Test from your phone** to verify mobile responsiveness
4. **Share with others** to get feedback

## 📝 Using the Public Link Effectively

### For Development

```bash
# Terminal 1: Run your dev server
pnpm dev

# Terminal 2: Create public tunnel
cloudflared tunnel --url http://localhost:3000

# Terminal 3: Make code changes and see them live!
# Edit your files, save, and refresh the public URL
```

### For Testing

1. **Share the link** with testers, clients, or stakeholders
2. **No special setup required** on their end - just open the link
3. **Test different scenarios:**
   - Different browsers (Chrome, Firefox, Safari)
   - Different devices (desktop, mobile, tablet)
   - Different locations (different countries)
   - Different networks (Wi-Fi, mobile data, VPN)

### For Demos

1. **Stable public URL** you can share before meetings
2. **Live coding demos** - make changes and show them instantly
3. **Client presentations** - they can access from their own devices
4. **Portfolio showcase** - temporary public access to show your work

## ⚙️ Configuration Tips

### Update BASE_URL for Full Functionality

Many features depend on `BASE_URL` being set correctly:

```env
# In your .env file
BASE_URL=https://your-public-tunnel-url.com

# Example with cloudflare tunnel
BASE_URL=https://clever-bird-123.trycloudflare.com

# Example with ngrok
BASE_URL=https://abc123.ngrok-free.app
```

**Why this matters:**
- ✅ Email links work correctly
- ✅ OAuth redirects work
- ✅ API calls are properly routed
- ✅ Asset URLs are correct
- ✅ CORS settings are properly configured

### Allow Public Access in Docker

If using Docker, make sure your compose.yaml allows external connections:

```yaml
# Already configured in compose.yaml
app:
  command: PORT=3000 pnpm dev --host 0.0.0.0
```

The `--host 0.0.0.0` flag allows connections from outside localhost (already configured).

### Security Considerations

⚠️ **Important Security Notes:**

1. **Don't share admin credentials** - your public link exposes your dev environment
2. **Use strong passwords** - especially for admin and database access
3. **Don't commit secrets** - keep your `.env` file private
4. **Use temporary links** - tunnels are meant for development/testing only
5. **Monitor access** - check your tunnel logs for suspicious activity
6. **Close tunnels** - stop the tunnel when not in use (Ctrl+C in tunnel terminal)

### Persistent Subdomain (ngrok paid feature)

For a consistent URL across sessions (ngrok only):

```bash
# Reserve a subdomain (requires ngrok paid plan)
ngrok http 3000 --subdomain my-hr-platform

# Your URL will always be: https://my-hr-platform.ngrok-free.app
```

## 🐛 Troubleshooting

### Tunnel connects but app doesn't load

**Problem:** Tunnel URL shows "502 Bad Gateway" or "Connection refused"

**Solutions:**
1. Make sure your dev server is running: `pnpm dev` or `docker-compose up -d`
2. Check the correct port: 3000 for `pnpm dev`, 8000 for Docker
3. Verify the server is listening on 0.0.0.0 (not just localhost)
4. Check firewall settings aren't blocking the connection

### BASE_URL not updating

**Problem:** Links in emails or redirects use old URL

**Solutions:**
1. Update `.env` file with new BASE_URL
2. Restart your development server
3. Clear browser cache
4. Check that `env.ts` is loading the new value

### Features not working on public URL

**Problem:** Some features work locally but not on public URL

**Solutions:**
1. Update `BASE_URL` in `.env`
2. Check CORS settings in `app.config.ts` (already configured)
3. Verify webhook URLs if using external services
4. Check browser console for CORS errors
5. Some features might require HTTPS (tunnels provide this automatically)

### Tunnel disconnects frequently

**Problem:** Public URL becomes unavailable

**Solutions:**
1. **Cloudflare Tunnel:** Free tier tunnels are temporary; restart with same command
2. **ngrok:** Free tier has time limits; upgrade for persistent tunnels
3. **localtunnel:** Reconnect automatically; might get a new URL
4. Check your internet connection stability
5. Consider using ngrok's paid plan for production demos

### "Your connection is not private" warning

**Problem:** Browser shows security warning

**Solutions:**
1. This is normal for first-time access to some tunnel URLs
2. Click "Advanced" → "Proceed to site" (safe for development)
3. cloudflared tunnels are automatically trusted (uses Cloudflare's SSL)
4. ngrok and localtunnel provide valid SSL certificates
5. For production, use proper SSL certificates

## 🎯 Best Practices

### During Development

1. **Keep the tunnel running** while actively developing
2. **Update BASE_URL** whenever you start a new tunnel
3. **Test frequently** on the public URL to catch issues early
4. **Use private browsing** to test as a logged-out user
5. **Share early** to get feedback while features are fresh

### For Presentations

1. **Start tunnel early** to ensure it's working
2. **Test the link** before your meeting/demo
3. **Have a backup plan** (screenshots, local demo)
4. **Save the URL** - bookmarks or notes
5. **Restart if needed** - tunnels can expire

### For Team Collaboration

1. **Document the current URL** in team chat
2. **Update when it changes** (new tunnel = new URL)
3. **Set up persistent URL** if frequent sharing (ngrok paid)
4. **Use staging environment** for longer-term public access
5. **Consider deployment** for permanent public access (see DEPLOYMENT.md)

## 🚀 Moving to Production

While tunnels are great for development and testing, for a permanent public-facing site you should deploy to a hosting platform:

### Recommended Hosting Options

1. **Vercel** - Easiest deployment, free tier available
2. **Railway** - Full-stack hosting with databases
3. **DigitalOcean** - Full control with App Platform or Droplets
4. **AWS/GCP/Azure** - Enterprise-grade infrastructure
5. **Your own VPS** - Complete control, requires setup

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for detailed deployment instructions.

## 📚 Additional Resources

- **Cloudflare Tunnel Docs:** https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **ngrok Documentation:** https://ngrok.com/docs
- **localtunnel GitHub:** https://github.com/localtunnel/localtunnel
- **Development Guide:** [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Deployment Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)

## 💡 Quick Commands Reference

```bash
# Cloudflare Tunnel (Recommended)
cloudflared tunnel --url http://localhost:3000

# ngrok
ngrok http 3000

# localtunnel
lt --port 3000

# localtunnel with custom subdomain
lt --port 3000 --subdomain my-hr-app

# Start dev server
pnpm dev

# Start with Docker
cd docker && docker-compose up -d

# Update BASE_URL
echo "BASE_URL=https://your-new-url.com" >> .env
```

## 🎉 Success!

Once set up, you'll have:
- ✅ A public URL you can access from anywhere
- ✅ Real-time updates when you change code
- ✅ Ability to test on any device
- ✅ Easy sharing with teammates and clients
- ✅ Professional demos without complex setup

**Need help?** Open an issue on GitHub or check the troubleshooting section above.

---

**Remember:** Tunnels are for development and testing. For production use, deploy to a proper hosting service (see DEPLOYMENT.md).
