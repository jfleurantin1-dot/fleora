export type CategoryGroup = "venue" | "dessert" | "food" | "media" | "decor" | "rentals";

export type CategoryKey =
  | "venue"
  | "cake"
  | "cupcakes"
  | "cookies"
  | "cake_pops"
  | "sweet_treats"
  | "private_chef"
  | "catering"
  | "charcuterie"
  | "bartender"
  | "photography"
  | "photobooth"
  | "videography"
  | "dj"
  | "balloons"
  | "backdrops"
  | "florals"
  | "flower_walls"
  | "chairs"
  | "tables"
  | "linens";

export interface CategoryGroupDef {
  key: CategoryGroup;
  label: string;
}

/** Display order of the groups. */
export const CATEGORY_GROUPS: CategoryGroupDef[] = [
  { key: "venue", label: "Venue" },
  { key: "dessert", label: "Dessert" },
  { key: "food", label: "Food & drinks" },
  { key: "media", label: "Photo & entertainment" },
  { key: "decor", label: "Decor" },
  { key: "rentals", label: "Rentals" },
];

export interface CategoryDef {
  key: CategoryKey;
  group: CategoryGroup;
  label: string;
  emoji: string;
  /** rough share of a typical event budget — drives the planning estimate */
  budgetShare: number;
}

export const CATEGORIES: CategoryDef[] = [
  { key: "venue", group: "venue", label: "Venue", emoji: "🏛️", budgetShare: 0.28 },

  { key: "cake", group: "dessert", label: "Cake", emoji: "🍰", budgetShare: 0.05 },
  { key: "cupcakes", group: "dessert", label: "Cupcakes", emoji: "🧁", budgetShare: 0.03 },
  { key: "cookies", group: "dessert", label: "Cookies", emoji: "🍪", budgetShare: 0.025 },
  { key: "cake_pops", group: "dessert", label: "Cake pops", emoji: "🍭", budgetShare: 0.02 },
  { key: "sweet_treats", group: "dessert", label: "Other sweet treats", emoji: "🍬", budgetShare: 0.03 },

  { key: "private_chef", group: "food", label: "Private chef", emoji: "👨‍🍳", budgetShare: 0.3 },
  { key: "catering", group: "food", label: "Catering", emoji: "🍽️", budgetShare: 0.3 },
  { key: "charcuterie", group: "food", label: "Charcuterie", emoji: "🧀", budgetShare: 0.06 },
  { key: "bartender", group: "food", label: "Bartender", emoji: "🍸", budgetShare: 0.06 },

  { key: "photography", group: "media", label: "Photographer", emoji: "📸", budgetShare: 0.09 },
  { key: "photobooth", group: "media", label: "Photo booth", emoji: "🪩", budgetShare: 0.04 },
  { key: "videography", group: "media", label: "Videographer", emoji: "🎥", budgetShare: 0.07 },
  { key: "dj", group: "media", label: "DJ", emoji: "🎧", budgetShare: 0.08 },

  { key: "balloons", group: "decor", label: "Balloons", emoji: "🎈", budgetShare: 0.06 },
  { key: "backdrops", group: "decor", label: "Backdrops", emoji: "🖼️", budgetShare: 0.05 },
  { key: "florals", group: "decor", label: "Florist", emoji: "🌸", budgetShare: 0.08 },
  { key: "flower_walls", group: "decor", label: "Flower wall", emoji: "🌺", budgetShare: 0.06 },

  { key: "chairs", group: "rentals", label: "Chairs", emoji: "🪑", budgetShare: 0.04 },
  { key: "tables", group: "rentals", label: "Tables", emoji: "🪵", budgetShare: 0.04 },
  { key: "linens", group: "rentals", label: "Linens", emoji: "🧵", budgetShare: 0.03 },
];

export const CATEGORY_MAP: Record<string, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c] as [string, CategoryDef]),
);

export const GROUP_MAP: Record<string, CategoryGroupDef> = Object.fromEntries(
  CATEGORY_GROUPS.map((g) => [g.key, g] as [string, CategoryGroupDef]),
);

export function categoriesInGroup(group: string): CategoryDef[] {
  return CATEGORIES.filter((c) => c.group === group);
}

export function categoryLabel(key: string): string {
  return CATEGORY_MAP[key]?.label ?? key;
}
export function categoryEmoji(key: string): string {
  return CATEGORY_MAP[key]?.emoji ?? "•";
}
export function groupLabelForCategory(key: string): string {
  const g = CATEGORY_MAP[key]?.group;
  return g ? (GROUP_MAP[g]?.label ?? g) : "";
}

export interface EventTypeDef {
  key: string;
  label: string;
  emoji: string;
  suggested: CategoryKey[];
}

export const EVENT_TYPES: EventTypeDef[] = [
  { key: "birthday", label: "Birthday", emoji: "🎂", suggested: ["venue", "catering", "cake", "cupcakes", "balloons", "backdrops", "photography", "dj"] },
  { key: "wedding", label: "Wedding", emoji: "💍", suggested: ["venue", "catering", "cake", "florals", "flower_walls", "backdrops", "photography", "videography", "dj", "bartender", "chairs", "tables", "linens"] },
  { key: "baby_shower", label: "Baby shower", emoji: "👶", suggested: ["venue", "catering", "cake", "cupcakes", "balloons", "florals", "photography"] },
  { key: "bridal_shower", label: "Bridal shower", emoji: "💐", suggested: ["venue", "catering", "cake", "charcuterie", "florals", "backdrops", "photography"] },
  { key: "graduation", label: "Graduation", emoji: "🎓", suggested: ["catering", "cake", "cookies", "balloons", "photography", "dj"] },
  { key: "engagement", label: "Engagement", emoji: "💞", suggested: ["venue", "catering", "charcuterie", "florals", "backdrops", "photography", "bartender"] },
  { key: "anniversary", label: "Anniversary", emoji: "🥂", suggested: ["venue", "catering", "cake", "florals", "photography", "dj"] },
  { key: "corporate", label: "Corporate event", emoji: "🏢", suggested: ["venue", "catering", "bartender", "photography", "dj", "chairs", "tables"] },
  { key: "holiday", label: "Holiday party", emoji: "🎄", suggested: ["venue", "catering", "charcuterie", "bartender", "dj", "photobooth", "balloons"] },
  { key: "custom", label: "Something else", emoji: "🎉", suggested: ["venue", "catering", "cake", "balloons", "photography"] },
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
