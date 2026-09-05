
const STRIPE_API = "https://api.stripe.com/v1";

type StripeAccount = {
  id: string;
  details_submitted?: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  capabilities?: { transfers?: string; card_payments?: string };
  requirements?: { disabled_reason?: string | null; currently_due?: string[]; past_due?: string[] };
};

type StripeAccountLink = { url: string; expires_at?: number };

type StripeError = { error?: { message?: string; type?: string } };

function secretKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured yet. Add STRIPE_SECRET_KEY in Vercel.");
  return key;
}

function append(params: URLSearchParams, value: unknown, prefix = "") {
  if (value === undefined || value === null || value === "") return;
  if (typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      append(params, child, prefix ? `${prefix}[${key}]` : key);
    }
    return;
  }
  params.append(prefix, String(value));
}

export async function stripeRequest<T>(path: string, options?: { method?: "GET" | "POST"; params?: Record<string, unknown> }): Promise<T> {
  const method = options?.method ?? "GET";
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(options?.params ?? {})) append(body, value, key);
  const res = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: method === "POST" ? body.toString() : undefined,
    cache: "no-store",
  });
  const json = (await res.json()) as T & StripeError;
  if (!res.ok) throw new Error(json.error?.message ?? "Stripe request failed.");
  return json as T;
}

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export async function createFleoraConnectedAccount(input: { vendorId: string; businessName: string; email?: string | null }) {
  return stripeRequest<StripeAccount>("/accounts", {
    method: "POST",
    params: {
      country: "US",
      email: input.email ?? undefined,
      controller: {
        fees: { payer: "application" },
        losses: { payments: "application" },
        stripe_dashboard: { type: "express" },
      },
      capabilities: { transfers: { requested: true } },
      business_profile: { name: input.businessName },
      metadata: { fleora_vendor_id: input.vendorId },
    },
  });
}

export async function retrieveConnectedAccount(accountId: string) {
  return stripeRequest<StripeAccount>(`/accounts/${encodeURIComponent(accountId)}`);
}

export async function createOnboardingLink(accountId: string, baseUrl: string) {
  return stripeRequest<StripeAccountLink>("/account_links", {
    method: "POST",
    params: {
      account: accountId,
      refresh_url: `${baseUrl}/vendor/payments/refresh`,
      return_url: `${baseUrl}/vendor/payments?stripe=return`,
      type: "account_onboarding",
      collection_options: { fields: "eventually_due" },
    },
  });
}

export function accountState(account: StripeAccount) {
  const transfers = account.capabilities?.transfers ?? null;
  const ready = Boolean(account.details_submitted && account.payouts_enabled && transfers === "active");
  const restricted = Boolean(account.requirements?.past_due?.length || account.requirements?.disabled_reason);
  return {
    detailsSubmitted: Boolean(account.details_submitted),
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    transfersStatus: transfers,
    onboardingStatus: ready ? "ready" : restricted ? "restricted" : account.details_submitted ? "in_progress" : "in_progress",
  } as const;
}

export function appBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  throw new Error("Set NEXT_PUBLIC_APP_URL to your deployed Fleora URL before starting Stripe onboarding.");
}
