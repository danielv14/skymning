# Feature: Chat Context - Historiska reflektioner

## Sammanfattning
AI-chatten ska automatiskt få tillgång till användarens senaste reflektioner för att ha bättre förståelse för användarens livssituation och kunna ge mer relevanta svar.

## Krav

### Funktionella krav
- Chatten ska automatiskt inkludera de **senaste 20 reflektionerna** i AI-prompten
- Hela sammanfattningen (summary) från varje reflektion ska inkluderas
- Mood-värdet ska inkluderas för varje reflektion
- Datumet för varje reflektion ska inkluderas
- Konfigurationen ska vara enkel att ändra i kod (antal reflektioner)

### Tekniska krav
- Skapa en config-fil eller konstant för antal reflektioner att inkludera
- Uppdatera `src/server/ai/prompts.ts` för att hantera historisk kontext
- Hämta reflektioner via befintlig server-funktion eller skapa ny
- Reflektionerna ska sorteras kronologiskt (äldst först) i prompten

## Implementation

### Config
```typescript
// src/constants/index.ts eller liknande
export const CHAT_CONTEXT_CONFIG = {
  maxPreviousEntries: 20,
}
```

### Prompt-struktur
Systemprompten ska utökas med något i stil med:

```
## Användarens tidigare reflektioner
Här är användarens senaste reflektioner för att ge dig kontext:

[2026-01-01] Mood: 4/5
Sammanfattning: ...

[2026-01-02] Mood: 3/5
Sammanfattning: ...
```

## Acceptanskriterier
- [ ] AI:n kan referera till tidigare händelser användaren nämnt
- [ ] Antal reflektioner är konfigurerbart i kod
- [ ] Prestanda påverkas inte märkbart (tokens ökar men är acceptabelt)
- [ ] Reflektioner hämtas effektivt från databasen
