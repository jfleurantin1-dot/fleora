"use client";

import { useState } from "react";

export function CopyClaimLink({ vendorId }: { vendorId: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/vendors/${vendorId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button type="button" onClick={copy} className="inline-flex min-h-9 items-center rounded-xl border border-plum-200 bg-white px-3 py-1.5 text-sm font-semibold text-plum-700 transition hover:bg-plum-50">
      {copied ? "Claim link copied!" : "Copy claim link"}
    </button>
  );
}
