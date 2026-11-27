# BYRVOX Media Engine — 1.0.0-alpha.1
Powered by ZM06TECH — prototype isolé, sans changement du CMS ou des agents horaires.

## État
- BYRVOX: adaptateur JSON sur /api/articles, contrat lu dans le dépôt.
- BUZZEUR: configuration de marque et isolation des identifiants, flux JSON à confirmer (aucun dépôt accessible retrouvé). Aucun endpoint supposé actif.
- Plans français, jusqu'à 4 articles récents par appel par défaut, fenêtre 24 h, identifiant SHA-256 par révision, file locale. Une correction crée une nouvelle révision; pas de remplacement automatique des vidéos déjà produites.
- Rendu 1080 × 1920, 30 fps, H.264/AAC, cartouches texte et voix française eSpeak NG (voix de synthèse signalée). Les plans sont fondés uniquement sur le titre et le résumé; aucune vérification factuelle automatique.
- Aucun téléchargement de photo, aucune musique, aucune publication sociale. Les métadonnées des photos sont conservées pour examen des droits audiovisuels. Aucun secret dans Git.
- Ce prototype ne fournit pas encore de file durable D1/R2, limite quotidienne persistante, planificateur, Media Studio, authentification, voix premium, sous-titres SRT ou statistiques. Il sélectionne les derniers articles à chaque passage, y compris ceux déjà mis en file; ne pas l'utiliser comme ordonnanceur de production.
- Les couleurs provisoires sont à harmoniser avec les chartes officielles.

## Exécution (Linux, hors Cloudflare Workers)
Node 22+, ffmpeg avec libx264/drawtext, ffprobe, espeak-ng, fonts-dejavu-core.
Sur Debian/Ubuntu : sudo apt-get install ffmpeg espeak-ng fonts-dejavu-core

    node --test media-engine/engine.test.mjs
    MEDIA_RENDER_TEST=1 node --test media-engine/engine.test.mjs
    node media-engine/engine.mjs scan byrvox /tmp/byrvox-media/queue
    node media-engine/engine.mjs render /tmp/byrvox-media/queue/<id>.json /tmp/byrvox-media/video.mp4 --approved

Examiner le JSON, l'article source, les attributions, la narration et la durée avant d'utiliser --approved. Cette option représente une approbation manuelle locale, pas un contrôle de rôle. Ne pas publier une vidéo sans visionnage. Aucun fichier de production ni jeton dans ce dépôt public.
Pour BUZZEUR, une fois un flux public JSON compatible confirmé, utiliser scan buzzeur <queue> --feed=/chemin-confirme. Vérifier aussi les permaliens.

## Étapes suivantes
1. Confirmer le dépôt et le contrat public BUZZEUR; fournir le corps, les références et la classification des risques au moteur depuis des interfaces autorisées.
2. File durable avec transitions atomiques, quotas journaliers distincts (4 + 4 proposés), historique d'audit et idempotence, corrections et annulations.
3. Worker de rendu isolé, stockage privé R2, voix premium facultative, légendes, médias audiovisuels licenciés et vérification humaine.
4. Portail Media Studio: contrôle des approbateurs, aperçu, régénération, arrêt d'urgence, coûts, sélection par marque.
5. Adaptateur de distribution officiel ou fournisseur approuvé: OAuth séparé pour les deux marques, consentement TikTok, quotas, reçus vérifiables par canal, reprises sans doublons, révocation et retraits. Aucune publication avant raccordement et validation.
6. Tests de bout en bout et déploiement progressif; surveillance des coûts et des erreurs.
