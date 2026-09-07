"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const REASONS=new Set(["plans_changed","found_another_vendor","no_longer_needed","timing_changed","other"]);
export async function cancelRequest(conversationId:string, formData:FormData){
 const s=createClient(); const {data:{user}}=await s.auth.getUser(); if(!user) redirect("/login");
 const {data:convo}=await s.from("conversations").select("*").eq("id",conversationId).single(); if(!convo||convo.client_id!==user.id) return;
 const {data:booking}=await s.from("bookings").select("id").eq("event_id",convo.event_id).eq("vendor_id",convo.vendor_id).neq("status","cancelled").maybeSingle(); if(booking) return;
 const {data:sentQuote}=await s.from("quotes").select("id,status").eq("event_id",convo.event_id).eq("vendor_id",convo.vendor_id).eq("status","sent").order("created_at",{ascending:false}).limit(1).maybeSingle(); if(sentQuote) redirect(`/quotes/${sentQuote.id}`);
 const raw=String(formData.get("reason")??""); const reason=REASONS.has(raw)?raw:"other"; const note=String(formData.get("note")??"").trim();
 await (s.from("conversations") as any).update({client_inquiry_status:"cancelled",client_cancel_reason:reason,client_cancel_note:note||null,client_cancelled_at:new Date().toISOString()}).eq("id",conversationId);
 const category=String((convo as any).inquiry_category??"");
 if(category){
  const {data:others}=await s.from("conversations").select("id,vendor_inquiry_status,client_inquiry_status,inquiry_category").eq("event_id",convo.event_id).neq("id",conversationId);
  const active=(others??[]).some((c:any)=>c.inquiry_category===category&&c.client_inquiry_status!=="cancelled"&&c.vendor_inquiry_status!=="declined");
  if(!active){await s.from("event_requests").update({status:"closed"}).eq("event_id",convo.event_id).eq("category",category);await s.from("event_vendor_needs").update({status:"searching"}).eq("event_id",convo.event_id).eq("category",category);}
 }
 revalidatePath(`/messages/${conversationId}`); revalidatePath(`/vendor/inquiries/${conversationId}`); revalidatePath(`/events/${convo.event_id}/vendors`); redirect(`/messages/${conversationId}?cancelled=1`);
}
