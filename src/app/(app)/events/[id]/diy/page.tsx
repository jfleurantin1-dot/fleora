import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button, ButtonLink, Card, Empty } from "@/components/ui";
import { EventWorkspaceHeader } from "@/components/event/event-workspace-header";
import { DecorCollage, DecorDiyProducts, DecorDiyProvider } from "@/components/event/decor-diy-products";
import { ImageFrameIcon, SparkleIcon } from "@/components/icons";
import { saveDiyShopping } from "./actions";

export default async function DiyShoppingPage({params,searchParams}:{params:{id:string};searchParams?:{saved?:string;error?:string}}) {
  await requireProfile();
  const supabase=createClient();
  const {data:event}=await supabase.from("events").select("*").eq("id",params.id).single();
  if(!event) notFound();
  const [{data:rows},{data:photos}]=await Promise.all([
    supabase.from("event_plan_items").select("*").eq("event_id",params.id).eq("chapter","decor").eq("choice","diy").order("updated_at"),
    supabase.from("event_plan_item_photos").select("id,plan_item_id,url,sort").eq("event_id",params.id).order("sort"),
  ]);
  const diyRows=rows??[];
  const diyIds=new Set(diyRows.map(row=>row.id));
  const diyPhotos=(photos??[]).filter(photo=>diyIds.has(photo.plan_item_id)).map(photo=>({...photo,itemKey:diyRows.find(row=>row.id===photo.plan_item_id)?.item_key??""}));
  const initial=Object.fromEntries(diyRows.map(row=>[row.item_key,row.diy_products??[]]));
  const itemCount=diyRows.reduce((sum,row)=>sum+(Array.isArray(row.diy_products)?row.diy_products.length:0),0);
  const imageCount=diyRows.reduce((sum,row)=>sum+(Array.isArray(row.diy_products)?row.diy_products.filter((item:any)=>item?.image).length:0),0)+diyPhotos.length;

  return <div className="space-y-7">
    <EventWorkspaceHeader event={event} active="/diy" eyebrow="DIY Shopping"/>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="fleora-kicker">Your sourcing board</p><h1 className="mt-1 font-display text-4xl text-ink-900">DIY shopping, all in one place.</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600">Save product links, let Fleora fill in the details, track quantities and prices, and see how everything looks together.</p></div>
      <ButtonLink href={`/events/${event.id}/plan/decor`} variant="secondary">Edit decor choices</ButtonLink>
    </div>
    {searchParams?.saved&&<Card className="border-sage-200 bg-sage-50/70"><p className="text-sm font-semibold text-ink-900">Your DIY shopping list is saved.</p></Card>}
    {searchParams?.error&&<Card><p role="alert" className="text-sm text-rose-700">{searchParams.error}</p></Card>}
    <div className="grid gap-3 sm:grid-cols-3">
      <Card variant="soft"><p className="text-xs font-bold uppercase tracking-wide text-ink-400">DIY elements</p><p className="mt-1 font-display text-3xl text-ink-900">{diyRows.length}</p></Card>
      <Card variant="soft"><p className="text-xs font-bold uppercase tracking-wide text-ink-400">Shopping links</p><p className="mt-1 font-display text-3xl text-ink-900">{itemCount}</p></Card>
      <Card variant="soft"><p className="text-xs font-bold uppercase tracking-wide text-ink-400">Collage images</p><p className="mt-1 font-display text-3xl text-ink-900">{imageCount}</p></Card>
    </div>
    {!diyRows.length?<Empty title="Your DIY list is ready when you are"><p>Mark a decor element as <b>DIY / I’ll handle it</b>, save the chapter, and it will appear here.</p><div className="mt-4"><ButtonLink href={`/events/${event.id}/plan/decor`}>Choose DIY decor</ButtonLink></div></Empty>:
    <DecorDiyProvider initial={initial}>
      <form action={saveDiyShopping.bind(null,event.id)} className="space-y-6">
        <div className="space-y-4">{diyRows.map(row=><Card key={row.id} padding="lg" className="overflow-hidden"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-plum-50 text-plum-700"><SparkleIcon size={19}/></span><div><h2 className="font-display text-2xl text-ink-900">{row.label}</h2>{row.notes&&<p className="mt-1 text-sm text-ink-600">{row.notes}</p>}</div></div><DecorDiyProducts eventId={event.id} itemKey={row.item_key}/></Card>)}</div>
        <DecorCollage initialActive={diyRows.map(row=>row.item_key)} initialDiy={diyRows.map(row=>row.item_key)} photos={diyPhotos}/>
        <Card variant="feature" className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-white/95 backdrop-blur"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-plum-50 text-plum-700"><ImageFrameIcon size={18}/></span><div><p className="text-sm font-bold text-ink-900">Keep your shopping board up to date.</p><p className="text-xs text-ink-500">Links, quantities, prices and pictures save together.</p></div></div><Button type="submit" size="lg">Save DIY shopping</Button></Card>
      </form>
    </DecorDiyProvider>}
    <p className="text-center text-xs text-ink-400">Product prices are estimates before shipping and tax. Check the retailer before purchasing.</p>
  </div>;
}
