/**
 * Test utilities for Skymning
 *
 * Usage:
 *   bun scripts/test-utils.ts reset          - Clear all tables
 *   bun scripts/test-utils.ts seed           - Seed 3 months of reflections
 *   bun scripts/test-utils.ts reseed         - Reset + seed combined
 *   bun scripts/test-utils.ts clear-today    - Clear today's entry
 *   bun scripts/test-utils.ts sync-prod      - Sync production D1 to local
 *   bun scripts/test-utils.ts seed-past-chat - Seed incomplete chat from yesterday
 *
 * NOTE: These commands run against local D1 database via wrangler.
 * For remote (production), add --remote flag in package.json scripts.
 */

import { format, getDay, getISOWeek, getISOWeekYear, getMonth, getYear, subDays } from 'date-fns'
import { $, file } from 'bun'
import { existsSync, unlinkSync } from 'node:fs'

// -- Mood summaries by level (Swedish) --

const SUMMARIES_BY_MOOD: Record<number, string[]> = {
  1: [
    'En riktigt tung dag. Allt kändes motigt och jag hade svårt att hitta energi till något alls.',
    'Idag var jobbig. Känslorna tog över och jag behövde bara vara för mig själv.',
    'Orkade inte mycket idag. Kroppen och huvudet ville bara vila.',
    'Dålig sömn i natt och det märktes hela dagen. Kunde knappt koncentrera mig.',
    'Ångest slog till på morgonen och släppte aldrig riktigt. En av de tuffare dagarna.',
    'Allt gick snett idag. Missade bussen, spillde kaffe, och sen en jobbig diskussion hemma.',
    'Kände mig ensam och nedstämd hela dagen. Orkade inte ens laga mat.',
  ],
  2: [
    'Lite seg dag. Jobbet drog ut på tiden och jag kände mig trött hela eftermiddagen.',
    'Inte den bästa dagen. Småirriterad på diverse saker men försökte hålla humöret uppe.',
    'Kändes lite grått idag. Inget speciellt hände men motivationen var låg.',
    'Stressig dag på jobbet. Hann inte med allt jag hade planerat och det gnager.',
    'Huvudvärk sedan morgonen. Tog det lugnt men kände mig ändå inte bra.',
    'Rastlös och lite nere. Svårt att sätta fingret på varför egentligen.',
    'En av de där dagarna när ingenting känns roligt. Mest bara överlevt.',
    'Trött efter en dålig natts sömn. Dagen gick i slow motion.',
  ],
  3: [
    'En helt okej dag. Varken upp eller ner, bara lugnt och stabilt.',
    'Ganska vanlig dag. Jobbade, åt lunch, kom hem. Inget speciellt att rapportera.',
    'Neutral dag. Fick gjort det jag skulle men inget som stack ut.',
    'Lagom dag. Lite jobb, lite vardagssysslor, lite vila. Balanserat.',
    'Helt okej dag faktiskt. Lunchen var god och eftermiddagen gick fort.',
    'Vanlig vardag. Inget att klaga på men heller inget att fira.',
    'En stabil dag. Rutinerna rullar på och det känns tryggt.',
    'Inte mycket att säga om idag. Lugn och odramatisk, precis som det ska vara ibland.',
  ],
  4: [
    'Bra dag! Hade ett produktivt möte och hann med en promenad i solen.',
    'Trevlig dag. Pratade med en gammal vän på telefon och det lyfte humöret.',
    'Fin dag idag. Lagade god mat och myste framför en film på kvällen.',
    'Riktigt produktiv dag! Fick massa gjort och kände mig nöjd efteråt.',
    'Skönt väder och en bra dag på jobbet. Tog en lång promenad efter middagen.',
    'Bra dag. Tränade på morgonen och det gav energi hela dagen.',
    'Mysig dag. Fikapaus med kollegorna och en skön kväll hemma.',
    'Kände mig glad och tacksam idag. Små saker som gjorde stor skillnad.',
    'Bra flyt på jobbet och en härlig middag. Sov som en stock sen.',
  ],
  5: [
    'Fantastisk dag! Allt bara klaffade och jag kände mig full av energi.',
    'Underbar dag. Fick äntligen klart projektet jag jobbat med länge. Firade med glass!',
    'Strålande dag! Spenderade tid med familjen och skrattade så tårarna rann.',
    'En av årets bästa dagar! Överraskning från en vän och sen en magisk solnedgång.',
    'Helt fantastiskt! Fick det bästa beskedet och har dansat runt hela kvällen.',
    'Perfekt dag från start till slut. Sånt som gör att man uppskattar livet extra.',
    'Magisk dag. Allt föll på plats och jag kände en djup lycka.',
  ],
}

