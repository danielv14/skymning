# Feature: AI-summering i Snabb logg

## Sammanfattning
I "Snabb logg"-läget (`/quick`) finns idag ingen AI-koppling. Användaren skriver sin reflektion manuellt i en textarea. Denna feature lägger till möjligheten att få AI-hjälp med att summera/förbättra det man skrivit.

## Nuvarande flöde
1. Användaren väljer mood (1-5)
2. Användaren skriver sammanfattning manuellt i textarea
3. Användaren klickar "Spara dagen"

## Nytt flöde
1. Användaren väljer mood (1-5)
2. Användaren skriver sin reflektion i textarea
3. **Nytt:** Användaren kan klicka på en "AI-summering"-knapp
4. **Nytt:** En modal öppnas där AI-genererad sammanfattning visas
5. **Nytt:** Användaren kan redigera, generera om, eller använda sammanfattningen
6. Användaren sparar reflektionen (antingen via modal eller direkt)

## Krav

### Funktionella krav
- Ny knapp "Få AI-summering" (eller liknande) visas bredvid/under textarea
- Knappen ska bara vara aktiv om det finns text i textarea (minst X tecken?)
- Klick på knappen öppnar en modal
- Modalen visar AI-genererad sammanfattning i en redigerbar textarea
- "Generera om"-knapp som kör samma prompt igen
- "Använd denna"-knapp som stänger modalen och ersätter original-textarean med AI-texten
- "Avbryt"-knapp som stänger modalen utan ändringar

### Tekniska krav
- Återanvänd modal-komponenten från `feature-completion-modal.md` (samma base-ui approach)
- Skapa en ny server-funktion för att generera summering från fritext (inte chattmeddelanden)
- Loading-state vid generering/omgenerering
- Felhantering om AI-generering misslyckas

## Implementation

### Ny server-funktion
Skapa i `src/server/ai/index.ts` eller `src/server/ai/prompts.ts`:

```typescript
export const generateQuickSummary = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => 
    z.object({ 
      text: z.string().min(10),
      mood: z.number().min(1).max(5).optional()
    }).parse(data)
  )
  .handler(async ({ data }) => {
    // Generera en sammanfattning baserat på användarens fritext
    // Kan ta hänsyn till mood om det är valt
  })
```

### Prompt för summering
Prompten bör:
- Ta användarens råtext och göra den mer reflekterande
- Behålla kärnan av vad användaren skrev
- Vara lagom kort (2-4 meningar)
- Matcha tonen baserat på mood om det är valt

Exempel-prompt:
```
Du hjälper användaren att sammanfatta sin dagsreflektion.
Ta användarens text och gör en kortfattad, reflekterande sammanfattning på svenska.
Behåll de viktigaste händelserna och känslorna.
Skriv i första person.
Max 2-4 meningar.
```

### Komponentstruktur
```
src/components/
  reflection/
    QuickSummaryModal.tsx    # Modal för AI-summering i quick-läge
    # Återanvänd befintliga komponenter:
    # - SummaryEditor.tsx (textarea)
```

### UI-placering i quick.tsx
Knappen kan placeras:
- Under textarea, bredvid teckenmätaren
- Som en liten ikon-knapp i textarea-hörnet
- Som en sekundär knapp i action-raden

Förslag:
```tsx
<div className="flex justify-between items-center mt-2">
  <Button 
    variant="ghost" 
    size="sm"
    onClick={openAiModal}
    disabled={summary.length < 20}
  >
    ✨ Få AI-summering
  </Button>
  <p className="text-sm text-slate-500">
    {summary.length} tecken
  </p>
</div>
```

### Modal-innehåll
1. **Header**: "AI-summering" 
2. **Info-text**: "Baserat på det du skrev:"
3. **Sammanfattning**: 
   - Textarea med AI-genererad text
   - "Generera om"-knapp
4. **Actions**:
   - "Avbryt" (sekundär)
   - "Använd denna" (primär) - ersätter original-textarea

### Skillnad mot completion-modal
| Aspect | Completion Modal | Quick Summary Modal |
|--------|------------------|---------------------|
| Källa | Chat-meddelanden | Fritext från textarea |
| Mood-val | Ja, i modalen | Nej, redan valt utanför |
| Spara | Direkt från modal | Ersätter textarea, sparar sedan |
| Avbryt | Fortsätt chatta | Stäng modal, behåll original |

## Design

### Färger (samma som completion-modal)
- Bakgrund: `slate-800` med `slate-900` overlay
- Border: `slate-700`
- Text: `stone-100`
- Accent: `indigo-500` / `violet-500`

### Knapp-styling
- Ghost/link-variant för "Få AI-summering"
- Eventuellt med sparkle-emoji eller ikon
- Disabled state om för lite text

## Acceptanskriterier
- [ ] "Få AI-summering"-knapp visas under textarea
- [ ] Knappen är disabled om textarea har < 20 tecken
- [ ] Klick öppnar modal med loading-state
- [ ] AI-sammanfattning genereras och visas
- [ ] Textarea i modal är redigerbar
- [ ] "Generera om" fungerar
- [ ] "Använd denna" ersätter original-textarea och stänger modal
- [ ] "Avbryt" stänger modal utan ändringar
- [ ] Loading-states visas korrekt
- [ ] Styling matchar appens tema

## Beslut
1. **Minimum antal tecken:** 20 tecken för att aktivera AI-knappen
2. **Mood påverkar tonen:** Ja, AI:n anpassar tonen baserat på valt mood (mer empatisk vid lågt mood)
3. **Längd:** Kortare än original - syftet är att hjälpa användaren strukturera sina tankar
