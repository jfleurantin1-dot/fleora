"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { categoryLabel, EVENT_TYPE_MAP } from "@/lib/constants";
import { money, shortDate } from "@/lib/format";

async function sendInquiry(eventId:string, category:string, vendorId:string, personalMessage?:string){
  const supabase=createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");
  const {data:event}=await supabase.from("events").select("*").eq("id",eventId).single();
  if(!event) return null;
  const {data:need}=await supabase.from("event_vendor_needs").select("notes").eq("event_id",eventId).eq("category",category).maybeSingle();
  const {data:existing}=await supabase.from("conversations").select("id").eq("event_id",eventId).eq("vendor_id",vendorId).maybeSingle();
  let conversationId=existing?.id as string|undefined;
  if(!conversationId){
    const {data:created,error}=await supabase.from("conversations").insert({event_id:eventId,client_id:user.id,vendor_id:vendorId}).select("id").single();
    if(error||!created){console.error("sendInquiry: conversation insert failed:",error?.message);return null;}
    conversationId=created.id;
  }
  const eventType=EVENT_TYPE_MAP[String(event.event_type)]?.label??String(event.event_type??"Event");
  const editable=personalMessage?.trim()||`Hi! I’d love to get a quote for ${categoryLabel(category)} for my event.`;
  const lines=[
    editable,
    "\nInquiry summary:",
    `Event type: ${eventType}`,
    `Date: ${shortDate(event.event_date)}`,
    `Location: ${event.location??"TBD"}`,
    `Guests: ${event.guest_count??"TBD"}`,
    `Overall budget: ${money(event.budget)}`,
    event.style?`Style: ${event.style}`:"",
    event.color_palette?`Colors: ${event.color_palette}`:"",
    need?.notes?`Planning notes: ${need.notes}`:"",
  ].filter(Boolean).join("\n");
  if(!existing) await supabase.from("messages").insert({conversation_id:conversationId,sender_id:user.id,body:lines});
  await supabase.from("event_requests").upsert({event_id:eventId,category,notes:need?.notes??null,status:"open"},{onConflict:"event_id,category"});
  await supabase.from("event_vendor_needs").update({status:"inquired"}).eq("event_id",eventId).eq("category",category);
  return conversationId;
}

export async function requestQuote(eventId:string,category:string,vendorId:string,formData?:FormData){
  const message=formData?String(formData.get("message")??"").trim():undefined;
  const conversationId=await sendInquiry(eventId,category,vendorId,message);
  revalidatePath(`/events/${eventId}`);revalidatePath(`/events/${eventId}/vendors`);
  if(conversationId) redirect(`/messages/${conversationId}`);
}

export async function requestQuotes(eventId:string,category:string,formData:FormData){
  const ids=formData.getAll("vendor_ids").map(String).filter(Boolean);
  const unique=[...new Set(ids)].slice(0,5);
  if(unique.length<1) redirect(`/events/${eventId}/matches/${category}?error=select`);
  const note=String(formData.get("message")??"").trim();
  for(const vendorId of unique) await sendInquiry(eventId,category,vendorId,note);
  revalidatePath(`/events/${eventId}`);revalidatePath(`/events/${eventId}/vendors`);revalidatePath(`/events/${eventId}/matches/${category}`);
  redirect(`/events/${eventId}/vendors?sent=${unique.length}`);
}
