"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "vendor-photos";
const MAX_MB = 10;
const MAX_PHOTOS = 12;

/**
 * Uploads portfolio images straight to Supabase Storage from the browser and
 * keeps the list of public URLs in a hidden `photos` field (newline-joined) so
 * the existing saveVendorProfile server action picks them up unchanged.
 */
export function PhotoUploader({ userId, initial }: { userId: string; initial: string[] }) {
  const [urls, setUrls] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (inputRef.current) inputRef.current.value = "";
    if (files.length === 0) return;

    setError(null);
    setBusy(true);
    const added: string[] = [];

    for (const file of files) {
      if (urls.length + added.length >= MAX_PHOTOS) {
        setError(`You can add up to ${MAX_PHOTOS} photos.`);
        break;
      }
      if (!file.type.startsWith("image/")) {
        setError("Please choose image files only.");
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        setError(`Each image must be under ${MAX_MB}MB.`);
        continue;
      }
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) {
        setError(upErr.message);
        continue;
      }
      added.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    }

    if (added.length) setUrls((u) => [...u, ...added]);
    setBusy(false);
  }

  async function remove(url: string) {
    setUrls((u) => u.filter((x) => x !== url));
    const marker = `/${BUCKET}/`;
    const i = url.indexOf(marker);
    if (i !== -1) {
      const path = decodeURIComponent(url.slice(i + marker.length));
      await supabase.storage.from(BUCKET).remove([path]);
    }
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="photos" value={urls.join("\n")} />

      {urls.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {urls.map((url) => (
            <div
              key={url}
              className="relative aspect-square overflow-hidden rounded-xl bg-plum-50 ring-1 ring-plum-200"
            >
              <Image src={url} alt="" fill sizes="140px" className="object-cover" />
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-sm text-slate-600 shadow hover:text-rose-600"
                aria-label="Remove photo"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <label
          className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white ${
            busy ? "bg-plum-400" : "bg-plum-600 hover:bg-plum-700"
          }`}
        >
          {busy ? "Uploading…" : urls.length ? "Add more photos" : "Add photos"}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onFiles}
            disabled={busy}
          />
        </label>
        <p className="mt-1 text-xs text-slate-400">
          JPG, PNG, WEBP or GIF · up to {MAX_MB}MB each · {MAX_PHOTOS} max
        </p>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </div>
  );
}
