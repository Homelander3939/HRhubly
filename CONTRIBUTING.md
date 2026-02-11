# Contributing to HRhubly

Thank you for your interest in contributing to HRhubly! This document provides guidelines and instructions for contributing to this project.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/HRhubly.git
   cd HRhubly
   ```
3. **Add the upstream repository**:
   ```bash
   git remote add upstream https://github.com/Homelander3939/HRhubly.git
   ```
4. **Create a new branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 💻 Development Workflow

### Setting Up Your Development Environment

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

3. **Start the development environment:**
   ```bash
   # Option 1: Using Docker (recommended)
   cd docker
   docker-compose up -d
   cd ..
   
   # Option 2: Local development
   pnpm dev
   ```

### Making Changes

1. **Write clean, maintainable code** following the project's style guide
2. **Test your changes** thoroughly in the local environment
3. **Run linting and type checking:**
   ```bash
   pnpm lint
   pnpm typecheck
   ```
4. **Format your code:**
   ```bash
   pnpm format
   ```

### Code Style Guidelines

- **TypeScript:** Use strict TypeScript with proper types
- **Components:** Use functional components with React hooks
- **Naming:** 
  - Components: PascalCase (e.g., `UserProfile.tsx`)
  - Functions: camelCase (e.g., `getUserData`)
  - Constants: UPPER_CASE (e.g., `MAX_UPLOAD_SIZE`)
- **Imports:** Group and order imports (built-in, external, internal)
- **Comments:** Write clear comments for complex logic

### Commit Messages

Write clear, descriptive commit messages:

```
<type>: <subject>

<body (optional)>

<footer (optional)>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat: add candidate filtering by skills

fix: resolve email sending issue for password reset

docs: update API documentation for user endpoints
```

## 🧪 Testing

Before submitting your changes:

1. **Test locally:**
   ```bash
   pnpm dev
   # Manually test your feature in the browser
   ```

2. **Check for type errors:**
   ```bash
   pnpm typecheck
   ```

3. **Run linting:**
   ```bash
   pnpm lint
   ```

4. **Test database migrations** (if you modified the schema):
   ```bash
   pnpm db:push
   ```

## 📤 Submitting Changes

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

2. **Keep your branch updated:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

3. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request:**
   - Go to the repository on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template with:
     - Description of changes
     - Related issues (if any)
     - Screenshots (for UI changes)
     - Testing steps

## 🔍 Pull Request Guidelines

- **Title:** Clear and descriptive
- **Description:** Explain what, why, and how
- **Small PRs:** Keep PRs focused and manageable
- **Tests:** Include tests if applicable
- **Documentation:** Update docs if needed
- **Screenshots:** Include for UI changes
- **Breaking Changes:** Clearly document any breaking changes

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **Description:** Clear description of the issue
2. **Steps to reproduce:** Detailed steps
3. **Expected behavior:** What should happen
4. **Actual behavior:** What actually happens
5. **Environment:**
   - OS and version
   - Node.js version
   - Browser (if applicable)
6. **Screenshots:** If relevant
7. **Logs:** Any error messages or logs

## 💡 Feature Requests

When requesting features:

1. **Use case:** Explain the problem you're trying to solve
2. **Proposed solution:** Describe your idea
3. **Alternatives:** Any alternative solutions you've considered
4. **Additional context:** Screenshots, mockups, etc.

## 📁 Project Structure

```
HRhubly/
├── src/
│   ├── routes/              # React Router pages
│   │   ├── index.tsx        # Home page
│   │   ├── login.tsx        # Login page
│   │   └── admin/           # Admin routes
│   ├── server/
│   │   ├── trpc/            # tRPC API routes
│   │   │   ├── routers/     # API route handlers
│   │   │   └── context.ts   # tRPC context
│   │   ├── scripts/         # Utility scripts
│   │   └── env.ts           # Environment validation
│   ├── components/          # Reusable components
│   └── generated/           # Generated code (don't edit)
├── docker/                  # Docker configuration
├── public/                  # Static assets
├── schema.prisma            # Database schema
└── app.config.ts            # App configuration
```

## 🛠 Technology Stack

Understanding the tech stack will help you contribute:

- **Frontend:** React 19, TanStack Router
- **State Management:** TanStack Query, Zustand
- **Backend:** tRPC (type-safe API)
- **Database:** PostgreSQL with Prisma ORM
- **Styling:** TailwindCSS
- **Forms:** React Hook Form + Zod
- **Rich Text:** TipTap
- **AI:** OpenAI, Anthropic, Google AI SDKs

## 📝 Documentation

When adding new features:

1. Update relevant documentation
2. Add JSDoc comments for public APIs
3. Update README.md if needed
4. Add examples for complex features

## ⚡ Performance Considerations

- Optimize database queries
- Use pagination for large datasets
- Implement proper caching
- Lazy load components when appropriate
- Optimize images and assets

## 🔐 Security

- Never commit sensitive data (API keys, passwords)
- Use environment variables for secrets
- Validate all user inputs
- Sanitize data to prevent XSS
- Follow authentication best practices
- Report security vulnerabilities privately

## 🤔 Questions?

If you have questions:

1. Check existing documentation
2. Search existing issues
3. Open a new issue with the "question" label
4. Ask in discussions (if enabled)

## 📜 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on what's best for the community

## 🙏 Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort!
