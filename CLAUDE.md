# CLAUDE.md — repères pour les prochaines sessions

## Le projet en une phrase

**BTHX Travel** est l'application privée de voyage d'Emmanuel : une PWA
mono-fichier qui prépare un voyage (carnet de lieux, carte, itinéraire routier)
et tient le road book au fil des jours (import des photos, regroupement en
étapes, exports PDF / web / Notion). Aucune donnée ne sort de l'appareil.

Pour tout le contexte produit, les décisions prises et pourquoi, lire :
**[notes/NOTES-PROJET.md](notes/NOTES-PROJET.md)**. C'est le journal du projet,
plus important que n'importe quel code. Toujours commencer une session par là.

## Comment travailler avec Emmanuel

- **Il n'est pas développeur.** Explique en français simple, tutoie-le.
- **Ne modifie rien sans lui montrer d'abord.** Il veut voir le diff ou la
  commande avant qu'elle ne tourne. Les actions destructives ou qui touchent
  à GitHub demandent son accord explicite.
- **Avance par étapes.** Il préfère valider chaque palier plutôt que découvrir
  une grosse série de changements d'un coup.
- Il travaille sur **Mac** (zsh, Homebrew installé, `gh` CLI configuré,
  Node 24, Python 3.9).

## Structure du dépôt

```
index.html         application version dev (références séparées vers css/, js/)
css/app.css        feuille de style
js/exif.js         lecteur EXIF/HEIC/MOV maison (pas de dépendance)
js/confirm.js      coller une confirmation (vols, hôtels, loueurs)
js/illus.js        illustrations SVG inline (ibis, leucospermum, climat)
js/data.js         itinéraire Le Cap, Store, modèles
js/app.js          deux axes (préparation + road book), cartes, imports, exports
service-worker.js  cache PWA, « réseau d'abord pour la page, cache sinon »
icon-180.png, icon.svg, manifest.json   icônes et manifeste PWA

build.sh           assemble le compilé mono-fichier dans docs/
publish.sh         build + tests + push, en une commande
test/run.mjs       banc Playwright (indispensable avant toute publication)
test/leaflet-stub.js   stub de Leaflet pour que les tests tournent hors ligne

docs/              version publiée par GitHub Pages (produite par build.sh)
notes/             journal de projet (NOTES-PROJET.md)
assets/            SVG sources des illustrations
tools/             scripts ponctuels (ex. gen_illus.py)
package.json       Playwright en devDependency ; scripts npm (optionnels)
```

## Construire, tester, publier

Les trois commandes à connaître (depuis la racine du projet) :

```bash
./build.sh                     # régénère docs/index.html, manifest, service-worker
python3 -m http.server 8777 &  # serveur local (requis par les tests et pour voir l'app)
node test/run.mjs              # banc de test — doit afficher « Aucune erreur console »
```

Pour publier en ligne :

```bash
./publish.sh "message de commit"
```

`publish.sh` enchaîne build + tests + commit + push. **Il refuse de pousser
si les tests échouent.** Rien n'est jamais poussé sans que les tests passent.

## GitHub Pages

- Dépôt : `EBthx-star/Geopoints` (public), branche `main`, dossier `/docs`
- URL publiée : `https://ebthx-star.github.io/Geopoints/`
- Tag de sauvegarde `pre-migration-main` = état du dépôt avant la migration
  des sources (18 oct. 2026). Rollback possible via
  `git push origin pre-migration-main:main --force`.

## Règles non négociables

1. **Lire `notes/NOTES-PROJET.md` en début de session.** Beaucoup de décisions
   produit y sont expliquées (ex. pourquoi un lecteur EXIF maison, pourquoi le
   cache SW « réseau d'abord », pourquoi retirer la date d'une étape plutôt
   que la supprimer).
2. **Ne jamais pousser sans que les tests passent.** `publish.sh` le vérifie,
   `git push` direct non — préférer `publish.sh`.
3. **Ne jamais utiliser `--force` ou `--force-with-lease`** sans l'accord
   explicite d'Emmanuel. L'historique local fait foi.
4. **Ne jamais toucher au tag `pre-migration-main`.**
5. **Ne pas créer de dépendance réseau nouvelle sans raison forte.** Le choix
   de départ est le hors-ligne : les tuiles OSM et le routage OSRM sont les
   seules concessions, et elles sont déjà encadrées.
6. **Pas de bibliothèque npm en production.** Playwright est en devDependency
   pour les tests, c'est tout. Le code embarqué dans `docs/index.html` n'a
   que Leaflet comme ressource externe (unpkg).
7. **Ne pas documenter dans ce fichier des choses déjà dans
   `notes/NOTES-PROJET.md`** — ces notes sont la source de vérité produit,
   `CLAUDE.md` ne doit répéter que ce qui concerne la façon de travailler.

## Si quelque chose casse en ligne

L'URL publique est `https://ebthx-star.github.io/Geopoints/`. Pour revenir à
l'état d'avant la migration du 18 oct. 2026 :

```bash
git push origin pre-migration-main:main --force
```

Puis revenir sur `Settings → Pages` du dépôt pour remettre « folder : / (root) ».
Prévenir Emmanuel avant.
