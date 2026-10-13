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
| Fond de carte | Bascule **plan / satellite** (Esri World Imagery, sans clé), choix mémorisé | Le satellite sert le road book, le plan reste meilleur pour lire routes et noms de lieux sur la Route 62. |
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
- ~~**Import des réservations**~~ — **fait le 20 sept.** : menu ☰ → *Coller une
  confirmation*. Voir la section dédiée plus bas.
- **Synchronisation Mac / web.** Un seul appareil maître pour l'instant.
- **Application native iPhone et Watch.** Validée comme cible, planifiée après
  Le Cap — voir la section « Cible v2 » ci-dessous.

---

## Réservations : ce qui est possible, ce qui ne l'est pas

Question posée le 20 septembre : « aller chercher les vols sur Air France et les
réservations sur Booking ». C'est la **réserve n° 1 du 3 septembre**, écartée
alors avec la mention « à rediscuter si le besoin réapparaît ». Il a réapparu.

### Pourquoi l'app ne peut pas interroger ces sites

1. **Techniquement impossible depuis une page web.** Le navigateur interdit à
   l'app d'appeler `airfrance.fr` ou `booking.com` (politique d'origine). Ce
   n'est pas une question d'effort.
2. **Aucune API grand public « mes réservations »** chez l'un comme chez l'autre.
3. **Se connecter aux comptes** : contraire aux CGU avec risque de blocage, cassé
   par la double authentification SMS, et rompu à chaque refonte de leurs sites.

### Ce qui a été retenu : coller la confirmation

Menu ☰ → **📨 Coller une confirmation** (`js/confirm.js`). On copie le texte du
mail, on le colle, l'app propose ce qu'elle a reconnu, on coche ce qu'on garde.

Reconnu : numéros de vol (AF, KL, SA, BA, LH, EK, QR, TK) avec sens du trajet,
aéroports situés en coordonnées, dates en toutes lettres ou chiffrées, heures,
numéros de dossier, noms d'hébergement, arrivée et départ, téléphone.

Trois garde-fous appris des tests : les aéroports se lisent **après** le numéro
de vol et avant le vol suivant, sinon le retour hérite du trajet aller ; une
référence doit contenir un chiffre, sinon « Bonjour » passe pour un dossier ; le
nom d'hôtel s'arrête avant « est confirmée ».

Le texte collé est conservé en note, et rien de reconnu donne quand même une
entrée : l'utilisateur ne repart jamais les mains vides.

### Ce qui reste ouvert

Claude peut, lui, consulter ces sites dans un navigateur et remplir le voyage —
ce n'est pas l'app qui interroge Air France, c'est un aller-retour assisté. Non
fait le 20 sept. : l'extension Chrome n'était pas joignable depuis la session.

---

## Cible v2 — application native iPhone et Watch

Validé le 20 septembre 2026. **Décision de calendrier : après Le Cap, pas avant.**
Dix-huit jours d'usage réel diront ce qui manque, ce qui sert et ce qui ne sert
jamais. Coder trois semaines avant ce retour d'expérience, c'est construire sur
des suppositions.

### Pourquoi le natif, et pas un emballage de la PWA

Emballer la page actuelle dans une coquille `WKWebView` demanderait quelques
jours, mais conserverait le défaut de fond — la sélection manuelle des photos
chaque soir — et Apple refuse régulièrement les apps qui ne sont qu'un site web
emballé (guideline 4.2).

Le vrai gain est **PhotoKit** : l'accès direct à la photothèque. Le soir, on
ouvre l'app et la journée est déjà reconstituée, sans rien sélectionner. C'est
la v1 « rituel du soir » telle qu'elle était écrite dans *TRAVEL – BTHX family*,
et qu'une page web ne peut structurellement pas tenir.

### La Watch

watchOS n'a pas de navigateur : aucune page web ne peut y tourner. Une app Watch
suppose donc obligatoirement une app iPhone native dont elle est l'extension.

Sa fonction utile est la **capture sur le terrain**, pas la consultation — un
road book ne se lit pas sur 40 mm :
- marquer un point au poignet à l'arrêt, sans sortir le téléphone
- dicter une note de trois secondes devant un point de vue
- voir la prochaine étape

À confirmer au retour du Cap : c'est précisément le genre de besoin que le
terrain valide ou invalide.

### Ce qui se reporte du travail actuel

Le JavaScript ne se porte pas, mais ce n'est pas l'essentiel :
- le modèle de données (voyage, étapes, journées, regroupements)
- l'algorithme de regroupement des photos en étapes (300 m / 1 h)
- le rapprochement d'une étape avec le carnet d'adresses (800 m)
- la charte teal / ocre et la structure à deux axes
- l'itinéraire du Cap
- **et surtout les décisions produit validées à l'usage**

`js/exif.js` devient inutile : PhotoKit livre coordonnées et horodatage
directement.

### Coût à assumer

Xcode, un compte développeur Apple à 99 €/an, et plusieurs semaines. Le compte
gratuit permet d'installer sur son propre appareil, mais l'app **expire au bout
de sept jours** — disqualifiant pour un voyage de dix-huit.

---

## Ajouts du 21 septembre 2026 (note Notion « 21 sept. 2026 — 13h00 »)

**Road book : trajets, kilomètres et temps de route.**
- Entre deux étapes de la journée, une ligne indique la distance et le temps
  de route (OSRM). À moins de 250 m : « à pied », sans interroger le routeur.
  Hors ligne ou sans route : « ≈ X km à vol d'oiseau », en ocre.
- Le total de la journée s'affiche sous la date et dans le cartouche de la carte.
- Le tracé est actif d'office dans le road book ; le bouton 🛣️ ne fait plus
  qu'afficher ou masquer la ligne — les distances restent.
- Bouton 🌍 : **Tout le voyage**. Toutes les étapes sur une carte, marqueurs
  numérotés par jour, total général, total par jour, et les **transferts**
  d'un jour au suivant. Un toucher sur un jour l'ouvre.
- Une étape sans nom prend le nom du lieu préparé le plus proche (hôtel,
  table, site à moins de 800 m), marqué « lieu proposé — ✏️ pour valider ».
  C'est ainsi que les hôtels et restaurants visités apparaissent d'eux-mêmes.
- Les exports (PDF, page web, Notion) reprennent trajets et totaux.

**Plusieurs voyages.** Menu ☰ → *Voyage* : sélecteur du voyage ouvert,
➕ *Nouveau voyage*, 🗑️ *Supprimer ce voyage* (remplace « Tout effacer »).
Le voyage déjà saisi est repris automatiquement comme premier de la liste.
*Itinéraire Le Cap* remplit le voyage s'il est vide, sinon crée un voyage à
part. La sauvegarde ne contient plus que le voyage ouvert et ses photos ; une
restauration revient comme un voyage de la liste.

**Bug corrigé : « OpenStreetMap reste affiché » par-dessus le menu.**
Leaflet place ses contrôles (mention © OpenStreetMap, boutons + / −) sur un
plan d'affichage plus haut que les feuilles du menu. La carte est désormais
isolée (`isolation: isolate`) : ses plans restent enfermés dedans.

Pas encore fait : une carte dessinée dans les exports PDF / page web (les
trajets y sont en texte), et l'ajout à la main d'un lieu visité sans photo.

---

## Ajouts du 21 septembre 2026, soir (note Notion « 21 sept. 2026 16h30 »)

**Chronologie des confirmations collées.** Les lieux se classent désormais par
date **puis heure** (champ *Heure* dans l'éditeur). Les vols prennent leur heure
de départ, et les mails de loueurs (Hertz, Avis, Europcar, Budget, Sixt…) sont
lus : prise en charge et restitution, date, heure, aéroport. Avant, un mail
Hertz n'était pas reconnu et finissait sans date en bas de liste. Formats
anglais acceptés (« Sep 22, 2026 », « 12:30 PM »). La publicité Hertz des mails
Air France est ignorée. Sans heure, un hôtel se range en fin de journée.

**Dates du Cap corrigées.** Stellenbosch (Bonne Esperance, Tokara, Babylonstoren)
passe au 26 sept., Overture au 27, Simon's Town (Quayside, Harbour House) au 27,
conformément au road book (Blue Peter 22→26, Stellenbosch 26→27, Simon's Town 27→28).

**Transfert Mac ↔ iPhone.** Chaque appareil garde ses données, sans serveur :
c'est voulu (données privées), mais rien ne se synchronise seul.
Menu ☰ → *Sauvegarder / envoyer* → AirDrop ; sur l'autre appareil *Restaurer /
recevoir* → **Fusionner**. La fusion ajoute ce qui manque sans rien effacer ; un
même lieu saisi sur deux appareils se reconnaît à son identifiant ou à son nom
et sa date. Limite : un lieu supprimé d'un côté réapparaît à la fusion.
Une vraie synchronisation automatique demanderait un service en ligne : à
décider après Le Cap, avec la v2 native.

**Cigares et domaines.** Deux catégories nouvelles : 🍷 *Domaine* et 🛍️
*Shopping*. Ajout des 9 adresses cigares (Le Cap, Stellenbosch) et de 13
domaines (Constantia, Helshoogte, Hemel-en-Aarde, Elim, Calitzdorp, Robertson)
repris de la conversation *Voyage personnel au Cap*. Les coordonnées des
domaines sont approximatives (📍 dans la note). Menu ☰ → *Itinéraire Le Cap —
charger ou mettre à jour* complète un voyage du Cap existant sans doublon et
sans toucher aux notes saisies.

---

## Ajouts du 25 septembre 2026 — navigation et belles routes

**Y aller.** Bouton 🧭 sur chaque lieu (préparation et road book) : il demande
Plan ou Waze et lance la navigation. L'éditeur d'étape propose les trois liens
(Plan, Waze, Google). Le bouton 🧭 de la carte ouvre **tout l'itinéraire** dans
Google Maps, seule app à accepter des étapes dans un lien (23 au maximum).
Une PWA installée ne peut pas ouvrir de fenêtre par script : on pose un lien
dans la page et on le clique.

**Passage sur la route.** Case à cocher dans l'éditeur. Un lieu coché entre
dans le tracé du voyage même s'il n'est ni étape ni hôtel. C'est ce qui permet
d'imposer une belle route plutôt que la plus rapide — le tracé OSRM passe par
les points dans l'ordre.

Première application : la route Bloubergstrand → Stellenbosch du 26 sept.
(Durbanville Hills, Babylonstoren, Boschendal, col de Helshoogte, Tokara) au
lieu de la N1.

---

## Ajouts du 29 septembre 2026 — dépôt de fichiers et vidéos

**Glisser-déposer.** On lâche des photos ou des vidéos n'importe où dans la
page : un voile teal s'affiche pendant le glissé, le dépôt bascule sur le road
book et lance l'import. Le collage (⌘V) fait la même chose. Pensé pour le Mac ;
sur iPhone, le bouton 📷 *Importer* reste la voie normale.

**Vidéos.** `js/exif.js` lit maintenant les conteneurs MOV / MP4 : position dans
la boîte `©xyz` (ISO 6709) ou dans les métadonnées Apple, date dans `mvhd` ou
dans la date Apple en clair. Le `moov` des iPhone étant souvent en fin de
fichier, on lit aussi la queue du fichier.

**Ce qui est conservé d'une vidéo : une image, pas le film.** Une minute de
4K pèse plus de 300 Mo ; le quota du navigateur serait mangé en un soir. L'app
extrait une frame du début du plan, la stocke comme une photo, marque l'étape
« vidéo » (badge ▶ sur la vignette) et situe le plan sur la carte. Le film reste
dans la photothèque.

**Piège corrigé au passage :** `display:flex` l'emporte sur l'attribut `hidden`.
La zone de dépôt masquée interceptait tous les clics — exactement le défaut
qu'avait eu la visionneuse photo. Le banc de test l'a attrapé.

---

## Ajouts du 1er octobre 2026 — rubrique « Informations »

Nouvelle catégorie **ℹ️ Information** : des fiches de connaissance attachées au
voyage, et non des adresses. Elles ont un filtre dédié, se posent sur la carte
là où elles s'appliquent, restent **hors du tracé** (ce ne sont pas des étapes),
se rangent en fin de liste (pas de date) et forment leur **propre section** dans
les exports PDF, page web et Notion, après le carnet d'adresses.

Huit fiches créées à partir des questions posées en route : Hermanus, Hout Bay,
Paarl, l'agriculture de l'Overberg, colza et canola, les loutres du Cap des
Aiguilles, les solutions de repli pour un safari Big Five, et la belle route
Bloubergstrand → Stellenbosch.

---

## 5 octobre 2026 — le carnet s'étoffe en route

La rubrique Informations passe à **15 fiches** : s'ajoutent le choix d'un
opérateur baleines à Hermanus, le perlemoen (abalone), les horaires de repas
sud-africains, les réserves près de Langebaan (Buffelsfontein et West Coast),
la population et les groupes, l'eucalyptus, et où acheter des cigarettes à
Hout Bay. Trois fiches n'ont pas de coordonnées — connaissances générales, sans
lieu : elles s'affichent dans la liste sans marqueur, ce que l'app gère déjà.

Côté adresses : **Lemonicious** (Hermanus, testé et approuvé) et **The Sir
David Boutique Guest House**, proposé par la direction du Blue Peter pendant
ses travaux. L'itinéraire du Cap compte 80 entrées.

Ce que ça valide, à froid : la fiche d'information attachée au voyage était la
bonne idée. En dix jours de terrain, le carnet a accumulé plus de contenu utile
que la préparation elle-même.

---

## 6 octobre 2026 — légendes de photos et traces GPX

**Légendes.** Chaque photo du road book exporté porte sa légende : date avec
l'année, **heure propre à cette photo** (prise dans `day.raw`, donc deux photos
d'une même étape ont des heures différentes) et nom du lieu. Rien à saisir :
nommer l'étape légende d'un coup toutes ses photos.

**Traces GPX — bouton 🥾 Trace.** L'app Exercice garde ses parcours dans
HealthKit, inaccessible à une page web ; le détour est l'export GPX (app Santé,
ou HealthFit / RunGap). L'app lit le fichier, place la trace dans la journée de
son premier point, l'affiche en rouge sur la carte du road book, et calcule
distance, durée et dénivelé positif (seuil de 3 m contre le bruit altimétrique).

Deux choix à retenir : distance et dénivelé sont calculés sur **tous** les
points, mais on n'en **stocke qu'un tous les 15 m** — un GPX Apple de 84 Ko
tombe à 4 Ko, ce qui compte avec les 5 Mo du navigateur. Et un même fichier
réimporté ne crée pas de doublon (même nom, distance à 50 m près).

La trace est le chemin réellement parcouru : pour une rando sur le Cliff Path
ou Robberg, elle vaut mieux que l'itinéraire reconstitué par OSRM.

Cible native : HealthKit en direct, sans aucun export.

---

## 9 octobre 2026 — fiches Information illustrées

Deux fiches nées d'une question du matin : l'**ibis sacré** (les formations en V
au-dessus du Cap, qui paraissent grises à contre-jour) et le **leucospermum**,
la protée « pelote d'épingles ». Toutes deux avec une image.

**Pourquoi un dessin et pas une photo.** Les photos d'oiseaux et de fleurs
trouvées sur le web appartiennent à leurs auteurs ; les deux illustrations sont
donc des SVG originaux, dessinés pour l'app (`assets/`, générés par
`tools/gen_illus.py`). Elles mettent en avant les critères d'identification :
bec en faucille, tête et cou noirs, bout d'aile noir pour l'ibis ; styles et
pointes colorées pour le leucospermum.

**Où vit l'image.** Pas dans `localStorage` : une fiche ne stocke qu'une clé
courte (`illus:'ibis-sacre'`), et les data URI sont dans le code
(`js/illus.js`, intégré par `build.sh`). Le stockage du voyage ne grossit pas
d'un octet — la leçon de la panne de quota du 23 septembre — et le road book
exporté reste autonome, puisqu'un SVG en data URI voyage avec le fichier.
Le banc de test vérifie les trois points : image affichée, absente du stockage,
présente dans l'export.

**Poids.** 2,5 Ko pour l'ibis, 15 Ko pour la fleur. À comparer aux 4 Ko d'une
trace GPX.

---

## 13 octobre 2026 — l'itinéraire rattrapé par le voyage réel

La deuxième semaine prévue (Garden Route : Gondwana, Knysna, Plettenberg,
Oudtshoorn, Swartberg, Montagu, Robertson) n'a pas eu lieu — le voyage est
resté dans la région du Cap. Ces quinze étapes gardaient leur date, donc la
carte traçait des lignes vers Knysna et le road book affichait des journées
fantômes.

**La correction ne supprime rien.** `CAPE_PLANNED_ONLY` liste ces étapes ;
`topUpCape()` leur retire date et heure. Les fiches restent dans le carnet
d'adresses — ce sont des adresses repérées, utiles pour un prochain voyage —
mais elles ne pèsent plus sur la chronologie. Opération idempotente, et le
bandeau annonce « n étapes remises en projet ».

C'est le bon réflexe pour ce genre de rattrapage : **retirer la date plutôt
que l'entrée.** Supprimer détruirait un travail de repérage ; dater à tort
fausse tout le reste.

Le voyage réel de la deuxième semaine : Struisbaai → Hout Bay (Chapman's Peak,
2-4 oct.), → Hermanus (11 Westcliff, 2e séjour, 4-7 oct.), → Bloubergstrand
(The Sir David, 7-11 oct.). Le second séjour au 11 Westcliff a sa propre
entrée : sans elle, la chronologie sautait de Hout Bay à Bloubergstrand.

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
