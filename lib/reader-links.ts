import { NEW_SITE_ORIGIN } from './site-url';
import { publicLocales, type PublicLocale } from './i18n';

export type ReaderMode = 'connexion' | 'inscription' | 'sortie';

export function readerReturnPath(value: unknown) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/';
  try {
    const url = new URL(value, NEW_SITE_ORIGIN);
    if (url.origin !== NEW_SITE_ORIGIN || (url.pathname !== '/' && !/^\/article\/[a-z0-9-]+\/?$/.test(url.pathname))) return '/';
    return url.pathname + url.search + url.hash;
  } catch { return '/'; }
}

export function readerAccountUrl(mode: ReaderMode, returnTo: string, lang: PublicLocale) {
  const url = new URL('/compte', NEW_SITE_ORIGIN);
  url.searchParams.set('mode', mode);
  url.searchParams.set('lang', lang);
  url.searchParams.set('return_to', readerReturnPath(returnTo));
  return url.href;
}

export function readerSignOutUrl(legacy: boolean, returnTo: string, lang: PublicLocale) {
  if (legacy) return '/compte?' + new URLSearchParams({mode:'sortie', lang});
  return readerAccountUrl('sortie', returnTo, lang);
}

const copy = {
  connexion: ['Se connecter','Sign in','Iniciar sesión','تسجيل الدخول','登录','Войти','로그인'],
  inscription: ['Créer un compte','Create an account','Crear una cuenta','إنشاء حساب','创建账户','Создать аккаунт','계정 만들기'],
  sortie: ['Se déconnecter','Sign out','Cerrar sesión','تسجيل الخروج','退出登录','Выйти','로그아웃'],
  back: ['Retour à BYRVOX','Back to BYRVOX','Volver a BYRVOX','العودة إلى BYRVOX','返回 BYRVOX','Вернуться на BYRVOX','BYRVOX로 돌아가기'],
  unavailable: ['La connexion et la création de compte sont temporairement indisponibles.','Sign-in and registration are temporarily unavailable.','El acceso y el registro no están disponibles temporalmente.','تسجيل الدخول وإنشاء الحساب غير متاحين مؤقتًا.','暂时无法登录或注册。','Вход и регистрация временно недоступны.','현재 로그인과 가입을 이용할 수 없습니다.'],
  serviceError: ['Le formulaire de connexion est temporairement indisponible.', 'The sign-in form is temporarily unavailable.', 'El formulario de acceso no está disponible temporalmente.', 'نموذج تسجيل الدخول غير متاح مؤقتًا.', '登录表单暂时不可用。', 'Форма входа временно недоступна.', '로그인 양식을 일시적으로 이용할 수 없습니다.'],
  retry: ['Réessayer','Try again','Reintentar','إعادة المحاولة','重试','Попробовать снова','다시 시도'],
  suspended: ['Votre compte est suspendu.','Your account is suspended.','Tu cuenta está suspendida.','حسابك معلّق.','您的账户已被暂停。','Ваш аккаунт приостановлен.','계정 이용이 정지되었습니다.'],
  banned: ['Votre compte a été banni.','Your account has been banned.','Tu cuenta ha sido vetada.','تم حظر حسابك.','您的账户已被封禁。','Ваш аккаунт заблокирован.','계정 이용이 차단되었습니다.'],
  error: ['La connexion a échoué. Veuillez réessayer.','Sign-in failed. Please try again.','No se pudo iniciar sesión. Inténtalo de nuevo.','تعذّر تسجيل الدخول. يُرجى المحاولة مجددًا.','登录失败，请重试。','Не удалось войти. Повторите попытку.','로그인하지 못했습니다. 다시 시도해 주세요.'],
  waiting: ['Chargement…','Loading…','Cargando…','جارٍ التحميل…','正在加载…','Загрузка…','불러오는 중…'],
} as const;
export function readerText(lang: PublicLocale, key: keyof typeof copy) {
  return copy[key][publicLocales.indexOf(lang)];
}
