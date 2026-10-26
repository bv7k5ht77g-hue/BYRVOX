# Vérifications v0.1.0

## Réussies

- 7 tests unitaires des règles de publication : source requise, URL HTTPS, passage en vérification, article complet, JSON source invalide, publication automatique désactivée, normalisation des slugs.
- Vérification TypeScript et compilation de production (Vinext).
- Accueil inspecté dans le navigateur ; correction des textes doublés provenant des images de référence.
- Interrupteur clair/sombre et affichage des logos vérifiés.
- Navigation vers un article de présentation vérifiée sur le déploiement public.
- API publique des articles : réponse `[]` vérifiée dans le navigateur (base vide attendue).
- API de rédaction : accès anonyme refusé, réponse explicite vérifiée dans le navigateur.
- Déploiement initial confirmé par le fournisseur ; audience publique confirmée.
- Secret d’autorisation admin configuré côté hébergement. Contrôles d’autorisation présents sur chaque endpoint privé.

## Limites de vérification

- Le script `tests/cms-flow.py` couvre le parcours complet sur une instance locale authentifiée de test, mais n’a PAS pu être exécuté avec succès ici : l’aperçu géré n’expose pas son serveur à `127.0.0.1:4173` depuis l’exécuteur. Les requêtes CLI au site hébergé sont également limitées par le réseau de l’environnement. Aucun succès end-to-end du CMS n’est revendiqué.
- La connexion administrateur hébergée nécessite la session du propriétaire ; elle n’a pas été usurpée pour les tests.
- Vue mobile : CSS adaptatif implémenté, mais aucune émulation mobile distincte validée dans ce navigateur.
- Appel OpenAI : non testé. Clé créée et enregistrée localement dans un fichier ignoré ; secret hébergé non configuré. L’endpoint hébergé renvoie explicitement une indisponibilité tant que ce secret manque.
- RSS NASA : collecteur implémenté ; aucun premier appel authentifié hébergé confirmé.
- Vidéo, live, email, réseaux sociaux et robot permanent : non raccordés et non présentés comme opérationnels.

## Sécurité de base

Écritures admin : identité du fournisseur + liste d’emails secrète + vérification d’origine. Écritures de préférences : identité et isolation par utilisateur. Les contenus externes ne sont pas exécutés comme HTML. Limites sur les corps de requêtes, brouillons IA limités par minute, collecte sur domaine source fixe et déduplication par URL. Les secrets sont ignorés par Git.

Ce rapport n’est pas un audit de pénétration ni une certification d’accessibilité.
