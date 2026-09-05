"use server";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";
export async function sendMessage(conversationId:string,formData:FormData){const body=String(formData.get("body")??"").trim();const attachmentUrl=String(formData.get("attachment_url")??"").trim()||null;if(!body&&!attachmentUrl)return;const supabase=createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return;await supabase.from("messages").insert({conversation_id:conversationId,sender_id:user.id,body,attachment_url:attachmentUrl});revalidatePath(`/messages/${conversationId}`);revalidatePath("/messages");}
