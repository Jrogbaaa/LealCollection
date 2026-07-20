# Spec: Admin boat image upload (Vercel Blob)

## Goal

Replace the admin "paste an image URL" input with a real file upload to Vercel Blob, so
the admin can add boat photos directly from their machine.

## Why it matters

Admin efficiency. Today, adding a boat photo requires the admin to host the file
somewhere else first and paste a URL — an awkward extra step for a single-admin
operation that otherwise has no external hosting workflow. `TODOS.md [ADMIN-IMAGE-UPLOAD]`
flagged this as blocked on `BLOB_READ_WRITE_TOKEN`, which is now supplied in
`.env.local` — the blocker is gone.

## Intended user

Leal admin (single admin user), in `/admin/boats/[id]/edit`.

## What success looks like

- Admin can pick an image file (jpeg/png/webp) from their machine in the boat edit page
  and it uploads to Vercel Blob, landing as a `boat_images` row with a
  `*.public.blob.vercel-storage.com` URL.
- The uploaded image renders immediately in the admin images list and on `/fleet`.
- Deleting an image removes both the DB row and the underlying Blob file (skipping
  deletion for the pre-existing seeded `/images/*` local paths, which are not Blob URLs).
- `deleteImage` is scoped to `boatId` (fixes a pre-existing gap where it only filtered
  by image id).
- `tsc -b`, `npm run build`, `npx vitest run` all pass; `e2e/admin.spec.ts` gets a new
  upload case that cleans up after itself.

## Non-goals / out of scope

- Image reordering UI / fixing the `sortOrder` always-0 gap — pre-existing, unrelated,
  flagged in TODOS.md instead of fixed here.
- Multi-file / drag-and-drop upload — single file input is sufficient.
- Image cropping, resizing, or client-side compression.
- Changing the DB schema — `blobUrl` column already fits.
- Any change to the public `/fleet` rendering path.

## Approach (see decisions.md for why)

Client-side direct upload via `@vercel/blob/client`: browser uploads straight to Blob
through a token-issuing route (`app/api/admin/upload/route.ts`, gated by `requireAdmin()`),
then a small client component (`app/admin/(protected)/boats/image-upload.tsx`) calls the
existing `addImage` server action with the resulting URL.

## Open questions

None outstanding — resolved with the user before this harness run (see decisions.md).
