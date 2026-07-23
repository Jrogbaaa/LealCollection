# Spec: Production admin image-upload discoverability and verification

## Goal

Make boat-photo upload clearly discoverable in the live admin and prove the complete
Production path: authenticate, select or drop a real image, upload it to the configured
public Vercel Blob store, persist the boat image, render it in admin and on the public
fleet, then delete the test image cleanly.

## Why it matters

The Leal admin needs to maintain yacht photography from a computer or phone without
developer help or separate image hosting. Code that exists but cannot be found or has never
worked against Production does not solve that operational problem.

## Intended user

The authenticated Leal administrator managing boat photography.

## Success criteria

1. The boats admin makes the route to photo management obvious; the boat edit view labels
   its image-management section clearly and shows the uploader without hidden prerequisites.
2. The uploader supports click-to-pick and single-file drag/drop for JPEG, PNG, and WebP,
   shows a preview, exposes EN/ES alt-text fields, and reports upload errors visibly.
3. `/api/admin/upload` remains fail-closed and cannot mint upload tokens for an
   unauthenticated request.
4. Production uses a valid `BLOB_READ_WRITE_TOKEN` for the public Blob store; no token or
   customer/admin credential is written to source, logs, harness files, or test output.
5. A real Production upload creates a `boat_images` row with a
   `*.public.blob.vercel-storage.com` URL and the image renders in the admin image list and
   the public fleet experience.
6. Deleting that test image removes the database row and the underlying Blob object; seeded
   local images remain untouched.
7. Desktop and 360px mobile layouts expose the same upload capability without horizontal
   overflow or unreachable actions.
8. TypeScript, production build, Vitest, and the focused admin Playwright coverage pass.
9. A separate Evaluator audits every criterion before shipment; after shipment, the live
   upload/render/delete flow is repeated against Production.

## What this is not / non-goals

- No multi-image batch upload.
- No image reordering or `sortOrder` UI.
- No cropper, compression pipeline, or image editor.
- No database schema changes.
- No public fleet redesign beyond verifying the uploaded photo renders.
- No auth redesign or additional admin accounts.
- No unrelated TODO cleanup.

## Open questions

None. The owner explicitly requested continued iteration through a real Production upload
and authorized creating and deleting a test boat image.
