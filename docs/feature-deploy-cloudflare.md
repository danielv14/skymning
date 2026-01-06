# Feature: Deploy till Cloudflare Pages

## Sammanfattning
Deploya Skymning till Cloudflare Pages med D1 som databas. Detta gör appen tillgänglig utan att behöva köra lokalt, samtidigt som vi behåller lokal SQLite för utveckling.

## Bakgrund
Skymning körs för närvarande endast lokalt. För att kunna reflektera var som helst behöver appen vara tillgänglig via en URL. Cloudflare Pages är ett bra val eftersom:
- Gratis hosting för personliga projekt
- Edge-baserad SSR fungerar bra med TanStack Start
- D1 är SQLite-kompatibelt (minimal migration från nuvarande setup)
- Inbyggd HTTPS
- AI-anrop (OpenAI) fungerar direkt från edge functions

## Förutsättningar
- **Auth måste vara implementerat först** (se `feature-auth.md`)
- Cloudflare-konto (gratis)
- Wrangler CLI installerat

## Krav

### Funktionella krav
- Appen ska vara tillgänglig via en publik URL
- Alla befintliga funktioner ska fungera (reflektioner, AI-chat, timeline)
- Data ska sparas persistent i D1-databas
- Lokal utveckling ska fortsätta fungera med SQLite-fil

### Icke-funktionella krav
- HTTPS (hanteras automatiskt av Cloudflare)
- Rimlig latency för AI-anrop
- Secrets (API-nycklar) ska inte exponeras i kod eller loggar

## Arkitekturöversikt

```
┌─────────────────────────────────────────────────────────────────┐
│                        LOKAL UTVECKLING                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   Browser   │────▶│  Bun + Vite │────▶│   SQLite    │       │
│  │             │◀────│  dev server │◀────│   (fil)     │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│                             │                                   │
│                             ▼                                   │
│                      ┌─────────────┐                           │
│                      │   OpenAI    │                           │
│                      │    API      │                           │
│                      └─────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         PRODUKTION                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────────────┐     ┌──────────┐  │
│  │   Browser   │────▶│  Cloudflare Pages   │────▶│    D1    │  │
│  │             │◀────│  (Edge Functions)   │◀────│ (SQLite) │  │
│  └─────────────┘     └─────────────────────┘     └──────────┘  │
│                             │                                   │
│                             ▼                                   │
│                      ┌─────────────┐                           │
│                      │   OpenAI    │                           │
│                      │    API      │                           │
│                      └─────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Teknisk design

### Nya/ändrade filer

```
skymning/
├── wrangler.toml                    # NY: Cloudflare-konfiguration
├── vite.config.ts                   # ÄNDRA: Lägg till CF adapter
├── src/
│   └── server/
│       └── db/
│           └── index.ts             # ÄNDRA: Databas-abstraktion
└── drizzle/
    └── migrations/                  # NY: SQL-migrationer för D1
```

### wrangler.toml

```toml
name = "skymning"
compatibility_date = "2024-12-01"
pages_build_output_dir = ".output/public"

# D1 databas-binding
[[d1_databases]]
binding = "DB"
database_name = "skymning-db"
database_id = "<genereras av wrangler d1 create>"

# Environment variables sätts i Cloudflare Dashboard, inte här
# OPENAI_API_KEY, AUTH_SECRET, JWT_SECRET
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import { tanstackStart } from '@tanstack/start/vite'

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tanstackStart({
      // Cloudflare Pages adapter
      target: 'cloudflare-pages'
    })
  ]
})
```

**Notera:** Exakt syntax för adapter kan variera beroende på TanStack Start version. Kontrollera dokumentationen.

### Databas-abstraktion

Uppdatera `src/server/db/index.ts` för att hantera både lokal SQLite och D1:

```typescript
// src/server/db/index.ts
import { drizzle as drizzleD1 } from 'drizzle-orm/d1'
import { drizzle as drizzleBetterSqlite } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'

// Typ för D1 binding från Cloudflare
type CloudflareEnv = {
  DB: D1Database
}

// Singleton för lokal SQLite-anslutning
let localDb: ReturnType<typeof drizzleBetterSqlite> | null = null

