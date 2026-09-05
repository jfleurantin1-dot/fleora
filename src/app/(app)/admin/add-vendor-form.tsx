"use client";
import { CategoryIcon } from "@/components/category-icon";

import { useFormState, useFormStatus } from "react-dom";
import { createDirectoryVendor, type AdminVendorState } from "./actions";
import { Button, Card, Field, FormError, Input, Textarea } from "@/components/ui";
import { CATEGORY_GROUPS, categoriesInGroup } from "@/lib/constants";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Adding vendor…" : "Add vendor to Fleora"}</Button>;
}

export function AddVendorForm() {
  const [state, action] = useFormState<AdminVendorState, FormData>(createDirectoryVendor, {});

  return (
    <form action={action} className="space-y-5">
      <Card variant="feature" padding="lg" className="space-y-5">
        <div>
          <p className="fleora-kicker">Vendor-first launch</p>
          <h2 className="mt-1 font-display text-2xl text-ink-900">Add an unclaimed vendor listing</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-600">Build out the marketplace before outreach. The listing goes live immediately and can later be claimed by the business owner.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name"><Input name="business_name" required placeholder="Luxe Events" /></Field>
          <Field label="Location"><Input name="location" placeholder="Boston, MA" /></Field>
        </div>
        <Field label="Description"><Textarea name="description" rows={3} placeholder="Modern event styling, balloons, backdrops and more…" /></Field>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Website"><Input name="website" type="url" placeholder="https://…" /></Field>
          <Field label="Instagram"><Input name="instagram" placeholder="@businessname" /></Field>
          <Field label="Public email"><Input name="contact_email" type="email" placeholder="hello@…" /></Field>
          <Field label="Phone"><Input name="contact_phone" type="tel" placeholder="(617) 555-0123" /></Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Service radius (miles)"><Input name="service_radius_miles" type="number" min={5} max={150} defaultValue={25} /></Field>
          <Field label="Starting price" hint="Optional. Creates a simple starting-price service."><Input name="starting_price" type="number" min={0} placeholder="500" /></Field>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink-900">Categories</p>
          <div className="space-y-4">
            {CATEGORY_GROUPS.map((group) => (
              <div key={group.key}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-plum-500">{group.label}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {categoriesInGroup(group.key).map((category) => (
                    <label key={category.key} className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E9E3E7] bg-white px-3 py-2.5 text-sm text-ink-700 transition hover:border-plum-200 hover:bg-plum-50">
                      <input name="category" value={category.key} type="checkbox" className="h-4 w-4 rounded border-plum-300 text-plum-600" />
                      <span className="inline-flex items-center gap-2"><CategoryIcon category={category.key} size={22} /> {category.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Field label="Portfolio photo URLs" hint="Optional for now. Paste up to 8 direct image URLs, one per line.">
          <Textarea name="photos" rows={4} placeholder={"https://…\nhttps://…"} />
        </Field>

        <FormError message={state.error} />
        {state.ok && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">Vendor added and published. You can add another one now.</p>}
        <SubmitButton />
      </Card>
    </form>
  );
}
