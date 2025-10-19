# Agent Guidelines for Dayflow Planner

## Tools
- When you need to search docs, use `context7` tools.
- If you are unsure how to do something, use `gh_grep` to search code examples from github.
- When you need to look at a webpage, console log or analyze performance use `chrome-devtools`.

## Build & Test Commands
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking
- `pnpm test` - Run all unit tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test path/to/test.test.tsx` - Run single test file
- `pnpm test:e2e` - Run Playwright E2E tests
- `pnpm db:push` - Push schema changes to database

## Code Style Guidelines

### Imports & Formatting
- Use absolute imports with `@/` prefix (e.g., `@/lib/utils`, `@/components/ui/button`)
- Import React components with `import * as React from "react"`
- Group imports: external libraries → internal imports → type imports
- Use `cn()` utility for conditional Tailwind classes

### TypeScript & Types
- Strict TypeScript enabled - always type props and returns
- Use interfaces for object shapes, types for unions/primitives
- Prefer explicit return types for functions
- Use `VariantProps` from class-variance-authority for component variants

### Component Patterns
- Use shadcn/ui patterns with cva for variants
- Forward refs properly for UI components
- Use `asChild` prop pattern for composition
- Destructure props with TypeScript interfaces

### Naming Conventions
- Components: PascalCase (e.g., `TaskForm`, `DayView`)
- Functions/variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Files: kebab-case for folders, PascalCase for components

### State Management
- Use Zustand stores with TypeScript interfaces
- Separate stores by domain (useCalendarStore, useTaskStore, etc.)
- Use selectors for optimized re-renders

### Error Handling
- Use try-catch blocks for async operations
- Return proper error types from API routes
- Use toast notifications for user feedback

### Testing
- Write unit tests with Jest and React Testing Library
- Test components with proper props and user interactions
- Use Playwright for E2E critical user flows
