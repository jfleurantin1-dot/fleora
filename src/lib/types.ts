/**
 * Hand-authored database types.
 *
 * Once the Supabase CLI is set up you can replace this file with generated
 * types:  `supabase gen types typescript --local > src/lib/types.ts`
 */

export type AccountType = "client" | "vendor" | "admin";
export type EventStatus = "planning" | "active" | "completed" | "cancelled";
export type VendorStatus = "pending" | "approved" | "suspended";
export type RequestStatus = "open" | "quoted" | "booked" | "closed";
export type QuoteStatus = "sent" | "accepted" | "declined" | "expired";
export type BookingStatus = "pending_deposit" | "confirmed" | "completed" | "cancelled";
export type RsvpStatus = "pending" | "yes" | "no";

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  account_type: AccountType;
  profile_photo: string | null;
  created_at: string;
}

export interface EventRow {
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
}

export interface Vendor {
  id: string;
  user_id: string;
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
  created_at: string;
}

export interface VendorCategory {
  vendor_id: string;
  category: string;
}

export interface VendorPhoto {
  id: string;
  vendor_id: string;
  url: string;
  sort: number;
}

export interface Service {
  id: string;
  vendor_id: string;
  category: string;
  name: string;
  description: string | null;
  starting_price: number | null;
}

export interface Package {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number | null;
}

export interface EventRequest {
  id: string;
  event_id: string;
  category: string;
  notes: string | null;
  status: RequestStatus;
  created_at: string;
}

export interface Conversation {
  id: string;
  event_id: string;
  client_id: string;
  vendor_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  attachment_url: string | null;
  created_at: string;
}

export interface Quote {
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
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  label: string;
  amount: number;
  sort: number;
}

export interface Booking {
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
}

export interface Review {
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
}

export interface Guest {
  id: string;
  event_id: string;
  name: string;
  email: string | null;
  party_size: number;
  rsvp: RsvpStatus;
  dietary: string | null;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  event_id: string;
  title: string;
  weeks_before: number | null;
  done: boolean;
  sort: number;
}

/** Row shape returned by the match_vendors() RPC. */
export interface VendorMatch {
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
}

type Row<T> = T;
type Insert<T> = Partial<T>;
type Update<T> = Partial<T>;

interface TableDef<T> {
  Row: Row<T>;
  Insert: Insert<T>;
  Update: Update<T>;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<Profile>;
      events: TableDef<EventRow>;
      vendors: TableDef<Vendor>;
      vendor_categories: TableDef<VendorCategory>;
      vendor_photos: TableDef<VendorPhoto>;
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
}
