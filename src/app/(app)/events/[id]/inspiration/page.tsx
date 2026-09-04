import { notFound } from "next/navigation";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { InspirationBoard } from "@/components/event/inspiration-board";

export default async function InspirationPage({ params }: { params: { id: string } }) {
  await requireProfile();
  const supabase = createClient();
  const { data: event } = await supabase.from("events").select("id,name,style,color_palette").eq("id", params.id).single();
  if (!event) notFound();
  const { data: savedPhotos } = await supabase.from("event_inspiration_photos").select("id,url,sort,created_at").eq("event_id", event.id).order("sort");

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="fleora-kicker mb-2">{event.name}</p><h1 className="font-display text-4xl text-ink-900 sm:text-5xl">Inspiration Board</h1><p className="mt-2 text-sm text-ink-600">Collect your ideas and turn them into an actionable event plan.</p></div>
        <Link href={`/events/${event.id}`} className="text-sm font-bold text-plum-700 hover:underline">← Back to event</Link>
      </div>
      <InspirationBoard eventId={event.id} eventName={event.name} eventStyle={event.style} colorPalette={event.color_palette} initialPhotos={savedPhotos ?? []} />
    </div>
  );
}
