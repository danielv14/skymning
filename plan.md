# Skymning - Implementationsplan

## Beslut och avgränsningar

| Fråga | Beslut |
|-------|--------|
| Chatthistorik | Sparas inte permanent - endast summeringen behålls |
| Första besök | Visa välkomst om inga inlägg finns |
| Mood-score | 5 nivåer (1-5) med emoji (kan bytas ut senare) |
| Tidslinje | Bläddra en vecka i taget, visa tomma veckor tydligt |
| Körning | `bun run dev` för nu |
| API-nyckel | `.env`-fil, ej incheckad |
| Trendlinje | Linjegraf med Recharts |

---

## Fas 1: Projektsetup

- [x] Initiera TanStack Start-projekt med Bun
- [x] Konfigurera Tailwind CSS
- [x] Sätta upp Drizzle ORM med SQLite
- [x] Skapa `.env.example` med `ANTHROPIC_API_KEY`
- [x] Skapa `.gitignore` med `.env` och SQLite-databas
- [x] Sätta upp grundläggande mappstruktur

## Fas 2: Datamodell & databas

Skapa två tabeller med Drizzle:

### entries (dagsinlägg)

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | integer | primary key, auto increment |
| date | text | ISO-datum (YYYY-MM-DD), unikt |
| mood | integer | 1-5 |
| summary | text | AI-genererad summering |
| createdAt | text | ISO timestamp |

### weeklySummaries (veckosummeringar)

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| id | integer | primary key, auto increment |
| year | integer | årtal |
| week | integer | veckonummer 1-52 |
| summary | text | AI-genererad summering |
| createdAt | text | ISO timestamp |

Unique constraint på (year, week).

- [x] Skapa schema-fil med Drizzle
- [x] Konfigurera Drizzle Kit för migrations
- [x] Skapa initial migration
- [x] Verifiera att databasen skapas korrekt

## Fas 3: Server functions

Skapa typsäkra server functions med Zod-validering:

- [x] `getTodayEntry` - hämta dagens inlägg (om det finns)
- [x] `getEntriesForWeek(year, week)` - hämta inlägg för en specifik vecka
- [x] `createEntry(mood, summary)` - spara dagens inlägg
- [x] `getWeeklySummary(year, week)` - hämta eller generera veckosummering
- [x] `getMoodTrend(limit)` - hämta senaste X inlägg för trendlinje
- [x] `hasAnyEntries` - kolla om det finns några inlägg (för välkomstvy)

## Fas 4: AI-integration

- [x] Konfigurera TanStack AI med Anthropic-adapter
- [x] Implementera chat-streaming för reflektion (`/api/chat`)
- [x] Implementera dagssummering (`generateDaySummary`)
- [x] Implementera veckosummering (`generateWeeklySummary`)
- [x] Lägga in promptarna från project-spec.md

## Fas 5: Routes & vyer

| Route | Beskrivning |
|-------|-------------|
| `/` | Dashboard - moodtrend, knapp till reflektion, senaste veckosummering. Visar välkomst om inga inlägg finns. |
| `/reflect` | Reflektion - ett flöde med två steg: först chatt, sedan välj mood och spara. Redirect till `/` om dagens reflektion redan är gjord. |
| `/timeline` | Redirect till aktuell vecka |
| `/timeline/$year/$week` | Specifik vecka med navigation |

- [x] Skapa route-struktur
- [x] Implementera `/` (dashboard/välkomst)
- [x] Implementera `/reflect` (chatt + spara i samma route med intern state)
- [x] Implementera `/timeline/$year/$week` (veckovy)
- [x] Sätta upp view transitions

## Fas 6: Komponenter

### Mood-relaterade
- [x] `MoodEmoji` - enskild emoji för mood-värde
- [x] `MoodTrend` - linjegraf över senaste inläggen med Recharts

### Övrigt
- [x] `Welcome` - välkomstvy för nya användare
- [x] `Button` - återanvändbar knapp med styling
- [x] `Card` - återanvändbar kortkomponent

## Fas 7: Styling & polish

- [x] Definiera färgpalett (beiga toner, skymning-tema)
- [x] Välja och konfigurera typsnitt (Nunito)
- [x] Styla alla komponenter enligt designriktlinjerna
- [x] Implementera view transitions mellan routes
- [x] Testa responsivitet

---

## Tekniska detaljer

### Mappstruktur

```
src/
├── routes/
│   ├── __root.tsx
│   ├── index.tsx
│   ├── reflect.tsx
│   ├── timeline.tsx
│   ├── timeline/
│   │   └── $year.$week.tsx
│   └── api/
│       └── chat.ts
├── components/
│   ├── mood/
│   │   ├── MoodEmoji.tsx
│   │   └── MoodTrend.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   └── Card.tsx
│   └── Welcome.tsx
└── server/
    ├── functions/
    │   ├── entries.ts
    │   └── weeklySummaries.ts
    ├── ai/
    │   ├── index.ts
    │   └── prompts.ts
    └── db/
        ├── index.ts
        └── schema.ts
```

### Emojis för mood

| Värde | Emoji | Label |
|-------|-------|-------|
| 5 | 😄 | Jättebra |
| 4 | 😊 | Bra |
| 3 | 😐 | Okej |
| 2 | 😕 | Dålig |
| 1 | 😢 | Kass |

---

## Köra appen

```bash
# Skapa .env-fil
cp .env.example .env
# Lägg till din ANTHROPIC_API_KEY i .env

# Starta dev-server
bun --bun run dev
```

Appen körs på http://localhost:3000
