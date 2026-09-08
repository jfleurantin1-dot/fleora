"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function messageVendor(targetVendorId:string){
 const s=createClient(); const {data:{user}}=await s.auth.getUser(); if(!user) redirect("/login");
 const {data:mine}=await s.from("vendors").select("id").eq("user_id",user.id).maybeSingle();
 if(!mine||mine.id===targetVendorId) return;
 const [vendor_a_id,vendor_b_id]=[mine.id,targetVendorId].sort();
 const table=s.from("vendor_network_conversations") as any;
 let {data:conversation}=await table.select("id").eq("vendor_a_id",vendor_a_id).eq("vendor_b_id",vendor_b_id).maybeSingle();
 if(!conversation){const result=await table.insert({vendor_a_id,vendor_b_id}).select("id").single();conversation=result.data;}
 if(conversation?.id) redirect(`/vendor/network/messages/${conversation.id}`);
}
