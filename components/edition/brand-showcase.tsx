import Image from 'next/image';
import { ArrowRight, Bookmark, Newspaper, Radio, Tv } from 'lucide-react';
import { editionHref } from '../../lib/edition';
import { localizedHref, publicLocales, sectionLabel, type PublicLocale } from '../../lib/i18n';
import { sectionText } from './section-copy';
import './brand-showcase.css';

const copy = {
  title: ['L’information nouvelle génération', 'News for a new generation', 'Información de nueva generación', 'أخبار لجيل جديد', '新一代新闻', 'Новости нового поколения', '새로운 세대를 위한 뉴스'],
  intro: ['De la manchette à l’entretien, retrouvez la rédaction en ligne, à la radio et à la télévision.', 'From headlines to interviews, discover our newsroom across the web, radio and television.', 'De los titulares a las entrevistas, descubre nuestra redacción en la web, la radio y la televisión.', 'من العناوين إلى المقابلات، تابع غرفة الأخبار عبر الويب والإذاعة والتلفزيون.', '从头条到访谈，通过网络、广播和电视了解我们的编辑部。', 'От заголовков до интервью — знакомьтесь с нашей редакцией в интернете, на радио и телевидении.', '헤드라인부터 인터뷰까지, 웹과 라디오, TV에서 BYRVOX 편집부를 만나보세요.'],
  direct: ['Espace direct', 'Live coverage', 'Espacio en directo', 'مساحة البث المباشر', '直播专区', 'Раздел эфиров', '라이브 센터'],
  titleMobile: ['BYRVOX te suit partout.', 'BYRVOX goes with you.', 'BYRVOX va contigo.', 'BYRVOX معك أينما كنت.', 'BYRVOX，随时随地。', 'BYRVOX всегда с вами.', '어디서든 BYRVOX와 함께.'],
  mobile: ['Sur le Web mobile, retrouvez vos articles et gardez vos lectures dans vos favoris.', 'Read articles on the mobile web and keep your saved stories in your bookmarks.', 'Lee los artículos en la web móvil y guarda tus lecturas en favoritos.', 'اقرأ المقالات على موقعنا عبر الهاتف واحفظ قراءاتك في المفضلة.', '在移动网页上阅读报道，将想留存的文章加入收藏。', 'Читайте материалы в мобильном браузере и добавляйте интересные статьи в закладки.', '모바일 웹에서 기사를 읽고 다시 보고 싶은 기사를 즐겨찾기에 저장하세요.'],
  apps: ['Applications mobiles en préparation', 'Mobile apps in development', 'Aplicaciones móviles en preparación', 'تطبيقات الهاتف قيد الإعداد', '移动应用筹备中', 'Мобильные приложения в разработке', '모바일 앱 준비 중'],
} satisfies Record<string, [string, string, string, string, string, string, string]>;

const channels = [
  { section: 'actualites', name: 'NEWS', image: 'news', icon: Newspaper, text: 'newsChannel' },
  { section: 'radio', name: 'RADIO', image: 'radio', icon: Radio, text: 'radioChannel' },
  { section: 'tv', name: 'TV', image: 'tv', icon: Tv, text: 'tvChannel' },
] as const;

export function BrandShowcase({ lang }: { lang: PublicLocale }) {
  const locale = publicLocales.indexOf(lang);
  return <section className="by-showcase" aria-labelledby="by-brand-title">
    <div className="by-showcase-hero">
      <div className="by-showcase-intro">
        <h2 id="by-brand-title">{copy.title[locale]}<span aria-hidden="true">.</span></h2>
        <p>{copy.intro[locale]}</p>
        <div className="by-showcase-actions">
          <a href={localizedHref(editionHref('direct'),lang)}><Radio size={17} aria-hidden="true" />{copy.direct[locale]}</a>
          <a href={localizedHref(editionHref('presentations'),lang)}>{sectionLabel('presentations',lang)}<ArrowRight size={16} aria-hidden="true" className="by-direction-arrow" /></a>
        </div>
      </div>
      <picture className="by-showcase-art">
        <source media="(max-width: 680px)" srcSet="/media/collection-2026/hero-720.webp" />
        <img src="/media/collection-2026/hero.webp" width={1672} height={941} loading="lazy" decoding="async" alt="" />
      </picture>
    </div>
    <nav className="by-showcase-channels" aria-label={sectionText(lang,'coverage')}>
      {channels.map(({section, name, image, icon: Icon, text}) => <a key={section} href={localizedHref(editionHref(section),lang)}>
        <div className="by-channel-art">
          <Image unoptimized width={720} height={405} loading="lazy" decoding="async"
            src={'/media/collection-2026/' + image + '-720.webp'} alt="" />
        </div>
        <div className="by-channel-copy">
          <div className="by-channel-marks">
            <Icon size={19} strokeWidth={1.6} aria-hidden="true" />
            <ArrowRight className="by-direction-arrow" size={18} aria-hidden="true" />
          </div>
          <strong dir="ltr">BYRVOX {name}</strong>
          <small>{sectionText(lang,text)}</small>
        </div>
      </a>)}
    </nav>
  </section>;
}

export function MobileReading({ lang }: { lang: PublicLocale }) {
  const locale = publicLocales.indexOf(lang);
  return <section className="by-reading" aria-labelledby="by-reading-title">
    <div className="by-reading-copy">
      <h2 id="by-reading-title">{copy.titleMobile[locale]}</h2>
      <p>{copy.mobile[locale]}</p>
      <a href={localizedHref(editionHref('favoris'),lang)}><Bookmark size={16} aria-hidden="true" />{sectionLabel('favoris',lang)}<ArrowRight className="by-direction-arrow" size={16} aria-hidden="true" /></a>
      <small>{copy.apps[locale]}</small>
    </div>
    <div className="by-reading-art" aria-hidden="true">
      <div className="by-reading-phone" dir="ltr">
        <Image unoptimized width={176} height={39} src="/brand/logo-dark.png" alt="" loading="lazy" />
        <b>BEYOND<br/>THE<br/><em>HEADLINES.</em></b>
      </div>
    </div>
  </section>;
}
