"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
export async function sendVendorNetworkMessage(conversationId:string,formData:FormData){
 const body=String(formData.get("body")??"").trim(); if(!body)return;
 const s=createClient(); const {data:{user}}=await s.auth.getUser(); if(!user)return;
 await (s.from("vendor_network_messages") as any).insert({conversation_id:conversationId,sender_id:user.id,body});
 revalidatePath(`/vendor/network/messages/${conversationId}`); revalidatePath("/messages");
}
