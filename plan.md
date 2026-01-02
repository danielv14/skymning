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
| Trendlinje | Linjegraf med lättviktigt chart-bibliotek |

---

## Fas 1: Projektsetup

- [ ] Initiera TanStack Start-projekt med Bun
- [ ] Konfigurera Tailwind CSS
- [ ] Sätta upp Drizzle ORM med SQLite
- [ ] Skapa `.env.example` med `ANTHROPIC_API_KEY`
- [ ] Skapa `.gitignore` med `.env` och SQLite-databas
- [ ] Sätta upp grundläggande mappstruktur

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

- [ ] Skapa schema-fil med Drizzle
- [ ] Konfigurera Drizzle Kit för migrations
- [ ] Skapa initial migration
- [ ] Verifiera att databasen skapas korrekt

## Fas 3: Server functions

Skapa typsäkra server functions med Zod-validering:

- [ ] `getTodayEntry` - hämta dagens inlägg (om det finns)
- [ ] `getEntriesForWeek(year, week)` - hämta inlägg för en specifik vecka
- [ ] `createEntry(mood, summary)` - spara dagens inlägg
- [ ] `getWeeklySummary(year, week)` - hämta eller generera veckosummering
- [ ] `getMoodTrend(limit)` - hämta senaste X inlägg för trendlinje
- [ ] `hasAnyEntries` - kolla om det finns några inlägg (för välkomstvy)

## Fas 4: AI-integration

- [ ] Konfigurera TanStack AI med Anthropic-adapter
- [ ] Implementera chat-streaming för reflektion (`chatReflection`)
- [ ] Implementera dagssummering (`generateDaySummary`)
- [ ] Implementera veckosummering (`generateWeeklySummary`)
- [ ] Lägga in promptarna från project-spec.md

## Fas 5: Routes & vyer

| Route | Beskrivning |
|-------|-------------|
| `/` | Dashboard - moodtrend, knapp till reflektion, senaste veckosummering. Visar välkomst om inga inlägg finns. |
| `/reflect` | Reflektion - ett flöde med två steg: först chatt, sedan välj mood och spara. Redirect till `/` om dagens reflektion redan är gjord. |
| `/timeline` | Redirect till aktuell vecka |
| `/timeline/$year/$week` | Specifik vecka med navigation |

- [ ] Skapa route-struktur
- [ ] Implementera `/` (dashboard/välkomst)
- [ ] Implementera `/reflect` (chatt + spara i samma route med intern state)
- [ ] Implementera `/timeline/$year/$week` (veckovy)
- [ ] Sätta upp view transitions

## Fas 6: Komponenter

### Layout & navigation
- [ ] `Layout` - grundlayout med navigation
- [ ] `Navigation` - enkel nav mellan dashboard och tidslinje

### Mood-relaterade
- [ ] `MoodPicker` - välj mood med 5 emojis
- [ ] `MoodEmoji` - enskild emoji för mood-värde
- [ ] `MoodTrend` - linjegraf över senaste inläggen

### Chatt
- [ ] `ChatBubble` - chatbubbla (användare/AI)
- [ ] `ChatInput` - textinput för chatt
- [ ] `ChatView` - container för hela chatten

### Tidslinje
- [ ] `WeekNavigation` - navigera mellan veckor
- [ ] `EntryCard` - visa ett dagsinlägg
- [ ] `EmptyWeek` - visuell indikator för tom vecka
- [ ] `WeeklySummaryCard` - visa veckosummering

### Övrigt
- [ ] `Welcome` - välkomstvy för nya användare
- [ ] `Button` - återanvändbar knapp med styling
- [ ] `Card` - återanvändbar kortkomponent

## Fas 7: Styling & polish

- [ ] Definiera färgpalett (beiga toner, skymning-tema)
- [ ] Välja och konfigurera typsnitt
- [ ] Skapa Tailwind-konfiguration med custom theme
- [ ] Styla alla komponenter enligt designriktlinjerna
- [ ] Implementera view transitions mellan routes
- [ ] Testa responsivitet

---

## Tekniska detaljer

### Mappstruktur (förslag)

```
src/
├── routes/
│   ├── __root.tsx
│   ├── index.tsx
│   ├── reflect.tsx
│   └── timeline.$year.$week.tsx
├── components/
│   ├── chat/
│   ├── mood/
│   ├── timeline/
│   └── ui/
├── server/
│   ├── functions/
│   ├── ai/
│   └── db/
└── lib/
    └── utils.ts
```

### Chart-bibliotek

Använder ett lättviktigt chart-bibliotek för trendlinjen. Kandidater:
- **Recharts** - populärt, React-native, lätt att styla
- **Chart.js + react-chartjs-2** - flexibelt men lite tyngre
- **uPlot** - extremt lättviktigt men mer low-level

Rekommendation: Recharts för balans mellan enkelhet och anpassningsbarhet.

### Emojis för mood

| Värde | Emoji | Label |
|-------|-------|-------|
| 5 | 😄 | Jättebra |
| 4 | 😊 | Bra |
| 3 | 😐 | Okej |
| 2 | 😕 | Dålig |
| 1 | 😢 | Kass |

---

## Nästa steg

När planen är godkänd börjar vi med Fas 1 (projektsetup) och arbetar oss igenom faserna i ordning.
