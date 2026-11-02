export interface QuickFacts {
  capital: string;
  population: string;
  language: string;
  timezone: string;
}

export interface WeatherInfo {
  temperature: string;
  condition: string;
}

export interface Destination {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  attractionCount: number;
  quickFacts: QuickFacts;
  weather: WeatherInfo;
  bestTimeToVisit: string;
  gallery: string[];
}

export interface Attraction {
  id: string;
  name: string;
  slug: string;
  destinationId: string;
  image: string;
  description: string;
  location: string;
  rating: number;
  history: string;
  openingHours: string;
  facilities: string[];
  gallery: string[];
}

export interface ItineraryItem {
  title: string;
  activities: string[];
}

export interface Program {
  id: string;
  provider: string;
  name: string;
  slug: string;
  destinationId: string;
  attractionId: string;
  image: string;
  description: string;
  duration: string;
  price: number;
  rating: number;
  reviewsCount: number;
  category: 'Nature and Eco-Tourism' | 'Cultural Immersion' | 'Culinary Journey' | 'Community and Social Impact' | 'Adventure and Challenge';
  highlights: string[];
  included: string[];
  excluded: string[];
  meetingPoint: string;
  itinerary: ItineraryItem[];
  gallery: string[];
  maxGuestMin?: number | null;
  maxGuestMax?: number | null;
  minQuota?: number | null;
  maxQuota?: number | null;
  dateAvailability?: 'all_days' | 'weekdays' | 'weekends' | 'specific_dates' | string;
  date_availability?: string;
  availableDates?: string[];
  available_dates?: string[];
}

export interface Review {
  id: string;
  name: string;
  avatar: string;
  country: string;
  rating: number;
  text: string;
}

export interface BookingDetails {
  programId: string;
  travelDate: string;
  guests: number;
  name: string;
  email: string;
  phone: string;
  specialRequest?: string;
}

export interface AppConfigCredentialItem {
  icon: string;
  title: string;
  desc: string;
}

export interface AppConfigFooterLink {
  label: string;
  url: string;
}

export interface AppConfigBusinessHours {
  weekday: string;
  saturday: string;
  sunday: string;
}

export interface AppConfigContact {
  title: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  business_hours: AppConfigBusinessHours;
}

export interface AppConfigTeamMember {
  name: string;
  role: string;
  image: string;
  bio: string;
}

export interface AppConfigValueItem {
  icon: string;
  title: string;
  desc: string;
}

export interface AppConfigAbout {
  badge: string;
  title: string;
  description_1: string;
  description_2: string;
  image: string;
  vision_title: string;
  vision_desc: string;
  mission_title: string;
  mission_desc: string;
  values_badge: string;
  values_title: string;
  values: AppConfigValueItem[];
  team_badge: string;
  team_title: string;
  team_members: AppConfigTeamMember[];
}

export interface AppConfig {
  tax_percent: number;
  credentials: {
    subtitle: string;
    title: string;
    items: AppConfigCredentialItem[];
  };
  contact: AppConfigContact;
  about: AppConfigAbout;
  footer: {
    brand_description: string;
    address: string;
    phone: string;
    email: string;
    quick_links: AppConfigFooterLink[];
    support_links: AppConfigFooterLink[];
    copyright_text: string;
  };
}
