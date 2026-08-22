import type { Venue } from '@/domain/types';

/**
 * Demo venues. San Francisco only because that's where the demo content lives —
 * nothing in the map or model depends on it.
 */
export const SEED_VENUES: Venue[] = [
  // restaurants — red
  { id: 'v_nopalita', name: 'Nopalita Noche', category: 'restaurant', area: 'Mission', location: { lat: 37.7612, lng: -122.4226 }, priceTier: 2, blurb: 'Late-night mezcal and tacos. Kitchen runs till 1.' },
  { id: 'v_saison', name: 'Saison Nine', category: 'restaurant', area: 'SoMa', location: { lat: 37.7790, lng: -122.3932 }, priceTier: 4, blurb: 'Tasting menu. Book ahead, dress up.' },
  { id: 'v_kaimuki', name: 'Kaimuki Kitchen', category: 'restaurant', area: 'Tenderloin', location: { lat: 37.7862, lng: -122.4176 }, priceTier: 3, blurb: 'Hawaiian-Chinese small plates, loud room.' },
  { id: 'v_lume', name: 'Trattoria Lume', category: 'restaurant', area: 'North Beach', location: { lat: 37.7998, lng: -122.4079 }, priceTier: 2, blurb: 'Red sauce, candlelight, cash only.' },
  { id: 'v_dumpling', name: 'Dumpling Hour', category: 'restaurant', area: 'Richmond', location: { lat: 37.7806, lng: -122.4662 }, priceTier: 1, blurb: 'Open till 2am. Soup dumplings fix everything.' },

  // bars — purple
  { id: 'v_lantern', name: 'The Velvet Lantern', category: 'bar', area: 'Mission', location: { lat: 37.7589, lng: -122.4190 }, priceTier: 2, blurb: 'Dim cocktail room with a back patio.' },
  { id: 'v_smuggler', name: "Smuggler's Hour", category: 'bar', area: 'SoMa', location: { lat: 37.7763, lng: -122.4090 }, priceTier: 2, blurb: 'Rum list, pool table, no sign on the door.' },
  { id: 'v_castrocorner', name: 'Castro Corner', category: 'bar', area: 'Castro', location: { lat: 37.7621, lng: -122.4350 }, priceTier: 1, blurb: 'Cheap pours, big windows, everyone ends up here.' },
  { id: 'v_hayes', name: 'Hayes & Holloway', category: 'bar', area: 'Hayes Valley', location: { lat: 37.7764, lng: -122.4237 }, priceTier: 3, blurb: 'Natural wine and a very good speaker.' },
  { id: 'v_grotto', name: 'The Grotto Tiki', category: 'bar', area: 'Nob Hill', location: { lat: 37.7921, lng: -122.4150 }, priceTier: 3, blurb: 'Indoor rainstorm every hour. Yes, really.' },
  { id: 'v_zephyr', name: 'Beer Garden Zephyr', category: 'bar', area: 'Mission', location: { lat: 37.7697, lng: -122.4222 }, priceTier: 1, blurb: 'Picnic tables, pitchers, sunburn.' },

  // clubs — silver
  { id: 'v_audiowave', name: 'Audiowave', category: 'club', area: 'SoMa', location: { lat: 37.7715, lng: -122.4123 }, priceTier: 3, blurb: 'House and techno, Funktion-One, till 4.' },
  { id: 'v_halo', name: 'Halo', category: 'club', area: 'SoMa', location: { lat: 37.7748, lng: -122.4049 }, priceTier: 2, blurb: 'Two rooms, afterhours on weekends.' },
  { id: 'v_monarch', name: 'The Monarch Room', category: 'club', area: 'Tenderloin', location: { lat: 37.7826, lng: -122.4138 }, priceTier: 2, blurb: 'Basement dancefloor under a cocktail bar.' },
  { id: 'v_civic', name: 'Civic Works', category: 'club', area: 'Mission', location: { lat: 37.7695, lng: -122.4160 }, priceTier: 2, blurb: 'Big room, bigger sound, long line.' },

  // cafés — yellow (daytime only)
  { id: 'v_ritual', name: 'Ritual Cup', category: 'cafe', area: 'Mission', location: { lat: 37.7566, lng: -122.4213 }, priceTier: 1, blurb: 'Pour-overs and laptops. Closes at 6.' },
  { id: 'v_glasshouse', name: 'Glasshouse Coffee', category: 'cafe', area: 'SoMa', location: { lat: 37.7769, lng: -122.4086 }, priceTier: 2, blurb: 'Roastery with a mezzanine.' },
  { id: 'v_trouble', name: 'Trouble Brew', category: 'cafe', area: 'Outer Sunset', location: { lat: 37.7535, lng: -122.5076 }, priceTier: 1, blurb: 'Coffee, coconut, toast. That is the menu.' },

  // daytime — blue (daytime only)
  { id: 'v_dolores', name: 'Dolores Park', category: 'daytime', area: 'Mission', location: { lat: 37.7596, lng: -122.4269 }, priceTier: 1, blurb: 'The hill. Bring a blanket and something cold.' },
  { id: 'v_momw', name: 'Museum of Modern Works', category: 'daytime', area: 'SoMa', location: { lat: 37.7857, lng: -122.4011 }, priceTier: 2, blurb: 'Free first Thursdays. Rooftop garden.' },
  { id: 'v_oceanbeach', name: 'Ocean Beach', category: 'daytime', area: 'Outer Sunset', location: { lat: 37.7594, lng: -122.5107 }, priceTier: 1, blurb: 'Bonfire pits north end. Fog optional.' },

  // shops — excluded from the map entirely, kept so search/browse data is honest
  { id: 'v_vinyl', name: 'Vinyl Vault', category: 'shop', area: 'Haight', location: { lat: 37.7692, lng: -122.4525 }, priceTier: 2, blurb: 'Records, posters, a listening booth.' },
  { id: 'v_vintage', name: 'Haight Vintage Co.', category: 'shop', area: 'Haight', location: { lat: 37.7699, lng: -122.4469 }, priceTier: 2, blurb: 'Leather jackets by the kilo.' },
];
