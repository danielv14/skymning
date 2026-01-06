// Delade mood-konstanter för hela applikationen

export const MOOD_LABELS: Record<number, string> = {
  1: 'Kass',
  2: 'Dålig',
  3: 'Okej',
  4: 'Bra',
  5: 'Jättebra',
}

export const getMoodLabel = (mood: number): string => {
  return MOOD_LABELS[mood] || 'Okänd'
}

export const getWeekMoodDescription = (averageMood: number | null): string => {
  if (averageMood === null) return ''
  
  // Avrunda till en decimal för visning
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
