import { describe, expect, it } from 'vitest'
import { buildMoodInsight, calculateStability } from './moodInsight'

describe('buildMoodInsight', () => {
  it('detects an improving trend when recent moods are higher', () => {
    const insight = buildMoodInsight([5, 5, 4, 4, 2, 2, 2, 2])
    expect(insight.trend).toBe('improving')
    expect(insight.entryCount).toBe(8)
    expect(insight.average).toBe(3.25)
    expect(insight.level).toBe('medium')
  })

  it('detects a declining trend when recent moods are lower', () => {
    expect(buildMoodInsight([1, 2, 1, 2, 4, 4, 4, 4]).trend).toBe('declining')
  })

  it('treats small differences as stable', () => {
    const insight = buildMoodInsight([4, 4, 4, 4, 4, 4])
    expect(insight.trend).toBe('stable')
    expect(insight.stability).toBe('stable')
    expect(insight.level).toBe('high')
  })
})

describe('calculateStability', () => {
  it('flags large swings as fluctuating', () => {
    expect(calculateStability([1, 5, 1, 5, 1, 5])).toBe('fluctuating')
  })
})
