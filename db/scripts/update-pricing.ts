// One-off: apply the estimated Cranchi 32 pricing (see TODOS.md — estimate pending owner
// confirmation, not a real quote). `drizzle-kit push` only applies schema, never data, so
// this fills in the price fields the seed left at 0. Safe to re-run.
import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { db } from "../index";
import { boats } from "../schema";

async function main() {
  const result = await db
    .update(boats)
    .set({
      priceFullDay: 95000,
      priceMorning: 60000,
      priceAfternoon: 60000,
    })
    .where(eq(boats.slug, "cranchi-32"))
    .returning({ id: boats.id, slug: boats.slug });

  if (result.length === 0) {
    throw new Error('No boat with slug "cranchi-32" found — run db/seed.ts first.');
  }
  console.log(`Updated pricing for boat "${result[0].slug}" (id ${result[0].id}).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
