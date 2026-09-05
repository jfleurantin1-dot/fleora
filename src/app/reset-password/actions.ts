"use server";
import {createClient} from "@/lib/supabase/server";
export type UpdateState={error?:string;success?:string};
export async function updatePassword(_prev:UpdateState,formData:FormData):Promise<UpdateState>{const password=String(formData.get("password")??"");const confirm=String(formData.get("confirm")??"");if(password.length<8)return{error:"Use at least 8 characters."};if(password!==confirm)return{error:"Passwords do not match."};const supabase=createClient();const{error}=await supabase.auth.updateUser({password});if(error)return{error:error.message};return{success:"Password updated. You can continue to Fleora."};}
