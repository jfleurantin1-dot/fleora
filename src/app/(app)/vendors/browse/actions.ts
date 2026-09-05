"use server";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";
export async function toggleFavorite(vendorId:string,save:boolean){const supabase=createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return;if(save)await supabase.from("vendor_favorites").upsert({user_id:user.id,vendor_id:vendorId});else await supabase.from("vendor_favorites").delete().eq("user_id",user.id).eq("vendor_id",vendorId);revalidatePath("/vendors/browse");}
