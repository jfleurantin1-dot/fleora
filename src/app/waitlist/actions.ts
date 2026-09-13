"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { normalizeUsZip } from "@/lib/geo";
import { sendFleoraEmail } from "@/lib/email";

export type WaitlistState = { error?: string; ok?: boolean; firstName?: string };

export async function joinWaitlist(_prev: WaitlistState, formData: FormData): Promise<WaitlistState> {
  // Honeypot for simple bot protection.
  if (String(formData.get("company") ?? "").trim()) return { ok: true };

  const firstName = String(formData.get("first_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const zip = normalizeUsZip(String(formData.get("postal_code") ?? ""));
  const eventType = String(formData.get("event_type") ?? "").trim() || null;
  const eventDate = String(formData.get("event_date") ?? "").trim() || null;

  if (!firstName) return { error: "Enter your first name." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email address." };
  if (!zip) return { error: "Enter a valid 5-digit ZIP code." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("customer_waitlist").insert({
    first_name: firstName,
    email,
    postal_code: zip,
    event_type: eventType,
    event_date: eventDate,
    source: "website",
    status: "waiting",
  });

  // Someone who joins twice is still successfully on the list.
  if (error && error.code !== "23505") return { error: "We couldn’t add you right now. Please try again." };

  if (!error) await sendFleoraEmail({
    to: email,
    subject: "You’re on the Fleora waitlist ✨",
    heading: `You’re on the list, ${firstName}.`,
    body: "Thanks for joining Fleora early. We’re building one place to plan your event, discover trusted local vendors, compare quotes, book and manage payments. We’ll email you when customer access opens.",
    ctaLabel: "Visit Fleora",
    ctaHref: "/",
  });

  return { ok: true, firstName };
}
