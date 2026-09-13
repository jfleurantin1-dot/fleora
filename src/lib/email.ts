
type EmailInput = {
  to: string;
  subject: string;
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://fleoraevents.com").replace(/\/$/, "");
}

export function absoluteFleoraUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${appUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function sendFleoraEmail(input: EmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FLEORA_EMAIL_FROM;

  // Email is additive to core Fleora actions. Missing email configuration should
  // never prevent a signup, claim, or admin approval from completing.
  if (!apiKey || !from || !input.to) {
    console.warn("Fleora email skipped: RESEND_API_KEY/FLEORA_EMAIL_FROM is not configured.");
    return { ok: false as const, skipped: true as const };
  }

  const body = escapeHtml(input.body).replaceAll("\n", "<br />");
  const heading = escapeHtml(input.heading);
  const cta = input.ctaLabel && input.ctaHref
    ? `<div style="margin-top:28px"><a href="${escapeHtml(absoluteFleoraUrl(input.ctaHref))}" style="display:inline-block;background:#5b2b82;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:12px">${escapeHtml(input.ctaLabel)}</a></div>`
    : "";

  const html = `<!doctype html><html><body style="margin:0;background:#f7f3fb;font-family:Arial,Helvetica,sans-serif;color:#2d2632"><div style="padding:36px 16px"><div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #ebe3f1;border-radius:20px;overflow:hidden"><div style="padding:26px 30px;background:#f5effa"><div style="font-family:Georgia,serif;font-size:32px;color:#512678;letter-spacing:-1px">fleora</div></div><div style="padding:32px 30px"><h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:28px;line-height:1.2;color:#302338">${heading}</h1><p style="margin:0;font-size:16px;line-height:1.65;color:#655b68">${body}</p>${cta}</div><div style="padding:20px 30px;border-top:1px solid #f0eaf3;font-size:12px;line-height:1.5;color:#8a7f8d">Fleora · Plan the party. Find the people to bring it to life.</div></div></div></body></html>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [input.to], subject: input.subject, html }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Fleora email failed", response.status, await response.text());
      return { ok: false as const, skipped: false as const };
    }

    return { ok: true as const, skipped: false as const };
  } catch (error) {
    console.error("Fleora email failed", error);
    return { ok: false as const, skipped: false as const };
  }
}
