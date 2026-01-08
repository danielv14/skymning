/**
 * Test utilities for Skymning
 * 
 * Usage:
 *   bun scripts/test-utils.ts reset       - Clear all tables
 *   bun scripts/test-utils.ts seed        - Seed 4 weeks of reflections
 *   bun scripts/test-utils.ts reseed      - Reset + seed combined
 *   bun scripts/test-utils.ts clear-today - Clear today's entry
 * 
 * NOTE: These commands run against local D1 database via wrangler.
 * For remote (production), add --remote flag in package.json scripts.
 */

import { format, getISOWeek, getISOWeekYear, subDays } from 'date-fns'
import { $ } from 'bun'

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

const randomFrom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

const generateMood = (): number => {
  const weights = [0.1, 0.2, 0.35, 0.25, 0.1]
  const random = Math.random()
  let cumulative = 0
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i]
    if (random < cumulative) return i + 1
  }
  return 3
}

const execSql = async (sql: string) => {
  await $`bunx wrangler d1 execute skymning-db --local --command=${sql}`.quiet()
}

const reset = async () => {
  console.log('Clearing tables...')
  await execSql('DELETE FROM entries')
  await execSql('DELETE FROM weekly_summaries')
  await execSql('DELETE FROM user_context')
  console.log('Tables cleared!')
}

const clearToday = async () => {
  const today = format(new Date(), 'yyyy-MM-dd')
  console.log(`Clearing today's entry (${today})...`)
  await execSql(`DELETE FROM entries WHERE date = '${today}'`)
  console.log('Today\'s entry cleared!')
}

const seed = async () => {
  console.log('Seeding database with 4 weeks of reflections...')
  
  const today = new Date()
  const entriesData: { date: string; mood: number; summary: string }[] = []
  const weeksToSeed = new Set<string>()
  
  for (let daysBack = 27; daysBack >= 0; daysBack--) {
    const date = subDays(today, daysBack)
    
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
    
    const weekKey = `${getISOWeekYear(date)}-${getISOWeek(date)}`
    weeksToSeed.add(weekKey)
  }
  
  for (const entry of entriesData) {
    const escapedSummary = entry.summary.replace(/'/g, "''")
    const createdAt = new Date().toISOString()
    await execSql(
      `INSERT INTO entries (date, mood, summary, created_at) VALUES ('${entry.date}', ${entry.mood}, '${escapedSummary}', '${createdAt}')`
    )
  }
  console.log(`   ${entriesData.length} reflections created`)
  
  const currentWeekKey = `${getISOWeekYear(today)}-${getISOWeek(today)}`
  let weekCount = 0
  
  for (const weekKey of weeksToSeed) {
    if (weekKey === currentWeekKey) continue
    
    const [yearStr, weekStr] = weekKey.split('-')
    const summaryText = randomFrom(WEEKLY_SUMMARIES).replace(/'/g, "''")
    const createdAt = new Date().toISOString()
    await execSql(
      `INSERT INTO weekly_summaries (year, week, summary, created_at) VALUES (${yearStr}, ${weekStr}, '${summaryText}', '${createdAt}')`
    )
    weekCount++
  }
  console.log(`   ${weekCount} weekly summaries created`)
  
  console.log('Seeding complete!')
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

Usage:
  bun scripts/test-utils.ts reset       - Clear all tables
  bun scripts/test-utils.ts seed        - Seed 4 weeks of reflections
  bun scripts/test-utils.ts reseed      - Reset + seed combined
  bun scripts/test-utils.ts clear-today - Clear today's entry (to test summaries)
`)
}
