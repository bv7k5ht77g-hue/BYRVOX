import type { CoverPhoto } from './cover-photo';

export const sections = {
  accueil: 'Accueil',
  actualites: 'Actualités',
  radio: 'BYRVOX Radio',
  tv: 'BYRVOX TV',
  podcasts: 'Podcasts',
  emissions: 'Émissions',
  dossiers: 'Dossiers',
  direct: 'En direct',
  presentations: 'Découvrir BYRVOX',
  favoris: 'Mes favoris',
  recherche: 'Recherche'
} as const;

export type Section = keyof typeof sections;
export type EditionRoute = { section: Section; query: string; category: string; page: number };
export type Summary = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  publishedAt?: string | null;
  image?: string;
  photo?: CoverPhoto;
  presentation?: boolean;
  contentLocale?: string;
};

export function editionHref(section: Section, query = '', category = '', page = 1) {
  const params = new URLSearchParams();
  if (section !== 'accueil') params.set('rubrique', section);
  if (query) params.set('q', query);
  if (category) params.set('categorie', category);
  if (page > 1) params.set('page', String(page));
  return params.size ? '/?' + params.toString() : '/';
}

export function articleHref(story: Summary) {
  return '/article/' + encodeURIComponent(story.slug);
}

export function fold(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').trim();
}
