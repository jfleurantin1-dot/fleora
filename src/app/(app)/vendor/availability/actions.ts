"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireVendor } from "@/lib/auth";

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function datesInRange(start: string, end: string) {
  const dates: string[] = [];
  const cursor = new Date(`${start}T12:00:00Z`);
  const last = new Date(`${end}T12:00:00Z`);

  if (Number.isNaN(cursor.getTime()) || Number.isNaN(last.getTime()) || cursor > last) return dates;

  // Guard against accidental huge ranges while still allowing long vacations / seasons off.
  for (let i = 0; cursor <= last && i < 366; i += 1) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

export async function blockDateRange(formData: FormData) {
  const { vendor } = await requireVendor();
  if (!vendor) return;

  const startDate = String(formData.get("start_date") ?? "");
  const endDateRaw = String(formData.get("end_date") ?? "");
  const endDate = endDateRaw || startDate;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!isIsoDate(startDate) || !isIsoDate(endDate)) return;

  const dates = datesInRange(startDate, endDate);
  if (dates.length === 0) return;

  const rows = dates.map((unavailable_date) => ({
    vendor_id: vendor.id,
    unavailable_date,
    note,
  }));

  const supabase = createClient();
  await supabase.from("vendor_unavailable_dates").upsert(rows, {
    onConflict: "vendor_id,unavailable_date",
  });

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
