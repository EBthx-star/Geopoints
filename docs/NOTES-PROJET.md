# BTHX Travel — notes de projet

Notes migrées depuis Notion le 20 septembre 2026, en application de la
**Note 20 sept. 9h30** de la page *Géo point* : « basculer les travaux et note
dans Claude code ». Les pages Notion restent la trace de la réflexion ; à partir
d'ici, ce fichier fait foi et suit le code.

Sources d'origine :
- Notion *Géo point* — la demande initiale
- Notion *TRAVEL – BTHX family* et *BTHX Travel — Spec v1 « Le rituel du soir »*
- Conversation *Voyage personnel au Cap* — le road book Western Cape 2026

---

## Ce qui a été demandé

Depuis la note *Géo point* :

1. Faire évoluer GéoPoints vers des fonctions « à la Polarsteps », **sans réseau
   social** : les informations restent privées et maîtrisées.
2. Tracer les trajets GPS entre les photos, **en suivant les routes réelles** de
   la carte, pas des lignes droites.
3. Éditer une liste de sites avec commentaires libres et copier-coller, pour
   produire des road books.
4. Faire converger avec le travail de *TRAVEL – BTHX family*.

---

## Décisions prises le 20 septembre 2026

| Sujet | Décision | Pourquoi |
|---|---|---|
| Convergence | GéoPoints **devient** BTHX Travel, un seul produit | La demande de *Géo point* est mot pour mot la v1 « rituel du soir ». Deux descriptions du même produit. |
| Structure | **Deux axes** dans le même outil : *Trip préparation* et *Trip road book* | Demande explicite d'Emmanuel. |
| Socle | **PWA** maintenant, natif iOS plus tard | Le Cap est dans deux jours. Le natif demande Xcode, un compte développeur et TestFlight : trois semaines au mieux. La PWA se met à jour par un `git push`. |
| Horizon | Utilisable **dès Le Cap** (22 sept.) | Périmètre serré assumé : importer, situer, tracer, annoter, exporter. |
| Tracé routier | **OSRM public**, profil voiture, segment par segment, avec cache | Gratuit, sans clé. Bascule possible vers OpenRouteService si les quotas coincent. |
| Bibliothèque EXIF | **Écrite sur mesure** (`js/exif.js`) | Les CDN et npm étaient inaccessibles au moment du développement. Au final c'est le bon choix : zéro dépendance réseau pour la fonction la plus critique du voyage. |
| Exports | PDF **et** page web **et** Markdown pour Notion | Les trois ont été demandés. |
| Sauvegarde | Export JSON complet, photos comprises | Safari purge les données d'un site après inactivité. Seul recours. |

---

## Le point dur du choix PWA, à assumer

La spec Notion v1 repose sur **PhotoKit** : l'app lit toute seule la photothèque
et reconstitue la journée sans aucun geste. **Une page web ne peut pas faire
cela.** Elle ne voit que les photos qu'on lui désigne.

Conséquence concrète, chaque soir : au lieu de « j'ouvre l'app et ma journée est
là », c'est « j'ouvre l'app, je touche *Importer*, je sélectionne les photos du
jour ». Sur une sélection multiple iOS, cela prend une trentaine de secondes.

Ce qui rend le compromis acceptable : **les photos portent déjà le GPS et
l'heure**. Elles sont la source de vérité, pas l'application. Si la PWA échoue,
rien n'est perdu — le voyage se rejoue intégralement au retour.

Le passage au natif reste la cible quand le produit sera stabilisé.

---

## Ce qui n'est pas dans cette version

Repris de la feuille de route Notion, hors périmètre pour Le Cap :

- **v1.5 — aide à la décision sur place.** « Est-ce que je prends encore mon
  transfert ? », « qu'est-ce qui saute aujourd'hui ? ». Suppose de connaître le
  statut réel des vols.
- **v2 — optimiseur de prix.** Veille sur vols, hôtels et loueurs. Nécessite un
  serveur. Priorité dans cette phase : **les loueurs**, parce que l'annulation
  gratuite y rend la re-réservation réellement rentable.
  Rappel de la décision du 3 sept. : surveiller **la variation**, pas le prix —
  Emmanuel est membre Hertz Gold, Avis Preferred et Europcar Privilege, donc
  l'app en anonyme ne verra jamais son tarif réel.
- **Import des réservations** par partage du mail de confirmation.
- **Synchronisation Mac / web.** Un seul appareil maître pour l'instant.

---

## Voyage de test : Le Cap, 22 sept. – 10 oct. 2026

L'itinéraire est pré-chargé dans `js/data.js` (menu ☰ → *Itinéraire Le Cap*) :
23 entrées reprises du road book, boucle côte à l'aller puis Route 62 / Klein
Karoo au retour, retour obligatoire au Cap.

Semaine 1 réservée — Blue Peter (Bloubergstrand), Bonne Esperance (Stellenbosch),
Quayside (Simon's Town), 11 Westcliff (Hermanus), Oceans (Struisbaai).
Semaine 2 à réserver — Gondwana, Knysna, Plettenberg Bay, Oudtshoorn, Montagu :
ces étapes portent la mention ⚠️ dans leurs notes.

Les coordonnées sont un point de départ, chaque étape reste modifiable dans l'app.

**À savoir sur place :** les pistes des réserves privées ne figurent pas dans le
réseau routier d'OSRM. Les segments concernés — Gondwana en particulier —
s'afficheront en pointillé ocre, en ligne droite. C'est normal.

---

## Suite immédiate

1. Vérifier sur l'iPhone, avant le départ, que l'import de photos HEIC restitue
   bien les coordonnées — c'est la seule chose qui n'a pas pu être testée sur
   une vraie photo.
2. Installer la PWA depuis Safari et ouvrir l'app une fois **avec du réseau**,
   pour que le service worker mette tout en cache.
3. Premier soir au Cap : importer, nommer deux ou trois étapes, exporter une
   sauvegarde. Si ce cycle passe, le voyage est couvert.
