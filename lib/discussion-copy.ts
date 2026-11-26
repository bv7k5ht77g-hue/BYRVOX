import type { PublicLocale } from './i18n';

type Translations = readonly [string, string, string, string, string, string, string];
const languageIndex: Record<PublicLocale, number> = {fr:0, en:1, es:2, ar:3, 'zh-CN':4, ru:5, ko:6};

const labels = {
  heading: ['Réactions des lecteurs','Reader feedback','Opiniones de los lectores','آراء القراء','读者反馈','Отзывы читателей','독자 의견'],
  comments: ['Commentaires','Comments','Comentarios','التعليقات','评论','Комментарии','댓글'],
  rate: ['Évaluer cet article','Rate this article','Valorar este artículo','قيّم هذا المقال','为本文评分','Оценить статью','기사 평가하기'],
  yourRating: ['Votre note','Your rating','Tu puntuación','تقييمك','您的评分','Ваша оценка','내 평점'],
  average: ['Note moyenne','Average rating','Puntuación media','متوسط التقييم','平均评分','Средняя оценка','평균 평점'],
  votes: ['Nombre de notes','Number of ratings','Número de valoraciones','عدد التقييمات','评分人数','Число оценок','평가 수'],
  noRatings: ['Aucune note pour le moment.','No ratings yet.','Todavía no hay valoraciones.','لا توجد تقييمات بعد.','暂无评分。','Оценок пока нет.','아직 평점이 없습니다.'],
  outOfFive: ['{value} sur 5','{value} out of 5','{value} de 5','{value} من 5','{value} 分（满分 5 分）','{value} из 5','5점 만점에 {value}점'],
  rated: ['Votre note a été enregistrée.','Your rating has been saved.','Se ha guardado tu puntuación.','تم حفظ تقييمك.','您的评分已保存。','Ваша оценка сохранена.','평점이 저장되었습니다.'],
  write: ['Votre commentaire','Your comment','Tu comentario','تعليقك','您的评论','Ваш комментарий','내 댓글'],
  submit: ['Envoyer le commentaire','Submit comment','Enviar comentario','إرسال التعليق','提交评论','Отправить комментарий','댓글 보내기'],
  pending: ['Votre commentaire a été envoyé à la rédaction pour modération.','Your comment has been submitted for moderation.','Tu comentario se ha enviado a la redacción para su revisión.','أُرسل تعليقك إلى هيئة التحرير لمراجعته.','您的评论已提交编辑部审核。','Ваш комментарий отправлен в редакцию на модерацию.','댓글을 보냈습니다. 편집부가 검토한 뒤 게시합니다.'],
  moderation: ['La rédaction vérifie les commentaires avant leur publication.','Editors review comments before publication.','La redacción revisa los comentarios antes de publicarlos.','تراجع هيئة التحرير التعليقات قبل نشرها.','评论经编辑部审核后发布。','Редакция проверяет комментарии перед публикацией.','댓글은 편집부 검토 후 게시됩니다.'],
  noComments: ['Aucun commentaire publié pour le moment.','No comments have been published yet.','Aún no hay comentarios publicados.','لم تُنشر تعليقات بعد.','暂无已发布的评论。','Опубликованных комментариев пока нет.','아직 게시된 댓글이 없습니다.'],
  reader: ['Lecteur BYRVOX','BYRVOX reader','Lector de BYRVOX','قارئ BYRVOX','BYRVOX 读者','Читатель BYRVOX','BYRVOX 독자'],
  signIn: ['Se connecter pour participer','Sign in to take part','Inicia sesión para participar','سجّل الدخول للمشاركة','登录后参与','Войти, чтобы принять участие','로그인하고 참여하기'],
  loading: ['Chargement des avis…','Loading feedback…','Cargando las opiniones…','جارٍ تحميل آراء القراء…','正在加载读者反馈…','Загрузка отзывов…','독자 의견을 불러오는 중…'],
  retry: ['Réessayer','Try again','Reintentar','إعادة المحاولة','重试','Повторить','다시 시도'],
  loadError: ['Impossible de charger les avis.','Reader feedback could not be loaded.','No se han podido cargar las opiniones.','تعذر تحميل آراء القراء.','无法加载读者反馈。','Не удалось загрузить отзывы.','독자 의견을 불러오지 못했습니다.'],
  saveError: ['Enregistrement impossible. Réessayez dans un instant.','Unable to save. Please try again shortly.','No se ha podido guardar. Inténtalo de nuevo en un momento.','تعذّر الحفظ. حاول من جديد بعد قليل.','无法保存，请稍后重试。','Не удалось сохранить. Попробуйте немного позже.','저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'],
  rateLimit: ['Veuillez patienter avant de réessayer.','Please wait before trying again.','Espera un momento antes de volver a intentarlo.','يُرجى الانتظار قليلاً قبل المحاولة مجدداً.','请稍后重试。','Подождите немного и попробуйте ещё раз.','잠시 후 다시 시도해 주세요.'],
  restricted: ['Ce compte ne peut pas participer.','This account cannot participate.','Esta cuenta no puede participar.','لا يمكن لهذا الحساب المشاركة.','此账户无法参与。','Этот аккаунт не может участвовать в обсуждении.','이 계정으로는 참여할 수 없습니다.'],
  more: ['Afficher plus de commentaires','Show more comments','Mostrar más comentarios','عرض المزيد من التعليقات','显示更多评论','Показать ещё комментарии','댓글 더 보기'],
} satisfies Record<string, Translations>;

export function discussionText(locale: PublicLocale, key: keyof typeof labels): string {
  return labels[key][languageIndex[locale]];
}
