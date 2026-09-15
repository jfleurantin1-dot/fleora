import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EventWorkspaceNav } from "@/components/event/event-workspace-nav";

export default async function EventLayout({children,params}:{children:React.ReactNode;params:{id:string}}) {
  await requireProfile();
  const supabase=createClient();
  const {data:event}=await supabase.from("events").select("id").eq("id",params.id).maybeSingle();
  if(!event) notFound();
  return <div className="lg:grid lg:grid-cols-[224px_minmax(0,1fr)] lg:items-start lg:gap-8">
    <EventWorkspaceNav eventId={event.id}/>
    <div className="min-w-0">{children}</div>
  </div>;
}
