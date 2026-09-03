import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { CATEGORY_GROUPS, categoriesInGroup, EVENT_TYPE_MAP } from "@/lib/constants";
import { Button, Card, PageHeader } from "@/components/ui";
import { money } from "@/lib/format";
import { saveServices } from "./actions";

export default async function ServicesPage({ params }: { params: { id: string } }) {
  await requireProfile();
  const supabase = createClient();

  const { data: event } = await supabase.from("events").select("*").eq("id", params.id).single();
  if (!event) notFound();

  const { data: requests } = await supabase
    .from("event_requests")
    .select("category")
    .eq("event_id", params.id);

  const chosen = new Set((requests ?? []).map((r) => r.category));
  const suggested = new Set(EVENT_TYPE_MAP[event.event_type]?.suggested ?? []);
  const budget = Number(event.budget ?? 0);

  const saveWithId = saveServices.bind(null, params.id);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="What does your event need?"
        subtitle={`We pre-selected what's typical for a ${
          EVENT_TYPE_MAP[event.event_type]?.label.toLowerCase() ?? "event"
        }. Adjust as you like — you can change this any time.`}
      />

      <form action={saveWithId}>
        <Card className="space-y-4">
          {CATEGORY_GROUPS.map((group) => (
            <div key={group.key}>
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-plum-500">
                {group.label}
              </p>
              <div className="space-y-1">
                {categoriesInGroup(group.key).map((c) => {
                  const checked = chosen.size ? chosen.has(c.key) : suggested.has(c.key);
                  const est = budget
                    ? money(Math.round((budget * c.budgetShare) / 25) * 25)
                    : null;
                  return (
                    <label
                      key={c.key}
                      className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-plum-50"
                    >
                      <input
                        type="checkbox"
                        name="category"
                        value={c.key}
                        defaultChecked={checked}
                        className="h-4 w-4 rounded border-plum-300 text-plum-600 focus:ring-plum-400"
                      />
                      <span className="text-lg">{c.emoji}</span>
                      <span className="flex-1 text-sm font-medium text-slate-700">{c.label}</span>
                      {est && <span className="text-xs text-slate-400">~{est}</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="pt-2">
            <Button type="submit" size="lg" className="w-full">
              Save & see my plan →
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
