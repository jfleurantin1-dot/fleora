"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { parseMoney } from "@/lib/budget";
import { webUrl } from "@/lib/decor-products";
async function context(eventId:string,key:string){
 if(!/^(decor|food_drinks|services|entertainment|venue_logistics):[a-z0-9_]{1,100}$/.test(key))throw new Error("Invalid planning category.");
 const s=createClient();const {data:{user}}=await s.auth.getUser();
 if(!user)throw new Error("Please sign in again.");
 const {data:event}=await s.from("events").select("id").eq("id",eventId).eq("client_id",user.id).single();
 if(!event)throw new Error("Event not found.");return s;
}
export async function loadPlanningList(eventId:string,key:string){
 const s=await context(eventId,key);const [tasks,shopping]=await Promise.all([s.from("checklist_items").select("*").eq("event_id",eventId).eq("source_key",key).order("sort"),s.from("event_shopping_items").select("*").eq("event_id",eventId).eq("source_key",key).order("created_at")]);
 if(tasks.error||shopping.error)throw new Error("Could not load your list. Please try again.");return {tasks:tasks.data??[],shopping:shopping.data??[]};
}
export async function savePlanningListItem(eventId:string,key:string,fd:FormData){
 try{const s=await context(eventId,key);const kind=fd.get("kind")==="shopping"?"shopping":"task";const id=String(fd.get("id")??"");const remove=fd.get("remove")==="1";const table=kind==="task"?"checklist_items":"event_shopping_items";
 if(remove){const {error}=await s.from(table).delete().eq("id",id).eq("event_id",eventId).eq("source_key",key);if(error)throw error;}
 else{const title=String(fd.get("title")??"").trim();if(!title||title.length>200)throw new Error("Enter a name under 200 characters.");const done=fd.get("done")==="on";let payload:Record<string,unknown>;
 if(kind==="task"){const due=String(fd.get("due_date")??"");if(due&&(!/^\d{4}-\d{2}-\d{2}$/.test(due)||Number.isNaN(Date.parse(due))))throw new Error("Enter a valid date.");const existing=id?await s.from("checklist_items").select("completed_at").eq("id",id).eq("event_id",eventId).eq("source_key",key).maybeSingle():{data:null};payload={title,done,due_date:due||null,completed_at:done?(existing.data?.completed_at??new Date().toISOString()):null};}
 else{const costRaw=String(fd.get("total_cost")??"").trim();const total_cost=costRaw?parseMoney(costRaw):null;const paid_amount=parseMoney(fd.get("paid_amount")||"0");if(paid_amount>(total_cost??0))throw new Error("Amount paid cannot exceed total cost.");const urlRaw=String(fd.get("url")??"").trim();const url=webUrl(urlRaw);if(urlRaw&&!url)throw new Error("Use an https shopping link.");payload={name:title,quantity:String(fd.get("quantity")??"").slice(0,60)||null,total_cost,paid_amount,url:url||null,purchased:done,category:key.split(":")[0],source_chapter:key.split(":")[0]};}
 const result=id?await s.from(table).update(payload).eq("id",id).eq("event_id",eventId).eq("source_key",key):await s.from(table).insert({...payload,event_id:eventId,source_key:key});if(result.error)throw result.error;}
 revalidatePath(`/events/${eventId}`,"layout");revalidatePath("/events");return {success:true};
 }catch(e){return {error:e instanceof Error?e.message:"Could not save your list."};}
}
