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

export function planChoiceLabel(choice: PlanChoice) {
  if (choice === "diy") return "DIY / I’ll handle it";
  if (choice === "hire") return "Hire a vendor";
  return "Undecided";
}
