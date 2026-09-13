"use server";

import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { sendFleoraEmail } from "@/lib/email";
import { notifyFleoraAdmins } from "@/lib/admin-notifications";

export type SignupState = { error?: string };

export async function signup(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  const accountType = String(formData.get("account_type") ?? "client");

  if (accountType !== "vendor") redirect("/waitlist");

  if (!firstName || !email || !phone || password.length < 6) {
    return { error: "Fill in your name, email, phone number, and a password of at least 6 characters." };
  }
  if (password !== confirmPassword) return { error: "Your passwords do not match." };

  const supabase = createClient();
  const { data: signupData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName, phone, account_type: accountType },
    },
  });
  if (error) return { error: error.message };

  if (signupData.user) {
    const isVendor = accountType === "vendor";
    try {
      const admin = createAdminClient();
      await admin.from("notifications").insert({
        user_id: signupData.user.id,
        kind: "account",
        title: isVendor ? "Welcome to Fleora for Vendors" : "Welcome to Fleora",
        body: isVendor
          ? "Your vendor account is ready. Complete your business profile so clients can discover you."
          : "Your Fleora account is ready. Start your first event whenever you’re ready.",
        href: isVendor ? "/vendor/onboarding" : "/events/new",
      });
    } catch (notificationError) {
      console.error("Could not create signup notification", notificationError);
    }

    await notifyFleoraAdmins({
      title: isVendor ? "New vendor signup" : "New client signup",
      body: `${firstName}${lastName ? ` ${lastName}` : ""} (${email}) created a ${isVendor ? "vendor" : "client"} account.`,
      href: "/admin",
    });

    await sendFleoraEmail({
      to: email,
      subject: isVendor ? "Welcome to Fleora for Vendors" : "Welcome to Fleora",
      heading: isVendor ? "Welcome to Fleora for Vendors" : "Welcome to Fleora",
      body: isVendor
        ? `Hi ${firstName}, your Fleora vendor account has been created. If your email still needs verification, use the confirmation email from Fleora first. Then complete your business profile so clients can discover and contact you.`
        : `Hi ${firstName}, your Fleora account has been created. If your email still needs verification, use the confirmation email from Fleora first. Then you can start planning your first event.`,
      ctaLabel: isVendor ? "Complete my vendor profile" : "Start planning",
      ctaHref: isVendor ? "/vendor/onboarding" : "/events/new",
    });
  }

  // Local dev has email confirmations off, so a session exists immediately.
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    // Confirmations are on — tell the user to check their inbox.
    redirect("/login?check=1");
  }

  redirect(accountType === "vendor" ? "/vendor/onboarding" : "/events/new");
}
