# HRhubly - Modern HR Management Platform

A comprehensive HR management system built with React, TypeScript, TanStack Router, tRPC, and Prisma. This platform provides features for candidate management, test administration, vacancy management, and AI-powered resume analysis.

---

## 🌐 **QUICK ACCESS: Get a Public Preview Link NOW!**

**Want to access your HR platform from ANY browser, ANY device, ANYWHERE?**

```bash
# Just run this single command:
pnpm quick-preview
```

🎉 **You'll get a public URL like: `https://your-app.trycloudflare.com`**

✅ No localhost limitations  
✅ No Docker complexity  
✅ No complex setup  
✅ Just works from anywhere!

**📖 See [SIMPLE_PREVIEW_GUIDE.md](./SIMPLE_PREVIEW_GUIDE.md) for full instructions**

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- pnpm (recommended) or npm
- Docker and Docker Compose (for full environment)
- PostgreSQL 16+ (if running without Docker)
- Redis 7+ (if running without Docker)
- MinIO (for file storage, if running without Docker)

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Homelander3939/HRhubly.git
   cd HRhubly
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start with Docker (Recommended):**
   ```bash
   cd docker
   docker-compose up -d
   ```
   
   The application will be available at:
   - App: http://localhost:8000
   - Adminer (DB Admin): http://localhost:8000/adminer
   - MinIO Console: http://localhost:9001

5. **Or run locally without Docker:**
   ```bash
   # Make sure PostgreSQL, Redis, and MinIO are running
   pnpm db:push
   pnpm dev
   ```
   
   The application will be available at http://localhost:3000

## 🛠 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm db:generate` - Generate Prisma migration
- `pnpm db:migrate` - Run Prisma migrations
- `pnpm db:push` - Push schema to database (dev)
- `pnpm db:studio` - Open Prisma Studio

## 📁 Project Structure

```
HRhubly/
├── src/
│   ├── routes/          # TanStack Router pages
│   ├── server/          # Server-side code
│   │   ├── trpc/        # tRPC API routes
│   │   ├── scripts/     # Utility scripts
│   │   └── env.ts       # Environment validation
│   └── generated/       # Generated code (routes, etc.)
├── docker/              # Docker configuration
├── public/              # Static assets
├── schema.prisma        # Database schema
└── app.config.ts        # Vinxi app configuration
```

## 🔧 Technology Stack

- **Frontend:** React 19, TanStack Router, TanStack Query
- **Backend:** tRPC, Vinxi
- **Database:** PostgreSQL with Prisma ORM
- **Storage:** MinIO (S3-compatible)
- **Cache:** Redis
- **Styling:** TailwindCSS
- **AI Integration:** OpenAI, Anthropic, Google AI
- **Forms:** React Hook Form with Zod validation
- **Rich Text:** TipTap
- **Authentication:** JWT with bcrypt

## 🌐 Public Preview Access

### Get a Public URL for Your Development Environment

Want to access your HR platform from any browser and see changes in real-time? Use our public preview setup!

**Quick Start:**

```bash
# Run the setup script
./scripts/start-public-preview.sh   # Linux/macOS
# or
scripts\start-public-preview.bat    # Windows
```

This will create a public URL (like `https://your-app.trycloudflare.com`) that you can:
- 🌍 Access from any browser, anywhere
- 📱 Test on mobile devices
- 🔄 See code changes in real-time (hot reload)
- 👥 Share with others for feedback

**📖 See [PUBLIC_PREVIEW.md](./PUBLIC_PREVIEW.md) for detailed setup instructions.**

### Local Preview

To preview the production build locally:

```bash
pnpm build
pnpm start
```

## 🤝 Contributing

1. Create a new branch for your feature: `git checkout -b feature/your-feature-name`
2. Make your changes and test thoroughly
3. Run linting and type checking: `pnpm lint && pnpm typecheck`
4. Commit your changes: `git commit -am 'Add new feature'`
5. Push to the branch: `git push origin feature/your-feature-name`
6. Create a Pull Request

## 📝 Environment Variables

See `.env.example` for required environment variables. Key variables include:

- `DATABASE_URL` - PostgreSQL connection string
- `BASE_URL` - Application base URL
- `JWT_SECRET` - Secret for JWT token generation
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `RESEND_API_KEY` - Email service API key
- `MINIO_*` - MinIO configuration for file storage

## 🐛 Debugging

### Check Application Logs
```bash
# If using Docker
docker-compose logs -f app

# View specific service
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Database Access
Use Adminer at http://localhost:8000/adminer or run:
```bash
pnpm db:studio
```

## 📚 Documentation

This project has comprehensive documentation to help you get started and work effectively:

### Getting Started
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide with preview environment setup
- **[README.md](./README.md)** - This file - project overview and basics

### Development
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Complete developer guide and best practices
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute to the project

### Public Preview (Access from Anywhere) 🌐
- **[PUBLIC_PREVIEW.md](./PUBLIC_PREVIEW.md)** - Full guide to creating public preview links
- **[PUBLIC_PREVIEW_EXAMPLES.md](./PUBLIC_PREVIEW_EXAMPLES.md)** - Real-world usage examples
- **[PUBLIC_PREVIEW_QUICKREF.md](./PUBLIC_PREVIEW_QUICKREF.md)** - Quick reference card

**TL;DR:** Run `pnpm preview` to get a public URL you can access from any device!

### Deployment
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide for various platforms
- **[CREDENTIALS.md](./CREDENTIALS.md)** - Credentials and access information

### Links & Setup
- **[LINKS_AND_PREVIEW.txt](./LINKS_AND_PREVIEW.txt)** - Quick reference for all important links

## 📧 Email Configuration

The platform includes email functionality for notifications and password resets. Configure your email service (Resend recommended) in the `.env` file.

## 🔐 Security

- Never commit `.env` files
- Use strong JWT secrets in production
- Keep dependencies updated
- Follow security best practices for authentication

## 📄 License

This project is private and proprietary.

## 🔗 Links

- Repository: https://github.com/Homelander3939/HRhubly
- Issues: https://github.com/Homelander3939/HRhubly/issues

## 💬 Support

For questions or issues, please open an issue on GitHub or contact the development team.
