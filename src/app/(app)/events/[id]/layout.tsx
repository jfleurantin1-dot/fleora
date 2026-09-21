import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EventWorkspaceNav } from "@/components/event/event-workspace-nav";

export default async function EventLayout(props:{children:React.ReactNode;params: Promise<{id:string}>}) {
  const params = await props.params;

  const {
    children
  } = props;

  await requireProfile();
  const supabase=await createClient();
  const {data:event}=await supabase.from("events").select("id").eq("id",params.id).maybeSingle();
  if(!event) notFound();
  return <div className="lg:grid lg:grid-cols-[224px_minmax(0,1fr)] lg:items-start lg:gap-8">
    <EventWorkspaceNav eventId={event.id}/>
    <div className="min-w-0">{children}</div>
  </div>;
}
