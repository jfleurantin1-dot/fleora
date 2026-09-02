"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { categoryLabel } from "@/lib/constants";
import { money, shortDate } from "@/lib/format";

export async function requestQuote(eventId: string, category: string, vendorId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: event } = await supabase.from("events").select("*").eq("id", eventId).single();
  if (!event) return;

  // Find or create the conversation for this (event, vendor).
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("event_id", eventId)
    .eq("vendor_id", vendorId)
    .maybeSingle();

  let conversationId = existing?.id;
  if (!conversationId) {
    const { data: created, error } = await supabase
      .from("conversations")
      .insert({ event_id: eventId, client_id: user.id, vendor_id: vendorId })
      .select("id")
      .single();
    if (error || !created) {
      console.error("requestQuote: conversation insert failed:", error?.message);
      return;
    }
    conversationId = created.id;

    const brief = [
      `Hi! I'd love a quote for ${categoryLabel(category)}.`,
      "",
      `Event: ${event.name}`,
      `Date: ${shortDate(event.event_date)}`,
      `Location: ${event.location ?? "TBD"}`,
      `Guests: ${event.guest_count ?? "TBD"}`,
      `Budget (overall): ${money(event.budget)}`,
      event.style ? `Style: ${event.style}` : "",
      event.color_palette ? `Colors: ${event.color_palette}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: brief,
    });
  }

  revalidatePath(`/events/${eventId}`);
  redirect(`/messages/${conversationId}`);
}
