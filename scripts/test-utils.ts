/**
 * Test utilities för Skymning
 * 
 * Användning:
 *   bun scripts/test-utils.ts reset       - Rensar alla tabeller
 *   bun scripts/test-utils.ts seed        - Seedar 4 veckor med reflektioner
 *   bun scripts/test-utils.ts reseed      - Reset + seed i ett kommando
 *   bun scripts/test-utils.ts clear-today - Rensar dagens entry
 * 
 * OBS: Dessa kommandon körs mot lokal D1-databas via wrangler.
 * För remote (produktion), lägg till --remote flaggan i package.json scripts.
 */

import { format, getISOWeek, getISOWeekYear, subDays } from 'date-fns'
import { $ } from 'bun'

// Exempel-summeringar för olika mood-nivåer
const SUMMARIES_BY_MOOD: Record<number, string[]> = {
  1: [
    'En riktigt tung dag. Allt kändes motigt och jag hade svårt att hitta energi till något alls.',
    'Idag var jobbig. Känslorna tog över och jag behövde bara vara för mig själv.',
    'Orkade inte mycket idag. Kroppen och huvudet ville bara vila.',
  ],
  2: [
    'Lite seg dag. Jobbet drog ut på tiden och jag kände mig trött hela eftermiddagen.',
    'Inte den bästa dagen. Småirriterad på diverse saker men försökte hålla humöret uppe.',
    'Kändes lite grått idag. Inget speciellt hände men motivationen var låg.',
  ],
  3: [
    'En helt okej dag. Varken upp eller ner, bara lugnt och stabilt.',
    'Ganska vanlig dag. Jobbade, åt lunch, kom hem. Inget speciellt att rapportera.',
    'Neutral dag. Fick gjort det jag skulle men inget som stack ut.',
  ],
  4: [
    'Bra dag! Hade ett produktivt möte och hann med en promenad i solen.',
    'Trevlig dag. Pratade med en gammal vän på telefon och det lyfte humöret.',
    'Fin dag idag. Lagade god mat och myste framför en film på kvällen.',
  ],
  5: [
    'Fantastisk dag! Allt bara klaffade och jag kände mig full av energi.',
    'Underbar dag. Fick äntligen klart projektet jag jobbat med länge. Firade med glass!',
    'Strålande dag! Spenderade tid med familjen och skrattade så tårarna rann.',
  ],
}

const WEEKLY_SUMMARIES = [
  'Veckan har varit varierad med både upp- och nergångar. Började tungt men slutade på en positiv not med flera fina stunder.',
  'En produktiv vecka överlag. Mycket jobb men också tid för återhämtning. Humöret har varit stabilt.',
  'Blandade känslor denna vecka. Några utmaningar på jobbet men också mysiga kvällar hemma.',
  'Veckan präglades av lugn och vardagsrutiner. Inget dramatiskt men en trygg känsla överlag.',
]

// Slumpa ett värde från en array
const randomFrom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

// Generera en mood med viss variation men tendens mot mitten
const generateMood = (): number => {
  const weights = [0.1, 0.2, 0.35, 0.25, 0.1] // Viktat mot 3 (okej)
  const random = Math.random()
  let cumulative = 0
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i]
    if (random < cumulative) return i + 1
  }
  return 3
}

// Kör SQL mot lokal D1 via wrangler
const execSql = async (sql: string) => {
  await $`bunx wrangler d1 execute skymning-db --local --command=${sql}`.quiet()
}

// Reset - rensar alla tabeller
const reset = async () => {
  console.log('Rensar tabeller...')
  await execSql('DELETE FROM entries')
  await execSql('DELETE FROM weekly_summaries')
  await execSql('DELETE FROM user_context')
  console.log('Tabeller rensade!')
}

// Clear today - rensar dagens entry
const clearToday = async () => {
  const today = format(new Date(), 'yyyy-MM-dd')
  console.log(`Rensar dagens entry (${today})...`)
  await execSql(`DELETE FROM entries WHERE date = '${today}'`)
  console.log('Dagens entry rensad!')
}

// Seed - skapar 4 veckor med data
const seed = async () => {
  console.log('Seedar databas med 4 veckor av reflektioner...')
  
  const today = new Date()
  const entriesData: { date: string; mood: number; summary: string }[] = []
  const weeksToSeed = new Set<string>()
  
  // Gå 28 dagar bakåt (4 veckor)
  for (let daysBack = 27; daysBack >= 0; daysBack--) {
    const date = subDays(today, daysBack)
    
    // Skippa några dagar slumpmässigt (ca 15% chans) för realism
    if (Math.random() < 0.15 && daysBack > 0) {
      continue
    }
    
    const mood = generateMood()
    const summary = randomFrom(SUMMARIES_BY_MOOD[mood])
    
    entriesData.push({
      date: format(date, 'yyyy-MM-dd'),
      mood,
      summary,
    })
    
    // Spara vecka för veckosummering (ISO vecka)
    const weekKey = `${getISOWeekYear(date)}-${getISOWeek(date)}`
    weeksToSeed.add(weekKey)
  }
  
  // Infoga entries
  for (const entry of entriesData) {
    const escapedSummary = entry.summary.replace(/'/g, "''")
    const createdAt = new Date().toISOString()
    await execSql(
      `INSERT INTO entries (date, mood, summary, created_at) VALUES ('${entry.date}', ${entry.mood}, '${escapedSummary}', '${createdAt}')`
    )
  }
  console.log(`   ${entriesData.length} reflektioner skapade`)
  
  // Skapa veckosummeringar (förutom nuvarande vecka)
  const currentWeekKey = `${getISOWeekYear(today)}-${getISOWeek(today)}`
  let weekCount = 0
  
  for (const weekKey of weeksToSeed) {
    if (weekKey === currentWeekKey) continue // Skippa nuvarande vecka
    
    const [yearStr, weekStr] = weekKey.split('-')
    const summaryText = randomFrom(WEEKLY_SUMMARIES).replace(/'/g, "''")
    const createdAt = new Date().toISOString()
    await execSql(
      `INSERT INTO weekly_summaries (year, week, summary, created_at) VALUES (${yearStr}, ${weekStr}, '${summaryText}', '${createdAt}')`
    )
    weekCount++
  }
  console.log(`   ${weekCount} veckosummeringar skapade`)
  
  console.log('Seeding klar!')
}

// Main
const command = process.argv[2]

switch (command) {
  case 'reset':
    await reset()
    break
  case 'seed':
    await seed()
    break
  case 'reseed':
    await reset()
    await seed()
    break
  case 'clear-today':
    await clearToday()
    break
  default:
    console.log(`
Skymning Test Utilities

Användning:
  bun scripts/test-utils.ts reset       - Rensar alla tabeller
  bun scripts/test-utils.ts seed        - Seedar 4 veckor med reflektioner
  bun scripts/test-utils.ts reseed      - Reset + seed i ett kommando
  bun scripts/test-utils.ts clear-today - Rensar dagens entry (för att testa summering)
`)
}
