# BYRVOX — Beyond the Headlines

Version 0.11.0 · novembre 2026. [Ouvrir BYRVOX](https://byrvox.today)

Média numérique publié en français, anglais, espagnol, arabe, chinois simplifié, russe et coréen. Le site utilise Next/React sur Vinext, Cloudflare Workers, D1 et R2.

## Démarrage

Node >=22.13.0. Installer via `node scripts/install-ci.mjs`, puis `npm run dev`. Créer les variables locales d’après `.env.example` sans les committer. Les secrets hébergés se configurent dans le gestionnaire du fournisseur.

Le schéma est dans `db/schema.ts`, les migrations dans `drizzle/`. Générer les migrations avec `npm run db:generate`. Le déploiement Sites applique les migrations hébergées. Une base locale nécessite leur application séparée.

## Portail éditeur

Le [portail de la rédaction](https://byrvox.noventra.ca/admin) est réservé aux comptes autorisés. Après identification, le tableau de bord s’ouvre sur `byrvox.noventra.ca/admin`. La barre latérale reste visible sur grand écran. Le bouton soleil ou lune conserve le thème choisi pour le portail. Dans le tableau de bord, la rédaction peut choisir un article publié pour la une ou laisser apparaître la dernière publication. Chaque article peut recevoir une photo de couverture et jusqu’à quatre photos complémentaires. L’éditeur accepte les formats JPEG, PNG et WebP, jusqu’à 8 Mio par fichier. Pour publier une nouvelle photo, la rédaction renseigne le texte alternatif, le crédit et une légende qui précise ce que montre l’image. Elle peut aussi ajouter un lien vers la source. D1 conserve les métadonnées et R2 les fichiers téléversés. Pour choisir la couverture, privilégier une photo de l’événement. Choisir ensuite la photo d’archives la plus récente dans le même contexte. Un joueur doit porter le maillot de l’équipe dont parle l’article. Identifier en légende la rencontre ou le contexte réel et la date de prise de vue connue. Pour une statistique, un graphique sourcé peut mieux expliquer le sujet. Conserver le crédit, la source et les conditions de réutilisation avec chaque visuel.

### Inviter et approuver

Depuis [le portail](https://byrvox.noventra.ca/admin), choisir **Se connecter à la rédaction** et utiliser le compte ChatGPT associé au courriel autorisé. Les propriétaires configurés dans `ADMIN_EMAILS` disposent de l’onglet **Équipe**. Saisir le courriel du collaborateur, sélectionner **Contributeur** ou **Approbateur**, puis choisir **Ajouter l’accès** et lui transmettre le lien du portail. Le contributeur peut préparer son propre article, joindre des photos et soumettre son travail. Les propriétaires et les approbateurs disposent de la file **À approuver** pour publier une soumission ou la renvoyer pour correction.

## Comptes lecteurs et modération

La connexion et l’inscription des lecteurs passent par la [page de compte BYRVOX](https://byrvox.today/compte). Pour activer Clerk, associer une instance de production à `byrvox.today`, valider les enregistrements DNS indiqués par Clerk, activer le courriel vérifié et les champs de prénom et de nom dans cette instance. Configurer `CLERK_PUBLISHABLE_KEY` et le secret serveur `CLERK_SECRET_KEY` dans les variables du site puis publier la version avec cette configuration. [Guide de production de Clerk](https://clerk.com/docs/guides/development/deployment/production).

La page compte monte les formulaires officiels de connexion et d’inscription de Clerk dans la langue du lecteur. Les options proposées suivent les méthodes activées dans l’instance de production. Après vérification de la session, BYRVOX ramène le lecteur à l’article ouvert.

Dans **Portail éditeur → Lecteurs**, les propriétaires et approbateurs peuvent retrouver un compte par nom ou courriel, consulter sa fiche, le suspendre, le bannir ou rétablir son accès. La fiche affiche les coordonnées fournies par le compte et, lorsqu’elles sont disponibles, la dernière adresse IP et la localisation approximative communiquées par l’hébergeur. L’historique conserve les 100 événements les plus récents par lecteur, y compris les changements de statut. Les mesures de modération s’appliquent au compte, et la presse publique reste accessible en lecture anonyme.

## Espaces publicitaires

Avant la publication manuelle, un propriétaire ou un approbateur examine le texte, les images et les liens puis consigne sa décision publicitaire. Il peut publier sans annonces et modifier ensuite la diffusion sur cet article depuis le portail. Ce réglage vaut pour les sept langues et couvre les bannières, les intégrations tierces et Google AdSense. Les nouvelles publications automatiques sont diffusées sans annonces en attendant cet examen.

Dans **Portail éditeur → Espaces publicitaires**, les propriétaires et les approbateurs gèrent les huit emplacements du site. Chaque emplacement peut signaler sa disponibilité, diffuser une campagne ou être masqué. Pour une campagne, renseigner le nom de l’annonceur et son lien HTTPS. Une bannière facultative peut être téléversée (JPEG, PNG ou WebP, 8 Mio maximum) ou fournie par URL. Une bannière nécessite un texte alternatif. Les changements enregistrés s’appliquent aux pages publiques lors de leur prochain chargement.

Pour Google AdSense, coller le code fourni par Google dans la configuration AdSense du portail, enregistrer le compte puis activer le chargement sur le site quand la régie est prête. Google contrôle la diffusion des annonces automatiques dans le compte de l’éditeur. Pour réserver un emplacement précis, choisir AdSense sur cet emplacement et coller le code du bloc correspondant, qui contient son identifiant `data-ad-slot`. La configuration du compte et celle des emplacements sont modifiables sans redéployer le site.

Pour une autre régie, choisir le mode iframe ou script externe de l’emplacement et coller la balise HTTPS fournie par le partenaire. BYRVOX conserve l’adresse de la création et son titre. Les intégrations tierces s’affichent dans un cadre isolé. Le mode script accepte une balise avec une adresse `src` et un corps vide.

## Édition horaire

La tâche « Publier l’édition horaire BYRVOX » est planifiée à chaque heure selon le fuseau de Toronto. Elle livre jusqu’à sept événements distincts après vérification des sources et des droits. La photographie doit montrer le sujet principal dans le contexte rapporté. Parmi les clichés comparables, la rédaction privilégie le plus récent d’après sa date de prise de vue. La rédaction peut retenir moins de sept articles lorsque les faits ou le visuel demandent des vérifications supplémentaires. Les éditions sont conservées dans `newswire/`. [Procédure de rédaction et de publication](docs/EDITION_HORAIRE.md) · [Registre des publications](https://byrvox.noventra.ca/api/newswire).

La navigation affiche les observations d’Environnement et Changement climatique Canada pour la ville choisie. La barre de lecture suit le défilement. Sous chaque article, le carrousel commence par des sujets apparentés puis propose d’autres lectures. Un emplacement publicitaire suit la navigation. Sur l’accueil, un second suit la manchette. Dans les articles illustrés, un emplacement suit la photo de couverture et son crédit, avant le premier paragraphe. Les emplacements disponibles sont signalés jusqu’à la réservation d’une campagne.

## Fonctionnel

- La une affiche la sélection de la rédaction ou, en mode automatique, la dernière publication du CMS. Les rubriques, recherches et filtres ont une adresse partageable. Les articles conservent le thème de lecture.
- Comptes lecteurs avec favoris personnels, export et suppression des préférences.
- Le serveur vérifie le rôle pour chaque opération de rédaction. Les identités propriétaires sont configurées par l’hébergeur, et les accès des collaborateurs sont gérés depuis l’onglet Équipe.
- Le CMS conserve la version publique pendant la préparation ou la restauration d’un brouillon. Une republication explicite met à jour l’article.
- Le flux public `/rss.xml` contient les 50 dernières publications. Le plan du site `/sitemap.xml` référence aussi les rubriques et les articles de présentation.
- Collecte des métadonnées NASA RSS à la demande, déduplication par URL et journal d’exécution. Les pistes restent non vérifiées.
- Endpoint de brouillon IA, limité à une demande par minute et par administrateur, sur faits fournis et sources explicites. La clé serveur doit être configurée pour le rendre opérationnel. Aucun appel ou texte IA n’est présenté comme vérifié.

## Limites de cette livraison

Ce produit ne constitue pas l’ensemble du cahier des charges. La surveillance permanente toutes les 60 secondes, la génération vidéo/voix/avatars, les newsletters, la distribution sociale, les flux radio/TV, les rôles multiples, la bibliothèque multimédia et les paiements restent à développer ou raccorder. RadioYO et TVYO sont des marques distinctes, pas des remplacements des pôles BYRVOX.

L’interface signale les modules indisponibles et n’affiche aucun chiffre d’audience inventé. La validation d’un article par un administrateur n’est pas un fact-check automatisé. Les documents légaux sont des textes de lancement incomplets, à finaliser par l’éditeur avant lancement commercial.

Les neuf illustrations de marque de l’accueil et de ses pages de destination ont été générées pour BYRVOX. Les fichiers WebP et leurs variantes de 720 pixels sont regroupés dans `public/media/collection-2026/`. Les fiches de présentation identifient ces images dans leur légende. Les illustrations antérieures issues de la maquette ont une provenance distincte et leur licence reste à confirmer pour l’exploitation commerciale.

## Validation

`node --test tests/editorial.test.mjs`

`node node_modules/typescript/bin/tsc --noEmit`

`npm run build`

`node --test tests/worker-cms.mjs` exécute le Worker compilé avec une base D1 temporaire.

## Architecture

`app/` : site, articles, administration et API ; `db/` : schéma D1 ; `lib/` : identité et règles éditoriales ; `public/brand` : logos ; `public/media` : illustrations de marque et médias éditoriaux ; `docs/` : état et feuille de route ; `tests/` : règles de publication ; `worker/` : point d’entrée serveur.

Les écritures authentifiées vérifient l’origine. Le contenu des articles est rendu comme texte React et ne peut exécuter du HTML collecté. Les collecteurs n’acceptent aucune URL arbitraire. La clé API, les emails d’administration et les jetons d’accès ne doivent jamais être versionnés.

## Historique de l’édition de lancement du 25 novembre 2026

À l’ouverture du Command Center par un administrateur, le serveur importe les lots disponibles. L’édition initiale compte quinze articles, dont celui consacré à Haïti. Le supplément ajoute le sujet sur Middletown. Le dossier de lecture révisé comporte quinze articles, avec l’Iowa en ouverture et le manuscrit sur Haïti conservé en réserve dans la rédaction. Chaque texte importé entre dans le circuit « En vérification ». Chaque texte et ses références sont modifiables dans l’onglet Articles. Le bouton de publication rend uniquement l’article sélectionné visible aux lecteurs et l’ajoute au RSS.

Le dépôt public conserve les fichiers chiffrés `lib/review/2026-11-25.json` et `lib/review/2026-11-25-iowa.json`. Le serveur lit leurs clés AES-GCM dans les secrets `BYRVOX_REVIEW_KEY_20261125` et `BYRVOX_REVIEW_KEY_20261125_IOWA`, respectivement. Si une seule clé est configurée, le lot correspondant peut être importé. Lorsqu’une édition est déjà installée, le Command Center ajoute le lot manquant dès qu’il est disponible. D1 conserve les modifications et l’historique des articles déjà importés.
