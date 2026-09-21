"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CATEGORIES, categoryLabel } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

const validCategories = new Set(CATEGORIES.map((category) => category.key));

export async function addVendorNeed(eventId: string, formData: FormData) {
  const category = String(formData.get("category") ?? "");
  if (!validCategories.has(category as never)) redirect(`/events/${eventId}/vendors?error=category`);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("client_id", user.id)
    .maybeSingle();
  if (!event) throw new Error("This event is not available.");

  const { data: existing } = await supabase
    .from("event_vendor_needs")
    .select("id,status")
    .eq("event_id", eventId)
    .eq("category", category)
    .limit(1)
    .maybeSingle();

  if (existing) {
    if (existing.status === "dismissed") {
      await supabase
        .from("event_vendor_needs")
        .update({ status: "needed", updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }
  } else {
    await supabase.from("event_vendor_needs").insert({
      event_id: eventId,
      plan_item_id: null,
      category,
      label: categoryLabel(category),
      status: "needed",
      notes: null,
      updated_at: new Date().toISOString(),
    });
  }

  revalidatePath(`/events/${eventId}/vendors`);
  revalidatePath(`/events/${eventId}/summary`);
  redirect(`/events/${eventId}/matches/${category}`);
}
