"use client";
import { useRef, useTransition } from "react";
import { Button } from "@/components/ui";
import { sendMessage } from "@/lib/actions/messages";
export function MessageComposer({ conversationId }: { conversationId: string }) {
 const [pending,start]=useTransition(); const ref=useRef<HTMLFormElement>(null);
 return <form ref={ref} action={fd=>start(async()=>{await sendMessage(conversationId,fd);ref.current?.reset();})} className="flex items-end gap-2 border-t border-[#E9E3E7] bg-white p-3 sm:p-4"><textarea name="body" rows={1} required placeholder="Write a message…" className="max-h-32 min-h-12 flex-1 resize-y rounded-2xl border border-[#E9E3E7] bg-ivory-50 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-plum-300 focus:outline-none focus:ring-4 focus:ring-plum-50"/><Button type="submit" disabled={pending}>{pending?"Sending…":"Send"}</Button></form>;
}
