import { notFound } from "next/navigation";
import { getBoatById } from "@/db/queries";
import BoatFormFields from "../../boat-form";
import ImageUpload from "../../image-upload";
import { updateBoat, deleteBoat, addImage, deleteImage } from "../../actions";

export default async function EditBoatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const boatId = Number(id);
  const boat = await getBoatById(boatId);
  if (!boat) notFound();

  const updateBoatWithId = updateBoat.bind(null, boatId);
  const deleteBoatWithId = deleteBoat.bind(null, boatId);
  const addImageWithId = addImage.bind(null, boatId);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl text-marine-950">
        Edit {boat.nameEn}
      </h1>

      <form action={updateBoatWithId} className="mt-8">
        <BoatFormFields boat={boat} isNew={false} />
        <button
          type="submit"
          className="mt-8 rounded-full bg-marine-950 px-8 py-3 text-sm uppercase tracking-widest text-sand-50 hover:bg-marine-900"
        >
          Save changes
        </button>
      </form>

      <section className="mt-16">
        <h2 className="font-display text-xl text-marine-950">Images</h2>
        <ul className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
          {boat.images.map((img) => {
            const deleteImageWithIds = deleteImage.bind(null, img.id, boatId);
            return (
              <li
                key={img.id}
                className="flex min-w-0 items-center justify-between gap-3 rounded-sm border border-marine-950/10 p-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.blobUrl}
                  alt={img.altEn}
                  className="h-16 w-24 shrink-0 rounded-sm object-cover"
                />
                <span className="min-w-0 flex-1 truncate text-xs text-marine-900/60">
                  {img.blobUrl}
                </span>
                <form action={deleteImageWithIds} className="shrink-0">
                  <button type="submit" className="text-xs text-red-700 hover:underline">
                    Delete
                  </button>
                </form>
              </li>
            );
          })}
        </ul>

        <ImageUpload action={addImageWithId} />
      </section>

      <section className="mt-16 border-t border-marine-950/10 pt-8">
        <form action={deleteBoatWithId}>
          <button type="submit" className="text-sm text-red-700 hover:underline">
            Delete this boat
          </button>
        </form>
      </section>
    </div>
  );
}
