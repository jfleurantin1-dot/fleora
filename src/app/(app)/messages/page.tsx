import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card, Empty, PageHeader, Badge, ButtonLink } from "@/components/ui";
import { timeAgo, money } from "@/lib/format";

export default async function MessagesPage() {
  const profile = await requireProfile(); const supabase = createClient();
  const { data: convos } = await supabase.from("conversations").select("*").order("created_at", { ascending: false }); const list=convos??[];
  const eventIds=[...new Set(list.map(c=>c.event_id))],vendorIds=[...new Set(list.map(c=>c.vendor_id))],convoIds=list.map(c=>c.id);
  const [{data:events},{data:vendors},{data:msgs},{data:quotes}] = await Promise.all([
    eventIds.length?supabase.from("events").select("id,name").in("id",eventIds):Promise.resolve({data:[]}),
    vendorIds.length?supabase.from("vendors").select("id,business_name").in("id",vendorIds):Promise.resolve({data:[]}),
    convoIds.length?supabase.from("messages").select("conversation_id,body,created_at").in("conversation_id",convoIds).order("created_at",{ascending:false}):Promise.resolve({data:[]}),
    profile.account_type==="client"?supabase.from("quotes").select("id,event_id,vendor_id,category,total,status,created_at").in("status",["sent","accepted"]).order("created_at",{ascending:false}).limit(6):Promise.resolve({data:[]}),
  ]);
  const allVendorIds=[...new Set([...(vendors??[]).map(v=>v.id),...(quotes??[]).map(q=>q.vendor_id)])];
  let vendorRows=vendors??[]; if(allVendorIds.length>(vendors??[]).length){const{data}=await supabase.from("vendors").select("id,business_name").in("id",allVendorIds);vendorRows=data??vendorRows}
  const eventName=new Map<string,string>();for(const e of events??[])eventName.set(e.id,e.name); const vendorName=new Map<string,string>();for(const v of vendorRows)vendorName.set(v.id,v.business_name);
  const lastMsg=new Map<string,{body:string;created_at:string}>();for(const m of msgs??[])if(!lastMsg.has(m.conversation_id))lastMsg.set(m.conversation_id,m);
  return <div className="mx-auto max-w-4xl"><PageHeader title="Messages" subtitle={profile.account_type==="vendor"?"Client inquiries, quote conversations and event details — together.":"Quotes first, then every conversation tied to your celebration."}/>
    {profile.account_type==="client"&&<section className="mb-8"><div className="mb-3 flex items-center justify-between"><div><p className="fleora-kicker">Action center</p><h2 className="mt-1 font-display text-2xl">Quotes</h2></div>{(quotes??[]).length>0&&<Badge tone="plum">{quotes!.length} active</Badge>}</div>{(quotes??[]).length?<div className="grid gap-3 sm:grid-cols-2">{quotes!.map(q=><Card key={q.id} variant="interactive"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-ink-900">{vendorName.get(q.vendor_id)??"Vendor quote"}</p><p className="mt-1 text-xs capitalize text-ink-500">{q.category.replaceAll("_"," ")}</p></div><Badge tone={q.status==="accepted"?"champagne":"plum"}>{q.status}</Badge></div><div className="mt-4 flex items-end justify-between"><strong className="font-display text-2xl">{money(q.total)}</strong><ButtonLink href={`/quotes/${q.id}`} variant="secondary" size="sm">View quote</ButtonLink></div></Card>)}</div>:<Card variant="soft"><p className="text-sm text-ink-600">New vendor quotes will appear here first so they&apos;re easy to review.</p></Card>}</section>}
    <section><div className="mb-3"><p className="fleora-kicker">Conversations</p><h2 className="mt-1 font-display text-2xl">Messages</h2></div>{!list.length?<Empty title="No conversations yet">{profile.account_type==="vendor"?"When a client requests a quote, the conversation will appear here.":"Request a quote from a vendor to start a conversation."}</Empty>:<ul className="space-y-3">{list.map(c=>{const last=lastMsg.get(c.id);const primary=profile.account_type==="vendor"?eventName.get(c.event_id):vendorName.get(c.vendor_id);const secondary=profile.account_type==="vendor"?"Client inquiry":eventName.get(c.event_id);return <Card as="li" key={c.id} variant="interactive" padding="none"><Link href={`/messages/${c.id}`} className="flex items-center gap-4 p-4 sm:p-5"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-plum-50 font-display text-lg text-plum-700">{(primary??"F").slice(0,1)}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="truncate font-semibold">{primary}</p>{last&&<span className="shrink-0 text-xs text-ink-400">{timeAgo(last.created_at)}</span>}</div><p className="mt-0.5 text-xs font-medium text-plum-600">{secondary}</p>{last&&<p className="mt-1 line-clamp-1 text-sm text-ink-600">{last.body}</p>}</div><span className="text-plum-300">›</span></Link></Card>})}</ul>}</section>
  </div>;
}
