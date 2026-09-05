export type CategoryGroup =
  | "venue"
  | "decor"
  | "rentals"
  | "food"
  | "dessert"
  | "media"
  | "entertainment"
  | "stationery"
  | "beauty";

export type CategoryKey =
  | "venue"
  | "event_styling"
  | "balloons"
  | "backdrops"
  | "florals"
  | "flower_walls"
  | "props"
  | "signage"
  | "chairs"
  | "tables"
  | "linens"
  | "lounge_furniture"
  | "tents"
  | "dinnerware"
  | "specialty_rentals"
  | "private_chef"
  | "catering"
  | "charcuterie"
  | "bartender"
  | "mobile_bar"
  | "food_truck"
  | "cake"
  | "cupcakes"
  | "cookies"
  | "cake_pops"
  | "sweet_treats"
  | "photography"
  | "videography"
  | "content_creator"
  | "photobooth"
  | "dj"
  | "musician"
  | "kids_entertainment"
  | "face_painter"
  | "stationery"
  | "calligraphy"
  | "hair"
  | "makeup";

export interface CategoryGroupDef {
  key: CategoryGroup;
  label: string;
}

export const CATEGORY_GROUPS: CategoryGroupDef[] = [
  { key: "venue", label: "Venues" },
  { key: "decor", label: "Decor & styling" },
  { key: "rentals", label: "Rentals" },
  { key: "food", label: "Food & drinks" },
  { key: "dessert", label: "Desserts" },
  { key: "media", label: "Photo & video" },
  { key: "entertainment", label: "Entertainment" },
  { key: "stationery", label: "Stationery & signage" },
  { key: "beauty", label: "Beauty" },
];

export interface CategoryDef {
  key: CategoryKey;
  group: CategoryGroup;
  label: string;
  budgetShare: number;
}

export const CATEGORIES: CategoryDef[] = [
  { key: "venue", group: "venue", label: "Venue", budgetShare: 0.28 },

  { key: "event_styling", group: "decor", label: "Event stylist", budgetShare: 0.1 },
  { key: "balloons", group: "decor", label: "Balloon artist", budgetShare: 0.06 },
  { key: "backdrops", group: "decor", label: "Backdrops", budgetShare: 0.05 },
  { key: "florals", group: "decor", label: "Florist", budgetShare: 0.08 },
  { key: "flower_walls", group: "decor", label: "Flower walls", budgetShare: 0.06 },
  { key: "props", group: "decor", label: "Props & decor rentals", budgetShare: 0.05 },
  { key: "signage", group: "decor", label: "Event signage", budgetShare: 0.03 },

  { key: "chairs", group: "rentals", label: "Chairs", budgetShare: 0.04 },
  { key: "tables", group: "rentals", label: "Tables", budgetShare: 0.04 },
  { key: "linens", group: "rentals", label: "Linens", budgetShare: 0.03 },
  { key: "lounge_furniture", group: "rentals", label: "Lounge furniture", budgetShare: 0.06 },
  { key: "tents", group: "rentals", label: "Tents", budgetShare: 0.1 },
  { key: "dinnerware", group: "rentals", label: "Dinnerware & tabletop", budgetShare: 0.04 },
  { key: "specialty_rentals", group: "rentals", label: "Specialty rentals", budgetShare: 0.05 },

  { key: "private_chef", group: "food", label: "Private chef", budgetShare: 0.3 },
  { key: "catering", group: "food", label: "Catering", budgetShare: 0.3 },
  { key: "charcuterie", group: "food", label: "Charcuterie", budgetShare: 0.06 },
  { key: "bartender", group: "food", label: "Bartender", budgetShare: 0.06 },
  { key: "mobile_bar", group: "food", label: "Mobile bar", budgetShare: 0.07 },
  { key: "food_truck", group: "food", label: "Food truck", budgetShare: 0.16 },

  { key: "cake", group: "dessert", label: "Cake", budgetShare: 0.05 },
  { key: "cupcakes", group: "dessert", label: "Cupcakes", budgetShare: 0.03 },
  { key: "cookies", group: "dessert", label: "Cookies", budgetShare: 0.025 },
  { key: "cake_pops", group: "dessert", label: "Cake pops", budgetShare: 0.02 },
  { key: "sweet_treats", group: "dessert", label: "Other sweet treats", budgetShare: 0.03 },

  { key: "photography", group: "media", label: "Photographer", budgetShare: 0.09 },
  { key: "videography", group: "media", label: "Videographer", budgetShare: 0.07 },
  { key: "content_creator", group: "media", label: "Event content creator", budgetShare: 0.05 },
  { key: "photobooth", group: "media", label: "Photo booth", budgetShare: 0.04 },

  { key: "dj", group: "entertainment", label: "DJ", budgetShare: 0.08 },
  { key: "musician", group: "entertainment", label: "Musician / live music", budgetShare: 0.08 },
  { key: "kids_entertainment", group: "entertainment", label: "Kids entertainment", budgetShare: 0.05 },
  { key: "face_painter", group: "entertainment", label: "Face painter", budgetShare: 0.03 },

  { key: "stationery", group: "stationery", label: "Invitations & stationery", budgetShare: 0.03 },
  { key: "calligraphy", group: "stationery", label: "Calligraphy", budgetShare: 0.02 },

  { key: "hair", group: "beauty", label: "Hair stylist", budgetShare: 0.04 },
  { key: "makeup", group: "beauty", label: "Makeup artist", budgetShare: 0.04 },
];

