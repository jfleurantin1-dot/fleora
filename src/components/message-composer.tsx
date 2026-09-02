"use client";

import { useRef, useTransition } from "react";
import { Button } from "@/components/ui";
import { sendMessage } from "@/lib/actions/messages";

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const [pending, start] = useTransition();
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={(fd) =>
        start(async () => {
          await sendMessage(conversationId, fd);
          ref.current?.reset();
        })
      }
      className="flex items-end gap-2 border-t border-plum-100 bg-white p-3"
    >
      <textarea
        name="body"
        rows={1}
        required
        placeholder="Write a message…"
        className="max-h-32 min-h-[40px] flex-1 resize-y rounded-xl border border-plum-200 px-3 py-2 text-sm focus:border-plum-400 focus:outline-none focus:ring-2 focus:ring-plum-100"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send"}
      </Button>
    </form>
  );
}
