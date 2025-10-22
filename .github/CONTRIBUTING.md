# Contributing to Dayflow Planner

Thank you for your interest in contributing to Dayflow Planner! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js 20 or higher
- pnpm 8 or higher
- Git

### Setup

1. Fork the repository
2. Clone your fork locally
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
5. Start the development server:
   ```bash
   pnpm dev
   ```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-fix-name
```

### 2. Make Changes

- Follow the existing code style and conventions
- Write tests for new functionality
- Update documentation if needed

### 3. Run Tests and Checks

```bash
pnpm lint          # Check code style
pnpm type-check    # TypeScript type checking
pnpm test          # Run unit tests
pnpm test:e2e      # Run E2E tests
pnpm build         # Ensure build succeeds
```

### 4. Commit Changes

Use conventional commits:

```
feat: add new feature
fix: resolve bug
docs: update documentation
style: code formatting changes
refactor: code refactoring
test: add or update tests
chore: maintenance tasks
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

## Code Style Guidelines

### TypeScript

- Use strict TypeScript mode
- Provide explicit types for function parameters and return values
- Prefer interfaces over types for object shapes
- Use `const` assertions for readonly objects

### React Components

- Use functional components with hooks
- Follow the existing component structure
- Use `cn()` utility for conditional Tailwind classes
- Implement proper error boundaries

### CSS/Styling

- Use Tailwind CSS classes
- Follow the existing design system
- Use responsive design patterns
- Ensure accessibility (ARIA labels, semantic HTML)

### Testing

- Write unit tests for new features
- Test components with React Testing Library
- Use Playwright for E2E tests
- Aim for high test coverage

## Pull Request Guidelines

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] Build succeeds without errors
- [ ] Documentation is updated
- [ ] Commit messages follow conventional commits

### Pull Request Template

Use the provided PR template and include:

- Clear description of changes
- Type of change (bug fix, feature, etc.)
- Testing information
- Screenshots if applicable

## Branch Naming

- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation changes
- `refactor/code-refactoring` - Code refactoring
- `test/test-improvements` - Test improvements

## Issue Reporting

### Bug Reports

Use the bug report template and include:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment information
- Screenshots if applicable

### Feature Requests

Use the feature request template and include:

- Problem description
- Proposed solution
- Acceptance criteria
- Implementation considerations

## Code Review Process

1. Automated checks must pass
2. At least one maintainer review required
3. Address all review comments
4. Update PR based on feedback
5. Maintain approval before merge

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create git tag
4. GitHub Actions will automatically create release

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Assume good intentions

### Communication

- Use GitHub issues for bug reports and feature requests
- Use discussions for questions and ideas
- Be patient with response times

## Getting Help

- Check existing issues and discussions
- Read the documentation
- Ask questions in GitHub discussions
- Join our community Discord (link in README)

## Recognition

Contributors are recognized in:

- README.md contributors section
- Release notes
- Annual contributor highlights

Thank you for contributing to Dayflow Planner! 🎉