# Feature Suggestions for Skymning

Feature-forslag baserade på nuvarande funktionalitet och naturliga utbyggnadsmojligheter.

---

## 1. Humorkarta (Mood Heatmap Calendar)

**Vad:** En kalendervy som visar humorfarg for varje dag, liknande GitHubs contribution graph. Ger en snabb visuell oversikt over langre perioder (manad/kvartal/ar).

**Varfor:** Dashboardens 30-dagars trendlinje ar bra for detaljer, men en heatmap ger battre oversikt over manader och kan avsloja monstren som inte syns i en linjegraf - t.ex. att vissa veckor konsekvent ar lagre.

**Omfattning:**
- Ny route `/_authed/calendar` med manatlig/arsvy
- Anvand befintliga `MOOD_COLORS` for att farglagga rutor
- Klick pa en dag navigerar till den veckans timeline-vy

---

## 2. Taggar / Teman

**Vad:** Mojlighet att tagga dagliga reflektioner med teman som "Arbete", "Relationer", "Halsa", "Kreativitet", etc. Anvandaren kan valja fran fardiga taggar eller skapa egna.

**Varfor:** Over tid byggs en databas av teman som gor det mojligt att svara pa fragor som "Hur mar jag vanligtvis nar jag skriver om arbete?" eller "Vilka teman dyker upp nar jag mar bra?". AI-chatten kan ocksa referera till teman fran tidigare reflektioner.

**Omfattning:**
- Ny tabell `tags` (id, name, color) och kopplingstabell `entry_tags` (entry_id, tag_id)
- AI kan automatiskt foresla taggar baserat pa konversationsinnehall
- Filtrera timeline och trenddata per tagg
- Dashboard-widget som visar vanligaste teman

---

## 3. Manadssammanfattning (detaljerad design)

**Vad:** AI-genererad sammanfattning for hela manaden, byggd pa veckosammanfattningar och dagliga entries. Ger perspektiv pa langre trender och monster som inte syns vecka for vecka.

---

### 3.1 Designbeslut: Kalendermanad vs ISO-veckor

Veckosammanfattningar anvander ISO 8601-veckor (man-son), men manader foljer kalendern. En ISO-vecka kan spanna tva manader (t.ex. vecka 5 kan ha dagar i bade januari och februari).

**Valt tillvagagangssatt:** Kalendermanad for entries, ISO-veckor for sammanfattningar.

- Entries hamtas baserat pa kalenderdatum (`2025-03-01` till `2025-03-31`)
- Veckosammanfattningar inkluderas om veckan *overlappar* med manaden
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

Migration: En enkel `CREATE TABLE` + unikt index pa (year, month). Foljer exakt samma monster som `weekly_summaries`.

### 3.3 Datakalla for AI-generering

**Skiktad strategi** - anvand den basta tillgangliga datan:

```
Primardata:  Veckosammanfattningar som overlappar manaden
Sekundardata: Rå entries for veckor som saknar sammanfattning
Metadata:     Medelhumor, humorfordelning, antal reflektioner
```

Fordelar:
- Veckosammanfattningar ar redan kurerade och komprimerade → kortare prompt
- Fallback till rå entries sakerstaller att ingen data missas
- Metadata ger AI:n kvantitativ kontext utan att behova rakna sjalv

**Indata till AI:n (exempel):**

```
Statistik: 22 reflektioner, medelhumor 3.4 (Okej-Bra), spannet 1-5

Vecka 9 (sammanfattning):
En vecka med bade toppar och dalar. Du kampade med en trog start...

Vecka 10 (sammanfattning):
En lugn vecka utan dramatik. Rutinerna rullade pa som vanligt.

Vecka 11 (enskilda inlagg, ingen sammanfattning):
- Mandag (Bra): Produktiv dag, fick mycket gjort.
- Onsdag (Kass): Sjuk, lag hemma hela dagen.
- Fredag (Okej): Borjade kannas battre.

Vecka 12 (sammanfattning):
En fin vecka med stabilt bra humor...
```

### 3.4 AI-prompt

```typescript
export const MONTH_SUMMARY_SYSTEM_PROMPT = `# Uppgift
Sammanfatta folljande veckosammanfattningar och dagboksinlagg fran en hel manad
till en reflekterande manadssammanfattning pa svenska.

