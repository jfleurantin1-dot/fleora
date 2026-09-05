"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleChecklistItem(eventId:string,itemId:string,done:boolean){const s=createClient();await s.from("checklist_items").update({done}).eq("id",itemId);revalidatePath(`/events/${eventId}`)}
export async function addChecklistItem(eventId:string,formData:FormData){const s=createClient();const title=String(formData.get("title")??"").trim();if(!title)return;const {data:rows}=await s.from("checklist_items").select("sort").eq("event_id",eventId).order("sort",{ascending:false}).limit(1);await s.from("checklist_items").insert({event_id:eventId,title,sort:(rows?.[0]?.sort??0)+1});revalidatePath(`/events/${eventId}`)}
export async function removeChecklistItem(eventId:string,itemId:string){const s=createClient();await s.from("checklist_items").delete().eq("id",itemId);revalidatePath(`/events/${eventId}`)}

export async function addGuest(eventId:string,formData:FormData){const s=createClient();const name=String(formData.get("name")??"").trim();if(!name)return;await s.from("guests").insert({event_id:eventId,name,email:String(formData.get("email")??"").trim()||null,phone:String(formData.get("phone")??"").trim()||null,party_size:Number(formData.get("party_size"))||1});revalidatePath(`/events/${eventId}`)}
export async function setGuestRsvp(eventId:string,guestId:string,rsvp:"pending"|"yes"|"no"){const s=createClient();await s.from("guests").update({rsvp,rsvp_responded_at:rsvp==="pending"?null:new Date().toISOString()}).eq("id",guestId);revalidatePath(`/events/${eventId}`)}
export async function removeGuest(eventId:string,guestId:string){const s=createClient();await s.from("guests").delete().eq("id",guestId);revalidatePath(`/events/${eventId}`)}

async function eventClosureContext(eventId:string){
  const s=createClient();
  const [{data:event},{data:pendingQuotes},{data:conversations},{data:bookings}] = await Promise.all([
    s.from("events").select("name").eq("id",eventId).single(),
    s.from("quotes").select("vendor_id,status").eq("event_id",eventId).eq("status","sent"),
    s.from("conversations").select("vendor_id").eq("event_id",eventId),
    s.from("bookings").select("vendor_id,status").eq("event_id",eventId).neq("status","cancelled"),
  ]);
  const bookedVendorIds=new Set((bookings??[]).map(b=>b.vendor_id));
  const outstandingVendorIds=[...new Set([
    ...(pendingQuotes??[]).map(q=>q.vendor_id),
    ...(conversations??[]).map(c=>c.vendor_id).filter(id=>!bookedVendorIds.has(id)),
  ])];
  return {s,event,outstandingVendorIds};
}

async function notifyVendors(s:ReturnType<typeof createClient>,vendorIds:string[],kind:string,title:string,body:string){
  if(!vendorIds.length)return;
  const {data:vendors}=await s.from("vendors").select("user_id").in("id",vendorIds);
  const notices=(vendors??[]).filter(v=>v.user_id).map(v=>({user_id:v.user_id!,kind,title,body,href:"/vendor/leads"}));
  if(notices.length)await s.from("notifications").insert(notices);
}

export async function completeEvent(eventId:string){
  const {s,event,outstandingVendorIds}=await eventClosureContext(eventId);
  await Promise.all([
    s.from("events").update({status:"completed"}).eq("id",eventId),
    s.from("quotes").update({status:"expired"}).eq("event_id",eventId).eq("status","sent"),
    s.from("event_requests").update({status:"closed"}).eq("event_id",eventId).in("status",["open","quoted"]),
    s.from("bookings").update({status:"completed"}).eq("event_id",eventId).eq("status","confirmed"),
  ]);
  await notifyVendors(s,outstandingVendorIds,"event_completed","Event completed",`${event?.name??"A client event"} has been marked complete. Your outstanding lead or pending quote has been closed.`);
  revalidatePath(`/events/${eventId}`);revalidatePath("/events");revalidatePath("/dashboard");revalidatePath("/vendor/leads");
}

export async function cancelEvent(eventId:string){
  const {s,event,outstandingVendorIds}=await eventClosureContext(eventId);
  await Promise.all([
    s.from("events").update({status:"cancelled"}).eq("id",eventId),
    s.from("quotes").update({status:"declined"}).eq("event_id",eventId).eq("status","sent"),
    s.from("event_requests").update({status:"closed"}).eq("event_id",eventId).in("status",["open","quoted"]),
  ]);
  await notifyVendors(s,outstandingVendorIds,"event_cancelled","Event canceled",`${event?.name??"A client event"} has been canceled. Your open lead or pending quote has been closed.`);
  revalidatePath(`/events/${eventId}`);revalidatePath("/events");revalidatePath("/dashboard");revalidatePath("/vendor/leads");
}

export async function deleteEvent(eventId:string){const s=createClient();await s.from("events").delete().eq("id",eventId);revalidatePath("/events");revalidatePath("/dashboard");redirect("/events")}
