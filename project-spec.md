# Skymning

## Vad är det?

En lokal dagboks- och moodtracking-app för personligt bruk. Kärnan är en AI-guidad chatt som hjälper till att reflektera över dagen – inte bara skriva fritt, utan med en samtalspartner som ställer följdfrågor och guidar en att sätta ord på hur det egentligen kändes. Allt sparas lokalt för att slippa krångla med säkerhet och autentisering – det här är ett hobbyprojekt och känslig data ska inte lämna datorn.

## Stack

- **Bun** – runtime och pakethanterare
- **TanStack Start** – fullstack React-ramverk med SSR, server functions och routing i ett paket
- **React 19** – frontend med moderna features som Suspense och andra nya API:er
- **TanStack Router** – ingår i Start, routing med view transitions och typsäkra loaders
- **Lucide** – ikoner, används sparsamt där de faktiskt gör skillnad för gränssnittet
- **Tailwind CSS** – styling
- **Base UI** – headless komponenter (modaler, inputs etc.) som stylas med Tailwind
- **Drizzle ORM** – typesafe databashantering
- **SQLite** – lokal databas (ej incheckad)
- **TanStack AI + Anthropic** – AI för chatt och summering, har förstklassig integration med Start
- **Zod** – schemavalidering, används med server functions för typsäker input

## Datamodell

Behöver utforskas mer i detalj, men i grova drag: inlägg med datum, summering och mood-score, samt chatthistorik kopplat till varje dag.

## Features (MVP)

- **Daglig chatt** – AI med genomtänkt prompt guidar användaren genom dagens händelser och känslor, ställer följdfrågor och hjälper gräva djupare. En chatt per dag, tänkt att användas i slutet av dagen.
- **Spara dagen** – när chatten är klar väljer användaren en helhetskänsla (jättebra/bra/okej/dålig/kass), chatthistoriken skickas till AI för summering, och allt sparas som dagens inlägg. Det som skrivits är skrivet – ingen redigering eller borttagning.
- **Veckosummering** – en vy som hämtar veckans inlägg och genererar en AI-summering av mönster och teman. Genereras on-demand vid första visning och sparas sedan i databasen.
- **Tidslinje** – möjlighet att bläddra bakåt veckovis och se tidigare summeringar.
- **Moodtrend** – en trendlinje som visar hur man mått över de senaste ~50 inläggen (eller liknande), för att se mönster över tid oavsett hur regelbundet man loggar.

## Promptar (utkast)

Tre promptar behövs serverside. Dessa är utgångspunkter att förfina:

### 1. Reflektionsprompt (daglig chatt)

```
Du är en varm och nyfiken samtalspartner som hjälper användaren reflektera över sin dag. Ställ öppna följdfrågor, var nyfiken på känslor och detaljer, men pressa inte. Håll en mjuk och stöttande ton. Svara på svenska. Håll dina svar kortfattade – ett par meningar räcker oftast. Målet är att hjälpa användaren sätta ord på hur dagen kändes.
```

### 2. Dagssummeringsprompt

```
Sammanfatta följande konversation till ett kort dagboksinlägg på svenska. Fånga de viktigaste händelserna och känslorna. Skriv i jag-form som om användaren själv skrivit det. Håll det personligt och varmt, max 3-4 meningar.
```

### 3. Veckosummeringsprompt

```
Här är dagboksinlägg från en vecka. Sammanfatta veckan på svenska: vilka teman eller mönster syns? Hur har stämningsläget varit? Lyft fram både utmaningar och ljuspunkter. Håll det kort och reflekterande, max ett stycke.
```

## UX

- Svenska genomgående, med en tonalitet som matchar den varma, mjuka designen
- Första besöket visas en välkomstsida som introducerar appen
- Startsida är en dashboard/översikt med moodtrend, knapp till dagens reflektion (eller status om redan gjord), och senaste veckosummeringen
- Tidslinje för historik lever i en separat vy
- Om dagens reflektion redan är gjord visas en "du har redan reflekterat"-vy istället för chatten

## Design

Mjukt, vänligt typsnitt som passar appens varma känsla. Mjuka, lekfulla former med generösa radier och bubbliga chatbubblor. Varma beiga toner med en kontrastfärg som passar skymningstemat – möjligen åt espresso-hållet för text. Känslan ska vara lugn, inbjudande och modern.
