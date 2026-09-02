export type CategoryKey =
  | "venue"
  | "catering"
  | "cake"
  | "decor"
  | "balloons"
  | "florals"
  | "rentals"
  | "photography"
  | "videography"
  | "dj"
  | "photobooth"
  | "bartender"
  | "signage";

export interface CategoryDef {
  key: CategoryKey;
  label: string;
  emoji: string;
  /** rough share of a typical event budget — drives the planning estimate */
  budgetShare: number;
}

export const CATEGORIES: CategoryDef[] = [
  { key: "venue", label: "Venue", emoji: "🏛️", budgetShare: 0.28 },
  { key: "catering", label: "Catering", emoji: "🍽️", budgetShare: 0.3 },
  { key: "cake", label: "Cake & desserts", emoji: "🍰", budgetShare: 0.05 },
  { key: "decor", label: "Decor & styling", emoji: "🎀", budgetShare: 0.12 },
  { key: "balloons", label: "Balloons", emoji: "🎈", budgetShare: 0.05 },
  { key: "florals", label: "Florals", emoji: "🌸", budgetShare: 0.08 },
  { key: "rentals", label: "Tables, chairs & linens", emoji: "🪑", budgetShare: 0.08 },
  { key: "photography", label: "Photography", emoji: "📸", budgetShare: 0.09 },
  { key: "videography", label: "Videography", emoji: "🎥", budgetShare: 0.07 },
  { key: "dj", label: "DJ & entertainment", emoji: "🎧", budgetShare: 0.09 },
  { key: "photobooth", label: "Photo booth", emoji: "🪩", budgetShare: 0.04 },
  { key: "bartender", label: "Bartending", emoji: "🍸", budgetShare: 0.06 },
  { key: "signage", label: "Signage & paper", emoji: "🖼️", budgetShare: 0.03 },
];

export const CATEGORY_MAP: Record<string, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c] as [string, CategoryDef]),
);

export function categoryLabel(key: string): string {
  return CATEGORY_MAP[key]?.label ?? key;
}
export function categoryEmoji(key: string): string {
  return CATEGORY_MAP[key]?.emoji ?? "•";
}

export interface EventTypeDef {
  key: string;
  label: string;
  emoji: string;
  suggested: CategoryKey[];
}

export const EVENT_TYPES: EventTypeDef[] = [
  { key: "birthday", label: "Birthday", emoji: "🎂", suggested: ["venue", "catering", "cake", "decor", "balloons", "photography", "dj"] },
  { key: "wedding", label: "Wedding", emoji: "💍", suggested: ["venue", "catering", "cake", "florals", "decor", "photography", "videography", "dj", "bartender", "rentals"] },
  { key: "baby_shower", label: "Baby shower", emoji: "👶", suggested: ["venue", "catering", "cake", "decor", "balloons", "florals", "photography"] },
  { key: "bridal_shower", label: "Bridal shower", emoji: "💐", suggested: ["venue", "catering", "cake", "decor", "florals", "photography"] },
  { key: "graduation", label: "Graduation", emoji: "🎓", suggested: ["catering", "cake", "decor", "balloons", "photography", "dj"] },
  { key: "engagement", label: "Engagement", emoji: "💞", suggested: ["venue", "catering", "florals", "decor", "photography", "bartender"] },
  { key: "anniversary", label: "Anniversary", emoji: "🥂", suggested: ["venue", "catering", "cake", "florals", "photography", "dj"] },
  { key: "corporate", label: "Corporate event", emoji: "🏢", suggested: ["venue", "catering", "rentals", "photography", "dj", "bartender", "signage"] },
  { key: "holiday", label: "Holiday party", emoji: "🎄", suggested: ["venue", "catering", "decor", "dj", "bartender", "photobooth"] },
  { key: "custom", label: "Something else", emoji: "🎉", suggested: ["venue", "catering", "cake", "decor", "photography"] },
];

export const EVENT_TYPE_MAP: Record<string, EventTypeDef> = Object.fromEntries(
  EVENT_TYPES.map((e) => [e.key, e] as [string, EventTypeDef]),
);

export const STYLE_OPTIONS = [
  "modern elegant",
  "romantic garden",
  "bold & colorful",
  "minimal & neutral",
  "glam & luxe",
  "rustic",
  "whimsical",
  "classic",
];
