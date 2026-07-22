import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

// This route is outside app/admin/(protected), so requireAdmin() here is the only gate —
// it must not depend on any layout to keep unauthenticated requests out.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        await requireAdmin();
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // No-op: the row is written by the addImage server action after the client
        // upload resolves, not here. Vercel cannot reach this callback on localhost.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    // requireAdmin() throws these two — everything else (bad body, Blob error) is a 400,
    // not an auth failure.
    const message = error instanceof Error ? error.message : "upload_failed";
    const status = message === "unauthorized" || message === "admin_not_configured" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
