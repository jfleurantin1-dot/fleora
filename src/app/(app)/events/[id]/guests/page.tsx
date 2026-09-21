import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { GuestList } from "@/components/event/guest-list";
import { EventWorkspaceHeader } from "@/components/event/event-workspace-header";

export default async function GuestsPage(props:{params:Promise<{id:string}>}){
  const params=await props.params;
  await requireProfile();
  const s=await createClient();
  const{data:event}=await s.from("events").select("*").eq("id",params.id).single();
  if(!event)notFound();
  const[{data:guests},{data:potluck}]=await Promise.all([
    s.from("guests").select("*").eq("event_id",params.id).order("created_at"),
    s.from("event_potluck_items").select("guest_id,item").eq("event_id",params.id),
  ]);
  return <div className="space-y-7">
    <EventWorkspaceHeader event={event} active="/guests" eyebrow="Guests & Invitations"/>
    <div><p className="fleora-kicker">Guest management</p><h1 className="mt-1 font-display text-4xl text-ink-900">Invitations & RSVPs</h1><p className="mt-2 max-w-2xl text-sm text-ink-600">Manage households, plus-ones, RSVP settings and your live guest count from one full workspace.</p></div>
    <Card padding="lg"><GuestList eventId={event.id} guests={guests??[]} rsvpTitle={event.rsvp_title??null} rsvpDeadline={event.rsvp_deadline??null} eventName={event.name} potluckAssignments={potluck??[]}/></Card>
  </div>;
}
