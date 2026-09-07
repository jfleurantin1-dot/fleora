"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function loadQuoteForClient(quoteId: string) {
  const supabase = createClient();
  const { data: quote } = await supabase.from("quotes").select("*").eq("id", quoteId).single();
  return { supabase, quote };
}

export async function acceptQuote(quoteId: string) {
  const { supabase, quote } = await loadQuoteForClient(quoteId);
  if (!quote) return;
  await supabase.from("quotes").update({ status: "accepted" }).eq("id", quote.id);
  await supabase.from("quotes").update({ status: "declined" }).eq("event_id", quote.event_id).eq("category", quote.category).neq("id", quote.id).eq("status", "sent");
  const { error: bookingError } = await supabase.from("bookings").insert({event_id: quote.event_id,vendor_id: quote.vendor_id,quote_id: quote.id,category: quote.category,status: "pending_deposit",total: quote.total,deposit_paid: 0,balance: quote.total});
  if (bookingError && !bookingError.message.includes("duplicate")) {console.error("acceptQuote booking insert failed:", bookingError.message);return;}
  await supabase.from("event_requests").update({ status: "booked" }).eq("event_id", quote.event_id).eq("category", quote.category);
  revalidatePath(`/events/${quote.event_id}`); redirect(`/quotes/${quote.id}?accepted=1`);
}

const DECLINE_REASONS=new Set(["budget","another_vendor","plans_changed","no_longer_needed","not_a_fit","other"]);
export async function declineQuote(quoteId: string, formData:FormData) {
  const { supabase, quote } = await loadQuoteForClient(quoteId);
  if (!quote) return;
  const raw=String(formData.get("reason")??""); const reason=DECLINE_REASONS.has(raw)?raw:"other"; const note=String(formData.get("note")??"").trim();
  await (supabase.from("quotes") as any).update({ status: "declined", client_decline_reason:reason, client_decline_note:note||null, client_declined_at:new Date().toISOString() }).eq("id", quote.id);
  revalidatePath(`/events/${quote.event_id}`); revalidatePath(`/quotes/${quote.id}`); redirect(`/quotes/${quote.id}?declined=1`);
}
