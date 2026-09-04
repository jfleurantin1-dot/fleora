import Link from "next/link";

type Photo = { url: string };

export function EventMoodCover({
  photos,
  href,
  className = "",
  emptyLabel = "Add inspiration",
}: {
  photos: Photo[];
  href?: string;
  className?: string;
  emptyLabel?: string;
}) {
  const visible = photos.slice(0, 3);

  const content = visible.length ? (
    <div className={`grid h-full w-full overflow-hidden bg-ivory-100 ${visible.length === 1 ? "grid-cols-1" : "grid-cols-[1.45fr_.75fr]"}`}>
      <div className="relative min-h-0 overflow-hidden">
        <img src={visible[0].url} alt="Event inspiration" className="h-full w-full object-cover" />
      </div>
      {visible.length > 1 && (
        <div className="grid min-h-0 grid-rows-2 gap-1">
          <div className="overflow-hidden"><img src={visible[1].url} alt="Event inspiration" className="h-full w-full object-cover" /></div>
          <div className="relative overflow-hidden bg-plum-50">
            {visible[2] ? <img src={visible[2].url} alt="Event inspiration" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-blush-100 to-plum-100" />}
            {photos.length > 3 && <span className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-ink-900 shadow-sm">+{photos.length - 3}</span>}
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blush-50 via-ivory-50 to-plum-50">
      <div className="text-center">
        <span className="mx-auto grid h-10 w-10 place-items-center rounded-2xl bg-white text-plum-600 shadow-sm">✦</span>
        <p className="mt-2 text-xs font-bold text-plum-700">{emptyLabel}</p>
      </div>
    </div>
  );

  return href ? <Link href={href} className={`block overflow-hidden ${className}`}>{content}</Link> : <div className={`overflow-hidden ${className}`}>{content}</div>;
}
