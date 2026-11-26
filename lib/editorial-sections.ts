import { editionHref, fold, type Summary } from './edition';

export type CategoryHeadlines = { category: string; stories: Summary[] };
export const featuredCategories = ['Caraïbes', 'Haïti', 'Élections', 'Sports', 'Soccer', 'LNH', 'Sciences', 'Espace'] as const;
export const categoryAliases: Record<string, string[]> = {
  'Caraïbes': ['Caraïbes', 'Caraibes', 'Caribbean', 'Antilles'],
  'Haïti': ['Haïti', 'Haiti'],
  'Élections': ['Élections', 'Elections', 'Élection', 'Election'],
  'Sports': ['Sports', 'Sport'], 'Soccer': ['Soccer', 'Football'],
  'LNH': ['LNH', 'NHL'],
  'Basketball': ['Basketball', 'Basket-ball', 'Basket', 'NBA', 'WNBA'], 'Tennis': ['Tennis'],
  'Football américain': ['Football américain', 'Football americain', 'NFL', 'Football US'], 'Sciences': ['Sciences', 'Science'], 'Espace': ['Espace', 'Spatial'],
};
const normalized = new Map(Object.entries(categoryAliases).flatMap(([label,aliases]) =>
  aliases.map(name => [fold(name), label] as const)));

export function canonicalCategory(category: string) {
  return normalized.get(fold(category)) || category.trim();
}
export function categoryHref(category: string) {
  return editionHref('actualites', '', canonicalCategory(category));
}
export function orderedCategories(published: readonly string[]) {
  return [...new Set([...featuredCategories, ...published.map(canonicalCategory).filter(Boolean)])];
}
