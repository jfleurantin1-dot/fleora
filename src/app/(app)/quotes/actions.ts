"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function loadQuoteForClient(quoteId: string) {
  const supabase = createClient();
  // RLS restricts this to a quote on an event the caller owns (or is the vendor for).
  const { data: quote } = await supabase.from("quotes").select("*").eq("id", quoteId).single();
  return { supabase, quote };
}

export async function acceptQuote(quoteId: string) {
  const { supabase, quote } = await loadQuoteForClient(quoteId);
  if (!quote) return;

  // Mark this quote accepted, competing quotes in the same category declined.
  await supabase.from("quotes").update({ status: "accepted" }).eq("id", quote.id);
  await supabase
    .from("quotes")
    .update({ status: "declined" })
    .eq("event_id", quote.event_id)
    .eq("category", quote.category)
    .neq("id", quote.id)
    .eq("status", "sent");

  // Create the booking (idempotent-ish: quote_id is unique on bookings).
  const { error: bookingError } = await supabase.from("bookings").insert({
    event_id: quote.event_id,
    vendor_id: quote.vendor_id,
    quote_id: quote.id,
    category: quote.category,
    status: "pending_deposit",
    total: quote.total,
    deposit_paid: 0,
    balance: quote.total,
  });
  if (bookingError && !bookingError.message.includes("duplicate")) {
    console.error("acceptQuote booking insert failed:", bookingError.message);
    return;
  }

  await supabase
    .from("event_requests")
    .update({ status: "booked" })
    .eq("event_id", quote.event_id)
    .eq("category", quote.category);

  revalidatePath(`/events/${quote.event_id}`);
  redirect(`/events/${quote.event_id}?booked=${quote.category}`);
}

export async function declineQuote(quoteId: string) {
  const { supabase, quote } = await loadQuoteForClient(quoteId);
  if (!quote) return;
  await supabase.from("quotes").update({ status: "declined" }).eq("id", quote.id);
  revalidatePath(`/events/${quote.event_id}`);
  redirect(`/events/${quote.event_id}`);
}
