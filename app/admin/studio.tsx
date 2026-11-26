export function StudioPanel({ onOpenArticles }: { onOpenArticles: () => void }) {
  return <section className="panel portal-studio" aria-labelledby="studio-status">
    <h2 id="studio-status">Production vidéo inactive</h2>
    <p>Les formats prévus pour BYRVOX Brief durent 30, 60 ou 90 secondes. Aujourd’hui, la rédaction peut choisir un article publié et consulter ses sources pour préparer le texte du bulletin.</p>
    <button type="button" className="outline" onClick={onOpenArticles}>Consulter les articles publiés</button>
    <h3>Ce qu’il reste à mettre en place</h3>
    <ul>
      <li><strong>Texte à lire.</strong> Relier le script à la version de l’article utilisée, le faire relire et vérifier sa durée à voix haute.</li>
      <li><strong>Voix et présentateur.</strong> Choisir une voix et un avatar, documenter les droits d’utilisation et connecter la synthèse vocale et l’animation. Le bulletin devra identifier le présentateur synthétique.</li>
      <li><strong>Montage et sous-titres.</strong> Synchroniser la voix, l’image et les sous-titres, vérifier les noms et les chiffres, puis produire un fichier vidéo avec l’habillage BYRVOX.</li>
      <li><strong>Diffusion.</strong> Prévoir une prévisualisation pour la rédaction, une approbation du fichier final et une destination de publication autorisée.</li>
    </ul>
  </section>;
}
