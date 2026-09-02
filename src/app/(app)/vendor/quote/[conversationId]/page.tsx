import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireVendor } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { QuoteForm } from "./quote-form";

export default async function ComposeQuotePage({
  params,
}: {
  params: { conversationId: string };
}) {
  const { vendor } = await requireVendor();
  if (!vendor) redirect("/vendor/onboarding");

  const supabase = createClient();
  const { data: convo } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", params.conversationId)
    .single();
  if (!convo || convo.vendor_id !== vendor.id) notFound();

  const [{ data: event }, { data: requests }, { data: myCats }] = await Promise.all([
    supabase.from("events").select("*").eq("id", convo.event_id).single(),
    supabase.from("event_requests").select("category").eq("event_id", convo.event_id),
    supabase.from("vendor_categories").select("category").eq("vendor_id", vendor.id),
  ]);

  const myCatSet = new Set((myCats ?? []).map((c) => c.category));
  const overlap = (requests ?? []).map((r) => r.category).filter((c) => myCatSet.has(c));
  const categories = overlap.length ? overlap : [...myCatSet];

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-3">
        <Link href={`/messages/${params.conversationId}`} className="text-sm text-plum-700 hover:underline">
          ← Back to conversation
        </Link>
      </div>
      <PageHeader title="Create a quote" subtitle={`For ${event?.name}`} />

      <Card className="mb-4 text-sm text-slate-600">
        {event?.name} · {shortDate(event?.event_date)} · {event?.location ?? "TBD"} ·{" "}
        {event?.guest_count ?? "?"} guests · {money(event?.budget)} overall budget
        {event?.style ? ` · ${event.style}` : ""}
      </Card>

      <QuoteForm conversationId={params.conversationId} categories={categories} />
    </div>
  );
}
