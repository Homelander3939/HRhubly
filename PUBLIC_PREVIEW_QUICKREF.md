# 📋 Public Preview Quick Reference Card

## 🚀 Quick Start (3 Steps)

```bash
# 1. Start dev server
pnpm dev

# 2. Open new terminal, start tunnel  
pnpm preview

# 3. Copy the public URL and share it!
```

## 🔧 Common Commands

| Action | Command |
|--------|---------|
| Start dev server | `pnpm dev` |
| Create public tunnel | `pnpm preview` |
| Create public tunnel (Docker) | `cloudflared tunnel --url http://localhost:8000` |
| Stop tunnel | `Ctrl+C` in tunnel terminal |
| Update BASE_URL | Edit `.env` and restart `pnpm dev` |

## 🌐 Tunnel Services

### Cloudflare (Recommended)
```bash
# Install
brew install cloudflare/cloudflare/cloudflared  # macOS
# or see PUBLIC_PREVIEW.md for Linux/Windows

# Use
cloudflared tunnel --url http://localhost:3000
```
✅ Free, no sign-up, secure

### ngrok
```bash
# Install  
brew install ngrok  # or from ngrok.com/download

# Authenticate (one-time)
ngrok config add-authtoken YOUR_TOKEN

# Use
ngrok http 3000
```
✅ Free tier, requires account

### localtunnel
```bash
# Install
npm install -g localtunnel

# Use
lt --port 3000
```
✅ Free, no sign-up, may be less stable

## 📱 Testing Checklist

- [ ] Open public URL in desktop browser
- [ ] Test in incognito/private mode (logged-out user)
- [ ] Open on mobile phone
- [ ] Test on tablet (if available)
- [ ] Share with a colleague for feedback
- [ ] Verify all links work correctly
- [ ] Test forms and submissions
- [ ] Check mobile responsiveness

## ⚠️ Important: Update BASE_URL

After starting tunnel, update `.env`:

```env
# Before (local only)
BASE_URL=http://localhost:3000

# After (with tunnel)
BASE_URL=https://your-tunnel-url.trycloudflare.com
```

**Then restart dev server!** (`Ctrl+C` and `pnpm dev`)

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "No dev server detected" | Start `pnpm dev` first |
| "No tunnel service found" | Install cloudflared/ngrok/localtunnel |
| 502 Bad Gateway on public URL | Dev server not running or wrong port |
| Links don't work | Update BASE_URL in `.env` and restart |
| Tunnel disconnects | Normal for free tiers, just restart |
| "Connection not private" warning | Safe to proceed for dev tunnels |

## 💡 Pro Tips

1. **Keep 2 terminals open:**
   - Terminal 1: `pnpm dev` (dev server)
   - Terminal 2: `pnpm preview` (public tunnel)

2. **Bookmark the tunnel URL** during your work session

3. **Test frequently:**
   - Make change → Save → Refresh public URL → Verify

4. **Use incognito mode** to test as logged-out user

5. **Share early, share often** - Get feedback while coding

## 🎯 Workflow Summary

```
Morning:
├─ Start: pnpm dev
├─ Tunnel: pnpm preview  
└─ Update: BASE_URL in .env

Throughout day:
├─ Code changes → Auto-reload
├─ Test on public URL
└─ Share with team/clients

End of day:
├─ Ctrl+C tunnel
└─ Keep dev server running (optional)

Next day:
└─ New tunnel = new URL (update .env)
```

## 📚 More Info

- **Full Guide:** [PUBLIC_PREVIEW.md](./PUBLIC_PREVIEW.md)
- **Examples:** [PUBLIC_PREVIEW_EXAMPLES.md](./PUBLIC_PREVIEW_EXAMPLES.md)
- **Deployment:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **General:** [README.md](./README.md)

## 🆘 Need Help?

1. Check [PUBLIC_PREVIEW.md](./PUBLIC_PREVIEW.md) troubleshooting section
2. Verify dev server is running: `curl http://localhost:3000`
3. Check tunnel service: `which cloudflared` or `which ngrok`
4. Open an issue: [github.com/Homelander3939/HRhubly/issues](https://github.com/Homelander3939/HRhubly/issues)

---

**Remember:** Tunnels are for development/testing. For production, see [DEPLOYMENT.md](./DEPLOYMENT.md).
