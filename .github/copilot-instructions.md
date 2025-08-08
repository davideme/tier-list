# Tier List Application - Development Instructions

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap and Build the Repository
- **Install dependencies**: `npm install` -- takes 46 seconds. NEVER CANCEL.
- **Start development server**: `npm run dev` -- starts in under 3 seconds on http://localhost:3000
- **Production build**: `npm run build` -- takes under 1 second. NEVER CANCEL.
- **Preview production build**: `npm run preview` -- starts preview server on http://localhost:4173

### Testing and Quality
- **Unit tests**: `npm run test` -- takes under 1 second. All 21 tests pass. NEVER CANCEL.
- **Code formatting**: `npm run format` -- fixes formatting issues in under 1 second
- **Format check**: `npm run format:check` -- validates code formatting
- **E2E tests**: `npm run test:e2e` -- FAILS due to Playwright browser installation issues. Use manual testing instead.
- **Linting**: `npm run lint` -- Works correctly with warnings only (no errors)
- **Quality pipeline**: `npm run quality` -- Works but may fail on coverage thresholds

### Known Issues and Workarounds
- **E2E Testing**: Playwright browser installation fails. Use manual testing or browser tools for validation.
- **Coverage Thresholds**: Test coverage may not meet thresholds for untested React components.

## Application Architecture

### Technology Stack
- **Frontend**: TypeScript with Vite build system
- **Testing**: Vitest (unit tests), Playwright (e2e tests - currently broken)
- **Code Quality**: ESLint, Prettier
- **Storage**: Browser localStorage with abstraction layer
- **UI**: Vanilla TypeScript (no framework)

### File Structure
```
src/
├── types/index.ts              # Type definitions and interfaces
├── utils/index.ts              # Utility functions and helpers
├── storage/
│   ├── StorageFactory.ts       # Storage provider factory pattern
│   └── LocalStorageProvider.ts # Local storage implementation
├── services/
│   └── TierListService.ts      # Business logic layer
├── config/
│   └── ConfigManager.ts        # Configuration management
├── TierListApp.ts              # Main application class
└── main.ts                     # UI initialization and event handling
```

### Key Data Models
- **TierList**: Main tier list structure with tiers, unranked items, metadata
- **Tier**: Individual tier (S, A, B, C, D) with items and styling
- **TierListItem**: Text or image items that can be ranked
- **TierListSummary**: Lightweight tier list info for listing

## Validation and Testing

### Manual Testing Scenarios
ALWAYS test these scenarios after making changes to ensure functionality:

1. **Create Tier List Flow**:
   - Navigate to http://localhost:3000
   - Enter title "Test Tier List" and description
   - Click "Create Tier List"
   - Verify tier list appears in sidebar with correct item count

2. **Add Items Flow**:
   - Enter text in "Add text item..." field
   - Click "Add Text" button
   - Verify item appears in "Unranked Items" section
   - Click "💾 Save" and verify success message

3. **Data Persistence Flow**:
   - Create tier list and add items
   - Save the tier list
   - Refresh the page (F5)
   - Verify tier list and items persist

4. **Storage Information**:
   - Click "Storage Info" button
   - Verify dialog shows: Type: local, Available: Yes, Total: 5.00 MB

### Application Features (Verified Working)
- ✅ Create new tier lists with custom titles and descriptions
- ✅ Add text items to tier lists
- ✅ Save tier lists to localStorage (data persists across sessions)
- ✅ List existing tier lists with metadata (item count, dates)
- ✅ Storage quota monitoring (5MB localStorage limit)
- ✅ Export/import functionality (buttons present)
- ✅ Default tier structure: S (red), A (orange), B (yellow), C (green), D (blue)
- ✅ Responsive UI with sidebar and main editing area

## Common Tasks

### Starting Development
```bash
cd /path/to/tier-list
npm install          # Takes 46 seconds
npm run dev          # Starts on http://localhost:3000
```

### Code Quality Maintenance
```bash
npm run format       # Fix formatting (always run before commits)
npm run test         # Run unit tests (21 tests, < 1 second)
npm run lint         # Check code quality (warnings only)
```

### Building for Production
```bash
npm run build        # Standard TypeScript + Vite build
npm run preview      # Preview on http://localhost:4173
```

### Debugging Application Issues
1. **Check browser console** for error messages and application logs
2. **Verify localStorage** using browser DevTools (Application tab)
3. **Test core flows** manually using the scenarios above
4. **Unit tests** provide good coverage for business logic
5. **Browser tools** work well for UI testing (Playwright has installation issues)

## Storage and Data

### Local Storage Details
- **Key**: `tierlist_app_data`
- **Format**: JSON with versioning support
- **Capacity**: 5MB (browser localStorage limit)
- **Persistence**: Data survives browser restarts
- **Location**: Browser localStorage (user's device only)

### Default Configuration
- **Theme**: Default theme with blue header
- **Tiers**: 5 default tiers (S, A, B, C, D) with predefined colors
- **Auto-save**: Available but manual save required
- **Storage**: Local browser storage only (no cloud sync)

## Performance Expectations

### Command Timing (Set appropriate timeouts)
- **npm install**: 46 seconds -- Set timeout to 120+ seconds. NEVER CANCEL.
- **npm run dev**: 3 seconds -- Set timeout to 30+ seconds.
- **npm run test**: 1 second -- Set timeout to 30+ seconds. NEVER CANCEL.
- **npm run build**: 1 second -- Set timeout to 60+ seconds. NEVER CANCEL.
- **npm run format**: 1 second -- Set timeout to 30+ seconds.

### Application Performance
- **Page load**: Under 2 seconds on localhost
- **Tier list creation**: Instant
- **Save operations**: Under 100ms
- **Storage operations**: Near-instant (localStorage)

## Important Notes

### What Works Reliably
- Development server and application functionality
- Unit testing with Vitest
- Code formatting with Prettier
- TypeScript compilation and build process
- ESLint linting (warnings only, no errors)
- Manual testing and validation
- Local storage persistence
- Core tier list features

### What Has Issues (Document but Don't Rely On)
- Playwright e2e tests (`npm run test:e2e`)
- Test coverage thresholds (React components not fully tested)

### Always Do Before Committing
1. Run `npm run format` to fix code formatting
2. Run `npm run test` to ensure unit tests pass
3. Test manually using the validation scenarios above
4. Use `npm run build` to verify production buildability

## Repository Context
This is a Phase 1 implementation focusing on local storage foundation. The architecture is designed for future extension to cloud storage (Firebase, APIs) without breaking changes. The application successfully demonstrates core tier list functionality with a clean, extensible codebase.