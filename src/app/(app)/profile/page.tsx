import { requireProfile } from "@/lib/auth";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { initials } from "@/lib/format";

export default async function ProfilePage() {
  const profile = await requireProfile();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Your profile" subtitle="Your Fleora account and planning preferences." />
      <Card variant="feature" padding="lg">
        <div className="flex flex-wrap items-center gap-5">
          <div className="grid h-20 w-20 place-items-center rounded-full border border-plum-100 bg-white font-display text-2xl text-plum-700 shadow-sm">{initials(profile.first_name, profile.last_name)}</div>
          <div><p className="fleora-kicker">Fleora member</p><h2 className="mt-1 font-display text-3xl text-ink-900">{profile.first_name} {profile.last_name}</h2><p className="mt-1 text-sm capitalize text-ink-600">{profile.account_type} account</p></div>
        </div>
      </Card>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Card><p className="fleora-kicker">Planning</p><h3 className="mt-2 font-display text-xl text-ink-900">Your celebrations</h3><p className="mt-2 text-sm leading-relaxed text-ink-600">Open your event workspace to manage vendors, guests, budget and tasks.</p><ButtonLink href="/events" variant="secondary" className="mt-5 w-full">View my events</ButtonLink></Card>
        <Card><p className="fleora-kicker">Account</p><h3 className="mt-2 font-display text-xl text-ink-900">Profile settings</h3><p className="mt-2 text-sm leading-relaxed text-ink-600">Editable contact and personalization settings will live here as Fleora expands.</p><form action="/auth/signout" method="post" className="mt-5"><button className="text-sm font-bold text-plum-700 hover:underline">Sign out →</button></form></Card>
      </div>
    </div>
  );
}
