# Contributing to Better Auth Turso Adapter

Thank you for your interest in contributing to the Better Auth Turso Adapter! This document provides guidelines for contributing to this project.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct (see CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/better-auth-turso.git
   cd better-auth-turso
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Tests**
   ```bash
   npm test
   ```

4. **Build the Project**
   ```bash
   npm run build
   ```

### Project Structure

```
better-auth-turso/
├── src/                    # Source code
│   ├── index.ts           # Main adapter implementation
│   ├── *.test.ts          # Test files
│   └── test-setup.ts      # Test configuration
├── examples/              # Example applications
│   └── nextjs/           # Next.js example
├── dist/                 # Built output (generated)
├── docs/                 # Documentation
└── .github/              # GitHub workflows
```

## Development Workflow

### 1. Create a Branch

Create a new branch for your feature or bug fix:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Changes

- Follow the existing code style and patterns
- Write tests for new functionality
- Update documentation as needed
- Ensure TypeScript types are properly defined

### 3. Test Your Changes

Run the full test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

### 4. Test with Examples

Test your changes with the Next.js example:

```bash
cd examples/nextjs
npm install
npm run build
```

### 5. Commit Your Changes

We use conventional commits for clear commit messages:

```bash
# Feature
git commit -m "feat: add support for custom table naming"

# Bug fix  
git commit -m "fix: resolve connection timeout issue"

# Documentation
git commit -m "docs: update README with new configuration options"

# Test
git commit -m "test: add integration tests for schema generation"
```

### 6. Push and Create PR

```bash
git push origin your-branch-name
```

Then create a Pull Request through GitHub.

## Coding Standards

### TypeScript

- Use strict TypeScript settings
- Provide proper type definitions for all public APIs
- Avoid `any` types when possible
- Use meaningful variable and function names

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use double quotes for strings
- Follow existing patterns in the codebase

### Documentation

- Document all public APIs with JSDoc comments
- Keep README files up to date
- Add inline comments for complex logic
- Update examples when adding new features

## Testing Guidelines

### Unit Tests

- Write unit tests for all new functionality
- Aim for high test coverage (>90%)
- Use descriptive test names
- Group related tests with `describe` blocks

```typescript
describe("TursoAdapter Configuration", () => {
  test("should throw error when neither client nor config is provided", () => {
    expect(() => tursoAdapter({})).toThrow();
  });
  
  test("should accept valid client configuration", () => {
    const client = createClient({ url: ":memory:" });
    expect(() => tursoAdapter({ client })).not.toThrow();
  });
});
```

### Integration Tests

- Test real database operations
- Test compatibility with Better Auth
- Use in-memory databases for testing
- Clean up after tests

### Testing with Better Auth

When adding new features, ensure they work with Better Auth:

```typescript
import { runAdapterTest } from "better-auth/adapters/test";

describe("Better Auth Compatibility", () => {
  await runAdapterTest({
    getAdapter: async () => tursoAdapter({ /* config */ }),
  });
});
```

## Documentation

### README Updates

When adding features, update:
- Installation instructions
- Configuration options
- Usage examples
- API documentation

### JSDoc Comments

Use JSDoc for public APIs:

```typescript
/**
 * Creates a Turso database adapter for Better Auth
 * @param config - Configuration options for the adapter
 * @returns Better Auth compatible database adapter
 */
export const tursoAdapter = (config: TursoAdapterConfig) => {
  // implementation
};
```

## Submitting Pull Requests

### PR Guidelines

1. **Clear Title**: Use descriptive titles that explain what the PR does
2. **Description**: Explain what changes were made and why
3. **Testing**: Describe how you tested the changes
4. **Breaking Changes**: Clearly mark any breaking changes
5. **Documentation**: Update docs if needed

### PR Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Tested with Next.js example

## Checklist
- [ ] Code follows the style guidelines
- [ ] Self-review of code completed
- [ ] Documentation updated
- [ ] No new warnings introduced
```

## Release Process

Releases are automated through GitHub Actions:

1. **Version Bump**: Update version in `package.json`
2. **Changelog**: Update `CHANGELOG.md` with changes
3. **Tag**: Create and push a version tag
4. **Automated**: CI will run tests and publish to npm

## Getting Help

### Community

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and community discussion
- **Discord**: Join the Better Auth community

### Maintainers

Current maintainers:
- [@username](https://github.com/username) - Primary maintainer

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- GitHub contributors page

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to Better Auth Turso Adapter! 🎉