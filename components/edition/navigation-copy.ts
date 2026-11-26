import type { PublicLocale } from '../../lib/i18n';

const order: PublicLocale[] = ['fr','en','es','ar','zh-CN','ru','ko'];
const labels = {
  main:['Navigation principale','Main navigation','Navegación principal','القائمة الرئيسية','主导航','Главное меню','기본 탐색'],
  search:['Rechercher','Search','Buscar','بحث','搜索','Поиск','검색'],
  light:['Activer le thème clair','Use light mode','Activar modo claro','المظهر الفاتح','浅色模式','Светлая тема','라이트 모드'],
  dark:['Activer le thème sombre','Use dark mode','Activar modo oscuro','المظهر الداكن','深色模式','Тёмная тема','다크 모드'],
  account:['Mon compte','My account','Mi cuenta','حسابي','我的账户','Мой аккаунт','내 계정'],
  login:['Se connecter','Sign in','Iniciar sesión','تسجيل الدخول','登录','Войти','로그인'],
  menu:['Menu','Menu','Menú','القائمة','菜单','Меню','메뉴'],
  skip:['Aller au contenu','Skip to content','Ir al contenido','انتقل إلى المحتوى','跳到正文','К содержанию','본문으로 이동'],
  close:['Fermer','Close','Cerrar','إغلاق','关闭','Закрыть','닫기'],
  explore:['Explorer','Explore','Explorar','استكشف','探索','Рубрики','둘러보기'],
  group:['Le groupe','The group','El grupo','المجموعة','集团','Медиагруппа','그룹'],
  perspective:['Un nouveau regard sur le monde.','A new perspective on the world.','Una nueva mirada al mundo.','نظرة جديدة إلى العالم.','用新的视角看世界。','Новый взгляд на мир.','세상을 보는 새로운 시각.'],
  method:['Notre démarche','Our approach','Nuestro enfoque','نهجنا','我们的理念','Наш подход','편집 방향'],
  subscriptions:['Abonnements','Subscriptions','Suscripciones','الاشتراكات','订阅','Подписки','구독'],
  editor:['Portail éditeur','Editor portal','Portal editorial','بوابة التحرير','编辑门户','Редакторский портал','편집자 포털'],
  rss:['Flux RSS','RSS feed','Canal RSS','موجز RSS','RSS 订阅','Лента RSS','RSS 피드'],
  transparency:['Transparence','Transparency','Transparencia','الشفافية','透明度','Прозрачность','투명성'],
  editorial:['Politique éditoriale','Editorial policy','Política editorial','السياسة التحريرية','编辑方针','Редакционная политика','편집 방침'],
  corrections:['Corrections','Corrections','Correcciones','التصحيحات','更正','Исправления','정정'],
  privacy:['Confidentialité','Privacy','Privacidad','الخصوصية','隐私','Конфиденциальность','개인정보 보호'],
  terms:['Conditions d’utilisation','Terms of use','Condiciones de uso','شروط الاستخدام','使用条款','Условия использования','이용약관'],
  save:['Sauvegarder','Save','Guardar','حفظ','收藏','Сохранить','저장'],
  saved:['Enregistré','Saved','Guardado','محفوظ','已收藏','Сохранено','저장됨'],
  remove:['Retirer des favoris','Remove bookmark','Quitar de favoritos','إزالة من المفضلة','取消收藏','Убрать из закладок','저장 취소'],
  unavailable:['Ton espace est temporairement indisponible.','Your account is temporarily unavailable.','Tu cuenta no está disponible por el momento.','حسابك غير متاح مؤقتاً.','账户暂时无法使用。','Аккаунт временно недоступен.','계정을 일시적으로 이용할 수 없습니다.'],
  cleared:['Tes préférences ont été effacées.','Your preferences were cleared.','Se han borrado tus preferencias.','تم حذف تفضيلاتك.','偏好设置已清除。','Настройки удалены.','설정을 삭제했습니다.'],
  removed:['Article retiré des favoris.','Bookmark removed.','Artículo eliminado de favoritos.','أُزيل المقال من المفضلة.','已取消收藏。','Закладка удалена.','즐겨찾기에서 삭제했습니다.'],
  added:['Article ajouté aux favoris.','Article saved.','Artículo guardado.','أُضيف المقال إلى المفضلة.','文章已收藏。','Статья добавлена в закладки.','기사를 저장했습니다.'],
  failed:['Impossible de modifier tes préférences. Réessaie dans un instant.','Unable to update preferences. Please try again.','No se pudieron guardar tus preferencias. Inténtalo de nuevo.','تعذر تحديث تفضيلاتك. حاول مرة أخرى.','无法更改偏好，请重试。','Не удалось обновить настройки. Попробуйте ещё раз.','설정을 변경하지 못했습니다. 다시 시도해 주세요.']
} as const;
export const navText = (locale: PublicLocale, key: keyof typeof labels) => labels[key][order.indexOf(locale)];
