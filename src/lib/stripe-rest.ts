const STRIPE_V2_CORE_API = "https://api.stripe.com/v2/core";
const STRIPE_V2_VERSION = "2026-08-26.dahlia";

type CapabilityStatus = "active" | "pending" | "restricted" | "unsupported" | string;

type StripeAccount = {
  id: string;
  object?: string;
  applied_configurations?: string[];
  configuration?: {
    recipient?: {
      applied?: boolean;
      capabilities?: {
        stripe_balance?: {
          payouts?: { status?: CapabilityStatus; status_details?: Array<{ code?: string }> };
          stripe_transfers?: { status?: CapabilityStatus; status_details?: Array<{ code?: string }> };
        };
      };
    };
  } | null;
  requirements?: {
    entries?: Array<{
      awaiting_action_from?: "user" | "stripe" | string;
      minimum_deadline?: { status?: "currently_due" | "eventually_due" | "past_due" | string } | null;
    }> | null;
    summary?: { minimum_deadline?: { status?: "currently_due" | "eventually_due" | "past_due" | string } | null } | null;
  } | null;
};

type StripeAccountLink = { url: string; expires_at?: string | number };
type StripeError = { error?: { message?: string; type?: string; code?: string } };

function secretKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured yet. Add STRIPE_SECRET_KEY in Vercel.");
  return key;
}

async function stripeV2Request<T>(
  path: string,
  options?: { method?: "GET" | "POST"; body?: Record<string, unknown>; include?: string[] },
): Promise<T> {
  const method = options?.method ?? "GET";
  const url = new URL(`${STRIPE_V2_CORE_API}${path}`);
  for (const value of options?.include ?? []) url.searchParams.append("include[]", value);

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Stripe-Version": STRIPE_V2_VERSION,
      ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
    },
    body: method === "POST" ? JSON.stringify(options?.body ?? {}) : undefined,
    cache: "no-store",
  });

  const json = (await res.json()) as T & StripeError;
  if (!res.ok) {
    const detail = json.error?.message ?? "Stripe request failed.";
    const code = json.error?.code ? ` (${json.error.code})` : "";
    throw new Error(`${detail}${code}`);
  }
  return json as T;
}

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export async function createFleoraConnectedAccount(input: { vendorId: string; businessName: string; email?: string | null }) {
  if (!input.email) {
    throw new Error("A vendor email address is required before connecting Stripe.");
  }

  return stripeV2Request<StripeAccount>("/accounts", {
    method: "POST",
    body: {
      contact_email: input.email,
      display_name: input.businessName,
      dashboard: "express",
      identity: { country: "us" },
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: { requested: true },
            },
          },
        },
      },
      defaults: {
        currency: "usd",
        responsibilities: {
          fees_collector: "application",
          losses_collector: "application",
        },
      },
      metadata: { fleora_vendor_id: input.vendorId },
      include: ["configuration.recipient", "identity", "requirements"],
    },
  });
}

export async function retrieveConnectedAccount(accountId: string) {
  return stripeV2Request<StripeAccount>(`/accounts/${encodeURIComponent(accountId)}`, {
    include: ["configuration.recipient", "identity", "requirements"],
  });
}

export async function createOnboardingLink(accountId: string, baseUrl: string) {
  return stripeV2Request<StripeAccountLink>("/account_links", {
    method: "POST",
    body: {
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: ["recipient"],
          refresh_url: `${baseUrl}/vendor/payments/refresh`,
          return_url: `${baseUrl}/vendor/payments?stripe=return`,
          collection_options: {
            fields: "eventually_due",
          },
        },
      },
    },
  });
}

export function accountState(account: StripeAccount) {
  const balance = account.configuration?.recipient?.capabilities?.stripe_balance;
  const transfers = balance?.stripe_transfers?.status ?? null;
  const payouts = balance?.payouts?.status ?? null;
  const entries = account.requirements?.entries ?? [];
  const hasUserRequirements = entries.some((entry) => entry.awaiting_action_from === "user");
  const hasPastDue = entries.some((entry) => entry.minimum_deadline?.status === "past_due");
  const ready = transfers === "active" && payouts === "active" && !hasUserRequirements;
  const restricted = transfers === "restricted" || payouts === "restricted" || hasPastDue;

  return {
    detailsSubmitted: !hasUserRequirements,
    // Fleora is merchant of record for V1 destination-charge payments, so connected
    // vendors only need recipient/transfer readiness rather than direct charge capability.
    chargesEnabled: transfers === "active",
    payoutsEnabled: payouts === "active",
    transfersStatus: transfers,
    onboardingStatus: ready ? "ready" : restricted ? "restricted" : "in_progress",
  } as const;
}

export function appBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  throw new Error("Set NEXT_PUBLIC_APP_URL to your deployed Fleora URL before starting Stripe onboarding.");
}
