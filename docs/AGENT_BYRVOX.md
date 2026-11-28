# Agent BYRVOX dans le portail éditeur

L’espace **BYRVOX → Agent BYRVOX** affiche les signaux de préparation, les sujets annoncés, les reçus de publication, le calendrier éditorial et les consignes effectivement enregistrées. Propriétaire et approbateurs peuvent consulter ; seul le propriétaire modifie les réglages. Le portail reste sur son domaine éditeur et conserve les sessions et rôles existants.

## Ce que les statuts signifient

- Une livraison est confirmée uniquement par le reçu D1 écrit avec l’article et sa révision. Un compte rendu « completed » ne prouve pas une publication.
- Les signaux de recherche, rédaction, vérification, traduction et livraison sont déclarés par l’agent authentifié et portent leur heure de réception. Une étape active sans nouveau signal pendant vingt minutes n’est plus présentée comme une activité en cours confirmée.
- Les sujets annoncés portent une étape, un angle, un ton et un créneau indicatif. Un titre proposé n’est pas une promesse de publication. Les sujets écartés et déjà enregistrés au CMS disparaissent de cette file.
- Les brouillons CMS et les révisions d’articles déjà en ligne sont identifiés séparément. PULSE AI et Studio AI restent des outils manuels distincts.
- La tâche externe se réveille chaque heure à :00, fuseau America/Toronto. Les jours et la fréquence éditoriale enregistrés au portail déterminent les passages autorisés. Le serveur applique pause, créneaux et plafond aux nouvelles livraisons horaires. Les commandes thématiques et corrections de photo conservent leur circuit existant.

## Liaison privée, sans secret persistant

Les réglages et les titres non publiés restent en D1 protégé. La lecture anonyme de `/api/newsroom/agent` et `/api/agent/byrvox` est refusée. Aucun secret n’est ajouté au dépôt ou à la tâche.

Le processus de l’agent crée un secret aléatoire de 256 bits qu’il conserve uniquement en mémoire. Le droit existant d’écriture sur la branche `main` du dépôt approuvé autorise la session : l’agent y écrit seulement l’empreinte SHA-256 et une expiration de deux heures dans `newswire/agent-access/<heure-UTC>/<empreinte>.json`. Une empreinte n’est pas un jeton utilisable. Chaque session possède son document ; un redémarrage ou un contrôle manuel ne remplace donc pas une session encore active. L’API vérifie ce document depuis le chemin fixe du dépôt, la date et le secret reçu par HTTPS. L’accès est limité aux réglages éditoriaux et aux comptes rendus ; la publication d’articles exige toujours les manifestes approuvés et leurs contrôles habituels.

### Liaison par le navigateur

La page opérationnelle `https://byrvox.today/agent-session` offre les mêmes opérations par des commandes visibles. C’est le parcours recommandé dans un environnement qui ne dispose pas d’un accès HTTP direct au site. Elle ne donne aucun accès aux données privées avant l’approbation de la session dans GitHub, et ne modifie pas la connexion des éditeurs.

1. Ouvrir cette page, renseigner l’heure UTC planifiée de l’édition, puis choisir « Créer la session ». Garder l’onglet ouvert pendant le passage : le secret n’existe qu’en mémoire dans cet onglet.
2. Lire le chemin et le document de preuve affichés ; déposer ce document exact sur `main` dans le dépôt approuvé avec le connecteur GitHub. Aucun secret n’est affiché ou à recopier.
3. Choisir « Lire les consignes ». Après autorisation, lire les réglages, leur version et l’indication `due`. Respecter une pause ou un créneau non autorisé.
4. Utiliser le formulaire de compte rendu pour envoyer l’étape réelle, son explication et les sujets annoncés au format JSON. Le formulaire reprend la dernière version des consignes lues. Utiliser `origin: automation` pour un passage réel et `manual-check` avec une liste vide pour une vérification de liaison. Vérifier le reçu affiché après l’envoi.
5. Relire les consignes avant publication et en cas de conflit 409. Terminer le passage avec un compte rendu `completed`, `blocked` ou `skipped`, puis fermer la session et l’onglet. Ne pas réutiliser la preuve expirée.

Respecter les contrôles du navigateur. Si la page refuse l’accès ou si la liaison ne peut être autorisée, signaler l’obstacle et ne pas publier sous des consignes inconnues. Ne pas modifier l’authentification, les permissions réseau ou les protections du site pour continuer.

### Séquence avec le client HTTP, lorsque ce parcours est disponible

