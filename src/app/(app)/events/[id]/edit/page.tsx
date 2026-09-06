import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button, Card, Input, Select } from "@/components/ui";
import { EVENT_TYPES, STYLE_OPTIONS } from "@/lib/constants";
import { MoodPhotoManager } from "@/components/event/mood-photo-manager";
import { updateEvent } from "./actions";

export default async function EditEvent({ params, searchParams }: { params: { id: string }; searchParams?: { saved?: string } }) {
  await requireProfile();
  const s = createClient();
  const [{ data: e }, { data: photos }] = await Promise.all([
    s.from("events").select("*").eq("id", params.id).single(),
    s.from("event_inspiration_photos").select("id,url,sort").eq("event_id", params.id).order("sort"),
  ]);
  if (!e) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="fleora-kicker">Chapter 1 · Event Details & Vision</p>
        <h1 className="mt-1 font-display text-4xl text-ink-900">Set the foundation for your event.</h1>
        <p className="mt-2 text-sm text-ink-600">Confirm the essentials, then shape the theme, colors and overall visual direction.</p>
      </div>

      {searchParams?.saved === "1" && <Card className="border-sage-200 bg-sage-50/70"><p className="text-sm font-semibold text-ink-900">Event details saved ✓</p></Card>}

      <Card padding="lg" className="space-y-6">
        <MoodPhotoManager eventId={e.id} photos={photos ?? []} />

        <div className="h-px bg-plum-50" />

        <form action={updateEvent.bind(null, e.id)} className="space-y-5">
          <label className="block text-sm font-semibold">Event name<Input name="name" defaultValue={e.name} className="mt-1" required /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">Event type<Select name="event_type" defaultValue={e.event_type} className="mt-1">{EVENT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</Select></label>
            <label className="block text-sm font-semibold">Date<Input name="event_date" type="date" defaultValue={e.event_date ?? ""} className="mt-1" /></label>
            <label className="block text-sm font-semibold">Location<Input name="location" defaultValue={e.location ?? ""} placeholder="City, State" className="mt-1" /></label>
            <label className="block text-sm font-semibold">Guest count<Input name="guest_count" type="number" min={1} defaultValue={e.guest_count ?? ""} className="mt-1" /></label>
            <label className="block text-sm font-semibold">Budget<Input name="budget" type="number" min={0} defaultValue={e.budget ?? ""} className="mt-1" /></label>
            <label className="block text-sm font-semibold">Style<Select name="style" defaultValue={e.style ?? STYLE_OPTIONS[0]} className="mt-1">{STYLE_OPTIONS.map((x) => <option key={x}>{x}</option>)}</Select></label>
          </div>
          <label className="block text-sm font-semibold">Color palette<Input name="color_palette" defaultValue={e.color_palette ?? ""} className="mt-1" /></label>
          <div className="flex flex-wrap justify-end gap-2"><Button type="submit" name="intent" value="save" variant="secondary" size="lg">Save & stay</Button><Button type="submit" name="intent" value="continue" size="lg">Save & continue to Decor →</Button></div>
        </form>
      </Card>
    </div>
  );
}
