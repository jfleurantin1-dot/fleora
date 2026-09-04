"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "vendor-photos";
const MAX_MB = 10;
const MAX_PHOTOS = 12;

/**
 * Uploads portfolio images directly to Supabase Storage. The ordered public
 * URLs are submitted in a hidden field; the first image becomes the storefront
 * cover image because vendor_photos.sort starts at 0.
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
    if (!files.length) return;

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
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        setError(uploadError.message);
        continue;
      }

      added.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    }

    if (added.length) setUrls((current) => [...current, ...added]);
    setBusy(false);
  }

  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= urls.length) return;
    setUrls((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function makeCover(index: number) {
    if (index === 0) return;
    setUrls((current) => {
      const next = [...current];
      const [picked] = next.splice(index, 1);
      next.unshift(picked);
      return next;
    });
  }

  async function remove(url: string) {
    setUrls((current) => current.filter((item) => item !== url));
    const marker = `/${BUCKET}/`;
    const i = url.indexOf(marker);
    if (i !== -1) {
      const path = decodeURIComponent(url.slice(i + marker.length));
      await supabase.storage.from(BUCKET).remove([path]);
    }
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="photos" value={urls.join("\n")} />

      {urls.length > 0 && (
        <>
          <div className="rounded-xl bg-plum-50 px-3 py-2 text-xs text-plum-700">
            <strong>Your first photo is your cover image.</strong> Reorder photos or choose “Make cover,” then save your profile.
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {urls.map((url, index) => (
              <div key={url} className="overflow-hidden rounded-2xl border border-[#E9E3E7] bg-white shadow-sm">
                <div className="relative aspect-square overflow-hidden bg-plum-50">
                  <Image src={url} alt={`Portfolio photo ${index + 1}`} fill sizes="180px" className="object-cover" />
                  {index === 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-plum-700 shadow-sm">Cover</span>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(url)}
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-base text-slate-600 shadow hover:text-rose-600"
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1 p-2">
                  {index !== 0 ? (
                    <button type="button" onClick={() => makeCover(index)} className="col-span-2 rounded-lg bg-plum-50 px-2 py-1.5 text-[11px] font-bold text-plum-700 hover:bg-plum-100">Make cover</button>
                  ) : (
                    <span className="col-span-2 px-2 py-1.5 text-center text-[11px] font-semibold text-ink-400">Storefront cover</span>
                  )}
                  <button type="button" disabled={index === 0} onClick={() => move(index, -1)} className="rounded-lg border border-[#E9E3E7] px-2 py-1.5 text-xs font-semibold text-ink-600 disabled:opacity-30">← Earlier</button>
                  <button type="button" disabled={index === urls.length - 1} onClick={() => move(index, 1)} className="rounded-lg border border-[#E9E3E7] px-2 py-1.5 text-xs font-semibold text-ink-600 disabled:opacity-30">Later →</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div>
        <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${busy ? "bg-plum-400" : "bg-plum-600 hover:bg-plum-700"}`}>
          {busy ? "Uploading…" : urls.length ? "Add more photos" : "Upload portfolio photos"}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={onFiles} disabled={busy} />
        </label>
        <p className="mt-2 text-xs text-ink-400">JPG, PNG, WEBP or GIF · up to {MAX_MB}MB each · {MAX_PHOTOS} photos max</p>
      </div>

      {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </div>
  );
}
