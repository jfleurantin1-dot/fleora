"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeProducts } from "@/lib/decor-products";

export async function saveDiyShopping(eventId:string,formData:FormData) {
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");
  const {data:event}=await supabase.from("events").select("id").eq("id",eventId).eq("client_id",user.id).maybeSingle();
  if(!event) throw new Error("This event is not available.");
  const {data:items}=await supabase.from("event_plan_items").select("id,item_key").eq("event_id",eventId).eq("chapter","decor").eq("choice","diy");
  try {
    for(const item of items??[]) {
      const raw=formData.get(`diy_products__${item.item_key}`);
      if(typeof raw!=="string") continue;
      if(raw.length>100000) throw new Error("Too many product details. Please shorten your list.");
      const products=normalizeProducts(JSON.parse(raw));
      const {error}=await supabase.from("event_plan_items").update({diy_products:products,updated_at:new Date().toISOString()}).eq("id",item.id).eq("event_id",eventId);
      if(error) throw error;
    }
  } catch(error) {
    redirect(`/events/${eventId}/diy?error=${encodeURIComponent(error instanceof Error?error.message:"Please check your shopping details.")}`);
  }
  revalidatePath(`/events/${eventId}/diy`);
  revalidatePath(`/events/${eventId}/plan/decor`);
  redirect(`/events/${eventId}/diy?saved=1`);
}
