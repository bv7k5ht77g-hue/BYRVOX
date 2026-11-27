# Rédaction et publication BUZZEUR

BUZZEUR est le média de divertissement de BYRVOX : insolite, culture pop, stars, musique, web, animaux et petits bonheurs. Karl a autorisé sa publication publique et un agent horaire visant quinze articles originaux par édition. La vérification prime sur le nombre : publier une sélection plus courte si les faits, les droits ou les traductions ne sont pas prêts. Ne jamais inventer une actualité pour remplir le quota.

- Site public : https://buzzeur.byrvox.today/
- Portail : https://byrvox.noventra.ca/admin (section BUZZEUR).
- Configuration publique de l’agent : https://byrvox.noventra.ca/api/buzzeur/config
- Articles publiés : https://byrvox.noventra.ca/api/buzzeur/feed?lang=fr&limit=200
- Registre : https://byrvox.noventra.ca/api/buzzeur/newswire
- Source approuvée : dépôt GitHub `bv7k5ht77g-hue/BYRVOX`, branche `main`, répertoire **`buzzeur-newswire/` uniquement**.

Les tables, médias, réglages et éditions de BUZZEUR sont indépendants de ceux de BYRVOX. Ne pas modifier les articles, le code, l’automatisation ou les déploiements BYRVOX lors d’un passage courant. Aucune republication du code du site n’est nécessaire pour livrer des articles.

## Commencer un passage

1. Utiliser l’heure planifiée UTC comme identifiant `YYYY-MM-DDTHH`. L’horaire humain est celui de `America/Toronto` ; l’UTC évite les doublons au changement d’heure. En cas de reprise, conserver l’identifiant et les rangs existants.
2. Lire la configuration. Si `agent.enabled` est `false`, s’arrêter sans rédiger ni publier. Si la configuration est inaccessible, signaler l’obstacle et ne pas supposer que l’agent est actif. Respecter le champ `agent.region` comme priorité éditoriale complémentaire à la veille internationale ci-dessous. L’objectif est quinze articles au maximum.
3. Lire le registre, le flux français (avec pagination) et les manifestes récents sur GitHub. Vérifier les doublons par événement, URL de source principale et titre, au minimum sur les dernières 72 heures. Un sujet ancien ne redevient publiable qu’avec un développement substantiel, explicitement expliqué et doté d’une source précise nouvelle.
4. Vérifier que le connecteur GitHub peut lire et écrire dans le dépôt approuvé. Il s’agit du droit de publication. Ne stocker aucun jeton, mot de passe ou cookie dans les fichiers, les instructions ou les rapports.

### Accès réseau aux API publiques

Utiliser une requête HTTP réelle (client Python du dépôt, ou équivalent avec `User-Agent: BUZZEUR-Publisher/1.0`) pour les API ; l’échec du moteur de recherche à ouvrir une URL d’API n’est pas un diagnostic DNS. L’origine principale reste `https://byrvox.noventra.ca`. Si une requête échoue pour une raison DNS ou réseau, le domaine plateforme du même backend, `https://byrvox.h2y4xnnm6g.chatgpt.site`, peut servir de repli pour les mêmes endpoints publics `/api/buzzeur/config`, `/api/buzzeur/feed` et `/api/buzzeur/newswire`. Leur configuration et leur registre ont été comparés et étaient identiques le 27 novembre 2026.

Avant toute livraison sur ce repli, relire sa configuration et son registre ; respecter `agent.enabled:false`, `status:"paused"` et les reçus existants. Utiliser la même heure et le même rang après une interruption : ne pas créer un autre article pour réessayer. Un refus d’accès HTTP 401/403 n’autorise pas le repli. Ce dispositif ne concerne aucun endpoint privé du portail. Si les deux origines sont inaccessibles, s’arrêter et enregistrer l’obstacle sans annoncer une publication.

## Veille demandée

À chaque passage, effectuer des recherches récentes et ciblées dans les langues pertinentes. Couvrir plusieurs zones et faire tourner les priorités pour que les territoires moins médiatisés apparaissent aussi dans les éditions successives. Une édition de quinze articles ne peut pas représenter tous les lieux simultanément. Consigner les zones réellement consultées et celles représentées, sans prétendre avoir vérifié une source qui n’a pas été ouverte.

