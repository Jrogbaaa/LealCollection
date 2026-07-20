import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "./index";
import { boats, boatImages, extras } from "./schema";

const GALLERY = [
  "hero-aerial",
  "running-starboard",
  "running-aerial",
  "running-portside",
  "aerial-sundeck",
  "stern-anchor",
  "deck-snacks-1",
  "deck-snacks-2",
  "cabin-interior",
];

async function seed() {
  const [boat] = await db
    .insert(boats)
    .values({
      slug: "cranchi-32",
      nameEn: "Cranchi 32",
      nameEs: "Cranchi 32",
      descriptionEn:
        "A sleek 32ft Cranchi built for the Ibiza coastline — spacious sundeck, a shaded lounge, and a private cabin below. Skippered charters to the island's best anchorages, Formentera included.",
      descriptionEs:
        "Un elegante Cranchi de 32 pies pensado para la costa de Ibiza: amplia solárium, salón a la sombra y camarote privado. Chárters con patrón a los mejores fondeaderos de la isla, Formentera incluida.",
      lengthFt: 32,
      capacity: 10,
      cabins: 1,
      homeMarina: "Marina Ibiza",
      // Estimated from the closest public comparable (Windrose Ibiza's Cranchi Zaffiro 32,
      // €968/day peak) — pending real owner pricing, tracked in TODOS.md.
      priceFullDay: 95000,
      priceMorning: 60000,
      priceAfternoon: 60000,
      sortOrder: 0,
      isPublished: true,
    })
    .returning();

  await db.insert(boatImages).values(
    GALLERY.map((name, i) => ({
      boatId: boat.id,
      blobUrl: `/images/cranchi-32/gallery/${name}.webp`,
      altEn: "Cranchi 32 yacht in Ibiza waters",
      altEs: "Yate Cranchi 32 en aguas de Ibiza",
      sortOrder: i,
    }))
  );

  await db.insert(extras).values([
    {
      key: "champagne",
      labelEn: "Champagne on board",
      labelEs: "Champán a bordo",
      price: 9000,
      isIncluded: false,
      sortOrder: 0,
    },
    {
      key: "caviar_snack",
      labelEn: "Luxury caviar snack",
      labelEs: "Snack de caviar de lujo",
      price: 0, // TBD — see agent-harness/open-questions.md
      isIncluded: false,
      sortOrder: 1,
    },
    {
      key: "towel_service",
      labelEn: "Towel service",
      labelEs: "Servicio de toallas",
      price: 0,
      isIncluded: true,
      sortOrder: 2,
    },
    {
      key: "skipper",
      labelEn: "Skipper",
      labelEs: "Patrón",
      price: 25000,
      isIncluded: false,
      sortOrder: 3,
    },
  ]);

  console.log(`Seeded boat "${boat.slug}" with ${GALLERY.length} images and 4 extras.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
