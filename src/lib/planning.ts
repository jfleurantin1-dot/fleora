import type { CategoryKey } from "@/lib/constants";

export type PlanChoice = "diy" | "hire" | "existing" | "undecided";

export type DecorPlanDefinition = {
  key: string;
  label: string;
  description: string;
  vendorCategory: CategoryKey | null;
};

export const DECOR_PLAN_ITEMS: DecorPlanDefinition[] = [
  { key: "welcome_sign", label: "Welcome sign", description: "A statement sign to greet guests and introduce the event style.", vendorCategory: "signage" },
  { key: "focal_backdrop", label: "Focal backdrop", description: "Plan your feature wall, flower wall, arches, or focal installation.", vendorCategory: "backdrops" },
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
  mode: "cook_or_hire" | "hire_only" | "potluck" | "diy_or_hire" | "shopping" | "liquor";
};

export const FOOD_DRINK_PLAN_ITEMS: FoodDrinkPlanDefinition[] = [
  { key: "catering", label: "Catering", description: "Plan the meal yourself or hire a caterer for buffet, plated, stations or drop-off service.", group: "food", vendorCategory: "catering", mode: "cook_or_hire" },
  { key: "private_chef", label: "Private chef", description: "Bring in a chef for an on-site meal or culinary experience.", group: "food", vendorCategory: "private_chef", mode: "hire_only" },
  { key: "potluck", label: "Potluck", description: "Build a shared list of dishes and keep track of who is bringing what.", group: "food", vendorCategory: null, mode: "potluck" },
  { key: "food_truck", label: "Food truck", description: "Bring a mobile food concept directly to your event.", group: "food", vendorCategory: "food_truck", mode: "hire_only" },
  { key: "charcuterie", label: "Charcuterie", description: "Create your own grazing spread or hire a charcuterie vendor.", group: "food", vendorCategory: "charcuterie", mode: "diy_or_hire" },

  { key: "cake", label: "Cake", description: "Plan your celebration cake — make or source it yourself, or hire a baker.", group: "dessert", vendorCategory: "cake", mode: "diy_or_hire" },
  { key: "cupcakes", label: "Cupcakes", description: "Add cupcakes to the dessert table or hire a baker to create them.", group: "dessert", vendorCategory: "cupcakes", mode: "diy_or_hire" },
  { key: "cookies", label: "Cookies", description: "Plan decorated cookies, classic cookies or custom favors for your guests.", group: "dessert", vendorCategory: "cookies", mode: "diy_or_hire" },
  { key: "cake_pops_dipped_treats", label: "Cake pops & dipped treats", description: "Cake pops, chocolate-covered treats, dipped pretzels, berries and other bite-size sweets.", group: "dessert", vendorCategory: "cake_pops", mode: "diy_or_hire" },
  { key: "ice_cream_truck", label: "Ice cream truck", description: "Bring an ice cream truck or mobile frozen-treat experience to your event.", group: "dessert", vendorCategory: "food_truck", mode: "hire_only" },
  { key: "other_dessert", label: "Other dessert", description: "Add another dessert or sweet treat that is not listed above.", group: "dessert", vendorCategory: "sweet_treats", mode: "diy_or_hire" },

  { key: "non_alcoholic_drinks", label: "Water, sodas & juice", description: "Choose the non-alcoholic drinks you plan to serve and add them to your shopping list.", group: "drinks", vendorCategory: null, mode: "shopping" },
  { key: "liquor", label: "Liquor", description: "Plan mocktails, beer/wine, cocktails or signature drinks — and decide whether you need a bartender.", group: "drinks", vendorCategory: "bartender", mode: "liquor" },
];