| Zone | Territoires et villes suivis |
| --- | --- |
| États-Unis | Floride, Broward County et Fort Lauderdale, Orlando, New York, Boston et Massachusetts, Texas, Ohio, autres États ; Zone 51 dans le Nevada |
| Canada | Canada, Québec et Ontario, avec attention aux médias locaux |
| Europe | France, Paris, Espagne, Allemagne, Pays-Bas, Suède, Pologne, Russie, Royaume-Uni, Londres, Bratislava en Slovaquie, autres pays européens |
| Asie | Pakistan, Ouzbékistan, Corée du Nord et autres régions pertinentes |
| Océanie | Australie, Nouvelle-Zélande et territoires du Pacifique |
| Caraïbes et Amériques | République dominicaine, Jamaïque, Martinique, Guadeloupe, Belize, autres territoires caribéens et Brésil |
| Thèmes transversaux | Découvertes insolites, animaux, culture pop, personnalités publiques, petites histoires du quotidien, OVNI/PAN/UAP et recherche sur la vie extraterrestre |

Privilégier les faits des dernières heures puis des dernières 24 à 48 heures, selon les fuseaux et les sources locales. Consulter médias locaux reconnus, institutions, musées, universités, observatoires, autorités municipales et annonces originales. Une exposition, une découverte ancienne ou un dossier explicatif peut être intéressant, mais doit garder ses dates réelles et être présenté comme tel. Les archives ne constituent pas artificiellement quinze nouveautés quotidiennes.

## People, hits et événements : priorités permanentes

La ligne BUZZEUR réunit insolite, people (« gossip ») vérifié, culture pop et musique populaire internationale. Suivre les scènes dominicaine, haïtienne et de ses diasporas, américaine, française, brésilienne, allemande, arabes et coréenne, dont la K-pop. Conserver l’attention au kompa, à la Caraïbe, à Joé Dwèt Filé, à Michaël Brun/BAYO et aux collaborations latino. Ces thèmes complètent la veille insolite internationale.

### Répartition éditoriale

Faire tourner les artistes, pays, genres et angles d’une édition à l’autre. Dans la limite de quinze articles au maximum, viser jusqu’à cinq sujets people si des faits nouveaux documentés le permettent et réserver plusieurs places à la musique et aux événements. Aucune édition n’a à représenter toutes les scènes simultanément. Le nombre est un objectif : ne pas produire de doublon, de rumeur ou de remplissage. Un article peut croiser plusieurs thèmes. Rechercher aussi dans les langues locales pour ne pas limiter la sélection aux artistes déjà très couverts par les médias anglophones ou francophones.

### People et gossip

Partir de déclarations publiques, annonces des artistes ou représentants, apparitions, œuvres, collaborations, récompenses et anecdotes vérifiables. Attribuer chaque information et conserver la différence entre une annonce, une réaction et une information non confirmée. Écarter les accusations privées, insinuations et romances ou conflits inventés ; plusieurs reprises d’une rumeur ne la confirment pas. Un titre accrocheur ne doit pas dépasser les preuves disponibles.

### Hits, mégahits et nostalgie

Couvrir les titres qui progressent, les chansons qui cartonnent, les grands succès de catalogue, les seuils de vues et les rétrospectives originales. Pour qualifier un succès actuel, préciser le classement ou la mesure, le territoire, la période et la source. Distinguer les vues d’une vidéo précise, les vues agrégées, les écoutes, les ventes, les certifications et les trophées. Pour un milliard ou plusieurs milliards de vues, ouvrir le compteur ou l’annonce officielle de la plateforme et consigner la date de vérification ; ne jamais additionner arbitrairement versions, remixes et vidéos. Aucun compteur ne doit être inventé ou présenté comme actuel sur la base d’une vieille capture.

Les dossiers nostalgie indiquent la période réelle et l’angle rétrospectif. Ne pas présenter une ancienne sortie comme une nouveauté. Vérifier titre, orthographe, tous les interprètes crédités, date de sortie initiale et date du clip : elles peuvent différer selon les pays. La sélection demandée le 27 novembre 2026 (Gangnam Style, Balada, Hangover, Party Rock Anthem, Replay, Down, Do You Remember, Whatcha Say, Kiss Me Thru the Phone, What You Got, Airplanes, Stereo Hearts et Mirrors) couvre 2008–2013, environ treize à dix-huit ans avant 2026, et non uniformément dix à quinze ans. Elle ne constitue pas une liste de titres tous milliardaires. Ne pas recopier les paroles.

### Albums, singles, tournées et événements

Suivre albums et singles à venir, tournées annoncées, grands concerts, festivals, événements musicaux et culturels, ainsi que les bilans de tournées passées. Vérifier date, ville, salle, artiste, organisateur et état de l’annonce auprès de l’artiste, du label, du promoteur, de la salle ou de la billetterie officielle. Distinguer nouvel album, réédition, sortie numérique, édition physique, simple teaser et date confirmée. Ne pas prédire qu’une chanson sera un tube. Rechercher les reports, annulations et changements de distribution avant livraison.

