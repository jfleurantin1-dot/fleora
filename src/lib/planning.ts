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
  { key: "balloons", label: "Balloon decor", description: "Garlands, arches, columns or custom balloon installations.", vendorCategory: "balloons" },
  { key: "florals", label: "Florals", description: "Fresh, faux or dried florals used throughout the event design.", vendorCategory: "florals" },
  { key: "table_setup", label: "Table setup / tablescape", description: "Linens, chargers, plates, glassware, napkins and tabletop styling.", vendorCategory: "dinnerware" },
  { key: "centerpieces", label: "Centerpieces", description: "Florals, candles, bud vases or statement pieces for guest tables.", vendorCategory: "event_styling" },
  { key: "linens", label: "Linens", description: "Tablecloths, runners, napkins and specialty fabrics.", vendorCategory: "linens" },
  { key: "treat_table", label: "Dessert / treat table", description: "Styled display area for cake, desserts or favors.", vendorCategory: "event_styling" },
  { key: "gift_table", label: "Gift table", description: "A designated styled area for cards and gifts.", vendorCategory: "event_styling" },
  { key: "party_favors", label: "Party favors", description: "Take-home gifts, favor packaging and personalized details.", vendorCategory: "event_styling" },
  { key: "custom_signage", label: "Custom signage", description: "Menus, seating signs, bar signs, table numbers and other event signage.", vendorCategory: "signage" },
  { key: "rentals", label: "Decor & specialty rentals", description: "Props, plinths, arches, furniture or other specialty rental pieces.", vendorCategory: "specialty_rentals" },
];

export function planChoiceLabel(choice: PlanChoice) {
  if (choice === "diy") return "DIY / I’ll handle it";
  if (choice === "hire") return "Hire a vendor";
  return "Undecided";
}
