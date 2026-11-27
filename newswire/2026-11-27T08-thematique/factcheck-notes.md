# Note de vérification interne — SAP, 27 novembre 2026

## Verdict

Partiellement confirmé : incident de sécurité reconnu par SAP. Les affirmations précises de vol de jetons et de copie/modification du code proviennent d’un insider du Spiegel et ne sont pas publiquement confirmées par SAP. Ne pas les convertir en faits établis dans un titre, une légende ou un extrait. « Aucun indice à ce stade d’accès non autorisé aux données métier des clients » est la position actuelle de SAP, pas une preuve de l’absence de tout impact.

## Chaîne de sources et degré de certitude

| Point | État | Preuve disponible |
|---|---|---|
| Activités suspectes et réponse de sécurité | Confirmé par SAP aux journalistes | Reuters et SecurityWeek disent avoir reçu directement la déclaration. |
| Absence d’indice d’accès aux données métier clients | Déclaration de SAP, limitée à l’état de son enquête | Reuters, dpa, SecurityWeek. |
| GitHub utilisé par SAP concerné | Corroboration journalistique indépendante | dpa dit avoir vu en partie une note interne, reprise dans Tagesspiegel et Tagesschau. |
| Vol de jetons de salariés | Allégation journalistique sourcée, non confirmée publiquement par SAP | Insider cité par Der Spiegel, repris explicitement par t-online, Handelsblatt et SecurityWeek. |
| Code copié ou modifié | Même chaîne d’attribution | t-online dit « manipulieren und kopieren » au conditionnel ; Handelsblatt décrit aussi une capacité potentielle, pas une preuve technique publique. |
| Restrictions GitHub, processus automatiques suspendus, clés renouvelées | Informations propres à Handelsblatt, attribuées à ses sources internes | Article de Christof Kerkmann du 27/11/2026. |
| Produit livré aux clients compromis | Non établi publiquement | Aucun produit ni version de novembre n’a été nommé dans les sources retenues. |
| Code propriétaire volé | Non établi | SecurityWeek relève l’incertitude sur ce point. |
| Utilisation d’IA | Hypothèse de sources, non confirmée par SAP | Ne pas écrire « une IA a piraté SAP ». |
| Auteurs / groupe criminel | Non établi pour cet incident | Ne pas attribuer à The Gentlemen, TeamPCP ou Shai-Hulud. |
| Lien avec npm avril/mai 2026 | Aucun lien démontré dans les sources | La note SAP 3759444 porte explicitement sur le printemps. |
| Intrusion dans GitHub en tant que fournisseur | Non établi | Les comptes/environnements SAP sur GitHub et l’infrastructure GitHub sont des périmètres différents. |

## Limites de l’accès documentaire

- L’article original Der Spiegel, publié le 26 novembre 2026, a été identifié à cette adresse : https://www.spiegel.de/netzwelt/sap-wird-opfer-von-hackerangriff-a-6648b5ce-5d74-48dc-86ea-9469705bb91d . Son accès intégral est restreint. Les détails sont donc attribués aux reprises qui citent explicitement son enquête, sans prétendre à une lecture intégrale.
- Aucun bulletin technique public détaillé sur l’incident de novembre n’a été trouvé dans la salle de presse SAP. La déclaration SAP retenue provient des réponses directes à Reuters, dpa et SecurityWeek.
- Aucune preuve volée, jeton, archive de code victime ou publication criminelle n’a été téléchargée ou utilisée.
- La note npm de SAP décrit un incident antérieur ; son périmètre et ses assurances ne doivent pas être appliqués au dossier de novembre.
- Éviter le superlatif « plus grande entreprise de logiciels d’Europe » sans métrique et date : il est inutile à la vérification.

## Repères chronologiques

- Quelques jours avant le 26 novembre : note interne aux salariés selon dpa ; date exacte non publiée.
- 26 novembre : révélation Der Spiegel ; déclaration SAP reçue le soir selon Handelsblatt.
- 27 novembre, 00 h 18 CET : t-online.
- 27 novembre, 00 h 21 CET : Handelsblatt.
- 27 novembre, 06 h 30 UTC : Reuters.
- 27 novembre, 02 h 36 ET / 07 h 36 UTC : SecurityWeek.

## Références de recherche pour le parent

Le parent doit rouvrir/rechercher les URL avant de citer ces références dans sa propre réponse.

- Reuters : `turn125513517news6`, `turn401392279news10`, `turn191804038news8`, `turn210938866news8`, `turn399413792news9` (même source, budget 100 mots).
- t-online / dpa : `turn330718548view2` et `turn210938866search3`.
- Tagesspiegel / dpa : `turn330718548view1` et `turn191804038search6`.
- Handelsblatt : `turn401392279search1`, `turn191804038search1`, `turn440494694search1`.
- SecurityWeek : `turn191804038search3`, `turn401392279search5` (ouverture directe échoue ; résultat de recherche intégral exploitable).
- GitHub Docs : `turn124991031view2`.
- SAP KBA 3759444 : `turn440494694view1`.
- Salle de presse SAP : `turn473176533view1`.
- Photo / droits : `turn440494694view0`, `turn399413792search0`.

## Image

Fichier local téléchargé et inspecté : `sap-berlin-2025-lear21.jpg` (2 557 × 2 941, JPEG original, env. 1,8 Mo).

Prise le 20 juillet 2025 par Lear 21. Bureau SAP à Berlin, pas le siège de Walldorf. Licence CC BY-SA 4.0. Crédit, lien de licence et source à conserver. Si un recadrage est ultérieurement fait, l’indiquer et conserver la même licence pour la version adaptée. Photographie d’archives contextuelle, sans mise en scène de piratage ni génération par IA. Aucune modification de l’image n’a été faite.

Source : https://commons.wikimedia.org/wiki/File:1SAPhq.jpg

Original : https://upload.wikimedia.org/wikipedia/commons/a/af/1SAPhq.jpg

Licence : https://creativecommons.org/licenses/by-sa/4.0/
