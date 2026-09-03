"use client";

import { useFormState, useFormStatus } from "react-dom";
import { saveVendorProfile, type VendorOnboardingState } from "./actions";
import { Button, Card, Field, Input, Textarea, Select, FormError } from "@/components/ui";
import { CATEGORY_GROUPS, categoriesInGroup } from "@/lib/constants";
import type { Service, Vendor } from "@/lib/types";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Saving…" : "Save profile"}
    </Button>
  );
}

export function VendorForm({
  vendor,
  categories,
  services,
  photos,
}: {
  vendor: Vendor | null;
  categories: string[];
  services: Service[];
  photos: string[];
}) {
  const [state, formAction] = useFormState<VendorOnboardingState, FormData>(saveVendorProfile, {});
  const catSet = new Set(categories);

  return (
    <form action={formAction} className="space-y-6">
      <Card className="space-y-4">
        <h2 className="font-semibold text-slate-900">Business</h2>
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
        <h2 className="font-semibold text-slate-900">Service categories</h2>
        <p className="text-sm text-slate-500">Check every service you offer.</p>
        {CATEGORY_GROUPS.map((group) => (
          <div key={group.key}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-plum-500">
              {group.label}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {categoriesInGroup(group.key).map((c) => (
                <label
                  key={c.key}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm ring-1 ring-plum-200 hover:bg-plum-50"
                >
                  <input
                    type="checkbox"
                    name="category"
                    value={c.key}
                    defaultChecked={catSet.has(c.key)}
                    className="h-4 w-4 rounded border-plum-300 text-plum-600"
                  />
                  <span>
                    {c.emoji} {c.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold text-slate-900">Starting prices</h2>
        <p className="text-sm text-slate-500">Add up to four so clients can filter by budget.</p>
        {[0, 1, 2, 3].map((i) => {
          const s = services[i];
          return (
            <div key={i} className="grid grid-cols-12 gap-2">
              <Input
                name={`svc_name_${i}`}
                placeholder="Service name"
                defaultValue={s?.name ?? ""}
                className="col-span-5"
              />
              <Select name={`svc_cat_${i}`} defaultValue={s?.category ?? ""} className="col-span-4">
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
                className="col-span-3"
              />
            </div>
          );
        })}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold text-slate-900">Portfolio photos</h2>
        <Field label="Image URLs" hint="One per line. Hosted images for now; file upload comes later.">
          <Textarea name="photos" rows={4} defaultValue={photos.join("\n")} />
        </Field>
      </Card>

      <FormError message={state.error} />
      {state.ok && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Saved. {vendor?.status !== "approved" && "An admin will review your profile before it goes live."}
        </p>
      )}
      <Submit />
    </form>
  );
}
