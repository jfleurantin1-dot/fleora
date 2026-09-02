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

  revalidatePath("/dashboard");
  redirect(`/events/${event.id}/services`);
}
