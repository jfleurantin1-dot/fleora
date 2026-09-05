"use server";
import { createClient } from "@/lib/supabase/server";
export type ResetState={error?:string;success?:string};
export async function requestPasswordReset(_prev:ResetState,formData:FormData):Promise<ResetState>{const email=String(formData.get("email")??"").trim();if(!email)return{error:"Enter your email address."};const origin=String(formData.get("origin")??"").trim();const supabase=createClient();const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${origin}/auth/callback?next=/reset-password`});if(error)return{error:error.message};return{success:"Check your email for a secure password reset link."};}
