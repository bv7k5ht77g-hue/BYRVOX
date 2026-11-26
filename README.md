# BYRVOX — Beyond the Headlines

Version 0.7.0 · novembre 2026. [Ouvrir BYRVOX](https://byrvox.noventra.ca)

Média numérique publié en français, anglais, espagnol, arabe, chinois simplifié, russe et coréen. Le site utilise Next/React sur Vinext, Cloudflare Workers, D1 et R2.

## Démarrage

Node >=22.13.0. Installer via `node scripts/install-ci.mjs`, puis `npm run dev`. Créer les variables locales d’après `.env.example` sans les committer. Les secrets hébergés se configurent dans le gestionnaire du fournisseur.

Le schéma est dans `db/schema.ts`, les migrations dans `drizzle/`. Générer les migrations avec `npm run db:generate`. Le déploiement Sites applique les migrations hébergées. Une base locale nécessite leur application séparée.

## Portail éditeur

Le [portail de la rédaction](https://byrvox.noventra.ca/admin) est réservé aux comptes autorisés. Après identification, le tableau de bord s’ouvre sur `byrvox.noventra.ca/admin`. La barre latérale reste visible sur grand écran. Le bouton soleil ou lune conserve le thème choisi pour le portail. Dans le tableau de bord, la rédaction peut choisir un article publié pour la une ou laisser apparaître la dernière publication. Chaque article peut recevoir une photo de couverture et jusqu’à quatre photos complémentaires. L’éditeur accepte les formats JPEG, PNG et WebP, jusqu’à 8 Mio par fichier. Pour publier une nouvelle photo, la rédaction renseigne le texte alternatif, le crédit et une légende qui précise ce que montre l’image. Elle peut aussi ajouter un lien vers la source. D1 conserve les métadonnées et R2 les fichiers téléversés. Pour choisir la couverture, privilégier une photo de l’événement. Une archive du même lieu, chantier ou protagoniste peut convenir si la légende explique le lien avec l’article et précise quand l’image a été prise. Pour une statistique, un graphique sourcé peut mieux expliquer le sujet. Conserver le crédit, la source et les conditions de réutilisation avec chaque visuel.

### Inviter et approuver

Depuis [le portail](https://byrvox.noventra.ca/admin), choisir **Se connecter à la rédaction** et utiliser le compte ChatGPT associé au courriel autorisé. Les propriétaires configurés dans `ADMIN_EMAILS` disposent de l’onglet **Équipe**. Saisir le courriel du collaborateur, sélectionner **Contributeur** ou **Approbateur**, puis choisir **Ajouter l’accès** et lui transmettre le lien du portail. Le contributeur peut préparer son propre article, joindre des photos et soumettre son travail. Les propriétaires et les approbateurs disposent de la file **À approuver** pour publier une soumission ou la renvoyer pour correction.

## Édition horaire

La tâche « Publier l’édition horaire BYRVOX » est planifiée à chaque heure selon le fuseau de Toronto. Elle recherche quinze événements distincts, vérifie leurs sources et les droits sur les photos, puis livre les articles prêts à publier. Une édition peut compter moins de quinze articles lorsque les éléments requis ne sont pas réunis. Les éditions sont conservées dans `newswire/`. [Procédure de rédaction et de publication](docs/EDITION_HORAIRE.md) · [Registre des publications](https://byrvox.noventra.ca/api/newswire).

La navigation affiche les observations d’Environnement et Changement climatique Canada pour la ville choisie. La barre de lecture suit le défilement. Sous chaque article, le carrousel commence par des sujets apparentés puis propose d’autres lectures. Un emplacement publicitaire suit la navigation. Sur l’accueil, un second suit la manchette. Les emplacements disponibles sont signalés jusqu’à la réservation d’une campagne.

## Fonctionnel

- La une affiche la sélection de la rédaction ou, en mode automatique, la dernière publication du CMS. Les rubriques, recherches et filtres ont une adresse partageable. Les articles conservent le thème de lecture.
- Connexion via l’identité ChatGPT du fournisseur ; favoris personnels, export et suppression des préférences.
- Le serveur vérifie le rôle pour chaque opération de rédaction. Les identités propriétaires sont configurées par l’hébergeur, et les accès des collaborateurs sont gérés depuis l’onglet Équipe.
- Le CMS conserve la version publique pendant la préparation ou la restauration d’un brouillon. Une republication explicite met à jour l’article.
- Le flux public `/rss.xml` contient les 50 dernières publications. Le plan du site `/sitemap.xml` référence aussi les rubriques et les articles de présentation.
- Collecte des métadonnées NASA RSS à la demande, déduplication par URL et journal d’exécution. Les pistes restent non vérifiées.
- Endpoint de brouillon IA, limité à une demande par minute et par administrateur, sur faits fournis et sources explicites. La clé serveur doit être configurée pour le rendre opérationnel. Aucun appel ou texte IA n’est présenté comme vérifié.

## Limites de cette livraison

Ce produit ne constitue pas l’ensemble du cahier des charges. La surveillance permanente toutes les 60 secondes, la génération vidéo/voix/avatars, les newsletters, la distribution sociale, les flux radio/TV, les rôles multiples, la bibliothèque multimédia et les paiements restent à développer ou raccorder. RadioYO et TVYO sont des marques distinctes, pas des remplacements des pôles BYRVOX.

L’interface signale les modules indisponibles et n’affiche aucun chiffre d’audience inventé. La validation d’un article par un administrateur n’est pas un fact-check automatisé. Les documents légaux sont des textes de lancement incomplets, à finaliser par l’éditeur avant lancement commercial.

Les illustrations sont extraites du mockup fourni ; elles ne sont pas des photographies d’événements d’actualité. Leur licence doit être confirmée pour l’exploitation commerciale.

## Validation

`node --test tests/editorial.test.mjs`

`node node_modules/typescript/bin/tsc --noEmit`

`npm run build`

`node --test tests/worker-cms.mjs` exécute le Worker compilé avec une base D1 temporaire.

## Architecture

`app/` : site, articles, administration et API ; `db/` : schéma D1 ; `lib/` : identité et règles éditoriales ; `public/brand` : logos ; `public/media` : illustrations du mockup ; `docs/` : état et feuille de route ; `tests/` : règles de publication ; `worker/` : point d’entrée serveur.

Les écritures authentifiées vérifient l’origine. Le contenu des articles est rendu comme texte React et ne peut exécuter du HTML collecté. Les collecteurs n’acceptent aucune URL arbitraire. La clé API, les emails d’administration et les jetons d’accès ne doivent jamais être versionnés.

## Historique de l’édition de lancement du 25 novembre 2026

À l’ouverture du Command Center par un administrateur, le serveur importe les lots disponibles. L’édition initiale compte quinze articles, dont celui consacré à Haïti. Le supplément ajoute le sujet sur Middletown. Le dossier de lecture révisé comporte quinze articles, avec l’Iowa en ouverture et le manuscrit sur Haïti conservé en réserve dans la rédaction. Chaque texte importé entre dans le circuit « En vérification ». Chaque texte et ses références sont modifiables dans l’onglet Articles. Le bouton de publication rend uniquement l’article sélectionné visible aux lecteurs et l’ajoute au RSS.

Le dépôt public conserve les fichiers chiffrés `lib/review/2026-11-25.json` et `lib/review/2026-11-25-iowa.json`. Le serveur lit leurs clés AES-GCM dans les secrets `BYRVOX_REVIEW_KEY_20261125` et `BYRVOX_REVIEW_KEY_20261125_IOWA`, respectivement. Si une seule clé est configurée, le lot correspondant peut être importé. Lorsqu’une édition est déjà installée, le Command Center ajoute le lot manquant dès qu’il est disponible. D1 conserve les modifications et l’historique des articles déjà importés.
