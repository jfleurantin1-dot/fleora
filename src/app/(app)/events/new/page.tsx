"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createEvent, type NewEventState } from "./actions";
import { Button, Card, Field, Input, Select, FormError, PageHeader } from "@/components/ui";
import { EVENT_TYPES, STYLE_OPTIONS } from "@/lib/constants";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Building your event…" : "Build my event →"}
    </Button>
  );
}

export default function NewEventPage() {
  const [state, formAction] = useFormState<NewEventState, FormData>(createEvent, {});
  const [type, setType] = useState("birthday");

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="What are you planning?" subtitle="We'll turn this into an event plan and start matching vendors." />

      <form action={formAction}>
        <Card className="space-y-5">
          <div>
            <span className="mb-2 block text-sm font-medium text-slate-700">Event type</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setType(t.key)}
                  className={`rounded-xl px-3 py-3 text-sm font-medium ring-1 transition ${
                    type === t.key
                      ? "bg-plum-600 text-white ring-plum-600"
                      : "bg-white text-slate-600 ring-plum-200 hover:bg-plum-50"
                  }`}
                >
                  <span className="mr-1">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
            <input type="hidden" name="event_type" value={type} />
          </div>

          <Field label="Event name">
            <Input name="name" placeholder="Jerrica's 36th Birthday" required />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date">
              <Input name="event_date" type="date" />
            </Field>
            <Field label="Location" hint="Town or city (Greater Boston for now)">
              <Input name="location" placeholder="Brockton, MA" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Guest count">
              <Input name="guest_count" type="number" min={1} placeholder="50" />
            </Field>
            <Field label="Total budget">
              <Input name="budget" type="number" min={0} step={50} placeholder="6000" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Style">
              <Select name="style" defaultValue="modern elegant">
                {STYLE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Color palette">
              <Input name="color_palette" placeholder="Pink · White · Gold" />
            </Field>
          </div>

          <FormError message={state.error} />
          <Submit />
        </Card>
      </form>
    </div>
  );
}
