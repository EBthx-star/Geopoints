# BTHX Travel

Application privée de préparation de voyage et de road book.
Elle succède à **GéoPoints** et met en œuvre la v1 « rituel du soir » spécifiée
dans la note Notion *TRAVEL – BTHX family*.

Aucune donnée ne quitte l'appareil : pas de compte, pas de serveur, pas de réseau social.

---

## Les deux axes

| Axe | À quoi il sert |
|---|---|
| **1 — Préparation** | Le carnet du voyage : étapes, hôtels, tables, visites. Chaque entrée porte une date, des coordonnées et des notes libres où l'on colle ce qu'on veut. La carte affiche l'ensemble et trace la route réelle entre les étapes. |
| **2 — Road book** | Le soir, on importe les photos de la journée. L'app lit leurs coordonnées GPS et leur horodatage, regroupe les photos en étapes, reconstitue le trajet et compose la page du jour. |

Le lien entre les deux : quand on nomme une étape du road book, l'app propose
le nom du lieu préparé le plus proche (moins de 800 m).

---

## Ce qui tourne sans réseau

- Le code de l'application, mis en cache par le service worker
- La lecture des métadonnées photo — lecteur EXIF maison, aucune dépendance
- Les tracés routiers déjà calculés — mis en cache segment par segment
- Toutes les données et toutes les photos

Ce qui a besoin du réseau : les **fonds de carte** (tuiles OpenStreetMap) et le
**calcul d'un nouveau tracé** (OSRM). Hors ligne, les données sont enregistrées
normalement ; les cartes se rempliront au retour du réseau, et les segments non
calculés apparaissent en pointillé ocre.

---

## Structure

```
index.html            L'application (version de dev, références séparées)
css/app.css           Mise en page — palette teal #1d4e5f / ocre #c2853a du road book Le Cap
js/exif.js            Lecture EXIF JPEG et HEIC, sans bibliothèque externe
js/data.js            Itinéraire Le Cap 2026, stockage (localStorage + IndexedDB)
js/app.js             Logique des deux axes, cartes, imports, exports
service-worker.js     Cache applicatif pour le mode hors ligne
build.sh              Assemble la version publiée (un seul fichier) dans docs/
test/                 Banc de test navigateur (Leaflet remplacé par un stub)
docs/                 Version publiée par GitHub Pages (produite par build.sh)
notes/                Notes de projet, migrées depuis Notion
```

**Stockage.** Le dossier de voyage (texte) va dans `localStorage` ; les photos,
redimensionnées à 1400 px en JPEG, vont dans IndexedDB — `localStorage` serait
saturé dès la dixième photo.

---

## Exports

| Format | Usage |
|---|---|
| **PDF** | Ouvre la version imprimable, puis *Enregistrer en PDF*. Photos incluses. |
| **Page web** | Un fichier `.html` autonome, photos embarquées. Se consulte partout, s'archive. |
| **Notion** | Markdown copié dans le presse-papiers et téléchargé. Les photos se glissent ensuite à la main. |
| **Sauvegarde** | `.json` complet — données **et** photos. C'est le filet de sécurité. |

⚠️ **Faire une sauvegarde chaque semaine.** Safari purge les données d'un site
web après une période d'inactivité. La sauvegarde est le seul recours.

---

## Déploiement

GitHub Pages est configuré sur **branche `main`, dossier `/docs`**. La racine
du dépôt contient les sources ; `build.sh` produit `docs/index.html` (le fichier
compilé en un seul morceau, servi par Pages), `docs/manifest.json` et
`docs/service-worker.js`.

### Publier

Une seule commande, qui refuse de pousser si les tests échouent :

```bash
./publish.sh "ton message de commit"
```

Elle construit la version compilée, lance le banc de test, et ne pousse à
GitHub que si tout passe. La publication en ligne est automatique via GitHub
Pages (1-2 min de délai après le push).

Pour construire ou tester séparément :

```bash
./build.sh                # (re)fabrique docs/
node test/run.mjs         # banc de test (requiert un serveur HTTP local)
python3 -m http.server 8777   # le serveur local, à lancer avant les tests
```

Sur iPhone : ouvrir l'URL **dans Safari**, puis Partager → *Sur l'écran d'accueil*.
Autoriser la localisation à la première demande.

Prérequis côté appareil : Réglages › Confidentialité › Service de localisation ›
**Appareil photo** doit être activé, sinon les photos arrivent sans coordonnées
et le road book ne peut rien reconstituer.

---

## Tests

```bash
python3 -m http.server 8777          # depuis la racine du dépôt
node test/run.mjs                    # nécessite playwright
```

Le banc remplace Leaflet par un stub afin de tourner sans réseau. Il couvre le
chargement, le chargement de l'itinéraire, les filtres, l'ajout d'une étape, la
persistance, le regroupement des photos en étapes, le rendu du road book et les
trois exports.
