"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DECOR_PLAN_ITEMS, type PlanChoice } from "@/lib/planning";

const VALID_CHOICES = new Set<PlanChoice>(["diy", "hire", "undecided"]);

export async function saveDecorPlan(eventId: string, formData: FormData) {
  const supabase = createClient();
  const { data: existingRows } = await supabase.from("event_plan_items").select("id,item_key").eq("event_id", eventId).eq("chapter", "decor");
  const existing = new Map((existingRows ?? []).map((row) => [row.item_key, row]));
  const selectedKeys = new Set<string>();

  for (const item of DECOR_PLAN_ITEMS) {
    const selected = formData.get(`selected__${item.key}`) === "on";
    if (!selected) continue;
    selectedKeys.add(item.key);

    const rawChoice = String(formData.get(`choice__${item.key}`) ?? "undecided") as PlanChoice;
    const choice: PlanChoice = VALID_CHOICES.has(rawChoice) ? rawChoice : "undecided";
    const notes = String(formData.get(`notes__${item.key}`) ?? "").trim() || null;
    const customLabel = item.key === "other_custom" ? String(formData.get("custom_label__other_custom") ?? "").trim() : "";
    const label = customLabel || item.label;

    const { data: planItem, error } = await supabase.from("event_plan_items").upsert({
      event_id: eventId, chapter: "decor", item_key: item.key, label, choice,
      vendor_category: item.vendorCategory, notes, updated_at: new Date().toISOString(),
    }, { onConflict: "event_id,chapter,item_key" }).select("id").single();
    if (error || !planItem) continue;

    if (choice === "hire" && item.vendorCategory) {
      await supabase.from("event_vendor_needs").upsert({
        event_id: eventId, plan_item_id: planItem.id, category: item.vendorCategory,
        label, notes, status: "needed", updated_at: new Date().toISOString(),
      }, { onConflict: "plan_item_id" });
    } else {
      await supabase.from("event_vendor_needs").delete().eq("plan_item_id", planItem.id).eq("status", "needed");
    }
  }

  const removedIds = [...existing.entries()].filter(([key]) => !selectedKeys.has(key)).map(([, row]) => row.id);
  if (removedIds.length) {
    await supabase.from("event_vendor_needs").delete().in("plan_item_id", removedIds).eq("status", "needed");
    await supabase.from("event_plan_items").delete().in("id", removedIds);
  }

  revalidatePath(`/events/${eventId}`); revalidatePath(`/events/${eventId}/plan`); revalidatePath(`/events/${eventId}/plan/decor`); revalidatePath(`/events/${eventId}/services`);
  const intent = String(formData.get("intent") ?? "save");
  if (intent === "continue") redirect(`/events/${eventId}/plan`);
  redirect(`/events/${eventId}/plan/decor?saved=1`);
}

export async function uploadDecorPhotos(eventId: string, planItemId: string, fd: FormData): Promise<{ error?: string }> {
  const s = createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return { error: "Please sign in again before uploading." };
  const files = fd.getAll("photos").filter((v): v is File => v instanceof File && v.size > 0).slice(0, 6);
  if (!files.length) return {};
  const { data: existing } = await s.from("event_plan_item_photos").select("sort").eq("plan_item_id", planItemId).order("sort", { ascending: false }).limit(1);
  let sort = (existing?.[0]?.sort ?? -1) + 1;
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    if (file.size > 10_000_000) return { error: `${file.name} is larger than 10 MB.` };
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${eventId}/decor/${planItemId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await s.storage.from("event-inspiration").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) return { error: uploadError.message };
    const { data: publicUrl } = s.storage.from("event-inspiration").getPublicUrl(path);
    const { error: insertError } = await s.from("event_plan_item_photos").insert({ event_id: eventId, plan_item_id: planItemId, url: publicUrl.publicUrl, sort: sort++ });
    if (insertError) return { error: insertError.message };
  }
  revalidatePath(`/events/${eventId}/plan/decor`); return {};
}

export async function removeDecorPhoto(eventId: string, planItemId: string, photoId: string) {
  const s = createClient();
  await s.from("event_plan_item_photos").delete().eq("id", photoId).eq("event_id", eventId).eq("plan_item_id", planItemId);
  revalidatePath(`/events/${eventId}/plan/decor`);
}
