import { createElement } from "react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "magic" | "danger";
const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-plum-500 to-plum-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-plum-600 hover:shadow-fleora disabled:translate-y-0 disabled:opacity-60",
  secondary:
    "border border-plum-200 bg-white text-plum-700 shadow-sm hover:-translate-y-0.5 hover:border-plum-300 hover:bg-plum-50",
  ghost: "text-plum-700 hover:bg-plum-50",
  magic:
    "border border-blush-300 bg-gradient-to-br from-blush-50 via-blush-100 to-plum-100 text-plum-700 shadow-sm hover:-translate-y-0.5 hover:shadow-fleora",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
};
const sizes = {
  sm: "min-h-9 px-3 py-1.5 text-sm",
  md: "min-h-12 px-4 py-2.5 text-sm",
  lg: "min-h-[52px] px-6 py-3 text-base",
};
const base =
  "inline-flex items-center justify-center gap-2 rounded-[10px] font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-plum-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed";

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: keyof typeof sizes }) {
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: keyof typeof sizes }) {
  return <Link className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}

type CardVariant = "standard" | "feature" | "interactive" | "soft";
const cardVariants: Record<CardVariant, string> = {
  standard: "border-[#E8E1ED] bg-white shadow-fleora",
  feature: "border-[#E8E1ED] bg-white shadow-fleora",
  interactive:
    "border-[#E8E1ED] bg-white shadow-fleora transition duration-200 hover:-translate-y-0.5 hover:border-plum-200 hover:shadow-lift",
  soft: "border-transparent bg-plum-50/55 shadow-none",
};

export function Card({
  children,
  className = "",
  as = "div",
  variant = "standard",
  padding = "md",
  id,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
  id?: string;
}) {
  const paddingClass = { none: "", sm: "p-4", md: "p-5", lg: "p-6 sm:p-7" }[padding];
  return createElement(
    as,
    {
      id,
      className: `rounded-[14px] border ${cardVariants[variant]} ${paddingClass} ${className}`,
    },
    children,
  );
}

const inputCls =
  "min-h-12 w-full rounded-[10px] border border-[#E8E1ED] bg-white px-4 py-2.5 text-sm text-ink-900 shadow-sm placeholder:text-ink-400 transition focus:border-plum-300 focus:outline-none focus:ring-4 focus:ring-plum-50";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-ink-900">{label}</span>
      {children}
      {hint && <span className="block text-xs leading-relaxed text-ink-400">{hint}</span>}
    </label>
  );
}

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}
export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea {...props} className={`${inputCls} min-h-28 resize-y ${props.className ?? ""}`} />;
}
export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

const tones = {
  plum: "bg-plum-100 text-plum-700",
  green: "bg-sage-100 text-sage-700",
  amber: "bg-amber-100 text-amber-700",
  slate: "bg-slate-100 text-ink-600",
  rose: "bg-rose-100 text-rose-700",
  blush: "bg-blush-100 text-[#9B5065]",
  champagne: "bg-champagne-100 text-[#7C633A]",
};
export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function MatchScore({ score }: { score: number }) {
  const tone = score >= 90 ? "text-sage-700" : score >= 75 ? "text-plum-600" : "text-amber-600";
  return (
    <div className="flex items-center gap-1 rounded-full bg-sage-50 px-2.5 py-1">
      <span className={`text-sm font-bold leading-none ${tone}`}>{score}%</span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">match</span>
    </div>
  );
}

export function Stars({
  rating,
  count,
}: {
  rating: number | string | null;
  count?: number | null;
}) {
  const r = Number(rating ?? 0) || 0;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="text-champagne-600" aria-hidden>★</span>
      <span className="font-semibold text-ink-900">{r.toFixed(1)}</span>
      {count != null && <span className="text-ink-400">({count})</span>}
    </span>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-[14px] border border-dashed border-plum-200 bg-white/70 p-10 text-center shadow-fleora">
      <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-plum-50 text-xl text-plum-600"><span className="h-2 w-2 rounded-full bg-plum-400" /></div>
      <p className="font-display text-xl text-ink-900">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-600">{children}</div>}
    </div>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-plum-100">
      <div
        className="h-full rounded-full bg-gradient-to-r from-plum-400 to-plum-600 transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl leading-[1.08] text-ink-900 sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm leading-relaxed text-ink-600 sm:text-[15px]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionHeader({
  title,
  eyebrow,
  description,
  action,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="fleora-kicker mb-1">{eyebrow}</p>}
        <h2 className="font-display text-2xl leading-tight text-ink-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  meta,
  icon,
}: {
  label: string;
  value: ReactNode;
  meta?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Card variant="soft" className="min-h-[122px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">{label}</p>
          <div className="mt-2 text-2xl font-semibold text-ink-900">{value}</div>
          {meta && <div className="mt-1 text-xs text-ink-600">{meta}</div>}
        </div>
        {icon && <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg shadow-sm">{icon}</div>}
      </div>
    </Card>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{message}</p>;
}
