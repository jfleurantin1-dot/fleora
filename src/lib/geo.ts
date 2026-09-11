/**
 * ZIP-first geocoding for Fleora.
 * Uses Zippopotam.us (no API key required) to turn a US ZIP code into
 * coordinates plus a friendly City, ST label.
 *
 * Keeps the legacy Greater Boston town lookup for existing Fleora
 * features that still call geocodeMa().
 */

const TOWNS: Record<string, [number, number]> = {
  boston: [42.3601, -71.0589],
  brockton: [42.0834, -71.0184],
  quincy: [42.2529, -71.0023],
  cambridge: [42.3736, -71.1097],
  somerville: [42.3876, -71.0995],
  newton: [42.337, -71.2092],
  framingham: [42.2793, -71.4162],
  worcester: [42.2626, -71.8023],
  lowell: [42.6334, -71.3162],
  providence: [41.824, -71.4128],
  avon: [42.1307, -71.0417],
  randolph: [42.1626, -71.0414],
  stoughton: [42.125, -71.1023],
  dedham: [42.2418, -71.1662],
  braintree: [42.2223, -71.0018],
  weymouth: [42.2181, -70.9398],
  plymouth: [41.9584, -70.6673],
  "fall river": [41.7015, -71.155],
  "new bedford": [41.6362, -70.9342],
};

/**
 * Takes ZIP codes such as:
 * 02301
 * 02301-1234
 *
 * and returns the standard 5-digit ZIP.
 */
export function normalizeUsZip(value: string) {
  const match = value.trim().match(/\b(\d{5})(?:-\d{4})?\b/);

  return match?.[1] ?? null;
}

/**
 * Converts a US ZIP code into latitude, longitude,
 * and a friendly City, ST label.
 */
export async function geocodeZip(
  postalCode: string
): Promise<{ lat: number; lng: number; label: string } | null> {
  const zip = normalizeUsZip(postalCode);

  if (!zip) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.zippopotam.us/us/${zip}`,
      {
        cache: "force-cache",
        next: {
          revalidate: 60 * 60 * 24 * 30,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      places?: Array<{
        "place name"?: string;
        "state abbreviation"?: string;
        latitude?: string;
        longitude?: string;
      }>;
    };

    const place = data.places?.[0];

    if (!place) {
      return null;
    }

    const lat = Number(place.latitude);
    const lng = Number(place.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    const city = place["place name"] ?? zip;
    const state = place["state abbreviation"] ?? "";

    return {
      lat,
      lng,
      label: `${city}${state ? `, ${state}` : ""}`,
    };
  } catch {
    return null;
  }
}

/**
 * Legacy Fleora location lookup.
 *
 * IMPORTANT:
 * Existing parts of Fleora still import geocodeMa(),
 * so this function must remain exported until those
 * areas are migrated completely to ZIP-based geocoding.
 */
export function geocodeMa(
  location: string
): { lat: number; lng: number } {
  const key = location
    .trim()
    .toLowerCase()
    .replace(/,.*/, "")
    .trim();

  const hit = TOWNS[key] ?? TOWNS.boston;

  return {
    lat: hit[0],
    lng: hit[1],
  };
}
