import { API_URL } from '@/lib/api';

export type HomeListing = {
  listingId: string;
  address: string;
  zipCode: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  latitude: number;
  longitude: number;
  detailUrl: string | null;
  imageUrl: string | null;
};

export type HomesSearchResponse = {
  selectedZip: string;
  nearbyZips: string[];
  withinRange: HomeListing[];
  slightlyAboveRange: HomeListing[];
  belowComfortRange: HomeListing[];
};

export async function searchHomesByZip(zip: string): Promise<HomesSearchResponse> {
  const response = await fetch(`${API_URL}/api/homes/search?zip=${encodeURIComponent(zip)}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Unable to load homes for this ZIP code.');
  }

  return (await response.json()) as HomesSearchResponse;
}
