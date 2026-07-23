import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { db } from "./index";
import { boats, boatImages, extras } from "./schema";

const BOATS_DATA = [
  {
    slug: "cranchi-32",
    nameEn: "Cranchi 32",
    nameEs: "Cranchi 32",
    descriptionEn:
      "A sleek 32ft Cranchi built for the Ibiza coastline — spacious sundeck, shaded lounge, and private cabin below. Skippered charters to the island's best anchorages and Formentera.",
    descriptionEs:
      "Un elegante Cranchi de 32 pies pensado para la costa de Ibiza: solárium, salón a la sombra y camarote privado. Chárters con patrón a los mejores fondeaderos de Ibiza y Formentera.",
    lengthFt: 32,
    capacity: 10,
    cabins: 1,
    homeMarina: "Marina Ibiza",
    priceFullDay: 120000,
    priceMorning: 75000,
    priceAfternoon: 75000,
    sortOrder: 0,
    isPublished: true,
    images: [
      { name: "pdf-cranchi-1.png", altEn: "Cranchi 32 yacht at anchor in Ibiza", altEs: "Yate Cranchi 32 fondeado en Ibiza" },
      { name: "pdf-cranchi-2.png", altEn: "Cranchi 32 deck lounge and sundeck", altEs: "Solárium y salón de cubierta del Cranchi 32" },
      { name: "pdf-cranchi-3.png", altEn: "Cranchi 32 cruising in blue waters", altEs: "Cranchi 32 navegando en aguas azul turquesa" },
      { name: "pdf-cranchi-4.png", altEn: "Cranchi 32 helm station and seating", altEs: "Puesto de mando del Cranchi 32" },
      { name: "pdf-cranchi-5.png", altEn: "Cranchi 32 swim platform", altEs: "Plataforma de baño del Cranchi 32" },
      { name: "pdf-cranchi-6.png", altEn: "Cranchi 32 cabin interior", altEs: "Camarote interior del Cranchi 32" },
    ],
    imageFolder: "/images/cranchi-32/gallery",
  },
  {
    slug: "fjord-42",
    nameEn: "Fjord 42",
    nameEs: "Fjord 42",
    descriptionEn:
      "An iconic 42ft Fjord open yacht with vertical bow design, sprawling bow sunbeds, deep shade T-top, and open-plan deck built for ultimate Mediterranean luxury.",
    descriptionEs:
      "Un icónico yate abierto Fjord de 42 pies con diseño de proa vertical, amplios soláriums, techo T-top y cubierta abierta diseñada para el lujo mediterráneo.",
    lengthFt: 42,
    capacity: 12,
    cabins: 1,
    homeMarina: "Marina Ibiza",
    priceFullDay: 120000,
    priceMorning: 75000,
    priceAfternoon: 75000,
    sortOrder: 1,
    isPublished: true,
    images: [
      { name: "hero-fjord.jpg", altEn: "Fjord 42 open yacht in Ibiza cove", altEs: "Yate abierto Fjord 42 en cala de Ibiza" },
      { name: "running-fjord.jpg", altEn: "Fjord 42 cruising through turquoise sea", altEs: "Fjord 42 navegando en aguas turquesas" },
      { name: "sundeck-fjord.jpg", altEn: "Fjord 42 bow sundeck lounge", altEs: "Solárium de proa del Fjord 42" },
      { name: "stern-fjord.jpg", altEn: "Fjord 42 stern swim platform", altEs: "Plataforma de baño del Fjord 42" },
      { name: "cabin-fjord.jpg", altEn: "Fjord 42 private cabin interior", altEs: "Camarote privado del Fjord 42" },
    ],
    imageFolder: "/images/fjord",
  },
  {
    slug: "dantonio-36",
    nameEn: "De Antonio D36",
    nameEs: "De Antonio D36",
    descriptionEn:
      "Modern 36ft De Antonio open motor yacht featuring a distinctive dark grey hull, concealed outboard engines, dual sunbeds, and luxury walkaround layout.",
    descriptionEs:
      "Moderno yate a motor abierto De Antonio de 36 pies con casco gris oscuro, motores fueraborda ocultos, doble solárium y diseño walkaround de lujo.",
    lengthFt: 36,
    capacity: 11,
    cabins: 1,
    homeMarina: "Marina Ibiza",
    priceFullDay: 120000,
    priceMorning: 75000,
    priceAfternoon: 75000,
    sortOrder: 2,
    isPublished: true,
    images: [
      { name: "hero-dantonio.jpg", altEn: "De Antonio D36 open yacht anchored in Ibiza", altEs: "Yate De Antonio D36 fondeado en Ibiza" },
      { name: "running-dantonio.jpg", altEn: "De Antonio D36 cruising in crystal sea", altEs: "De Antonio D36 navegando en aguas cristalinas" },
    ],
    imageFolder: "/images/dantonio-36",
  },
];

