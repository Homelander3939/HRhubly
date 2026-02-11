# 🎯 Example Workflow: Using Public Preview for Development

This document shows you exactly how to use the public preview feature for day-to-day development.

## 📋 Scenario: Making Changes and Seeing Them Live

Let's walk through a complete workflow from making code changes to accessing them from any device.

### Step 1: Start Your Development Environment

Open your first terminal:

```bash
cd HRhubly

# Start the development server
pnpm dev

# You'll see output like:
# > vinxi dev
# 
# VINXI v0.5.3
# ➜ Local:   http://localhost:3000
# ➜ Network: use --host to expose
```

✅ **Your app is now running locally**

### Step 2: Create a Public URL

Open a **second terminal** (keep the first one running):

```bash
cd HRhubly

# Start the public tunnel
pnpm preview

# Or directly:
./scripts/start-public-preview.sh

# You'll see output like:
# ╔══════════════════════════════════════════════════════╗
# ║      🌐 HRhubly Public Preview Setup 🌐              ║
# ╚══════════════════════════════════════════════════════╝
#
# Step 1: Checking your development environment...
# ✓ Development server detected on port 3000
#
# Step 2: Selecting tunnel service...
# ✓ cloudflared is installed (Recommended)
#
# Step 3: Creating public tunnel...
# Starting Cloudflare Tunnel...
#
# Your quick Tunnel has been created! Visit it at:
# https://clever-bird-amazing-mouse.trycloudflare.com
```

✅ **Copy the public URL** - this is your preview link!

### Step 3: Update BASE_URL (Important!)

For all features to work correctly (emails, redirects, etc.), update your `.env` file:

```bash
# Edit .env
nano .env

# Change the BASE_URL line to your tunnel URL
BASE_URL=https://clever-bird-amazing-mouse.trycloudflare.com
```

**Then restart your dev server** (in terminal 1):
- Press `Ctrl+C` to stop
- Run `pnpm dev` again

✅ **Your app now knows its public URL**

### Step 4: Access From Anywhere

Now you can:

1. **Open the public URL in your browser**
   ```
   https://clever-bird-amazing-mouse.trycloudflare.com
   ```

2. **Test on your phone**
   - Open your phone's browser
   - Enter the same URL
   - Works over any network (Wi-Fi, mobile data)

3. **Share with others**
   - Send the link to team members
   - Share via email, Slack, Teams, etc.
   - No login required for public pages

### Step 5: Make Code Changes

Now here's the magic - make any code change and see it instantly!

**Example: Edit a page title**

```bash
# In a third terminal (or use your code editor)
cd HRhubly/src/routes

# Edit the home page
nano index.tsx

# Change something like:
<h1>Welcome to HRhubly</h1>
# to:
<h1>Welcome to My HR Platform</h1>

# Save the file
```

**Within seconds:**
- ✅ Your localhost browser refreshes automatically
- ✅ The public URL also shows the change
- ✅ Anyone viewing the link sees the update
- ✅ Your phone browser updates when refreshed

### Step 6: Test Different Scenarios

**Test as a logged-out user:**
```
1. Open public URL in incognito mode
2. Try accessing public pages
3. Test the application form
4. Verify everything works without login
```

**Test on different devices:**
```
1. Desktop: Use the public URL in Chrome, Firefox, Safari
2. Mobile: Open on iPhone and Android
3. Tablet: Test the responsive design
```

**Share for feedback:**
```
1. Send link to a colleague: "Hey, check out this new feature!"
2. They open it instantly, no setup needed
3. Get feedback in real-time
```

## 🔄 Daily Development Workflow

Here's how to use this for continuous development:

### Morning Setup (Once per session)

```bash
# Terminal 1: Dev server
pnpm dev

# Terminal 2: Public tunnel
pnpm preview

# Copy the public URL and bookmark it for the day
```

### Coding (Continuous)

```bash
# Terminal 3 (or your IDE): Make changes
# Edit files → Save → See changes instantly on public URL
```

### Testing (Frequent)

```bash
# 1. Test locally: http://localhost:3000
# 2. Test publicly: https://your-tunnel-url.com
# 3. Test on mobile: Open public URL on phone
```

### Sharing (As needed)

```bash
# Send public URL to stakeholders
# "Check out the new dashboard: https://..."
# No deployment, no waiting, instant access
```

## 📱 Real-World Examples

### Example 1: Client Demo

**Scenario:** You're building a new feature and want to show it to a client.

