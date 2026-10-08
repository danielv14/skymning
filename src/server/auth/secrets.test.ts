import { describe, expect, it } from 'vitest'
import { timingSafeEqual } from './secrets'

describe('timingSafeEqual', () => {
  it('accepts identical strings', async () => {
    expect(await timingSafeEqual('hemligt-lösenord', 'hemligt-lösenord')).toBe(true)
  })

  it('rejects different strings of equal and unequal length', async () => {
    expect(await timingSafeEqual('hemligt-lösenorD', 'hemligt-lösenord')).toBe(false)
    expect(await timingSafeEqual('hemligt', 'hemligt-lösenord')).toBe(false)
    expect(await timingSafeEqual('', 'hemligt-lösenord')).toBe(false)
  })
})
