"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import type { VendorStatus } from "@/lib/types";

async function assertAdmin() {
  const profile = await getProfile();
  if (!profile || profile.account_type !== "admin") throw new Error("Not authorized");
}

export async function setVendorStatus(vendorId: string, status: VendorStatus) {
  await assertAdmin();
  const supabase = createClient();
  await supabase.from("vendors").update({ status }).eq("id", vendorId);
  revalidatePath("/admin");
}
