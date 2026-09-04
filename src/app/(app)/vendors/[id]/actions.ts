"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export type ClaimState = { ok?: boolean; error?: string };

export async function requestVendorClaim(
  vendorId: string,
  _prev: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const profile = await requireProfile(`/vendors/${vendorId}`);
  if (profile.account_type !== "vendor" && profile.account_type !== "admin") {
    return { error: "Create or switch to a vendor account before claiming a business profile." };
  }

  const supabase = createClient();
  const { data: vendor } = await supabase.from("vendors").select("id,user_id,business_name").eq("id", vendorId).single();
  if (!vendor) return { error: "Vendor profile not found." };
  if (vendor.user_id) return { error: "This business profile has already been claimed." };

  const note = String(formData.get("note") ?? "").trim() || null;
  const { error } = await supabase.from("vendor_claims").upsert(
    {
      vendor_id: vendorId,
      claimant_id: profile.id,
      note,
      status: "pending",
      reviewed_at: null,
    },
    { onConflict: "vendor_id,claimant_id" },
  );
  if (error) return { error: error.message };

  revalidatePath(`/vendors/${vendorId}`);
  revalidatePath("/admin");
  return { ok: true };
}
