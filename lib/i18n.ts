import { NEW_SITE_ORIGIN, SITE_ORIGIN } from './site-url';
import type { Section } from './edition';
import { canonicalCategory } from './editorial-sections';

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
 ['Québec','Quebec','Quebec','كيبيك','魁北克','Квебек','퀘벡'],
 ['Montréal','Montreal','Montreal','مونتريال','蒙特利尔','Монреаль','몬트리올'],
 ['Colombie-Britannique','British Columbia','Columbia Británica','كولومبيا البريطانية','不列颠哥伦比亚省','Британская Колумбия','브리티시컬럼비아'],
 ['Alberta','Alberta','Alberta','ألبرتا','艾伯塔省','Альберта','앨버타'],
 ['Nunavut','Nunavut','Nunavut','نونافوت','努纳武特','Нунавут','누나부트'],
 ['Europe','Europe','Europa','أوروبا','欧洲','Европа','유럽'],
 ['Afrique','Africa','África','أفريقيا','非洲','Африка','아프리카'],
 ['Asie','Asia','Asia','آسيا','亚洲','Азия','아시아'],
 ['Océanie','Oceania','Oceanía','أوقيانوسيا','大洋洲','Океания','오세아니아'],
 ['Amérique latine','Latin America','América Latina','أمريكا اللاتينية','拉丁美洲','Латинская Америка','라틴아메리카'],
 ['Moyen-Orient','Middle East','Oriente Medio','الشرق الأوسط','中东','Ближний Восток','중동'],
 ['Politique canadienne','Canadian politics','Política canadiense','السياسة الكندية','加拿大政治','Политика Канады','캐나다 정치'],
 ['Politique municipale','Local politics','Política municipal','السياسة البلدية','市政','Муниципальная политика','지방 정치'],
 ['Commerce international','International trade','Comercio internacional','التجارة الدولية','国际贸易','Международная торговля','국제 무역'],
 ['Entreprises','Business','Empresas','الشركات','企业','Компании','기업'],
 ['Finance','Finance','Finanzas','التمويل','金融','Финансы','금융'],
 ['Marchés','Markets','Mercados','الأسواق','市场','Рынки','시장'],
 ['Justice','Justice','Justicia','القضاء','司法','Правосудие','사법'],
 ['Justice internationale','International justice','Justicia internacional','العدالة الدولية','国际司法','Международное правосудие','국제 사법'],
 ['Logement','Housing','Vivienda','الإسكان','住房','Жильё','주거'],
 ['Éducation','Education','Educación','التعليم','教育','Образование','교육'],
 ['Climat','Climate','Clima','المناخ','气候','Климат','기후'],
 ['Hockey','Hockey','Hockey sobre hielo','هوكي الجليد','冰球','Хоккей','아이스하키'],
 ['Santé','Health','Salud','الصحة','健康','Здоровье','건강'],
 ['Monde','World','Mundo','العالم','世界','Мир','세계'],
 ['Sciences et technologies','Science and technology','Ciencia y tecnología','العلوم والتكنولوجيا','科学与技术','Наука и технологии','과학기술'],
 ['Éditorial','Editorial','Editorial','افتتاحية','社论','Редакционная статья','사설'],
 ['Article sponsorisé','Sponsored article','Artículo patrocinado','مقال برعاية','赞助文章','Спонсорский материал','협찬 기사'],
 ['Caraïbes','Caribbean','Caribe','الكاريبي','加勒比','Карибский регион','카리브해'],
 ['Haïti','Haiti','Haití','هايتي','海地','Гаити','아이티'],
 ['Jamaïque','Jamaica','Jamaica','جامايكا','牙买加','Ямайка','자메이카'],
 ['République dominicaine','Dominican Republic','República Dominicana','جمهورية الدومينيكان','多米尼加共和国','Доминиканская Республика','도미니카 공화국'],
 ['Belize','Belize','Belice','بليز','伯利兹','Белиз','벨리즈'],
 ['Guyana','Guyana','Guyana','غيانا','圭亚那','Гайана','가이아나'],
 ['Brésil','Brazil','Brasil','البرازيل','巴西','Бразилия','브라질'],
 ['Cuba','Cuba','Cuba','كوبا','古巴','Куба','쿠바'],
 ['Bahamas','Bahamas','Bahamas','جزر البهاما','巴哈马','Багамы','바하마'],
 ['Barbade','Barbados','Barbados','باربادوس','巴巴多斯','Барбадос','바베이도스'],
 ['Trinité-et-Tobago','Trinidad and Tobago','Trinidad y Tobago','ترينيداد وتوباغو','特立尼达和多巴哥','Тринидад и Тобаго','트리니다드 토바고'],
 ['Guadeloupe','Guadeloupe','Guadalupe','غوادلوب','瓜德罗普','Гваделупа','과들루프'],
 ['Martinique','Martinique','Martinica','مارتينيك','马提尼克','Мартиника','마르티니크'],
 ['Porto Rico','Puerto Rico','Puerto Rico','بورتوريكو','波多黎各','Пуэрто-Рико','푸에르토리코'],
 ['Dominique','Dominica','Dominica','دومينيكا','多米尼克','Доминика','도미니카 연방'],
 ['Sainte-Lucie','Saint Lucia','Santa Lucía','سانت لوسيا','圣卢西亚','Сент-Люсия','세인트루시아'],
 ['Grenade','Grenada','Granada','غرينادا','格林纳达','Гренада','그레나다'],
 ['Antigua-et-Barbuda','Antigua and Barbuda','Antigua y Barbuda','أنتيغوا وبربودا','安提瓜和巴布达','Антигуа и Барбуда','앤티가 바부다'],
 ['Saint-Kitts-et-Nevis','Saint Kitts and Nevis','San Cristóbal y Nieves','سانت كيتس ونيفيس','圣基茨和尼维斯','Сент-Китс и Невис','세인트키츠 네비스'],
 ['Saint-Vincent-et-les-Grenadines','Saint Vincent and the Grenadines','San Vicente y las Granadinas','سانت فنسنت والغرينادين','圣文森特和格林纳丁斯','Сент-Винсент и Гренадины','세인트빈센트 그레나딘'],
 ['Suriname','Suriname','Surinam','سورينام','苏里南','Суринам','수리남'],
 ['France','France','Francia','فرنسا','法国','Франция','프랑스'],
 ['Royaume-Uni','United Kingdom','Reino Unido','المملكة المتحدة','英国','Великобритания','영국'],
 ['Terre-Neuve-et-Labrador','Newfoundland and Labrador','Terranova y Labrador','نيوفاوندلاند ولابرادور','纽芬兰与拉布拉多省','Ньюфаундленд и Лабрадор','뉴펀들랜드 래브라도'],
 ['Finances publiques','Public finances','Finanzas públicas','المالية العامة','公共财政','Государственные финансы','공공 재정'],
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
 const row = categoryRows.find(row => row[0].toLocaleLowerCase('fr') === name);
 if (row) return row[publicLocales.indexOf(locale)];
 const canonical = canonicalCategory(category).toLocaleLowerCase('fr');
 return categoryRows.find(row => row[0].toLocaleLowerCase('fr') === canonical)?.[publicLocales.indexOf(locale)] || category;
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
  link.search = new URLSearchParams({sl:'fr',tl:locale,hl:locale,u:NEW_SITE_ORIGIN+page.pathname}).toString();
  return link.href;
}
