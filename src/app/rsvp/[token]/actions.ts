"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function submitRsvp(token:string,fd:FormData){
  const s=await createClient();
  const r=String(fd.get("rsvp")) as "yes"|"no";
  const{data}=await s.rpc("submit_public_rsvp",{
    p_token:token,
    p_rsvp:r,
    p_party_size:Number(fd.get("party_size"))||1,
    p_dietary:String(fd.get("dietary")??"")||null,
    p_plus_one_name:String(fd.get("plus_one_name")??"")||null,
  });
  if(!data)redirect(`/rsvp/${token}?closed=1`);

  const selectedDish=r==="yes"?String(fd.get("potluck_item_id")??"")||null:null;
  const{data:potluckSaved}=await s.rpc("claim_public_potluck_item",{p_token:token,p_item_id:selectedDish});
  redirect(`/rsvp/${token}?saved=1${selectedDish&&!potluckSaved?"&potluck_unavailable=1":""}`);
}
