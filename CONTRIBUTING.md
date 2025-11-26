# Contributing to env-type-generator

Thank you for your interest in contributing! We welcome contributions from the community.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Your environment (OS, Node version, package version)
- Any relevant logs or error messages

### Suggesting Enhancements

For feature requests or improvements:

- Open an issue describing the enhancement
- Explain why this feature would be useful
- Provide examples of how it would work

### Pull Requests

1. **Fork the repository** and create your branch from `master`
2. **Install dependencies**: `npm install`
3. **Make your changes** following our coding standards
4. **Add tests** for any new functionality
5. **Run the test suite**: `npm test`
6. **Ensure linting passes**: `npm run lint`
7. **Check formatting**: `npm run format:check`
8. **Build the project**: `npm run build`
9. **Commit your changes** with a clear commit message
10. **Push to your fork** and submit a pull request

#### CI Checks

All pull requests must pass automated CI checks:

- ✅ ESLint and Prettier formatting
- ✅ TypeScript type checking
- ✅ Test suite (Node 16, 18, 20)
- ✅ Build verification
- ✅ Integration tests
- ✅ Dependency review
- ✅ CodeQL security analysis

You can run all checks locally:

```bash
npm run lint && npm run format:check && npm run type-check && npm test && npm run build
```

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/env-type-generator.git
cd env-type-generator

# Install dependencies
npm install

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Build the project
npm run build
```

## Coding Standards

- **TypeScript**: Use strict type checking, avoid `any` types
- **Clean Code**: Follow SOLID principles and keep functions small
- **Testing**: Maintain >90% code coverage
- **Comments**: Use JSDoc for public APIs
- **Formatting**: Code is formatted with Prettier
- **Linting**: Follow ESLint rules configured in the project

## Project Structure

```
src/
├── cli.ts                    # CLI entry point
├── index.ts                  # Library entry point
├── parsers/                  # .env file parsers
│   └── env-parser.ts
├── generators/               # Type and validation generators
│   ├── type-generator.ts
│   └── validation-generator.ts
├── services/                 # Core services
│   ├── generator-service.ts
│   └── file-watcher.ts
├── types/                    # TypeScript type definitions
│   └── index.ts
└── utils/                    # Utility functions
    └── errors.ts
```

## Testing Guidelines

- Write unit tests for all new functionality
- Use descriptive test names following "should..." pattern
- Follow Arrange-Act-Assert pattern
- Mock external dependencies appropriately
- Test both success and error cases

Example test:

```typescript
it('should parse environment variables correctly', () => {
  // Arrange
  const envContent = 'KEY=value';

  // Act
  const result = parser.parse(envContent);

  // Assert
  expect(result).toEqual({ KEY: 'value' });
});
```

## Commit Message Guidelines

- Use clear, descriptive commit messages
- Start with a verb in present tense (add, fix, update, refactor)
- Keep the first line under 72 characters
- Add detailed description if needed

Examples:

- `Add support for multiline environment variables`
- `Fix parsing of quoted values with escape sequences`
- `Update documentation for watch mode`

## Review Process

1. All pull requests require review before merging
2. **Ensure all CI checks pass** - PRs with failing checks won't be merged
3. Address any feedback from reviewers
4. Keep your branch up to date with master
5. Squash commits if requested

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration:

- **Continuous Integration**: Runs on all PRs and pushes to main
- **Publish Workflow**: Triggered on GitHub releases
- **Security Scanning**: CodeQL runs weekly and on PRs
- **Dependency Review**: Automated security checks on dependency changes

View workflow status: [Actions](https://github.com/kitium-ai/env-type-generator/actions)

## Questions?

Feel free to open an issue for any questions about contributing!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
