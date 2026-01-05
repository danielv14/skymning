# Feature: Förbättrade AI-promptar

## Sammanfattning
Chattens AI-svar är för enformiga och ställer ofta samma typ av frågor ("hur kändes det?"). Promptarna behöver förbättras för att ge mer varierade och naturliga svar.

## Problem med nuvarande implementation
- AI:n ställer nästan alltid frågan "hur kändes det?"
- Svaren blir repetitiva och enformiga
- AI:n frågar alltid tillbaka istället för att ibland bara bekräfta
- Användaren får inte styra samtalet naturligt

## Krav

### Funktionella krav
- Mer variation i AI:ns svar
- AI:n ska ibland bara bekräfta känslan utan att ställa motfråga
- Användaren ska kunna styra om de vill prata mer om något eller byta ämne
- Naturligare konversationsflöde

### Research
Innan implementation ska research göras på:
- Best practices för reflektions/journaling-prompts
- Hur man skapar variation i AI-svar
- Tekniker för empatisk och icke-påträngande konversation
- Exempel från liknande appar (Reflectly, Jour, etc.)

## Implementation

### Prompt-förbättringar
Uppdatera `src/server/ai/prompts.ts` med:

1. **Variation i svarstyper**
   - Ibland ställa öppen fråga
   - Ibland bekräfta och validera
   - Ibland erbjuda perspektiv
   - Ibland vara tyst och låta användaren leda

2. **Konversationsmedvetenhet**
   - Håll koll på hur många frågor som ställts i rad
   - Undvik att upprepa samma typ av fråga
   - Anpassa ton baserat på användarens mood

3. **Exempel på svarstyper**
   ```
   Bekräftande: "Det låter verkligen tungt. Tack för att du delar."
   Öppen fråga: "Vad tänker du kring det?"
   Specifik fråga: "Hur påverkade det resten av din dag?"
   Erbjuda val: "Vill du berätta mer om det, eller finns det något annat på hjärtat?"
   ```

### Prompt-struktur
```
Du är en varm och empatisk samtalspartner för reflektion.

Riktlinjer:
- Variera dina svar: ibland fråga, ibland bara bekräfta
- Undvik att alltid ställa "hur kändes det?"
- Låt användaren styra riktningen
- Om användaren verkar färdig med ett ämne, bekräfta och låt dem ta nästa steg
- Var kortfattad men varm
- Ställ max en fråga per svar
```

## Acceptanskriterier
- [ ] Research på best practices dokumenterad
- [ ] Promptar uppdaterade med förbättringar
- [ ] AI:n varierar sina svar märkbart
- [ ] AI:n ställer inte alltid motfrågor
- [ ] Konversationen känns mer naturlig
- [ ] Användaren kan styra samtalet
