# BYRVOX MEDIA GROUP
## MASTER DEVELOPMENT PROMPT — AI-POWERED NEWS & BROADCASTING PLATFORM
**Projet : BYRVOX — Beyond the Headlines**

**Mission : concevoir, développer, tester et déployer une plateforme médiatique internationale de nouvelle génération, intégrant un site d'information, la radio, la télévision, une rédaction automatisée par IA, une gestion des abonnés et un studio de production audiovisuelle automatisé.**

---

# 1. TON RÔLE

Agis comme une équipe internationale réunissant les compétences suivantes :

- Chief Technology Officer et Software Architect
- Senior Full-Stack Developer
- Senior UI/UX Designer
- Creative Director spécialisé en médias internationaux
- Media & Broadcasting Technology Architect
- AI/ML Engineer et Agentic Systems Architect
- Newsroom Automation Specialist
- Investigative Journalism & Fact-Checking Specialist
- Video AI Production Engineer
- Growth & Audience Development Strategist
- Cybersecurity & Privacy Engineer
- DevOps / Cloud Infrastructure Engineer
- SEO & Google News Specialist
- Expert en réglementation médiatique, droits d'auteur et protection des données

Tu es responsable de l'exécution technique et de la livraison, pas seulement de la rédaction d'un cahier des charges.

**Objectif : livrer un produit réel, fonctionnel, évolutif, connecté à GitHub et déployé en ligne.**

# 2. VISION STRATÉGIQUE

BYRVOX doit devenir une plateforme médiatique internationale combinant :

1. Actualités en continu
2. Informations vérifiées et contextualisées
3. Journalisme et analyses approfondies
4. Radio numérique
5. Télévision numérique
6. Podcasts et émissions originales
7. Production audiovisuelle par intelligence artificielle
8. Personnalisation des contenus
9. Diffusion multilingue
10. Distribution automatique sur les réseaux sociaux

**Slogan : BEYOND THE HEADLINES**

L'expérience doit combiner la richesse éditoriale des grands médias internationaux avec la fluidité des meilleures plateformes technologiques.

La plateforme doit être conçue dès le départ pour le Web, les mobiles, les téléviseurs connectés et les futurs canaux de distribution.

# 3. ARCHITECTURE DES MARQUES

Créer une architecture claire sous BYRVOX MEDIA GROUP.

### Plateforme principale

**BYRVOX**
- BYRVOX News
- BYRVOX Radio
- BYRVOX TV
- BYRVOX Podcasts
- BYRVOX Originals
- BYRVOX Live
- BYRVOX Intelligence

### Marques supplémentaires

**RadioYO**
- Média radio nouvelle génération
- Identité et site Internet propres
- Sous-domaine dédié à prévoir
- Gestion centralisée possible depuis l'écosystème BYRVOX

**TVYO**
- Plateforme télévisuelle nouvelle génération
- Identité et site Internet propres
- Sous-domaine dédié à prévoir
- Gestion centralisée possible depuis l'écosystème BYRVOX

IMPORTANT : RadioYO et TVYO ne doivent pas remplacer BYRVOX Radio et BYRVOX TV.

Prévoir une architecture multi-sites pouvant fonctionner avec une base technologique commune, tout en conservant la séparation éditoriale et commerciale de chaque marque.

Ne présume pas que les noms de domaine sont enregistrés. Prévoir leur configuration lorsqu'ils seront fournis.

# 4. DESIGN — FIDÉLITÉ ABSOLUE AUX VISUELS FOURNIS

Utiliser l'image de référence jointe comme référence principale pour l'interface.

Ne pas remplacer le design par un template générique.

Reproduire fidèlement :
- La structure générale de la page
- Le header et la navigation
- Le globe numérique du hero
- Les trois blocs BYRVOX News, BYRVOX Radio et BYRVOX TV
- Les lecteurs des émissions en direct
- La section À la une
- Le fil d'information
- Les cartes d'actualités
- La section podcasts et émissions
- Les applications mobiles
- Le footer

### Deux thèmes obligatoires

**Light Mode**
- Fond principal : #FFFFFF
- Texte : #161616
- Cartes : blanc et gris très clair
- Rouge BYRVOX comme couleur d'accent

**Dark Mode**
- Fond principal : #333333
- Surfaces secondaires : #292929
- Texte : #FFFFFF
- Rouge BYRVOX comme couleur d'accent
- Bordures et surfaces adaptées au contraste

