/// <reference types="@cloudflare/workers-types" />

declare module 'markdown-to-jsx' {
  import type { ComponentType, ReactNode } from 'react'

  type MarkdownOverrides = Record<
    string,
    | { component?: ComponentType<Record<string, unknown>>; props?: Record<string, unknown> }
    | ComponentType<Record<string, unknown>>
  >

  type MarkdownOptions = {
    overrides?: MarkdownOverrides
    forceBlock?: boolean
    forceInline?: boolean
    wrapper?: ComponentType | string | null
    createElement?: typeof import('react').createElement
  }

  type MarkdownProps = {
    children: string
    options?: MarkdownOptions
  }

  const Markdown: ComponentType<MarkdownProps>
  export default Markdown
}

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
