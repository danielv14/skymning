# AGENTS.md - Skymning

This file contains guidelines for AI coding agents working in this repository.

## Project Overview

Skymning is a Swedish personal reflection/journaling app built with:
- **Framework**: TanStack Start (React + SSR)
- **Database**: Cloudflare D1 (SQLite-compatible) with Drizzle ORM
- **Hosting**: Cloudflare Workers
- **Styling**: Tailwind CSS v4
- **AI**: TanStack AI with OpenAI (gpt-4o-mini)
- **Auth**: TanStack Start sessions with encrypted httpOnly cookies
- **Language**: TypeScript (strict mode)

## Build/Lint/Test Commands

```bash
# Development
bun dev                    # Start dev server on port 3000 (uses local D1 via miniflare)
bun start                  # Same as dev

# Build & Preview
bun run build              # Production build
bun run preview            # Preview production build
bun run deploy             # Build and deploy to Cloudflare Workers

# Type Checking
npx tsc --noEmit           # Check TypeScript errors

# Testing
bun test                   # Run all tests (vitest)
bun test <path>            # Run single test file
bun test --watch           # Watch mode

# Database (local D1)
bun db:migrate:local       # Apply migrations to local D1
bun db:reset               # Clear all tables (local)
bun db:seed                # Seed 4 weeks of test data (local)
bun db:reseed              # Reset + seed combined (local)
bun db:clear-today         # Clear today's entry (local)

# Database (remote/production D1)
bun db:migrate:remote      # Apply migrations to production D1

# Database Development
bun db:migrate:generate    # Generate new migration from schema changes
bun d1:studio              # Open D1 database studio
```

## Cloudflare Deployment

The app is deployed to Cloudflare Workers with D1 database.

### Configuration Files
- `wrangler.toml` - Cloudflare Workers configuration
- `src/env.d.ts` - TypeScript types for Cloudflare environment bindings

### Environment Variables (set in Cloudflare Dashboard)
| Variable | Purpose |
|----------|---------|
| `AUTH_SECRET` | Login password |
| `SESSION_SECRET` | Encrypts session cookies (min 32 chars) |
| `OPENAI_API_KEY` | OpenAI API key for AI features |

### Database
- Uses Cloudflare D1 (SQLite-compatible)
- Local development uses miniflare's D1 emulator (data in `.wrangler/state/`)
- Production uses remote D1 database
- Schema defined in `src/server/db/schema.ts`
- Migrations in `drizzle/` directory

### Migration Workflow
When changing the database schema:
1. Update `src/server/db/schema.ts`
2. Run `bun db:migrate:generate` to create new migration
3. Run `bun db:migrate:local` to apply locally
4. Test locally with `bun dev`
5. Run `bun db:migrate:remote` to apply to production
6. Deploy with `bun run deploy`

**Note:** Migration scripts in package.json reference specific migration files. Update these when new migrations are generated.

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
- Get database via `getDb()` from `@/server/db`:
  ```typescript
  import { getDb } from '../db'
  
  export const myFunction = createServerFn({ method: 'GET' })
    .handler(async () => {
      const db = getDb()
      // ... use db
    })
  ```

### Routes (TanStack Router)

- Routes live in `src/routes/`
- Protected routes live in `src/routes/_authed/` (requires authentication)
- Use `createFileRoute` for page routes
- Loaders fetch data before render:
  ```typescript
  export const Route = createFileRoute('/_authed/path')({
    loader: async () => {
      const data = await fetchData()
      return { data }
    },
    component: PageComponent,
  })
  ```

### Authentication

- Uses TanStack Start's built-in `useSession` for session management
- Sessions are stored in encrypted httpOnly cookies (30-day expiry)
- Protected routes are nested under `_authed/` layout route
- Login validates against `AUTH_SECRET` environment variable

Key files:
- `src/server/auth/session.ts` - Session configuration with `useAppSession` hook
- `src/server/functions/auth.ts` - `loginFn`, `logoutFn`, `isAuthenticatedFn`
- `src/routes/_authed.tsx` - Layout route that checks auth via `beforeLoad`
- `src/routes/login.tsx` - Public login page

### Styling (Tailwind CSS v4)

- Use Tailwind utility classes
- Custom CSS in `src/styles.css` with `@apply` when needed
- Color scheme: slate backgrounds, indigo/violet accents
- Responsive: mobile-first with `sm:` breakpoints

### Database (Drizzle + D1)

- Schema in `src/server/db/schema.ts`
- Database access via `getDb()` from `src/server/db/index.ts`
- Uses Cloudflare D1 (accessed via `cloudflare:workers` env)
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
    mood/           # Mood-related components (MoodEmoji, MoodTrend, etc.)
    reflection/     # Reflection components (MoodSelector, SummaryEditor, etc.)
    ui/             # Generic UI (Button, Card, Modal, etc.)
  constants/        # Constants and Zod schemas
  hooks/            # Custom React hooks (useAsyncGeneration)
  routes/           # TanStack Router pages
    _authed/        # Protected routes (requires login)
      timeline/     # Timeline views ($year/$week.tsx)
    api/            # API endpoints (chat)
  server/           # Server-side code
    ai/             # AI/LLM integration (client, prompts)
    auth/           # Authentication (session.ts)
    db/             # Database schema and connection
    functions/      # Server functions (entries, userContext, weeklySummaries, auth)
  utils/            # Utility functions (date, error)
scripts/            # Utility scripts (test-utils.ts)
drizzle/            # Database migrations
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
    const db = getDb()
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
