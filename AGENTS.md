# AGENTS.md - Skymning

This file contains guidelines for AI coding agents working in this repository.

## Project Overview

Skymning is a Swedish personal reflection/journaling app built with:
- **Runtime**: Bun
- **Framework**: TanStack Start (React + SSR)
- **Database**: SQLite with Drizzle ORM
- **Styling**: Tailwind CSS v4
- **AI**: TanStack AI with OpenAI (gpt-4o-mini)
- **Language**: TypeScript (strict mode)

## Build/Lint/Test Commands

```bash
# Development
bun dev                    # Start dev server on port 3000
bun start                  # Same as dev

# Build & Preview
bun run build              # Production build
bun run preview            # Preview production build

# Type Checking
npx tsc --noEmit           # Check TypeScript errors

# Testing
bun test                   # Run all tests (vitest)
bun test <path>            # Run single test file
bun test --watch           # Watch mode

# Database
bun db:push                # Push schema changes to SQLite
bun db:reset               # Clear all tables
bun db:seed                # Seed 4 weeks of test data
bun db:reseed              # Reset + seed combined

# Database Testing (via scripts)
bun scripts/test-utils.ts reset       # Rensar alla tabeller
bun scripts/test-utils.ts seed        # Seedar 4 veckor med reflektioner
bun scripts/test-utils.ts reseed      # Reset + seed kombinerat
bun scripts/test-utils.ts clear-today # Rensar dagens entry (för att testa summering)
```

## Code Style Guidelines

### Functions & Variables

- **Always use const arrow functions** instead of function declarations:
  ```typescript
  // Good
  const handleClick = () => { ... }
  const MyComponent = () => { ... }
  
  // Bad
  function handleClick() { ... }
  function MyComponent() { ... }
  ```

- **Be explicit with variable names** - avoid abbreviations:
  ```typescript
  // Good
  const processManager = new ProcessManager()
  const userContext = await db.query.userContext.findFirst()
  
  // Bad
  const pm = new ProcessManager()
  const ctx = await db.query.userContext.findFirst()
  ```

### React Components

- **Boolean props**: Omit `={true}` for hardcoded true values:
  ```tsx
  // Good
  <Button glow disabled />
  <Card gradient />
  
  // Bad
  <Button glow={true} disabled={true} />
  ```

- **Type props inline** using `type` (not `interface`):
  ```typescript
  type ButtonProps = {
    children: React.ReactNode
    variant?: 'primary' | 'secondary'
    disabled?: boolean
  }
  ```

- **Component structure**: Export as named const arrow function:
  ```typescript
  export const MyComponent = ({ prop1, prop2 }: MyComponentProps) => {
    return (...)
  }
  ```

### Imports

- **Order imports** logically:
  1. React/framework imports
  2. Third-party libraries
  3. Internal modules (server, components, etc.)
  4. Types (if separate)

- **Use path aliases** when available: `@/*` maps to `./src/*`

### TypeScript

- **Strict mode enabled** - no implicit any, unused locals/params flagged
- **Zod for validation** - use for all server function inputs:
  ```typescript
  const inputSchema = z.object({
    mood: z.number().min(1).max(5),
    summary: z.string().min(1),
  })
  
  export const createEntry = createServerFn({ method: 'POST' })
    .inputValidator((data: unknown) => inputSchema.parse(data))
    .handler(async ({ data }) => { ... })
  ```

- **Infer types from schema** when possible:
  ```typescript
  export type Entry = typeof entries.$inferSelect
  export type NewEntry = typeof entries.$inferInsert
  ```

### Server Functions (TanStack Start)

- Use `createServerFn` for all server-side logic
- Specify method: `{ method: 'GET' }` or `{ method: 'POST' }`
- Always validate input with `.inputValidator()`
- Return `null` (not `undefined`) for empty results

### Routes (TanStack Router)

- Routes live in `src/routes/`
- Use `createFileRoute` for page routes
- Loaders fetch data before render:
  ```typescript
  export const Route = createFileRoute('/path')({
    loader: async () => {
      const data = await fetchData()
      return { data }
    },
    component: PageComponent,
  })
  ```

### Styling (Tailwind CSS v4)

- Use Tailwind utility classes
- Custom CSS in `src/styles.css` with `@apply` when needed
- Color scheme: slate backgrounds, indigo/violet accents
- Responsive: mobile-first with `sm:` breakpoints

### Database (Drizzle + SQLite)

- Schema in `src/server/db/schema.ts`
- Use query builder for reads, insert/update/delete for writes
- Dates stored as ISO strings (TEXT columns)
- Always use `eq`, `and`, `gte`, `lt` from `drizzle-orm`

### Error Handling

- Use try/catch in async handlers
- Log errors with `console.error`
- Return graceful fallbacks in UI components
- Validate all external input with Zod

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `MoodEmoji`, `Button` |
| Functions | camelCase | `handleClick`, `getTodayEntry` |
| Variables | camelCase | `selectedMood`, `isLoading` |
| Types | PascalCase | `ButtonProps`, `TrendData` |
| Files (components) | PascalCase | `MoodTrend.tsx` |
| Files (routes) | kebab-case | `about-me.tsx` |
| Database tables | snake_case | `weekly_summaries` |

### Comments

- Write comments in Swedish (project language)
- Keep comments concise and meaningful
- Document complex logic, not obvious code

## Project Structure

```
src/
  components/       # Reusable UI components
    mood/           # Mood-related components
    ui/             # Generic UI (Button, Card)
  routes/           # TanStack Router pages
    api/            # API endpoints
  server/           # Server-side code
    ai/             # AI/LLM integration
    db/             # Database schema and connection
    functions/      # Server functions (RPC)
scripts/            # Utility scripts
```

## Common Patterns

### Fetching data in routes
```typescript
const { data } = Route.useLoaderData()
```

### Creating server functions
```typescript
export const myFunction = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    // Implementation
  })
```

### Conditional rendering with loading states
```typescript
const [isLoading, setIsLoading] = useState(false)
// ...
<Button disabled={isLoading}>
  {isLoading ? 'Laddar...' : 'Spara'}
</Button>
```
