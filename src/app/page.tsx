import { ButtonLink } from "@/components/ui";
import { getProfile } from "@/lib/auth";

const STEPS = [
  { emoji: "✨", title: "Inspire", body: "Tell us what you're celebrating — date, location, guests, budget, vibe." },
  { emoji: "🤝", title: "Match", body: "Get matched with vetted local vendors, scored on fit for your event." },
  { emoji: "💬", title: "Compare", body: "Message vendors and compare standardized quotes side by side." },
  { emoji: "📅", title: "Book", body: "Accept a quote and it becomes a booking on your event dashboard." },
  { emoji: "📋", title: "Manage", body: "Track budget, guest list, checklist and payments in one place." },
];

export default async function Landing() {
  const profile = await getProfile();
  const dest = profile
    ? profile.account_type === "vendor"
      ? "/vendor/dashboard"
      : "/dashboard"
    : "/signup";

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex items-center justify-between">
        <span className="text-xl font-semibold tracking-tight text-plum-700">🌸 Fleora</span>
        <nav className="flex items-center gap-2 text-sm">
          {profile ? (
            <ButtonLink href={dest} variant="primary" size="sm">
              Open Fleora
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">
                Log in
              </ButtonLink>
              <ButtonLink href="/signup" variant="primary" size="sm">
                Get started
              </ButtonLink>
            </>
          )}
        </nav>
      </header>

      <section className="mt-16 max-w-2xl">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          Imagine it. Plan it. Find it.{" "}
          <span className="text-plum-600">Book it. Manage it.</span>
        </h1>
        <p className="mt-5 text-lg text-slate-600">
          Fleora turns an idea into a booked event. Describe your celebration, get matched with
          local vendors, compare quotes, message everyone, and manage the whole thing from one
          dashboard.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href={dest} size="lg">
            {profile ? "Open Fleora" : "Plan an event"}
          </ButtonLink>
          <ButtonLink href="/signup?as=vendor" variant="secondary" size="lg">
            List your business
          </ButtonLink>
        </div>
        <p className="mt-4 text-sm text-slate-400">Now matching vendors across Massachusetts.</p>
      </section>

      <section className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((s, i) => (
          <div key={s.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-plum-100">
            <div className="text-2xl">{s.emoji}</div>
            <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-plum-500">
              Step {i + 1}
            </div>
            <div className="text-base font-semibold text-slate-900">{s.title}</div>
            <p className="mt-1 text-sm text-slate-500">{s.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-20 rounded-3xl bg-plum-600 px-8 py-12 text-center text-white">
        <h2 className="text-2xl font-semibold">One event. One platform.</h2>
        <p className="mx-auto mt-2 max-w-xl text-plum-100">
          Stop juggling six vendors across texts, DMs and email threads. Fleora keeps every
          conversation, quote and payment attached to your event.
        </p>
        <div className="mt-6">
          <ButtonLink href={dest} variant="secondary" size="lg">
            {profile ? "Open Fleora" : "Get started free"}
          </ButtonLink>
        </div>
      </section>

      <footer className="mt-16 border-t border-plum-100 py-8 text-center text-sm text-slate-400">
        Fleora — MVP scaffold. Built with Next.js + Supabase.
      </footer>
    </main>
  );
}