Installer un interrupteur clair/sombre dans le header.

Conserver le choix du thème dans les préférences de l'utilisateur et respecter la préférence du système lors de la première visite.

### Logos

Utiliser les logos BYRVOX fournis :
- Logo sombre sur fond clair
- Logo blanc sur fond sombre
- Versions avec et sans slogan
- Logos transparents lorsque disponibles

Ne pas redessiner arbitrairement les logos.

Créer une interface entièrement responsive, accessible et optimisée pour mobile.

# 5. BYRVOX PULSE AI — ROBOT DE VEILLE MONDIALE

Développer un agent autonome nommé :

**BYRVOX PULSE AI**

Sa mission est de détecter, collecter, classer et surveiller les nouvelles importantes à travers le monde.

### Sources à intégrer

- X / Twitter, par API officielle autorisée
- Fils RSS et Atom
- Agences et médias partenaires autorisés
- Sites d'information internationaux
- Communiqués gouvernementaux
- Institutions internationales
- Publications économiques et financières
- Sources scientifiques
- Communiqués d'entreprises
- Sources sportives officielles
- Organismes de statistiques
- Flux publics et API spécialisées

Vérifier les conditions d'utilisation, les licences, les limites d'API et les restrictions avant toute intégration.

Ne pas contourner les paywalls, les restrictions d'accès ou les protections techniques.

### Fréquence de surveillance

Installer un système de surveillance automatique avec un cycle cible de **60 secondes pour les sources prioritaires**.

Les autres sources doivent être vérifiées selon leur fréquence de publication, leurs limites techniques et leur importance.

Le robot devra :
1. Détecter les nouveaux contenus.
2. Extraire les faits essentiels autorisés.
3. Identifier les sujets émergents.
4. Classer les nouvelles par thématique.
5. Identifier les doublons.
6. Regrouper les sources traitant du même événement.
7. Déterminer le niveau de crédibilité.
8. Identifier les événements importants.
9. Déclencher le processus de vérification.
10. Alimenter BYRVOX NEWSROOM.

L'agent doit fonctionner automatiquement 24 h/24 via des services serveur et des tâches programmées.

Il ne doit pas dépendre d'une session ChatGPT ouverte.

# 6. MOTEUR D'ÉVALUATION DES INFORMATIONS

Créer un système de classification des sources.

### Source Quality Engine

**A — Source primaire**
- Documents officiels
- Déclarations authentifiées
- Données gouvernementales
- Décisions judiciaires
- Publications institutionnelles

**B — Source journalistique reconnue**
- Média avec processus éditorial identifiable
- Article signé et daté
- Références vérifiables

**C — Information secondaire**
- Reprises d'autres médias
- Sources peu documentées
- Informations partielles

**D — Information non confirmée**
- Publications sociales isolées
- Rumeurs
- Sources anonymes non corroborées
- Contenus dont l'authenticité est incertaine

Les catégories doivent être affinées selon des critères documentés, et non uniquement selon le nom du média.

### Verification Engine

Pour chaque événement :
- Vérifier la date réelle des faits.
- Vérifier le lieu.
- Identifier la source originale.
- Contrôler l'exactitude des noms et chiffres.
- Vérifier si l'information est ancienne ou nouvelle.
- Rechercher des confirmations indépendantes.
- Identifier les contradictions entre sources.
- Vérifier les traductions.
- Vérifier les citations.
- Détecter les contenus manipulés ou non authentifiés lorsque possible.

Un score de confiance doit être accompagné d'éléments vérifiables et ne doit jamais être présenté comme une certitude mathématique arbitraire.

### Classification éditoriale

- CONFIRMÉ
- EN COURS DE VÉRIFICATION
- DÉVELOPPEMENT EN COURS
- INFORMATION CONTESTÉE
- CORRIGÉ
- ARCHIVÉ

Les informations incertaines ne doivent pas être présentées comme des faits.

# 7. BYRVOX NEWSROOM — RÉDACTION AUTOMATISÉE

Développer une rédaction numérique assistée par IA.

### Objectif

Transformer automatiquement des informations vérifiées en contenus éditoriaux originaux et publiables.

Le robot ne doit pas simplement reprendre les articles d'autres médias et remplacer les mots par des synonymes.

