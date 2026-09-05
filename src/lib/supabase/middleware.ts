import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/auth",
  "/forgot-password",
  "/reset-password",
  "/rsvp",
  "/api/stripe/webhook",
];

/** Refreshes the Supabase session and gates the /app area behind auth. */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Stripe sends webhooks server-to-server with no Fleora user session.
  // Let the webhook reach its route handler directly; the route verifies
  // Stripe's signature with STRIPE_WEBHOOK_SECRET.
  if (pathname === "/api/stripe/webhook") {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
