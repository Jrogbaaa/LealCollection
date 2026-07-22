import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import * as schema from "./schema";

// Next.js injects .env.local automatically; this only fires for standalone scripts
// (seed, drizzle-kit) run outside the Next runtime. dotenv never overwrites an
// already-set env var, so this is a no-op under `next dev`/`next build`.
if (!process.env.DATABASE_URL) {
  config({ path: ".env.local" });
}

type Db = ReturnType<typeof drizzle<typeof schema>>;

// Initialized on first use, not at import. Next's production build evaluates every route
// module during "Collecting page data"; a top-level neon() would throw there whenever
// DATABASE_URL is absent (e.g. Vercel Preview builds), failing the build for a connection
// that isn't needed until a request runs. The Proxy defers that to first actual use.
let instance: Db | undefined;
function getDb(): Db {
  if (!instance) {
    const sql = neon(process.env.DATABASE_URL!);
    instance = drizzle(sql, { schema });
  }
  return instance;
}

export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = getDb();
    const value = real[prop as keyof Db];
    return typeof value === "function" ? value.bind(real) : value;
  },
});
