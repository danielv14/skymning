# Feature Suggestions för Skymning

Feature-förslag baserade på nuvarande funktionalitet och naturliga utbyggnadsmöjligheter.

---

## 1. Humörkarta (Mood Heatmap Calendar)

**Vad:** En kalendervy som visar humörfärg för varje dag, liknande GitHubs contribution graph. Ger en snabb visuell översikt över längre perioder (månad/kvartal/år).

**Varför:** Dashboardens 30-dagars trendlinje är bra för detaljer, men en heatmap ger bättre översikt över månader och kan avslöja mönstren som inte syns i en linjegraf - t.ex. att vissa veckor konsekvent är lägre.

**Omfattning:**
- Ny route `/_authed/calendar` med månads-/årsvy
- Använd befintliga `MOOD_COLORS` för att färglägga rutor
- Klick på en dag navigerar till den veckans timeline-vy

---

## 2. Taggar / Teman

**Vad:** Möjlighet att tagga dagliga reflektioner med teman som "Arbete", "Relationer", "Hälsa", "Kreativitet", etc. Användaren kan välja från färdiga taggar eller skapa egna.

**Varför:** Över tid byggs en databas av teman som gör det möjligt att svara på frågor som "Hur mår jag vanligtvis när jag skriver om arbete?" eller "Vilka teman dyker upp när jag mår bra?". AI-chatten kan också referera till teman från tidigare reflektioner.

**Omfattning:**
- Ny tabell `tags` (id, name, color) och kopplingstabell `entry_tags` (entry_id, tag_id)
- AI kan automatiskt föreslå taggar baserat på konversationsinnehåll
- Filtrera timeline och trenddata per tagg
- Dashboard-widget som visar vanligaste teman

---

## 3. Månadssammanfattning (detaljerad design)

**Vad:** AI-genererad sammanfattning för hela månaden, byggd på veckosammanfattningar och dagliga entries. Ger perspektiv på längre trender och mönster som inte syns vecka för vecka.

---

### 3.1 Designbeslut: Kalendermånad vs ISO-veckor

Veckosammanfattningar använder ISO 8601-veckor (mån-sön), men månader följer kalendern. En ISO-vecka kan spänna två månader (t.ex. vecka 5 kan ha dagar i både januari och februari).

**Valt tillvägagångssätt:** Kalendermånad för entries, ISO-veckor för sammanfattningar.

- Entries hämtas baserat på kalenderdatum (`2025-03-01` till `2025-03-31`)
- Veckosammanfattningar inkluderas om veckan *överlappar* med månaden
- Detta ger en intuitiv upplevelse ("mars sammanfattning" = alla dagar i mars)

### 3.2 Databas

Ny tabell `monthly_summaries`:

```typescript
export const monthlySummaries = sqliteTable(
  "monthly_summaries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    year: integer("year").notNull(),
    month: integer("month").notNull(), // 1-12
    summary: text("summary").notNull(),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [unique("year_month_unique").on(table.year, table.month)]
)

export type MonthlySummary = typeof monthlySummaries.$inferSelect
```

Migration: En enkel `CREATE TABLE` + unikt index på (year, month). Följer exakt samma mönster som `weekly_summaries`.

### 3.3 Datakälla för AI-generering

**Skiktad strategi** - använd den bästa tillgängliga datan:

```
Primärdata:   Veckosammanfattningar som överlappar månaden
Sekundärdata: Råa entries för veckor som saknar sammanfattning
Metadata:     Medelhumör, humörfördelning, antal reflektioner
```

Fördelar:
- Veckosammanfattningar är redan kurerade och komprimerade → kortare prompt
- Fallback till råa entries säkerställer att ingen data missas
- Metadata ger AI:n kvantitativ kontext utan att behöva räkna själv

**Indata till AI:n (exempel):**

```
Statistik: 22 reflektioner, medelhumör 3.4 (Okej-Bra), spannet 1-5

Vecka 9 (sammanfattning):
En vecka med både toppar och dalar. Du kämpade med en trög start...

Vecka 10 (sammanfattning):
En lugn vecka utan dramatik. Rutinerna rullade på som vanligt.

Vecka 11 (enskilda inlägg, ingen sammanfattning):
- Måndag (Bra): Produktiv dag, fick mycket gjort.
- Onsdag (Kass): Sjuk, låg hemma hela dagen.
- Fredag (Okej): Började kännas bättre.

Vecka 12 (sammanfattning):
En fin vecka med stabilt bra humör...
```

### 3.4 AI-prompt

```typescript
export const MONTH_SUMMARY_SYSTEM_PROMPT = `# Uppgift
Sammanfatta följande veckosammanfattningar och dagboksinlägg från en hel månad
till en reflekterande månadssammanfattning på svenska.

