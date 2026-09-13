import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { CakeIcon, GiftIcon, UtensilsIcon, HeartIcon, BuildingIcon, SparkleIcon } from "@/components/icons";
import { getProfile } from "@/lib/auth";
import styles from "./landing.module.css";

const steps = [
  ["Plan your vision", "Set your date, style, and must-haves all in one place."],
  ["Find your vendors", "Discover and connect with event professionals."],
  ["Bring it together", "Keep track of the details and check things off with ease."],
];
const occasions = [
  { Icon: CakeIcon, label: "Birthdays" }, { Icon: GiftIcon, label: "Showers" },
  { Icon: UtensilsIcon, label: "Dinner parties" }, { Icon: HeartIcon, label: "Weddings" },
  { Icon: BuildingIcon, label: "Corporate events" }, { Icon: SparkleIcon, label: "And more" },
];
const vendors = [
  { label: "Catering", category: "catering", alt: "Colorful appetizers arranged for a celebration" },
  { label: "Photography", category: "photography", alt: "A photographer capturing an event" },
  { label: "Decor", category: "event_styling", alt: "Pastel balloons and flowers decorating an event" },
  { label: "Venues", category: "venue", alt: "An airy venue set for a celebration" },
];

export default async function Landing() {
  const profile = await getProfile();
  const appDest = profile ? profile.account_type === "vendor" ? "/vendor/dashboard" : "/dashboard" : "/waitlist";
  const cta = profile ? "Open Fleora" : "Join the waitlist";
  const directoryDest = profile ? "/vendors/browse" : "/waitlist";
  return (
    <div className={styles.page}>
      <a href="#main-content" className={styles.skip}>Skip to content</a>
      <header className={styles.header}>
        <BrandLogo compact />
        <nav aria-label="Main navigation" className={styles.nav}>
          <a href="#how">How it works</a><a href="#marketplace">Vendor directory</a><Link href="/signup?as=vendor">Vendor sign up</Link>
        </nav>
        <div className={styles.headerActions}>{!profile && <Link href="/login" className={styles.login}>Log in</Link>}<Link href={appDest} className={styles.button}>{cta}</Link></div>
      </header>
      <main id="main-content">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <h1 id="hero-title">Plan the party.<br /><em>Find the <span className={styles.lilacWord}>people</span></em> to bring it to life.</h1>
            <p>Fleora combines a party-planning workspace with a trusted local vendor marketplace — so you can organize every detail, find the right vendors, compare quotes, book, and pay in one place.</p>
            <div className={styles.actions}><Link href={appDest} className={styles.button}>{cta}</Link><Link href="/signup?as=vendor" className={`${styles.button} ${styles.vendorButton}`}>Vendor sign up</Link></div>
          </div>
          <div className={styles.heroPhoto}>
            <Image src="/images/landing/celebration.jpg" alt="Friends celebrating together around a garden dinner table" fill priority sizes="(max-width: 767px) 100vw, 55vw" className={styles.cover} />
          </div>
        </section>
        <section id="how" className={`${styles.container} ${styles.how}`} aria-labelledby="how-title">
          <h2 id="how-title">From the first idea to the final detail.</h2>
          <ol className={styles.steps}>{steps.map(([title, text], i) => <li key={title}><span className={styles.number}>0{i + 1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
        </section>
        <section id="planning" className={`${styles.container} ${styles.planning}`} aria-labelledby="planning-title">
          <h2 id="planning-title">All your plans. One happy place.</h2><p className={styles.subtitle}>Keep the details together, so you can enjoy the moment.</p>
          <figure className={styles.plannerFigure}>
            <Image src="/images/landing/planner.jpg" alt="Sample Fleora event planner showing a birthday dinner checklist, guest summary, and vendor navigation" width={1902} height={827} sizes="(max-width: 767px) 100vw, 1200px" />
            <figcaption>Sample planner preview. Customer access is coming soon.</figcaption>
          </figure>
        </section>
        <section id="marketplace" className={`${styles.container} ${styles.marketplaceIntro}`} aria-labelledby="marketplace-intro-title">
          <div className={styles.marketplaceStrip}>
            <p className={styles.marketplaceLabel}>The Fleora Marketplace</p>
            <h2 id="marketplace-intro-title">Vendor directory</h2>
            <p className={styles.marketplaceDescription}>Search local event professionals, keep inquiries organized, compare quotes, build your event team, and manage payments without bouncing between apps and DMs.</p>
            <ol className={styles.steps}>{[
              ["Discover local vendors", "Search by what your event actually needs."],
              ["Inquire & compare", "Keep conversations and quotes together."],
              ["Book & pay", "Manage vendor payments through Fleora."],
            ].map(([title, text], i) => <li key={title}><span className={styles.number}>0{i + 1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
          <div className={styles.vendorGrid}>{vendors.map((v,i) => <Link key={v.category} href={profile ? `/vendors/browse?category=${v.category}` : "/waitlist"} className={styles.vendorCard} aria-label={profile ? `Explore ${v.label.toLowerCase()} vendors` : `${v.label}: join the waitlist for access`}><div className={styles.vendorImage}><div className={styles.vendorSheet} style={{left:`-${i * 100}%`}}><Image src="/images/landing/vendors.jpg" alt={v.alt} fill sizes="(max-width: 767px) 200vw, 100vw" /></div></div><span>{v.label}<span aria-hidden="true">↗</span></span></Link>)}</div>
            <div className={styles.directoryAction}><Link href={directoryDest} className={styles.button}>{profile ? "Explore vendors" : "Get directory access"}</Link></div>
          </div>
        </section>
        <section className={`${styles.container} ${styles.celebrations}`} aria-labelledby="celebrations-title"><div className={styles.occasionStrip}><h2 id="celebrations-title">Plan any kind of celebration</h2><ul>{occasions.map(({Icon,label}) => <li key={label}><Icon size={27} /><span>{label}</span></li>)}</ul></div></section>
        <section className={`${styles.container} ${styles.ctaSection}`} aria-labelledby="cta-title"><div className={styles.ctaStrip}><div><h2 id="cta-title">Your next celebration starts with Fleora.</h2><p>{profile ? "Bring your plans and your people together." : "Join the waitlist for customer launch updates."}</p></div><div className={styles.ctaActions}><Link href={appDest} className={styles.button}>{cta}</Link><p>Are you a vendor? <Link href="/signup?as=vendor">List your business <span aria-hidden="true">→</span></Link></p></div></div></section>
      </main>
      <footer className={`${styles.container} ${styles.footer}`}><BrandLogo compact /><nav aria-label="Footer navigation"><a href="#how">How it works</a><a href="#marketplace">Vendor directory</a><Link href="/signup?as=vendor">Vendor sign up</Link><Link href="/login">Log in</Link></nav></footer>
    </div>
  );
}