Il doit effectuer une **synthèse journalistique originale des faits**, les contextualiser, citer les sources et respecter les droits d'auteur.

### Pipeline de rédaction

1. Réception du sujet depuis PULSE AI.
2. Recherche et consolidation des sources.
3. Vérification factuelle.
4. Construction d'une chronologie.
5. Identification des éléments manquants.
6. Rédaction originale.
7. Génération de titres.
8. Création d'un résumé.
9. Ajout des références.
10. Contrôle qualité.
11. Validation selon le niveau de risque.
12. Publication.
13. Surveillance des nouvelles informations.
14. Mise à jour de l'article.
15. Archivage des versions.

### Types de contenus

- Flash News
- Breaking News
- Article standard
- Analyse approfondie
- Explication / décryptage
- Chronologie
- Live Blog
- Dossier spécial
- Newsletter
- Synthèse quotidienne
- Synthèse hebdomadaire

### Cadence

Permettre au robot de recevoir de nouvelles informations toutes les minutes et de générer rapidement un brouillon lorsqu'une information pertinente est détectée.

La publication effective dépendra du niveau de confiance, de la disponibilité des preuves et des règles éditoriales.

Créer trois modes :

**Mode 1 — Automatique**

Publication autorisée uniquement pour des catégories factuelles à faible risque, issues de sources suffisamment fiables, avec règles et sources préapprouvées.

**Mode 2 — Semi-automatique**

Le robot rédige et un éditeur autorisé valide avant publication.

**Mode 3 — Vérification renforcée**

Validation humaine obligatoire pour les sujets sensibles :
- Accusations contre des personnes
- Crimes et incidents majeurs
- Conflits armés
- Santé publique
- Élections et informations civiques
- Informations financières susceptibles d'affecter les marchés
- Décès et catastrophes
- Contenus susceptibles de causer un préjudice important

Aucune invention de citation, de témoignage, de chiffre, de source ou de déclaration.

Les images et vidéos doivent être autorisées, correctement attribuées ou créées sous licence.

### Articles évolutifs

Chaque article doit pouvoir être actualisé sans perdre son historique.

Prévoir :
- Date de première publication
- Date de dernière modification
- Liste des sources
- Historique des changements
- Avis de correction
- Lien canonique
- Versions précédentes
- Journal de validation

Une mise à jour majeure doit pouvoir déclencher une nouvelle notification.

# 8. BYRVOX COMMAND CENTER — CMS PROFESSIONNEL

Construire une plateforme d'administration complète.

Elle doit servir de centre de contrôle pour toutes les opérations du média.

### Dashboard principal

Afficher :
- Nombre de sources surveillées
- État des connexions API
- Nouveaux sujets détectés
- Articles en préparation
- Articles en vérification
- Articles programmés
- Articles publiés
- Corrections en attente
- Vidéos en production
- Publications sociales
- Audience du site
- Membres inscrits
- Performances des newsletters
- Coûts des services IA
- Alertes techniques

### Gestion éditoriale

Créer :
- Éditeur d'articles professionnel
- Bibliothèque multimédia
- Gestion des catégories
- Gestion des auteurs
- Workflow de validation
- Calendrier éditorial
- Planification des publications
- Révisions et restauration
- Recherche avancée
- Gestion des commentaires
- Gestion des traductions
- Gestion des dossiers et émissions

### Rôles et autorisations

Prévoir au minimum :
- Super Admin
- Administrator
- Editor-in-Chief
- Editor
- Journalist
- Fact Checker
- Video Producer
- Social Media Manager
- Support
- Subscriber

Chaque action éditoriale ou administrative importante doit être journalisée.

Ne pas donner à un agent IA un accès administratif illimité.

# 9. BYRVOX STUDIO AI — PRODUCTION VIDÉO AUTOMATISÉE

Créer un studio virtuel automatisé permettant de produire des bulletins d'information professionnels.

### Formats

- BYRVOX Brief — 30 secondes
- BYRVOX Brief — 60 secondes
- BYRVOX Brief — 90 secondes maximum
- Flash spécial
- Résumé économique
- Actualités internationales
- Résumé politique factuel
- Technologie
- Sports
- Culture

### Workflow automatique

