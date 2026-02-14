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

## 3. Manadssammanfattning

**Vad:** Automatisk AI-genererad sammanfattning for hela manaden, byggd pa veckans sammanfattningar och dagliga entries.

**Varfor:** Veckosammanfattningar finns redan - manadssammanfattningar ar en naturlig forlangning som ger perspektiv pa langre trender. Bra for att upptacka storre monster som inte syns vecka for vecka.

**Omfattning:**
- Ny tabell `monthly_summaries` (id, year, month, summary, createdAt)
- Ny server function `generateMonthlySummary` som aggregerar veckans sammanfattningar
- Visa i timeline-vyn som en oversikt ovanfor veckorna
- Genereras automatiskt nar en manad ar slut (eller manuellt)

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