```bash
# 9:00 AM - Start work
Terminal 1: pnpm dev
Terminal 2: pnpm preview
# Get URL: https://demo-123.trycloudflare.com

# 9:05 AM - Work on feature
# Edit code, make UI changes, etc.

# 10:00 AM - Ready for demo
# Send email to client:
# "Hi! Here's the new feature we discussed:
#  https://demo-123.trycloudflare.com
#  Login: demo@example.com / Password: demo123"

# 10:15 AM - During call
# Client: "Can you make the button blue instead?"
# You: *edits code* "Done! Refresh your page."
# Client: "Perfect!"

# 11:00 AM - Done with demo
# Ctrl+C in Terminal 2 to stop tunnel
# Continue development on localhost
```

### Example 2: Mobile Testing

**Scenario:** You're working on mobile responsiveness.

```bash
# Start tunnel
pnpm preview
# Get URL: https://mobile-test.trycloudflare.com

# Update BASE_URL in .env
BASE_URL=https://mobile-test.trycloudflare.com

# Restart dev server
Ctrl+C in Terminal 1, then pnpm dev

# Open on phone
1. Take out your phone
2. Open: https://mobile-test.trycloudflare.com
3. Test navigation, forms, buttons

# Make adjustments
Edit CSS → Save → Refresh phone → See changes

# Test different screen sizes
- Portrait mode
- Landscape mode  
- Different devices (iPhone, Android, tablet)
```

### Example 3: Team Collaboration

**Scenario:** Working with a designer on UI improvements.

```bash
# You (Developer):
Terminal 1: pnpm dev
Terminal 2: pnpm preview
# Get: https://ui-review.trycloudflare.com

# Share in Slack:
"@designer Hey! Check out the new UI:
 https://ui-review.trycloudflare.com
 Let me know what you think!"

# Designer responds:
"The spacing on the header looks off"

# You make changes:
Edit header.tsx → Save
# Reply: "Fixed! Refresh your browser"

# Designer:
"Perfect! But can you try blue instead of green?"

# You:
Edit styles → Save
# Reply: "Done! What do you think now?"

# Real-time collaboration without commits or deployments!
```

## ⏱️ Time Comparison

### Without Public Preview:

```
1. Make changes locally (5 min)
2. Commit and push (2 min)
3. Wait for CI/CD (5-10 min)
4. Deploy to staging (5-10 min)
5. Share staging URL (1 min)
6. Client tests and requests changes (5 min)
7. Repeat steps 1-6 for each iteration
Total: 23-33 minutes per iteration
```

### With Public Preview:

```
1. Make changes locally (5 min)
2. Save file (1 second)
3. Share public URL (already shared)
4. Client tests and requests changes (5 min)
5. Repeat steps 1-4 for each iteration
Total: 10 minutes per iteration
⚡ 2-3x faster feedback loop!
```

## 🛠️ Tips and Tricks

### Tip 1: Keep the Same URL

With ngrok (paid):
```bash
ngrok http 3000 --subdomain my-hr-platform
# Always get: https://my-hr-platform.ngrok-free.app
```

### Tip 2: Test Multiple Features

```bash
# Keep multiple tunnels for different branches
# Terminal 1: Main feature
cd HRhubly
git checkout feature/dashboard
pnpm dev --port 3000
cloudflared tunnel --url http://localhost:3000

# Terminal 2: Experimental feature  
cd HRhubly-test
git checkout feature/new-ui
pnpm dev --port 3001
cloudflared tunnel --url http://localhost:3001

# Share both URLs for comparison
```

### Tip 3: Quick Access QR Code

```bash
# Install qrcode
npm install -g qrcode-terminal

# Generate QR code for your URL
qrcode-terminal https://your-tunnel-url.com

# Scan with phone for instant access!
```

### Tip 4: Browser Sync

All browsers viewing the public URL see updates:
- Your desktop browser (localhost)
- Public URL in incognito
- Your phone
- Colleague's computer
- All refresh and show new changes!

## 🎉 Benefits Recap

✅ **Instant sharing** - No deployment needed
✅ **Real-time updates** - See changes in seconds
✅ **Device testing** - Test on phones, tablets instantly
✅ **Client demos** - Live coding during calls
✅ **Team collaboration** - Quick feedback loops
✅ **No configuration** - Works out of the box
✅ **Free** - All tunnel options have free tiers

## 🚀 Next Steps

Once you're comfortable with public preview:

1. **Use for all development** - Make it part of your workflow
2. **Share early and often** - Get feedback faster
3. **Test on real devices** - Catch issues before deployment
4. **Demo confidently** - Live updates during presentations
5. **Deploy when ready** - See [DEPLOYMENT.md](./DEPLOYMENT.md) for production

---

**Questions?** Check [PUBLIC_PREVIEW.md](./PUBLIC_PREVIEW.md) for detailed documentation and troubleshooting.
