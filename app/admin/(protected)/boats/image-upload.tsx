"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export default function ImageUpload({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const altEnRef = useRef<HTMLInputElement>(null);
  const altEsRef = useRef<HTMLInputElement>(null);

  function selectFile(next: File | null) {
    if (!next) return;
    if (!ACCEPTED.includes(next.type)) {
      setError("Use a JPEG, PNG or WebP image");
      return;
    }
    setError(null);
    setFile(next);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(next);
    });
  }

  function reset() {
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (altEnRef.current) altEnRef.current.value = "";
    if (altEsRef.current) altEsRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      setError("Choose or drop a file first");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
      });

      const formData = new FormData();
      formData.set("blobUrl", blob.url);
      formData.set("altEn", altEnRef.current?.value ?? "");
      formData.set("altEs", altEsRef.current?.value ?? "");
      await action(formData);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-3 sm:grid-cols-2">
      <div
        role="button"
        tabIndex={0}
        aria-label="Add an image — drag a file here or click to browse"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          selectFile(e.dataTransfer.files?.[0] ?? null);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border border-dashed px-4 py-8 text-center text-sm transition sm:col-span-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-marine-700 ${
          isDragging
            ? "border-marine-700 bg-marine-950/5"
            : "border-marine-950/25 hover:border-marine-950/50"
        }`}
      >
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Selected preview"
              className="h-24 w-40 rounded-sm object-cover"
            />
            <span className="truncate text-xs text-marine-900/60">{file?.name}</span>
          </>
        ) : (
          <>
            <span className="text-marine-900/70">
              Drag a photo here, or <span className="underline">browse</span>
            </span>
            <span className="text-xs text-marine-900/45">JPEG, PNG or WebP</span>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        onChange={(e) => selectFile(e.target.files?.[0] ?? null)}
      />
      <input
        ref={altEnRef}
        name="altEn"
        placeholder="Alt text (EN)"
        className="rounded-sm border border-marine-950/20 bg-white px-4 py-2.5 focus:border-marine-700 focus:outline-none"
      />
      <input
        ref={altEsRef}
        name="altEs"
        placeholder="Alt text (ES)"
        className="rounded-sm border border-marine-950/20 bg-white px-4 py-2.5 focus:border-marine-700 focus:outline-none"
      />
      {error && <p className="text-xs text-red-700 sm:col-span-2">{error}</p>}
      <button
        type="submit"
        disabled={isUploading || !file}
        className="sm:col-span-2 rounded-full border border-marine-950/20 px-6 py-2.5 text-sm uppercase tracking-widest text-marine-950 hover:border-marine-950 disabled:opacity-50"
      >
        {isUploading ? "Uploading…" : "Add image"}
      </button>
    </form>
  );
}
