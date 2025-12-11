# Contributing to Fahrdienst App

Thank you for your interest in contributing to the Fahrdienst App! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites
- Docker & Docker Compose (recommended)
- OR Node.js v18+ and PostgreSQL v14+ (for local development)
- Git
- A code editor (VS Code recommended)

### Setting Up Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/FahrdienstApp.git
   cd FahrdienstApp
   ```

2. **Start with Docker**
   ```bash
   docker-compose up -d
   ```

3. **Or setup manually**
   ```bash
   # Backend
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npm run dev

   # Frontend (in new terminal)
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```

## Development Workflow

### Branch Naming Convention
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates

### Making Changes

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the code style guidelines (see below)
   - Write/update tests if applicable
   - Update documentation if needed

3. **Test your changes**
   ```bash
   # Backend tests
   cd backend
   npm test

   # Frontend tests
   cd frontend
   npm test

   # Or test in Docker
   docker-compose up -d --build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push and create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Code Style Guidelines

### TypeScript

- Use **type-only imports** for types:
  ```typescript
  // ✅ Correct
  import { myFunction, type MyType } from './module';

  // ❌ Wrong
  import { myFunction, MyType } from './module';
  ```

- Use explicit return types for functions
- Prefer `const` over `let` when possible
- Use async/await instead of promises chains

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use meaningful component and variable names
- Extract reusable logic into custom hooks

### Backend

- Follow RESTful API conventions
- Use proper HTTP status codes
- Validate input data
- Handle errors gracefully with try/catch
- Use meaningful variable and function names

### Database

- Use parameterized queries (prevent SQL injection)
- Add indexes for frequently queried fields
- Document complex queries with comments

## Commit Message Format

Follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(trips): add distance calculation for trips
fix(auth): resolve JWT token expiration issue
docs(readme): update Docker setup instructions
refactor(api): simplify patient routes
```

## Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:coverage
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

### E2E Tests
```bash
# Start the app first
docker-compose up -d

# Run E2E tests (when implemented)
npm run test:e2e
```

## Pull Request Process

1. **Update documentation** if you changed APIs or added features
2. **Add tests** for new functionality
3. **Ensure all tests pass** before submitting
4. **Update CHANGELOG.md** with your changes
5. **Fill out the PR template** with:
   - Description of changes
   - Related issues
   - Screenshots (if UI changes)
   - Testing done

6. **Request review** from maintainers
7. **Address review comments** promptly
8. **Squash commits** if requested before merging

## Code Review Guidelines

### For Reviewers
- Be respectful and constructive
- Focus on code quality and maintainability
- Check for security issues
- Verify tests are adequate
- Ensure documentation is updated

### For Contributors
- Respond to feedback professionally
- Don't take criticism personally
- Ask questions if feedback is unclear
- Make requested changes promptly

## Project Structure

```
FahrdienstApp/
├── backend/          # Node.js + Express backend
│   ├── src/
│   │   ├── database/ # Database connection and schema
│   │   ├── models/   # TypeScript type definitions
│   │   ├── routes/   # API route handlers
│   │   └── server.ts # Main server file
│   └── Dockerfile
├── frontend/         # React + TypeScript frontend
│   ├── src/
│   │   ├── pages/    # Page components
│   │   ├── services/ # API communication
│   │   └── App.tsx   # Main app component
│   ├── nginx.conf    # Nginx configuration
│   └── Dockerfile
└── docker-compose.yml
```

## Adding New Features

### Adding a New API Endpoint

1. **Define types** in `backend/src/models/types.ts`
2. **Create route handler** in `backend/src/routes/`
3. **Register route** in `backend/src/server.ts`
4. **Update API documentation** in README
5. **Add tests** for the endpoint

### Adding a New Frontend Page

1. **Create component** in `frontend/src/pages/`
2. **Add route** in `frontend/src/App.tsx`
3. **Update navigation** in navbar
4. **Add API service** in `frontend/src/services/api.ts`
5. **Style the component** using existing CSS patterns

### Database Schema Changes

1. **Update** `backend/src/database/schema.sql`
2. **Add migration** if needed
3. **Update TypeScript types** in `backend/src/models/types.ts`
4. **Document changes** in CHANGELOG.md
5. **Test with fresh database** initialization

## Security

### Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities.

Instead, email security concerns to: [security@example.com]

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Security Checklist for PRs

- [ ] No secrets or credentials in code
- [ ] Input validation implemented
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention
- [ ] CSRF protection where needed
- [ ] Proper error handling (no sensitive data in errors)
- [ ] Authentication/authorization checked

## Questions?

- Check the [README](README.md)
- Look at existing code for examples
- Ask in pull request comments
- Contact the maintainers

## License

By contributing, you agree that your contributions will be licensed under the ISC License.

---

Thank you for contributing to Fahrdienst App! 🚀