export const getDb = (cloudflareEnv?: CloudflareEnv) => {
  // Produktion: använd D1
  if (cloudflareEnv?.DB) {
    return drizzleD1(cloudflareEnv.DB, { schema })
  }
  
  // Lokal utveckling: använd SQLite-fil
  if (!localDb) {
    const sqlite = new Database('sqlite.db')
    localDb = drizzleBetterSqlite(sqlite, { schema })
  }
  
  return localDb
}

// Exportera typer
export type DbClient = ReturnType<typeof getDb>
```

### Uppdatera server functions

Alla server functions som använder databasen behöver uppdateras för att få D1-bindingen:

```typescript
// src/server/functions/entries.ts
import { createServerFn } from '@tanstack/start'
import { getDb } from '../db'
import { entries } from '../db/schema'
import { eq, and, gte, lt } from 'drizzle-orm'

export const getTodayEntry = createServerFn({ method: 'GET' })
  .handler(async ({ context }) => {
    // Hämta D1 binding från Cloudflare context (undefined lokalt)
    const db = getDb(context?.cloudflare?.env)
    
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    
    const entry = await db.query.entries.findFirst({
      where: and(
        gte(entries.createdAt, today),
        lt(entries.createdAt, tomorrow)
      )
    })
    
    return entry ?? null
  })

// Uppdatera alla andra funktioner på samma sätt...
```

### Environment variables

Sätt dessa i Cloudflare Pages Dashboard under Settings → Environment variables:

| Variable | Beskrivning | Exempel |
|----------|-------------|---------|
| `AUTH_SECRET` | Lösenord för login | `mitt-hemliga-losenord-123` |
| `JWT_SECRET` | Nyckel för JWT-signering | `en-lång-slumpmässig-sträng` |
| `OPENAI_API_KEY` | OpenAI API-nyckel | `sk-...` |

**Viktigt:** Markera alla som "Encrypted" i Cloudflare Dashboard.

## Steg-för-steg implementation

### Fas 1: Förberedelser (lokalt)

```bash
# 1. Installera Wrangler CLI
bun add -D wrangler

# 2. Installera D1 Drizzle adapter
bun add drizzle-orm/d1

# 3. Logga in på Cloudflare
bunx wrangler login

# 4. Skapa D1-databas
bunx wrangler d1 create skymning-db
# Kopiera database_id från output till wrangler.toml
```

### Fas 2: Konfigurera projekt

```bash
# 5. Skapa wrangler.toml (se ovan)

# 6. Uppdatera vite.config.ts med Cloudflare adapter

# 7. Uppdatera src/server/db/index.ts med databas-abstraktion

# 8. Uppdatera alla server functions att använda getDb(context?.cloudflare?.env)
```

### Fas 3: Databas-migration

```bash
# 9. Generera SQL-migration från Drizzle schema
bunx drizzle-kit generate:sqlite --out=./drizzle/migrations

# 10. Visa genererad migration
cat ./drizzle/migrations/0000_*.sql

# 11. Applicera migration till D1
bunx wrangler d1 execute skymning-db --file=./drizzle/migrations/0000_*.sql

# 12. Verifiera att tabeller skapats
bunx wrangler d1 execute skymning-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### Fas 4: Testa lokalt med D1

```bash
# 13. Testa med lokal D1-emulator
bunx wrangler pages dev .output/public --d1=DB

# Eller kör vanlig dev-server (använder SQLite)
bun dev
```

### Fas 5: Deploy

```bash
# 14. Bygga för produktion
bun run build

# 15. Första deploy (skapar projekt i Cloudflare)
bunx wrangler pages deploy .output/public --project-name=skymning

# 16. Sätt environment variables i Cloudflare Dashboard
# Settings → Environment variables → Add variables
# - AUTH_SECRET (encrypted)
# - JWT_SECRET (encrypted)  
# - OPENAI_API_KEY (encrypted)

# 17. Bind D1-databasen till Pages-projektet
# Settings → Functions → D1 database bindings
# Variable name: DB
# D1 database: skymning-db
```

### Fas 6: Verifiera produktion

1. Besök din Cloudflare Pages URL
2. Logga in med AUTH_SECRET
3. Skapa en reflektion
4. Verifiera att data sparas (refresha sidan)
5. Testa AI-chatten

## Package.json scripts

Lägg till nya scripts för Cloudflare-workflow:

