import { ButtonLink } from "@/components/ui";
import { BrandLogo } from "@/components/brand-logo";
import {
  BalloonIcon,
  CalendarIcon,
  CameraIcon,
  CakeIcon,
  CheckIcon,
  MessageIcon,
  MusicIcon,
  SearchIcon,
  SparkleIcon,
  StoreIcon,
  TableIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/icons";
import { getProfile } from "@/lib/auth";

const MARKETPLACE_STEPS = [
  { Icon: SearchIcon, title: "Discover local vendors", text: "Search by what your event actually needs." },
  { Icon: MessageIcon, title: "Inquire & compare", text: "Keep conversations and quotes together." },
  { Icon: WalletIcon, title: "Book & pay", text: "Manage vendor payments through Fleora." },
];

const PLANNING_TOOLS = [
  "Theme & mood board",
  "Invitations & RSVPs",
  "Guest list",
  "Checklist",
  "Budget",
  "Timeline",
];

const CATEGORIES = [
  { Icon: BalloonIcon, label: "Decor" },
  { Icon: CakeIcon, label: "Cakes & Treats" },
  { Icon: TableIcon, label: "Rentals" },
  { Icon: MusicIcon, label: "Entertainment" },
  { Icon: CameraIcon, label: "Photo & Video" },
  { Icon: StoreIcon, label: "Venues & Services" },
];

export default async function Landing() {
  const profile = await getProfile();
  const appDest = profile
    ? profile.account_type === "vendor"
      ? "/vendor/dashboard"
      : "/dashboard"
    : "/signup";
  const marketplaceDest = profile && profile.account_type !== "vendor" ? "/vendors/browse" : "/signup";

  return (
    <main className="min-h-screen bg-[#FCFBFD] text-[#281642]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-6">
        <BrandLogo />
        <nav className="hidden items-center gap-7 text-sm md:flex">
          <a href="#marketplace" className="transition hover:text-plum-600">Marketplace</a>
          <a href="#planning" className="transition hover:text-plum-600">Planning Tools</a>
          <a href="#how" className="transition hover:text-plum-600">How It Works</a>
          <a href="/signup?as=vendor" className="transition hover:text-plum-600">For Vendors</a>
        </nav>
        <div className="flex gap-2">
          {profile ? (
            <ButtonLink href={appDest} size="sm">Open Fleora</ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="secondary" size="sm">Log In</ButtonLink>
              <ButtonLink href="/signup" size="sm">Get Started</ButtonLink>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:pb-24 lg:pt-20">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-plum-100 bg-plum-50 px-4 py-2 text-xs font-semibold uppercase tracking-[.16em] text-plum-700">
            <SparkleIcon size={15} /> Plan it. Find it. Book it.
          </div>
          <h1 className="font-display text-5xl leading-[.96] tracking-[-.03em] sm:text-7xl">
            Plan the party.<br />
            <span className="text-plum-500 italic">Find the people</span><br />
            to bring it to life.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-relaxed text-ink-600 sm:text-lg">
            Fleora combines a party-planning workspace with a trusted local vendor marketplace — so you can organize every detail, find the right vendors, compare quotes, book, and pay in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={appDest} size="lg" className="min-w-48">Start an Event →</ButtonLink>
            <ButtonLink href={marketplaceDest} variant="secondary" size="lg" className="min-w-48">Find Vendors</ButtonLink>
          </div>
          <p className="mt-4 text-xs text-ink-500">Planning a birthday, shower, graduation, dinner party, celebration — or anything in between.</p>
        </div>

        <div className="relative overflow-hidden rounded-[32px] border border-[#E9DFED] bg-gradient-to-br from-[#F1E8F6] via-white to-[#F7EEF1] p-5 shadow-fleora sm:p-7">
          <div className="rounded-[26px] border border-white bg-white/90 p-5 shadow-lift backdrop-blur sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="fleora-kicker">Your event command center</p>
                <h2 className="mt-2 font-display text-3xl">Baby Shower</h2>
                <p className="mt-1 text-sm text-ink-500">May 16 · 75 guests</p>
              </div>
              <span className="rounded-full bg-[#EDF5EF] px-3 py-1 text-xs font-medium text-[#42654A]">Planning</span>
            </div>

            <div className="mt-6 rounded-2xl bg-plum-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Planning progress</span>
                <span className="font-semibold text-plum-700">68%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full w-[68%] rounded-full bg-plum-500" />
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#EEE7F1] p-4">
                <p className="text-xs font-semibold uppercase tracking-[.13em] text-plum-500">Party Plan</p>
                <p className="mt-2 font-medium">Decor · Food · Entertainment</p>
                <p className="mt-1 text-xs text-ink-500">Build your plan chapter by chapter.</p>
              </div>
              <div className="rounded-2xl border border-[#EEE7F1] p-4">
                <p className="text-xs font-semibold uppercase tracking-[.13em] text-plum-500">Vendor Needs</p>
                <p className="mt-2 font-medium">4 vendors still needed</p>
                <p className="mt-1 text-xs text-ink-500">Fleora helps you find the right match.</p>
              </div>
              <div className="rounded-2xl border border-[#EEE7F1] p-4">
                <p className="text-xs font-semibold uppercase tracking-[.13em] text-plum-500">Guests</p>
                <p className="mt-2 font-medium">52 attending</p>
                <p className="mt-1 text-xs text-ink-500">RSVPs stay connected to your event.</p>
              </div>
              <div className="rounded-2xl border border-[#EEE7F1] p-4">
                <p className="text-xs font-semibold uppercase tracking-[.13em] text-plum-500">Payments</p>
                <p className="mt-2 font-medium">Vendor payments organized</p>
                <p className="mt-1 text-xs text-ink-500">Track deposits and balances together.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#ECE6F0] bg-[#F9F5FC] py-8">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-[.18em] text-plum-500">Everything your event might need</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-[#E7DDEA] bg-white px-4 py-4 shadow-sm">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-plum-50 text-plum-700"><Icon size={18} /></span>
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="marketplace" className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div className="max-w-xl">
            <p className="fleora-kicker">The Fleora Marketplace</p>
            <h2 className="mt-3 font-display text-4xl leading-[1.02] sm:text-5xl">Find the vendors your party actually needs.</h2>
            <p className="mt-5 leading-relaxed text-ink-600">
              Search local event professionals, keep inquiries organized, compare quotes, build your event team, and manage payments without bouncing between apps and DMs.
            </p>
            <ButtonLink href={marketplaceDest} size="lg" className="mt-7">Explore Vendors →</ButtonLink>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {MARKETPLACE_STEPS.map(({ Icon, title, text }, index) => (
              <div key={title} className="rounded-[24px] border border-[#E8DFEC] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-plum-50 text-plum-700"><Icon size={20} /></span>
                  <span className="font-display text-3xl text-plum-200">0{index + 1}</span>
                </div>
                <h3 className="mt-5 font-display text-2xl">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="planning" className="bg-[#F5EEF8] py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div className="order-2 rounded-[30px] border border-white/80 bg-white/75 p-6 shadow-fleora lg:order-1 sm:p-8">
            <p className="fleora-kicker">My Party Plan</p>
            <h3 className="mt-2 font-display text-3xl">Plan the whole event, not just the vendors.</h3>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {PLANNING_TOOLS.map((tool) => (
                <div key={tool} className="flex items-center gap-3 rounded-2xl border border-[#ECE4EF] bg-white p-4 text-sm font-medium">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F3EBF7] text-plum-700"><CheckIcon size={16} /></span>
                  {tool}
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 max-w-xl lg:order-2 lg:pl-6">
            <p className="fleora-kicker">The Fleora Planner</p>
            <h2 className="mt-3 font-display text-4xl leading-[1.02] sm:text-5xl">From the first idea to event day.</h2>
            <p className="mt-5 leading-relaxed text-ink-600">
              Build your vision, organize guests, plan decor, food, services and entertainment, then turn the pieces you need help with into vendor searches — without starting over.
            </p>
            <ButtonLink href={appDest} size="lg" className="mt-7">Start Planning →</ButtonLink>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="fleora-kicker">One connected experience</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl">Plan first. Fleora helps you source the rest.</h2>
          <p className="mt-5 leading-relaxed text-ink-600">Your planning choices can become vendor needs, so the marketplace works around your event instead of making you search from scratch.</p>
        </div>
        <div className="mt-10 grid gap-3 md:grid-cols-4">
          {[
            [CalendarIcon, "Plan", "Create your event and map out what you need."],
            [SparkleIcon, "Define", "Choose your vision, decor, food and services."],
            [UsersIcon, "Source", "Find local vendors for the pieces you want to hire out."],
            [WalletIcon, "Book", "Compare, book and manage payments in Fleora."],
          ].map(([Icon, title, text], index) => {
            const StepIcon = Icon as typeof CalendarIcon;
            return (
              <div key={title as string} className="relative rounded-[24px] border border-[#E8DFEC] bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-plum-50 text-plum-700"><StepIcon size={19} /></span>
                  <span className="text-xs font-semibold tracking-[.16em] text-plum-300">STEP {index + 1}</span>
                </div>
                <h3 className="mt-5 font-display text-2xl">{title as string}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{text as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-6 lg:pb-24">
        <div className="grid overflow-hidden rounded-[30px] bg-[#2E1744] text-white lg:grid-cols-2">
          <div className="p-7 sm:p-10 lg:p-12">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#D8C0E6]">Planning an event?</p>
            <h2 className="mt-3 font-display text-4xl">Your party starts here.</h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70">Create your event, build your plan and find the vendors who can bring it together.</p>
            <ButtonLink href={appDest} size="lg" className="mt-7">Create My Event →</ButtonLink>
          </div>
          <div className="border-t border-white/10 bg-white/[.06] p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#D8C0E6]">Are you an event vendor?</p>
            <h2 className="mt-3 font-display text-4xl">Get discovered on Fleora.</h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70">Create your vendor presence, receive inquiries and connect with clients planning real events.</p>
            <ButtonLink href="/signup?as=vendor" variant="secondary" size="lg" className="mt-7">Join as a Vendor →</ButtonLink>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#ECE6F0] px-5 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <BrandLogo compact />
          <span className="text-[10px] uppercase tracking-[.28em] text-plum-500">Plan beautifully. Book confidently.</span>
        </div>
      </footer>
    </main>
  );
}
