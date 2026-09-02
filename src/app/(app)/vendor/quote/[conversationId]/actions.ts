"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { categoryLabel } from "@/lib/constants";
import { money } from "@/lib/format";

export type SendQuoteState = { error?: string };

export async function sendQuote(
  conversationId: string,
  _prev: SendQuoteState,
  formData: FormData,
): Promise<SendQuoteState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: convo } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single();
  if (!convo) return { error: "Conversation not found." };

  const category = String(formData.get("category") ?? "").trim();
  if (!category) return { error: "Pick which service this quote covers." };

  const items: { label: string; amount: number; sort: number }[] = [];
  for (let i = 0; i < 8; i++) {
    const label = String(formData.get(`label_${i}`) ?? "").trim();
    const amount = Number(formData.get(`amount_${i}`)) || 0;
    if (label && amount > 0) items.push({ label, amount, sort: i });
  }
  if (items.length === 0) return { error: "Add at least one line item." };

  const subtotal = items.reduce((s, it) => s + it.amount, 0);
  const deposit = Number(formData.get("deposit")) || Math.round(subtotal * 0.3);
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const expiresAt = String(formData.get("expires_at") ?? "") || null;

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      event_id: convo.event_id,
      vendor_id: convo.vendor_id,
      category,
      status: "sent",
      subtotal,
      deposit,
      total: subtotal,
      notes,
      expires_at: expiresAt,
    })
    .select("id")
    .single();
  if (error || !quote) return { error: error?.message ?? "Could not create the quote." };

  await supabase
    .from("quote_items")
    .insert(items.map((it) => ({ quote_id: quote.id, label: it.label, amount: it.amount, sort: it.sort })));

  await supabase
    .from("event_requests")
    .update({ status: "quoted" })
    .eq("event_id", convo.event_id)
    .eq("category", category)
    .eq("status", "open");

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: `📄 Sent a quote for ${categoryLabel(category)} — ${money(subtotal)} total, ${money(
      deposit,
    )} deposit to book. Open it in the app to accept.`,
  });

  revalidatePath(`/messages/${conversationId}`);
  redirect(`/messages/${conversationId}`);
}