// -- Week archetypes that define the "feel" of each week --

type WeekArchetype = 'terrible' | 'tough' | 'meh' | 'normal' | 'good' | 'great'

const WEEK_MOOD_WEIGHTS: Record<WeekArchetype, number[]> = {
  //                          mood: 1     2     3     4     5
  terrible: /* avg ~2.0 */       [0.25, 0.35, 0.25, 0.10, 0.05],
  tough:    /* avg ~2.5 */       [0.10, 0.35, 0.30, 0.20, 0.05],
  meh:      /* avg ~2.8 */       [0.05, 0.25, 0.40, 0.20, 0.10],
  normal:   /* avg ~3.2 */       [0.05, 0.15, 0.35, 0.30, 0.15],
  good:     /* avg ~3.7 */       [0.03, 0.07, 0.25, 0.40, 0.25],
  great:    /* avg ~4.2 */       [0.02, 0.05, 0.13, 0.35, 0.45],
}

// How likely to skip a day per archetype (tougher weeks = more skips)
const WEEK_SKIP_CHANCE: Record<WeekArchetype, number> = {
  terrible: 0.30,
  tough: 0.25,
  meh: 0.18,
  normal: 0.12,
  good: 0.08,
  great: 0.05,
}

// A hand-crafted narrative arc over ~13 weeks (3 months)
// Reads chronologically: week 0 is the oldest, week 12 is the most recent
const WEEK_NARRATIVE: WeekArchetype[] = [
  'normal',    // w0: Starting point - ordinary life
  'good',      // w1: Things pick up
  'good',      // w2: Continued good stretch
  'meh',       // w3: Slight dip - maybe work stress
  'tough',     // w4: A tough week hits
  'terrible',  // w5: Rock bottom - hardest week
  'meh',       // w6: Slow recovery
  'normal',    // w7: Getting back on track
  'good',      // w8: Feeling better
  'great',     // w9: Peak - a really great week
  'good',      // w10: Still riding high
  'normal',    // w11: Settling back
  'good',      // w12: Recent - ending on a positive note
]

// -- Weekly summaries matched to archetypes --

const WEEKLY_SUMMARIES_BY_ARCHETYPE: Record<WeekArchetype, string[]> = {
  terrible: [
    'En riktigt tuff vecka. Hade svårt att hitta energi och motivationen var i botten. Behöver verkligen vila nu.',
    'Den här veckan var bland de tyngre på länge. Både kropp och själ protesterade. Hoppas nästa vecka blir bättre.',
    'Veckan präglades av ångest och dålig sömn. Knappt orkat med vardagen. Ber om en nystart.',
  ],
  tough: [
    'Jobbig vecka. Stress på jobbet och lite för lite sömn. Några ljusglimtar men mest kamp.',
    'En tung vecka med mycket att hantera. Försökte hålla ihop men det var inte lätt.',
    'Utmanande dagar denna vecka. Kroppen var trött och humöret svajigt. Hoppas det vänder snart.',
  ],
  meh: [
    'Ganska grå vecka. Inget direkt dåligt hände men motivationen saknades. Rullade mest på autopilot.',
    'Lite seg vecka. Vardagen bara gick och gick utan att något speciellt hände.',
    'Mellanmjölksvecka. Inte jättedåligt men långt ifrån bra heller. Hoppas på mer energi framöver.',
  ],
  normal: [
    'Veckan har varit varierad med både upp- och nergångar. Började tungt men slutade på en positiv not med flera fina stunder.',
    'En produktiv vecka överlag. Mycket jobb men också tid för återhämtning. Humöret har varit stabilt.',
    'Blandade känslor denna vecka. Några utmaningar på jobbet men också mysiga kvällar hemma.',
    'Veckan präglades av lugn och vardagsrutiner. Inget dramatiskt men en trygg känsla överlag.',
  ],
  good: [
    'Riktigt fin vecka! Flera bra dagar i rad och kände mig produktiv och nöjd.',
    'Bra vecka med positiv energi. Härliga samtal med vänner och bra flyt på jobbet.',
    'En av de bättre veckorna på sistone. Solen sken, humöret var högt och allt kändes rätt.',
    'Trevlig vecka. Lagom tempo, god mat och kvalitetstid med nära och kära.',
  ],
  great: [
    'Helt fantastisk vecka! Allt bara klaffade och jag kände mig levande och glad hela tiden.',
    'Magisk vecka. Fick det bästa beskedet, firade med vänner och kände en djup tacksamhet.',
    'Strålande vecka från start till slut! Full av energi, glädje och fina upplevelser.',
  ],
}

