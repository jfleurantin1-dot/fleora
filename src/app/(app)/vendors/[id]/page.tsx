import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Badge, ButtonLink, Card, Stars } from "@/components/ui";
import { ArrowLeftIcon, MapPinIcon } from "@/components/icons";
import { money, shortDate } from "@/lib/format";
import { categoryLabel } from "@/lib/constants";

export default async function VendorProfile({ params }: { params: { id: string } }) {
  await requireProfile();
  const supabase = createClient();
  const { data: vendor } = await supabase.from("vendors").select("*").eq("id", params.id).single();
  if (!vendor) notFound();

  const [{ data: cats }, { data: photos }, { data: services }, { data: packages }, { data: reviews }] = await Promise.all([
    supabase.from("vendor_categories").select("category").eq("vendor_id", params.id),
    supabase.from("vendor_photos").select("*").eq("vendor_id", params.id).order("sort"),
    supabase.from("services").select("*").eq("vendor_id", params.id),
    supabase.from("packages").select("*").eq("vendor_id", params.id),
    supabase.from("reviews").select("*").eq("vendor_id", params.id).order("created_at", { ascending: false }).limit(5),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/vendors/browse" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 transition hover:text-plum-700"><ArrowLeftIcon size={16} /> Back to Discover</Link>

      <div className="mb-6 grid gap-2 overflow-hidden rounded-[24px] bg-plum-50 sm:grid-cols-2 sm:grid-rows-2">
        {photos && photos.length > 0 ? (
          <>
            <div className="relative min-h-72 sm:row-span-2"><Image src={photos[0].url} alt={vendor.business_name} fill sizes="50vw" className="object-cover" /></div>
            {photos.slice(1, 3).map((p) => <div key={p.id} className="relative min-h-36"><Image src={p.url} alt="" fill sizes="50vw" className="object-cover" /></div>)}
            {photos.length === 1 && <div className="grid min-h-72 place-items-center bg-gradient-to-br from-blush-100 to-plum-100 sm:row-span-2"><span className="font-display text-6xl text-plum-300">F</span></div>}
          </>
        ) : (
          <div className="col-span-full grid min-h-72 place-items-center bg-gradient-to-br from-blush-100 to-plum-100"><span className="font-display text-7xl text-plum-300">F</span></div>
        )}
      </div>

      <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
        <main>
          <div className="flex flex-wrap items-start justify-between gap-4 border-b fleora-divider pb-6">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">{vendor.verified && <Badge tone="plum">Verified</Badge>}<Badge tone="green">{vendor.status}</Badge></div>
              <h1 className="font-display text-4xl leading-tight text-ink-900 sm:text-5xl">{vendor.business_name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4"><Stars rating={vendor.rating} count={vendor.review_count} /><span className="flex items-center gap-1 text-sm text-ink-500"><MapPinIcon size={14} />{vendor.location ?? "Greater Boston"}</span></div>
            </div>
            <Badge tone="champagne">Fleora marketplace</Badge>
          </div>

          {vendor.description && <section className="py-7"><p className="fleora-kicker mb-2">About</p><p className="max-w-3xl text-sm leading-7 text-ink-600">{vendor.description}</p><div className="mt-4 flex flex-wrap gap-2">{(cats ?? []).map((c) => <Badge key={c.category} tone="slate">{categoryLabel(c.category)}</Badge>)}</div></section>}

          <section className="border-t fleora-divider py-7">
            <h2 className="font-display text-2xl text-ink-900">Services & starting prices</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(services ?? []).map((s) => <Card key={s.id} variant="soft"><div className="flex justify-between gap-3"><div><p className="text-sm font-bold text-ink-900">{s.name}</p>{s.description && <p className="mt-1 text-xs leading-relaxed text-ink-500">{s.description}</p>}</div><p className="shrink-0 text-sm font-semibold text-plum-700">{s.starting_price != null ? `${money(s.starting_price)}+` : "Quote"}</p></div></Card>)}
              {(services ?? []).length === 0 && <p className="text-sm text-ink-400">No services listed yet.</p>}
            </div>
          </section>

          {packages && packages.length > 0 && <section className="border-t fleora-divider py-7"><h2 className="font-display text-2xl text-ink-900">Packages</h2><div className="mt-4 space-y-3">{packages.map((p) => <Card key={p.id} variant="interactive" className="flex justify-between gap-4"><div><p className="font-bold text-ink-900">{p.name}</p>{p.description && <p className="mt-1 text-sm text-ink-500">{p.description}</p>}</div><p className="shrink-0 font-display text-xl text-plum-700">{money(p.price)}</p></Card>)}</div></section>}

          {reviews && reviews.length > 0 && <section className="border-t fleora-divider py-7"><h2 className="font-display text-2xl text-ink-900">What clients are saying</h2><div className="mt-4 space-y-3">{reviews.map((r) => <Card key={r.id}><div className="flex items-center justify-between"><Stars rating={r.rating} /><span className="text-xs text-ink-400">{shortDate(r.created_at)}</span></div>{r.comment && <p className="mt-3 text-sm leading-relaxed text-ink-600">{r.comment}</p>}</Card>)}</div></section>}
        </main>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card variant="feature" padding="lg">
            <p className="fleora-kicker">Ready to connect?</p>
            <h2 className="mt-2 font-display text-2xl text-ink-900">Add {vendor.business_name} to your event.</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">Open an event, choose the service you need, and Fleora will match you with vendors and start the quote request.</p>
            <ButtonLink href="/events" className="mt-5 w-full">Choose an event</ButtonLink>
            <ButtonLink href="/messages" variant="secondary" className="mt-2 w-full">Open messages</ButtonLink>
            <p className="mt-4 text-center text-xs text-ink-400">{vendor.response_rate}% response rate</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