# Riktlinjer
- Lyft fram de största trenderna och mönstren under månaden
- Jämför början och slutet av månaden – har någon förändring skett?
- Nämn högst 2-3 specifika händelser som stack ut mest
- Om månaden haft ett tydligt tema (stress, återhämtning, tillväxt), nämn det
- Om månaden varit jämn och händelselös, håll det kort (2-3 meningar)
- Om månaden haft tydlig utveckling, utveckla mer (3-5 meningar)
- Skriv i andra person ("du") för personlig känsla
- Hitta INTE på detaljer som inte finns i underlaget
- Referera till veckor med "i början av månaden", "mitten av månaden",
  "mot slutet" snarare än veckonummer

# Exempel

<example>
Underlag: [4 veckosammanfattningar, varav vecka 1-2 lägre humör, vecka 3-4 högre]

Sammanfattning:
Mars började tungt med stress på jobbet och dålig sömn, men vände
uppåt mot mitten när du hittade tillbaka till träningsrutinen. Samtalet
med din gamla vän lyfte humöret markant, och månaden avslutades på en
positiv not med fler sociala träffar än vanligt. Överlag en månad av
återhämtning.
</example>

<example>
Underlag: [4 veckosammanfattningar, alla "okej"/stabila]

Sammanfattning:
En stabil månad utan stora svängningar. Vardagen rullade på med jobb
och rutiner, och humöret höll sig jämnt kring okej-nivån.
</example>

Svara ENDAST med sammanfattningen, ingen inledning eller kommentar.`
```

### 3.5 Server functions

Nya funktioner i `src/server/functions/monthlySummaries.ts`:

```typescript
// Hämta månadssammanfattning
getMonthlySummary({ year, month })     → MonthlySummary | null

// Skapa ny
createMonthlySummary({ year, month, summary })  → MonthlySummary

// Uppdatera befintlig
updateMonthlySummary({ year, month, summary })  → MonthlySummary

// Dashboard-hjälpare
getLastMonthSummary()                  → MonthlySummary & { year, month } | null
```

Ny funktion i `src/server/functions/entries.ts`:

```typescript
// Hämta entries för en hel månad (behövs för generering och månadsvyn)
getEntriesForMonth({ year, month })    → Entry[]
```

Implementationen av `getEntriesForMonth` filtrerar på `entries.date` med
`>= 'YYYY-MM-01'` och `< 'YYYY-(MM+1)-01'` (textjämförelse funkar
för ISO-datumformat i SQLite).

Ny AI-funktion i `src/server/ai/index.ts`:

```typescript
generateMonthlySummary({ entries, weeklySummaries }) → string
```

Denna funktion:
1. Grupperar entries per ISO-vecka
2. För varje vecka: använd veckosammanfattning om den finns, annars formatera entries
3. Beräknar statistik (medelhumör, antal reflektioner, humörfördelning)
4. Bygger prompten och anropar GPT-4o

### 3.6 Hjälp-utility: veckor i en månad

Ny util `src/utils/month.ts`:

```typescript
// Returnerar alla ISO-veckor som överlappar med en given månad
getWeeksInMonth(year: number, month: number): Array<{ year: number; week: number }>

// Returnerar { year, month } för föregående månad
getPreviousMonth(year: number, month: number): { year: number; month: number }

// Månadens svenska namn
getMonthName(month: number): string  // "januari", "februari", etc.
```

### 3.7 UI: Månadsvy (ny route)

**Route:** `/_authed/timeline/$year/month/$month`

Layout som följer veckovyns mönster men på månadsnivå:

