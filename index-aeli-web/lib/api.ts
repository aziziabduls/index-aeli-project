import { Destination, Attraction, Program, AppConfig } from '@/types';

// Resolve Gateway API Base URL depending on Server (Docker internal) or Client (Browser)
const getBaseApiUrl = (): string => {
  if (typeof window === 'undefined') {
    return (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7009') + '/api/v1';
  }
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7009') + '/api/v1';
};

const getMediaBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7009';
};

// Placeholder image for items without images — prevents Next.js empty src errors
const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=60';

// Helper to resolve media URLs
function getMediaUrl(url: string | null | undefined): string {
  if (!url) return PLACEHOLDER_IMG;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${getMediaBaseUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
}

// Helper to unwrap { success, data } API responses
async function fetchApi<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? json;
  } catch {
    return null;
  }
}

// Map snake_case destination from API to camelCase frontend type
function mapDestination(d: Record<string, unknown>): Destination {
  if (!d || typeof d !== 'object' || Array.isArray(d)) {
    return {
      id: '',
      name: '',
      slug: '',
      image: PLACEHOLDER_IMG,
      description: '',
      attractionCount: 0,
      quickFacts: { capital: '', population: '', language: '', timezone: '' },
      weather: { temperature: '', condition: '' },
      bestTimeToVisit: '',
      gallery: [],
    };
  }

  const galleryList = Array.isArray(d.gallery) ? d.gallery : [];

  return {
    id: (d.id as string) || '',
    name: (d.name as string) || '',
    slug: (d.slug as string) || '',
    image: getMediaUrl(d.image as string),
    description: (d.description ?? d.overview ?? '') as string,
    attractionCount: (d.attraction_count ?? 0) as number,
    quickFacts: {
      capital: (d.capital ?? '') as string,
      population: (d.population ?? '') as string,
      language: (d.language ?? '') as string,
      timezone: (d.timezone ?? '') as string,
    },
    weather: {
      temperature: (d.weather_temperature ?? '') as string,
      condition: (d.weather_condition ?? '') as string,
    },
    bestTimeToVisit: (d.best_time_to_visit ?? '') as string,
    gallery: galleryList.map(getMediaUrl),
  };
}

// Map snake_case attraction from API to camelCase frontend type
function mapAttraction(a: Record<string, unknown>): Attraction {
  return {
    id: a.id as string,
    name: a.name as string,
    slug: a.slug as string,
    destinationId: a.destination_id as string,
    image: getMediaUrl(a.image as string),
    description: (a.description ?? a.about ?? '') as string,
    location: (a.location_label ?? '') as string,
    rating: parseFloat((a.rating as string) || '0') || 0,
    history: (a.historical_background ?? '') as string,
    openingHours: (a.operational_hours ?? '') as string,
    facilities: (a.facilities ?? []) as string[],
    gallery: ((a.gallery ?? []) as string[]).map(getMediaUrl),
  };
}

// Map snake_case program from API to camelCase frontend type
function mapProgram(p: Record<string, unknown>): Program {
  return {
    id: p.id as string,
    provider: (p.provider_name ?? '') as string,
    name: p.name as string,
    slug: (p.slug ?? '') as string,
    destinationId: (p.destination_id ?? '') as string,
    attractionId: (p.attraction_id ?? '') as string,
    image: getMediaUrl(p.image as string),
    description: (p.short_description ?? p.overview ?? '') as string,
    duration: (p.duration_label ?? '') as string,
    price: parseFloat((p.price_min as string) || '0') || 0,
    rating: parseFloat((p.rating as string) || '0') || 0,
    reviewsCount: (p.reviews_count ?? 0) as number,
    category: (p.category ?? 'Nature and Eco-Tourism') as Program['category'],
    highlights: (p.highlights ?? []) as string[],
    included: (p.included ?? []) as string[],
    excluded: (p.excluded ?? []) as string[],
    meetingPoint: (p.meeting_point ?? '') as string,
    itinerary: ((p.itinerary ?? []) as any[]).map(item => {
      const activities = item.activities || [
        item.unique_feature,
        item.activity_challenge
      ].filter(Boolean);
      return {
        title: item.location_name || item.title || '',
        activities: Array.from(new Set(activities))
      };
    }),
    gallery: (p.gallery ?? []) as string[],
    maxGuestMin: p.max_guest_min !== null && p.max_guest_min !== undefined ? Number(p.max_guest_min) : (p.min_quota !== null && p.min_quota !== undefined ? Number(p.min_quota) : null),
    maxGuestMax: p.max_guest_max !== null && p.max_guest_max !== undefined ? Number(p.max_guest_max) : (p.max_quota !== null && p.max_quota !== undefined ? Number(p.max_quota) : null),
    minQuota: p.min_quota !== null && p.min_quota !== undefined ? Number(p.min_quota) : (p.max_guest_min !== null && p.max_guest_min !== undefined ? Number(p.max_guest_min) : null),
    maxQuota: p.max_quota !== null && p.max_quota !== undefined ? Number(p.max_quota) : (p.max_guest_max !== null && p.max_guest_max !== undefined ? Number(p.max_guest_max) : null),
    dateAvailability: (p.date_availability as string) || 'all_days',
    date_availability: (p.date_availability as string) || 'all_days',
    availableDates: Array.isArray(p.available_dates) ? (p.available_dates as string[]) : [],
    available_dates: Array.isArray(p.available_dates) ? (p.available_dates as string[]) : [],
  };
}