# Riktlinjer
- Lyft fram de storsta trenderna och monsterna under manaden
- Jamfor borjan och slutet av manaden – har nagon forandring skett?
- Namnn hogst 2-3 specifika handelser som stack ut mest
- Om manaden haft ett tydligt tema (stress, aterhamtning, tillvaxt), namn det
- Om manaden varit jamn och haindelselös, hall det kort (2-3 meningar)
- Om manaden haft tydlig utveckling, utveckla mer (3-5 meningar)
- Skriv i andra person ("du") for personlig kansla
- Hitta INTE pa detaljer som inte finns i underlaget
- Referera till veckor med "i borjan av manaden", "mitten av manaden",
  "mot slutet" snarare an veckonummer

# Exempel

<example>
Underlag: [4 veckosammanfattningar, varav vecka 1-2 lagre humor, vecka 3-4 hogre]

Sammanfattning:
Mars borjade tungt med stress pa jobbet och daligt somn, men vande
uppat mot mitten nar du hittade tillbaka till trningsrutinen. Samtalet
med din gamla van lyfte humöret markant, och manaden avslutades pa en
positiv not med fler sociala traffar an vanligt. Overlag en manad av
aterhamtning.
</example>

<example>
Underlag: [4 veckosammanfattningar, alla "okej"/stabila]

Sammanfattning:
En stabil manad utan stora svangningar. Vardagen rullade pa med jobb
och rutiner, och humöret holl sig javnt kring okej-nivan.
</example>

Svara ENDAST med sammanfattningen, ingen inledning eller kommentar.`
```

### 3.5 Server functions

Nya funktioner i `src/server/functions/monthlySummaries.ts`:

```typescript
// Hamta manadssammanfattning
getMonthlySummary({ year, month })     → MonthlySummary | null

// Skapa ny
createMonthlySummary({ year, month, summary })  → MonthlySummary

// Uppdatera befintlig
updateMonthlySummary({ year, month, summary })  → MonthlySummary

// Dashboard-hjalpare
getLastMonthSummary()                  → MonthlySummary & { year, month } | null
```

Ny funktion i `src/server/functions/entries.ts`:

```typescript
// Hamta entries for en hel manad (behövs for generering och manadsvyn)
getEntriesForMonth({ year, month })    → Entry[]
```

Implementationen av `getEntriesForMonth` filtrerar pa `entries.date` med
`>= 'YYYY-MM-01'` och `< 'YYYY-(MM+1)-01'` (textjamforelse funkar
for ISO-datumformat i SQLite).

Ny AI-funktion i `src/server/ai/index.ts`:

```typescript
generateMonthlySummary({ entries, weeklySummaries }) → string
```

Denna funktion:
1. Grupperar entries per ISO-vecka
2. For varje vecka: anvand veckosammanfattning om den finns, annars formatera entries
3. Beraknar statistik (medelhumor, antal reflektioner, humorfordelning)
4. Bygger prompten och anropar GPT-4o

### 3.6 Hjalp-utility: veckor i en manad

Ny util `src/utils/month.ts`:

```typescript
// Returnerar alla ISO-veckor som overlappar med en given manad
getWeeksInMonth(year: number, month: number): Array<{ year: number; week: number }>

// Returnerar { year, month } for foregaende manad
getPreviousMonth(year: number, month: number): { year: number; month: number }

// Manadens svenska namn
getMonthName(month: number): string  // "januari", "februari", etc.
```

### 3.7 UI: Manadsvy (ny route)

**Route:** `/_authed/timeline/$year/month/$month`

Layout som foljer veckovyns monster men pa manadsniva:

