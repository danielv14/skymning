# Feature: Dashboard Insights

## Sammanfattning
Utöka dashboarden med mer insiktsfull information: genomsnittligt humör med beskrivning och senaste veckans sammanfattning. Ger användaren bättre överblick och motivation att fortsätta reflektera.

## Bakgrund
Nuvarande dashboard visar:
- Dagens reflektion (om den finns)
- Streak (antal dagar i rad)
- Mood-trend (graf över tid)

Det saknas:
- Snabb förståelse för hur man mått senaste tiden
- Koppling till veckosummeringar som redan finns i tidslinjen

## Nya komponenter

### 1. Genomsnittligt humör (senaste 7 dagarna)

**Vad:** Visa genomsnittligt mood för senaste veckan med en naturlig beskrivning.

**Befintlig logik att återanvända:**
- `getWeekMoodDescription()` i `src/constants/mood.ts` - ger beskrivning som "En ganska bra vecka"
- `getMoodTrend()` i `src/server/functions/entries.ts` - hämtar mood-data

**UI-förslag:**
```tsx
<Card>
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-slate-400">Senaste 7 dagarna</p>
      <p className="text-lg font-semibold text-white">En ganska bra vecka</p>
    </div>
    <div className="text-3xl">
      <MoodEmoji mood={Math.round(averageMood)} size="lg" />
    </div>
  </div>
</Card>
```

**Alternativ layout - mer kompakt:**
```tsx
<Card className="flex items-center gap-4">
  <MoodEmoji mood={Math.round(averageMood)} size="lg" />
  <div>
    <p className="text-white font-medium">{moodDescription}</p>
    <p className="text-sm text-slate-400">Snitt: {averageMood.toFixed(1)} senaste 7 dagarna</p>
  </div>
</Card>
```

**Implementation:**
1. Skapa ny server function `getRecentMoodAverage()` som returnerar genomsnitt för senaste X dagar
2. Använd befintlig `getWeekMoodDescription()` för beskrivning
3. Lägg till i loader för index.tsx
4. Visa i ny Card-komponent

### 2. Senaste veckans sammanfattning

**Vad:** Om det finns en AI-genererad veckosummering för förra veckan, visa en preview på dashboarden.

**Befintlig logik att återanvända:**
- `getWeeklySummary()` i `src/server/functions/weeklySummaries.ts`
- `getCurrentWeek()` för att räkna ut förra veckan

**UI-förslag:**
```tsx
<Card>
  <div className="flex items-center justify-between mb-2">
    <h3 className="text-sm font-medium text-slate-400">Förra veckan</h3>
    <Link to="/timeline/$year/$week" params={...}>
      <span className="text-xs text-indigo-400 hover:text-indigo-300">
        Se hela veckan →
      </span>
    </Link>
  </div>
  <p className="text-slate-300 line-clamp-3">{weeklySummary.summary}</p>
</Card>
```

**Fallback om ingen summering finns:**
- Visa ingenting (cleanest)
- ELLER visa uppmaning: "Du har X reflektioner förra veckan. Vill du generera en summering?"

**Implementation:**
1. Räkna ut förra veckans år/vecka
2. Hämta eventuell summering i loader
3. Visa Card om summering finns
4. Länka till tidslinjen för den veckan

## Server functions

### getRecentMoodAverage

```typescript
// src/server/functions/entries.ts

const recentMoodSchema = z.object({
  days: z.number().min(1).max(30).optional().default(7),
})

export const getRecentMoodAverage = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => recentMoodSchema.parse(data))
  .handler(async ({ data }) => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - data.days)
    
    const recentEntries = await db.query.entries.findMany({
      columns: { mood: true },
      where: gte(entries.date, startDate.toISOString().split('T')[0]),
    })
    
    if (recentEntries.length === 0) return null
    
    const average = recentEntries.reduce((sum, e) => sum + e.mood, 0) / recentEntries.length
    return {
      average,
      count: recentEntries.length,
    }
  })
```

### getLastWeekSummary

```typescript
// src/server/functions/weeklySummaries.ts

export const getLastWeekSummary = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { year, week } = getCurrentWeek()
    
    // Räkna ut förra veckan
    const lastWeek = week === 1 
      ? { year: year - 1, week: 52 } 
      : { year, week: week - 1 }
    
    const summary = await db.query.weeklySummaries.findFirst({
      where: and(
        eq(weeklySummaries.year, lastWeek.year),
        eq(weeklySummaries.week, lastWeek.week)
      ),
    })
    
    return summary ? { ...summary, ...lastWeek } : null
  }
)
```

## Uppdaterad dashboard loader

```typescript
// src/routes/index.tsx

loader: async () => {
  const [
    hasEntries, 
    todayEntry, 
    moodTrend, 
    streak,
    recentMood,      // NY
    lastWeekSummary, // NY
  ] = await Promise.all([
    hasAnyEntries(),
    getTodayEntry(),
    getMoodTrend({ data: { limit: 30 } }),
    getStreak(),
    getRecentMoodAverage({ data: { days: 7 } }),  // NY
    getLastWeekSummary(),                          // NY
  ])

  return {
    hasEntries,
    todayEntry,
    moodTrend,
    streak,
    recentMood,
    lastWeekSummary,
  }
}
```

## Layout-förslag för dashboarden

```
┌─────────────────────────────────────┐
│  Dagens reflektion / Hur var din dag│
└─────────────────────────────────────┘

┌─────────────────┐  ┌─────────────────┐
│  🔥 Streak      │  │  😊 Snitthumör  │
│  5 dagar        │  │  En bra vecka   │
└─────────────────┘  └─────────────────┘

┌─────────────────────────────────────┐
│  📅 Förra veckan                    │
│  "En produktiv vecka med fokus..."  │
│                          Se mer →   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  📈 Hur du har mått (trend-graf)    │
└─────────────────────────────────────┘
```

**Alternativ:** Streak och snitthumör på samma rad med grid:
```tsx
<div className="grid grid-cols-2 gap-4">
  <StreakCard streak={streak} />
  <MoodAverageCard recentMood={recentMood} />
</div>
```

## Acceptanskriterier

- [ ] Ny server function `getRecentMoodAverage()` skapad
- [ ] Ny server function `getLastWeekSummary()` skapad
- [ ] Dashboard visar genomsnittligt humör med beskrivning
- [ ] Dashboard visar förra veckans summering (om den finns)
- [ ] Länk till tidslinjen från veckosummeringen
- [ ] Responsiv layout (streak + mood side-by-side på desktop, stacked på mobil)
- [ ] MoodEmoji-komponent återanvänds för visuell indikation

## Framtida förbättringar

- Jämförelse med föregående period ("Bättre än förra veckan!")
- Animerad emoji baserat på trend (uppåt/nedåt-pil)
- "På denna dag förra året" nostalgi-funktion
- Kompakt statistik-rad med totalt antal reflektioner
