"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { categoryLabel } from "@/lib/constants";

async function sendInquiry(eventId:string, category:string, vendorId:string, personalMessage?:string){
  const supabase=createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");
  const {data:event}=await supabase.from("events").select("id").eq("id",eventId).single();
  if(!event) return null;
  const {data:need}=await supabase.from("event_vendor_needs").select("notes").eq("event_id",eventId).eq("category",category).maybeSingle();
  const {data:existing}=await supabase.from("conversations").select("id").eq("event_id",eventId).eq("vendor_id",vendorId).maybeSingle();
  let conversationId=existing?.id as string|undefined;
  if(!conversationId){
    const {data:created,error}=await (supabase.from("conversations") as any).insert({event_id:eventId,client_id:user.id,vendor_id:vendorId,inquiry_category:category,client_inquiry_status:"active"}).select("id").single();
    if(error||!created){console.error("sendInquiry: conversation insert failed:",error?.message);return null;}
    conversationId=created.id;
  }else{
    await (supabase.from("conversations") as any).update({inquiry_category:category,client_inquiry_status:"active",client_cancel_reason:null,client_cancel_note:null,client_cancelled_at:null}).eq("id",conversationId);
  }
  const editable=personalMessage?.trim()||`Hi! I’d love to get a quote for ${categoryLabel(category)}. Please let me know if you’re available and if you need any additional information from me. Thank you!`;
  if(!existing) await supabase.from("messages").insert({conversation_id:conversationId,sender_id:user.id,body:editable});
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
