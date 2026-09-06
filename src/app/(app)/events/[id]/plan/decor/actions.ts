"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DECOR_PLAN_ITEMS, type PlanChoice } from "@/lib/planning";

const VALID_CHOICES = new Set<PlanChoice>(["diy", "hire", "undecided"]);

export async function saveDecorPlan(eventId: string, formData: FormData) {
  const supabase = createClient();

  const { data: existingRows } = await supabase
    .from("event_plan_items")
    .select("id,item_key")
    .eq("event_id", eventId)
    .eq("chapter", "decor");

  const existing = new Map((existingRows ?? []).map((row) => [row.item_key, row]));
  const selectedKeys = new Set<string>();

  for (const item of DECOR_PLAN_ITEMS) {
    const selected = formData.get(`selected__${item.key}`) === "on";
    if (!selected) continue;
    selectedKeys.add(item.key);

    const rawChoice = String(formData.get(`choice__${item.key}`) ?? "undecided") as PlanChoice;
    const choice: PlanChoice = VALID_CHOICES.has(rawChoice) ? rawChoice : "undecided";
    const notes = String(formData.get(`notes__${item.key}`) ?? "").trim() || null;

    const { data: planItem, error } = await supabase
      .from("event_plan_items")
      .upsert(
        {
          event_id: eventId,
          chapter: "decor",
          item_key: item.key,
          label: item.label,
          choice,
          vendor_category: item.vendorCategory,
          notes,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "event_id,chapter,item_key" },
      )
      .select("id")
      .single();

    if (error || !planItem) continue;

    if (choice === "hire" && item.vendorCategory) {
      await supabase.from("event_vendor_needs").upsert(
        {
          event_id: eventId,
          plan_item_id: planItem.id,
          category: item.vendorCategory,
          label: item.label,
          status: "needed",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "plan_item_id" },
      );
    } else {
      await supabase
        .from("event_vendor_needs")
        .delete()
        .eq("plan_item_id", planItem.id)
        .eq("status", "needed");
    }
  }

  const removedIds = [...existing.entries()]
    .filter(([key]) => !selectedKeys.has(key))
    .map(([, row]) => row.id);

  if (removedIds.length) {
    await supabase.from("event_vendor_needs").delete().in("plan_item_id", removedIds).eq("status", "needed");
    await supabase.from("event_plan_items").delete().in("id", removedIds);
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/plan`);
  revalidatePath(`/events/${eventId}/plan/decor`);
  revalidatePath(`/events/${eventId}/services`);
  redirect(`/events/${eventId}/plan/decor?saved=1`);
}
