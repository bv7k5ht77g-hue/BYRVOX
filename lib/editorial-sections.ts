import { editionHref, fold, type Summary } from './edition';
import { countryAliases, countryRegion, regionalCountries } from './regional-coverage';

export type CategoryHeadlines = { category: string; stories: Summary[] };
export type RatedArticle = { story: Summary; count: number; average: number };
export const mostRatedLimit = 5;
export const ratingChangedKey = 'byrvox:rating-changed';

export const deskFamilies: Record<string, readonly string[]> = {
  International: ['Europe', ...regionalCountries.Europe, 'États-Unis', 'Caraïbes', ...regionalCountries.Caraïbes,
    'Amérique latine', ...regionalCountries['Amérique latine'], 'Afrique', 'Asie', 'Moyen-Orient', 'Océanie'],
  Canada: ['Québec', 'Ontario', 'Montréal', 'Politique canadienne', 'Colombie-Britannique', 'Alberta', 'Nunavut', 'Terre-Neuve-et-Labrador'],
  Économie: ['Entreprises', 'Commerce international', 'Finance', 'Finances publiques', 'Marchés'],
  Justice: ['Justice internationale'],
  Sports: ['Soccer', 'Hockey', 'LNH', 'Basketball', 'Tennis', 'Football américain'],
  Sciences: ['Technologies', 'Espace'],
  Société: ['Logement', 'Éducation', 'Transports', 'Politique municipale', 'Élections'],
  Environnement: ['Énergie', 'Climat'],
  Culture: [],
  Santé: [],
};
export const featuredCategories = Object.keys(deskFamilies);
export const categoryAliases: Record<string, string[]> = {
  ...countryAliases,
  'International': ['International', 'Monde'],
  'Technologies': ['Technologies', 'Technologie'],
  'Économie': ['Économie', 'Economie'],
  'Entreprises': ['Entreprises', 'Entreprise'],
  'Justice internationale': ['Justice internationale', 'Justice International'],
  'Commerce international': ['Commerce international', 'Commerce extérieur'],
  'Caraïbes': ['Caraïbes', 'Caraibes', 'Caribbean', 'Antilles'],
  'Haïti': ['Haïti', 'Haiti'],
  'Élections': ['Élections', 'Elections', 'Élection', 'Election'],
  'Sports': ['Sports', 'Sport'], 'Soccer': ['Soccer', 'Football'],
  'Hockey': ['Hockey', 'Hockey sur glace'], 'LNH': ['LNH', 'NHL'],
  'Basketball': ['Basketball', 'Basket-ball', 'Basket', 'NBA', 'WNBA'], 'Tennis': ['Tennis'],
  'Football américain': ['Football américain', 'Football americain', 'NFL', 'Football US'],
  'Sciences': ['Sciences', 'Science', 'Sciences et technologies'], 'Espace': ['Espace', 'Spatial'],
};
const normalized = new Map(Object.entries(categoryAliases).flatMap(([label,aliases]) =>
  aliases.map(name => [fold(name), label] as const)));
for (const name of [...featuredCategories, ...Object.values(deskFamilies).flat()]) {
  normalized.set(fold(name), name);
}
const parents = new Map(Object.entries(deskFamilies).flatMap(([parent, children]) =>
  children.map(name => [name, parent] as const)));

export function canonicalCategory(category: string) {
  return normalized.get(fold(category)) || category.trim();
}
export function parentDesk(category: string) {
  return parents.get(category) || category;
}
export function categoryHref(category: string) {
  return editionHref('actualites', '', canonicalCategory(category));
}
export function orderedCategories(published: readonly string[]) {
  return [...new Set([...featuredCategories, ...published.map(canonicalCategory).filter(Boolean),
    ...Object.keys(regionalCountries), ...Object.keys(countryAliases), 'Espace', 'Alberta'])];
}

export function groupDesks(categories: readonly string[]) {
  const present = new Set(categories.map(canonicalCategory).filter(Boolean));
  for (const category of present) {
    const region = countryRegion(category);
    if (region) present.add(region);
  }
  const ordered = [...new Set([...featuredCategories, ...Array.from(present, parentDesk)])];
  return ordered.map(name => ({
    name,
    children: (Object.hasOwn(deskFamilies, name) ? deskFamilies[name] : []).filter(child => present.has(child)),
  })).filter(desk => present.has(desk.name) || desk.children.length);
}

export function directoryRegions(children: readonly string[]) {
  const present = new Set(children);
  return children.filter(child => !countryRegion(child) || !present.has(countryRegion(child)!))
    .map(name => ({name, countries:(regionalCountries[name] ?? []).filter(country => present.has(country))}));
}
