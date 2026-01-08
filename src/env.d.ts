/// <reference types="@cloudflare/workers-types" />

// Utöka Cloudflare.Env med våra bindings från wrangler.toml
// Se: https://developers.cloudflare.com/workers/configuration/typescript/#cloudflareenv
declare namespace Cloudflare {
  interface Env {
    DB: D1Database
    SESSION_SECRET: string
    AUTH_SECRET: string
    OPENAI_API_KEY: string
  }
}