Pour un bilan, distinguer dates annoncées et concerts effectivement tenus. Ne pas inventer fréquentation, recettes, bénéfices ou concerts complets ; attribuer les chiffres documentés et préciser leur périmètre. Une recette brute ne représente pas le revenu personnel de l’artiste. Les réactions du public doivent être attribuées sans transformer quelques publications en opinion générale.

Couvrir le Super Bowl sous ses angles événement, spectacle de la mi-temps, artistes, musique et culture pop. Vérifier l’édition, la date, le stade, le programme et les artistes auprès de la NFL, de l’organisateur ou des partenaires officiels. Séparer annonces confirmées, rumeurs et rétrospectives ; ne pas réutiliser la programmation d’une ancienne édition comme celle de la prochaine.

### Continuité et corrections

Conserver les faits vérifiés précédemment : « Una Locura » appartient à ENOC (2020) et réunit Ozuna, J Balvin et Chencho Corleone. L’édition BAYO du 22 novembre 2026 s’est tenue à Little Haiti, dans la ville de Miami ; ne pas la déplacer dans la municipalité de North Miami.

Les articles déjà publiés gardent leur identifiant et leur date. Corriger un fait existant à partir de nouvelles preuves par le portail et son historique ; l’agent ne remplace pas une correction manuelle et ne republie pas un ancien sujet comme s’il était nouveau. Les neuf traductions intégrales, les sources, les photos réelles réutilisables et leurs légendes restent obligatoires pour tous ces formats.

## Vérifier et écrire

- Ouvrir les sources, vérifier lieu, date de l’événement, date de publication, noms, chiffres et contexte. Privilégier la source primaire et chercher une confirmation indépendante. Deux reprises d’une dépêche, deux communiqués du même organisme, ou un communiqué et l’étude qu’il présente ne constituent pas deux confirmations indépendantes. Si une information non controversée repose sur une annonce officielle, l’attribuer clairement et ne pas affirmer davantage que la source.
- Écarter les rumeurs privées, accusations non étayées, canulars présentés comme des faits, humiliations et détails personnels sans intérêt public. Pour les stars, privilégier événements publics, œuvres, annonces confirmées et anecdotes documentées.
- Pour les extraterrestres, la Zone 51 et les UAP, distinguer observation, identification, hypothèse, témoignage, légende et fiction. « Non identifié » ne signifie pas « extraterrestre ». Ne pas transformer une étude chimique, un effet de perspective ou une déclaration invérifiable en preuve de vie alien. Les sources gouvernementales ou locales, notamment en Corée du Nord et en Russie, doivent être contextualisées et recoupées lorsque les faits sont contestés.
- Rédiger un titre précis et vivant, un résumé et au moins quatre paragraphes originaux en français, généralement 180 à 300 mots. Les citations éventuelles restent brèves, exactes et attribuées. Les liens vers les sources accompagnent l’article ; ne pas reproduire un article de presse.
- Traduire intégralement en **anglais, espagnol, italien, chinois simplifié, coréen, russe, arabe et swahili**. Les neuf versions conservent les mêmes faits, dates, réserves, sources et identifiants. Traduire aussi les textes alternatifs et légendes. Ne pas afficher de français sous une étiquette de langue différente et ne pas publier une traduction tronquée pour finir le quota.

## Photographies et droits

Chercher d’abord une photographie réelle du fait précis. À défaut, choisir une photo pertinente du sujet dans le même contexte et privilégier la prise de vue la plus récente lorsque la date compte. Vérifier l’image à taille lisible et sa page d’origine. Ne pas prendre la date de republication pour la date de prise de vue.

Consigner auteur, source, licence, lien de licence et contexte réel. Les archives et images d’illustration doivent être clairement décrites dans les neuf langues. Une girafe adulte d’un autre zoo ne devient pas la girafonne de l’article ; la photo d’un musée n’est pas celle du fossile. Ne pas générer ou retoucher une fausse photo d’actualité. Une image trouvée sur le Web n’est pas automatiquement réutilisable. Si aucun visuel adéquat n’est publiable, remplacer le sujet ou réduire l’édition.

Déposer les fichiers JPEG, PNG ou WebP de huit Mio maximum sous `buzzeur-newswire/<hour>/media/`. Privilégier une largeur adaptée à la lecture Web. Les fichiers sont ensuite copiés dans le stockage BUZZEUR, avec une adresse indépendante du dépôt GitHub. Aucun code publicitaire, traceur ou script externe ne doit être inclus dans un article.

## Manifeste approuvé

Écrire `buzzeur-newswire/YYYY-MM-DDTHH/edition.json` sur `main`, avec les images dans le même commit ou avant le manifeste. Une écriture sur `main` constitue l’approbation éditoriale de cette édition. Utiliser les outils GitHub autorisés et préserver la dernière tête de branche ; en cas de conflit, relire la branche et rebaser les nouveaux fichiers sans écraser les autres éditions.

