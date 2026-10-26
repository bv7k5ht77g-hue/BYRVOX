# BYRVOX — Beyond the Headlines

Version 0.1.0 — première livraison, octobre 2026.

Plateforme francophone Next/React sur Vinext, Cloudflare Workers et D1. Design basé sur le mockup fourni, logos officiels conservés. Le site démarre avec des contenus de présentation identifiés, sans actualités inventées.

## Démarrage

Node >=22.13.0. Installer via `node scripts/install-ci.mjs`, puis `npm run dev`. Créer les variables locales d’après `.env.example` sans les committer. Les secrets hébergés se configurent dans le gestionnaire du fournisseur.

Le schéma est dans `db/schema.ts`, les migrations dans `drizzle/`. Générer les migrations avec `npm run db:generate`. Le déploiement Sites applique les migrations hébergées. Une base locale nécessite leur application séparée.

## Fonctionnel

- Accueil responsive, thèmes clair et sombre (#333333), navigation, recherche, filtres, pages d’articles.
- Connexion via l’identité ChatGPT du fournisseur ; favoris personnels, export et suppression des préférences.
- Command Center réservé aux emails explicitement présents dans le secret `ADMIN_EMAILS`. Autorisation vérifiée côté serveur pour chaque action. Aucun rôle attribué automatiquement au premier visiteur.
- CMS D1 : brouillon, vérification, publication validée, révisions immuables et restauration en brouillon.
- Collecte des métadonnées NASA RSS à la demande, déduplication par URL et journal d’exécution. Les pistes restent non vérifiées.
- Endpoint de brouillon IA, limité à une demande par minute et par administrateur, sur faits fournis et sources explicites. La clé serveur doit être configurée pour le rendre opérationnel. Aucun appel ou texte IA n’est présenté comme vérifié.

## Limites de cette livraison

Ce produit ne constitue pas l’ensemble du cahier des charges. La surveillance permanente toutes les 60 secondes, la vérification indépendante automatisée, la génération vidéo/voix/avatars, les newsletters, la distribution sociale, les flux radio/TV, les rôles multiples, la bibliothèque multimédia et les paiements restent à développer ou raccorder. RadioYO et TVYO sont des marques distinctes, pas des remplacements des pôles BYRVOX.

L’interface signale les modules indisponibles et n’affiche aucun chiffre d’audience inventé. La validation d’un article par un administrateur n’est pas un fact-check automatisé. Les documents légaux sont des textes de lancement incomplets, à finaliser par l’éditeur avant lancement commercial.

Les illustrations sont extraites du mockup fourni ; elles ne sont pas des photographies d’événements d’actualité. Leur licence doit être confirmée pour l’exploitation commerciale.

## Validation

`node --test tests/editorial.test.mjs`

`node node_modules/typescript/bin/tsc --noEmit`

`npm run build`

## Architecture

`app/` : site, articles, administration et API ; `db/` : schéma D1 ; `lib/` : identité et règles éditoriales ; `public/brand` : logos ; `public/media` : illustrations du mockup ; `docs/` : état et feuille de route ; `tests/` : règles de publication ; `worker/` : point d’entrée serveur.

Les écritures authentifiées vérifient l’origine. Le contenu des articles est rendu comme texte React et ne peut exécuter du HTML collecté. Les collecteurs n’acceptent aucune URL arbitraire. La clé API, les emails d’administration et les jetons d’accès ne doivent jamais être versionnés.
