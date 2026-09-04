"use client";

import { ChangeEvent, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createEvent, type NewEventState } from "./actions";
import { Button, Card, FormError, Input } from "@/components/ui";
import { ArrowLeftIcon, SparkleIcon } from "@/components/icons";
import { FlowerMark } from "@/components/brand-logo";
import { EVENT_TYPES, STYLE_OPTIONS } from "@/lib/constants";



function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
      {pending ? "Creating your plan…" : "Create my event plan"}
    </Button>
  );
}

export default function NewEventPage() {
  const [state, formAction] = useFormState<NewEventState, FormData>(createEvent, {});
  const [step, setStep] = useState(1);
  const [eventType, setEventType] = useState("birthday");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [budget, setBudget] = useState("");
  const [style, setStyle] = useState(STYLE_OPTIONS[0]);
  const [customPalette, setCustomPalette] = useState("");
  const [inspoPreviews, setInspoPreviews] = useState<string[]>([]);

  const canContinueDetails = name.trim().length > 0;
  const finalPalette = customPalette.trim();

  function previewInspo(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 6);
    setInspoPreviews(files.map((file) => URL.createObjectURL(file)));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => step > 1 && setStep((s) => s - 1)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E9E3E7] bg-white text-ink-600 shadow-sm transition hover:text-plum-700 ${step === 1 ? "invisible" : ""}`}
            aria-label="Go back"
          >
            <ArrowLeftIcon size={18} />
          </button>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((n) => (
              <span key={n} className={`h-1.5 rounded-full transition-all ${n <= step ? "w-10 bg-plum-500" : "w-6 bg-plum-100"}`} />
            ))}
          </div>
          <span className="w-10 text-right text-xs font-semibold text-ink-400">{step}/3</span>
        </div>

        <p className="fleora-kicker mb-2">Plan with Fleora</p>
        <h1 className="font-display text-4xl leading-tight text-ink-900 sm:text-5xl">
          {step === 1 && "What are you celebrating?"}
          {step === 2 && "Tell us about your event."}
          {step === 3 && "What’s your vision?"}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-600 sm:text-base">
          {step === 1 && "Choose the type of celebration. We’ll use it to shape your starting plan."}
          {step === 2 && "Just the essentials for now — you can change everything later."}
          {step === 3 && "Choose the style and colors that feel most like your event."}
        </p>
      </div>

      <form action={formAction}>
        <input type="hidden" name="event_type" value={eventType} />
        <input type="hidden" name="name" value={name} />
        <input type="hidden" name="event_date" value={date} />
        <input type="hidden" name="location" value={location} />
        <input type="hidden" name="guest_count" value={guestCount} />
        <input type="hidden" name="budget" value={budget} />
        <input type="hidden" name="style" value={style} />
        <input type="hidden" name="color_palette" value={finalPalette} />

        <Card variant="feature" padding="lg" className="overflow-hidden">
          {step === 1 && (
            <div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {EVENT_TYPES.map((t) => {
                  const active = eventType === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setEventType(t.key)}
                      className={`group min-h-[112px] rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-plum-400 bg-plum-50 shadow-sm ring-2 ring-plum-100"
                          : "border-[#E9E3E7] bg-white hover:-translate-y-0.5 hover:border-plum-200 hover:shadow-fleora"
                      }`}
                    >
                      <span className={`grid h-10 w-10 place-items-center rounded-full ${active ? "bg-white text-plum-500" : "bg-plum-50 text-plum-400"}`}><FlowerMark className="h-5 w-5" /></span>
                      <span className={`mt-3 block text-sm font-bold ${active ? "text-plum-700" : "text-ink-900"}`}>{t.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-7 flex justify-end">
                <Button type="button" size="lg" onClick={() => setStep(2)}>Continue →</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-ink-900">Event name</span>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jerrica's 36th Birthday" autoFocus />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-ink-900">Date</span>
                  <Input value={date} onChange={(e) => setDate(e.target.value)} type="date" />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-ink-900">Location</span>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" />
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-ink-900">Guest count</span>
                  <Input value={guestCount} onChange={(e) => setGuestCount(e.target.value)} type="number" min={1} placeholder="50" />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-ink-900">Estimated budget</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink-400">$</span>
                    <Input value={budget} onChange={(e) => setBudget(e.target.value)} type="number" min={0} step={50} placeholder="3000" className="pl-8" />
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button type="button" size="lg" disabled={!canContinueDetails} onClick={() => setStep(3)}>Continue →</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-7">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <SparkleIcon size={18} className="text-plum-600" />
                  <h2 className="text-sm font-bold text-ink-900">Choose your style</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STYLE_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStyle(s)}
                      className={`fleora-chip capitalize ${style === s ? "fleora-chip-active" : ""}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-sm font-bold text-ink-900">Describe your color palette</h2>
                <Input value={customPalette} onChange={(e) => setCustomPalette(e.target.value)} placeholder="Butter yellow, blush pink, ivory and gold…" />
              </div>

              <div>
                <h2 className="mb-1 text-sm font-bold text-ink-900">Add inspiration photos <span className="font-normal text-ink-400">(optional)</span></h2>
                <p className="mb-3 text-xs text-ink-500">Upload up to 6 photos. They&apos;ll be waiting for you on this event&apos;s Inspiration Board.</p>
                <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-plum-200 bg-plum-50/50 p-5 text-center transition hover:border-plum-300 hover:bg-plum-50">
                  <span className="text-xl">＋</span><span className="ml-2 text-sm font-bold text-plum-700">Choose inspiration photos</span>
                  <input name="inspiration_photos" onChange={previewInspo} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" />
                </label>
                {inspoPreviews.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">{inspoPreviews.map((src, i) => <img key={src} src={src} alt={`Inspiration ${i + 1}`} className="aspect-square w-full rounded-xl object-cover" />)}</div>}
                <p className="mt-2 text-xs text-ink-400">JPG, PNG, WEBP or GIF · max 10 MB each</p>
              </div>

              <FormError message={state.error} />
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <Button type="button" variant="ghost" onClick={() => setStep(2)}>Back</Button>
                <Submit />
              </div>
            </div>
          )}
        </Card>
      </form>
    </div>
  );
}
