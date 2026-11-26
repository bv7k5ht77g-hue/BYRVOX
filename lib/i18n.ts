import { publicSiteOrigin, SITE_ORIGIN } from './site-url';
import type { Section } from './edition';

export const publicLocales = ['fr','en','es','ar','zh-CN','ru','ko'] as const;
export type PublicLocale = typeof publicLocales[number];
export const nativeNames: Record<PublicLocale,string> = {fr:'Français',en:'English',es:'Español',ar:'العربية','zh-CN':'简体中文',ru:'Русский',ko:'한국어'};
export const isPublicLocale = (value: unknown): value is PublicLocale =>
  typeof value === 'string' && (publicLocales as readonly string[]).includes(value);
export function preferredLocale(query:unknown, cookie:unknown):PublicLocale {
  return isPublicLocale(query) ? query : isPublicLocale(cookie) ? cookie : 'fr';
}
export function localizedHref(href: string, locale: PublicLocale) {
  if ((!href.startsWith('/') && !href.startsWith('?')) || href.startsWith('//')) return href;
  const url = new URL(href,'https://byrvox.invalid');
  if (url.pathname !== '/' && !url.pathname.startsWith('/article/')) return href;
  if (locale === 'fr') url.searchParams.delete('lang');
  else url.searchParams.set('lang',locale);
  return url.pathname + url.search + url.hash;
}
type Row = readonly [string,string,string,string,string,string,string];
const sectionRows: Record<Section, Row> = {
 accueil: ['Accueil','Home','Inicio','الرئيسية','首页','Главная','홈'],
 actualites: ['Actualités','News','Noticias','الأخبار','新闻','Новости','뉴스'],
 radio:['BYRVOX Radio','BYRVOX Radio','BYRVOX Radio','إذاعة BYRVOX','BYRVOX 广播','Радио BYRVOX','BYRVOX 라디오'],
 tv:['BYRVOX TV','BYRVOX TV','BYRVOX TV','تلفزيون BYRVOX','BYRVOX 电视','ТВ BYRVOX','BYRVOX TV'],
 podcasts:['Podcasts','Podcasts','Pódcasts','بودكاست','播客','Подкасты','팟캐스트'],
 emissions:['Émissions','Shows','Programas','البرامج','节目','Передачи','프로그램'],
 dossiers:['Dossiers','In depth','Especiales','ملفات','专题','Спецпроекты','기획'],
 direct:['En direct','Live','En directo','مباشر','直播','Прямой эфир','라이브'],
 presentations:['Découvrir BYRVOX','About BYRVOX','Conoce BYRVOX','عن BYRVOX','了解 BYRVOX','О BYRVOX','BYRVOX 소개'],
 favoris:['Mes favoris','Bookmarks','Mis favoritos','المفضلة','我的收藏','Закладки','내 즐겨찾기'],
 recherche:['Recherche','Search','Buscar','بحث','搜索','Поиск','검색'],
};
const categoryRows: Row[] = [
 ['Caraïbes','Caribbean','Caribe','الكاريبي','加勒比','Карибский регион','카리브해'],
 ['Haïti','Haiti','Haití','هايتي','海地','Гаити','아이티'],
 ['Élections','Elections','Elecciones','الانتخابات','选举','Выборы','선거'],
 ['Soccer','Soccer','Fútbol','كرة القدم','足球','Футбол','축구'],
 ['Basketball','Basketball','Baloncesto','كرة السلة','篮球','Баскетбол','농구'],
 ['Tennis','Tennis','Tenis','التنس','网球','Теннис','테니스'],
 ['Football américain','American football','Fútbol americano','كرة القدم الأمريكية','美式橄榄球','Американский футбол','미식축구'],
 ['LNH','NHL','NHL','دوري الهوكي الوطني','北美冰球职业联赛','НХЛ','북미 아이스하키 리그'],
 ['États-Unis','United States','Estados Unidos','الولايات المتحدة','美国','США','미국'],
 ['Canada','Canada','Canadá','كندا','加拿大','Канада','캐나다'],
 ['Ontario','Ontario','Ontario','أونتاريو','安大略省','Онтарио','온타리오'],
 ['International','World','Internacional','العالم','国际','Мир','국제'],
 ['Économie','Economy','Economía','الاقتصاد','经济','Экономика','경제'],
 ['Transports','Transport','Transporte','النقل','交通','Транспорт','교통'],
 ['Environnement','Environment','Medio ambiente','البيئة','环境','Экология','환경'],
 ['Société','Society','Sociedad','المجتمع','社会','Общество','사회'],
 ['Technologies','Technology','Tecnología','التكنولوجيا','科技','Технологии','기술'],
 ['Espace','Space','Espacio','الفضاء','航天','Космос','우주'],
 ['Sciences','Science','Ciencia','العلوم','科学','Наука','과학'],
 ['Énergie','Energy','Energía','الطاقة','能源','Энергетика','에너지'],
 ['Culture','Culture','Cultura','الثقافة','文化','Культура','문화'],
 ['Sports','Sports','Deportes','الرياضة','体育','Спорт','스포츠'],
 ['LA RÉDACTION','Newsroom','Redacción','غرفة الأخبار','编辑部','Редакция','편집부'],
 ['DÉCRYPTAGE','Explainers','Análisis','تحليلات','解读','Разбор','해설'],
 sectionRows.radio,['BYRVOX STUDIO','BYRVOX Studio','Estudio BYRVOX','استوديو BYRVOX','BYRVOX 演播室','Студия BYRVOX','BYRVOX 스튜디오'],
];
export function sectionLabel(section: Section, locale: PublicLocale) { return sectionRows[section][publicLocales.indexOf(locale)]; }
export function categoryLabel(category: string, locale: PublicLocale) {
 const name = category.toLocaleLowerCase('fr');
 const lookup = name === 'technologie' ? 'technologies' : name;
 return categoryRows.find(row => row[0].toLocaleLowerCase('fr') === lookup)?.[publicLocales.indexOf(locale)] || category;
}
export const localeLabels: Record<PublicLocale, {language:string;sourceFallback:string;translate:string}> = {
 fr:{language:'Langue de lecture',sourceFallback:'Version française originale',translate:'Traduire la page avec Google'},
 en:{language:'Reading language',sourceFallback:'Translation pending. The original article is in French.',translate:'Translate this page with Google'},
 es:{language:'Idioma de lectura',sourceFallback:'Traducción pendiente. El artículo original está en francés.',translate:'Traducir esta página con Google'},
 ar:{language:'لغة القراءة',sourceFallback:'الترجمة قيد الإعداد. المقال الأصلي بالفرنسية.',translate:'ترجمة الصفحة باستخدام Google'},
 'zh-CN':{language:'阅读语言',sourceFallback:'译文暂未提供，以下为法语原文。',translate:'使用 Google 翻译本页'},
 ru:{language:'Язык чтения',sourceFallback:'Перевод готовится. Оригинал статьи на французском языке.',translate:'Перевести страницу с помощью Google'},
 ko:{language:'읽기 언어',sourceFallback:'번역을 준비 중입니다. 프랑스어 원문을 표시합니다.',translate:'Google로 이 페이지 번역'}
};
export function translationFallbackHref(publicUrl:string,locale:PublicLocale) {
  const page = new URL(publicUrl,SITE_ORIGIN);
  // A translator sees only the public article path, never reader search or identity parameters.
  const link = new URL('https://translate.google.com/translate');
  link.search = new URLSearchParams({sl:'fr',tl:locale,hl:locale,u:publicSiteOrigin(page.host)+page.pathname}).toString();
  return link.href;
}
