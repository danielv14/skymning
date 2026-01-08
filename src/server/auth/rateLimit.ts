// In-memory rate limiting för login-försök
// Återställs vid Worker cold-start, men tillräckligt för grundläggande brute-force-skydd

type AttemptRecord = {
  count: number
  firstAttempt: number
}

const failedAttempts = new Map<string, AttemptRecord>()

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minuter

export const isRateLimited = (ip: string): boolean => {
  const record = failedAttempts.get(ip)
  if (!record) return false

  // Återställ om tidsfönstret har passerat
  if (Date.now() - record.firstAttempt > WINDOW_MS) {
    failedAttempts.delete(ip)
    return false
  }

  return record.count >= MAX_ATTEMPTS
}

export const recordFailedAttempt = (ip: string) => {
  const record = failedAttempts.get(ip)
  if (!record || Date.now() - record.firstAttempt > WINDOW_MS) {
    failedAttempts.set(ip, { count: 1, firstAttempt: Date.now() })
  } else {
    record.count++
  }
}

export const clearFailedAttempts = (ip: string) => {
  failedAttempts.delete(ip)
}
