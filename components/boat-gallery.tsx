"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface BoatImage {
  id: number;
  blobUrl: string;
  altEn: string;
  altEs: string;
}

export default function BoatGallery({
  images,
  locale,
}: {
  images: BoatImage[];
  locale: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (selectedIndex === null) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedIndex(null);
      } else if (e.key === "ArrowRight") {
        setSelectedIndex((prev) =>
          prev !== null ? (prev + 1) % images.length : null
        );
      } else if (e.key === "ArrowLeft") {
        setSelectedIndex((prev) =>
          prev !== null ? (prev - 1 + images.length) % images.length : null
        );
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, images.length]);

  if (images.length === 0) return null;

  return (
    <>
      <div className="mt-16 grid grid-cols-2 gap-3 md:grid-cols-3">
        {images.map((img, idx) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setSelectedIndex(idx)}
            className="group relative aspect-[4/3] overflow-hidden rounded-sm text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-marine-500"
          >
            <Image
              src={img.blobUrl}
              alt={locale === "es" ? img.altEs : img.altEn}
              width={500}
              height={375}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-marine-950/0 transition group-hover:bg-marine-950/20" />
            <span className="sr-only">View image</span>
          </button>
        ))}
      </div>

      {selectedIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-marine-950/95 p-4 md:p-8">
          <button
            type="button"
            onClick={() => setSelectedIndex(null)}
            className="absolute top-6 right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close photo modal"
          >
            ✕
          </button>

          <button
            type="button"
            onClick={() =>
              setSelectedIndex(
                (selectedIndex - 1 + images.length) % images.length
              )
            }
            className="absolute left-4 z-10 hidden h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl text-white transition hover:bg-white/20 md:flex"
            aria-label="Previous photo"
          >
            ‹
          </button>

          <div className="relative max-h-[85vh] max-w-[90vw] overflow-hidden">
            <Image
              src={images[selectedIndex].blobUrl}
              alt={
                locale === "es"
                  ? images[selectedIndex].altEs
                  : images[selectedIndex].altEn
              }
              width={1400}
              height={1050}
              className="max-h-[80vh] w-auto max-w-[90vw] object-contain rounded-sm"
              priority
            />
            <div className="mt-4 flex items-center justify-between text-xs tracking-widest text-white/80">
              <span>
                {locale === "es"
                  ? images[selectedIndex].altEs
                  : images[selectedIndex].altEn}
              </span>
              <span>
                {selectedIndex + 1} / {images.length}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedIndex((selectedIndex + 1) % images.length)}
            className="absolute right-4 z-10 hidden h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl text-white transition hover:bg-white/20 md:flex"
            aria-label="Next photo"
          >
            ›
          </button>
        </div>
      )}
    </>
  );
}
