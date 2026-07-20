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

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
