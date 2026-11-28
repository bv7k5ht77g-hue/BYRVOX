# Agent BUZZEUR dans le portail éditeur

Le suivi se trouve dans **BUZZEUR → Agent BUZZEUR** : https://byrvox.noventra.ca/admin?site=buzzeur&section=agent. Il propose les mêmes vues que BYRVOX : suivi, articles à venir, calendrier et ligne éditoriale. Propriétaire et approbateurs consultent ; seul le propriétaire enregistre les consignes. Les données, preuves d’accès et publications des deux médias restent séparées.

## Réglages et calendrier

L’agent externe se réveille chaque heure, fuseau America/Toronto. Les jours, la fréquence et l’heure de référence du portail déterminent les créneaux éditoriaux autorisés. La pause, le calendrier et le maximum de 1 à 15 articles sont contrôlés avant une nouvelle livraison. Les reprises déjà enregistrées restent idempotentes.

La configuration BUZZEUR existante est conservée : activation et région ne sont pas réinitialisées. Les anciens et nouveaux réglages utilisent la même version ; une sauvegarde concurrente renvoie 409. L’ancien accès public ne fournit que l’activation, la cible historique et la région courte. Le ton, la longueur, les thèmes, les notes, le calendrier et les sujets en préparation passent par la liaison privée.

Les quatre tons sont factuel, pédagogique, analytique et synthétique ; les trois longueurs sont court, standard et approfondi. Les préférences éditoriales ne suppriment jamais la vérification des faits, les droits des images, les neuf traductions, le dédoublonnage ou les exclusions publicitaires manuelles. Les contrôles NASA/PULSE et Studio AI restent des opérations manuelles distinctes.

## Avant chaque passage

1. Lire ce document et docs/EDITION_HORAIRE_BUZZEUR.md depuis main du dépôt GitHub approuvé bv7k5ht77g-hue/BYRVOX.
2. Ouvrir https://byrvox.today/agent-session?site=buzzeur dans le navigateur pris en charge. Renseigner l’heure UTC planifiée de l’édition au format YYYY-MM-DDTHH. Choisir **Créer la session** et conserver cet onglet ouvert sans rechargement.
3. Lire **Chemin du document d’autorisation** et **Document d’autorisation JSON**. Créer ce document exact sur main au chemin affiché : buzzeur-newswire/agent-access/<heure>/<empreinte>.json, avec le connecteur GitHub autorisé. Seule une empreinte SHA-256 et sa validité de deux heures sont publiques ; le secret aléatoire reste exclusivement en mémoire dans l’onglet. Ne jamais imprimer, enregistrer ou transmettre un secret à un autre service.
4. Choisir **Lire les consignes**. Vérifier settings.value, settings.version et due. Cette configuration privée constitue la référence du passage ; l’accès à la configuration publique n’est pas nécessaire pour remplacer des consignes déjà lues et validées ici. Si enabled=false ou due=false, envoyer skipped avec une explication et zéro sujet puis terminer. Si la liaison est inaccessible, signaler le blocage et ne pas publier sous des consignes inconnues.
5. Appliquer maxArticles, tone, articleLength, regionPriority, topics, editorialNotes et schedule. Les priorités historiques détaillées du protocole restent applicables sauf préférence explicite enregistrée. La sélection peut être plus courte que le plafond lorsque les faits, les photos ou les traductions sont insuffisants.

La preuve BUZZEUR n’autorise pas le canal BYRVOX et inversement. Une session peut coexister avec une autre sans l’écraser. Si le navigateur ou le site refuse l’accès, respecter ce refus ; ne pas modifier l’authentification, les protections ou les permissions réseau.

Le client HTTP documenté dans scripts/byrvox-agent-session.py accepte aussi --media buzzeur --hour YYYY-MM-DDTHH lorsque l’environnement autorise l’accès HTTP direct. Ce n’est pas un repli pour contourner un refus 401/403. Il conserve le secret uniquement dans son processus et imprime la même preuve publique.

## Transmettre les étapes réelles

Utiliser le formulaire de la liaison après lecture des consignes. Choisir **Passage automatisé** comme origine et envoyer une description concise du travail au démarrage puis à chaque étape réellement atteinte :

researching, writing, verifying, translating, ready, publishing, completed, blocked ou skipped.

Dès la sélection de sujets, remplir **Sujets annoncés JSON** avec une liste (au plus 30) d’objets :
`{id,title,category,stage,tone,angle,sourceCount,plannedFor}`.

- id : futur eventKey, 3 à 130 caractères, minuscules ASCII et tirets.
- category : une rubrique BUZZEUR autorisée par le protocole.
- stage : proposed, researching, writing, verifying, translating, ready ou discarded.
- tone : factuel, pedagogique, analytique ou synthese.
- plannedFor : horodatage ISO avec fuseau, ou null si aucun créneau n’est confirmé.
- angle : description éditoriale courte ; sourceCount : nombre de sources réellement consultées.

Conserver les sujets actifs dans les comptes rendus suivants. Ne jamais envoyer un texte intégral, des secrets, des données personnelles ou des notes de raisonnement interne. Un titre proposé n’est pas une promesse de publication. Les sujets déjà présents dans le CMS et ceux écartés quittent la file annoncée.

Le formulaire reprend la version des consignes lues. En cas de 409, relire les consignes, adapter le travail et réémettre le compte rendu. Relire aussi les consignes avant la livraison.

## Livraison et vérification

Après approbation des articles et des images sur main, suivre le protocole BUZZEUR. Une page de livraison par le navigateur est disponible à **https://byrvox.today/buzzeur-newswire?hour=YYYY-MM-DDTHH&count=N**. Renseigner le nombre réel d’articles du manifeste, inférieur ou égal au plafond du portail, puis choisir **Publier l’édition GitHub BUZZEUR**. La page utilise le même point d’entrée approuvé /api/buzzeur/newswire et ne permet pas d’envoyer un article arbitraire.

Le registre https://byrvox.today/api/buzzeur/newswire et le flux https://byrvox.today/api/buzzeur/feed?lang=fr&limit=200 sont lisibles dans le navigateur. Vérifier les réponses, les images, les liens publics et les neuf langues. Si l’édition est préparée avant l’heure planifiée, attendre cette heure pour livrer. Une réponse HTTP réussie avec paused, recorded ou duplicate n’est pas une nouvelle publication.

Après relecture des reçus, transmettre completed avec le nombre réellement publié et les obstacles, ou blocked/skipped selon le résultat. Vérifier le **Reçu enregistré JSON**, puis **Fermer la session**. Même un passage sans article doit être signalé. Conserver le bilan public report.json selon le protocole, sans titres privés encore en préparation.

Un contrôle de liaison hors passage emploie **Contrôle manuel de liaison** (origin manual-check) et une liste vide. Il ne doit jamais être présenté comme une exécution automatique. Un signal actif sans mise à jour pendant vingt minutes devient non confirmé ; les livraisons sont comptées uniquement à partir des reçus réellement enregistrés.

## API privées

- GET/PUT /api/newsroom/buzzeur/agent : consultation propriétaire/approbateur et modification propriétaire, sur le domaine éditeur ; PUT reçoit `{version,value}`.
- GET/POST /api/agent/buzzeur : lecture des consignes et comptes rendus de la session BUZZEUR ; autorisation temporaire par empreinte GitHub, Authorization Bearer et X-BUZZEUR-Edition.
- Une modification du calendrier au portail ne réécrit pas le réveil externe horaire : elle règle les passages éditoriaux autorisés.
