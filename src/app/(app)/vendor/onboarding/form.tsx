"use client";
import { CategoryIcon } from "@/components/category-icon";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { saveVendorProfile, type VendorOnboardingState } from "./actions";
import { Button, ButtonLink, Card, Field, Input, Textarea, Select, FormError } from "@/components/ui";
import { CATEGORY_GROUPS, EVENT_TYPES, categoriesInGroup } from "@/lib/constants";
import { PhotoUploader } from "@/components/vendor/photo-uploader";
import { PlusIcon } from "@/components/icons";
import type { Package, Service, Vendor } from "@/lib/types";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Saving…" : "Save profile"}
    </Button>
  );
}

export function VendorForm({
  userId,
  vendor,
  categories,
  services,
  packages,
  photos,
}: {
  userId: string;
  vendor: Vendor | null;
  categories: string[];
  services: Service[];
  packages: Package[];
  photos: string[];
}) {
  const [state, formAction] = useFormState<VendorOnboardingState, FormData>(saveVendorProfile, {});
  const catSet = new Set(categories);
  const [serviceCount, setServiceCount] = useState(Math.max(4, Math.min(12, services.length || 0)));
  const [packageCount, setPackageCount] = useState(Math.max(3, Math.min(12, packages.length || 0)));
  const [faqCount, setFaqCount] = useState(Math.max(2, Math.min(6, vendor?.faqs?.length || 0)));

  return (
    <form action={formAction} className="space-y-6">
      <Card variant="feature" className="space-y-4">
        <div><p className="fleora-kicker">Step 1</p><h2 className="mt-1 font-display text-2xl text-ink-900">Your business</h2><p className="mt-1 text-sm text-ink-600">Tell clients what makes your work special.</p></div>
        <Field label="Business name">
          <Input name="business_name" defaultValue={vendor?.business_name ?? ""} required />
        </Field>
        <Field label="Description" hint="What you do, your style, who you're a fit for.">
          <Textarea name="description" rows={3} defaultValue={vendor?.description ?? ""} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Base location" hint="Town or city">
            <Input name="location" defaultValue={vendor?.location ?? ""} placeholder="Quincy, MA" />
          </Field>
          <Field label="Service radius (miles)">
            <Input
              name="service_radius_miles"
              type="number"
              min={5}
              max={150}
              defaultValue={vendor?.service_radius_miles ?? 25}
            />
          </Field>
        </div>
      </Card>

      <Card className="space-y-4">
        <div><p className="fleora-kicker">Best-fit events</p><h2 className="mt-1 font-display text-2xl text-ink-900">What do you love to work on?</h2><p className="mt-1 text-sm text-ink-600">These choices help Fleora show your business to the right clients.</p></div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {EVENT_TYPES.map((eventType) => <label key={eventType.key} className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E9E3E7] bg-white px-3 py-2.5 text-sm text-ink-700 transition hover:border-plum-200 hover:bg-plum-50"><input type="checkbox" name="event_type" value={eventType.key} defaultChecked={vendor?.event_types?.includes(eventType.key)} className="h-4 w-4 rounded border-plum-300 text-plum-600"/><span>{eventType.label}</span></label>)}
        </div>
      </Card>

      <Card className="space-y-4">
        <div><p className="fleora-kicker">Storefront details</p><h2 className="mt-1 font-display text-2xl text-ink-900">Help clients find you everywhere</h2><p className="mt-1 text-sm text-ink-600">You can type a website like <strong>mybusiness.com</strong> or an Instagram handle like <strong>@mybusiness</strong>. Fleora will format the links for you.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Website">
            <Input name="website" defaultValue={vendor?.website ?? ""} placeholder="mybusiness.com" inputMode="url" />
          </Field>
          <Field label="Instagram">
            <Input name="instagram" defaultValue={vendor?.instagram ?? ""} placeholder="@mybusiness" />
          </Field>
          <Field label="Public email">
            <Input name="contact_email" type="email" defaultValue={vendor?.contact_email ?? ""} placeholder="hello@mybusiness.com" />
          </Field>
          <Field label="Public phone">
            <Input name="contact_phone" type="tel" defaultValue={vendor?.contact_phone ?? ""} placeholder="(617) 555-0123" />
          </Field>
        </div>
      </Card>

      <Card className="space-y-4">
        <div><p className="fleora-kicker">Step 2</p><h2 className="mt-1 font-display text-2xl text-ink-900">Services you offer</h2><p className="mt-1 text-sm text-ink-600">Choose every category you want to be matched for.</p></div>
        <Field label="Primary specialty" hint="This is the first service clients see on your profile.">
          <Select name="primary_category" defaultValue={vendor?.primary_category ?? categories[0] ?? ""}>
            <option value="">Choose your primary specialty…</option>
            {CATEGORY_GROUPS.map((group) => <optgroup key={group.key} label={group.label}>{categoriesInGroup(group.key).map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</optgroup>)}
          </Select>
        </Field>
        {CATEGORY_GROUPS.map((group) => (
          <div key={group.key}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-plum-500">
              {group.label}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {categoriesInGroup(group.key).map((c) => (
                <label
                  key={c.key}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E9E3E7] bg-white px-3 py-2.5 text-sm text-ink-700 transition hover:border-plum-200 hover:bg-plum-50"
                >
                  <input
                    type="checkbox"
                    name="category"
                    value={c.key}
                    defaultChecked={catSet.has(c.key)}
                    className="h-4 w-4 rounded border-plum-300 text-plum-600"
                  />
                  <span>
                    <><CategoryIcon category={c.key} size={22} /><span><span className="block">{c.label}</span>{c.helper&&<span className="mt-0.5 block text-[11px] font-normal leading-snug text-ink-500">{c.helper}</span>}</span></>
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </Card>

      <Card className="space-y-3">
        <div><p className="fleora-kicker">Pricing</p><h2 className="mt-1 font-display text-2xl text-ink-900">Starting prices</h2><p className="mt-1 text-sm text-ink-600">Give clients a useful starting point before they request a custom quote.</p></div>
        {Array.from({length:serviceCount},(_,i)=>i).map((i) => {
          const s = services[i];
          return (
            <div key={i} className="grid grid-cols-12 gap-2 rounded-2xl border border-[#E9E3E7] bg-white p-3">
              <Input
                name={`svc_name_${i}`}
                placeholder="Service name"
                defaultValue={s?.name ?? ""}
                className="col-span-12 sm:col-span-5"
              />
              <Select name={`svc_cat_${i}`} defaultValue={s?.category ?? ""} className="col-span-8 sm:col-span-4">
                <option value="">Category…</option>
                {CATEGORY_GROUPS.map((group) => (
                  <optgroup key={group.key} label={group.label}>
                    {categoriesInGroup(group.key).map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
              <Input
                name={`svc_price_${i}`}
                type="number"
                min={0}
                placeholder="$"
                defaultValue={s?.starting_price ?? ""}
                className="col-span-4 sm:col-span-3"
              />
              <Input name={`svc_desc_${i}`} placeholder="Short description of what is included" defaultValue={s?.description ?? ""} className="col-span-12" />
            </div>
          );
        })}
        {serviceCount<12&&<button type="button" onClick={()=>setServiceCount(c=>Math.min(12,c+1))} className="inline-flex items-center gap-2 rounded-xl border border-plum-200 bg-plum-50 px-3 py-2 text-sm font-semibold text-plum-700"><PlusIcon size={22}/> Add service</button>}
      </Card>

      <Card className="space-y-4">
        <div><p className="fleora-kicker">Booking details</p><h2 className="mt-1 font-display text-2xl text-ink-900">Set clear expectations</h2><p className="mt-1 text-sm text-ink-600">Short, plain-language answers help clients decide whether you are a fit.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Typical booking lead time"><Input name="booking_lead_time" defaultValue={vendor?.booking_lead_time ?? ""} placeholder="For example, 4–6 weeks" /></Field>
          <Field label="Availability notes"><Input name="availability_notes" defaultValue={vendor?.availability_notes ?? ""} placeholder="For example, weekends and evenings" /></Field>
          <Field label="Setup, delivery, or pickup" hint="Tell clients what is included and what requires an extra fee."><Textarea name="setup_delivery_notes" rows={3} defaultValue={vendor?.setup_delivery_notes ?? ""} /></Field>
          <Field label="Travel fees"><Textarea name="travel_fee_policy" rows={3} defaultValue={vendor?.travel_fee_policy ?? ""} placeholder="For example, travel included within 20 miles" /></Field>
          <Field label="Deposit policy"><Textarea name="deposit_policy" rows={3} defaultValue={vendor?.deposit_policy ?? ""} placeholder="For example, 30% deposit to reserve the date" /></Field>
          <Field label="Cancellation policy"><Textarea name="cancellation_policy" rows={3} defaultValue={vendor?.cancellation_policy ?? ""} /></Field>
          <Field label="Dietary accommodations" hint="Useful for caterers, bakers, bars, and food experiences."><Textarea name="dietary_accommodations" rows={3} defaultValue={vendor?.dietary_accommodations ?? ""} placeholder="Allergies, vegan, halal, kosher, gluten-free…" /></Field>
          <Field label="Accessibility notes"><Textarea name="accessibility_notes" rows={3} defaultValue={vendor?.accessibility_notes ?? ""} placeholder="Accessible setup, communication, or service options" /></Field>
        </div>
      </Card>

      <Card className="space-y-3">
        <div><p className="fleora-kicker">Frequently asked questions</p><h2 className="mt-1 font-display text-2xl text-ink-900">Answer questions before they become messages</h2><p className="mt-1 text-sm text-ink-600">Add the questions clients ask you most often.</p></div>
        {Array.from({ length: faqCount }, (_, i) => i).map((i) => <div key={i} className="grid gap-2 rounded-2xl border border-[#E9E3E7] bg-white p-3"><Input name={`faq_question_${i}`} defaultValue={vendor?.faqs?.[i]?.question ?? ""} placeholder="Question"/><Textarea name={`faq_answer_${i}`} rows={2} defaultValue={vendor?.faqs?.[i]?.answer ?? ""} placeholder="Answer"/></div>)}
        {faqCount < 6 && <button type="button" onClick={() => setFaqCount((count) => Math.min(6, count + 1))} className="inline-flex items-center gap-2 rounded-xl border border-plum-200 bg-plum-50 px-3 py-2 text-sm font-semibold text-plum-700"><PlusIcon size={22}/> Add FAQ</button>}
      </Card>

      <Card className="space-y-3">
        <div><p className="fleora-kicker">Packages</p><h2 className="mt-1 font-display text-2xl text-ink-900">Create easy-to-shop packages</h2><p className="mt-1 text-sm text-ink-600">Packages help clients understand what they can book before requesting a custom quote.</p></div>
        {Array.from({length:packageCount},(_,i)=>i).map((i) => {
          const pkg = packages[i];
          return (
            <div key={i} className="grid gap-2 rounded-2xl border border-[#E9E3E7] bg-white p-3 sm:grid-cols-12">
              <Input name={`pkg_name_${i}`} placeholder="Package name" defaultValue={pkg?.name ?? ""} className="sm:col-span-4" />
              <Input name={`pkg_desc_${i}`} placeholder="What’s included" defaultValue={pkg?.description ?? ""} className="sm:col-span-5" />
              <Input name={`pkg_price_${i}`} type="number" min={0} placeholder="$ Price" defaultValue={pkg?.price ?? ""} className="sm:col-span-3" />
            </div>
          );
        })}
        {packageCount<12&&<button type="button" onClick={()=>setPackageCount(c=>Math.min(12,c+1))} className="inline-flex items-center gap-2 rounded-xl border border-plum-200 bg-plum-50 px-3 py-2 text-sm font-semibold text-plum-700"><PlusIcon size={22}/> Add package</button>}
      </Card>

      <Card className="space-y-3">
        <div><p className="fleora-kicker">Portfolio</p><h2 className="mt-1 font-display text-2xl text-ink-900">Show your best work</h2><p className="mt-1 text-sm text-ink-600">
          Show your best work — clients see these on your profile and in match results.
        </p></div>
        <PhotoUploader userId={userId} initial={photos} />
      </Card>

      <FormError message={state.error} />
      {state.ok && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Saved. {vendor?.status !== "approved" && "An admin will review your profile before it goes live."}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3">{vendor?.id && <ButtonLink href={`/vendors/${vendor.id}`} variant="secondary" size="lg">Preview storefront</ButtonLink>}<Submit /></div>
    </form>
  );
}
