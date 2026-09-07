"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { geocodeMa } from "@/lib/geo";

export async function updateEvent(eventId: string, fd: FormData) {
  const s = createClient();
  const location = String(fd.get("location") ?? "").trim() || null;
  const coords = location ? geocodeMa(location) : null;
  const locationType = String(fd.get("location_type") ?? "tbd");
  const needsVenue = fd.get("needs_venue") === "on";

  await (s.from("events") as any)
    .update({
      name: String(fd.get("name") ?? "").trim(),
      event_type: String(fd.get("event_type") ?? "custom"),
      event_date: String(fd.get("event_date") ?? "") || null,
      event_start_time: String(fd.get("event_start_time") ?? "") || null,
      event_end_time: String(fd.get("event_end_time") ?? "") || null,
      location,
      location_type: locationType,
      needs_venue: needsVenue,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      guest_count: Number(fd.get("guest_count")) || null,
      budget: Number(fd.get("budget")) || null,
      style: String(fd.get("style") ?? "") || null,
      color_palette: String(fd.get("color_palette") ?? "") || null,
    })
    .eq("id", eventId);

  const { data: venueItem } = await s.from("event_plan_items").upsert({ event_id: eventId, chapter: "venue_logistics", item_key: "venue", label: "Venue", choice: needsVenue ? "hire" : "diy", vendor_category: "venue", notes: locationType === "tbd" ? "Location TBD" : null, updated_at: new Date().toISOString() }, { onConflict: "event_id,chapter,item_key" }).select("id").single();
  if (venueItem) {
    if (needsVenue) await s.from("event_vendor_needs").upsert({ event_id: eventId, plan_item_id: venueItem.id, category: "venue", label: "Venue", status: "needed", notes: locationType === "tbd" ? "Location TBD" : null, updated_at: new Date().toISOString() }, { onConflict: "plan_item_id" });
    else await s.from("event_vendor_needs").delete().eq("plan_item_id", venueItem.id).eq("status", "needed");
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  const intent = String(fd.get("intent") ?? "save");
  if (intent === "continue") redirect(`/events/${eventId}/plan/decor`);
  redirect(`/events/${eventId}/edit?saved=1`);
}

export async function uploadMoodPhotos(eventId: string, fd: FormData): Promise<{ error?: string }> {
  const s = createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return { error: "Please sign in again before uploading." };

  const files = fd
    .getAll("mood_photos")
    .filter((value): value is File => value instanceof File && value.size > 0)
    .slice(0, 6);

  if (!files.length) return {};

  const { data: existing } = await s
    .from("event_inspiration_photos")
    .select("sort")
    .eq("event_id", eventId)
    .order("sort", { ascending: false })
    .limit(1);

  let sort = (existing?.[0]?.sort ?? -1) + 1;

  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    if (file.size > 10_000_000) return { error: `${file.name} is larger than 10 MB.` };

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${eventId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await s.storage
      .from("event-inspiration")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) return { error: uploadError.message };

    const { data: publicUrl } = s.storage.from("event-inspiration").getPublicUrl(path);
    const { error: insertError } = await s
      .from("event_inspiration_photos")
      .insert({ event_id: eventId, url: publicUrl.publicUrl, sort: sort++ });

    if (insertError) return { error: insertError.message };
  }

  revalidatePath(`/events/${eventId}/edit`);
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath("/dashboard");
  return {};
}

export async function removeMoodPhoto(eventId: string, photoId: string) {
  const s = createClient();
  await s.from("event_inspiration_photos").delete().eq("id", photoId).eq("event_id", eventId);
  revalidatePath(`/events/${eventId}/edit`);
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath("/dashboard");
}

export async function reorderMoodPhotos(eventId: string, photoIds: string[]) {
  const s = createClient();
  for (let i = 0; i < photoIds.length; i++) {
    await s.from("event_inspiration_photos").update({ sort: i }).eq("id", photoIds[i]).eq("event_id", eventId);
  }
  revalidatePath(`/events/${eventId}/edit`);
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath("/dashboard");
}
