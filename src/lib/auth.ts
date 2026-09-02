import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Vendor } from "@/lib/types";

/** Returns the signed-in user's profile, or null. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data ?? null;
}

/** Like getProfile but redirects to /login when there is no session. */
export async function requireProfile(nextPath = "/dashboard"): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return profile;
}

/** Requires a signed-in vendor and returns both the profile and vendor row. */
export async function requireVendor(): Promise<{ profile: Profile; vendor: Vendor | null }> {
  const profile = await requireProfile("/vendor/dashboard");
  if (profile.account_type !== "vendor" && profile.account_type !== "admin") {
    redirect("/dashboard");
  }
  const supabase = createClient();
  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("user_id", profile.id)
    .maybeSingle();
  return { profile, vendor: vendor ?? null };
}
