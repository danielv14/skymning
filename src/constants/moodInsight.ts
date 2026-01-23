export type MoodTrend = 'improving' | 'declining' | 'stable'
export type MoodStability = 'stable' | 'fluctuating'
export type MoodLevel = 'low' | 'medium' | 'high'

export type MoodInsight = {
  trend: MoodTrend
  stability: MoodStability
  average: number
  level: MoodLevel
  entryCount: number
}

type InsightKey =
  | 'improving_high'
  | 'improving_medium'
  | 'improving_low'
  | 'declining_high'
  | 'declining_medium'
  | 'declining_low'
  | 'stable_high'
  | 'stable_medium'
  | 'stable_low'

const INSIGHT_MESSAGES: Record<InsightKey, string[]> = {
  improving_high: [
    'Positiv trend! Du verkar ha hittat en bra rytm.',
    'Det går uppåt. Fint att se.',
    'Senaste tiden har varit bra för dig.',
    'Bra flyt just nu. Fortsätt så.',
    'Saker och ting verkar rulla på bra.',
    'Du är på rätt spår just nu.',
    'Fina dagar på sistone. Kör vidare!',
  ],
  improving_medium: [
    'Det verkar ljusna lite. Bra jobbat.',
    'Trenden pekar uppåt.',
    'Något bättre på sistone.',
    'Det går sakta åt rätt håll.',
    'Steg för steg blir det bättre.',
    'En försiktig uppgång. Det är positivt.',
  ],
  improving_low: [
    'Det ser ut att bli lite bättre. Ta det lugnt.',
    'Små steg i rätt riktning.',
    'Lite ljusare, även om det fortfarande är tufft.',
    'En gnutta bättre. Det märks.',
    'Försiktigt uppåt. Bra kämpat.',
    'Det vänder sakta. Häng i.',
  ],
  declining_high: [
    'Lite tyngre nyligen, men du har haft det bra överlag.',
    'Några tuffare dagar, men grunden är stabil.',
    'En liten dipp, men inget att oroa sig för.',
    'Något trögare just nu, men du har marginal.',
    'En tillfällig svacka. Du har det bra i grunden.',
    'Lite sämre dagar, men överlag stabilt.',
  ],
  declining_medium: [
    'Lite tyngre period just nu. Det är okej.',
    'Inte de lättaste dagarna. Ta hand om dig.',
    'Något tyngre senaste tiden.',
    'En liten nedgång. Var snäll mot dig själv.',
    'Det har varit lite jobbigare. Det går över.',
    'Några tunga dagar. Ta det lugnt.',
  ],
  declining_low: [
    'Tuff period. Bra att du fortsätter reflektera.',
    'Jobbigt just nu. Du gör rätt som skriver ner.',
    'Svåra dagar. Att reflektera hjälper.',
    'Tungt läge. Men du kämpar på.',
    'Hårt just nu. Bra att du stannar upp och skriver.',
    'En jobbig tid. Du gör vad du kan.',
  ],
  stable_high: [
    'Stabilt bra läge. Fortsätt med det du gör.',
    'Jämna och bra dagar.',
    'Du verkar ha hittat en bra balans.',
    'Skönt stabilt. Du mår bra.',
    'Fint jämnt läge. Fortsätt så.',
    'Allt rullar på bra för dig.',
  ],
  stable_medium: [
    'Stabilt läge. Helt okej dagar.',
    'Lugnt och jämnt just nu.',
    'Varken upp eller ner. Det är också okej.',
    'Jämnt läge. Ibland är det precis vad man behöver.',
    'Stabilt i mitten. Det funkar.',
    'Inga stora svängningar. Lugnt och skönt.',
  ],
  stable_low: [
    'Tufft just nu, men du håller i. Det räknas.',
    'Svåra dagar. Reflektionen hjälper.',
    'Tungt, men bra att du fortsätter skriva.',
    'Hårt läge, men du ger inte upp.',
    'Jobbigt, men du håller fast vid rutinen.',
    'Tuffa dagar. Att skriva ner hjälper dig.',
  ],
}

const FLUCTUATING_ADDITIONS: string[] = [
  'Humöret har varierat en del.',
  'Lite upp och ner senaste tiden.',
  'Ojämna dagar, men det är helt normalt.',
]

// Changes daily but stays consistent for SSR/client to avoid hydration mismatch
const getStableIndex = (insight: MoodInsight, arrayLength: number): number => {
  const today = new Date()
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  )
  const hash = Math.abs(
    Math.round(insight.average * 1000) + insight.entryCount * 7 + dayOfYear * 13
  )
  return hash % arrayLength
}

export const getInsightMessage = (insight: MoodInsight): string => {
  const key = `${insight.trend}_${insight.level}` as InsightKey
  const messages = INSIGHT_MESSAGES[key]
  const messageIndex = getStableIndex(insight, messages.length)
  const message = messages[messageIndex]

  if (insight.stability === 'fluctuating') {
    const additionIndex = getStableIndex(insight, FLUCTUATING_ADDITIONS.length)
    const addition = FLUCTUATING_ADDITIONS[additionIndex]
    return `${message} ${addition}`
  }

  return message
}

export const calculateMoodLevel = (average: number): MoodLevel => {
  if (average >= 3.5) return 'high'
  if (average >= 2.5) return 'medium'
  return 'low'
}

export const calculateTrend = (
  recentAverage: number,
  olderAverage: number
): MoodTrend => {
  const difference = recentAverage - olderAverage
  if (difference > 0.3) return 'improving'
  if (difference < -0.3) return 'declining'
  return 'stable'
}

export const calculateStability = (moods: number[]): MoodStability => {
  if (moods.length < 2) return 'stable'

  const mean = moods.reduce((sum, m) => sum + m, 0) / moods.length
  const squaredDiffs = moods.map((m) => Math.pow(m - mean, 2))
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / moods.length
  const standardDeviation = Math.sqrt(variance)

  return standardDeviation >= 0.8 ? 'fluctuating' : 'stable'
}
