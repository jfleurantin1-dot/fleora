"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SignupState = { error?: string };

export async function signup(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const accountType = String(formData.get("account_type") ?? "client");

  if (!firstName || !email || password.length < 6) {
    return { error: "Fill in your name, email, and a password of at least 6 characters." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName, account_type: accountType },
    },
  });
  if (error) return { error: error.message };

  // Local dev has email confirmations off, so a session exists immediately.
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    // Confirmations are on — tell the user to check their inbox.
    redirect("/login?check=1");
  }

  redirect(accountType === "vendor" ? "/vendor/onboarding" : "/events/new");
}
