import { env } from 'cloudflare:workers'

type RateLimiterName = 'LOGIN_RATE_LIMITER' | 'CHAT_RATE_LIMITER' | 'EXPLORE_CHAT_RATE_LIMITER'

// Uses Cloudflare's Rate Limiting binding so the limit is shared across all Worker isolates.
// Limits are configured per binding in wrangler.toml.
export const isRateLimited = async (
  limiterName: RateLimiterName,
  key: string,
): Promise<boolean> => {
  const { success } = await env[limiterName].limit({ key })
  return !success
}

export const getClientIp = (headers: Headers): string =>
  headers.get('CF-Connecting-IP') ?? 'unknown'
