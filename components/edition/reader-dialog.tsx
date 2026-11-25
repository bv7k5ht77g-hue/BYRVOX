import { useEffect, useRef, useState } from 'react';
import { editionHref } from '../../lib/edition';

const policies = {
  'Politique éditoriale': 'Nous distinguons faits, analyses et opinions. La rédaction vérifie les sources et valide les articles avant publication. Les brouillons produits avec une IA restent soumis à une vérification humaine.',
  'Corrections': 'Une erreur doit donner lieu à une correction explicite. Le système éditorial conserve les versions et les décisions de validation. Le contact éditorial sera communiqué dès son ouverture.',
  'Confidentialité': 'Tes préférences et tes articles sauvegardés sont associés à ton identité de connexion. Tu peux les exporter ou les effacer depuis ton profil. Cette version ne comporte aucun outil publicitaire ni suivi tiers d’audience.',
  'Conditions d’utilisation': 'Le site est en phase de lancement. Les présentations décrivent le projet et ses futurs services. Les modalités commerciales, la société éditrice et le contact officiel seront précisés avant le lancement commercial.'
};
export type DialogName = keyof typeof policies | 'recherche' | 'connexion' | 'profil' | 'abonnement' | 'newsletters' | 'marques';
export type Profile = { name: string; preferences: { saved: string[]; topics: string[] } };

export function ReaderDialog({ name, close, open, profile, currentUrl, query, pending, clear }: {
  name: DialogName; close: () => void; open: (name: DialogName) => void; profile: Profile | null;
  currentUrl: string; query: string; pending: boolean; clear: () => Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
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
    <button className="close" aria-label="Fermer" onClick={close}>×</button>
    <p className="eyebrow">BYRVOX</p>
    {name === 'recherche' ? <>
      <h2 id="reader-dialog-title">Rechercher sur BYRVOX</h2>
      <form action="/" role="search"><input type="hidden" name="rubrique" value="recherche" />
        <label htmlFor="site-search">Titre, sujet ou rubrique</label><input id="site-search" type="search" name="q" autoFocus defaultValue={query} maxLength={160} />
        <button className="red">Rechercher →</button></form>
    </> : name === 'connexion' ? <>
      <h2 id="reader-dialog-title">Bienvenue chez BYRVOX.</h2><p>Connecte-toi pour retrouver tes articles sauvegardés et ton espace personnel.</p>
      <a className="red" href={'/signin-with-chatgpt?return_to=' + encodeURIComponent(currentUrl)} target="_top">Continuer avec ChatGPT →</a>
    </> : name === 'profil' ? <>
      <h2 id="reader-dialog-title">Ton espace</h2><p>{profile?.name}</p>
      <a className="outline" href={editionHref('favoris')}>Mes articles sauvegardés</a>
      <button className="outline" onClick={exportData}>Exporter mes données</button>
      {confirm ? <div><p>Effacer les favoris et préférences de ce compte ?</p>
        <button className="outline" onClick={() => setConfirm(false)}>Annuler</button>
        <button className="red" disabled={pending} onClick={clear}>Confirmer l’effacement</button></div> :
        <button className="outline" onClick={() => setConfirm(true)}>Effacer mes préférences BYRVOX</button>}
      <a href={'/signout-with-chatgpt?return_to=' + encodeURIComponent(currentUrl)} target="_top">Se déconnecter</a>
    </> : name === 'newsletters' ? <>
      <h2 id="reader-dialog-title">Les newsletters en préparation</h2>
      <dl>{[['Breaking', 'Les événements majeurs'], ['Morning Brief', 'Commencer la journée'], ['Evening Brief', 'Prendre du recul'], ['Weekly', 'La semaine en perspective']].map(([title, text]) =>
        <div key={title}><dt>{title}</dt><dd>{text}</dd></div>)}</dl><p>Les inscriptions ouvriront lorsque les éditions seront prêtes à être envoyées.</p>
    </> : name === 'abonnement' ? <>
      <h2 id="reader-dialog-title">Les abonnements BYRVOX</h2><p>Les offres Premium sont en préparation. Les lectures sauvegardées sont déjà accessibles avec un compte gratuit.</p>
      <button className="red" onClick={() => open(profile ? 'profil' : 'connexion')}>Accéder à mon espace</button>
    </> : name === 'marques' ? <>
      <h2 id="reader-dialog-title">Les marques du groupe</h2><p>BYRVOX News, BYRVOX Radio et BYRVOX TV forment les trois pôles du média BYRVOX.</p>
      <p>RadioYO et TVYO sont deux marques distinctes du groupe. Chacune prépare sa propre programmation.</p>
    </> : <><h2 id="reader-dialog-title">{name}</h2><p>{policies[name]}</p><small>Édition de lancement · documents à finaliser par l’éditeur.</small></>}
  </dialog>;
}
