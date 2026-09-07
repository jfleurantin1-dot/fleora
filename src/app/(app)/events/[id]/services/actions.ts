"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SERVICE_PLAN_ITEMS, type PlanChoice } from "@/lib/planning";

const VALID = new Set<PlanChoice>(["diy","hire","existing","undecided"]);
function refresh(id:string){
  revalidatePath(`/events/${id}`);
  revalidatePath(`/events/${id}/plan`);
  revalidatePath(`/events/${id}/services`);
  revalidatePath(`/events/${id}/summary`);
}
export async function saveServicePlan(eventId:string, fd:FormData){
  const s=createClient();
  const {data:old}=await s.from("event_plan_items").select("id,item_key").eq("event_id",eventId).eq("chapter","services");
  const existing=new Map((old??[]).map(r=>[r.item_key,r]));
  if(fd.get("no_services")==="on"){
    const ids=(old??[]).map(r=>r.id);if(ids.length){await s.from("event_plan_item_photos").delete().in("plan_item_id",ids);await s.from("event_vendor_needs").delete().in("plan_item_id",ids).eq("status","needed");await s.from("event_plan_items").delete().in("id",ids)}
    await s.from("event_plan_items").upsert({event_id:eventId,chapter:"services",item_key:"no_services",label:"No additional services needed",choice:"diy",vendor_category:null,notes:null,updated_at:new Date().toISOString()},{onConflict:"event_id,chapter,item_key"});refresh(eventId);if(String(fd.get("intent"))==="continue")redirect(`/events/${eventId}/entertainment`);redirect(`/events/${eventId}/services?saved=1`)
  }
  const skipRow=existing.get("no_services");if(skipRow)await s.from("event_plan_items").delete().eq("id",skipRow.id);
  const selected=new Set<string>();
  for(const item of SERVICE_PLAN_ITEMS){
    if(fd.get(`selected__${item.key}`)!=="on") continue;
    selected.add(item.key);
    let choice=String(fd.get(`choice__${item.key}`)??"undecided") as PlanChoice;
    if(!VALID.has(choice)) choice="undecided";
    const customLabel=item.key==="other_custom_service"?String(fd.get("custom_label__other_custom_service")??"").trim():"";
    const label=customLabel||item.label;
    const notes=String(fd.get(`notes__${item.key}`)??"").trim()||null;
    const {data:row}=await s.from("event_plan_items").upsert({
      event_id:eventId, chapter:"services", item_key:item.key, label, choice,
      vendor_category:item.vendorCategory, notes, updated_at:new Date().toISOString()
    },{onConflict:"event_id,chapter,item_key"}).select("id").single();
    if(!row) continue;
    if(choice==="hire") await s.from("event_vendor_needs").upsert({
      event_id:eventId, plan_item_id:row.id, category:item.vendorCategory, label, notes,
      status:"needed", updated_at:new Date().toISOString()
    },{onConflict:"plan_item_id"});
    else await s.from("event_vendor_needs").delete().eq("plan_item_id",row.id).eq("status","needed");
  }
  const removed=[...existing.entries()].filter(([k])=>k!=="no_services"&&!selected.has(k)).map(([,r])=>r.id);
  if(removed.length){
    await s.from("event_vendor_needs").delete().in("plan_item_id",removed).eq("status","needed");
    await s.from("event_plan_items").delete().in("id",removed);
  }
  refresh(eventId);
  if(String(fd.get("intent"))==="continue") redirect(`/events/${eventId}/entertainment`);
  redirect(`/events/${eventId}/services?saved=1`);
}
export async function uploadServicePhotos(eventId:string,planItemId:string|null,itemKey:string,fd:FormData):Promise<{error?:string;planItemId?:string;photos?:{id:string;url:string;sort:number}[]}>{
  const s=createClient(); const {data:{user}}=await s.auth.getUser(); if(!user)return{error:"Please sign in again before uploading."};
  const def=SERVICE_PLAN_ITEMS.find(item=>item.key===itemKey);if(!def)return{error:"That service could not be found."};
  let id=planItemId;if(!id){const {data:row,error}=await s.from("event_plan_items").upsert({event_id:eventId,chapter:"services",item_key:def.key,label:def.label,choice:"undecided",vendor_category:def.vendorCategory,notes:null,updated_at:new Date().toISOString()},{onConflict:"event_id,chapter,item_key"}).select("id").single();if(error||!row)return{error:error?.message??"Could not prepare this service for photos."};id=row.id;}
  const files=fd.getAll("photos").filter((v):v is File=>v instanceof File&&v.size>0).slice(0,6);
  const {data:ex}=await s.from("event_plan_item_photos").select("sort").eq("plan_item_id",id).order("sort",{ascending:false}).limit(1);let sort=(ex?.[0]?.sort??-1)+1;const uploaded:{id:string;url:string;sort:number}[]=[];
  for(const file of files){if(!file.type.startsWith("image/"))continue;if(file.size>10000000)return{error:`${file.name} is larger than 10 MB.`};const ext=file.name.split(".").pop()?.toLowerCase()||"jpg";const path=`${user.id}/${eventId}/services/${id}/${crypto.randomUUID()}.${ext}`;const {error}=await s.storage.from("event-inspiration").upload(path,file,{contentType:file.type,upsert:false});if(error)return{error:error.message};const {data:u}=s.storage.from("event-inspiration").getPublicUrl(path);const currentSort=sort++;const {data:photo,error:ie}=await s.from("event_plan_item_photos").insert({event_id:eventId,plan_item_id:id,url:u.publicUrl,sort:currentSort}).select("id,url,sort").single();if(ie||!photo)return{error:ie?.message??"Could not save the uploaded photo."};uploaded.push(photo);}
  refresh(eventId);return{planItemId:id,photos:uploaded};
}

export async function removeServicePhoto(eventId:string,planItemId:string,photoId:string){ const s=createClient(); await s.from("event_plan_item_photos").delete().eq("id",photoId).eq("event_id",eventId).eq("plan_item_id",planItemId); refresh(eventId); }
