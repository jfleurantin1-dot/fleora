"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ENTERTAINMENT_PLAN_ITEMS, type PlanChoice } from "@/lib/planning";

const VALID = new Set<PlanChoice>(["diy", "hire", "existing", "undecided"]);

function refresh(eventId: string) {
  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/plan`);
  revalidatePath(`/events/${eventId}/entertainment`);
  revalidatePath(`/events/${eventId}/summary`);
}

export async function saveEntertainmentPlan(eventId: string, fd: FormData) {
  const s = createClient();
  const { data: old } = await s
    .from("event_plan_items")
    .select("id,item_key")
    .eq("event_id", eventId)
    .eq("chapter", "entertainment");

  const existing = new Map((old ?? []).map((r) => [r.item_key, r]));
  const noEntertainment = fd.get("no_entertainment") === "on";

  if (noEntertainment) {
    const oldIds = (old ?? []).map((r) => r.id);
    if (oldIds.length) {
      await s.from("event_plan_item_photos").delete().in("plan_item_id", oldIds);
      await s.from("event_vendor_needs").delete().in("plan_item_id", oldIds).eq("status", "needed");
      await s.from("event_plan_items").delete().in("id", oldIds);
    }

    await s.from("event_plan_items").upsert(
      {
        event_id: eventId,
        chapter: "entertainment",
        item_key: "no_entertainment",
        label: "No entertainment needed",
        choice: "diy",
        vendor_category: null,
        notes: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "event_id,chapter,item_key" }
    );

    refresh(eventId);
    if (String(fd.get("intent")) === "continue") redirect(`/events/${eventId}/plan`);
    redirect(`/events/${eventId}/entertainment?saved=1`);
  }

  const noEntertainmentRow = existing.get("no_entertainment");
  if (noEntertainmentRow) {
    await s.from("event_plan_items").delete().eq("id", noEntertainmentRow.id);
  }

  const selected = new Set<string>();
  for (const item of ENTERTAINMENT_PLAN_ITEMS) {
    if (fd.get(`selected__${item.key}`) !== "on") continue;
    selected.add(item.key);

    let choice = String(fd.get(`choice__${item.key}`) ?? "undecided") as PlanChoice;
    if (!VALID.has(choice)) choice = "undecided";

    const customLabel =
      item.key === "other_custom_entertainment"
        ? String(fd.get("custom_label__other_custom_entertainment") ?? "").trim()
        : "";
    const label = customLabel || item.label;
    const notes = String(fd.get(`notes__${item.key}`) ?? "").trim() || null;

    const { data: row } = await s
      .from("event_plan_items")
      .upsert(
        {
          event_id: eventId,
          chapter: "entertainment",
          item_key: item.key,
          label,
          choice,
          vendor_category: item.vendorCategory,
          notes,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "event_id,chapter,item_key" }
      )
      .select("id")
      .single();

    if (!row) continue;

    if (choice === "hire") {
      await s.from("event_vendor_needs").upsert(
        {
          event_id: eventId,
          plan_item_id: row.id,
          category: item.vendorCategory,
          label,
          notes,
          status: "needed",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "plan_item_id" }
      );
    } else {
      await s.from("event_vendor_needs").delete().eq("plan_item_id", row.id).eq("status", "needed");
    }
  }

  const removed = [...existing.entries()]
    .filter(([key]) => key !== "no_entertainment" && !selected.has(key))
    .map(([, row]) => row.id);

  if (removed.length) {
    await s.from("event_vendor_needs").delete().in("plan_item_id", removed).eq("status", "needed");
    await s.from("event_plan_items").delete().in("id", removed);
  }

  refresh(eventId);
  if (String(fd.get("intent")) === "continue") redirect(`/events/${eventId}/plan`);
  redirect(`/events/${eventId}/entertainment?saved=1`);
}

export async function uploadEntertainmentPhotos(
  eventId: string, planItemId: string | null, itemKey: string, fd: FormData
): Promise<{ error?: string; planItemId?: string; photos?: {id:string;url:string;sort:number}[] }> {
  const s = createClient(); const { data: { user } } = await s.auth.getUser();
  if (!user) return { error: "Please sign in again before uploading." };
  const def=ENTERTAINMENT_PLAN_ITEMS.find(item=>item.key===itemKey); if(!def)return{error:"That entertainment item could not be found."};
  let id=planItemId; if(!id){const {data:row,error}=await s.from("event_plan_items").upsert({event_id:eventId,chapter:"entertainment",item_key:def.key,label:def.label,choice:"undecided",vendor_category:def.vendorCategory,notes:null,updated_at:new Date().toISOString()},{onConflict:"event_id,chapter,item_key"}).select("id").single();if(error||!row)return{error:error?.message??"Could not prepare this entertainment item for photos."};id=row.id;}
  const files = fd.getAll("photos").filter((v): v is File => v instanceof File && v.size > 0).slice(0, 6);
  const { data: existingPhotos } = await s.from("event_plan_item_photos").select("sort").eq("plan_item_id", id).order("sort", { ascending: false }).limit(1);
  let sort = (existingPhotos?.[0]?.sort ?? -1) + 1; const uploaded:{id:string;url:string;sort:number}[]=[];
  for (const file of files) {if (!file.type.startsWith("image/")) continue;if (file.size > 10_000_000) return { error: `${file.name} is larger than 10 MB.` };const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";const path = `${user.id}/${eventId}/entertainment/${id}/${crypto.randomUUID()}.${ext}`;const { error } = await s.storage.from("event-inspiration").upload(path, file, { contentType: file.type, upsert: false });if (error) return { error: error.message };const { data: publicUrl } = s.storage.from("event-inspiration").getPublicUrl(path);const currentSort=sort++;const {data:photo,error:insertError}=await s.from("event_plan_item_photos").insert({event_id:eventId,plan_item_id:id,url:publicUrl.publicUrl,sort:currentSort}).select("id,url,sort").single();if(insertError||!photo)return{error:insertError?.message??"Could not save the uploaded photo."};uploaded.push(photo);}
  refresh(eventId); return {planItemId:id,photos:uploaded};
}

export async function removeEntertainmentPhoto(eventId: string, planItemId: string, photoId: string) {
  const s = createClient();
  await s
    .from("event_plan_item_photos")
    .delete()
    .eq("id", photoId)
    .eq("event_id", eventId)
    .eq("plan_item_id", planItemId);
  refresh(eventId);
}
