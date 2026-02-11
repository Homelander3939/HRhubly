# 🚀 Quick Start Guide - Your Live Preview Environment

Welcome to your HRhubly development environment! This guide will help you get started with continuous development and previewing your changes.

## 📍 Your Repository

**GitHub Repository:** https://github.com/Homelander3939/HRhubly

This is your central hub for:
- 📝 Code changes
- 🔄 Version control
- 🤖 Automated CI/CD
- 👥 Collaboration
- 📊 Project tracking

## 🌐 Preview Your Changes

Every time you make changes to your code, you can see them live in a preview environment.

### Option 1: Local Preview (Instant)

The fastest way to see your changes:

```bash
# Clone your repo
git clone https://github.com/Homelander3939/HRhubly.git
cd HRhubly

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

🎉 Your app is now running at **http://localhost:3000**

Changes you make will automatically reload in the browser!

### Option 2: Public Preview URL (Access from Anywhere) 🌍

Want to access your app from any device or share it with others?

```bash
# First, start your dev server in one terminal
pnpm dev

# Then, in another terminal, create a public URL
pnpm preview
# Or directly: ./scripts/start-public-preview.sh
```

🎉 You'll get a public URL like **https://your-app.trycloudflare.com**

This public URL allows you to:
- 🌍 Access from any browser, anywhere in the world
- 📱 Test on mobile devices (phone, tablet)
- 🔄 See code changes in real-time (hot reload works!)
- 👥 Share with team members, clients, or stakeholders
- 🔗 Create short links for easy sharing

**📖 See [PUBLIC_PREVIEW.md](./PUBLIC_PREVIEW.md) for detailed instructions and troubleshooting.**

### Option 3: Docker Preview (Full Environment)

For a complete environment with database, Redis, etc.:

```bash
cd docker
docker-compose up -d
```

🎉 Your app is now running at **http://localhost:8000**

Additional services:
- **Database Admin (Adminer):** http://localhost:8000/adminer
- **MinIO Console:** http://localhost:9001

To create a public URL for Docker setup:
```bash
# In another terminal
cloudflared tunnel --url http://localhost:8000
```

### Option 4: GitHub Actions (Automated)

Every push to GitHub triggers automated checks:

1. ✅ **Linting** - Code quality validation
2. ✅ **Type Checking** - TypeScript validation  
3. ✅ **Build Test** - Ensures your code builds successfully
4. ✅ **Docker Build** - Tests Docker deployment

**View build status:** https://github.com/Homelander3939/HRhubly/actions

## 🔄 Continuous Development Workflow

Here's how to continuously develop and preview your changes:

### 1️⃣ Make Changes Locally

```bash
# Create a new feature branch
git checkout -b feature/my-new-feature

# Start development server
pnpm dev

# Make your changes and see them live at http://localhost:3000
```

### 2️⃣ Test Your Changes

```bash
# Run linting
pnpm lint

# Check types
pnpm typecheck

# Format code
pnpm format

# Test production build
pnpm build
pnpm start
```

### 3️⃣ Commit and Push

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: add new feature description"

# Push to GitHub
git push origin feature/my-new-feature
```

### 4️⃣ Monitor CI/CD

After pushing, GitHub Actions will automatically:
- Run code quality checks
- Validate TypeScript types
- Test the build process
- Build Docker image

**Check status:** https://github.com/Homelander3939/HRhubly/actions

### 5️⃣ Create Pull Request

When ready:
1. Go to https://github.com/Homelander3939/HRhubly
2. Click "New Pull Request"
3. Select your feature branch
4. Fill in the description
5. Submit for review

### 6️⃣ Deploy

Once approved and merged:
- Your changes are in the main branch
- Ready for production deployment

## 📁 Project Structure Quick Reference

```
HRhubly/
├── src/
│   ├── routes/          # 📄 Pages (edit to change UI)
│   ├── server/
│   │   ├── trpc/        # 🔌 API endpoints
│   │   └── scripts/     # 🛠️ Utility scripts
│   └── components/      # 🧩 Reusable UI components
├── schema.prisma        # 🗄️ Database schema
├── .env                 # ⚙️ Environment variables (local)
└── docker/              # 🐳 Docker configuration
```

## 🎯 Common Tasks

### Add a New Page

1. Create file in `src/routes/`: e.g., `src/routes/my-page.tsx`
2. Page automatically available at: `/my-page`
3. Hot reload shows changes instantly

### Add API Endpoint

1. Edit `src/server/trpc/routers/` files
2. Endpoints available via tRPC client
3. Type-safe by default!

### Modify Database

1. Edit `schema.prisma`
2. Run: `pnpm db:push`
3. Changes applied to database

### Style Changes

- Using **TailwindCSS**
- Edit classes directly in components
- See changes instantly with hot reload

## 🔗 Important Links

- **Repository:** https://github.com/Homelander3939/HRhubly
- **Issues:** https://github.com/Homelander3939/HRhubly/issues
- **Actions (CI/CD):** https://github.com/Homelander3939/HRhubly/actions
- **Pull Requests:** https://github.com/Homelander3939/HRhubly/pulls

## 📚 Documentation

- **[README.md](./README.md)** - Project overview
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Detailed dev guide
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment instructions

## 💡 Quick Tips

### Hot Reload Not Working?
```bash
# Restart dev server
# Press Ctrl+C, then:
pnpm dev
```

### Port Already in Use?
```bash
# Use different port
PORT=3001 pnpm dev
```

### Need to Reset Database?
```bash
# Development only!
pnpm db:push --force-reset
```

### Clean Install?
```bash
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

## 🎨 Customizing Your App

### Branding
- App name: Edit `APP_NAME` in `.env`
- Colors: Edit `tailwind.config.mjs`
- Logo: Replace files in `public/`

### Features
- Enable/disable AI: Configure API keys in `.env`
- Email: Configure `RESEND_API_KEY` in `.env`

## 🐛 Troubleshooting

### Build Fails?
```bash
# Check for errors
pnpm typecheck
pnpm lint

# Clean and rebuild
rm -rf .output .vinxi
pnpm build
```

### Database Issues?
```bash
# Regenerate Prisma client
pnpm prisma generate

# Check connection
pnpm prisma db execute --stdin <<< "SELECT 1"
```

### Docker Issues?
```bash
# Restart all services
cd docker
docker-compose restart

# View logs
docker-compose logs -f app
```

## 🤖 AI-Powered Development

You mentioned wanting to continue prompting with AI! Here's how:

1. **Describe what you want** - "Add a new user profile page"
2. **AI writes the code** - Code is generated based on your requirements
3. **Preview immediately** - See it in your local dev server
4. **Iterate** - Keep refining with more prompts
5. **Push when ready** - Commit and push to GitHub

### Example Session:
```
You: "Add a dark mode toggle"
AI: [Generates code and shows preview]
You: "Make it save preference in localStorage"  
AI: [Updates code and shows preview]
You: "Perfect! Push to GitHub"
AI: [Commits and pushes changes]
```

## ✨ You're All Set!

Your development environment is ready. Here's what you can do now:

1. ✅ Clone the repository
2. ✅ Run `pnpm dev` for instant preview
3. ✅ Make changes and see them live
4. ✅ Push to GitHub for automated checks
5. ✅ Continue building your HR platform!

## 📞 Need Help?

- 📖 Read the docs linked above
- 🐛 Open an issue on GitHub
- 💬 Ask questions in pull requests
- 🤖 Continue prompting with AI assistance

---

**Remember:** Your repository at https://github.com/Homelander3939/HRhubly is the source of truth. All your work is version-controlled and safe!

Happy coding! 🚀✨
