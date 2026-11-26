import { Bookmark, CircleUserRound, Download, Search, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePublicLocale } from '../language-select';
import { localizedHref } from '../../lib/i18n';
import { legacySignOutUrl, readerAccountUrl, readerText } from '../../lib/reader-links';
import dialogCopy from '../../lib/translations/dialog.json';
import { editionHref } from '../../lib/edition';

const policies = {
  'Politique éditoriale': 'Un membre de la rédaction valide les articles préparés dans le portail. Pour le fil horaire, l’agent BYRVOX recoupe au moins deux sources indépendantes, vérifie la photo et ses droits, puis recherche d’éventuels doublons avant de publier automatiquement sous sa signature. La rédaction peut corriger tout article publié.',
  'Corrections': 'Une erreur doit donner lieu à une correction explicite. Le système éditorial conserve les versions et les décisions de validation. Le contact éditorial sera communiqué dès son ouverture.',
  'Confidentialité': 'Tes préférences et tes articles sauvegardés sont associés à ton compte. Tu peux les exporter ou les effacer depuis ton profil. Pour gérer les accès, les responsables de la rédaction peuvent consulter ton nom, ton prénom, ton courriel, ta dernière adresse IP et ton emplacement approximatif. BYRVOX conserve les 100 dernières activités de ton compte, y compris les connexions, les pages lues pendant tes sessions et les décisions de modération. Les espaces publicitaires sont identifiés comme tels.',
  'Conditions d’utilisation': 'Le site est en phase de lancement. Les présentations décrivent le projet et ses futurs services. Les modalités commerciales, la société éditrice et le contact officiel seront précisés avant le lancement commercial.'
};
export type DialogName = keyof typeof policies | 'recherche' | 'connexion' | 'profil' | 'abonnement' | 'newsletters' | 'marques';
export type Profile = { name: string; legacy?: boolean; preferences: { saved: string[]; topics: string[] } };

export function ReaderDialog({ name, close, open, profile, currentUrl, query, pending, clear }: {
  name: DialogName; close: () => void; open: (name: DialogName) => void; profile: Profile | null;
  currentUrl: string; query: string; pending: boolean; clear: () => Promise<void>;
}) {
  const locale = usePublicLocale();
  const words: Record<string, string> = locale === 'fr' ? {} : dialogCopy[locale];
  const label = (source: string) => words[source] || source;
  const ref = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    searchInput.current?.focus();
    return () => { dialog?.close(); };
  }, []);
  function exportData() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'byrvox-mes-donnees.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <dialog className="modal reader-dialog" ref={ref} aria-labelledby="reader-dialog-title"
    onCancel={event => { event.preventDefault(); close(); }} onClick={event => {
      if (event.target === event.currentTarget) {
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
      }
    }}>
    <button className="close" aria-label={label("Fermer")} onClick={close}><X size={20} aria-hidden="true" /></button>
    <p className="eyebrow">BYRVOX</p>
    {name === 'recherche' ? <>
      <h2 id="reader-dialog-title">{label("Rechercher sur BYRVOX")}</h2>
      <form action="/" role="search"><input type="hidden" name="rubrique" value="recherche" /><input type="hidden" name="lang" value={locale} />
        <label htmlFor="site-search">{label("Titre, sujet ou rubrique")}</label><input id="site-search" type="search" name="q" ref={searchInput} defaultValue={query} maxLength={160} />
        <button className="red"><Search size={16} aria-hidden="true" /> {label("Rechercher")}</button></form>
    </> : name === 'connexion' ? <>
      <h2 id="reader-dialog-title">{label("Bienvenue chez BYRVOX.")}</h2><p>{label("Connecte-toi pour retrouver tes articles sauvegardés et ton espace personnel.")}</p>
      <a className="red" href={readerAccountUrl('connexion',localizedHref(currentUrl,locale),locale)} target="_top"><CircleUserRound size={16} aria-hidden="true" /> {readerText(locale,'connexion')}</a>
      <a className="outline" href={readerAccountUrl('inscription',localizedHref(currentUrl,locale),locale)} target="_top">{readerText(locale,'inscription')}</a>
      <button className="outline" onClick={() => open('Confidentialité')}>{label("Confidentialité")}</button>
    </> : name === 'profil' ? <>
      <h2 id="reader-dialog-title">{label("Ton espace")}</h2><p>{profile?.name}</p>
      <a className="outline" href={localizedHref(editionHref('favoris'),locale)}><Bookmark size={16} aria-hidden="true" /> {label("Mes articles sauvegardés")}</a>
      <button className="outline" onClick={exportData}><Download size={16} aria-hidden="true" /> {label("Exporter mes données")}</button>
      {confirm ? <div><p>{label("Effacer les favoris et préférences de ce compte ?")}</p>
        <button className="outline" onClick={() => setConfirm(false)}>{label("Annuler")}</button>
        <button className="red" disabled={pending} onClick={clear}>{label("Confirmer l’effacement")}</button></div> :
        <button className="outline" onClick={() => setConfirm(true)}><Trash2 size={16} aria-hidden="true" /> {label("Effacer mes préférences BYRVOX")}</button>}
      <a href={profile?.legacy ? legacySignOutUrl(locale) : readerAccountUrl('sortie',localizedHref(currentUrl,locale),locale)} target="_top">{label("Se déconnecter")}</a>
    </> : name === 'newsletters' ? <>
      <h2 id="reader-dialog-title">{label("Les newsletters en préparation")}</h2>
      <dl>{[['Breaking', 'Les événements majeurs'], ['Morning Brief', 'Commencer la journée'], ['Evening Brief', 'Prendre du recul'], ['Weekly', 'La semaine en perspective']].map(([title, text]) =>
        <div key={title}><dt>{title}</dt><dd>{label(text)}</dd></div>)}</dl><p>{label("Les inscriptions ouvriront lorsque les éditions seront prêtes à être envoyées.")}</p>
    </> : name === 'abonnement' ? <>
      <h2 id="reader-dialog-title">{label("Les abonnements BYRVOX")}</h2><p>{label("Les offres Premium sont en préparation. Les lectures sauvegardées sont déjà accessibles avec un compte gratuit.")}</p>
      <button className="red" onClick={() => open(profile ? 'profil' : 'connexion')}>{label("Accéder à mon espace")}</button>
    </> : name === 'marques' ? <>
      <h2 id="reader-dialog-title">{label("Les marques du groupe")}</h2><p>{label("BYRVOX News, BYRVOX Radio et BYRVOX TV forment les trois pôles du média BYRVOX.")}</p>
      <p>{label("RadioYO et TVYO sont deux marques distinctes du groupe. Chacune prépare sa propre programmation.")}</p>
    </> : <><h2 id="reader-dialog-title">{label(name)}</h2><p>{label(policies[name])}</p>{name === 'Confidentialité' && <p>{label("La rédaction examine les commentaires avant leur publication. Chaque compte lecteur peut attribuer une note par article et la modifier. La moyenne des notes est publique.")}</p>}<small>{label("Édition de lancement · documents à finaliser par l’éditeur.")}</small></>}
  </dialog>;
}
