import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Button, ButtonLink, Card, Badge, MatchScore, Stars, Empty, PageHeader } from "@/components/ui";
import { money } from "@/lib/format";
import { categoryEmoji, categoryLabel } from "@/lib/constants";
import type { VendorMatch } from "@/lib/types";
import { requestQuote } from "./actions";

export default async function MatchesPage({
  params,
}: {
  params: { id: string; category: string };
}) {
  await requireProfile();
  const supabase = createClient();

  const { data: event } = await supabase.from("events").select("*").eq("id", params.id).single();
  if (!event) notFound();

  const { data, error } = await supabase.rpc("match_vendors", {
    p_event_id: params.id,
    p_category: params.category,
  });
  const matches = (data ?? []) as VendorMatch[];

  // Which vendors already have a conversation for this event?
  const { data: convos } = await supabase
    .from("conversations")
    .select("vendor_id")
    .eq("event_id", params.id);
  const contacted = new Set((convos ?? []).map((c) => c.vendor_id));

  return (
    <div>
      <PageHeader
        title={`${categoryEmoji(params.category)} ${categoryLabel(params.category)} matches`}
        subtitle={`Ranked for ${event.name} — ${event.location ?? "your area"}, ${
          event.guest_count ?? "?"
        } guests, ${money(event.budget)} budget.`}
        action={
          <Link href={`/events/${event.id}`} className="text-sm text-plum-700 hover:underline">
            ← Back to event
          </Link>
        }
      />

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          Matching error: {error.message}
        </p>
      )}

      {matches.length === 0 ? (
        <Empty title="No vendors match yet">
          <p>
            We don&apos;t have an approved {categoryLabel(params.category).toLowerCase()} vendor for
            your area and date yet. We&apos;ll notify you as the marketplace grows.
          </p>
        </Empty>
      ) : (
        <ul className="space-y-4">
          {matches.map((m) => {
            const send = requestQuote.bind(null, event.id, params.category, m.vendor_id);
            return (
              <Card as="li" key={m.vendor_id} className="flex flex-col gap-4 sm:flex-row">
                <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl bg-plum-100 sm:h-auto sm:w-44">
                  {m.hero_photo && (
                    <Image
                      src={m.hero_photo}
                      alt={m.business_name}
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{m.business_name}</h3>
                        {m.verified && <Badge tone="plum">Verified</Badge>}
                      </div>
                      <p className="text-sm text-slate-500">
                        {m.location}
                        {m.distance_miles != null && ` · ${m.distance_miles.toFixed(0)} mi away`}
                      </p>
                      <div className="mt-1">
                        <Stars rating={m.rating} count={m.review_count} />
                      </div>
                    </div>
                    <MatchScore score={m.match_score} />
                  </div>

                  {m.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{m.description}</p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                    <Badge tone="slate">avail {m.availability_score}</Badge>
                    <Badge tone="slate">location {m.location_score}</Badge>
                    <Badge tone="slate">budget {m.budget_score}</Badge>
                    <Badge tone="slate">style {m.style_score}</Badge>
                    <Badge tone="slate">reviews {m.review_score}</Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-slate-500">
                      from <span className="font-semibold text-slate-800">{money(m.starting_price)}</span>
                    </span>
                    <div className="ml-auto flex gap-2">
                      <ButtonLink href={`/vendors/${m.vendor_id}`} variant="secondary" size="sm">
                        View profile
                      </ButtonLink>
                      {contacted.has(m.vendor_id) ? (
                        <ButtonLink href="/messages" size="sm">
                          Open chat
                        </ButtonLink>
                      ) : (
                        <form action={send}>
                          <Button type="submit" size="sm">
                            Request quote
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}
