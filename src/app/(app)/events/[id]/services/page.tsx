import { CategoryIcon } from "@/components/category-icon";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { CATEGORY_GROUPS, categoriesInGroup, EVENT_TYPE_MAP } from "@/lib/constants";
import { Button, Card, PageHeader, Badge } from "@/components/ui";
import { SparkleIcon } from "@/components/icons";
import { money } from "@/lib/format";
import { saveServices } from "./actions";

export default async function ServicesPage({ params }: { params: { id: string } }) {
  await requireProfile();
  const supabase = createClient();

  const { data: event } = await supabase.from("events").select("*").eq("id", params.id).single();
  if (!event) notFound();

  const { data: requests } = await supabase.from("event_requests").select("category").eq("event_id", params.id);
  const chosen = new Set((requests ?? []).map((r) => r.category));
  const suggested = new Set(EVENT_TYPE_MAP[event.event_type]?.suggested ?? []);
  const budget = Number(event.budget ?? 0);
  const saveWithId = saveServices.bind(null, params.id);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="What can we help you find?"
        subtitle={`We pre-selected a thoughtful starting mix for ${event.name}. Keep what you need, remove what you don’t, and add anything missing.`}
      />

      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-blush-200 bg-blush-50/70 p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-plum-600 shadow-sm"><SparkleIcon size={18} /></span>
        <div>
          <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-ink-900">Fleora starting plan</p><Badge tone="blush">Based on your event type</Badge></div>
          <p className="mt-1 text-xs leading-relaxed text-ink-600">These suggestions are only a starting point. Your plan stays completely customizable.</p>
        </div>
      </div>

      <form action={saveWithId}>
        <div className="grid gap-4 md:grid-cols-2">
          {CATEGORY_GROUPS.map((group) => (
            <Card key={group.key} variant="interactive" padding="none" className="overflow-hidden">
              <div className="border-b fleora-divider bg-ivory-50/70 px-5 py-4">
                <p className="fleora-kicker">{group.label}</p>
              </div>
              <div className="p-3">
                {categoriesInGroup(group.key).map((c) => {
                  const checked = chosen.size ? chosen.has(c.key) : suggested.has(c.key);
                  const est = budget ? money(Math.round((budget * c.budgetShare) / 25) * 25) : null;
                  return (
                    <label key={c.key} className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-plum-50/70">
                      <input type="checkbox" name="category" value={c.key} defaultChecked={checked} className="h-4 w-4 rounded border-plum-300 text-plum-600 focus:ring-plum-400" />
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-plum-50 text-plum-700 transition group-hover:bg-white"><CategoryIcon category={c.key} size={17} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink-900">{c.label}</span>
                        {est && <span className="text-[11px] text-ink-400">Suggested budget ~{est}</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>

        <Card variant="feature" className="sticky bottom-4 z-20 mt-6 flex flex-wrap items-center justify-between gap-3 border-plum-100 bg-white/95 backdrop-blur">
          <div>
            <p className="text-sm font-bold text-ink-900">Ready to see your event plan?</p>
            <p className="text-xs text-ink-500">You can come back and edit these services anytime.</p>
          </div>
          <Button type="submit" size="lg">Save & see my plan →</Button>
        </Card>
      </form>
    </div>
  );
}
