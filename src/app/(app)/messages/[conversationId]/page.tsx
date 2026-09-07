import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { ButtonLink, Card, Badge } from "@/components/ui";
import { money, shortDate, timeAgo } from "@/lib/format";
import { categoryLabel } from "@/lib/constants";
import { MessageComposer } from "@/components/message-composer";
import { cancelRequest } from "./actions";

export default async function ThreadPage({ params, searchParams }: { params: { conversationId: string }; searchParams?: { from?: string } }) {
 const profile=await requireProfile(); const supabase=createClient();
 const {data:convo}=await supabase.from("conversations").select("*").eq("id",params.conversationId).single(); if(!convo) notFound();
 const [{data:event},{data:vendor},{data:messages},{data:quotes}] = await Promise.all([
  supabase.from("events").select("*").eq("id",convo.event_id).single(),
  supabase.from("vendors").select("id,business_name,user_id").eq("id",convo.vendor_id).single(),
  supabase.from("messages").select("*").eq("conversation_id",params.conversationId).order("created_at"),
  supabase.from("quotes").select("*").eq("event_id",convo.event_id).eq("vendor_id",convo.vendor_id).order("created_at",{ascending:false}),
 ]);
 const isVendorSide=vendor?.user_id===profile.id; const otherName=isVendorSide?event?.name:vendor?.business_name; const latestQuote=quotes?.[0]; const clientCancelled=String((convo as any).client_inquiry_status??"active")==="cancelled"; const vendorDeclined=String((convo as any).vendor_inquiry_status??"active")==="declined"; const closed=clientCancelled||vendorDeclined; const canCancel=!isVendorSide&&!closed&&!latestQuote;
 return <div className="mx-auto max-w-3xl">
  <Link href={isVendorSide&&searchParams?.from==="inquiry"?`/vendor/inquiries/${params.conversationId}`:"/messages"} className="mb-5 inline-flex text-sm font-semibold text-plum-700 hover:underline">{isVendorSide&&searchParams?.from==="inquiry"?"← Back to inquiry":"← Messages"}</Link>
  <Card variant="feature" className="mb-4"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="fleora-kicker">{isVendorSide?"Event conversation":"Vendor conversation"}</p><h1 className="mt-1 font-display text-3xl text-ink-900">{otherName}</h1><p className="mt-2 text-sm text-ink-600">{event?.name} · {shortDate(event?.event_date)} · {event?.guest_count??"?"} guests · {money(event?.budget)}</p></div>{isVendorSide?<ButtonLink href={`/vendor/quote/${params.conversationId}${searchParams?.from==="inquiry"?"?from=inquiry":""}`} size="sm">{latestQuote?"Send another quote":"Create quote"}</ButtonLink>:latestQuote&&latestQuote.status==="sent"?<ButtonLink href={`/quotes/${latestQuote.id}`} size="sm">View quote · {money(latestQuote.total)}</ButtonLink>:null}</div></Card>
  <div className="flex flex-col overflow-hidden rounded-[22px] border border-[#E9E3E7] bg-white shadow-fleora">
   <div className="scroll-thin max-h-[56vh] space-y-4 overflow-y-auto bg-gradient-to-b from-white to-ivory-50 p-4 sm:p-6">{(messages??[]).map(m=>{const mine=m.sender_id===profile.id; return <div key={m.id} className={`flex ${mine?"justify-end":"justify-start"}`}><div className={`max-w-[82%] whitespace-pre-wrap rounded-[18px] px-4 py-3 text-sm leading-relaxed shadow-sm ${mine?"rounded-br-md bg-plum-500 text-white":"rounded-bl-md border border-[#E9E3E7] bg-white text-ink-700"}`}>{m.attachment_url&&<a href={m.attachment_url} target="_blank" rel="noreferrer" className="mb-2 block overflow-hidden rounded-xl"><img src={m.attachment_url} alt="Message attachment" className="max-h-72 w-full object-cover"/></a>}{m.body&&<div>{m.body}</div>}<div className={`mt-1.5 text-[10px] ${mine?"text-plum-100":"text-ink-400"}`}>{timeAgo(m.created_at)}</div></div></div>})}{!(messages??[]).length&&<p className="py-10 text-center text-sm text-ink-400">No messages yet — say hello.</p>}</div>
   {closed?<div className="border-t border-plum-100 bg-ivory-50 px-4 py-4 text-sm text-ink-600">{clientCancelled?"This request was cancelled. The conversation is kept for your records.":"This inquiry was declined by the vendor."}</div>:<MessageComposer conversationId={params.conversationId} userId={profile.id}/>}
  </div>
  {canCancel&&<details className="mt-5 rounded-2xl border border-rose-100 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-rose-700">Cancel request</summary><p className="mt-2 text-xs text-ink-500">Use this if you no longer want a quote from this vendor.</p><form action={cancelRequest.bind(null,params.conversationId)} className="mt-3 space-y-3"><select name="reason" required className="w-full rounded-xl border border-plum-100 bg-white px-3 py-2 text-sm"><option value="">Choose a reason</option><option value="plans_changed">My plans changed</option><option value="found_another_vendor">I found another vendor</option><option value="no_longer_needed">I no longer need this service</option><option value="timing_changed">The timing changed</option><option value="other">Other</option></select><textarea name="note" rows={3} placeholder="Optional note (kept for your records)" className="w-full rounded-xl border border-plum-100 px-3 py-2 text-sm"/><button type="submit" className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700">Cancel this request</button></form></details>}
  {quotes&&quotes.length>0&&<section className="mt-6"><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-2xl text-ink-900">Quotes</h2><Badge tone="champagne">{quotes.length} shared</Badge></div><div className="space-y-2">{quotes.map(q=><Card key={q.id} variant="interactive" className="flex items-center justify-between"><div><p className="font-semibold text-ink-900">{categoryLabel(q.category)}</p><p className="text-sm text-ink-600">{money(q.total)} · {q.status}</p></div><Link href={`/quotes/${q.id}`} className="text-sm font-semibold text-plum-700">Open →</Link></Card>)}</div></section>}
 </div>;
}
