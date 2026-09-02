/**
 * Tiny stand-in geocoder for the MVP. Maps common Greater Boston town names
 * to coordinates so the matching function can score distance. Replace with a
 * real geocoding call (Google Maps / Mapbox) before expanding markets.
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

export function geocodeMa(location: string): { lat: number; lng: number } {
  const key = location.trim().toLowerCase().replace(/,.*/, "").trim();
  const hit = TOWNS[key] ?? TOWNS.boston;
  return { lat: hit[0], lng: hit[1] };
}
