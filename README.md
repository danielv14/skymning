# Skymning

En personlig reflektions- och dagboksapp på svenska. Följ ditt mående över tid, skriv dagliga reflektioner och få AI-assisterad hjälp att sammanfatta dina tankar.

## Features

- **Dagliga reflektioner** - Skriv en kort sammanfattning av din dag via AI-chatt eller snabbinmatning
- **Mood tracking** - Betygsätt ditt mående (1-5) varje dag
- **AI-assisterad skrivning** - Få hjälp att polera och förbättra dina reflektioner
- **Veckosammanfattningar** - Automatiska AI-genererade sammanfattningar per vecka
- **Månadsöversikter** - Dashboard med kalender-heatmap, humörfördelning och månadssammanfattningar
- **Insikter** - AI-driven mönsteranalys som hittar korrelationer mellan aktiviteter och humör
- **Dashboard** - Översikt med streak, humörtrend, veckodagsmönster och snabblänkar
- **Timeline** - Se dina reflektioner över tid med mood-trender
- **Personlig kontext** - Spara information om dig själv som AI:n använder för bättre svar
- **Autentisering** - Skyddad med lösenord och krypterade sessioner

## Tech Stack

- **Runtime**: Bun
- **Framework**: TanStack Start (React + SSR)
- **Hosting**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite-compatible) med Drizzle ORM
- **Styling**: Tailwind CSS v4
- **AI**: TanStack AI med OpenAI (gpt-4o)
- **Language**: TypeScript (strict mode)

## Kom igång

1. Klona repot och installera dependencies:

```bash
bun install
```

2. Kopiera `.env.example` till `.env` och konfigurera:

```bash
cp .env.example .env
```

3. Fyll i miljövariablerna i `.env`:

```bash
# OpenAI API-nyckel för AI-funktioner
OPENAI_API_KEY=sk-...

# Ditt inloggningslösenord (valfri sträng)
AUTH_SECRET=ditt-hemliga-losenord

# Krypteringsnyckel för sessioner (minst 32 tecken)
# Generera med: openssl rand -base64 32
SESSION_SECRET=din-32-tecken-langa-krypteringsnyckel
```

| Variabel | Beskrivning | Krav |
|----------|-------------|------|
| `OPENAI_API_KEY` | API-nyckel från OpenAI | Krävs för AI-funktioner |
| `AUTH_SECRET` | Lösenordet du anger vid inloggning | Valfri sträng |
| `SESSION_SECRET` | Intern nyckel för att kryptera session-cookies | Minst 32 tecken |

4. Starta utvecklingsservern:

```bash
bun dev
```

Appen körs på http://localhost:3000 - du kommer dirigeras till `/login` där du anger ditt `AUTH_SECRET` för att komma in.

## Scripts

```bash
# Development
bun dev                    # Starta dev server på port 3000 (lokal D1 via miniflare)

# Build & Deploy
bun run build              # Produktionsbygge
bun run preview            # Förhandsgranska produktionsbygge
bun run deploy             # Bygg och deploya till Cloudflare Workers

# Type Checking
npx tsc --noEmit           # Kör TypeScript-kontroll

# Database (lokal D1)
bun db:push                # Synka schema till lokal D1
bun db:reset               # Rensa alla tabeller
bun db:seed                # Seeda 4 veckor med testdata
bun db:reseed              # Reset + seed kombinerat
bun db:clear-today         # Rensa dagens entry
bun db:sync-prod           # Synka produktions-D1 till lokal

# Database (produktion)
bun db:migrate             # Kör väntande migreringar mot produktion
bun db:migrate:generate    # Generera ny migrering från schemaändringar
bun d1:studio              # Öppna D1 database studio
```

## Projektstruktur

```
src/
  components/           # React-komponenter
    dashboard/          # Dashboard-kort (StreakCard, TodayEntryCard, etc.)
    insights/           # Insikts-komponenter (InsightCard)
    months/             # Månadsvy-komponenter (CalendarHeatmap, MoodDistribution, etc.)
    mood/               # Mood-relaterade komponenter (MoodEmoji, MoodTrend, etc.)
    reflection/         # Reflektions-komponenter (MoodSelector, ChatMessage, etc.)
    timeline/           # Timeline-komponenter (WeeklyEntryCard, WeeklySummarySection)
    ui/                 # Generiska UI-komponenter (Button, Card, Modal, etc.)
  constants/            # Konstanter och scheman
  hooks/                # Custom React hooks
  routes/               # TanStack Router sidor
    _authed/            # Skyddade sidor (kräver inloggning)
      months/           # Månadsvyer ($year/$month.tsx)
      timeline/         # Tidslinje ($year/$week.tsx)
    api/                # API endpoints (chat)
  server/               # Server-side kod
    ai/                 # AI/LLM-integration
    auth/               # Autentisering och sessioner
    db/                 # Databasschema och anslutning
    functions/          # Server functions (entries, chat, insights, weeklySummaries, monthlySummaries, auth)
  utils/                # Hjälpfunktioner (date, isoWeek, string)
scripts/                # Utility-scripts
drizzle/                # Databasmigreringar
```
