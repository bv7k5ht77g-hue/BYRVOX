# Édition horaire BYRVOX

La rédaction a autorisé la publication automatique des nouvelles vérifiées sur https://byrvox.noventra.ca. Le CMS conserve chaque article et sa photo. Un éditeur peut ensuite le corriger sur le portail habituel.

## Choisir les nouvelles de l’heure

1. À chaque passage, relever l’heure UTC de l’édition et l’heure à Toronto. Lire le flux https://byrvox.noventra.ca/rss.xml, le registre https://byrvox.noventra.ca/api/newswire et les éditions des 24 dernières heures dans le dépôt GitHub public bv7k5ht77g-hue/BYRVOX.
2. Scanner les fils récents d’agences, de médias locaux, nationaux et internationaux et les annonces des organismes concernés. Classer les événements par nouveauté, portée, intérêt public et conséquences. Chercher quinze événements distincts représentatifs de l’actualité du Canada, du Québec et du monde. Si une nouvelle a déjà été publiée, retenir uniquement un développement substantiel et l’expliquer explicitement.
3. Pour chaque sujet, ouvrir et recouper deux sources indépendantes, dont une primaire lorsqu’elle est disponible. Deux reprises de la même dépêche comptent pour une source. Vérifier le lieu, la date de l’événement, la date de publication, les noms et les chiffres. Attribuer estimations et allégations. Écrire un titre informatif, un résumé et plusieurs paragraphes originaux en français. Préparer leurs traductions fidèles en anglais, espagnol, arabe, chinois simplifié, russe et coréen. Ne jamais compléter une citation ou un chiffre manquant.
4. Choisir une photographie réelle du fait, du lieu exact ou des personnes concernées. Ouvrir le fichier et sa page d’origine pour vérifier ce qu’il représente, la date, l’auteur et les droits de republication éditoriale. Les archives et illustrations sont datées et identifiées dans la légende. Ne pas attribuer à un photographe d’agence une licence libre sans preuve. Choisir un autre sujet si les faits ou les droits restent incertains. Signaler le nombre réel de sujets vérifiés si moins de quinze remplissent ces critères.

## Enregistrer l’édition

Sur la branche main de bv7k5ht77g-hue/BYRVOX, écrire une édition approuvée pour publication au chemin `newswire/YYYY-MM-DDTHH/edition.json`. Le dossier et la propriété `hour` utilisent la même heure UTC, afin d’éviter les ambiguïtés de changement d’heure à Toronto. Toute édition est publique dès son dépôt sur GitHub.

Le JSON comporte `hour` et `articles`, tableau ordonné de 1 à 15 objets. Chaque objet comporte :

- `eventKey` (6–100 caractères) : identifiant stable de l’événement, mots minuscules et tirets.
- `title` (14–230), `category` (2–80), `summary` (40–1100) et `body` (350–24000), rédigés en français. Séparer les paragraphes par un double saut de ligne.
- `sources` : 2 à 8 objets `{name,url,publishedAt}`. Utiliser des permaliens HTTPS et placer le permalien le plus spécifique en premier. Une date de publication accepte un horodatage ISO avec fuseau ou YYYY-MM-DD si la source ne donne pas d’heure. Au moins une source doit dater des dernières 48 heures environ ; signaler les éléments d’archives dans l’article.
- `photo` : `{download,sourceUrl,credit,license,licenseUrl,alt,caption}`. Les sources, crédits et liens de licence sont conservés avec la photo. Le texte alternatif décrit le contenu. La légende relie l’image à l’article.
- `verified` : true après contrôle des faits, de l’image et de ses droits.
- `translations` : objet avec les clés en, es, ar, zh-CN, ru et ko. Chaque valeur contient `{title,summary,body}`. Traduire également le texte alternatif et la légende de la photo dans les champs `photoAlt` (8–300 caractères) et `photoCaption` (12–1000 caractères), à fournir ensemble en conservant les dates et la mention d’archives. Le publieur accepte une édition partiellement traduite si les autres traductions doivent être révisées.
  
Pour `photo.download`, utiliser l’URL HTTPS directe d’un fichier JPEG, PNG ou WebP (8 Mio maximum) sur upload.wikimedia.org, images-assets.nasa.gov, images.pexels.com, d1ldvf68ux039x.cloudfront.net, media.defense.gov ou media.esa.int. Une autre source éditoriale autorisée est utilisable en déposant son image optimisée dans le dossier `media/` de l’édition. Utiliser par exemple `media/nom-du-lieu.webp` dans le manifeste et déposer le fichier avant le manifeste ou dans le même commit. Préférer une image de 800–1400 px.

Si l’édition existe, reprendre sa livraison sans réordonner les rangs. Une publication déjà inscrite au CMS conserve ses révisions.

## Livrer et vérifier

Le workflow GitHub « Publish BYRVOX hourly edition » livre chaque rang de la branche main. La tâche horaire doit vérifier le résultat et suivre la procédure de repli si la publication tarde ou si ce workflow est indisponible :

1. Envoyer POST https://byrvox.noventra.ca/api/newswire avec le JSON `{"hour":"YYYY-MM-DDTHH","rank":1}` pour chaque rang du manifeste. Traiter les rangs du dernier au premier pour livrer la manchette en dernier. Seuls l’heure et le rang sont acceptés. Le site lit lui-même les données du dépôt autorisé et conserve la photo dans son propre stockage.
2. Le même traitement se lance depuis le navigateur en ouvrant https://byrvox.noventra.ca/newswire?hour=YYYY-MM-DDTHH et en choisissant « Publier l’édition GitHub ». Cette page n’exige aucune session personnelle. La publication ne peut porter que sur le contenu déjà approuvé sur main.
3. Contrôler le registre public, le flux RSS et les liens des articles. Réessayer le rang après une interruption de réseau. Le serveur accepte les reprises pendant 72 heures et conserve les corrections manuelles. Consigner les succès, les doublons et les obstacles réels.

L’agent de recherche et de rédaction est la tâche horaire liée au site. Ce workflow GitHub assure la livraison des éditions déjà rédigées. Le serveur ne reçoit ni jeton GitHub ni clé d’un service d’IA pour cette opération.
