// In-memory rate limiting
// Resets on Worker cold-start, but sufficient for basic protection

type AttemptRecord = {
  count: number
  firstAttempt: number
}

const createRateLimiter = (maxAttempts: number, windowMs: number) => {
  const attempts = new Map<string, AttemptRecord>()

  const isRateLimited = (key: string): boolean => {
    const record = attempts.get(key)
    if (!record) return false

    if (Date.now() - record.firstAttempt > windowMs) {
      attempts.delete(key)
      return false
    }

    return record.count >= maxAttempts
  }

  const recordAttempt = (key: string) => {
    const record = attempts.get(key)
    if (!record || Date.now() - record.firstAttempt > windowMs) {
      attempts.set(key, { count: 1, firstAttempt: Date.now() })
    } else {
      record.count++
    }
  }

  const clearAttempts = (key: string) => {
    attempts.delete(key)
  }

  return { isRateLimited, recordAttempt, clearAttempts }
}

// Login: 5 attempts per 15 minutes
export const loginLimiter = createRateLimiter(5, 15 * 60 * 1000)

// Chat API: 30 requests per 5 minutes (LLM calls are expensive)
export const chatLimiter = createRateLimiter(30, 5 * 60 * 1000)

// Keep old exports for backwards compatibility with auth.ts
export const isRateLimited = loginLimiter.isRateLimited
export const recordFailedAttempt = loginLimiter.recordAttempt
export const clearFailedAttempts = loginLimiter.clearAttempts