const EXTRAS_DATA = [
  {
    key: "champagne",
    labelEn: "Champagne on board",
    labelEs: "Champán a bordo",
    price: 8500, // €85
    isIncluded: false,
    sortOrder: 0,
  },
  {
    key: "caviar_snack",
    labelEn: "Luxury caviar snack",
    labelEs: "Snack de caviar de lujo",
    price: 0,
    isIncluded: false,
    sortOrder: 1,
  },
  {
    key: "towel_service",
    labelEn: "Towel service",
    labelEs: "Servicio de toallas",
    price: 1000, // €10 per person
    isIncluded: false,
    sortOrder: 2,
  },
  {
    key: "skipper",
    labelEn: "Professional skipper",
    labelEs: "Patrón profesional",
    price: 25000, // €250
    isIncluded: false,
    sortOrder: 3,
  },
];

async function seed() {
  await db.delete(boatImages);

  for (const bData of BOATS_DATA) {
    let boat = await db.query.boats.findFirst({
      where: (b, { eq }) => eq(b.slug, bData.slug),
    });

    if (!boat) {
      const [inserted] = await db
        .insert(boats)
        .values({
          slug: bData.slug,
          nameEn: bData.nameEn,
          nameEs: bData.nameEs,
          descriptionEn: bData.descriptionEn,
          descriptionEs: bData.descriptionEs,
          lengthFt: bData.lengthFt,
          capacity: bData.capacity,
          cabins: bData.cabins,
          homeMarina: bData.homeMarina,
          priceFullDay: bData.priceFullDay,
          priceMorning: bData.priceMorning,
          priceAfternoon: bData.priceAfternoon,
          sortOrder: bData.sortOrder,
          isPublished: bData.isPublished,
        })
        .returning();
      boat = inserted;
    } else {
      await db
        .update(boats)
        .set({
          nameEn: bData.nameEn,
          nameEs: bData.nameEs,
          priceFullDay: bData.priceFullDay,
          priceMorning: bData.priceMorning,
          priceAfternoon: bData.priceAfternoon,
        })
        .where(eq(boats.id, boat.id));
    }

    const imageRecords = bData.images.map((img, i) => ({
      boatId: boat.id,
      blobUrl: `${bData.imageFolder}/${img.name}`,
      altEn: img.altEn,
      altEs: img.altEs,
      sortOrder: i,
    }));

    await db.insert(boatImages).values(imageRecords);
  }

  for (const eData of EXTRAS_DATA) {
    const existing = await db.query.extras.findFirst({
      where: (e, { eq }) => eq(e.key, eData.key),
    });

    if (existing) {
      await db
        .update(extras)
        .set({
          price: eData.price,
          isIncluded: eData.isIncluded,
          labelEn: eData.labelEn,
          labelEs: eData.labelEs,
        })
        .where(eq(extras.id, existing.id));
    } else {
      await db.insert(extras).values(eData);
    }
  }

  console.log(`Seeded ${BOATS_DATA.length} boats and ${EXTRAS_DATA.length} extras successfully.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