```
┌──────────────────────────────────────┐
│  ←  [Home]    Mars 2025    [→]       │  ← Header med manad-navigation
│      ← Förra    Denna månad   Nästa →│
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │ Månadens summering             │  │  ← MonthlySummarySection
│  │ 😊 Överlag en bra månad · 22   │  │     (samma 3-state-monster
│  │    reflektioner                 │  │      som WeeklySummarySection)
│  │                                 │  │
│  │ Mars började tungt med stress...│  │
│  │ [Redigera] [Regenerera]        │  │
│  └────────────────────────────────┘  │
│                                      │
│  Månadens veckor                     │
│  ┌────────────────────────────────┐  │
│  │ Vecka 9 · 😐 · 3 reflektioner │  │  ← Klickbar → navigerar till
│  │ "En vecka med bade toppar..."  │  │     /timeline/$year/$week
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

**Komponent:** `MonthlySummarySection` - ateranvander samma 3-state-monster som `WeeklySummarySection`:
1. Sammanfattning finns → visa med redigera/regenerera-knappar
2. Har entries men ingen sammanfattning → "Generera summering"-knapp
3. Inga entries → renderar inget

**Komponent:** `MonthWeekCard` - kort for varje vecka i manaden:
- Visar veckonummer, medelhumor-emoji, antal reflektioner
- Trunkerad veckosammanfattning (om den finns)
- Klickbar → navigerar till `/timeline/$year/$week`

### 3.8 Navigation

**Fran veckovyn:** Lagg till en "Se hela manaden"-lank i timeline-headern
nar man ar i en veckovy. Lanken gar till den manad som veckans mandag
tillhor.

**Fran dashboarden:** Nytt "Forra manaden"-kort (samma monster som
"Forra veckan") om en manadssammanfattning finns:

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

**Fran tidslinje-layouten:** Valfritt - lagg till en toggle
"Vecka / Manad" i timeline-headern for att vaxla mellan veckovy och
manadsvy.

### 3.9 Manad "komplett"-logik

En manad ar "komplett" (och kan generera sammanfattning) om:
- Det INTE ar nuvarande manad, ELLER
- Det ar nuvarande manad OCH det ar sista dagen i manaden

Detta foljer samma monster som veckovyns "isWeekComplete"-logik.
I praktiken: anvandaren genererar sammanfattning manuellt nar som helst
(aven mitt i manaden), men UI:t uppmuntrar det vid manadsskiftet.

### 3.10 Stegvis implementationsplan

| Steg | Beskrivning | Filer |
|------|-------------|-------|
| 1 | Lagg till `monthlySummaries` i schemat | `schema.ts` |
| 2 | `db:push` lokalt + generera migration | `drizzle/` |
| 3 | Skapa `src/utils/month.ts` | Ny fil |
| 4 | Skapa `src/server/functions/monthlySummaries.ts` | Ny fil |
| 5 | Lagg till `getEntriesForMonth` i entries.ts | `entries.ts` |
| 6 | Lagg till `MONTH_SUMMARY_SYSTEM_PROMPT` och `generateMonthlySummary` | `prompts.ts`, `ai/index.ts` |
| 7 | Skapa `MonthlySummarySection`-komponent | `components/timeline/` |
| 8 | Skapa `MonthWeekCard`-komponent | `components/timeline/` |
| 9 | Skapa route `/_authed/timeline/$year/month/$month.tsx` | `routes/` |
| 10 | Lagg till `getLastMonthSummary` + dashboard-kort | `index.tsx` |
| 11 | Lagg till navigation (veckovy → manadsvy, toggle) | Befintliga filer |

**Uppskattad komplexitet:** Medel. Foljjer etablerade monster exakt,
ingen ny infrastruktur behövs. Huvudarbetet ar UI-komponenter och
AI-prompten.

### 3.11 Framtida utbyggnad

- **Kvartalssammanfattning** - Samma monster, en niva upp
- **Arssammanfattning** - "Din 2025 i reflektion"
- **Automatisk generering** - Skapa manadssammanfattning automatiskt
  nar ny manad borjar (om foregaende manad har tillrackligt med data)
- **Jamforelse** - "Mars vs februari" sida vid sida

---

## 4. Sokfunktion

**Vad:** Fritext-sokning genom alla reflektioner och sammanfattningar. Hittade resultat visar datum, humormoji och ett textutdrag med matchningen markerad.

**Varfor:** Nar man har manader av reflektioner blir det vardefullt att kunna hitta specifika handelser eller tankar. "Nar skrev jag om det dar motet?" eller "Vilka dagar namnde jag traning?".

**Omfattning:**
- Soksida med debounced textinput
- Server function som soker i `entries.summary` och `chatMessages.content`
- Resultat grupperade per datum med mood-indikator
- Klickbar rad som navigerar till ratt vecka i timeline

---

## 5. Exportera data

**Vad:** Exportera alla reflektioner som JSON eller CSV. Inkluderar datum, humor, sammanfattning och valfritt chatthistorik.

**Varfor:** Anvandaren ager sin data. Export gor det mojligt att gora egna analyser, flytta till annan tjanst, eller helt enkelt ha en backup. Sarskilt viktigt for en personlig journaling-app.

**Omfattning:**
- Ny server function `exportEntries` med formatval (JSON/CSV)
- Filtrera pa datumintervall
- Inkludera/exkludera chathistorik
- Knapp i about-me-sidan eller en ny settings-sektion

---

## 6. Statistiksida

**Vad:** En dedikerad statistiksida med djupare analyser an vad dashboarden erbjuder.

**Varfor:** Dashboarden visar snabb oversikt, men for anvandare som vill ga djupare behov det mer. Statistiksidan samlar alla datadrivna insikter pa ett stalle.

**Mojliga visualiseringar:**
- Humorfordelning (cirkeldiagram over alla entries)
- Medelhumor per manad (stapeldiagram)
- Langsta streak-historik
- Vanligaste ord/teman i reflektioner
- Jemforelse: denna manad vs forra manaden
- Genomsnittlig reflektionslangd over tid

**Omfattning:**
- Ny route `/_authed/stats`
- Nya server functions for aggregerad data
- Anvand recharts (redan i projektet) for visualiseringar

---

## 7. Mal och Intentioner

**Vad:** Satt vecko- eller manadsmal ("Denna vecka vill jag...") och folj upp dem. AI-chatten kan referera till aktiva mal under reflektionen.

**Varfor:** Ger reflektionen riktning och syfte. Istallet for att bara titta bakut (vad hande idag?) kan anvandaren ocksa titta framat. Koppling till AI-chatten gor att malen paverkar konversationen naturligt.

**Omfattning:**
- Ny tabell `goals` (id, content, type: weekly/monthly, status, startDate, endDate, createdAt)
- Widget pa dashboarden for aktiva mal
- AI-prompten inkluderar aktiva mal som kontext
- Uppfoljning i veckosammanfattningen

---

## 8. Reflektionsmallar

**Vad:** Valbara mallar som styr AI-chattens fokus. Exempel: "Arbetsreflektion", "Tacksam for...", "Veckoplanering", "Kreativ session". Varje mall har ett anpassat systemprompt.

**Varfor:** Ibland vill man inte bara "prata om dagen" utan har ett specifikt behov. Mallar gor appen mer flexibel utan att overkomplicera grundflödet.

**Omfattning:**
- Predefined mallar i en constants-fil
- Malval i reflektionsstartskärmen (fore chatten borjar)
- Varje mall modifierar systemprompt och inledningsfras
- Eventuellt anvandarskapade mallar (sparas i DB)

---

## 9. Streak-utmaningar

**Vad:** Gamification-element med utmaningar kopplade till streaks och anvandning. Exempel: "Reflektera 7 dagar i rad", "Skriv en reflektion langre an 200 ord", "Anvand alla 5 humornivåer pa en vecka".

**Varfor:** StreakCard finns redan och visar milestones. Utmaningar bygger vidare pa denna motivation utan att gora appen stressig - de ska vara uppmuntrande, inte krävande.

**Omfattning:**
- Definiera utmaningar som konfiguration (inte DB-driven, for enkelhets skull)
- Berakna progress i server function baserat pa befintlig data
- Visa aktiva/avklarade utmaningar pa dashboarden
- Subtila animationer vid avklarad utmaning

---

## 10. Rostinmatning

**Vad:** Mojlighet att spela in en rostreflektion som transkriberas till text med Whisper API. Texten anvands sedan i chatten eller som snabbinmatning.

**Varfor:** Ibland ar det lattare att prata an att skriva - sarskilt pa mobilen eller nar man ar trott. Sanker troskeln for att reflektera, vilket bor oka anvandningsfrekvensen.

**Omfattning:**
- MediaRecorder API i browsern for inspelning
- Server function som skickar ljud till OpenAI Whisper API
- Transkriberad text infogas i chattinmatningsfaltet eller snabbinmatningen
- Visuell inspelningsindikator

---

## Prioriteringsforslag

| Prioritet | Feature | Motivering |
|-----------|---------|------------|
| Hog | Sokfunktion | Hogt vardeutfall, begransad insats |
| Hog | Humorkarta | Visuellt tilltalande, anvander befintlig data |
| Hog | Exportera data | Viktigt for anvandartillit |
| Medel | Taggar / Teman | Berikar data over tid, mer komplex |
| Medel | Statistiksida | Naturlig extension av befintliga insikter |
| Medel | Manadssammanfattning | Bygger pa befintlig veckosammanfattning |
| Lagre | Mal och Intentioner | Vardefullt men storre scope |
| Lagre | Reflektionsmallar | Nice-to-have, ej kritiskt |
| Lagre | Streak-utmaningar | Gamification kan vara polariserande |
| Lagre | Rostinmatning | Bra UX men externt API-beroende |
