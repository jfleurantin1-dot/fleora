export type CategoryGroup =
  | "venue"
  | "services"
  | "decor"
  | "stationery"
  | "rentals"
  | "food"
  | "dessert"
  | "media"
  | "entertainment"
  | "beauty";

export type CategoryKey =
  | "venue"
  | "outdoor_venue"
  | "event_planner"
  | "day_of_coordinator"
  | "event_styling"
  | "transportation"
  | "event_staff"
  | "custom_service"
  | "backdrops"
  | "balloons"
  | "florals"
  | "flower_walls"
  | "props"
  | "signage"
  | "stationery"
  | "calligraphy"
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
  | "ice_cream_truck"
  | "photography"
  | "videography"
  | "content_creator"
  | "photobooth"
  | "dj"
  | "mc_event_host"
  | "musician"
  | "kids_entertainment"
  | "performer"
  | "games_activities"
  | "inflatables"
  | "event_experience"
  | "face_painter"
  | "hair"
  | "makeup";

export interface CategoryGroupDef {
  key: CategoryGroup;
  label: string;
}

export const CATEGORY_GROUPS: CategoryGroupDef[] = [
  { key: "venue", label: "Venue" },
  { key: "services", label: "Event services" },
  { key: "decor", label: "Decor" },
  { key: "stationery", label: "Stationery & signage" },
  { key: "rentals", label: "Rentals" },
  { key: "food", label: "Food & drink" },
  { key: "dessert", label: "Desserts" },
  { key: "media", label: "Photo & video" },
  { key: "entertainment", label: "Entertainment" },
  { key: "beauty", label: "Beauty" },
];

export interface CategoryDef {
  key: CategoryKey;
  group: CategoryGroup;
  label: string;
  budgetShare: number;
  helper?: string;
}

export const CATEGORIES: CategoryDef[] = [
  // VENUE
  { key: "venue", group: "venue", label: "Venue", budgetShare: 0.28 },
  { key: "outdoor_venue", group: "venue", label: "Outdoor venue", budgetShare: 0.22 },

  // EVENT SERVICES
  { key: "event_planner", group: "services", label: "Event planner / coordinator", budgetShare: 0.08 },
  { key: "day_of_coordinator", group: "services", label: "Day-of event coordinator", budgetShare: 0.07 },
  { key: "event_styling", group: "services", label: "Event stylist", budgetShare: 0.1 },
  {
    key: "transportation",
    group: "services",
    label: "Transportation",
    budgetShare: 0.08,
    helper: "Limos, party buses, cars & event transportation",
  },
  { key: "event_staff", group: "services", label: "Event staff / servers", budgetShare: 0.06 },
  { key: "custom_service", group: "services", label: "Other event service", budgetShare: 0.04 },

  // DECOR
  { key: "backdrops", group: "decor", label: "Backdrops", budgetShare: 0.05 },
  { key: "balloons", group: "decor", label: "Balloon artist", budgetShare: 0.06 },
  { key: "florals", group: "decor", label: "Florals / florist", budgetShare: 0.08 },
  { key: "flower_walls", group: "decor", label: "Flower walls", budgetShare: 0.06 },
  { key: "props", group: "decor", label: "Props & decor rentals", budgetShare: 0.05 },
  { key: "signage", group: "decor", label: "Event signage", budgetShare: 0.03 },

  // STATIONERY & SIGNAGE
  { key: "stationery", group: "stationery", label: "Invitations & stationery", budgetShare: 0.03 },
  { key: "calligraphy", group: "stationery", label: "Calligraphy", budgetShare: 0.02 },

  // RENTALS
  { key: "chairs", group: "rentals", label: "Chairs", budgetShare: 0.04 },
  { key: "tables", group: "rentals", label: "Tables", budgetShare: 0.04 },
  { key: "linens", group: "rentals", label: "Linens", budgetShare: 0.03 },
  { key: "lounge_furniture", group: "rentals", label: "Lounge furniture", budgetShare: 0.06 },
  { key: "tents", group: "rentals", label: "Tents", budgetShare: 0.1 },
  { key: "dinnerware", group: "rentals", label: "Dinnerware & tabletop", budgetShare: 0.04 },
  { key: "specialty_rentals", group: "rentals", label: "Specialty rentals", budgetShare: 0.05 },

  // FOOD & DRINK
  { key: "private_chef", group: "food", label: "Private chef", budgetShare: 0.3 },
  { key: "catering", group: "food", label: "Catering", budgetShare: 0.3 },
  { key: "charcuterie", group: "food", label: "Charcuterie", budgetShare: 0.06 },
  {
    key: "mobile_bar",
    group: "food",
    label: "Mobile drink cart",
    budgetShare: 0.07,
    helper: "Lemonade carts, coffee carts, specialty drink carts & more",
  },
  {
    key: "bartender",
    group: "food",
    label: "Mobile bar / bartender",
    budgetShare: 0.06,
  },
  { key: "food_truck", group: "food", label: "Food truck", budgetShare: 0.16 },

  // DESSERTS
  { key: "cake", group: "dessert", label: "Cake", budgetShare: 0.05 },
  { key: "cupcakes", group: "dessert", label: "Cupcakes", budgetShare: 0.03 },
  { key: "cookies", group: "dessert", label: "Cookies", budgetShare: 0.025 },
  { key: "cake_pops", group: "dessert", label: "Cake pops", budgetShare: 0.02 },
  { key: "sweet_treats", group: "dessert", label: "Other sweet treats", budgetShare: 0.03 },
  { key: "ice_cream_truck", group: "dessert", label: "Ice cream truck", budgetShare: 0.06 },

  // PHOTO & VIDEO
  { key: "photography", group: "media", label: "Photographer", budgetShare: 0.09 },
  { key: "videography", group: "media", label: "Videographer", budgetShare: 0.07 },
  { key: "content_creator", group: "media", label: "Event content creator", budgetShare: 0.05 },
  { key: "photobooth", group: "media", label: "Photo booth", budgetShare: 0.04 },

  // ENTERTAINMENT
  { key: "dj", group: "entertainment", label: "DJ", budgetShare: 0.08 },
  { key: "mc_event_host", group: "entertainment", label: "MC / Event host", budgetShare: 0.05 },
  { key: "musician", group: "entertainment", label: "Musician / live music", budgetShare: 0.08 },
  { key: "kids_entertainment", group: "entertainment", label: "Kids entertainment", budgetShare: 0.05 },
  { key: "performer", group: "entertainment", label: "Performers", budgetShare: 0.06 },
  { key: "games_activities", group: "entertainment", label: "Games & activities", budgetShare: 0.05 },
  { key: "inflatables", group: "entertainment", label: "Bounce houses & inflatables", budgetShare: 0.06 },
  { key: "event_experience", group: "entertainment", label: "Event experiences", budgetShare: 0.06 },
  { key: "face_painter", group: "entertainment", label: "Face painter", budgetShare: 0.03 },

  // BEAUTY
  { key: "hair", group: "beauty", label: "Hair stylist", budgetShare: 0.04 },
  { key: "makeup", group: "beauty", label: "Makeup artist", budgetShare: 0.04 },
];
