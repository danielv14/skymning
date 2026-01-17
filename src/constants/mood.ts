export type MoodConfig = {
  value: number
  name: string
  label: string
  cssVar: string
  color: string
}

// Huvudkonfiguration för alla humör - synkad med CSS-variabler i styles.css
export const MOODS: MoodConfig[] = [
  { value: 1, name: 'awful', label: 'Kass', cssVar: '--color-mood-awful', color: '#64748b' },
  { value: 2, name: 'bad', label: 'Dålig', cssVar: '--color-mood-bad', color: '#8b5cf6' },
  { value: 3, name: 'okay', label: 'Okej', cssVar: '--color-mood-okay', color: '#06b6d4' },
  { value: 4, name: 'good', label: 'Bra', cssVar: '--color-mood-good', color: '#22c55e' },
  { value: 5, name: 'great', label: 'Jättebra', cssVar: '--color-mood-great', color: '#f472b6' },
]

// Hjälpfunktioner för att hämta mood-data
export const getMoodByValue = (value: number): MoodConfig | undefined =>
  MOODS.find(m => m.value === value)

export const getMoodLabel = (mood: number): string =>
  getMoodByValue(mood)?.label || 'Okänd'

export const getMoodCssVar = (mood: number): string =>
  getMoodByValue(mood)?.cssVar || '--color-mood-okay'

// Legacy exports för bakåtkompatibilitet (används av recharts)
export const MOOD_LABELS: Record<number, string> = Object.fromEntries(
  MOODS.map(m => [m.value, m.label])
)

export const MOOD_COLORS: Record<number, string> = Object.fromEntries(
  MOODS.map(m => [m.value, m.color])
)

export const getWeekMoodDescription = (averageMood: number | null): string => {
  if (averageMood === null) return ''
  
  const rounded = Math.round(averageMood * 10) / 10
  
  if (rounded >= 4.5) return 'En riktigt bra vecka'
  if (rounded >= 4.0) return 'Överlag en bra vecka'
  if (rounded >= 3.5) return 'En ganska bra vecka'
  if (rounded >= 3.0) return 'En helt okej vecka'
  if (rounded >= 2.5) return 'En lite tyngre vecka'
  if (rounded >= 2.0) return 'En tuff vecka'
  return 'En riktigt jobbig vecka'
}

export const getPeriodMoodDescription = (averageMood: number | null): string => {
  if (averageMood === null) return ''

  const rounded = Math.round(averageMood * 10) / 10

  if (rounded >= 4.5) return 'Riktigt bra dagar'
  if (rounded >= 4.0) return 'Överlag bra dagar'
  if (rounded >= 3.5) return 'Ganska bra dagar'
  if (rounded >= 3.0) return 'Helt okej dagar'
  if (rounded >= 2.5) return 'Lite tyngre dagar'
  if (rounded >= 2.0) return 'Några tunga dagar'
  return 'En tuff period'
}