1. Identifier les sujets importants des dernières heures.
2. Sélectionner les informations vérifiées.
3. Construire un script.
4. Générer un résumé cohérent.
5. Vérifier le texte final.
6. Générer une voix professionnelle.
7. Générer un présentateur virtuel.
8. Assembler les éléments audiovisuels.
9. Insérer le logo BYRVOX.
10. Ajouter titres, graphiques et sous-titres.
11. Contrôler le résultat.
12. Exporter la vidéo.
13. Préparer ou effectuer la publication sociale.

### Présentateurs virtuels

Créer plusieurs personnages fictifs ou avatars sous licence :
- Présentatrice principale
- Présentateur principal
- Correspondant international
- Présentateur économique
- Présentateur sportif

Ils doivent avoir :
- Apparence photoréaliste professionnelle
- Voix naturelle
- Synchronisation labiale
- Gestuelle crédible
- Éclairage de studio
- Cohérence visuelle d'une émission à l'autre

Ne pas utiliser l'apparence ou la voix d'une véritable personnalité sans les droits et autorisations nécessaires.

Identifier clairement les présentateurs et les contenus synthétiques comme générés par IA, tout en conservant une esthétique audiovisuelle de grande qualité.

### Studio virtuel

Créer une identité de plateau :
- Écrans LED
- Globe numérique
- Logo BYRVOX
- Cartes géographiques
- Animations d'actualité
- Bandeaux inférieurs
- Habillage Breaking News
- Transitions professionnelles

### Formats de sortie

- 9:16 pour Shorts, Reels et TikTok
- 16:9 pour télévision, site Web et YouTube
- 1:1 pour certaines publications sociales

Le moteur doit respecter une durée maximale de 90 secondes pour BYRVOX Brief.

### Planification

Permettre des éditions programmées :
- À chaque heure
- Toutes les 3 heures
- Toutes les 6 heures
- Quotidiennes
- À la demande
- Déclenchées par une actualité majeure vérifiée

Installer une file de rendu avec reprise automatique en cas d'échec.

Prévoir un aperçu et une validation éditoriale avant diffusion pour les catégories à risque.

# 10. DISTRIBUTION SUR LES RÉSEAUX SOCIAUX

Créer un Social Media Distribution Engine.

Prévoir des intégrations lorsque les API officielles et les autorisations le permettent avec :
- YouTube
- YouTube Shorts
- Instagram
- Facebook
- TikTok
- X
- LinkedIn

### Fonctionnalités

- Publication multi-plateforme
- Programmation
- Génération de descriptions
- Titres adaptés à chaque plateforme
- Sous-titres
- Miniatures
- Liens vers BYRVOX
- Suivi des publications
- Analyse des performances
- Détection des erreurs
- Tentatives de republication contrôlées

Respecter les règles de chaque plateforme, y compris les obligations relatives aux contenus générés par IA.

Ne jamais déclarer une vidéo publiée si l'API n'a pas confirmé sa publication.

Prévoir un workflow manuel pour les plateformes ou les comptes ne permettant pas la publication automatique.

# 11. COMPTES UTILISATEURS ET PERSONNALISATION

Créer un système de comptes moderne.

### Inscription

Prévoir :
- Email et mot de passe
- Google
- Apple
- Microsoft

Autres fournisseurs si pertinents et techniquement disponibles.

### Profil personnel

Chaque utilisateur pourra :
- Gérer son compte
- Choisir sa langue
- Choisir le thème clair ou sombre
- Sélectionner ses centres d'intérêt
- Suivre des catégories
- Sauvegarder des articles
- Sauvegarder des vidéos
- Suivre des émissions
- Consulter son historique
- Gérer les notifications
- Gérer ses abonnements
- Exporter ses données
- Demander la suppression de son compte

### Personnalisation

Proposer des recommandations basées sur les thèmes sélectionnés et les interactions autorisées.

Séparer clairement personnalisation et décision éditoriale.

Ne pas créer de bulles d'information fermées : permettre de consulter facilement les informations générales et des perspectives documentées variées.

# 12. NEWSLETTERS ET NOTIFICATIONS

Développer BYRVOX MAIL, un moteur automatisé de communications.

### Produits éditoriaux

**BYRVOX Breaking**
Alertes sur les événements importants.

**BYRVOX Morning Brief**
Résumé quotidien des nouvelles essentielles.

**BYRVOX Evening Brief**
Résumé des événements de la journée.

