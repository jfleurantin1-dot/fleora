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

export type FoodDrinkGroup = "food" | "dessert" | "drinks";
export type FoodDrinkPlanDefinition = {
  key: string;
  label: string;
  description: string;
  group: FoodDrinkGroup;
  vendorCategory: CategoryKey | null;
  allowHire?: boolean;
  potluck?: boolean;
};

export const FOOD_DRINK_PLAN_ITEMS: FoodDrinkPlanDefinition[] = [
  { key: "potluck", label: "Potluck", description: "Plan who is bringing what and keep track of anything that is still needed.", group: "food", vendorCategory: null, allowHire: false, potluck: true },
  { key: "catering", label: "Catering", description: "Buffet, plated, stations or drop-off catering for your guest count and style.", group: "food", vendorCategory: "catering" },
  { key: "private_chef", label: "Private chef", description: "A chef-led meal or on-site culinary experience for your event.", group: "food", vendorCategory: "private_chef" },
  { key: "food_truck", label: "Food truck", description: "Bring a mobile food concept directly to your event.", group: "food", vendorCategory: "food_truck" },
  { key: "cake", label: "Cake", description: "Your celebration cake, including flavor, size, style and design inspiration.", group: "dessert", vendorCategory: "cake" },
  { key: "sweet_treats", label: "Desserts / sweet treats", description: "Cookies, cupcakes, cake pops, dessert cups or a mixed sweets spread.", group: "dessert", vendorCategory: "sweet_treats" },
  { key: "drinks", label: "Drinks", description: "Plan water, sodas, mocktails, beer/wine, cocktails or signature drinks.", group: "drinks", vendorCategory: null, allowHire: false },
  { key: "bartender", label: "Bartender", description: "Professional bartending service for cocktails, mocktails and beverage service.", group: "drinks", vendorCategory: "bartender" },
  { key: "mobile_bar", label: "Mobile bar", description: "A styled mobile bar setup that can include service, rentals and a visual focal point.", group: "drinks", vendorCategory: "mobile_bar" },
];

export function planChoiceLabel(choice: PlanChoice) {
  if (choice === "diy") return "DIY / I’ll handle it";
  if (choice === "hire") return "Hire a vendor";
  return "Undecided";
}
