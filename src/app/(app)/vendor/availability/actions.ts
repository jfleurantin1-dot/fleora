"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireVendor } from "@/lib/auth";

export async function blockDate(formData: FormData) {
  const { vendor } = await requireVendor();
  if (!vendor) return;
  const date = String(formData.get("date") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;

  const supabase = createClient();
  await supabase.from("vendor_unavailable_dates").upsert(
    { vendor_id: vendor.id, unavailable_date: date, note },
    { onConflict: "vendor_id,unavailable_date" },
  );
  revalidatePath("/vendor/availability");
}

export async function removeBlockedDate(formData: FormData) {
  const { vendor } = await requireVendor();
  if (!vendor) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = createClient();
  await supabase.from("vendor_unavailable_dates").delete().eq("id", id).eq("vendor_id", vendor.id);
  revalidatePath("/vendor/availability");
}