export async function getDestinations(): Promise<Destination[]> {
  const data = await fetchApi<Record<string, unknown>[]>(`${getBaseApiUrl()}/destinations`);
  if (!data) {
    return [];
  }
  return data.map(mapDestination);
}

export async function getDestinationById(idOrSlug: string): Promise<Destination | null> {
  if (!idOrSlug) return null;
  const data = await fetchApi<Record<string, unknown>>(`${getBaseApiUrl()}/destinations/${idOrSlug}`);
  if (data && typeof data === 'object' && !Array.isArray(data) && (data as any).id) {
    return mapDestination(data);
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  if (isUuid) {
    const all = await getDestinations();
    return all.find(d => d.id === idOrSlug) ?? null;
  }

  return null;
}

export async function getAttractions(destinationId?: string): Promise<Attraction[]> {
  const apiBase = getBaseApiUrl();
  const url = destinationId 
    ? `${apiBase}/attractions?destination_id=${destinationId}`
    : `${apiBase}/attractions`;
  const data = await fetchApi<Record<string, unknown>[]>(url);
  return data ? data.map(mapAttraction) : [];
}

export async function getAttractionById(id: string): Promise<Attraction | null> {
  const data = await fetchApi<Record<string, unknown>>(`${getBaseApiUrl()}/attractions/${id}`);
  if (!data) return null;
  return mapAttraction(data);
}

export async function getPrograms(): Promise<Program[]> {
  const data = await fetchApi<Record<string, unknown>[]>(`${getBaseApiUrl()}/programs`);
  if (!data) {
    return [];
  }
  return data.map(mapProgram);
}

export async function getProgramById(id: string): Promise<Program | null> {
  const data = await fetchApi<Record<string, unknown>>(`${getBaseApiUrl()}/programs/${id}`);
  if (!data) return null;
  return mapProgram(data);
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  tax_percent: Number(process.env.NEXT_PUBLIC_TAX_PERCENT ?? 10),
  credentials: {
    subtitle: 'Our Credentials',
    title: 'A World of Wonders Awaits',
    items: [
      {
        icon: 'Map',
        title: 'Discover Hidden Gems',
        desc: "Explore Indonesia's untouched corners and secret spots, far from the usual tourist trails.",
      },
      {
        icon: 'Compass',
        title: 'Explore Unique Experiences',
        desc: "Authentic adventures curated to showcase Indonesia's rich culture and vibrant nature.",
      },
      {
        icon: 'Users',
        title: 'Connect Local Cultures',
        desc: "Support local communities through tourism. We champion homestays, local guides, and community-based enterprises to ensure your trip gives back directly to the people and places you visit. Experience genuine hospitality and preserve Indonesia's cultural heritage together.",
      },
      {
        icon: 'Trees',
        title: 'Sustain For Better Future',
        desc: "Protect the environment and support local communities through responsible tourism. We partner with eco-conscious operators, minimize waste, and promote conservation efforts to ensure your journey contributes to a sustainable future for Indonesia's natural treasures.",
      },
    ],
  },
  contact: {
    title: 'Get in Touch',
    description:
      'Have questions about our programs, destinations, or want to customize your journey? Our team of local experts is ready to help you plan the perfect Indonesian adventure.',
    address: 'Kuningan Cyber, Block C2-12, South Jakarta, Indonesia',
    phone: '+62 (21) 8000-AELI',
    email: 'explore@index-aeli.id',
    business_hours: {
      weekday: '09:00 - 18:00 (WIB)',
      saturday: '10:00 - 15:00 (WIB)',
      sunday: 'Closed',
    },
  },
  about: {
    badge: 'Who We Are',
    title: 'Indonesia Destination-Based Exploration',
    description_1:
      "INDEX-AELI is Indonesia's premier tourism landing platform. In partnership with AELI (Asosiasi Experiential Learning Indonesia), we connect worldwide travelers with curated premium programs and unforgettable tropical attractions across the Indonesian archipelago.",
    description_2:
      'We believe in tourism that gives back. By working with certified local guides and eco-friendly accommodation partners, we ensure that your luxury journey contributes directly to local economies and environment preservation.',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&fit=crop',
    vision_title: 'Our Vision',
    vision_desc:
      'To be the leading platform for experiential learning and luxury destination tourism in Indonesia, empowering travelers to explore the archipelago authentically, responsibly, and deeply.',
    mission_title: 'Our Mission',
    mission_desc:
      'To design top-tier travel itineraries with local guides, establish high safety compliance benchmarks under CHSE, and promote eco-sustainable tourism values that nourish communities.',
    values_badge: 'Our values',
    values_title: 'How We Create Adventures',
    values: [
      {
        icon: 'Map',
        title: 'Discover Hidden Gems',
        desc: 'Explore Indonesia’s untouched corners and secret spots, far from the usual tourist trails.',
      },
      {
        icon: 'Compass',
        title: 'Explore Unique Experiences',
        desc: 'Authentic adventures curated to showcase Indonesia’s rich culture and vibrant nature.',
      },
      {
        icon: 'Users',
        title: 'Connect Local Cultures',
        desc: 'Support local communities through tourism. We champion homestays, local guides, and community-based enterprises.',
      },
      {
        icon: 'Heart',
        title: 'Sustain For Better Future',
        desc: 'Protect the environment and support local communities through responsible, eco-conscious tourism.',
      },
    ],
    team_badge: 'The Curators',
    team_title: 'Meet Our Leadership',
    team_members: [
      {
        name: 'Budi Santoso',
        role: 'Co-Founder & CEO',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        bio: 'Budi has over 15 years of tourism management experience across Bali, Komodo, and Raja Ampat.',
      },
      {
        name: 'Dewi Lestari',
        role: 'Head of Operations',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        bio: 'Dewi ensures all itineraries meet CHSE safety regulations and connect directly with local communities.',
      },
      {
        name: 'Agus Pratama',
        role: 'Local Guide Lead Curator',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
        bio: 'Agus collaborates with community heads and local guides to deliver authentic experiences.',
      },
    ],
  },
  footer: {
    brand_description:
      "INDEX-AELI is Indonesia's premier tourism landing platform. We connect worldwide travelers with curated premium program and unforgettable tropical attractions across the Indonesian archipelago.",
    address: 'Kuningan Cyber, Block C2-12, South Jakarta, Indonesia',
    phone: '+62 (21) 8000-AELI',
    email: 'explore@index-aeli.id',
    quick_links: [
      { label: 'Popular Destinations', url: '/#destinations' },
      { label: 'Top Attractions', url: '/#attractions' },
      { label: 'Curated Programs', url: '/#program' },
      { label: 'About INDEX-AELI', url: '/#about' },
      { label: 'Secure Booking', url: '/booking' },
    ],
    support_links: [
      { label: 'Help Center / FAQ', url: '#' },
      { label: 'Safety Guidelines', url: '#' },
      { label: 'Terms of Service', url: '#' },
      { label: 'Privacy Policy', url: '#' },
      { label: 'Refund & Cancellation Policy', url: '#' },
    ],
    copyright_text: 'INDEX-AELI Indonesia. All rights reserved.',
  },
};

export async function getAppConfig(): Promise<AppConfig> {
  const data = await fetchApi<Partial<AppConfig>>(`${getBaseApiUrl()}/app-config`);
  if (!data || typeof data !== 'object') {
    return DEFAULT_APP_CONFIG;
  }

  return {
    tax_percent:
      typeof data.tax_percent === 'number' && !Number.isNaN(data.tax_percent)
        ? data.tax_percent
        : DEFAULT_APP_CONFIG.tax_percent,
    credentials: {
      subtitle: data.credentials?.subtitle ?? DEFAULT_APP_CONFIG.credentials.subtitle,
      title: data.credentials?.title ?? DEFAULT_APP_CONFIG.credentials.title,
      items:
        Array.isArray(data.credentials?.items) && data.credentials.items.length > 0
          ? data.credentials.items
          : DEFAULT_APP_CONFIG.credentials.items,
    },
    contact: {
      title: data.contact?.title ?? DEFAULT_APP_CONFIG.contact.title,
      description: data.contact?.description ?? DEFAULT_APP_CONFIG.contact.description,
      address:
        data.contact?.address ?? data.footer?.address ?? DEFAULT_APP_CONFIG.contact.address,
      phone: data.contact?.phone ?? data.footer?.phone ?? DEFAULT_APP_CONFIG.contact.phone,
      email: data.contact?.email ?? data.footer?.email ?? DEFAULT_APP_CONFIG.contact.email,
      business_hours: {
        weekday:
          data.contact?.business_hours?.weekday ??
          DEFAULT_APP_CONFIG.contact.business_hours.weekday,
        saturday:
          data.contact?.business_hours?.saturday ??
          DEFAULT_APP_CONFIG.contact.business_hours.saturday,
        sunday:
          data.contact?.business_hours?.sunday ??
          DEFAULT_APP_CONFIG.contact.business_hours.sunday,
      },
    },
    about: {
      badge: data.about?.badge ?? DEFAULT_APP_CONFIG.about.badge,
      title: data.about?.title ?? DEFAULT_APP_CONFIG.about.title,
      description_1: data.about?.description_1 ?? DEFAULT_APP_CONFIG.about.description_1,
      description_2: data.about?.description_2 ?? DEFAULT_APP_CONFIG.about.description_2,
      image: data.about?.image ?? DEFAULT_APP_CONFIG.about.image,
      vision_title: data.about?.vision_title ?? DEFAULT_APP_CONFIG.about.vision_title,
      vision_desc: data.about?.vision_desc ?? DEFAULT_APP_CONFIG.about.vision_desc,
      mission_title: data.about?.mission_title ?? DEFAULT_APP_CONFIG.about.mission_title,
      mission_desc: data.about?.mission_desc ?? DEFAULT_APP_CONFIG.about.mission_desc,
      values_badge: data.about?.values_badge ?? DEFAULT_APP_CONFIG.about.values_badge,
      values_title: data.about?.values_title ?? DEFAULT_APP_CONFIG.about.values_title,
      values:
        Array.isArray(data.about?.values) && data.about.values.length > 0
          ? data.about.values
          : DEFAULT_APP_CONFIG.about.values,
      team_badge: data.about?.team_badge ?? DEFAULT_APP_CONFIG.about.team_badge,
      team_title: data.about?.team_title ?? DEFAULT_APP_CONFIG.about.team_title,
      team_members:
        Array.isArray(data.about?.team_members) && data.about.team_members.length > 0
          ? data.about.team_members
          : DEFAULT_APP_CONFIG.about.team_members,
    },
    footer: {
      brand_description:
        data.footer?.brand_description ?? DEFAULT_APP_CONFIG.footer.brand_description,
      address: data.footer?.address ?? DEFAULT_APP_CONFIG.footer.address,
      phone: data.footer?.phone ?? DEFAULT_APP_CONFIG.footer.phone,
      email: data.footer?.email ?? DEFAULT_APP_CONFIG.footer.email,
      quick_links: Array.isArray(data.footer?.quick_links)
        ? data.footer.quick_links
        : DEFAULT_APP_CONFIG.footer.quick_links,
      support_links: Array.isArray(data.footer?.support_links)
        ? data.footer.support_links
        : DEFAULT_APP_CONFIG.footer.support_links,
      copyright_text: data.footer?.copyright_text ?? DEFAULT_APP_CONFIG.footer.copyright_text,
    },
  };
}

export interface CreateBookingPayload {
  booking_code?: string;
  program_name: string;
  experience_name?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  pax: number;
  gross_amount: number;
  payment_method: string;
}

export async function createBooking(payload: CreateBookingPayload): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const res = await fetch(`${getBaseApiUrl()}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return { success: false, message: 'Failed to record booking' };
    }
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network error' };
  }
}

export interface CreatePaymentBookingPayload {
  orderId?: string;
  bookingCode?: string;
  items?: Array<{ id: string; name: string; quantity: number; price: number }>;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  paymentMethodId?: string;
  programName?: string;
  experienceName?: string;
  locationName?: string;
  pax?: number;
}

export interface CreatePaymentResponse {
  success: boolean;
  message?: string;
  data?: {
    orderId: string;
    bookingCode: string;
    token: string;
    redirectUrl: string;
    amount: number;
  };
  error?: string;
}

export async function createPaymentBooking(payload: CreatePaymentBookingPayload): Promise<CreatePaymentResponse> {
  try {
    const res = await fetch(`${getBaseApiUrl()}/payments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error creating payment' };
  }
}

export async function getPaymentStatus(orderId: string): Promise<any> {
  try {
    const res = await fetch(`${getBaseApiUrl()}/payments/status/${encodeURIComponent(orderId)}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? json;
  } catch (err) {
    console.error('Error fetching payment status:', err);
    return null;
  }
}



