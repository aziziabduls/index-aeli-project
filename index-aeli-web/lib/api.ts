import { Destination, Attraction, Program } from '@/types';

const CONTENT_API_URL = process.env.NEXT_PUBLIC_CONTENT_API_URL || 'http://localhost:7011/api/v1';
const PROGRAM_API_URL = process.env.NEXT_PUBLIC_PROGRAM_API_URL || 'http://localhost:7012/api/v1';
const MEDIA_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7009';

// Helper to resolve media URLs
function getMediaUrl(url: string | null | undefined): string {
  if (!url) return PLACEHOLDER_IMG;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${MEDIA_API_URL}${url}`;
}

// Placeholder image for items without images — prevents Next.js empty src errors
const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=60';

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
  return {
    id: d.id as string,
    name: d.name as string,
    slug: d.slug as string,
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
    gallery: ((d.gallery ?? []) as string[]).map(getMediaUrl),
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
  };
}

export async function getDestinations(): Promise<Destination[]> {
  const data = await fetchApi<Record<string, unknown>[]>(`${CONTENT_API_URL}/destinations`);
  if (!data) {
    console.error('Failed to fetch destinations');
    return [];
  }
  return data.map(mapDestination);
}

export async function getDestinationById(idOrSlug: string): Promise<Destination | null> {
  // Try direct lookup (works for slugs)
  const data = await fetchApi<Record<string, unknown>>(`${CONTENT_API_URL}/destinations/${idOrSlug}`);
  if (data) return mapDestination(data);

  // If it looks like a UUID, the backend only supports slug lookup —
  // fall back to finding it in the full destinations list
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  if (isUuid) {
    const all = await getDestinations();
    return all.find(d => d.id === idOrSlug) ?? null;
  }

  return null;
}

export async function getAttractions(destinationId?: string): Promise<Attraction[]> {
  if (destinationId) {
    // Resolve the destination to get its slug (API only supports slug-based attraction lookup)
    const dest = await getDestinationById(destinationId);
    if (!dest) return [];
    const data = await fetchApi<Record<string, unknown>[]>(`${CONTENT_API_URL}/destinations/${dest.slug}/attractions`);
    return data ? data.map(mapAttraction) : [];
  }

  // No "list all attractions" endpoint exists, so aggregate from all destinations
  const destinations = await getDestinations();
  const allAttractions: Attraction[] = [];
  
  await Promise.all(
    destinations.map(async (dest) => {
      const data = await fetchApi<Record<string, unknown>[]>(
        `${CONTENT_API_URL}/destinations/${dest.slug}/attractions`
      );
      if (data) {
        allAttractions.push(...data.map(mapAttraction));
      }
    })
  );

  return allAttractions;
}

export async function getAttractionById(id: string): Promise<Attraction | null> {
  const data = await fetchApi<Record<string, unknown>>(`${CONTENT_API_URL}/attractions/${id}`);
  if (!data) return null;
  return mapAttraction(data);
}

export async function getPrograms(): Promise<Program[]> {
  const data = await fetchApi<Record<string, unknown>[]>(`${PROGRAM_API_URL}/programs`);
  if (!data) {
    console.error('Failed to fetch programs');
    return [];
  }
  return data.map(mapProgram);
}

export async function getProgramById(id: string): Promise<Program | null> {
  const data = await fetchApi<Record<string, unknown>>(`${PROGRAM_API_URL}/programs/${id}`);
  if (!data) return null;
  return mapProgram(data);
}
