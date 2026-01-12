import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/90ebe8ae771f2635e0f049f75f188f28ab0fb1a40f63fd68531c72d951323499.sqlite",
  },
});