```
┌──────────────────────────────────────┐
│  ←  [Home]    Mars 2025    [→]       │  ← Header med månads-navigation
│      ← Förra    Denna månad   Nästa →│
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │ Månadens summering             │  │  ← MonthlySummarySection
│  │ 😊 Överlag en bra månad · 22   │  │     (samma 3-state-mönster
│  │    reflektioner                 │  │      som WeeklySummarySection)
│  │                                 │  │
│  │ Mars började tungt med stress...│  │
│  │ [Redigera] [Regenerera]        │  │
│  └────────────────────────────────┘  │
│                                      │
│  Månadens veckor                     │
│  ┌────────────────────────────────┐  │
│  │ Vecka 9 · 😐 · 3 reflektioner │  │  ← Klickbar → navigerar till
│  │ "En vecka med både toppar..."  │  │     /timeline/$year/$week
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Vecka 10 · 😊 · 5 reflektioner│  │
│  │ "En lugn vecka utan dramatik." │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Vecka 11 · ❌ Ingen summering  │  │
│  │ 2 reflektioner                 │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Vecka 12 · 😊 · 4 reflektioner│  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

**Komponent:** `MonthlySummarySection` - återanvänder samma 3-state-mönster som `WeeklySummarySection`:
1. Sammanfattning finns → visa med redigera/regenerera-knappar
2. Har entries men ingen sammanfattning → "Generera summering"-knapp
3. Inga entries → renderar inget

**Komponent:** `MonthWeekCard` - kort för varje vecka i månaden:
- Visar veckonummer, medelhumör-emoji, antal reflektioner
- Trunkerad veckosammanfattning (om den finns)
- Klickbar → navigerar till `/timeline/$year/$week`

### 3.8 Navigation

**Från veckovyn:** Lägg till en "Se hela månaden"-länk i timeline-headern
när man är i en veckovy. Länken går till den månad som veckans måndag
tillhör.

**Från dashboarden:** Nytt "Förra månaden"-kort (samma mönster som
"Förra veckan") om en månadssammanfattning finns:

```tsx
{lastMonthSummary && (
  <div className="bento-full">
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="...">Förra månaden</h3>
        <Link to="/timeline/$year/month/$month" params={{...}}>
          Se hela månaden →
        </Link>
      </div>
      <p className="text-slate-300 leading-relaxed line-clamp-3">
        {lastMonthSummary.summary}
      </p>
    </Card>
  </div>
)}
```

**Från tidslinje-layouten:** Valfritt - lägg till en toggle
"Vecka / Månad" i timeline-headern för att växla mellan veckovy och
månadsvy.

### 3.9 Månad "komplett"-logik

En månad är "komplett" (och kan generera sammanfattning) om:
- Det INTE är nuvarande månad, ELLER
- Det är nuvarande månad OCH det är sista dagen i månaden

Detta följer samma mönster som veckovyns "isWeekComplete"-logik.
I praktiken: användaren genererar sammanfattning manuellt när som helst
(även mitt i månaden), men UI:t uppmuntrar det vid månadsskiftet.

### 3.10 Stegvis implementationsplan

| Steg | Beskrivning | Filer |
|------|-------------|-------|
| 1 | Lägg till `monthlySummaries` i schemat | `schema.ts` |
| 2 | `db:push` lokalt + generera migration | `drizzle/` |
| 3 | Skapa `src/utils/month.ts` | Ny fil |
| 4 | Skapa `src/server/functions/monthlySummaries.ts` | Ny fil |
| 5 | Lägg till `getEntriesForMonth` i entries.ts | `entries.ts` |
| 6 | Lägg till `MONTH_SUMMARY_SYSTEM_PROMPT` och `generateMonthlySummary` | `prompts.ts`, `ai/index.ts` |
| 7 | Skapa `MonthlySummarySection`-komponent | `components/timeline/` |
| 8 | Skapa `MonthWeekCard`-komponent | `components/timeline/` |
| 9 | Skapa route `/_authed/timeline/$year/month/$month.tsx` | `routes/` |
| 10 | Lägg till `getLastMonthSummary` + dashboard-kort | `index.tsx` |
| 11 | Lägg till navigation (veckovy → månadsvy, toggle) | Befintliga filer |

**Uppskattad komplexitet:** Medel. Följer etablerade mönster exakt,
ingen ny infrastruktur behövs. Huvudarbetet är UI-komponenter och
AI-prompten.

### 3.11 Framtida utbyggnad

- **Kvartalssammanfattning** - Samma mönster, en nivå upp
- **Årssammanfattning** - "Din 2025 i reflektion"
- **Automatisk generering** - Skapa månadssammanfattning automatiskt
  när ny månad börjar (om föregående månad har tillräckligt med data)
- **Jämförelse** - "Mars vs februari" sida vid sida

---

## 4. Sökfunktion

**Vad:** Fritext-sökning genom alla reflektioner och sammanfattningar. Hittade resultat visar datum, humörmoji och ett textutdrag med matchningen markerad.

**Varför:** När man har månader av reflektioner blir det värdefullt att kunna hitta specifika händelser eller tankar. "När skrev jag om det där mötet?" eller "Vilka dagar nämnde jag träning?".

**Omfattning:**
- Söksida med debounced textinput
- Server function som söker i `entries.summary` och `chatMessages.content`
- Resultat grupperade per datum med mood-indikator
- Klickbar rad som navigerar till rätt vecka i timeline

---

## 5. Exportera data

**Vad:** Exportera alla reflektioner som JSON eller CSV. Inkluderar datum, humör, sammanfattning och valfritt chatthistorik.

**Varför:** Användaren äger sin data. Export gör det möjligt att göra egna analyser, flytta till annan tjänst, eller helt enkelt ha en backup. Särskilt viktigt för en personlig journaling-app.

**Omfattning:**
- Ny server function `exportEntries` med formatval (JSON/CSV)
- Filtrera på datumintervall
- Inkludera/exkludera chatthistorik
- Knapp i about-me-sidan eller en ny settings-sektion

---

## 6. Statistiksida

**Vad:** En dedikerad statistiksida med djupare analyser än vad dashboarden erbjuder.

**Varför:** Dashboarden visar snabb översikt, men för användare som vill gå djupare behövs det mer. Statistiksidan samlar alla datadrivna insikter på ett ställe.

**Möjliga visualiseringar:**
- Humörfördelning (cirkeldiagram över alla entries)
- Medelhumör per månad (stapeldiagram)
- Längsta streak-historik
- Vanligaste ord/teman i reflektioner
- Jämförelse: denna månad vs förra månaden
- Genomsnittlig reflektionslängd över tid

**Omfattning:**
- Ny route `/_authed/stats`
- Nya server functions för aggregerad data
- Använd recharts (redan i projektet) för visualiseringar

---

## 7. Mål och Intentioner

**Vad:** Sätt vecko- eller månadsmål ("Denna vecka vill jag...") och följ upp dem. AI-chatten kan referera till aktiva mål under reflektionen.

**Varför:** Ger reflektionen riktning och syfte. Istället för att bara titta bakåt (vad hände idag?) kan användaren också titta framåt. Koppling till AI-chatten gör att målen påverkar konversationen naturligt.

**Omfattning:**
- Ny tabell `goals` (id, content, type: weekly/monthly, status, startDate, endDate, createdAt)
- Widget på dashboarden för aktiva mål
- AI-prompten inkluderar aktiva mål som kontext
- Uppföljning i veckosammanfattningen

---

## 8. Reflektionsmallar

**Vad:** Valbara mallar som styr AI-chattens fokus. Exempel: "Arbetsreflektion", "Tacksam för...", "Veckoplanering", "Kreativ session". Varje mall har ett anpassat systemprompt.

**Varför:** Ibland vill man inte bara "prata om dagen" utan har ett specifikt behov. Mallar gör appen mer flexibel utan att överkomplicera grundflödet.

**Omfattning:**
- Fördefinierade mallar i en constants-fil
- Mallval i reflektionsstartskärmen (före chatten börjar)
- Varje mall modifierar systemprompt och inledningsfras
- Eventuellt användarskapade mallar (sparas i DB)

---

## 9. Streak-utmaningar

**Vad:** Gamification-element med utmaningar kopplade till streaks och användning. Exempel: "Reflektera 7 dagar i rad", "Skriv en reflektion längre än 200 ord", "Använd alla 5 humörnivåer på en vecka".

**Varför:** StreakCard finns redan och visar milestones. Utmaningar bygger vidare på denna motivation utan att göra appen stressig - de ska vara uppmuntrande, inte krävande.

**Omfattning:**
- Definiera utmaningar som konfiguration (inte DB-driven, för enkelhets skull)
- Beräkna progress i server function baserat på befintlig data
- Visa aktiva/avklarade utmaningar på dashboarden
- Subtila animationer vid avklarad utmaning

---

## 10. Röstinmatning

**Vad:** Möjlighet att spela in en röstreflektion som transkriberas till text med Whisper API. Texten används sedan i chatten eller som snabbinmatning.

**Varför:** Ibland är det lättare att prata än att skriva - särskilt på mobilen eller när man är trött. Sänker tröskeln för att reflektera, vilket bör öka användningsfrekvensen.

**Omfattning:**
- MediaRecorder API i browsern för inspelning
- Server function som skickar ljud till OpenAI Whisper API
- Transkriberad text infogas i chattinmatningsfältet eller snabbinmatningen
- Visuell inspelningsindikator

---

## Prioriteringsförslag

| Prioritet | Feature | Motivering |
|-----------|---------|------------|
| Hög | Sökfunktion | Högt värdeutfall, begränsad insats |
| Hög | Humörkarta | Visuellt tilltalande, använder befintlig data |
| Hög | Exportera data | Viktigt för användartillit |
| Medel | Taggar / Teman | Berikar data över tid, mer komplex |
| Medel | Statistiksida | Naturlig extension av befintliga insikter |
| Medel | Månadssammanfattning | Bygger på befintlig veckosammanfattning |
| Lägre | Mål och Intentioner | Värdefullt men större scope |
| Lägre | Reflektionsmallar | Nice-to-have, ej kritiskt |
| Lägre | Streak-utmaningar | Gamification kan vara polariserande |
| Lägre | Röstinmatning | Bra UX men externt API-beroende |
