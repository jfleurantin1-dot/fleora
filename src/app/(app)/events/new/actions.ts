"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { geocodeMa } from "@/lib/geo";

export type NewEventState = { error?: string };

export async function createEvent(_prev: NewEventState, formData: FormData): Promise<NewEventState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const eventType = String(formData.get("event_type") ?? "custom");
  const eventDate = String(formData.get("event_date") ?? "") || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const guestCount = Number(formData.get("guest_count")) || null;
  const budget = Number(formData.get("budget")) || null;
  const style = String(formData.get("style") ?? "").trim() || null;
  const palette = String(formData.get("color_palette") ?? "").trim() || null;

  if (!name) return { error: "Give your event a name." };

  const coords = location ? geocodeMa(location) : null;

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      client_id: user.id,
      name,
      event_type: eventType,
      event_date: eventDate,
      location,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      guest_count: guestCount,
      budget,
      style,
      color_palette: palette,
    })
    .select("id")
    .single();

  if (error || !event) return { error: error?.message ?? "Could not create the event." };

  await supabase.rpc("seed_event_checklist", { p_event_id: event.id });

  const photos = formData.getAll("inspiration_photos").filter((value): value is File => value instanceof File && value.size > 0).slice(0, 6);
  for (let i = 0; i < photos.length; i++) {
    const file = photos[i];
    if (!file.type.startsWith("image/") || file.size > 10_000_000) continue;
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${event.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("event-inspiration").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) continue;
    const { data: publicUrl } = supabase.storage.from("event-inspiration").getPublicUrl(path);
    await supabase.from("event_inspiration_photos").insert({ event_id: event.id, url: publicUrl.publicUrl, sort: i });
  }

  revalidatePath("/dashboard");
  redirect(`/events/${event.id}/services`);
}
