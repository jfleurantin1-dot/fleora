import type { CategoryKey } from "@/lib/constants";

export type PlanChoice = "diy" | "hire" | "undecided";

export type DecorPlanDefinition = {
  key: string;
  label: string;
  description: string;
  vendorCategory: CategoryKey | null;
};

export const DECOR_PLAN_ITEMS: DecorPlanDefinition[] = [
  { key: "welcome_sign", label: "Welcome sign", description: "A statement sign to greet guests and introduce the event style.", vendorCategory: "signage" },
  { key: "focal_backdrop", label: "Focal backdrop", description: "The main photo moment, feature wall or focal installation.", vendorCategory: "backdrops" },
  { key: "table_setup", label: "Table setup / tablescape", description: "The complete tabletop look — linens, place settings, napkins and styling.", vendorCategory: "dinnerware" },
  { key: "centerpieces", label: "Centerpieces", description: "Florals, candles, bud vases or statement pieces for guest tables.", vendorCategory: "event_styling" },
  { key: "balloons", label: "Balloon decor", description: "Garlands, arches, columns or custom balloon installations.", vendorCategory: "balloons" },
  { key: "party_favors", label: "Party favors", description: "Take-home gifts, favor packaging and personalized details.", vendorCategory: "event_styling" },
  { key: "custom_signage", label: "Custom signage", description: "Menus, bar signs, table numbers and other personalized event signage.", vendorCategory: "signage" },
  { key: "other_custom", label: "Other / custom", description: "Something unique that isn't listed above — tell Fleora what you're planning.", vendorCategory: "event_styling" },
];

export type FoodDrinkGroup = "food" | "drinks";
export type FoodDrinkPlanDefinition = {
  key: string;
  label: string;
  description: string;
  group: FoodDrinkGroup;
  vendorCategory: CategoryKey | null;
  mode: "cook_or_hire" | "hire_only" | "potluck" | "diy_or_hire" | "shopping" | "liquor";
};

export const FOOD_DRINK_PLAN_ITEMS: FoodDrinkPlanDefinition[] = [
  { key: "catering", label: "Catering", description: "Plan the meal yourself or hire a caterer for buffet, plated, stations or drop-off service.", group: "food", vendorCategory: "catering", mode: "cook_or_hire" },
  { key: "private_chef", label: "Private chef", description: "Bring in a chef for an on-site meal or culinary experience.", group: "food", vendorCategory: "private_chef", mode: "hire_only" },
  { key: "potluck", label: "Potluck", description: "Build a shared list of dishes and keep track of who is bringing what.", group: "food", vendorCategory: null, mode: "potluck" },
  { key: "food_truck", label: "Food truck", description: "Bring a mobile food concept directly to your event.", group: "food", vendorCategory: "food_truck", mode: "hire_only" },
  { key: "charcuterie", label: "Charcuterie", description: "Create your own grazing spread or hire a charcuterie vendor.", group: "food", vendorCategory: "charcuterie", mode: "diy_or_hire" },
  { key: "non_alcoholic_drinks", label: "Water, sodas & juice", description: "Choose the non-alcoholic drinks you plan to serve and add them to your shopping list.", group: "drinks", vendorCategory: null, mode: "shopping" },
  { key: "liquor", label: "Liquor", description: "Plan mocktails, beer/wine, cocktails or signature drinks — and decide whether you need a bartender.", group: "drinks", vendorCategory: "bartender", mode: "liquor" },
];

export function planChoiceLabel(choice: PlanChoice) {
  if (choice === "diy") return "DIY / I’ll handle it";
  if (choice === "hire") return "Hire a vendor";
  return "Undecided";
}


export type ServicePlanDefinition = {
  key: string;
  label: string;
  description: string;
  vendorCategory: CategoryKey;
};

export const SERVICE_PLAN_ITEMS: ServicePlanDefinition[] = [
  { key: "photographer", label: "Photographer", description: "Capture the event, portraits and the moments you do not want to miss.", vendorCategory: "photography" },
  { key: "videographer", label: "Videographer", description: "Preserve highlights, speeches and candid moments on video.", vendorCategory: "videography" },
  { key: "photobooth", label: "Photo booth", description: "Give guests an interactive photo experience and take-home memories.", vendorCategory: "photobooth" },
  { key: "event_planner", label: "Event planner / coordinator", description: "Get help planning, coordinating vendors or managing the event day.", vendorCategory: "event_planner" },
  { key: "hair", label: "Hair", description: "Book event-day hairstyling for you or your party.", vendorCategory: "hair" },
  { key: "makeup", label: "Makeup", description: "Book makeup services for you or your party.", vendorCategory: "makeup" },
  { key: "event_staff", label: "Event staff / servers", description: "Add servers or event staff to help with setup, service and guest needs.", vendorCategory: "event_staff" },
  { key: "other_custom_service", label: "Other / custom service", description: "Add another service your event needs that is not listed above.", vendorCategory: "custom_service" },
];