// -- Monthly summaries matched to average archetype --

const MONTHLY_SUMMARIES_BY_TONE: Record<'low' | 'medium' | 'high', string[]> = {
  low: [
    'En tuff månad överlag. Flera tunga veckor med låg energi och motivation. Men det finns ljusglimtar att bygga vidare på.',
    'Månaden har varit utmanande. Humöret har svajat mycket och det har varit svårt att hitta balans. Hoppas nästa månad blir lättare.',
    'Inte den lättaste månaden. Mycket stress och trötthet har präglat vardagen, men jag har ändå klarat mig igenom.',
  ],
  medium: [
    'En blandad månad med både toppar och dalar. Några tuffa perioder men också fina stunder som vägde upp.',
    'Ganska normal månad. Vardagen har rullat på med sina rutiner och humöret har pendlat runt mitten.',
    'Månaden har varit stabil, om än lite grå ibland. Bra perioder blandades med mer energilösa dagar.',
  ],
  high: [
    'En riktigt bra månad! Mycket positiv energi, bra relationer och känslan av att vara på rätt spår.',
    'Fantastisk månad! Humöret har legat högt och jag har känt mig produktiv, glad och tacksam.',
    'En av de bättre månaderna på länge. Mycket glädje, fina upplevelser och en känsla av framsteg.',
  ],
}

// -- Helpers --

const randomFrom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

const weightedMood = (weights: number[]): number => {
  const random = Math.random()
  let cumulative = 0
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i]
    if (random < cumulative) return i + 1
  }
  return 3
}

// Weekends get a slight mood boost (+1 level, capped at 5)
const applyWeekendBonus = (mood: number, dayOfWeek: number): number => {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  if (isWeekend && Math.random() < 0.4) {
    return Math.min(mood + 1, 5)
  }
  return mood
}

const getWeekIndex = (daysBack: number): number => {
  return Math.floor(daysBack / 7)
}

const execSql = async (sql: string) => {
  await $`bunx wrangler d1 execute skymning-db --local --command=${sql}`.quiet()
}

// -- Commands --

