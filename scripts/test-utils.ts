/**
 * Test utilities for Skymning
 *
 * Usage:
 *   bun scripts/test-utils.ts reset          - Clear all tables
 *   bun scripts/test-utils.ts seed           - Seed 4 weeks of reflections
 *   bun scripts/test-utils.ts reseed         - Reset + seed combined
 *   bun scripts/test-utils.ts clear-today    - Clear today's entry
 *   bun scripts/test-utils.ts sync-prod      - Sync production D1 to local
 *   bun scripts/test-utils.ts seed-past-chat - Seed incomplete chat from yesterday
 *
 * NOTE: These commands run against local D1 database via wrangler.
 * For remote (production), add --remote flag in package.json scripts.
 */

import { format, getISOWeek, getISOWeekYear, subDays } from 'date-fns'
import { $, file } from 'bun'
import { existsSync, unlinkSync } from 'node:fs'

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

const PAST_CHAT_MESSAGES = [
  { role: 'user', content: 'Idag har varit en lång dag på jobbet. Mycket möten och lite tid för fokusarbete.' },
  { role: 'assistant', content: 'Det låter som en intensiv dag! Hur känner du dig efter alla möten? Fick du ändå känslan av att ha åstadkommit något?' },
  { role: 'user', content: 'Jo, faktiskt. Ett av mötena ledde till ett viktigt beslut som vi har skjutit upp länge.' },
  { role: 'assistant', content: 'Vad bra att ni fick till det beslutet! Det måste kännas skönt. Är det något annat som ligger i tankarna inför kvällen?' },
]

const seedPastChat = async () => {
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
  console.log(`Seeding incomplete chat from yesterday (${yesterday})...`)

  await execSql('DELETE FROM chat_messages')

  for (let i = 0; i < PAST_CHAT_MESSAGES.length; i++) {
    const msg = PAST_CHAT_MESSAGES[i]
    const createdAt = new Date().toISOString()
    const escapedContent = msg.content.replace(/'/g, "''")
    await execSql(
      `INSERT INTO chat_messages (date, role, content, order_index, created_at) VALUES ('${yesterday}', '${msg.role}', '${escapedContent}', ${i}, '${createdAt}')`
    )
  }

  console.log(`   ${PAST_CHAT_MESSAGES.length} chat messages created for ${yesterday}`)
  console.log('Past chat seeded! Visit /reflect to see the recovery modal.')
}

const syncProd = async () => {
  const tempFile = '.prod-backup.sql'
  const filteredFile = '.prod-backup-filtered.sql'

  console.log('Exporting production database...')
  try {
    await $`bunx wrangler d1 export skymning-db --remote --output=${tempFile}`.quiet()
  } catch (error) {
    console.error('Failed to export production database.')
    console.error('Make sure you are authenticated with Cloudflare (run: wrangler login)')
    process.exit(1)
  }

  if (!existsSync(tempFile)) {
    console.error('Export file not created')
    process.exit(1)
  }

  const sqlContent = await file(tempFile).text()
  const rowCounts = {
    entries: (sqlContent.match(/INSERT INTO "entries"/g) || []).length,
    weeklySummaries: (sqlContent.match(/INSERT INTO "weekly_summaries"/g) || []).length,
    userContext: (sqlContent.match(/INSERT INTO "user_context"/g) || []).length,
    chatMessages: (sqlContent.match(/INSERT INTO "chat_messages"/g) || []).length,
  }

  // Use grep to filter - keep only INSERT statements for app tables
  // grep returns exit code 1 if no matches, so we use || true to handle empty results
  await $`grep -E "INSERT INTO \"(entries|weekly_summaries|user_context|chat_messages)\"" ${tempFile} > ${filteredFile} || true`

  console.log('Clearing local database...')
  await reset()

  console.log('Importing to local database...')
  await $`bunx wrangler d1 execute skymning-db --local --file=${filteredFile}`.quiet()

  unlinkSync(tempFile)
  unlinkSync(filteredFile)

  console.log('Sync complete!')
  console.log(`   ${rowCounts.entries} entries`)
  console.log(`   ${rowCounts.weeklySummaries} weekly summaries`)
  console.log(`   ${rowCounts.userContext} user context rows`)
  console.log(`   ${rowCounts.chatMessages} chat messages`)
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
  case 'sync-prod':
    await syncProd()
    break
  case 'seed-past-chat':
    await seedPastChat()
    break
  default:
    console.log(`
Skymning Test Utilities

Usage:
  bun scripts/test-utils.ts reset          - Clear all tables
  bun scripts/test-utils.ts seed           - Seed 4 weeks of reflections
  bun scripts/test-utils.ts reseed         - Reset + seed combined
  bun scripts/test-utils.ts clear-today    - Clear today's entry (to test summaries)
  bun scripts/test-utils.ts sync-prod      - Sync production D1 to local
  bun scripts/test-utils.ts seed-past-chat - Seed incomplete chat from yesterday
`)
}
