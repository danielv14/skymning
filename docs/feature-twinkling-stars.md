# Feature: Blinkande stjärnor

## Sammanfattning
Stjärnhimmelgrafiken ska ha subtila, slumpmässiga blinkningar på individuella stjärnor istället för att alla stjärnor blinkar synkroniserat.

## Nuvarande implementation
I `src/styles.css` finns stjärnorna definierade med CSS `radial-gradient` och en enkel `twinkle`-animation som får alla stjärnor att blinka i takt:

```css
@keyframes twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

Problemet är att `.stars::before` och `.stars::after` animeras som hela element, inte individuella stjärnor.

## Krav

### Designkrav
- Individuella stjärnor ska blinka oberoende av varandra
- Blinkningarna ska vara subtila (inte distraherande)
- "Slumpmässig" känsla - inte uppenbart mönster
- Ren CSS-lösning (inget JavaScript)

### Tekniska krav
- Uppdatera `src/styles.css`
- Behålla befintlig visuell stil
- Bra prestanda (inga tunga animationer)
- Fungera i moderna webbläsare

## Implementation

### Lösningsförslag: Multipla lager med olika timing

Istället för ett lager med synkroniserad animation, skapa flera lager med olika:
- Animation-duration
- Animation-delay
- Opacity-värden

```css
.stars::before {
  /* Lager 1: Snabb blinkning */
  animation: twinkle-fast 3s ease-in-out infinite;
}

.stars::after {
  /* Lager 2: Långsam blinkning, förskjuten */
  animation: twinkle-slow 7s ease-in-out infinite;
  animation-delay: -2s;
}

/* Lägg till fler pseudo-element via wrapper eller extra element */
.stars-layer-3 {
  animation: twinkle-medium 5s ease-in-out infinite;
  animation-delay: -4s;
}

@keyframes twinkle-fast {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 0.4; }
}

@keyframes twinkle-slow {
  0%, 100% { opacity: 1; }
  30% { opacity: 0.5; }
  70% { opacity: 0.8; }
}

@keyframes twinkle-medium {
  0%, 100% { opacity: 0.8; }
  25% { opacity: 0.3; }
  75% { opacity: 0.6; }
}
```

### Alternativ lösning: CSS custom properties med calc()

Använd `animation-delay` med negativa värden baserat på stjärnans position för att skapa "pseudo-randomness":

```css
.stars::before {
  animation: twinkle 4s ease-in-out infinite;
}

.stars::after {
  animation: twinkle 4s ease-in-out infinite;
  animation-delay: -1.7s; /* Primtal för mindre uppenbart mönster */
}
```

### Rekommendation
Multipla lager med olika timing ger bäst effekt utan JavaScript. Kan behöva lägga till ett extra HTML-element eller använda CSS-variabler för att skapa fler lager.

## Acceptanskriterier
- [ ] Stjärnor blinkar individuellt/i grupper med olika timing
- [ ] Effekten känns "slumpmässig" och subtil
- [ ] Ren CSS-implementation (inget JS)
- [ ] Prestanda är god (inga lagg eller hög CPU-användning)
- [ ] Fungerar i Chrome, Safari, Firefox
- [ ] Befintlig visuell stil bevarad
