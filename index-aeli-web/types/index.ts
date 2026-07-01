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
