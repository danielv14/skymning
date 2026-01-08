/// <reference types="@cloudflare/workers-types" />

// Extend Cloudflare.Env with our bindings from wrangler.toml
// See: https://developers.cloudflare.com/workers/configuration/typescript/#cloudflareenv
declare namespace Cloudflare {
  interface Env {
    DB: D1Database
    SESSION_SECRET: string
    AUTH_SECRET: string
    OPENAI_API_KEY: string
  }
}
