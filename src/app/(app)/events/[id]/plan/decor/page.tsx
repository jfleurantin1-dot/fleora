import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button, Card, Badge, Progress } from "@/components/ui";
import { EventWorkspaceHeader } from "@/components/event/event-workspace-header";
import { DECOR_PLAN_ITEMS, planChoiceLabel, type PlanChoice } from "@/lib/planning";
import { categoryLabel } from "@/lib/constants";
import { ChevronRightIcon, SparkleIcon } from "@/components/icons";
import { saveDecorPlan } from "./actions";
import { DecorPhotoManager } from "@/components/event/decor-photo-manager";
import { ChapterInteractions } from "@/components/event/chapter-interactions";

export default async function DecorPlanPage({ params, searchParams }: { params: { id: string }; searchParams?: { saved?: string } }) {
  await requireProfile();
  const supabase = createClient();
  const { data: event } = await supabase.from("events").select("*").eq("id", params.id).single();
  if (!event) notFound();

  const [{ data: rows }, { data: needs }, { data: itemPhotos }] = await Promise.all([
    supabase.from("event_plan_items").select("*").eq("event_id", params.id).eq("chapter", "decor"),
    supabase.from("event_vendor_needs").select("*").eq("event_id", params.id).eq("status", "needed"),
    supabase.from("event_plan_item_photos").select("id,plan_item_id,url,sort").eq("event_id", params.id).order("sort"),
  ]);

  const byKey = new Map((rows ?? []).map((row) => [row.item_key, row]));
  const noDecor = byKey.has("no_decor");
  const selectedCount = (rows ?? []).filter(r=>r.item_key!=="no_decor").length;
  const decidedCount = (rows ?? []).filter((row) => row.item_key!=="no_decor" && row.choice !== "undecided").length;
  const progress = noDecor ? 100 : selectedCount ? Math.round((decidedCount / selectedCount) * 100) : 0;
  const saveWithId = saveDecorPlan.bind(null, params.id);
  const photosByItem = new Map<string, any[]>();
  for (const photo of itemPhotos ?? []) photosByItem.set(photo.plan_item_id, [...(photosByItem.get(photo.plan_item_id) ?? []), photo]);

  return (
    <div className="space-y-7">
      <EventWorkspaceHeader event={event} active="/plan" eyebrow="My Party Plan · Decor" />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="fleora-kicker">Chapter 2</p>
          <h1 className="mt-1 font-display text-4xl text-ink-900">Plan your decor.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600">Choose only the elements you want for this event. Add notes and specific inspiration so anything you hire for is already packaged into a useful vendor brief.</p>
        </div>
        <Link href={`/events/${event.id}/plan`} className="text-sm font-semibold text-plum-700 hover:underline">← Back to Party Plan</Link>
      </div>

      {searchParams?.saved === "1" && <Card className="border-sage-200 bg-sage-50/70"><p className="text-sm font-semibold text-ink-900">Decor plan saved. Your vendor needs have been updated too. ✓</p></Card>}

      <Card variant="feature" className="bg-gradient-to-br from-plum-50 via-white to-blush-50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="fleora-kicker">Decor progress</p>
            <p className="mt-1 font-display text-2xl text-ink-900">{selectedCount ? `${decidedCount} of ${selectedCount} selected elements decided` : "Choose your decor elements to begin"}</p>
          </div>
          <Badge tone="plum">{progress}% planned</Badge>
        </div>
        <div className="mt-4"><Progress value={progress} /></div>
      </Card>

      <form action={saveWithId} className="space-y-5"><ChapterInteractions skipName="no_decor"/><Card><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" name="no_decor" defaultChecked={noDecor} className="mt-1 h-5 w-5 rounded border-plum-300 text-plum-600"/><span><span className="block font-bold text-ink-900">No decor needed</span><span className="mt-1 block text-sm text-ink-500">Skip decor for this event and mark the chapter complete.</span></span></label></Card>
        <div className="grid gap-4 lg:grid-cols-2">
          {DECOR_PLAN_ITEMS.map((item) => {
            const row = byKey.get(item.key);
            const choice = (row?.choice ?? "undecided") as PlanChoice;
            return (
              <Card key={item.key} variant="interactive" className="overflow-hidden">
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" name={`selected__${item.key}`} defaultChecked={Boolean(row)} className="mt-1 h-5 w-5 rounded border-plum-300 text-plum-600 focus:ring-plum-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-2xl text-ink-900">{item.label}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-ink-600">{item.description}</span>
                  </span>
                </label>

                <div data-plan-details-for={item.key} className="mt-5 border-t fleora-divider pt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-400">How will you handle it?</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {(["diy", "hire", "undecided"] as PlanChoice[]).map((option) => (
                      <label key={option} className="flex cursor-pointer items-center gap-2 rounded-xl border border-plum-100 bg-white px-3 py-2.5 text-xs font-semibold text-ink-700 hover:bg-plum-50">
                        <input type="radio" name={`choice__${item.key}`} value={option} defaultChecked={choice === option} className="text-plum-600 focus:ring-plum-400" />
                        {planChoiceLabel(option)}
                      </label>
                    ))}
                  </div>
                  {item.vendorCategory && <p className="mt-2 text-[11px] text-ink-400">Hire option → {categoryLabel(item.vendorCategory)} vendor need</p>}
                  {item.key === "other_custom" && <input name="custom_label__other_custom" defaultValue={row?.label === item.label ? "" : row?.label ?? ""} placeholder="What are you planning? e.g. Champagne wall" className="mt-3 w-full rounded-xl border border-plum-100 bg-ivory-50/60 px-3 py-2.5 text-sm text-ink-800 outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100" />}
                  <textarea name={`notes__${item.key}`} defaultValue={row?.notes ?? ""} rows={2} placeholder="Optional notes — size, quantity, style, ideas…" className="mt-3 w-full rounded-xl border border-plum-100 bg-ivory-50/60 px-3 py-2.5 text-sm text-ink-800 outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100" />
                  {row ? <DecorPhotoManager eventId={event.id} planItemId={row.id} photos={photosByItem.get(row.id) ?? []} /> : <p className="mt-3 rounded-xl bg-ivory-50 px-3 py-2 text-[11px] text-ink-500">Save this decor selection once to unlock item-specific inspiration uploads.</p>}
                </div>
              </Card>
            );
          })}
        </div>

        <Card variant="feature" className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 border-plum-100 bg-white/95 backdrop-blur">
          <div>
            <p className="text-sm font-bold text-ink-900">You can change this anytime.</p>
            <p className="text-xs text-ink-500">DIY choices will later feed Shopping + Checklist. Hire choices become Vendor Needs now.</p>
          </div>
          <div className="flex flex-wrap gap-2"><Button type="submit" name="intent" value="save" variant="secondary" size="lg">Save & stay</Button><Button type="submit" name="intent" value="continue" size="lg">Save & continue →</Button></div>
        </Card>
      </form>

      {(needs ?? []).length > 0 && <Card variant="feature">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-plum-50 text-plum-700"><SparkleIcon size={18}/></span><div><p className="fleora-kicker">Vendor Needs</p><h2 className="font-display text-2xl text-ink-900">Fleora knows what you need help with.</h2></div></div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {(needs ?? []).map((need) => <Link key={need.id} href={`/events/${event.id}/matches/${need.category}`} className="flex items-center justify-between rounded-2xl border border-plum-100 bg-plum-50/50 px-4 py-3 transition hover:bg-plum-50"><div><p className="text-sm font-bold text-ink-900">{need.label}</p><p className="text-xs text-ink-500">Find {categoryLabel(need.category)} vendors</p></div><ChevronRightIcon size={17} className="text-plum-600"/></Link>)}
        </div>
      </Card>}
    </div>
  );
}
