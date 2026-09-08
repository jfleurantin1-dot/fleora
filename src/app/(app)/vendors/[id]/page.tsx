import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Badge, ButtonLink, Card, Stars } from "@/components/ui";
import { ArrowLeftIcon, MapPinIcon } from "@/components/icons";
import { money, shortDate, timeRange } from "@/lib/format";
import { categoryLabel, EVENT_TYPE_MAP } from "@/lib/constants";
import { requestQuote } from "@/app/(app)/events/[id]/matches/[category]/actions";
import { ClaimForm } from "./claim-form";
import { messageVendor } from "./network-actions";

export default async function VendorProfile({ params, searchParams }: { params: { id: string }; searchParams?: { eventId?: string; category?: string } }) {
  const profile = await requireProfile();
  const supabase = createClient();
  const { data: vendor } = await supabase.from("vendors").select("*").eq("id", params.id).single();
  if (!vendor) notFound();
  const isOwnVendor = profile.account_type === "vendor" && vendor.user_id === profile.id;
  const isVendorViewer = profile.account_type === "vendor";

  const eventId = searchParams?.eventId;
  const category = searchParams?.category;
  const { data: contextEvent } = eventId ? await supabase.from("events").select("*").eq("id", eventId).maybeSingle() : { data: null };
  const hasContext = Boolean(contextEvent && category);
  const eventTypeLabel = contextEvent ? (EVENT_TYPE_MAP[String(contextEvent.event_type)]?.label ?? String(contextEvent.event_type ?? "Event")) : null;

  const [{ data: cats }, { data: photos }, { data: services }, { data: packages }, { data: reviews }] = await Promise.all([
    supabase.from("vendor_categories").select("category").eq("vendor_id", params.id),
    supabase.from("vendor_photos").select("*").eq("vendor_id", params.id).order("sort"),
    supabase.from("services").select("*").eq("vendor_id", params.id),
    supabase.from("packages").select("*").eq("vendor_id", params.id),
    supabase.from("reviews").select("*").eq("vendor_id", params.id).order("created_at", { ascending: false }).limit(5),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href={hasContext ? `/events/${eventId}/matches/${encodeURIComponent(category!)}` : "/vendors/browse"} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 transition hover:text-plum-700"><ArrowLeftIcon size={16} /> {hasContext ? "Back to Matches" : "Back to Discover"}</Link>

      {isOwnVendor && <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-plum-100 bg-plum-50 px-4 py-3"><div><p className="text-sm font-bold text-plum-800">Profile Preview</p><p className="text-xs text-ink-600">This is how clients see your Fleora storefront.</p></div><ButtonLink href="/vendor/onboarding" variant="secondary" size="sm">Edit profile</ButtonLink></div>}

      <div className="mb-6 grid gap-2 overflow-hidden rounded-[24px] bg-plum-50 sm:grid-cols-3">
        {photos && photos.length > 0 ? photos.slice(0,3).map((p,index) => <div key={p.id} className="relative min-h-72 sm:min-h-[360px]"><Image src={p.url} alt={index===0?vendor.business_name:`${vendor.business_name} portfolio photo ${index+1}`} fill sizes="(max-width:640px) 100vw,33vw" className="object-cover" /></div>) : <div className="col-span-full grid min-h-72 place-items-center bg-gradient-to-br from-blush-100 to-plum-100"><span className="font-display text-7xl text-plum-300">F</span></div>}
      </div>

      <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
        <main>
          <div className="flex flex-wrap items-start justify-between gap-4 border-b fleora-divider pb-6">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">{vendor.verified && <Badge tone="plum">Verified</Badge>}<Badge tone="green">{vendor.status}</Badge>{!vendor.user_id && <Badge tone="champagne">Unclaimed</Badge>}</div>
              <h1 className="font-display text-4xl leading-tight text-ink-900 sm:text-5xl">{vendor.business_name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4"><Stars rating={vendor.rating} count={vendor.review_count} /><span className="flex items-center gap-1 text-sm text-ink-500"><MapPinIcon size={14} />{vendor.location ?? "Greater Boston"}</span></div>
            </div>
            <Badge tone="champagne">Fleora marketplace</Badge>
          </div>

          {vendor.description && <section className="py-7"><p className="fleora-kicker mb-2">About</p><p className="max-w-3xl text-sm leading-7 text-ink-600">{vendor.description}</p><div className="mt-4 flex flex-wrap gap-2">{(cats ?? []).map((c) => <Badge key={c.category} tone="slate">{categoryLabel(c.category)}</Badge>)}</div></section>}

          {(vendor.website || vendor.instagram || vendor.contact_email || vendor.contact_phone) && <section className="border-t fleora-divider py-6"><p className="fleora-kicker mb-3">Connect</p><div className="flex flex-wrap gap-2">{vendor.website && <a href={vendor.website} target="_blank" rel="noreferrer" className="rounded-full border border-[#E9E3E7] bg-white px-4 py-2 text-sm font-semibold text-plum-700 transition hover:bg-plum-50">Website ↗</a>}{vendor.instagram && <a href={vendor.instagram} target="_blank" rel="noreferrer" className="rounded-full border border-[#E9E3E7] bg-white px-4 py-2 text-sm font-semibold text-plum-700 transition hover:bg-plum-50">Instagram ↗</a>}{vendor.contact_email && <a href={`mailto:${vendor.contact_email}`} className="rounded-full border border-[#E9E3E7] bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ivory-100">Email</a>}{vendor.contact_phone && <a href={`tel:${vendor.contact_phone}`} className="rounded-full border border-[#E9E3E7] bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ivory-100">Call</a>}</div></section>}

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
            {isOwnVendor ? <>
              <p className="fleora-kicker">Your storefront</p><h2 className="mt-2 font-display text-2xl text-ink-900">Looking good.</h2><p className="mt-2 text-sm leading-relaxed text-ink-600">Client actions are hidden while you preview your own profile.</p><ButtonLink href="/vendor/onboarding" className="mt-5 w-full">Edit profile</ButtonLink>
            </> : isVendorViewer ? <>
              <p className="fleora-kicker">Vendor Network</p><h2 className="mt-2 font-display text-2xl text-ink-900">Connect with {vendor.business_name}</h2><p className="mt-2 text-sm leading-relaxed text-ink-600">Send a private vendor-to-vendor message for referrals, collaborations or networking.</p>{vendor.user_id ? <form action={messageVendor.bind(null,vendor.id)}><button type="submit" className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-plum-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-plum-700">Message Vendor</button></form> : <p className="mt-4 rounded-xl bg-ivory-100 p-3 text-xs text-ink-500">This listing has not been claimed yet, so messaging is not available.</p>}
            </> : <>
              <p className="fleora-kicker">Ready to connect?</p><h2 className="mt-2 font-display text-2xl text-ink-900">{hasContext ? "Request a quote" : `Add ${vendor.business_name} to your event.`}</h2>
              {hasContext ? <><div className="mt-4 rounded-xl bg-plum-50 p-3 text-xs leading-6 text-ink-600"><p className="font-bold text-ink-900">Inquiry summary</p><p>Event type: {eventTypeLabel}</p><p>Service needed: {categoryLabel(category!)}</p><p>Date: {shortDate(contextEvent!.event_date)}</p><p>Time: {timeRange((contextEvent as any).event_start_time,(contextEvent as any).event_end_time)}</p><p>Location: {contextEvent!.location ?? "TBD"}</p><p>Guests: {contextEvent!.guest_count ?? "TBD"}</p></div><form action={requestQuote.bind(null,eventId!,category!,vendor.id)} className="mt-4"><label className="text-xs font-bold uppercase tracking-wide text-ink-500">Your message</label><p className="mt-1 text-xs text-ink-500">This is your personal note to the vendor. Fleora shares the event details separately.</p><textarea name="message" rows={6} defaultValue={`Hi! I’d love to get a quote for ${categoryLabel(category!)} for my event. Please let me know about your availability and pricing. Thank you!`} className="mt-2 w-full rounded-xl border border-plum-100 bg-white px-3 py-2.5 text-sm"/><button type="submit" className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-plum-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-plum-700">Send Request</button></form></> : <><p className="mt-2 text-sm leading-relaxed text-ink-600">Choose the event you&apos;re planning and Fleora will connect the request to it.</p><ButtonLink href="/events" className="mt-5 w-full">Choose an event</ButtonLink></>}<ButtonLink href="/messages" variant="secondary" className="mt-2 w-full">Open messages</ButtonLink><p className="mt-4 text-center text-xs text-ink-400">{vendor.response_rate}% response rate</p>
            </>}
            {!vendor.user_id && !isVendorViewer && <div className="mt-5 border-t fleora-divider pt-5"><p className="text-sm font-semibold text-ink-900">Is this your business?</p><p className="mt-1 mb-3 text-xs leading-relaxed text-ink-500">Claim the complimentary Fleora listing to manage your photos, pricing, availability, inquiries and quotes.</p><ClaimForm vendorId={vendor.id} /></div>}
          </Card>
        </aside>
      </div>
    </div>
  );
}
