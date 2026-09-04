import Link from "next/link";

export function FlowerMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <g fill="currentColor">
        <ellipse cx="20" cy="9" rx="6.2" ry="9" />
        <ellipse cx="30.5" cy="16.5" rx="6.2" ry="9" transform="rotate(72 30.5 16.5)" />
        <ellipse cx="26.5" cy="29" rx="6.2" ry="9" transform="rotate(144 26.5 29)" />
        <ellipse cx="13.5" cy="29" rx="6.2" ry="9" transform="rotate(216 13.5 29)" />
        <ellipse cx="9.5" cy="16.5" rx="6.2" ry="9" transform="rotate(288 9.5 16.5)" />
      </g>
      <circle cx="20" cy="20" r="4" fill="#FBF9FC" />
    </svg>
  );
}

export function BrandLogo({ href = "/", compact = false, className = "" }: { href?: string; compact?: boolean; className?: string }) {
  return (
    <Link href={href} className={`inline-flex flex-col text-[#32145f] ${className}`} aria-label="Fleora home">
      <span className="flex items-center font-display text-[34px] leading-[.8] tracking-[-.045em]">
        <span>fle</span><FlowerMark className="mx-[1px] h-[25px] w-[25px] text-[#ad83d5]"/><span>ra</span>
      </span>
      {!compact && <span className="mt-2 text-[7px] font-semibold uppercase tracking-[.42em] text-[#5d4a73]">Events made simple</span>}
    </Link>
  );
}