```json
{
  "scripts": {
    "dev": "vinxi dev",
    "build": "vinxi build",
    "start": "vinxi start",
    "deploy": "bun run build && wrangler pages deploy .output/public --project-name=skymning",
    "preview:cf": "wrangler pages dev .output/public",
    "db:push": "drizzle-kit push:sqlite",
    "db:migrate:generate": "drizzle-kit generate:sqlite --out=./drizzle/migrations",
    "db:migrate:d1": "wrangler d1 execute skymning-db --file=./drizzle/migrations/0000_initial.sql",
    "d1:studio": "wrangler d1 studio skymning-db"
  }
}
```

## Databashantering

### Lokalt vs Produktion

| Kommando | Lokal SQLite | Cloudflare D1 |
|----------|--------------|---------------|
| Push schema | `bun db:push` | `bun db:migrate:d1` |
| Se data | SQLite-klient eller Drizzle Studio | `bun d1:studio` |
| Backup | Kopiera `sqlite.db` | Cloudflare Dashboard |
| Reset | `rm sqlite.db` | D1 Dashboard |

### Migration-workflow

När du ändrar schemat:

```bash
# 1. Ändra src/server/db/schema.ts

# 2. Pusha till lokal SQLite (dev)
bun db:push

# 3. Generera SQL-migration för D1
bun db:migrate:generate

# 4. Granska genererad SQL
cat ./drizzle/migrations/*.sql

# 5. Applicera till D1 (prod)
bun db:migrate:d1

# 6. Deploy ny kod
bun deploy
```

## Felsökning

### "D1_ERROR: no such table"
Migration har inte körts. Kör `bun db:migrate:d1`.

### "TypeError: Cannot read properties of undefined (reading 'DB')"
Server function får inte Cloudflare context. Kontrollera att du använder `context?.cloudflare?.env`.

### Lokal dev fungerar men prod misslyckas
1. Kontrollera att environment variables är satta i Cloudflare Dashboard
2. Kontrollera att D1-binding är konfigurerad
3. Kolla Cloudflare Pages logs: Dashboard → Pages → skymning → Deployments → View logs

### AI-anrop timeout
Cloudflare Workers har 30 sekunders timeout på gratis-plan. OpenAI-anrop bör normalt vara snabbare, men om det är problem:
1. Använd streaming för längre svar
2. Överväg att sänka `max_tokens`

## Kostnader

Cloudflare Pages och D1 är gratis för personligt bruk:

| Tjänst | Gratis-nivå |
|--------|-------------|
| Pages | Obegränsade deploys, 500 builds/månad |
| D1 | 5 GB storage, 5M reads/dag, 100K writes/dag |
| Workers (Pages Functions) | 100K requests/dag |

För en single-user journaling-app kommer du aldrig i närheten av dessa gränser.

## Automatisk deploy (valfritt)

### GitHub Actions

Skapa `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - run: bun install
      - run: bun run build
      
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: skymning
          directory: .output/public
```

Sätt secrets i GitHub repository settings.

## Acceptanskriterier

### Förberedelser
- [ ] Wrangler CLI installerat
- [ ] Cloudflare-konto skapat
- [ ] D1-databas skapad (`skymning-db`)
- [ ] `wrangler.toml` konfigurerad

### Kod-ändringar
- [ ] Cloudflare adapter konfigurerad i `vite.config.ts`
- [ ] Databas-abstraktion i `src/server/db/index.ts`
- [ ] Alla server functions uppdaterade för D1-kompatibilitet
- [ ] Lokal utveckling fungerar fortfarande med SQLite

### Deploy
- [ ] Schema migrerat till D1
- [ ] Environment variables satta i Cloudflare Dashboard
- [ ] D1-binding konfigurerad för Pages-projektet
- [ ] Första deploy lyckad
- [ ] Appen nåbar via Cloudflare Pages URL

### Verifiering
- [ ] Login fungerar i produktion
- [ ] Kan skapa ny reflektion
- [ ] Data persisterar efter refresh
- [ ] AI-chat fungerar
- [ ] Timeline visar historik

## Rollback-plan

Om något går fel efter deploy:

1. **Cloudflare Dashboard** → Pages → skymning → Deployments
2. Klicka på tidigare fungerande deploy
3. Klicka "Rollback to this deployment"

Data i D1 påverkas inte av rollback (endast kod).
