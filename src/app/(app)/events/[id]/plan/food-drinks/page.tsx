import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button, Card, Badge, Progress } from "@/components/ui";
import { EventWorkspaceHeader } from "@/components/event/event-workspace-header";
import { FOOD_DRINK_PLAN_ITEMS, type FoodDrinkGroup, type PlanChoice } from "@/lib/planning";
import { categoryLabel } from "@/lib/constants";
import { ChevronRightIcon, UtensilsIcon, CakeIcon, CocktailIcon } from "@/components/icons";
import { FoodDrinkPhotoManager } from "@/components/event/food-drink-photo-manager";
import { addPotluckItem, removePotluckItem, saveFoodDrinkPlan } from "./actions";

const GROUPS: { key: FoodDrinkGroup; title: string; description: string; icon: React.ReactNode }[] = [
  { key: "food", title: "Food", description: "Choose how you want to feed your guests.", icon: <UtensilsIcon size={20}/> },
  { key: "dessert", title: "Cake & desserts", description: "Plan the sweet details and save exact design inspiration.", icon: <CakeIcon size={20}/> },
  { key: "drinks", title: "Drinks", description: "Decide what you're serving and whether you need beverage professionals.", icon: <CocktailIcon size={20}/> },
];

export default async function FoodDrinksPlanPage({ params, searchParams }: { params: { id: string }; searchParams?: { saved?: string } }) {
  await requireProfile();
  const supabase = createClient();
  const { data: event } = await supabase.from("events").select("*").eq("id", params.id).single();
  if (!event) notFound();

  const [{ data: rows }, { data: needs }, { data: itemPhotos }, { data: potluckItems }] = await Promise.all([
    supabase.from("event_plan_items").select("*").eq("event_id", params.id).eq("chapter", "food_drinks"),
    supabase.from("event_vendor_needs").select("*").eq("event_id", params.id).eq("status", "needed"),
    supabase.from("event_plan_item_photos").select("id,plan_item_id,url,sort").eq("event_id", params.id).order("sort"),
    supabase.from("event_potluck_items").select("*").eq("event_id", params.id).order("created_at"),
  ]);

  const byKey = new Map((rows ?? []).map((row) => [row.item_key, row]));
  const selectedCount = byKey.size;
  const decidedCount = (rows ?? []).filter((row) => row.choice !== "undecided").length;
  const progress = selectedCount ? Math.round((decidedCount / selectedCount) * 100) : 0;
  const saveWithId = saveFoodDrinkPlan.bind(null, params.id);
  const addPotluckWithId = addPotluckItem.bind(null, params.id);
  const photosByItem = new Map<string, any[]>();
  for (const photo of itemPhotos ?? []) photosByItem.set(photo.plan_item_id, [...(photosByItem.get(photo.plan_item_id) ?? []), photo]);
  const potluckSelected = byKey.has("potluck");

  return <div className="space-y-7">
    <EventWorkspaceHeader event={event} active="/plan" eyebrow="My Party Plan · Food & Drinks" />

    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="fleora-kicker">Chapter 3</p><h1 className="mt-1 font-display text-4xl text-ink-900">Plan your food & drinks.</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600">Choose what applies to your event. Add notes and inspiration now so catering, cake, bartender and other vendor requests are already organized when you're ready to reach out.</p></div>
      <Link href={`/events/${event.id}/plan`} className="text-sm font-semibold text-plum-700 hover:underline">← Back to Party Plan</Link>
    </div>

    {searchParams?.saved === "1" && <Card className="border-sage-200 bg-sage-50/70"><p className="text-sm font-semibold text-ink-900">Food & drinks saved. Your vendor needs have been updated too. ✓</p></Card>}

    <Card variant="feature" className="bg-gradient-to-br from-plum-50 via-white to-blush-50">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="fleora-kicker">Food & drinks progress</p><p className="mt-1 font-display text-2xl text-ink-900">{selectedCount ? `${decidedCount} of ${selectedCount} selected items decided` : "Choose what your event needs to begin"}</p></div><Badge tone="plum">{progress}% planned</Badge></div>
      <div className="mt-4"><Progress value={progress}/></div>
    </Card>

    <form action={saveWithId} className="space-y-7">
      {GROUPS.map((group) => <section key={group.key} className="space-y-4">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-plum-50 text-plum-700">{group.icon}</span><div><h2 className="font-display text-2xl text-ink-900">{group.title}</h2><p className="text-sm text-ink-500">{group.description}</p></div></div>
        <div className="grid gap-4 lg:grid-cols-2">
          {FOOD_DRINK_PLAN_ITEMS.filter((item) => item.group === group.key).map((item) => {
            const row = byKey.get(item.key);
            const choice = (row?.choice ?? "undecided") as PlanChoice;
            const choices: PlanChoice[] = item.allowHire === false ? ["diy", "undecided"] : ["diy", "hire", "undecided"];
            return <Card key={item.key} variant="interactive" className="overflow-hidden">
              <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" name={`selected__${item.key}`} defaultChecked={Boolean(row)} className="mt-1 h-5 w-5 rounded border-plum-300 text-plum-600 focus:ring-plum-400"/><span className="min-w-0 flex-1"><span className="block font-display text-2xl text-ink-900">{item.label}</span><span className="mt-1 block text-sm leading-relaxed text-ink-600">{item.description}</span></span></label>
              <div className="mt-5 border-t fleora-divider pt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-400">How will you handle it?</p>
                <div className={`grid gap-2 ${choices.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>{choices.map((option) => <label key={option} className="flex cursor-pointer items-center gap-2 rounded-xl border border-plum-100 bg-white px-3 py-2.5 text-xs font-semibold text-ink-700 hover:bg-plum-50"><input type="radio" name={`choice__${item.key}`} value={option} defaultChecked={choice === option} className="text-plum-600 focus:ring-plum-400"/>{option === "diy" ? "I’ll handle it" : option === "hire" ? "Hire a vendor" : "Undecided"}</label>)}</div>
                {item.vendorCategory && <p className="mt-2 text-[11px] text-ink-400">Hire option → {categoryLabel(item.vendorCategory)} vendor need</p>}
                {item.potluck && <p className="mt-2 text-[11px] font-semibold text-plum-700">Select Potluck and save once to use the Potluck Planner below.</p>}
                <textarea name={`notes__${item.key}`} defaultValue={row?.notes ?? ""} rows={2} placeholder="Optional notes — cuisine, servings, flavors, dietary needs, style…" className="mt-3 w-full rounded-xl border border-plum-100 bg-ivory-50/60 px-3 py-2.5 text-sm text-ink-800 outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100"/>
                {row ? <FoodDrinkPhotoManager eventId={event.id} planItemId={row.id} photos={photosByItem.get(row.id) ?? []}/> : <p className="mt-3 rounded-xl bg-ivory-50 px-3 py-2 text-[11px] text-ink-500">Save this selection once to unlock item-specific inspiration uploads.</p>}
              </div>
            </Card>;
          })}
        </div>
      </section>)}

      <Card variant="feature" className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 border-plum-100 bg-white/95 backdrop-blur"><div><p className="text-sm font-bold text-ink-900">Build the plan now. Contact vendors later.</p><p className="text-xs text-ink-500">Anything marked Hire a vendor is added to Vendor Needs with its notes and inspiration attached.</p></div><div className="flex flex-wrap gap-2"><Button type="submit" name="intent" value="save" variant="secondary" size="lg">Save & stay</Button><Button type="submit" name="intent" value="continue" size="lg">Save & continue to Services →</Button></div></Card>
    </form>

    {potluckSelected && <Card variant="feature">
      <div><p className="fleora-kicker">Potluck Planner</p><h2 className="mt-1 font-display text-2xl text-ink-900">Who’s bringing what?</h2><p className="mt-1 text-sm text-ink-500">Build one shared list now. Later, guests will be able to claim available items from their RSVP.</p></div>
      <form action={addPotluckWithId} className="mt-5 grid gap-3 rounded-2xl bg-ivory-50/70 p-4 md:grid-cols-2 xl:grid-cols-5">
        <input required name="item" placeholder="Item — e.g. Mac & cheese" className="rounded-xl border border-plum-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-plum-300"/>
        <select name="category" className="rounded-xl border border-plum-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-plum-300"><option value="main">Main dish</option><option value="side">Side dish</option><option value="appetizer">Appetizer</option><option value="dessert">Dessert</option><option value="drink">Drink</option><option value="other">Other</option></select>
        <input name="assigned_to" placeholder="Who’s bringing it? (optional)" className="rounded-xl border border-plum-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-plum-300"/>
        <input name="notes" placeholder="Notes (optional)" className="rounded-xl border border-plum-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-plum-300"/>
        <Button type="submit">Add item</Button>
      </form>
      <div className="mt-4 space-y-2">
        {(potluckItems ?? []).length === 0 ? <p className="rounded-xl border border-dashed border-plum-100 px-4 py-5 text-center text-sm text-ink-500">No potluck items yet. Add the first dish above.</p> : (potluckItems ?? []).map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-plum-100 bg-white px-4 py-3"><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-ink-900">{item.item}</p><Badge tone={item.assigned_to ? "green" : "slate"}>{item.assigned_to ? `Bringing: ${item.assigned_to}` : "Still needed"}</Badge></div><p className="mt-1 text-xs capitalize text-ink-500">{item.category}{item.notes ? ` · ${item.notes}` : ""}</p></div><form action={removePotluckItem.bind(null, event.id, item.id)}><button type="submit" className="text-xs font-bold text-rose-600 hover:underline">Remove</button></form></div>)}
      </div>
    </Card>}

    {(needs ?? []).filter((need) => (rows ?? []).some((row) => row.id === need.plan_item_id)).length > 0 && <Card variant="feature">
      <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-plum-50 text-plum-700"><UtensilsIcon size={18}/></span><div><p className="fleora-kicker">Vendor Needs</p><h2 className="font-display text-2xl text-ink-900">Food & drink vendors to find.</h2></div></div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">{(needs ?? []).filter((need) => (rows ?? []).some((row) => row.id === need.plan_item_id)).map((need) => <Link key={need.id} href={`/events/${event.id}/matches/${need.category}`} className="flex items-center justify-between rounded-2xl border border-plum-100 bg-plum-50/50 px-4 py-3 transition hover:bg-plum-50"><div><p className="text-sm font-bold text-ink-900">{need.label}</p><p className="text-xs text-ink-500">Find {categoryLabel(need.category)} vendors</p></div><ChevronRightIcon size={17} className="text-plum-600"/></Link>)}</div>
    </Card>}
  </div>;
}