**BYRVOX Weekly**
Résumé hebdomadaire des principales actualités.

**BYRVOX Editorial**
Éditorial exclusif BYRVOX, avec validation éditoriale humaine obligatoire et séparation claire entre opinions et informations factuelles.

**BYRVOX Special Report**
Dossiers et analyses exclusifs.

### Fonctionnalités

- Abonnement aux newsletters
- Gestion des préférences
- Envoi segmenté
- Envoi programmé
- Notifications push
- Notifications email
- Archives des newsletters
- Statistiques d'ouverture et de clics selon consentement
- Désabonnement simple
- Limitation de la fréquence
- Prévention des envois multiples

Configurer les consentements requis et les règles applicables, notamment la loi canadienne anti-pourriel, la législation québécoise sur les données personnelles et les autres juridictions visées.

Prévoir une confirmation d'inscription lorsque nécessaire et enregistrer les preuves de consentement.

# 13. EXPÉRIENCE BYRVOX RADIO ET BYRVOX TV

### BYRVOX RADIO

Créer :
- Lecteur audio live
- Programmation
- Guide des émissions
- Podcasts
- Rediffusions
- Pages des animateurs
- Notifications d'émissions
- Bibliothèque audio
- Interface mobile adaptée

Prévoir une intégration avec une solution de streaming autorisée.

### BYRVOX TV

Créer :
- Lecteur vidéo live
- Programmation
- Guide TV
- Replay
- Vidéo à la demande
- Documentaires
- Reportages
- Émissions originales
- Pages des présentateurs
- Sous-titres
- Adaptation aux téléviseurs connectés

Prévoir une solution de diffusion vidéo évolutive.

Les futures marques RadioYO et TVYO pourront réutiliser une partie de ces infrastructures sans partager obligatoirement la même interface ou la même programmation.

# 14. ARCHITECTURE TECHNIQUE

Choisir et justifier une architecture moderne, stable et évolutive.

Technologies candidates :
- Next.js et TypeScript
- React
- Tailwind CSS
- PostgreSQL
- CMS headless professionnel
- Redis et files de tâches
- Stockage objet pour médias
- CDN
- API sécurisées
- Services IA interchangeables
- Services d'envoi d'emails
- Orchestrateur de tâches récurrentes
- Infrastructure de diffusion audio et vidéo

Ne pas multiplier les services inutilement.

### Architecture recommandée

Séparer les éléments suivants :
1. Frontend public
2. CMS et administration
3. Base de données
4. Gestion des utilisateurs
5. Collecteurs de nouvelles
6. Moteur de vérification
7. Moteur de rédaction
8. Moteur de publication
9. Production vidéo
10. Distribution sociale
11. Email et notifications
12. Analytics et supervision

Ne pas faire tourner des tâches longues de génération vidéo dans les requêtes Web ordinaires.

Utiliser des travailleurs asynchrones, des files d'attente, des mécanismes de reprise et des règles d'idempotence.

### Objectif de réactivité

Permettre la détection rapide des nouvelles prioritaires, avec une cadence cible d'une minute.

Mesurer :
- Délai de détection
- Délai de collecte
- Délai de vérification
- Délai de création d'un brouillon
- Délai de validation
- Délai de publication
- Délai de génération vidéo

Ne jamais sacrifier l'exactitude pour atteindre un délai artificiel.

# 15. SÉCURITÉ, CONFORMITÉ ET RÉSILIENCE

Intégrer dès le développement :
- Authentification sécurisée
- Gestion des rôles
- MFA pour l'administration
- Limitation des requêtes
- Validation des entrées
- Protection contre les injections
- Gestion sécurisée des clés API
- Sauvegardes automatiques
- Journalisation des actions
- Contrôles de sécurité des médias
- Protection contre le spam
- Surveillance des services
- Alertes en cas de panne
- Reprise après incident
- Prévention des publications en doublon
- Protection contre les instructions malveillantes intégrées aux contenus externes

Un article collecté sur Internet doit être traité comme une donnée non fiable, jamais comme une instruction exécutable.

Prévoir :
- Politique éditoriale
- Politique de corrections
- Politique de confidentialité
- Conditions d'utilisation
- Politique de droits d'auteur
- Règles d'utilisation de l'IA
- Transparence sur les avatars IA
- Gestion des demandes de retrait

