import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card, Empty, PageHeader, Badge } from "@/components/ui";
import { timeAgo } from "@/lib/format";

export default async function MessagesPage() {
  const profile = await requireProfile();
  const supabase = createClient();
  const { data: convos } = await supabase.from("conversations").select("*").order("created_at", { ascending: false });
  const list = convos ?? [];
  if (!list.length) return <div><PageHeader title="Messages" subtitle="Keep every vendor conversation connected to the right event." /><Empty title="No conversations yet">{profile.account_type === "vendor" ? "When a client requests a quote, the conversation will appear here." : "Request a quote from a vendor to start a conversation."}</Empty></div>;

  const eventIds=[...new Set(list.map(c=>c.event_id))], vendorIds=[...new Set(list.map(c=>c.vendor_id))], convoIds=list.map(c=>c.id);
  const [{data:events},{data:vendors},{data:msgs}] = await Promise.all([
    supabase.from("events").select("id,name").in("id",eventIds),
    supabase.from("vendors").select("id,business_name").in("id",vendorIds),
    supabase.from("messages").select("conversation_id,body,created_at").in("conversation_id",convoIds).order("created_at",{ascending:false}),
  ]);
  const eventName=new Map<string,string>(); for(const e of events??[]) eventName.set(e.id,e.name);
  const vendorName=new Map<string,string>(); for(const v of vendors??[]) vendorName.set(v.id,v.business_name);
  const lastMsg=new Map<string,{body:string;created_at:string}>(); for(const m of msgs??[]) if(!lastMsg.has(m.conversation_id)) lastMsg.set(m.conversation_id,m);

  return <div className="mx-auto max-w-3xl">
    <PageHeader title="Messages" subtitle={profile.account_type === "vendor" ? "Client inquiries, quote conversations and event details — together." : "Every conversation stays tied to the celebration it belongs to."} />
    <div className="mb-5 flex gap-2"><Badge tone="plum">All</Badge><Badge>Event conversations</Badge></div>
    <ul className="space-y-3">{list.map(c=>{const last=lastMsg.get(c.id); const primary=profile.account_type === "vendor" ? eventName.get(c.event_id) : vendorName.get(c.vendor_id); const secondary=profile.account_type === "vendor" ? "Client inquiry" : eventName.get(c.event_id); return <Card as="li" key={c.id} variant="interactive" padding="none">
      <Link href={`/messages/${c.id}`} className="flex items-center gap-4 p-4 sm:p-5">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blush-100 to-plum-100 font-display text-lg text-plum-700">{(primary??"F").slice(0,1)}</div>
        <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="truncate font-semibold text-ink-900">{primary}</p>{last&&<span className="shrink-0 text-xs text-ink-400">{timeAgo(last.created_at)}</span>}</div><p className="mt-0.5 text-xs font-medium text-plum-600">{secondary}</p>{last&&<p className="mt-1 line-clamp-1 text-sm text-ink-600">{last.body}</p>}</div><span className="text-plum-300">›</span>
      </Link></Card>})}</ul>
  </div>;
}
