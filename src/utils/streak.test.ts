import { describe, expect, it } from 'vitest'
import { calculateStreak } from './streak'

describe('calculateStreak', () => {
  it('returns 0 without entries', () => {
    expect(calculateStreak([], '2026-10-07')).toBe(0)
  })

  it('counts consecutive days ending today', () => {
    expect(calculateStreak(['2026-10-07', '2026-10-06', '2026-10-05'], '2026-10-07')).toBe(3)
  })

  it('keeps the streak alive when the latest entry is from yesterday', () => {
    expect(calculateStreak(['2026-10-06', '2026-10-05'], '2026-10-07')).toBe(2)
  })

  it('breaks when the latest entry is older than yesterday', () => {
    expect(calculateStreak(['2026-10-05', '2026-10-04'], '2026-10-07')).toBe(0)
  })

  it('stops at the first gap', () => {
    expect(calculateStreak(['2026-10-07', '2026-10-06', '2026-10-04'], '2026-10-07')).toBe(2)
  })

  it('counts across month boundaries', () => {
    expect(calculateStreak(['2026-10-01', '2026-09-30', '2026-09-29'], '2026-10-01')).toBe(3)
  })
})
