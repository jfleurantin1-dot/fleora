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
import { vendorProfileCompletion } from "@/lib/vendor-profile";

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
  const counts = { categories: cats?.length ?? 0, photos: photos?.length ?? 0, services: services?.length ?? 0, packages: packages?.length ?? 0 };
  const completion = vendorProfileCompletion(vendor, counts);
  const faqs = Array.isArray(vendor.faqs) ? vendor.faqs.filter((faq) => faq?.question && faq?.answer) : [];
  const eventTypes = (vendor.event_types ?? []).map((key) => EVENT_TYPE_MAP[key]?.label ?? key);
  const bookingDetails = [
    ["Booking lead time", vendor.booking_lead_time],
    ["Availability", vendor.availability_notes],
    ["Setup, delivery & pickup", vendor.setup_delivery_notes],
    ["Travel fees", vendor.travel_fee_policy],
    ["Deposit", vendor.deposit_policy],
    ["Cancellation", vendor.cancellation_policy],
    ["Dietary accommodations", vendor.dietary_accommodations],
    ["Accessibility", vendor.accessibility_notes],
  ].filter((item): item is [string, string] => Boolean(item[1]));
  const initials = vendor.business_name.split(/\s+/).slice(0, 2).map((word: string) => word[0]).join("").toUpperCase();

  return (
    <div className="mx-auto max-w-5xl">
      <Link href={hasContext ? `/events/${eventId}/matches/${encodeURIComponent(category!)}` : "/vendors/browse"} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 transition hover:text-plum-700"><ArrowLeftIcon size={16} /> {hasContext ? "Back to Matches" : "Back to Discover"}</Link>

      {isOwnVendor && <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-plum-100 bg-plum-50 px-4 py-3"><div><p className="text-sm font-bold text-plum-800">Profile preview · {completion.percentage}% complete</p><p className="text-xs text-ink-600">This is how clients see your Fleora storefront. Complete {completion.checks.length-completion.complete} more step{completion.checks.length-completion.complete===1?"":"s"} to make it booking-ready.</p></div><ButtonLink href="/vendor/onboarding" variant="secondary" size="sm">Complete profile</ButtonLink></div>}

      <div className="mb-6">
        <div className="grid gap-2 overflow-hidden rounded-[24px] bg-plum-50 sm:grid-cols-3">
          {photos && photos.length > 0 ? photos.slice(0,3).map((p,index) => <div key={p.id} className="relative min-h-72 sm:min-h-[360px]"><Image src={p.url} alt={index===0?vendor.business_name:`${vendor.business_name} portfolio photo ${index+1}`} fill sizes="(max-width:640px) 100vw,33vw" className="object-cover" /></div>) : <div className="col-span-full grid min-h-72 place-items-center bg-brand-soft"><div className="text-center"><span className="font-display text-7xl text-plum-300">{initials}</span><p className="mt-3 text-sm font-semibold text-plum-500">Portfolio coming soon</p></div></div>}
        </div>
        {photos && photos.length > 3 && <div className="mt-3 flex justify-end"><a href="#all-photos" className="inline-flex min-h-10 items-center justify-center rounded-full border border-plum-200 bg-white px-4 text-sm font-semibold text-plum-700 shadow-sm transition hover:bg-plum-50">View all {photos.length} photos</a></div>}
      </div>

      <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
        <main>
          <div className="flex flex-wrap items-start justify-between gap-4 border-b fleora-divider pb-6">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">{vendor.verified && <Badge tone="plum">Verified business</Badge>}{vendor.primary_category && <Badge tone="blush">{categoryLabel(vendor.primary_category)}</Badge>}{!vendor.user_id && <Badge tone="champagne">Unclaimed listing</Badge>}</div>
              <h1 className="font-display text-4xl leading-tight text-ink-900 sm:text-5xl">{vendor.business_name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4"><Stars rating={vendor.rating} count={vendor.review_count} /><span className="flex items-center gap-1 text-sm text-ink-500"><MapPinIcon size={14} />{vendor.location ?? "Greater Boston"}</span></div>
            </div>
            <Badge tone="champagne">Fleora marketplace</Badge>
          </div>

          {photos && photos.length > 3 && <section id="all-photos" className="scroll-mt-24 border-b fleora-divider py-7"><div className="flex items-end justify-between gap-3"><div><p className="fleora-kicker">Portfolio</p><h2 className="font-display text-2xl text-ink-900">All photos</h2></div><span className="text-sm text-ink-500">{photos.length} photos</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{photos.map((p,index) => <div key={p.id} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-plum-50"><Image src={p.url} alt={`${vendor.business_name} portfolio photo ${index+1}`} fill sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" className="object-cover" /></div>)}</div></section>}

          {(vendor.description || cats?.length || eventTypes.length) && <section className="py-7"><p className="fleora-kicker mb-2">About</p>{vendor.description && <p className="max-w-3xl text-sm leading-7 text-ink-600">{vendor.description}</p>}{eventTypes.length>0&&<div className="mt-5"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Best for</p><div className="flex flex-wrap gap-2">{eventTypes.map((label) => <Badge key={label} tone="champagne">{label}</Badge>)}</div></div>}{Boolean(cats?.length)&&<div className="mt-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Services</p><div className="flex flex-wrap gap-2">{(cats ?? []).map((c) => <Badge key={c.category} tone="slate">{categoryLabel(c.category)}</Badge>)}</div></div>}</section>}

          {(vendor.website || vendor.instagram || vendor.contact_email || vendor.contact_phone) && <section className="border-t fleora-divider py-6"><p className="fleora-kicker mb-3">Connect</p><div className="flex flex-wrap gap-2">{vendor.website && <a href={vendor.website} target="_blank" rel="noreferrer" className="rounded-full border border-[#E9E3E7] bg-white px-4 py-2 text-sm font-semibold text-plum-700 transition hover:bg-plum-50">Website ↗</a>}{vendor.instagram && <a href={vendor.instagram} target="_blank" rel="noreferrer" className="rounded-full border border-[#E9E3E7] bg-white px-4 py-2 text-sm font-semibold text-plum-700 transition hover:bg-plum-50">Instagram ↗</a>}{vendor.contact_email && <a href={`mailto:${vendor.contact_email}`} className="rounded-full border border-[#E9E3E7] bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ivory-100">Email</a>}{vendor.contact_phone && <a href={`tel:${vendor.contact_phone}`} className="rounded-full border border-[#E9E3E7] bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ivory-100">Call</a>}</div></section>}

          {((services?.length ?? 0)>0 || isOwnVendor) && <section className="border-t fleora-divider py-7">
            <h2 className="font-display text-2xl text-ink-900">Services & starting prices</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(services ?? []).map((s) => <Card key={s.id} variant="soft"><div className="flex justify-between gap-3"><div><p className="text-sm font-bold text-ink-900">{s.name}</p>{s.description && <p className="mt-1 text-xs leading-relaxed text-ink-500">{s.description}</p>}</div><p className="shrink-0 text-sm font-semibold text-plum-700">{s.starting_price != null ? `${money(s.starting_price)}+` : "Quote"}</p></div></Card>)}
              {(services ?? []).length === 0 && isOwnVendor && <Card variant="soft"><p className="text-sm font-semibold text-ink-900">Add your first service</p><p className="mt-1 text-xs text-ink-500">Clients use these details to understand pricing before they inquire.</p><ButtonLink href="/vendor/onboarding" size="sm" className="mt-3">Add services</ButtonLink></Card>}
            </div>
          </section>}

          {packages && packages.length > 0 && <section className="border-t fleora-divider py-7"><h2 className="font-display text-2xl text-ink-900">Packages</h2><div className="mt-4 space-y-3">{packages.map((p) => <Card key={p.id} variant="interactive" className="flex justify-between gap-4"><div><p className="font-bold text-ink-900">{p.name}</p>{p.description && <p className="mt-1 text-sm text-ink-500">{p.description}</p>}</div><p className="shrink-0 font-display text-xl text-plum-700">{p.price != null ? money(p.price) : "Custom quote"}</p></Card>)}</div></section>}

          {bookingDetails.length>0&&<section className="border-t fleora-divider py-7"><p className="fleora-kicker mb-2">Good to know</p><h2 className="font-display text-2xl text-ink-900">Booking details</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{bookingDetails.map(([label,value])=><Card key={label} variant="soft"><p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p><p className="mt-2 text-sm leading-relaxed text-ink-700">{value}</p></Card>)}</div></section>}

          {faqs.length>0&&<section className="border-t fleora-divider py-7"><p className="fleora-kicker mb-2">Questions, answered</p><h2 className="font-display text-2xl text-ink-900">Frequently asked questions</h2><div className="mt-4 space-y-2">{faqs.map((faq,index)=><details key={`${faq.question}-${index}`} className="group rounded-2xl border border-[#E9E3E7] bg-white px-5 py-4"><summary className="cursor-pointer list-none pr-8 text-sm font-semibold text-ink-900 marker:hidden">{faq.question}<span className="float-right text-plum-500 transition group-open:rotate-45">+</span></summary><p className="mt-3 max-w-3xl text-sm leading-7 text-ink-600">{faq.answer}</p></details>)}</div></section>}

          {reviews && reviews.length > 0 && <section className="border-t fleora-divider py-7"><h2 className="font-display text-2xl text-ink-900">What clients are saying</h2><p className="mt-1 text-xs text-ink-500">Reviews come from completed Fleora bookings.</p><div className="mt-4 space-y-3">{reviews.map((r) => <Card key={r.id}><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Stars rating={r.rating} /><Badge tone="green">Verified booking</Badge></div><span className="text-xs text-ink-400">{shortDate(r.created_at)}</span></div>{r.comment && <p className="mt-3 text-sm leading-relaxed text-ink-600">{r.comment}</p>}</Card>)}</div></section>}
        </main>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card variant="feature" padding="lg">
            {isOwnVendor ? <>
              <p className="fleora-kicker">Your storefront</p><h2 className="mt-2 font-display text-2xl text-ink-900">Looking good.</h2><p className="mt-2 text-sm leading-relaxed text-ink-600">Client actions are hidden while you preview your own profile.</p><ButtonLink href="/vendor/onboarding" className="mt-5 w-full">Edit profile</ButtonLink>
            </> : isVendorViewer ? <>
              <p className="fleora-kicker">Vendor Network</p><h2 className="mt-2 font-display text-2xl text-ink-900">Connect with {vendor.business_name}</h2><p className="mt-2 text-sm leading-relaxed text-ink-600">Send a private vendor-to-vendor message for referrals, collaborations or networking.</p>{vendor.user_id ? <form action={messageVendor.bind(null,vendor.id)}><button type="submit" className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-bold text-brand-ink transition hover:bg-brand-hover">Message Vendor</button></form> : <p className="mt-4 rounded-xl bg-ivory-100 p-3 text-xs text-ink-500">This listing has not been claimed yet, so messaging is not available.</p>}
            </> : <>
              <p className="fleora-kicker">Ready to connect?</p><h2 className="mt-2 font-display text-2xl text-ink-900">{hasContext ? "Request a quote" : `Add ${vendor.business_name} to your event.`}</h2>
              {hasContext ? <><div className="mt-4 rounded-xl bg-plum-50 p-3 text-xs leading-6 text-ink-600"><p className="font-bold text-ink-900">Inquiry summary</p><p>Event type: {eventTypeLabel}</p><p>Service needed: {categoryLabel(category!)}</p><p>Date: {shortDate(contextEvent!.event_date)}</p><p>Time: {timeRange((contextEvent as any).event_start_time,(contextEvent as any).event_end_time)}</p><p>Location: {contextEvent!.location ?? "TBD"}</p><p>Guests: {contextEvent!.guest_count ?? "TBD"}</p></div><form action={requestQuote.bind(null,eventId!,category!,vendor.id)} className="mt-4"><label className="text-xs font-bold uppercase tracking-wide text-ink-500">Your message</label><p className="mt-1 text-xs text-ink-500">This is your personal note to the vendor. Fleora shares the event details separately.</p><textarea name="message" rows={6} defaultValue={`Hi! I’d love to get a quote for ${categoryLabel(category!)} for my event. Please let me know about your availability and pricing. Thank you!`} className="mt-2 w-full rounded-xl border border-plum-100 bg-white px-3 py-2.5 text-sm"/><button type="submit" className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-bold text-brand-ink transition hover:bg-brand-hover">Send Request</button></form></> : <><p className="mt-2 text-sm leading-relaxed text-ink-600">Choose the event you&apos;re planning and Fleora will connect the request to it.</p><ButtonLink href="/events" className="mt-5 w-full">Choose an event</ButtonLink></>}<ButtonLink href="/messages" variant="secondary" className="mt-2 w-full">Open messages</ButtonLink><p className="mt-4 text-center text-xs text-ink-400">{vendor.response_rate}% response rate</p>
            </>}
            {!vendor.user_id && !isOwnVendor && <div className="mt-5 rounded-2xl bg-blush-50 p-4"><p className="text-sm font-semibold text-ink-900">Is this your business?</p><p className="mt-1 mb-3 text-xs leading-relaxed text-ink-600">Claim this free listing to add photos, pricing, availability, FAQs and booking details.</p><ClaimForm vendorId={vendor.id} /></div>}
          </Card>
        </aside>
      </div>
    </div>
  );
}
