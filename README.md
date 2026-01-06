# Skymning

En personlig reflektions- och dagboksapp på svenska. Följ ditt mående över tid, skriv dagliga reflektioner och få AI-assisterad hjälp att sammanfatta dina tankar.

## Features

- **Dagliga reflektioner** - Skriv en kort sammanfattning av din dag
- **Mood tracking** - Betygsätt ditt mående (1-5) varje dag
- **AI-assisterad skrivning** - Få hjälp att polera och förbättra dina reflektioner
- **Veckosammanfattningar** - Automatiska AI-genererade sammanfattningar per vecka
- **Timeline** - Se dina reflektioner över tid med mood-trender
- **Personlig kontext** - Spara information om dig själv som AI:n använder för bättre svar

## Tech Stack

- **Runtime**: Bun
- **Framework**: TanStack Start (React + SSR)
- **Database**: SQLite med Drizzle ORM
- **Styling**: Tailwind CSS v4
- **AI**: TanStack AI med OpenAI (gpt-4o-mini)
- **Language**: TypeScript (strict mode)

## Kom igång

1. Klona repot och installera dependencies:

```bash
bun install
```

2. Kopiera `.env.example` till `.env` och lägg till din OpenAI API-nyckel:

```bash
cp .env.example .env
```

3. Starta utvecklingsservern:

```bash
bun dev
```

Appen körs på http://localhost:3000

## Scripts

```bash
# Development
bun dev                    # Starta dev server på port 3000

# Build & Preview
bun run build              # Produktionsbygge
bun run preview            # Förhandsgranska produktionsbygge

# Type Checking
npx tsc --noEmit           # Kör TypeScript-kontroll

# Testing
bun test                   # Kör alla tester (vitest)

# Database
bun db:push                # Pusha schemaändringar till SQLite
bun db:reset               # Rensa alla tabeller
bun db:seed                # Seeda 4 veckor med testdata
bun db:reseed              # Reset + seed kombinerat
bun db:clear-today         # Rensa dagens entry
```

## Projektstruktur

```
src/
  components/           # React-komponenter
    mood/               # Mood-relaterade komponenter
    reflection/         # Reflektions-komponenter
    ui/                 # Generiska UI-komponenter (Button, Card, etc.)
  constants/            # Konstanter och scheman
  hooks/                # Custom React hooks
  routes/               # TanStack Router sidor
    api/                # API endpoints
    timeline/           # Timeline-sidor
  server/               # Server-side kod
    ai/                 # AI/LLM-integration
    db/                 # Databasschema och anslutning
    functions/          # Server functions (RPC)
  utils/                # Hjälpfunktioner
scripts/                # Utility-scripts
```
