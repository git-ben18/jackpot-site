export type MarketNiche = 'Mass-Tier' | 'Luxury' | 'Mid-Tier' | 'Economy' | 'Online' | 'Other';

export const NICHE_MAP: Record<string, MarketNiche> = {
  'Caesars': 'Mass-Tier',
  'MGM': 'Mass-Tier',
  'Hard Rock': 'Mass-Tier',
  'Wynn': 'Luxury',
  'Venetian': 'Luxury',
  'Fontainebleau': 'Luxury',
  'Resorts World': 'Mid-Tier',
  'Golden Nugget': 'Mid-Tier',
  'Boyd Gaming': 'Mid-Tier',
  'Oceans': 'Mid-Tier',
  'Treasure Island': 'Mid-Tier',
  'Circa': 'Mid-Tier',
  'OYO': 'Economy',
  'Ellis Island': 'Economy',
  'Westgate': 'Economy',
  'Penn National': 'Economy',
  'Other USA Casinos': 'Economy',
  'Casino Miami': 'Economy',
  'Delaware North': 'Economy',
  'Saracen': 'Economy',
  'The Guestbook': 'Economy',
  'Online': 'Online',
};

export const NICHE_ORDER: MarketNiche[] = ['Mass-Tier', 'Luxury', 'Mid-Tier', 'Economy', 'Online', 'Other'];

export function getNiche(brand: string): MarketNiche {
  return NICHE_MAP[brand] ?? 'Other';
}

/** Place chips use tier colors; Online maps to Other until product adds an Online row. */
export function getNicheForPlaceChip(brand: string): MarketNiche {
  const niche = getNiche(brand);
  return niche === 'Online' ? 'Other' : niche;
}

export function compareBrandsByNicheOrder(a: string, b: string): number {
  const nicheIndex = (brand: string) => {
    const niche = getNicheForPlaceChip(brand);
    const idx = NICHE_ORDER.indexOf(niche);
    return idx === -1 ? NICHE_ORDER.length : idx;
  };
  const byNiche = nicheIndex(a) - nicheIndex(b);
  if (byNiche !== 0) return byNiche;
  return a.localeCompare(b);
}

export function sortBrandsByNicheOrder(brands: string[]): string[] {
  return [...brands].sort(compareBrandsByNicheOrder);
}

export interface NicheColorSet {
  bg: string
  bgAlt: string
  border: string
  text: string
  activeBg: string
  activeText: string
  accent: string
}

export const NICHE_COLORS: Record<MarketNiche, NicheColorSet> = {
  'Mass-Tier':  { bg: 'bg-rose-50',    bgAlt: 'bg-rose-100',   border: 'border-rose-400',   text: 'text-rose-700',   activeBg: 'bg-rose-600',   activeText: 'text-white', accent: '#e11d48' },
  'Luxury':     { bg: 'bg-violet-50',  bgAlt: 'bg-violet-100', border: 'border-violet-400', text: 'text-violet-700', activeBg: 'bg-violet-600', activeText: 'text-white', accent: '#7c3aed' },
  'Mid-Tier':   { bg: 'bg-teal-50',    bgAlt: 'bg-teal-100',   border: 'border-teal-400',   text: 'text-teal-700',   activeBg: 'bg-teal-600',   activeText: 'text-white', accent: '#0d9488' },
  'Economy':    { bg: 'bg-stone-100',   bgAlt: 'bg-stone-200',  border: 'border-stone-400',  text: 'text-stone-700',  activeBg: 'bg-stone-600',  activeText: 'text-white', accent: '#78716c' },
  'Online':     { bg: 'bg-sky-50',     bgAlt: 'bg-sky-100',    border: 'border-sky-400',    text: 'text-sky-700',    activeBg: 'bg-sky-600',    activeText: 'text-white', accent: '#0284c7' },
  'Other':      { bg: 'bg-slate-100',  bgAlt: 'bg-slate-200',  border: 'border-slate-300',  text: 'text-slate-600',  activeBg: 'bg-slate-600',  activeText: 'text-white', accent: '#64748b' },
};
