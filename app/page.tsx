import type { Metadata } from 'next';
import { features } from '../lib/content';
import { SITE_ORIGIN } from '../lib/site-url';
import { editionHref, sections, type Section, type Summary } from '../lib/edition';
import { listPublishedArticles, readEditionArticles } from '../lib/public-articles';
import { Edition } from '../components/edition/edition';

export const dynamic = 'force-dynamic';

type Params = Record<string, string | string[] | undefined>;
type Props = { searchParams: Promise<Params> };

function routeFrom(params: Params) {
  const first = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value) || '';
  };
  const key = first('rubrique');
  const section: Section = Object.hasOwn(sections, key) ? key as Section : 'accueil';
  const page = section === 'recherche' || section === 'actualites' ? Number(first('page')) : 1;
  return { section, query: first('q').trim().slice(0, 160), category: first('categorie').trim().slice(0, 120),
    page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 1_000_000) : 1 };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { section, query, category, page } = routeFrom(await searchParams);
  return {
    ...(section !== 'accueil' ? { title: sections[section] } : {}),
    alternates: { canonical: new URL(editionHref(section, '', '', page), SITE_ORIGIN).href,
      types: { 'application/rss+xml': '/rss.xml' } },
    ...(section === 'favoris' || section === 'recherche' || category || query ? { robots: { index: false } } : {})
  };
}

export default async function Home({ searchParams }: Props) {
  const route = routeFrom(await searchParams);
  let stories: Summary[] = [];
  let unavailable = false;
  let hasNext = false;
  let categories: string[] = [];
  try {
    if (route.section === 'accueil') stories = await listPublishedArticles(6);
    if (route.section === 'recherche' || route.section === 'actualites') {
      ({ stories, hasNext, categories } = await readEditionArticles(route));
    }
  } catch {
    unavailable = true;
  }
  const presentations = features.map(({ slug, title, category, summary, image }) => ({
    slug, title, category, summary, image, presentation: true
  }));
  return <Edition route={route} stories={stories} presentations={presentations} unavailable={unavailable} hasNext={hasNext} categories={categories} />;
}