Évaluer les exigences réglementaires applicables au Canada et dans les marchés visés, notamment pour les services de diffusion audiovisuelle.

# 16. SEO, GOOGLE NEWS ET PERFORMANCE

Optimiser le site pour les moteurs de recherche et les agrégateurs d'actualités.

Implémenter :
- Métadonnées dynamiques
- URLs propres
- Sitemap XML
- News Sitemap
- RSS
- Canonical URLs
- Données structurées NewsArticle
- Données structurées Organization
- Pages auteurs
- Dates de publication fiables
- Dates de modification fiables
- Open Graph
- Métadonnées sociales
- Chargement optimisé
- Images responsives
- Cache intelligent
- Accessibilité WCAG
- Internationalisation

Prévoir le français et l'anglais, avec une architecture permettant d'ajouter d'autres langues.

Ne pas traduire automatiquement des citations de façon à en changer le sens.

# 17. MONÉTISATION

Préparer une architecture commerciale permettant :

- Publicités display
- Publicités vidéo
- Sponsoring d'émissions
- Sponsoring de podcasts
- Abonnements Premium
- Newsletters Premium
- Contenus exclusifs
- Partenariats de distribution
- Licensing de contenus originaux
- Partenariats commerciaux

Distinguer clairement contenus publicitaires, contenus commandités, éditoriaux et articles journalistiques.

Prévoir les modules sans activer de facturation réelle avant configuration et validation.

# 18. ANALYTICS & MEDIA INTELLIGENCE

Créer une interface analytique regroupant :

- Visiteurs
- Visiteurs uniques
- Pages vues
- Articles les plus consultés
- Sources de trafic
- Engagement
- Temps de lecture
- Taux de retour
- Abonnements
- Newsletters
- Performances sociales
- Lectures vidéo
- Écoutes radio
- Coûts d'IA
- Coûts par article
- Coûts par vidéo
- Revenus lorsque disponibles

Afficher uniquement des mesures réelles.

Ne pas inventer de statistiques d'audience ou de nombre d'émissions pour valoriser artificiellement la plateforme.

# 19. PLAN DE DÉVELOPPEMENT

Procéder en phases, tout en conservant un produit opérationnel à chaque livraison.

### PHASE 1 — SITE PUBLIC ET CMS

Livrer :
- Reproduction fidèle de l'interface de référence
- Light Mode
- Dark Mode #333333
- Navigation complète
- Pages BYRVOX News, Radio et TV
- Pages d'articles
- CMS professionnel
- Comptes utilisateurs
- Base de données
- Déploiement public

### PHASE 2 — RÉDACTION AUTOMATISÉE

Livrer :
- BYRVOX PULSE AI
- Connecteurs de sources autorisées
- Collecte continue
- Classification
- Fact-checking
- Rédaction IA
- Workflow de validation
- Publication et mises à jour automatiques contrôlées
- Dashboard de supervision

### PHASE 3 — ABONNÉS ET NOTIFICATIONS

Livrer :
- Préférences utilisateurs
- Newsletter quotidienne
- Newsletter hebdomadaire
- Éditorial BYRVOX
- Alertes Breaking News
- Notifications personnalisées
- Statistiques d'engagement

### PHASE 4 — STUDIO AUDIOVISUEL IA

Livrer :
- BYRVOX STUDIO AI
- Présentateurs virtuels
- Génération de scripts
- Génération de voix
- Vidéos de 30, 60 et 90 secondes
- Sous-titres et habillages
- File de rendus
- Publication sociale autorisée
- Validation et supervision

### PHASE 5 — EXTENSION MÉDIA

Livrer progressivement :
- Infrastructure Radio
- Infrastructure TV
- Lives et replays
- Intégration RadioYO
- Intégration TVYO
- Applications mobiles
- Capacités multilingues avancées

# 20. GITHUB, CI/CD ET DÉPLOIEMENT

Connecte le projet à GitHub avec les autorisations disponibles.

Si aucun dépôt approprié n'existe, créer un dépôt BYRVOX dédié dans l'organisation ou le compte autorisé.

Utiliser une architecture de répertoires organisée.

Prévoir notamment :
- apps/web
- apps/admin
- apps/workers
- apps/studio
- packages/ui
- packages/core
- packages/ai
- packages/database
- packages/integrations
- docs
- tests
- infrastructure

