import "../reader.css";

export default function ArticleNotFound() {
  return (
    <main className="reader-main reader-heading">
      <h1>Article introuvable</h1>
      <p className="reader-deck">Ce lien ne correspond à aucun article publié.</p>
      <a href="/?rubrique=actualites" className="reader-back">Voir les actualités BYRVOX →</a>
    </main>
  );
}
