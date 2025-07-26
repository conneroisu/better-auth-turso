# Contributing to Better Auth Turso

Thank you for your interest in contributing to Better Auth Turso! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Code Style](#code-style)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards

- Be respectful and inclusive
- Focus on constructive feedback
- Accept responsibility for mistakes
- Show empathy towards other community members

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (latest version)
- [Docker](https://docker.com) (optional, for containerized development)
- [Git](https://git-scm.com)
- [Node.js](https://nodejs.org) 18+ (if not using Bun)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/better-auth-turso.git
   cd better-auth-turso
   ```

## Development Setup

### Local Development

1. Install dependencies:
   ```bash
   bun install
   ```

2. Install example dependencies:
   ```bash
   cd examples/nextjs
   bun install
   cd ../..
   ```

3. Build the adapter:
   ```bash
   bun run build
   ```

4. Start development:
   ```bash
   # Watch mode for adapter
   bun run dev

   # Run Next.js example
   cd examples/nextjs
   bun dev
   ```

### Docker Development

Use the provided Docker setup for a consistent development environment:

```bash
# Start development environment
./docker-dev.sh dev

# Or use docker-compose directly
docker-compose --profile dev up --build
```

## Making Changes

### Branch Naming

Use descriptive branch names:
- `feature/add-pagination-support`
- `fix/session-timeout-issue`
- `docs/update-readme`
- `refactor/simplify-error-handling`

### Commit Messages

Follow conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(adapter): add support for custom field mapping
fix(session): resolve session expiry calculation bug
docs(readme): update installation instructions
```

### Making Your Changes

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the [code style guidelines](#code-style)

3. Add or update tests as needed

4. Update documentation if your changes affect the public API

5. Ensure all tests pass:
   ```bash
   bun run test
   ```

6. Check code quality:
   ```bash
   bun run lint
   bun run format:check
   bun run typecheck
   ```

## Testing

We maintain high test coverage. Please include tests for new features and bug fixes.

### Running Tests

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage

# Run specific test file
bun test __tests__/turso-adapter.test.ts
```

### Test Structure

- **Unit tests**: Test individual functions and classes
- **Integration tests**: Test adapter with Better Auth
- **Example tests**: Test the Next.js example application

### Writing Tests

1. Place tests in the `__tests__` directory
2. Use descriptive test names
3. Follow the Arrange-Act-Assert pattern
4. Mock external dependencies
5. Test both happy paths and error cases

Example test structure:
```typescript
import { expect, test, describe } from "vitest";
import { tursoAdapter } from "../src/index";

describe("TursoAdapter", () => {
  describe("Configuration", () => {
    test("should create adapter with client", () => {
      // Arrange
      const client = createTestClient();
      
      // Act
      const adapter = tursoAdapter({ client });
      
      // Assert
      expect(adapter.config.adapterId).toBe("turso-adapter");
    });
  });
});
```

## Submitting Changes

### Pull Request Process

1. Push your changes to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Create a pull request on GitHub with:
   - Clear title and description
   - Reference to any related issues
   - Screenshots for UI changes
   - Test coverage information

3. Ensure all CI checks pass

4. Request review from maintainers

### Pull Request Guidelines

- Keep PRs focused and atomic
- Include tests for new functionality
- Update documentation as needed
- Follow the existing code style
- Write clear commit messages

### Review Process

1. Automated checks must pass (CI/CD)
2. Code review by at least one maintainer
3. All feedback must be addressed
4. Final approval from a maintainer
5. Merge (squash and merge preferred)

## Code Style

We use a consistent code style across the project.

### TypeScript Guidelines

- Use TypeScript strict mode
- Prefer explicit types over `any`
- Use meaningful variable and function names
- Follow the existing naming conventions

### Formatting

We use Prettier for code formatting:
```bash
# Format code
bun run format

# Check formatting
bun run format:check
```

### Linting

We use ESLint for code quality:
```bash
# Run linter
bun run lint

# Fix lint issues
bun run lint:fix
```

### Style Principles

Following "Your Style" philosophy:

1. **Safety**: Write code that works in all situations
   - Use explicit types and bounds checking
   - Handle errors gracefully
   - Validate inputs and outputs

2. **Performance**: Optimize for speed and efficiency
   - Design for performance early
   - Use appropriate data structures
   - Profile and optimize bottlenecks

3. **Developer Experience**: Write maintainable code
   - Use clear, descriptive names
   - Keep functions focused and small
   - Document complex logic

### Code Examples

**Good:**
```typescript
export const createUserSession = async (
  client: Client,
  userId: string,
  expiresInMs: number
): Promise<Session> => {
  if (!userId) {
    throw new Error("User ID is required");
  }
  
  if (expiresInMs <= 0) {
    throw new Error("Expiration must be positive");
  }
  
  const expiresAt = new Date(Date.now() + expiresInMs);
  
  // Rest of implementation...
};
```

**Avoid:**
```typescript
export const createSess = async (c: any, u: string, exp: number) => {
  // Unclear names, no validation
  const e = new Date(Date.now() + exp);
  // ...
};
```

## Release Process

Releases are automated through GitHub Actions:

1. Version bump:
   ```bash
   npm version patch|minor|major
   ```

2. Push tags:
   ```bash
   git push --tags
   ```

3. GitHub Actions will:
   - Run all tests
   - Build the package
   - Publish to NPM
   - Create GitHub release

## Questions and Support

- **Documentation**: Check the README and inline documentation
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Security**: Email security@yourproject.com for security issues

## Recognition

Contributors are recognized in:
- GitHub contributor graphs
- Release notes
- README acknowledgments

Thank you for contributing to Better Auth Turso! 🎉