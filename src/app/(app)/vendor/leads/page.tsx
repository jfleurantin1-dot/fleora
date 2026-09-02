import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge, Empty, PageHeader, ButtonLink } from "@/components/ui";
import { money, shortDate } from "@/lib/format";

export default async function VendorLeads() {
  const { vendor } = await requireVendor();
  if (!vendor) redirect("/vendor/onboarding");

  const supabase = createClient();
  const { data: convos } = await supabase
    .from("conversations")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  const list = convos ?? [];
  const eventIds = [...new Set(list.map((c) => c.event_id))];

  const [{ data: events }, { data: quotes }] = await Promise.all([
    supabase
      .from("events")
      .select("id,name,event_date,location,guest_count,budget,style")
      .in("id", eventIds.length ? eventIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("quotes").select("event_id,status,total").eq("vendor_id", vendor.id),
  ]);

  type EventBrief = NonNullable<typeof events>[number];
  const eventMap = new Map<string, EventBrief>();
  for (const e of events ?? []) eventMap.set(e.id, e);
  const quoteByEvent = new Map<string, { status: string; total: number }>();
  for (const q of quotes ?? []) quoteByEvent.set(q.event_id, q);

  return (
    <div>
      <PageHeader title="Leads" subtitle="Every client who has asked you for a quote." />
      {list.length === 0 ? (
        <Empty title="No leads yet">
          When a client requests a quote from you, it shows up here with the full event brief.
        </Empty>
      ) : (
        <ul className="space-y-3">
          {list.map((c) => {
            const e = eventMap.get(c.event_id);
            const q = quoteByEvent.get(c.event_id);
            return (
              <Card as="li" key={c.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{e?.name}</p>
                  <p className="text-sm text-slate-500">
                    {shortDate(e?.event_date)} · {e?.location ?? "TBD"} · {e?.guest_count ?? "?"}{" "}
                    guests · {money(e?.budget)} budget
                  </p>
                  {e?.style && <Badge tone="slate">{e.style}</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  {q ? (
                    <Badge tone={q.status === "accepted" ? "green" : q.status === "declined" ? "rose" : "plum"}>
                      quote {q.status} · {money(q.total)}
                    </Badge>
                  ) : (
                    <Badge tone="amber">needs quote</Badge>
                  )}
                  <ButtonLink href={`/messages/${c.id}`} size="sm" variant="secondary">
                    Open
                  </ButtonLink>
                  {!q && (
                    <ButtonLink href={`/vendor/quote/${c.id}`} size="sm">
                      Send quote
                    </ButtonLink>
                  )}
                </div>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
