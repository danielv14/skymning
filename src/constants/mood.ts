export type MoodConfig = {
  value: number
  name: string
  label: string
  color: string
}

// Keep in sync with CSS variables in styles.css (--color-mood-{name})
export const MOODS: MoodConfig[] = [
  { value: 1, name: 'awful', label: 'Kass', color: '#64748b' },
  { value: 2, name: 'bad', label: 'Dålig', color: '#8b5cf6' },
  { value: 3, name: 'okay', label: 'Okej', color: '#06b6d4' },
  { value: 4, name: 'good', label: 'Bra', color: '#22c55e' },
  { value: 5, name: 'great', label: 'Jättebra', color: '#f472b6' },
]

export const getMoodByValue = (value: number): MoodConfig | undefined =>
  MOODS.find(m => m.value === value)

export const getMoodColor = (mood: number): string =>
  getMoodByValue(mood)?.color || '#64748b'

export const getMoodLabel = (mood: number): string =>
  getMoodByValue(mood)?.label || 'Okänd'

export const getMoodCssVar = (mood: number): string => {
  const name = getMoodByValue(mood)?.name || 'okay'
  return `--color-mood-${name}`
}

// Recharts requires hex values, can't use CSS variables
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
