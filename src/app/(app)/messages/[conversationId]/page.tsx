import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { ButtonLink, Card } from "@/components/ui";
import { money, shortDate, timeAgo } from "@/lib/format";
import { categoryLabel } from "@/lib/constants";
import { MessageComposer } from "@/components/message-composer";

export default async function ThreadPage({ params }: { params: { conversationId: string } }) {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data: convo } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", params.conversationId)
    .single();
  if (!convo) notFound();

  const [{ data: event }, { data: vendor }, { data: messages }, { data: quotes }] = await Promise.all([
    supabase.from("events").select("*").eq("id", convo.event_id).single(),
    supabase.from("vendors").select("id,business_name,user_id").eq("id", convo.vendor_id).single(),
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", params.conversationId)
      .order("created_at"),
    supabase
      .from("quotes")
      .select("*")
      .eq("event_id", convo.event_id)
      .eq("vendor_id", convo.vendor_id)
      .order("created_at", { ascending: false }),
  ]);

  const isVendorSide = vendor?.user_id === profile.id;
  const otherName = isVendorSide ? event?.name : vendor?.business_name;
  const latestQuote = quotes?.[0];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3">
        <Link href="/messages" className="text-sm text-plum-700 hover:underline">
          ← All messages
        </Link>
      </div>

      <Card className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-semibold text-slate-900">{otherName}</h1>
            <p className="text-sm text-slate-500">
              {event?.name} · {shortDate(event?.event_date)} · {event?.guest_count ?? "?"} guests ·{" "}
              {money(event?.budget)}
            </p>
          </div>
          {isVendorSide ? (
            <ButtonLink href={`/vendor/quote/${params.conversationId}`} size="sm">
              {latestQuote ? "Send another quote" : "Send quote"}
            </ButtonLink>
          ) : latestQuote && latestQuote.status === "sent" ? (
            <ButtonLink href={`/quotes/${latestQuote.id}`} size="sm">
              View quote · {money(latestQuote.total)}
            </ButtonLink>
          ) : null}
        </div>
      </Card>

      <div className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-plum-100">
        <div className="scroll-thin max-h-[55vh] space-y-3 overflow-y-auto p-4">
          {(messages ?? []).map((m) => {
            const mine = m.sender_id === profile.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    mine ? "bg-plum-600 text-white" : "bg-plum-50 text-slate-700"
                  }`}
                >
                  {m.body}
                  <div className={`mt-1 text-[10px] ${mine ? "text-plum-200" : "text-slate-400"}`}>
                    {timeAgo(m.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
          {(messages ?? []).length === 0 && (
            <p className="text-center text-sm text-slate-400">No messages yet — say hello.</p>
          )}
        </div>
        <MessageComposer conversationId={params.conversationId} />
      </div>

      {quotes && quotes.length > 0 && (
        <div className="mt-4 space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Quotes</h2>
          {quotes.map((q) => (
            <Card key={q.id} className="flex items-center justify-between">
              <span className="text-sm text-slate-700">
                {categoryLabel(q.category)} · {money(q.total)}{" "}
                <span className="text-slate-400">({q.status})</span>
              </span>
              <Link href={`/quotes/${q.id}`} className="text-sm text-plum-700 hover:underline">
                Open
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
