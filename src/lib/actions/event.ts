"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleChecklistItem(eventId: string, itemId: string, done: boolean) {
  const supabase = createClient();
  await supabase.from("checklist_items").update({ done }).eq("id", itemId);
  revalidatePath(`/events/${eventId}`);
}

export async function addGuest(eventId: string, formData: FormData) {
  const supabase = createClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await supabase.from("guests").insert({
    event_id: eventId,
    name,
    email: String(formData.get("email") ?? "").trim() || null,
    party_size: Number(formData.get("party_size")) || 1,
  });
  revalidatePath(`/events/${eventId}`);
}

export async function setGuestRsvp(
  eventId: string,
  guestId: string,
  rsvp: "pending" | "yes" | "no",
) {
  const supabase = createClient();
  await supabase.from("guests").update({ rsvp }).eq("id", guestId);
  revalidatePath(`/events/${eventId}`);
}

export async function removeGuest(eventId: string, guestId: string) {
  const supabase = createClient();
  await supabase.from("guests").delete().eq("id", guestId);
  revalidatePath(`/events/${eventId}`);
}
