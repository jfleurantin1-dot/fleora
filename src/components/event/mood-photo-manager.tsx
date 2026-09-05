"use client";

import { ChangeEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeMoodPhoto, uploadMoodPhotos } from "@/app/(app)/events/[id]/edit/actions";

type MoodPhoto = { id: string; url: string; sort: number };

export function MoodPhotoManager({ eventId, photos }: { eventId: string; photos: MoodPhoto[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [previews, setPreviews] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  async function onPick(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 6);
    if (!files.length) return;

    const local = files.map((file) => URL.createObjectURL(file));
    setPreviews(local);
    setStatus(`Uploading ${files.length} photo${files.length === 1 ? "" : "s"}…`);

    const data = new FormData();
    files.forEach((file) => data.append("mood_photos", file));

    startTransition(async () => {
      const result = await uploadMoodPhotos(eventId, data);
      if (result?.error) {
        setStatus(result.error);
        return;
      }
      setStatus("Saved to your mood board");
      setPreviews([]);
      event.target.value = "";
      router.refresh();
    });
  }

  function remove(photoId: string) {
    setStatus("Removing photo…");
    startTransition(async () => {
      await removeMoodPhoto(eventId, photoId);
      setStatus("Mood board updated");
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-ink-900">Event mood board</h2>
          <p className="mt-1 text-xs text-ink-500">Add photos that capture your vision. New photos appear immediately while Fleora saves them.</p>
        </div>
        {status && <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${status.includes("Saved") || status.includes("updated") ? "bg-sage-50 text-sage-700" : status.includes("error") ? "bg-blush-50 text-rose-600" : "bg-plum-50 text-plum-700"}`}>{pending ? "Uploading…" : status}</span>}
      </div>

      {(photos.length > 0 || previews.length > 0) && (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative overflow-hidden rounded-xl bg-ivory-100">
              <img src={photo.url} alt="Mood board" className="aspect-square w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(photo.id)}
                disabled={pending}
                className="absolute right-1.5 top-1.5 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-rose-600 shadow-sm disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
          {previews.map((src, index) => (
            <div key={src} className="relative overflow-hidden rounded-xl bg-plum-50">
              <img src={src} alt={`New mood board photo ${index + 1}`} className="aspect-square w-full object-cover opacity-75" />
              <div className="absolute inset-x-1.5 bottom-1.5 rounded-full bg-white/90 px-2 py-1 text-center text-[9px] font-bold text-plum-700">Uploading…</div>
            </div>
          ))}
        </div>
      )}

      <label className="mt-4 block cursor-pointer rounded-xl border-2 border-dashed border-plum-200 bg-plum-50/40 p-4 text-center transition hover:border-plum-300 hover:bg-plum-50">
        <span className="text-sm font-bold text-plum-700">＋ Add mood board photos</span>
        <span className="mt-1 block text-[11px] text-ink-400">JPG, PNG, WEBP or GIF · max 10 MB each</span>
        <input onChange={onPick} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" disabled={pending} />
      </label>
    </div>
  );
}
