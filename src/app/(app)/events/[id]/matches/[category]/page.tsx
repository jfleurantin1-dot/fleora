import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Badge, Button, ButtonLink, Card, Empty, MatchScore, Stars } from "@/components/ui";
import { ArrowLeftIcon, MapPinIcon } from "@/components/icons";
import { money } from "@/lib/format";
import { categoryLabel } from "@/lib/constants";
import { CategoryIcon } from "@/components/category-icon";
import type { VendorMatch } from "@/lib/types";
import { requestQuote } from "./actions";

export default async function MatchesPage({ params }: { params: { id: string; category: string } }) {
  await requireProfile();
  const supabase = createClient();

  const { data: event } = await supabase.from("events").select("*").eq("id", params.id).single();
  if (!event) notFound();

  const { data, error } = await supabase.rpc("match_vendors", {
    p_event_id: params.id,
    p_category: params.category,
  });
  const matches = (data ?? []) as VendorMatch[];

  const { data: convos } = await supabase.from("conversations").select("vendor_id").eq("event_id", params.id);
  const contacted = new Set((convos ?? []).map((c) => c.vendor_id));

  return (
    <div className="mx-auto max-w-5xl">
      <Link href={`/events/${event.id}`} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 transition hover:text-plum-700"><ArrowLeftIcon size={16} /> Back to {event.name}</Link>

      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="fleora-kicker mb-2">Top matches for you</p>
          <div className="flex items-center gap-3"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-plum-50 text-plum-700"><CategoryIcon category={params.category} size={28}/></span><h1 className="font-display text-4xl text-ink-900 sm:text-5xl">{categoryLabel(params.category)}</h1></div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600">Matched to your event details, location, budget and style. Compare your favorites and request a quote when you&apos;re ready.</p>
        </div>
        <div className="rounded-2xl border border-[#E9E3E7] bg-white px-4 py-3 text-sm shadow-fleora"><span className="text-ink-500">For </span><strong>{event.name}</strong><span className="text-ink-400"> · {money(event.budget)}</span></div>
      </div>

      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">Matching error: {error.message}</p>}

      {matches.length === 0 ? (
        <Empty title="No matches yet"><p>We don&apos;t have an approved {categoryLabel(params.category).toLowerCase()} vendor for your area yet. Fleora will have more options as the marketplace grows.</p></Empty>
      ) : (
        <ul className="space-y-5">
          {matches.map((m, index) => {
            const send = requestQuote.bind(null, event.id, params.category, m.vendor_id);
            return (
              <Card as="li" key={m.vendor_id} variant="interactive" padding="none" className="overflow-hidden">
                <div className="grid sm:grid-cols-[220px_1fr]">
                  <div className="relative min-h-52 bg-gradient-to-br from-blush-100 to-plum-100 sm:min-h-full">
                    {m.hero_photo ? <Image src={m.hero_photo} alt={m.business_name} fill sizes="220px" className="object-cover" /> : <div className="grid h-full min-h-52 place-items-center font-display text-5xl text-plum-300">F</div>}
                    {index === 0 && <div className="absolute left-3 top-3"><Badge tone="champagne">Best match</Badge></div>}
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-2xl text-ink-900">{m.business_name}</h2>{m.verified && <Badge tone="plum">Verified</Badge>}</div>
                        <p className="mt-1 flex items-center gap-1 text-xs text-ink-500"><MapPinIcon size={13} />{m.location}{m.distance_miles != null && ` · ${m.distance_miles.toFixed(0)} miles away`}</p>
                        <div className="mt-2"><Stars rating={m.rating} count={m.review_count} /></div>
                      </div>
                      <MatchScore score={m.match_score} />
                    </div>

                    {m.description && <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-ink-600">{m.description}</p>}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {m.availability_score >= 20 && <Badge tone="green">Available</Badge>}
                      {m.budget_score >= 18 && <Badge tone="green">Within budget</Badge>}
                      {m.style_score >= 15 && <Badge tone="blush">Style fit</Badge>}
                      {m.distance_miles != null && m.distance_miles <= 10 && <Badge tone="slate">Nearby</Badge>}
                    </div>

                    <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t fleora-divider pt-4">
                      <div><p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Starting at</p><p className="mt-0.5 font-semibold text-ink-900">{money(m.starting_price)}</p></div>
                      <div className="flex flex-wrap gap-2">
                        <ButtonLink href={`/vendors/${m.vendor_id}`} variant="secondary" size="sm">View vendor</ButtonLink>
                        {contacted.has(m.vendor_id) ? <ButtonLink href="/messages" size="sm">Open chat</ButtonLink> : <form action={send}><Button type="submit" size="sm">Request quote</Button></form>}
                      </div>
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