```json
{
  "hour": "YYYY-MM-DDTHH",
  "articles": [{
    "eventKey": "identifiant-stable-et-unique",
    "category": "insolite",
    "tags": ["buzz"],
    "publishedAt": "YYYY-MM-DD",
    "eventDate": "YYYY-MM-DD",
    "readMinutes": 2,
    "verified": true,
    "sources": [{"title": "Titre de la source", "publisher": "Organisme", "url": "https://...", "publishedAt": "YYYY-MM-DD"}],
    "photo": {"download": "media/image.jpg", "sourceUrl": "https://...", "credit": "Auteur et contexte", "license": "Licence", "licenseUrl": "https://..."},
    "translations": {
      "fr": {"title": "Titre", "excerpt": "Résumé", "body": ["Paragraphe 1", "Paragraphe 2", "Paragraphe 3", "Paragraphe 4"], "alt": "Description réelle de l’image", "imageCredit": "Auteur, contexte et date de la photo"},
      "en": {}, "es": {}, "it": {}, "zh": {}, "ko": {}, "ru": {}, "ar": {}, "sw": {}
    }
  }]
}
```

Les objets vides ci-dessus expliquent la structure : ils doivent tous être remplis avant publication. `eventKey` devient l’identifiant public, en minuscules ASCII et tirets, de 3 à 130 caractères. `publishedAt` est la date de publication à Toronto ; `eventDate` est facultatif et conserve la date réelle du fait. Les références acceptent une date ISO ou un horodatage ISO avec fuseau. Les sources et licences doivent utiliser HTTPS, sans identifiants dans les URL.

Rubriques autorisées : `buzz`, `stars`, `insolite`, `pop-culture`, `petits-bonheurs`, `videos`, `internet-memes`, `mode-looks`, `musique`, `cine-series`, `tele-realite`, `animaux`, `love-relations`.

Les suffixes `-initial-1`, `-initial-2` et `-lancement` sont réservés à l’amorçage autorisé du site, jamais aux quotas horaires courants. Le serveur accepte une livraison dans les 72 heures suivant l’heure UTC. La tâche conserve les corrections manuelles : un identifiant ou une source principale déjà présent n’est pas réécrit par l’agent, y compris après retrait.

## Livrer et relire

Après avoir écrit l’édition et vérifié son contenu sur `main` :

1. Envoyer `POST https://byrvox.noventra.ca/api/buzzeur/newswire` avec `Content-Type: application/json` et `{"hour":"YYYY-MM-DDTHH","rank":N}` pour chaque rang, du dernier au premier. Le serveur lit exclusivement les fichiers du dépôt approuvé ; ce point d’entrée n’accepte aucun texte arbitraire ni secret de session.
2. Le serveur contrôle de nouveau l’état activé/en pause et valide sources, neuf langues, photo et taille. Il conserve les articles et images dans les tables et le stockage dédiés BUZZEUR. `published` signifie une nouvelle insertion, `duplicate` ou `recorded` une reprise déjà traitée, `no_entry` un rang absent et `paused` un arrêt demandé par l’éditeur. Vérifier la réponse JSON ; un simple succès HTTP ne prouve pas une nouvelle publication.
3. En cas d’interruption réseau ou d’erreur temporaire 503, réessayer le même rang sans changer son contenu. Une erreur 400/422 demande une correction de données, pas une boucle de tentatives. Les manifestes peuvent être mis en cache jusqu’à une minute. Un conflit GitHub demande de relire la branche. Ne contourner aucune limite ni aucun contrôle d’accès.
4. Relire le registre puis chaque article via `/api/buzzeur/feed?lang=fr&id=<eventKey>`, vérifier son image, ses sources et les neuf langues. Le lien public des nouvelles publications est `https://buzzeur.byrvox.today/article/?id=<eventKey>&lang=fr`. Les 25 articles historiques conservent aussi leur ancien chemin.
5. Consigner dans `buzzeur-newswire/<hour>/report.json` l’heure, les zones consultées, les sujets retenus et écartés, les sources, les publications réellement obtenues, les doublons et obstacles. Si aucun sujet n’est suffisamment prêt, écrire un rapport sans inventer de manifeste vide. Le portail conserve également le journal des opérations réellement effectuées.

Le processus ne requiert aucun accès interactif au portail éditeur : l’écriture approuvée sur GitHub autorise les données, et le serveur assure leur livraison. En cas de connexion GitHub manquante ou d’accès refusé, conserver les brouillons et signaler l’action nécessaire au lieu de prétendre avoir publié.
