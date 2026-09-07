"use server";
import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const reasons = new Set(["not_available","already_booked","outside_service_area","service_not_offered","budget_not_fit","other"]);
export async function declineInquiry(formData: FormData) {
  const { vendor } = await requireVendor();
  if (!vendor) redirect("/vendor/onboarding");
  const conversationId = String(formData.get("conversation_id") || "");
  const reason = String(formData.get("reason") || "");
  const note = String(formData.get("note") || "").trim().slice(0,1000);
  if (!conversationId || !reasons.has(reason)) redirect(`/vendor/inquiries/${conversationId}?error=reason`);
  const supabase = createClient();
  const { data: convo } = await supabase.from("conversations").select("id,vendor_id").eq("id", conversationId).single();
  if (!convo || convo.vendor_id !== vendor.id) redirect("/vendor/leads");
  const { error } = await (supabase.from("conversations") as any).update({vendor_inquiry_status:"declined",vendor_decline_reason:reason,vendor_decline_note:note||null,vendor_declined_at:new Date().toISOString()}).eq("id",conversationId);
  if (error) redirect(`/vendor/inquiries/${conversationId}?error=save`);
  redirect(`/vendor/inquiries/${conversationId}?declined=1`);
}
