"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BUDGET_CATEGORIES, parseMoney } from "@/lib/budget";
import { readInvoice } from "@/lib/invoice-reader";

async function owned(eventId: string) {
  const s = createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user) throw new Error("Please sign in again.");
  const { data: event } = await s
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("client_id", user.id)
    .single();
  if (!event) throw new Error("Event not found.");
  return { s, user };
}
function refresh(id: string) {
  revalidatePath(`/events/${id}`);
  revalidatePath(`/events/${id}/budget`);
  revalidatePath("/events");
}
function invoiceFile(fd: FormData) {
  const file = fd.get("invoice");
  if (!(file instanceof File) || !file.size) return null;
  if (file.size > 3 * 1024 * 1024)
    throw new Error("Choose an invoice smaller than 3 MB.");
  if (
    !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(
      file.type,
    )
  )
    throw new Error("Choose a PDF, JPG, PNG or WebP invoice.");
  return file;
}
export async function extractInvoice(eventId: string, fd: FormData) {
  try {
    await owned(eventId);
    const file = invoiceFile(fd);
    if (!file) throw new Error("Choose an invoice first.");
    return { data: await readInvoice(file) };
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "Could not read invoice. Enter the details manually.",
    };
  }
}
export async function saveExpense(eventId: string, fd: FormData) {
  let uploaded: string | null = null;
  let created: string | null = null;
  const { s, user } = await owned(eventId);
  try {
    let expenseId = String(fd.get("expense_id") ?? "");
    const planKey = String(fd.get("source_plan_key") ?? "");
    if (planKey && !/^(decor|food_drinks|services|entertainment|venue_logistics):[a-z0-9_]{1,100}$/.test(planKey))
      throw new Error("Invalid planning item.");
    if (planKey) {
      const { data: linked, error } = await s.from("event_budget_expenses")
        .select("id").eq("event_id", eventId).eq("source_plan_key", planKey).maybeSingle();
      if (error) throw new Error("Could not load this vendor’s budget details.");
      if (expenseId && expenseId !== linked?.id) throw new Error("Budget item does not match this planning item.");
      expenseId = linked?.id ?? "";
    }
    const bookingId = String(fd.get("booking_id") ?? "");
    const file = invoiceFile(fd);
    if (bookingId && planKey) throw new Error("Choose one budget item.");
    if (bookingId && expenseId) throw new Error("Choose one budget item.");
    if (bookingId) {
      const { data: b } = await s
        .from("bookings")
        .select("id")
        .eq("id", bookingId)
        .eq("event_id", eventId)
        .neq("status", "cancelled")
        .single();
      if (!b || !file)
        throw new Error("Choose an active booking and attach an invoice.");
    }
    let id = expenseId;
    if (!bookingId) {
      const description = String(fd.get("description") ?? "").trim();
      const category = String(fd.get("category") ?? "Other");
      const vendor_name = String(fd.get("vendor_name") ?? "").trim();
      if (!description || description.length > 200 || vendor_name.length > 200)
        throw new Error(
          "Enter a description and keep names under 200 characters.",
        );
      if (
        !BUDGET_CATEGORIES.includes(
          category as (typeof BUDGET_CATEGORIES)[number],
        )
      )
        throw new Error("Choose a category.");
      const amount = parseMoney(fd.get("amount"));
      const paid_amount = parseMoney(fd.get("paid_amount") ?? "0");
      if (paid_amount > amount)
        throw new Error("Amount paid cannot exceed the total cost.");
      const row = {
        event_id: eventId,
        ...(planKey ? { source_plan_key: planKey } : {}),
        description,
        category,
        vendor_name,
        amount,
        paid_amount,
      };
      if (id) {
        const { data, error } = await s
          .from("event_budget_expenses")
          .update(row)
          .eq("id", id)
          .eq("event_id", eventId)
          .select("id")
          .single();
        if (error || !data) throw new Error("Could not update this expense.");
      } else {
        const { data, error } = await s
          .from("event_budget_expenses")
          .insert(row)
          .select("id")
          .single();
        if (error || !data) throw new Error("Could not save this expense.");
        id = data.id;
        created = id;
      }
    }
    if (file) {
      const invoiceId = crypto.randomUUID();
      const path = `${user.id}/${eventId}/${invoiceId}`;
      const { error } = await s.storage
        .from("event-invoices")
        .upload(path, file, { contentType: file.type });
      if (error) throw new Error("Could not upload invoice. Please try again.");
      uploaded = path;
      const { error: insertError } = await s
        .from("event_budget_invoices")
        .insert({
          id: invoiceId,
          event_id: eventId,
          expense_id: bookingId ? null : id,
          booking_id: bookingId || null,
          storage_path: path,
          filename: file.name.slice(0, 200),
        });
      if (insertError)
        throw new Error("Could not attach invoice. Please try again.");
    }
    refresh(eventId);
    return { success: true };
  } catch (e) {
    if (uploaded) await s.storage.from("event-invoices").remove([uploaded]);
    if (created)
      await s
        .from("event_budget_expenses")
        .delete()
        .eq("id", created)
        .eq("event_id", eventId);
    refresh(eventId);
    return {
      error: e instanceof Error ? e.message : "Could not save expense.",
    };
  }
}
export async function deleteExpense(eventId: string, id: string) {
  const { s } = await owned(eventId);
  const { data: invoices, error: readError } = await s
    .from("event_budget_invoices")
    .select("storage_path")
    .eq("expense_id", id)
    .eq("event_id", eventId);
  if (readError) return { error: "Could not load attachments." };
  if (invoices?.length) {
    const { error } = await s.storage
      .from("event-invoices")
      .remove(invoices.map((i) => i.storage_path));
    if (error)
      return { error: "Could not remove attachments. Please try again." };
  }
  const { error } = await s
    .from("event_budget_expenses")
    .delete()
    .eq("id", id)
    .eq("event_id", eventId);
  refresh(eventId);
  return error ? { error: "Could not delete expense." } : { success: true };
}
export async function deleteInvoice(eventId: string, id: string) {
  const { s } = await owned(eventId);
  const { data: i } = await s
    .from("event_budget_invoices")
    .select("storage_path")
    .eq("id", id)
    .eq("event_id", eventId)
    .single();
  if (!i) return { error: "Invoice not found." };
  const { error: storageError } = await s.storage
    .from("event-invoices")
    .remove([i.storage_path]);
  if (storageError) return { error: "Could not remove invoice." };
  const { error } = await s
    .from("event_budget_invoices")
    .delete()
    .eq("id", id)
    .eq("event_id", eventId);
  refresh(eventId);
  return error ? { error: "Could not remove invoice." } : { success: true };
}

export async function getExistingVendorExpense(eventId: string, planKey: string) {
  const { s } = await owned(eventId);
  const { data, error } = await s.from("event_budget_expenses").select("*")
    .eq("event_id", eventId).eq("source_plan_key", planKey).maybeSingle();
  if (error) throw new Error("Could not load vendor details. Please try again.");
  return { expense: data, readerEnabled: Boolean(process.env.OPENAI_API_KEY) };
}
