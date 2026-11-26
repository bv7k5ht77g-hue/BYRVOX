import type { PublicLocale } from './i18n';

export const features = [
  {
    slug: 'notre-methode',
    category: 'LA RÉDACTION',
    title: 'Au-delà des titres : notre engagement pour une information traçable',
    summary: 'Sources, contexte et transparence : les principes qui guident la construction de BYRVOX.',
    image: 'collection-2026/editorial',
    imageAlt: {
      fr: 'Des journalistes échangent autour d’une table de rédaction.',
      en: 'Journalists discuss their work around a newsroom table.',
      es: 'Periodistas conversan alrededor de una mesa de redacción.',
      ar: 'صحفيون يتناقشون حول طاولة في غرفة التحرير.',
      'zh-CN': '几名记者围坐在编辑部的桌旁讨论。',
      ru: 'Журналисты обсуждают материалы за редакционным столом.',
      ko: '기자들이 편집 회의 테이블에 둘러앉아 이야기를 나눈다.',
    },
    body: 'BYRVOX se construit autour d’une exigence : permettre au lecteur de comprendre d’où vient une information.\n\nLes articles publiés par la rédaction doivent présenter leurs sources, leurs dates et leur contexte. Les mises à jour conservent un historique. Une information incertaine doit être identifiée comme telle.\n\nLa plateforme est actuellement en phase de lancement. Aucun flux radio ou télévisé n’est encore raccordé.',
  },
  {
    slug: 'verification',
    category: 'DÉCRYPTAGE',
    title: 'Comment BYRVOX vérifie et publie ses articles',
    summary: 'La rédaction valide ses articles dans le portail. Les articles du fil horaire portent la signature de l’agent qui les vérifie et les publie automatiquement.',
    image: 'collection-2026/verification',
    imageAlt: {
      fr: 'Une main annote l’un de deux documents posés côte à côte.',
      en: 'A hand marks up one of two documents laid side by side.',
      es: 'Una mano anota uno de dos documentos colocados uno junto al otro.',
      ar: 'يد تضع ملاحظات على إحدى وثيقتين موضوعتين جنباً إلى جنب.',
      'zh-CN': '两份文件并排摊开，一只手正在其中一份上做标记。',
      ru: 'Рука делает пометки на одном из двух разложенных рядом документов.',
      ko: '나란히 놓인 문서 두 장 중 한 장에 손으로 메모하고 있다.',
    },
    body: 'Dans le portail, un membre de la rédaction vérifie les faits, les dates et les sources du brouillon avant de décider de sa publication.\n\nPour le fil horaire, l’agent BYRVOX recoupe les faits auprès d’au moins deux sources indépendantes et consulte les articles déjà parus pour éviter les doublons. Il vérifie ce que montre la photo, son crédit et ses droits de réutilisation. Quand ces vérifications sont terminées, il publie automatiquement l’article avec sa signature et les liens vers ses sources.\n\nLa rédaction peut corriger un article après sa publication, quelle que soit son origine. Le portail conserve les versions successives.',
  },
  {
    slug: 'radio',
    category: 'BYRVOX RADIO',
    title: 'Une autre manière d’écouter le monde',
    summary: 'Débats, entretiens et formats audio : le projet BYRVOX Radio.',
    image: 'collection-2026/listening',
    imageAlt: {
      fr: 'Un casque audio repose sur un bureau de studio.',
      en: 'A pair of headphones rests on a studio desk.',
      es: 'Unos auriculares descansan sobre una mesa de estudio.',
      ar: 'سماعات رأس على طاولة في استوديو صوتي.',
      'zh-CN': '一副耳机放在录音室的桌上。',
      ru: 'На столе в студии лежат наушники.',
      ko: '스튜디오 책상 위에 헤드폰이 놓여 있다.',
    },
    body: 'BYRVOX Radio prépare une expérience audio centrée sur le contexte et la conversation. Le lecteur sera connecté à un flux autorisé lorsqu’il sera disponible.\n\nRadioYO reste une marque distincte, avec sa propre expérience. Elle ne remplace pas BYRVOX Radio.',
  },
  {
    slug: 'studio',
    category: 'BYRVOX STUDIO',
    title: 'Des formats courts, une exigence éditoriale entière',
    summary: 'Les futurs bulletins de 30, 60 et 90 secondes seront reliés à leurs sources.',
    image: 'collection-2026/formats',
    imageAlt: {
      fr: 'Une main déplace une commande de mélangeur vidéo devant une rangée d’écrans.',
      en: 'A hand moves a control on a video switcher in front of a bank of monitors.',
      es: 'Una mano mueve un mando de un mezclador de vídeo frente a varios monitores.',
      ar: 'يد تحرّك ذراعاً على لوحة مزج الفيديو أمام صف من الشاشات.',
      'zh-CN': '在一排监视器前，一只手正在操作视频切换台上的推杆。',
      ru: 'На фоне ряда мониторов рука передвигает рычаг видеомикшера.',
      ko: '모니터가 늘어선 영상 조정실에서 한 손이 영상 전환 장비의 레버를 움직인다.',
    },
    body: 'BYRVOX Studio prévoit des bulletins adaptés au Web et au mobile. Les présentateurs synthétiques seront explicitement identifiés et utilisés avec les droits nécessaires.\n\nLa production et la diffusion restent désactivées tant que les fournisseurs, les droits et les comptes de distribution ne sont pas configurés. TVYO reste une plateforme distincte de BYRVOX TV.',
  },
];

export type Story = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  body: string;
  image?: string;
  imageAlt?: Record<PublicLocale, string>;
  sources?: string;
  publishedAt?: string | null;
  updatedAt?: string;
};
