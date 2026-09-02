"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveServices(eventId: string, formData: FormData) {
  const supabase = createClient();
  const selected = formData.getAll("category").map(String);

  const { data: existing } = await supabase
    .from("event_requests")
    .select("id, category, status")
    .eq("event_id", eventId);

  const current = existing ?? [];
  const currentCats = new Set(current.map((r) => r.category));

  const toAdd = selected.filter((c) => !currentCats.has(c));
  const toRemove = current.filter((r) => r.status === "open" && !selected.includes(r.category));

  if (toAdd.length) {
    await supabase
      .from("event_requests")
      .insert(toAdd.map((category) => ({ event_id: eventId, category })));
  }
  if (toRemove.length) {
    await supabase
      .from("event_requests")
      .delete()
      .in(
        "id",
        toRemove.map((r) => r.id),
      );
  }

  revalidatePath(`/events/${eventId}`);
  redirect(`/events/${eventId}`);
}