export const CATEGORY_MAP: Record<string, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c] as [string, CategoryDef]),
);

export const GROUP_MAP: Record<string, CategoryGroupDef> = Object.fromEntries(
  CATEGORY_GROUPS.map((g) => [g.key, g] as [string, CategoryGroupDef]),
);



export interface EventTypeDef {
  key: string;
  label: string;
  suggested: CategoryKey[];
}

export const EVENT_TYPES: EventTypeDef[] = [
  { key: "birthday", label: "Birthday", suggested: ["venue", "catering", "cake", "cupcakes", "balloons", "backdrops", "photography", "dj"] },
  { key: "wedding", label: "Wedding", suggested: ["venue", "catering", "cake", "florals", "flower_walls", "backdrops", "photography", "videography", "dj", "bartender", "chairs", "tables", "linens"] },
  { key: "baby_shower", label: "Baby shower", suggested: ["venue", "catering", "cake", "cupcakes", "balloons", "florals", "photography"] },
  { key: "bridal_shower", label: "Bridal shower", suggested: ["venue", "catering", "cake", "charcuterie", "florals", "backdrops", "photography"] },
  { key: "graduation", label: "Graduation", suggested: ["catering", "cake", "cookies", "balloons", "photography", "dj"] },
  { key: "engagement", label: "Engagement", suggested: ["venue", "catering", "charcuterie", "florals", "backdrops", "photography", "bartender"] },
  { key: "anniversary", label: "Anniversary", suggested: ["venue", "catering", "cake", "florals", "photography", "dj"] },
  { key: "corporate", label: "Corporate event", suggested: ["venue", "catering", "bartender", "photography", "dj", "chairs", "tables"] },
  { key: "holiday", label: "Holiday party", suggested: ["venue", "catering", "charcuterie", "bartender", "dj", "photobooth", "balloons"] },
  { key: "custom", label: "Something else", suggested: ["venue", "catering", "cake", "balloons", "photography"] },
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

export function categoriesInGroup(group: string): CategoryDef[] {
  return CATEGORIES.filter((c) => c.group === group);
}

export function categoryLabel(key: string): string {
  return CATEGORY_MAP[key]?.label ?? key;
}
export function groupLabelForCategory(key: string): string {
  const g = CATEGORY_MAP[key]?.group;
  return g ? (GROUP_MAP[g]?.label ?? g) : "";
}