const reset = async () => {
  console.log('Clearing tables...')
  await execSql('DELETE FROM entries')
  await execSql('DELETE FROM weekly_summaries')
  await execSql('DELETE FROM monthly_summaries')
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
  const totalDays = 90
  console.log(`Seeding database with ~${totalDays} days (3 months) of reflections...`)

  const today = new Date()
  const entriesData: { date: string; mood: number; summary: string }[] = []
  const weeksToSeed = new Map<string, WeekArchetype>()
  const monthsToSeed = new Map<string, number[]>()

  for (let daysBack = totalDays - 1; daysBack >= 0; daysBack--) {
    const date = subDays(today, daysBack)
    const weekIndex = getWeekIndex(daysBack)

    // Map daysBack to narrative arc (oldest = highest weekIndex)
    const narrativeIndex = WEEK_NARRATIVE.length - 1 - Math.min(weekIndex, WEEK_NARRATIVE.length - 1)
    const archetype = WEEK_NARRATIVE[narrativeIndex]
    const skipChance = WEEK_SKIP_CHANCE[archetype]

    // Skip some days (never skip today)
    if (Math.random() < skipChance && daysBack > 0) {
      continue
    }

    const baseMood = weightedMood(WEEK_MOOD_WEIGHTS[archetype])
    const dayOfWeek = getDay(date)
    const mood = applyWeekendBonus(baseMood, dayOfWeek)
    const summary = randomFrom(SUMMARIES_BY_MOOD[mood])

    entriesData.push({
      date: format(date, 'yyyy-MM-dd'),
      mood,
      summary,
    })

    // Track weeks and their archetypes
    const weekKey = `${getISOWeekYear(date)}-${getISOWeek(date)}`
    weeksToSeed.set(weekKey, archetype)

    // Track months and their moods
    const monthKey = `${getYear(date)}-${getMonth(date) + 1}`
    if (!monthsToSeed.has(monthKey)) {
      monthsToSeed.set(monthKey, [])
    }
    monthsToSeed.get(monthKey)!.push(mood)
  }

  // Insert entries
  for (const entry of entriesData) {
    const escapedSummary = entry.summary.replace(/'/g, "''")
    const createdAt = new Date().toISOString()
    await execSql(
      `INSERT INTO entries (date, mood, summary, created_at) VALUES ('${entry.date}', ${entry.mood}, '${escapedSummary}', '${createdAt}')`
    )
  }
  console.log(`   ${entriesData.length} reflections created`)

  // Insert weekly summaries (skip current week)
  const currentWeekKey = `${getISOWeekYear(today)}-${getISOWeek(today)}`
  let weekCount = 0

  for (const [weekKey, archetype] of weeksToSeed) {
    if (weekKey === currentWeekKey) continue

    const [yearStr, weekStr] = weekKey.split('-')
    const summaryText = randomFrom(WEEKLY_SUMMARIES_BY_ARCHETYPE[archetype]).replace(/'/g, "''")
    const createdAt = new Date().toISOString()
    await execSql(
      `INSERT INTO weekly_summaries (year, week, summary, created_at) VALUES (${yearStr}, ${weekStr}, '${summaryText}', '${createdAt}')`
    )
    weekCount++
  }
  console.log(`   ${weekCount} weekly summaries created`)

  // Insert monthly summaries (skip current month)
  const currentMonthKey = `${getYear(today)}-${getMonth(today) + 1}`
  let monthCount = 0

  for (const [monthKey, moods] of monthsToSeed) {
    if (monthKey === currentMonthKey) continue

    const [yearStr, monthStr] = monthKey.split('-')
    const averageMood = moods.reduce((sum, m) => sum + m, 0) / moods.length
    const tone = averageMood >= 3.5 ? 'high' : averageMood >= 2.5 ? 'medium' : 'low'
    const summaryText = randomFrom(MONTHLY_SUMMARIES_BY_TONE[tone]).replace(/'/g, "''")
    const createdAt = new Date().toISOString()
    await execSql(
      `INSERT INTO monthly_summaries (year, month, summary, created_at) VALUES (${yearStr}, ${monthStr}, '${summaryText}', '${createdAt}')`
    )
    monthCount++
  }
  console.log(`   ${monthCount} monthly summaries created`)

  // Log the narrative arc for visibility
  console.log('\n   Narrative arc (oldest → newest):')
  const archetypeEmoji: Record<WeekArchetype, string> = {
    terrible: '💀', tough: '😔', meh: '😐', normal: '🙂', good: '😊', great: '🌟',
  }
  const arcLine = WEEK_NARRATIVE.map((a) => `${archetypeEmoji[a]} ${a}`).join(' → ')
  console.log(`   ${arcLine}`)

  console.log('\nSeeding complete!')
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
  bun scripts/test-utils.ts seed           - Seed 3 months of reflections
  bun scripts/test-utils.ts reseed         - Reset + seed combined
  bun scripts/test-utils.ts clear-today    - Clear today's entry (to test summaries)
  bun scripts/test-utils.ts sync-prod      - Sync production D1 to local
  bun scripts/test-utils.ts seed-past-chat - Seed incomplete chat from yesterday
`)
}
