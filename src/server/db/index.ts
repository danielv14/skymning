import { drizzle } from 'drizzle-orm/d1'
import { env } from 'cloudflare:workers'
import * as schema from './schema'

// Databas-instans via Cloudflare D1
// Fungerar både lokalt (via miniflare) och i produktion
export const getDb = () => {
  return drizzle(env.DB, { schema })
}

// Exportera typer
export type DbClient = ReturnType<typeof getDb>
