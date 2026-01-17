export const MOOD_LABELS: Record<number, string> = {
  1: 'Kass',
  2: 'Dålig',
  3: 'Okej',
  4: 'Bra',
  5: 'Jättebra',
}

// Synkad med CSS-variabler i styles.css (--color-mood-X)
export const MOOD_COLORS: Record<number, string> = {
  1: '#64748b',  // Slate - dämpad, tung
  2: '#8b5cf6',  // Violet - kall, eftertänksam
  3: '#06b6d4',  // Cyan - neutral, balans
  4: '#22c55e',  // Green - positiv
  5: '#f472b6',  // Pink - glad, energisk
}

export const getMoodLabel = (mood: number): string => {
  return MOOD_LABELS[mood] || 'Okänd'
}

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
