# GitHub Actions Workflows

This directory contains automated workflows for CI/CD, security, and quality checks.

## Workflows Overview

### 1. CI Workflow (`ci.yml`)

**Triggers:** Push and Pull Requests to `main`/`master` branches

**Jobs:**

- **Lint**: ESLint and Prettier formatting checks
- **Type Check**: TypeScript compilation validation
- **Test**: Unit tests across Node.js versions (16, 18, 20) and OS (Ubuntu, Windows, macOS)
  - Uploads coverage to Codecov
- **Build**: Verifies project builds successfully
- **Integration**: End-to-end CLI testing
  - Tests type generation
  - Tests type parsing
  - Tests Zod validation generation
- **All Checks**: Summary job ensuring all checks passed

**Status Badge:**

```markdown
[![CI](https://github.com/kitium-ai/env-type-generator/actions/workflows/ci.yml/badge.svg)](https://github.com/kitium-ai/env-type-generator/actions/workflows/ci.yml)
```

### 2. Publish Workflow (`publish.yml`)

**Triggers:**

- GitHub Release published
- Manual dispatch with tag input

**Process:**

1. Runs all quality checks (lint, type-check, test)
2. Builds the project
3. Publishes to npm with provenance
4. Creates deployment summary

**Requirements:**

- `NPM_TOKEN` secret must be configured in repository settings
- Package name: `@kitiumai/env-type-generator`
- Access: Public with npm provenance for supply chain security

**Manual Publishing:**

1. Go to Actions tab
2. Select "Publish to NPM" workflow
3. Click "Run workflow"
4. Enter the git tag to publish

### 3. CodeQL Analysis (`codeql.yml`)

**Triggers:**

- Push to `main`/`master`
- Pull Requests
- Weekly schedule (every Monday)

**Purpose:**

- Static code analysis for security vulnerabilities
- JavaScript/TypeScript security scanning
- Runs security-and-quality queries

**Benefits:**

- Automated vulnerability detection
- Security alerts in GitHub Security tab
- Proactive security monitoring

### 4. Dependency Review (`dependency-review.yml`)

**Triggers:** Pull Requests to `main`/`master`

**Features:**

- Reviews dependency changes in PRs
- Fails on moderate or higher severity vulnerabilities
- Adds comment summary to pull requests
- Helps prevent supply chain attacks

## Setup Requirements

### Repository Secrets

Add these secrets in repository settings (Settings → Secrets and variables → Actions):

```
NPM_TOKEN - Your npm authentication token for publishing
```

To create an npm token:

1. Login to npmjs.com
2. Go to Access Tokens
3. Generate New Token → Automation
4. Copy token and add to GitHub secrets

### Repository Permissions

Ensure the following permissions are enabled:

- **Actions**: Read and write permissions
- **Contents**: Read access
- **Pull Requests**: Write access (for dependency review comments)
- **Security Events**: Write access (for CodeQL)

### Branch Protection

Recommended branch protection rules for `main`/`master`:

- ✅ Require status checks before merging
- ✅ Require branches to be up to date
- ✅ Require linear history
- ✅ Status checks required:
  - `Lint`
  - `Type Check`
  - `Test (Node 20 on ubuntu-latest)`
  - `Build`
  - `Integration Test`
  - `Dependency Review`

## Local Development

Run the same checks locally before pushing:

```bash
# Run all checks
npm run lint && npm run format:check && npm run type-check && npm test && npm run build

# Or individually
npm run lint              # ESLint
npm run format:check      # Prettier
npm run type-check        # TypeScript
npm test                  # Jest tests
npm run build            # Build project
```

## Workflow Status

View all workflow runs: [Actions](https://github.com/kitium-ai/env-type-generator/actions)

## Troubleshooting

### CI Failing

1. Check the workflow logs in the Actions tab
2. Run checks locally to reproduce
3. Ensure all dependencies are up to date: `npm ci`

### Publish Failing

1. Verify `NPM_TOKEN` secret is configured
2. Check npm token hasn't expired
3. Ensure package.json version is updated
4. Verify you have publish permissions to `@kitiumai` scope

### CodeQL Alerts

1. View alerts in Security → Code scanning alerts
2. Review the alert details and remediation steps
3. Fix the vulnerability in your code
4. The alert will auto-close on next scan

## Maintenance

### Updating Workflows

- Test workflow changes in a fork first
- Use `workflow_dispatch` for manual testing
- Monitor Actions tab for any failures

### Updating Node Versions

Edit the matrix in `ci.yml`:

```yaml
matrix:
  node-version: [16, 18, 20] # Update versions here
```

### Updating Dependencies

- Dependabot is recommended for automatic updates
- Review dependency-review alerts on PRs
- Test thoroughly after updating

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm Provenance](https://docs.npmjs.com/generating-provenance-statements)
- [CodeQL](https://codeql.github.com/)
- [Dependency Review](https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-dependency-review)
