# État du programme

1. Livré en v0.1 : site de lancement et CMS initial ; identité unique ChatGPT, autorisation admin, révisions, collecte NASA manuelle.
2. Prochaine dépendance : configurer le secret hébergé OpenAI sans exposer la clé ; tester un brouillon réel avec sources autorisées.
3. PULSE 24/7 : worker permanent, file durable, minuteur 60 secondes, catalogue de sources et contrats/licences, backoff et métriques. Un bouton manuel n’est pas un cycle autonome.
4. Vérification : corroboration indépendante, chronologie, contradictions, contrôle des citations et scores explicables. Ne pas confondre qualité de source et véracité de chaque fait.
5. Rédaction : règles de publication faible risque à approuver ; sujets sensibles toujours humains ; séparation opinion/fait, corrections publiques.
6. Comptes : rôles multiples, MFA d’administration, fournisseurs OAuth externes, suppression complète du compte applicatif selon politique de conservation.
7. Studio : choisir les fournisseurs et droits, queue de rendu, reprise et contrôle durée <=90s ; distribution sociale seulement aux comptes autorisés. Aucun envoi automatique aux réseaux n’a été activé.
8. Newsletters : expéditeur vérifié, consentement, désabonnement, idempotence, puis planification.
9. Radio/TV : URLs de diffusion sous licence ; guides et replays ; RadioYO/TVYO sur sites et sous-domaines distincts.
10. Finalisation : nom de domaine, société éditrice, politiques légales et contact, licences médias et sources, supervision/coûts mesurés, accessibilité complète.

# Déploiement

Hébergement initial via Sites, pas via Vercel. Le dépôt GitHub est la copie de code de référence. Vercel nécessiterait une adaptation des bindings D1 et de l’identité à son runtime. Aucun domaine BYRVOX n’a été présumé enregistré.