1. Lire le script actuel `scripts/byrvox-agent-session.py` depuis `main` du dépôt GitHub autorisé. Lancer `python scripts/byrvox-agent-session.py --hour YYYY-MM-DDTHH` dans une session d’exécution conservée. Il affiche uniquement un objet `access-proof` contenant `path` et `document`. Ne pas lancer un processus détaché.
2. Créer ce document JSON exact sur `main` au chemin affiché avec le connecteur GitHub autorisé. Si le fichier existe, le lire puis le remplacer avec son SHA ; ne pas écraser les autres fichiers. La preuve expire en deux heures et le secret reste dans le processus Python. Ne jamais imprimer, exporter ou sauvegarder un secret.
3. Envoyer `{"action":"config"}` suivi d’une vraie fin de ligne au stdin du processus. L’API renvoie `settings`, sa `version`, `due` et les prochains créneaux. Si les réglages sont inaccessibles, ne pas publier. Si `enabled=false` ou `due=false`, déclarer `skipped` avec une explication puis fermer la session. Un créneau futur de moins d’une heure peut être préparé, mais sa livraison attend l’heure de l’édition.
4. Appliquer `maxArticles` (toujours au plus sept), `tone`, `articleLength`, `regionPriority`, `topics` et `editorialNotes` à la préparation. Ces préférences n’autorisent jamais l’invention de faits, de photos ou de citations et ne suppriment pas les exigences de vérification, droits, dédoublonnage et sept traductions. Les objectifs géographiques historiques restent la référence lorsqu’une préférence ne les modifie pas.
5. Envoyer un compte rendu au démarrage puis à chaque étape réelle avec `{"action":"report","data":{"stage":"researching","detail":"Description factuelle du travail","settingsVersion":0,"origin":"automation","plans":[]}}`. Le client ajoute l’heure de l’édition. Étapes : `researching`, `writing`, `verifying`, `translating`, `ready`, `publishing`, `completed`, `blocked`, `skipped`.
6. Dès la sélection de sujets, renseigner `plans` et conserver les sujets non écartés dans les comptes rendus suivants. Chaque plan contient `{id,title,category,stage,tone,angle,sourceCount,plannedFor}`. `id` est l’eventKey futur, `stage` vaut `proposed`, `researching`, `writing`, `verifying`, `translating`, `ready` ou `discarded`. `tone` vaut `factuel`, `pedagogique`, `analytique` ou `synthese`. `plannedFor` est une date ISO avec fuseau ou null. Ne pas envoyer de texte intégral, de secret, de données personnelles ou de notes de raisonnement interne.
7. Relire `config` avant de livrer. Respecter une pause ou un changement de réglage intervenu pendant la préparation. Un compte rendu basé sur une ancienne `settingsVersion` est refusé avec 409 : relire les réglages, adapter le travail puis réémettre le compte rendu. Déposer et livrer les articles selon `docs/EDITION_HORAIRE.md`. Le reçu de publication reste la preuve finale.
8. Envoyer `completed` avec le nombre réellement publié et les obstacles après relecture des reçus, ou `blocked` en cas d’échec. Même un passage avec zéro article doit être signalé. Terminer par `{"action":"close"}`. Un contrôle de liaison réalisé hors passage emploie `origin:"manual-check"` avec `plans:[]` ; il ne doit jamais être présenté comme une exécution automatique.

Si la connexion à la source GitHub ou à l’API échoue, rendre compte de l’obstacle. Une erreur réseau ne démontre pas une panne publique. N’envoyer le secret qu’aux origines BYRVOX prévues par le script ; ne pas contourner un refus HTTP 401/403. Une session perdue se remplace par une nouvelle preuve approuvée, sans réutiliser un secret écrit sur disque.

## API du portail

- `GET /api/newsroom/agent` : aperçu privé, file et journal ; propriétaire ou approbateur.
- `PUT /api/newsroom/agent` : `{version,value}` ; propriétaire, même origine et contrôle de version. Un conflit renvoie 409 et conserve les modifications existantes.
- `GET /api/agent/byrvox` : réglages pour la session de l’agent, autorisée par `Authorization: Bearer …` et `X-BYRVOX-Edition`.
- `POST /api/agent/byrvox` : compte rendu privé pour la même édition. Le schéma, la taille et l’horizon sont vérifiés.

Les sauvegardes du portail ne réécrivent pas le calendrier de la plateforme : elles s’appliquent au prochain passage horaire et au contrôle serveur de livraison. Le calendrier distingue créneaux prévus, comptes rendus reçus et articles effectivement publiés.
