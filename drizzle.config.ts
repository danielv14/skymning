import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: 'a92bf951-ee0c-49af-8f5b-06c75bf61c3f',
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
})
