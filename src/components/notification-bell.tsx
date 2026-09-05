import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {BellIcon} from "@/components/icons";
export async function NotificationBell({userId}:{userId:string}){const supabase=createClient();const{count}=await supabase.from("notifications").select("id",{count:"exact",head:true}).eq("user_id",userId).is("read_at",null);return <Link href="/notifications" aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-full border border-[#E9E3E7] bg-white text-plum-700 transition hover:bg-plum-50"><BellIcon size={18}/>{(count??0)>0&&<span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-plum-600 px-1 text-[10px] font-bold text-white">{Math.min(count??0,9)}{(count??0)>9?"+":""}</span>}</Link>}
