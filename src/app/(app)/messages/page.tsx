import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card, Empty, PageHeader } from "@/components/ui";
import { timeAgo } from "@/lib/format";

export default async function MessagesPage() {
  const profile = await requireProfile();
  const supabase = createClient();

  // RLS scopes conversations to the current user (client or vendor).
  const { data: convos } = await supabase
    .from("conversations")
    .select("*")
    .order("created_at", { ascending: false });

  const list = convos ?? [];
  if (list.length === 0) {
    return (
      <div>
        <PageHeader title="Messages" />
        <Empty title="No conversations yet">
          {profile.account_type === "vendor"
            ? "When a client requests a quote, the conversation shows up here."
            : "Request a quote from a vendor to start a conversation."}
        </Empty>
      </div>
    );
  }

  const eventIds = [...new Set(list.map((c) => c.event_id))];
  const vendorIds = [...new Set(list.map((c) => c.vendor_id))];
  const convoIds = list.map((c) => c.id);

  const [{ data: events }, { data: vendors }, { data: msgs }] = await Promise.all([
    supabase.from("events").select("id,name").in("id", eventIds),
    supabase.from("vendors").select("id,business_name").in("id", vendorIds),
    supabase
      .from("messages")
      .select("conversation_id,body,created_at")
      .in("conversation_id", convoIds)
      .order("created_at", { ascending: false }),
  ]);

  const eventName = new Map<string, string>();
  for (const e of events ?? []) eventName.set(e.id, e.name);
  const vendorName = new Map<string, string>();
  for (const v of vendors ?? []) vendorName.set(v.id, v.business_name);
  const lastMsg = new Map<string, { body: string; created_at: string }>();
  for (const m of msgs ?? []) if (!lastMsg.has(m.conversation_id)) lastMsg.set(m.conversation_id, m);

  return (
    <div>
      <PageHeader title="Messages" />
      <ul className="space-y-2">
        {list.map((c) => {
          const last = lastMsg.get(c.id);
          return (
            <Card as="li" key={c.id} className="transition hover:ring-plum-200">
              <Link href={`/messages/${c.id}`} className="block">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">
                    {profile.account_type === "vendor"
                      ? eventName.get(c.event_id)
                      : vendorName.get(c.vendor_id)}
                  </p>
                  {last && (
                    <span className="text-xs text-slate-400">{timeAgo(last.created_at)}</span>
                  )}
                </div>
                <p className="text-sm text-slate-500">
                  {profile.account_type === "vendor"
                    ? "Client inquiry"
                    : eventName.get(c.event_id)}
                </p>
                {last && (
                  <p className="mt-1 line-clamp-1 text-sm text-slate-600">{last.body}</p>
                )}
              </Link>
            </Card>
          );
        })}
      </ul>
    </div>
  );
}
