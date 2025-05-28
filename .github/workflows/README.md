# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated testing and continuous integration.

## Workflows

### `test.yml` - Basic Test Runner
- **Triggers**: Push to main/master branch, Pull Requests
- **Purpose**: Runs Jest tests on multiple Node.js versions (18.x, 20.x, 22.x)
- **Matrix Testing**: Ensures compatibility across different Node.js versions
- **Artifacts**: Uploads test coverage reports if available

### `ci.yml` - Comprehensive CI Pipeline  
- **Triggers**: Push to main/master branch, Pull Requests
- **Purpose**: Complete CI pipeline with testing, linting, and validation
- **Features**:
  - Runs tests on Node.js 20.x
  - Optional linting (if lint script exists in package.json)
  - Optional CSS building (if build:css script exists)  
  - File validation to ensure core files exist
  - Matrix testing on multiple Node.js versions (18.x, 20.x, 22.x)

## Status Badges

The workflow status badges in the main README.md will show:
- ✅ Green: All tests passing
- ❌ Red: Tests failing  
- 🟡 Yellow: Tests running

## Local Testing

Before pushing, you can run the same tests locally:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch

# Run CI checks (same as GitHub Actions)
npm run ci
```

## Important Notes

- Tests must pass before merging to main/master
- The workflows use `npm ci` for faster, reliable installs
- Node.js 20.x is used for the main CI job for consistency
- Coverage reports are only uploaded once per workflow run 