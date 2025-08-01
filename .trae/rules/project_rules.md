# Project Rules - Tier List Application

## Code Quality Standards

### Linting Rules (ESLint + TypeScript)
- Use ESLint with TypeScript parser for code quality enforcement
- Follow strict TypeScript configuration
- Enforce consistent code formatting with Prettier
- Use import/export order rules
- Require explicit return types for functions
- Enforce consistent naming conventions

### TypeScript Rules
- Enable strict mode in tsconfig.json
- No implicit any types allowed
- Require explicit function return types
- Enable strict null checks
- Use consistent interface/type definitions

### Code Style
- Use 2 spaces for indentation
- Single quotes for strings
- Trailing commas in multiline objects/arrays
- Semicolons required
- Max line length: 100 characters

### File Organization
- Group imports: external libraries, internal modules, relative imports
- Export interfaces and types from dedicated files
- Use barrel exports (index.ts) for clean imports
- Separate concerns: types, services, storage, config

### Error Handling
- Always handle async operations with try-catch
- Provide meaningful error messages
- Log errors appropriately
- Validate inputs at service boundaries

### Testing Requirements
- Minimum 80% code coverage
- Unit tests for all business logic
- Integration tests for storage operations
- E2E tests for critical user flows
- Test file naming: *.test.ts or *.spec.ts

### Performance Guidelines
- Lazy load components when possible
- Optimize bundle size
- Use efficient data structures
- Minimize DOM manipulations

### Security Rules
- Validate all user inputs
- Sanitize HTML content
- No hardcoded secrets or API keys
- Use secure storage practices

### Documentation
- JSDoc comments for public APIs
- README with setup instructions
- Type definitions should be self-documenting
- Comment complex business logic

## Git Workflow
- Use conventional commits
- Run linter and tests before commits
- No direct pushes to main branch
- Require code review for PRs

## Dependencies
- Keep dependencies up to date
- Prefer well-maintained packages
- Minimize bundle size impact
- Document dependency choices