export function planChoiceLabel(choice: PlanChoice) {
  if (choice === "diy") return "DIY / I’ll handle it";
  if (choice === "hire") return "Hire a vendor";
  if (choice === "existing") return "I already have someone";
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


export type EntertainmentPlanDefinition = {
  key: string;
  label: string;
  description: string;
  vendorCategory: CategoryKey;
};

export const ENTERTAINMENT_PLAN_ITEMS: EntertainmentPlanDefinition[] = [
  { key: "dj", label: "DJ", description: "Keep the party moving with music, announcements and a dance-floor soundtrack.", vendorCategory: "dj" },
  { key: "live_music", label: "Live music / band", description: "Add a band, musician or live musical performance to your event.", vendorCategory: "musician" },
  { key: "kids_entertainment", label: "Kids entertainment", description: "Characters, magicians, balloon artists and other entertainment designed for younger guests.", vendorCategory: "kids_entertainment" },
  { key: "performers", label: "Performers", description: "Dancers, singers and specialty performers who create a memorable live moment.", vendorCategory: "custom_service" },
  { key: "games_activities", label: "Games & activities", description: "Lawn games, casino tables, arcade games and interactive activities for your guests.", vendorCategory: "specialty_rentals" },
  { key: "inflatables", label: "Bounce house / inflatables", description: "Bounce houses, obstacle courses, slides and other inflatable attractions.", vendorCategory: "specialty_rentals" },
  { key: "event_experiences", label: "Event experiences", description: "Caricature artists, live painting, permanent jewelry, charm bars, cigar rollers and other interactive experiences.", vendorCategory: "custom_service" },
  { key: "other_custom_entertainment", label: "Other / custom entertainment", description: "Add an entertainment idea that is not listed above.", vendorCategory: "custom_service" },
];


export type VenueLogisticsGroup = "rentals" | "logistics";
export type VenueLogisticsPlanDefinition = {
  key: string; label: string; description: string; group: VenueLogisticsGroup; vendorCategory: CategoryKey | null;
};
export const VENUE_LOGISTICS_PLAN_ITEMS: VenueLogisticsPlanDefinition[] = [
  { key:"tables", label:"Tables", description:"Guest, cocktail, buffet or specialty tables you need for the event.", group:"rentals", vendorCategory:"tables" },
  { key:"chairs", label:"Chairs", description:"Seating for guests, ceremonies, lounges or specialty areas.", group:"rentals", vendorCategory:"chairs" },
  { key:"linens", label:"Linens", description:"Tablecloths, runners, napkins and other event linens.", group:"rentals", vendorCategory:"linens" },
  { key:"tent_canopy", label:"Tent / canopy", description:"Weather coverage or a tented event setup for outdoor spaces.", group:"rentals", vendorCategory:"tents" },
  { key:"dance_floor", label:"Dance floor", description:"Add a dedicated dance floor or specialty floor treatment.", group:"rentals", vendorCategory:"specialty_rentals" },
  { key:"staging", label:"Staging", description:"A stage or riser for entertainment, speakers or focal moments.", group:"rentals", vendorCategory:"specialty_rentals" },
  { key:"other_rentals", label:"Other rentals", description:"Add another rental item that your event needs.", group:"rentals", vendorCategory:"specialty_rentals" },
  { key:"setup_breakdown", label:"Setup / breakdown help", description:"Extra hands for event setup, room flips, cleanup or breakdown.", group:"logistics", vendorCategory:"event_staff" },
  { key:"delivery_pickup", label:"Delivery / pickup coordination", description:"Keep rental and vendor deliveries, pickups and timing organized.", group:"logistics", vendorCategory:"custom_service" },
  { key:"parking_valet", label:"Parking / valet", description:"Plan guest parking, valet service or parking instructions.", group:"logistics", vendorCategory:"custom_service" },
  { key:"guest_transportation", label:"Guest transportation", description:"Shuttles or transportation between hotels, venues or event locations.", group:"logistics", vendorCategory:"custom_service" },
  { key:"restrooms", label:"Restrooms", description:"Confirm restroom access or arrange portable restroom service when needed.", group:"logistics", vendorCategory:"specialty_rentals" },
  { key:"power_generator", label:"Power / generator", description:"Plan electrical access, extension needs or backup generator power.", group:"logistics", vendorCategory:"specialty_rentals" },
  { key:"heating_cooling", label:"Heating / cooling", description:"Add heaters, fans or cooling equipment for guest comfort.", group:"logistics", vendorCategory:"specialty_rentals" },
  { key:"accessibility", label:"Accessibility needs", description:"Plan accessible entrances, seating, pathways and guest accommodations.", group:"logistics", vendorCategory:null },
  { key:"permits_requirements", label:"Permits / venue requirements", description:"Track permits, insurance, venue rules, load-in requirements or other restrictions.", group:"logistics", vendorCategory:null },
];
