# Vérifications de BYRVOX 0.2.0

## Publication et lecture

- Les tests des règles éditoriales passent avec Node. Le test d’intégration exécute le Worker compilé, initialise une base D1 temporaire avec les migrations du dépôt et vérifie le parcours de rédaction.
- Un brouillon reste privé. À la publication, la une, la rubrique Actualités, la page article, le RSS et le sitemap le rendent accessible. L’API de liste renvoie uniquement les six champs de résumé publics.
- Une sauvegarde, une soumission pour vérification ou une restauration laisse la version publiée en ligne. Une republication conserve la date de première publication. Le test simule deux écritures concurrentes et vérifie qu’une seule entre dans l’historique.
- Le scénario Python de rédaction a également été exécuté contre le Worker avec une D1 temporaire. Les données de ces deux tests restent locales.
- La page de présentation retourne une adresse canonique absolue, un titre de partage, des données structurées et un lien RSS dans son HTML.

## Navigation

Dans Chrome, la rubrique Radio conserve son adresse au retour depuis un article. Le thème sombre persiste à l’ouverture puis au rechargement d’un article. Le menu mobile permet de rejoindre Radio et de revenir à la rubrique dans un cadre de 390 pixels. À 390 et 768 pixels, le titre et ses boutons sont sur fond uni et le visuel se place en dessous. Le slogan reste entièrement visible.

## Médias

Les fichiers de logo et d’illustration occupent 147 116 octets contre 828 671 dans la version précédente, en comptant la nouvelle variante mobile. L’image principale occupe 28 250 octets en version mobile et 46 718 sur ordinateur. Ces chiffres mesurent les fichiers du dépôt.

## Reproduire

Après installation des dépendances, exécuter les commandes suivantes à la racine du dépôt.

```sh
node node_modules/typescript/bin/tsc --noEmit
npm run build
node --test tests/editorial.test.mjs tests/worker-cms.mjs
```

La diffusion radio/TV et la génération IA hébergée ne font pas partie de ces vérifications.