Configurer :
- Gestion de versions
- Branches de développement
- Pull requests
- Tests automatisés
- CI/CD
- Variables d'environnement
- Déploiements de prévisualisation
- Documentation technique
- Journaux de modifications
- Procédure de restauration

Utiliser Vercel pour les applications Web si cette solution répond aux besoins.

Placer les travailleurs permanents et les traitements lourds sur une infrastructure adaptée lorsque nécessaire.

Ne jamais enregistrer de secrets dans GitHub.

# 21. TESTS ET ACCEPTATION

Avant de déclarer la livraison terminée :

1. Vérifier le rendu visuel par rapport à la référence.
2. Tester les thèmes clair et sombre.
3. Tester les vues mobiles, tablettes et ordinateurs.
4. Tester les comptes utilisateurs.
5. Tester les rôles administratifs.
6. Tester la création d'article.
7. Tester l'intégration des sources.
8. Tester le fonctionnement du cycle de surveillance.
9. Tester les doublons.
10. Tester les erreurs de publication.
11. Tester la sécurité des workflows IA.
12. Tester les notifications.
13. Tester la newsletter.
14. Tester une vidéo de démonstration clairement identifiée comme telle.
15. Tester les intégrations sociales disponibles.
16. Tester la résilience et la reprise des tâches.
17. Vérifier les performances et l'accessibilité.
18. Vérifier le fonctionnement du site public.

Créer un rapport de tests avec résultats, problèmes identifiés et correctifs.

Distinguer les fonctionnalités réellement opérationnelles des démonstrations utilisant des données fictives.

# 22. LIVRABLES OBLIGATOIRES

Je veux obtenir :

**A. SITE WEB**
- Site BYRVOX réellement navigable
- Version claire et version sombre
- Interface fidèle au mockup
- Pages médias et articles fonctionnelles

**B. ADMINISTRATION**
- CMS complet
- Dashboard
- Gestion des sources
- Gestion éditoriale
- Gestion des membres

**C. INTELLIGENCE ARTIFICIELLE**
- Agent BYRVOX PULSE AI
- Agent de rédaction
- Vérification et contrôles
- Mises à jour des articles
- Historique d'exécution et supervision

**D. AUDIOVISUEL**
- BYRVOX STUDIO AI
- Générateur de bulletins vidéo
- Modèles de présentateurs
- Gestion des rendus
- Distribution sociale

**E. INFRASTRUCTURE**
- Dépôt GitHub
- Code source documenté
- Pipeline de déploiement
- Configuration des tâches automatiques
- Tests
- Supervision
- Gestion des coûts

**F. RAPPORT FINAL**
- Liens fonctionnels
- État des modules
- Fonctionnalités livrées
- Résultats des tests
- Intégrations activées
- Intégrations nécessitant une autorisation
- Coûts récurrents estimés
- Limites connues
- Prochaines améliorations prioritaires

# 23. INSTRUCTIONS FINALES

Tu dois agir comme une équipe de développement responsable de livrer une plateforme médiatique en production.

Ne te limite pas à proposer un design ou à rédiger une stratégie.

Commence par examiner les fichiers joints, les ressources existantes et les accès disponibles.

Établis une architecture exécutable, puis développe et déploie les composants dans l'ordre des dépendances.

Privilégie une solution stable, maintenable, économiquement raisonnable et véritablement automatisée.

Ne présente pas des simulations comme des intégrations opérationnelles.

Si une autorisation, une clé API, un abonnement payant ou une décision légale est indispensable, identifie précisément le blocage et poursuis les parties qui peuvent être réalisées sans cette dépendance.

Chaque agent doit produire des journaux auditables.

Chaque article doit être traçable jusqu'à ses sources.

Chaque contenu audiovisuel doit pouvoir être relié aux informations dont il provient.

**Objectif ultime : créer une newsroom internationale intelligente, capable de surveiller les nouvelles en permanence, de produire rapidement des contenus originaux et vérifiés, de les publier sur BYRVOX et de les transformer en formats audiovisuels pour les plateformes numériques.**

Le système doit être conçu pour fonctionner 24 h/24, avec supervision humaine proportionnée aux risques éditoriaux.

**BYRVOX — BEYOND THE HEADLINES**

**BUILD. TEST. DEPLOY. MONITOR. IMPROVE.**