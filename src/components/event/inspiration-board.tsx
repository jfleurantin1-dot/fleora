"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Card, Input } from "@/components/ui";
import { SparkleIcon } from "@/components/icons";

type Inspiration = {
  id: string;
  image: string;
  title: string;
  note: string;
  tags: string[];
  createdAt: number;
};

const ELEMENTS = ["Balloons & Decor", "Florals", "Tablescape", "Cake", "Backdrop", "Lighting", "Signage", "Venue styling"];

function storageKey(eventId: string) {
  return `fleora:inspiration:${eventId}`;
}

export function InspirationBoard({ eventId, eventName, eventStyle, colorPalette }: { eventId: string; eventName: string; eventStyle?: string | null; colorPalette?: string | null }) {
  const [items, setItems] = useState<Inspiration[]>([]);
  const [active, setActive] = useState<Inspiration | null>(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<string[]>(["Balloons & Decor", "Florals", "Tablescape"]);
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey(eventId));
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // Keep the board usable even if browser storage is unavailable.
    }
  }, [eventId]);

  function persist(next: Inspiration[]) {
    setItems(next);
    try {
      window.localStorage.setItem(storageKey(eventId), JSON.stringify(next));
    } catch {
      setNotice("This browser could not save another large image. Try a smaller photo.");
    }
  }

  function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotice("Please choose an image file.");
      return;
    }
    if (file.size > 2_500_000) {
      setNotice("For this preview, please use an image under 2.5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = String(reader.result ?? "");
      const item: Inspiration = {
        id: crypto.randomUUID(),
        image,
        title: title.trim() || "Inspiration look",
        note: note.trim(),
        tags: selected,
        createdAt: Date.now(),
      };
      persist([item, ...items]);
      setActive(item);
      setTitle("");
      setNote("");
      setNotice("Saved to your inspiration board ✦");
      if (inputRef.current) inputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  }

  function toggle(tag: string) {
    setSelected((prev) => prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]);
  }

  function remove(id: string) {
    const next = items.filter((item) => item.id !== id);
    persist(next);
    if (active?.id === id) setActive(null);
  }

  const plan = useMemo(() => {
    const source = active?.tags?.length ? active.tags : selected;
    return source.map((name, i) => ({ name, priority: i < 3 ? "Recommended" : "Optional" }));
  }, [active, selected]);

  return (
    <div className="space-y-8">
      <Card variant="feature" padding="lg" className="overflow-hidden">
        <div className="grid gap-7 lg:grid-cols-[1fr_.95fr] lg:items-center">
          <div>
            <Badge tone="blush">Phase 2 · Inspiration</Badge>
            <h2 className="mt-4 font-display text-3xl text-ink-900 sm:text-4xl">Build an event from what inspires you.</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-600 sm:text-base">
              Add a photo, tell Fleora which details you want to recreate, and turn the look into an organized vendor plan for {eventName}.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-ink-600">
              {eventStyle && <Badge tone="plum">{eventStyle}</Badge>}
              {colorPalette && <Badge tone="champagne">{colorPalette}</Badge>}
            </div>
          </div>
          <div className="rounded-[24px] border border-plum-100 bg-gradient-to-br from-blush-50 via-white to-plum-50 p-5 shadow-fleora">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-plum-600 shadow-sm"><SparkleIcon /></span><div><p className="font-bold text-ink-900">Build This Look</p><p className="text-xs text-ink-500">Photo-to-plan experience</p></div></div>
            <p className="mt-4 text-sm leading-relaxed text-ink-600">The interface is live now. Automatic computer-vision detection will plug into this same flow in the AI integration step.</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-7 lg:grid-cols-[.85fr_1.15fr]">
        <Card padding="lg">
          <p className="fleora-kicker">Add inspiration</p>
          <h3 className="mt-1 font-display text-2xl text-ink-900">Save a look you love</h3>
          <div className="mt-5 space-y-4">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give this look a name" />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What do you love about it?" className="min-h-24 w-full rounded-xl border border-[#E9E3E7] bg-white px-4 py-3 text-sm text-ink-900 shadow-sm placeholder:text-ink-400 focus:border-plum-300 focus:outline-none focus:ring-4 focus:ring-plum-50" />
            <div>
              <p className="mb-2 text-sm font-semibold text-ink-900">What should Fleora help recreate?</p>
              <div className="flex flex-wrap gap-2">
                {ELEMENTS.map((tag) => <button key={tag} type="button" onClick={() => toggle(tag)} className={`fleora-chip ${selected.includes(tag) ? "fleora-chip-active" : ""}`}>{tag}</button>)}
              </div>
            </div>
            <label className="block cursor-pointer rounded-[18px] border-2 border-dashed border-plum-200 bg-plum-50/60 p-6 text-center transition hover:border-plum-300 hover:bg-plum-50">
              <span className="text-2xl">＋</span>
              <span className="mt-1 block text-sm font-bold text-plum-700">Choose inspiration photo</span>
              <span className="mt-1 block text-xs text-ink-500">JPG, PNG or WEBP · under 2.5 MB for this preview</span>
              <input ref={inputRef} onChange={upload} type="file" accept="image/*" className="sr-only" />
            </label>
            {notice && <p className="text-xs font-medium text-plum-700">{notice}</p>}
          </div>
        </Card>

        <Card padding="lg" variant="soft">
          <p className="fleora-kicker">Build This Look</p>
          <h3 className="mt-1 font-display text-2xl text-ink-900">Your vendor-ready plan</h3>
          {active ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-[180px_1fr]">
              <img src={active.image} alt={active.title} className="h-44 w-full rounded-2xl object-cover shadow-fleora" />
              <div>
                <p className="font-bold text-ink-900">{active.title}</p>
                {active.note && <p className="mt-1 text-sm text-ink-600">{active.note}</p>}
                <div className="mt-4 space-y-2">
                  {plan.map((part) => <div key={part.name} className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 text-sm shadow-sm"><span className="font-semibold text-ink-800">✓ {part.name}</span><span className="text-xs text-plum-600">{part.priority}</span></div>)}
                </div>
                <a href={`/events/${eventId}/services`} className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-plum-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-plum-600">Find vendors for this look →</a>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-[20px] border border-dashed border-plum-200 bg-white/80 p-8 text-center"><SparkleIcon className="mx-auto text-plum-500" /><p className="mt-3 font-display text-xl text-ink-900">Your look will appear here.</p><p className="mt-1 text-sm text-ink-500">Upload an inspiration photo to create the first plan.</p></div>
          )}
        </Card>
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3"><div><p className="fleora-kicker">Your board</p><h2 className="font-display text-2xl text-ink-900">Saved inspiration</h2></div><Badge tone="plum">{items.length} saved</Badge></div>
        {items.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <Card key={item.id} variant="interactive" padding="none" className="overflow-hidden"><button type="button" onClick={() => setActive(item)} className="block w-full text-left"><img src={item.image} alt={item.title} className="h-52 w-full object-cover" /><div className="p-4"><p className="font-bold text-ink-900">{item.title}</p><p className="mt-1 line-clamp-2 text-xs text-ink-500">{item.note || item.tags.join(" · ")}</p></div></button><div className="flex items-center justify-between border-t fleora-divider px-4 py-3"><span className="text-xs font-semibold text-plum-600">{item.tags.length} elements</span><button type="button" onClick={() => remove(item.id)} className="text-xs font-semibold text-ink-400 hover:text-rose-600">Remove</button></div></Card>)}</div> : <Card className="text-center"><p className="font-display text-xl text-ink-900">No inspiration saved yet.</p><p className="mt-1 text-sm text-ink-500">Your event mood board starts with one photo.</p></Card>}
      </section>
    </div>
  );
}
