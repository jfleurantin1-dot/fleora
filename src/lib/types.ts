/**
 * Hand-authored database types.
 *
 * These are object *type aliases* (not interfaces) on purpose: supabase-js
 * requires each table's Row/Insert/Update to be assignable to
 * `Record<string, unknown>`, which named interfaces are not. Once the Supabase
 * CLI is linked you can regenerate this file:
 *   supabase gen types typescript --linked > src/lib/types.ts
 */

export type AccountType = "client" | "vendor" | "admin";
export type EventStatus = "planning" | "active" | "completed" | "cancelled";
export type VendorStatus = "pending" | "approved" | "suspended";
export type RequestStatus = "open" | "quoted" | "booked" | "closed";
export type QuoteStatus = "sent" | "accepted" | "declined" | "expired";
export type BookingStatus = "pending_deposit" | "confirmed" | "completed" | "cancelled";
export type RsvpStatus = "pending" | "yes" | "no";

export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  account_type: AccountType;
  profile_photo: string | null;
  created_at: string;
};

export type EventRow = {
  id: string;
  client_id: string;
  name: string;
  event_type: string;
  event_date: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  guest_count: number | null;
  budget: number | null;
  style: string | null;
  color_palette: string | null;
  status: EventStatus;
  created_at: string;
};

export type EventInspirationPhoto = {
  id: string;
  event_id: string;
  url: string;
  sort: number;
  created_at: string;
};

export type Vendor = {
  id: string;
  user_id: string | null;
  business_name: string;
  description: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  service_radius_miles: number;
  rating: number;
  review_count: number;
  verified: boolean;
  response_rate: number;
  status: VendorStatus;
  website: string | null;
  instagram: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  source: string;
  created_at: string;
};

export type VendorClaim = {
  id: string;
  vendor_id: string;
  claimant_id: string;
  note: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
};

export type VendorCategory = {
  vendor_id: string;
  category: string;
};


export type VendorUnavailableDate = {
  id: string;
  vendor_id: string;
  unavailable_date: string;
  note: string | null;
  created_at: string;
};
export type VendorPhoto = {
  id: string;
  vendor_id: string;
  url: string;
  sort: number;
};

export type Service = {
  id: string;
  vendor_id: string;
  category: string;
  name: string;
  description: string | null;
  starting_price: number | null;
};

export type Package = {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number | null;
};

export type EventRequest = {
  id: string;
  event_id: string;
  category: string;
  notes: string | null;
  status: RequestStatus;
  created_at: string;
};

export type Conversation = {
  id: string;
  event_id: string;
  client_id: string;
  vendor_id: string;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  attachment_url: string | null;
  created_at: string;
};

export type Quote = {
  id: string;
  event_id: string;
  vendor_id: string;
  request_id: string | null;
  category: string;
  status: QuoteStatus;
  subtotal: number;
  deposit: number;
  total: number;
  notes: string | null;
  expires_at: string | null;
  created_at: string;
};

export type QuoteItem = {
  id: string;
  quote_id: string;
  label: string;
  amount: number;
  sort: number;
};

export type Booking = {
  id: string;
  event_id: string;
  vendor_id: string;
  quote_id: string;
  category: string;
  status: BookingStatus;
  total: number;
  deposit_paid: number;
  balance: number;
  created_at: string;
};

export type Review = {
  id: string;
  booking_id: string;
  client_id: string;
  vendor_id: string;
  rating: number;
  communication: number | null;
  quality: number | null;
  value: number | null;
  comment: string | null;
  verified: boolean;
  created_at: string;
};

export type Guest = {
  id: string;
  event_id: string;
  name: string;
  email: string | null;
  party_size: number;
  rsvp: RsvpStatus;
  dietary: string | null;
  created_at: string;
};

export type ChecklistItem = {
  id: string;
  event_id: string;
  title: string;
  weeks_before: number | null;
  done: boolean;
  sort: number;
};

/** Row shape returned by the match_vendors() RPC. */
export type VendorMatch = {
  vendor_id: string;
  business_name: string;
  description: string | null;
  location: string | null;
  rating: number | null;
  review_count: number | null;
  verified: boolean;
  starting_price: number | null;
  distance_miles: number | null;
  hero_photo: string | null;
  match_score: number;
  availability_score: number;
  location_score: number;
  budget_score: number;
  style_score: number;
  review_score: number;
};

/**
 * supabase-js's GenericSchema check requires every Row/Insert/Update to be
 * assignable to `Record<string, unknown>`. Named-ish object types don't carry
 * that index signature, so we add it here via intersection. The concrete field
 * types on `Row` still flow through for read inference.
 */
type TableDef<Row> = {
  Row: Row & Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<Profile>;
      events: TableDef<EventRow>;
      event_inspiration_photos: TableDef<EventInspirationPhoto>;
      vendors: TableDef<Vendor>;
      vendor_claims: TableDef<VendorClaim>;
      vendor_categories: TableDef<VendorCategory>;
      vendor_photos: TableDef<VendorPhoto>;
      vendor_unavailable_dates: TableDef<VendorUnavailableDate>;
      services: TableDef<Service>;
      packages: TableDef<Package>;
      event_requests: TableDef<EventRequest>;
      conversations: TableDef<Conversation>;
      messages: TableDef<Message>;
      quotes: TableDef<Quote>;
      quote_items: TableDef<QuoteItem>;
      bookings: TableDef<Booking>;
      reviews: TableDef<Review>;
      guests: TableDef<Guest>;
      checklist_items: TableDef<ChecklistItem>;
    };
    Views: Record<string, never>;
    Functions: {
      match_vendors: {
        Args: { p_event_id: string; p_category: string };
        Returns: VendorMatch[];
      };
      seed_event_checklist: {
        Args: { p_event_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      account_type: AccountType;
      event_status: EventStatus;
      vendor_status: VendorStatus;
      request_status: RequestStatus;
      quote_status: QuoteStatus;
      booking_status: BookingStatus;
      rsvp_status: RsvpStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
