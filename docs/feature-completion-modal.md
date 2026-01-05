# Feature: Modal vid avslut av chatt

## Sammanfattning
När användaren klickar "Färdig" efter en chatt-session ska en modal öppnas där användaren kan välja sitt mood, se/redigera AI-genererad sammanfattning, och spara reflektionen.

## Krav

### Funktionella krav
- Modal öppnas när användaren klickar "Färdig"
- Användaren väljer mood (1-5 skala, samma som befintliga MoodEmoji)
- AI-genererad sammanfattning visas i en textarea
- Användaren kan redigera sammanfattningen manuellt
- "Generera om"-knapp som kör samma prompt igen
- "Spara"-knapp för att spara reflektionen
- "Avbryt"-knapp för att stänga modalen och fortsätta chatta

### Tekniska krav
- Använd **base-ui** för modal-komponenten
- Anpassa styling till befintligt tema (slate/indigo)
- Textarea ska vara redigerbar
- Loading-state vid generering/omgenerering
- Felhantering om AI-generering misslyckas

## Implementation

### Dependencies
```bash
bun add @base-ui-components/react
```

### Komponentstruktur
```
src/components/
  reflection/
    CompletionModal.tsx    # Huvudmodal
    MoodSelector.tsx       # Mood-väljare (1-5)
    SummaryEditor.tsx      # Textarea för sammanfattning
```

### Modal-innehåll
1. **Header**: "Sammanfatta din reflektion" eller liknande
2. **Mood-väljare**: 5 klickbara mood-ikoner (återanvänd MoodEmoji)
3. **Sammanfattning**: 
   - Textarea med AI-genererad text
   - "Generera om"-knapp bredvid/under
4. **Actions**:
   - "Avbryt" (sekundär)
   - "Spara" (primär)

### API-flöde
1. Användaren klickar "Färdig"
2. Modal öppnas, AI-generering startar automatiskt
3. Sammanfattning visas i textarea
4. Användaren väljer mood och eventuellt redigerar text
5. Klickar "Spara" → sparar entry → stänger modal → redirect/bekräftelse

## Design

### Färger (anpassat till tema)
- Bakgrund: `slate-800` med `slate-900` overlay
- Border: `slate-700`
- Text: `stone-100`
- Accent: `indigo-500` / `violet-500`

### Storlek
- Max-width: `max-w-lg` eller `max-w-xl`
- Padding: `p-6`
- Rounded: `rounded-xl`

## Acceptanskriterier
- [ ] Modal öppnas vid klick på "Färdig"
- [ ] Mood-väljare fungerar med 1-5 skala
- [ ] AI-sammanfattning genereras och visas
- [ ] Textarea är redigerbar
- [ ] "Generera om" fungerar
- [ ] "Spara" sparar entry med mood och sammanfattning
- [ ] "Avbryt" stänger modal utan att spara
- [ ] Loading-states visas korrekt
- [ ] Styling matchar appens tema
