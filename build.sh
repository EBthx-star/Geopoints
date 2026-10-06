#!/usr/bin/env bash
# Assemble la version de publication : un seul index.html, CSS et JS intégrés.
# GitHub Pages sert alors trois fichiers à la racine, sans sous-dossiers.
set -euo pipefail
cd "$(dirname "$0")"
python3 - <<'PY'
import pathlib, urllib.parse
html = pathlib.Path('index.html').read_text()
css  = pathlib.Path('css/app.css').read_text()
parts = [pathlib.Path(f'js/{n}.js').read_text() for n in ('exif','confirm','data','app')]
# iOS ignore les SVG pour l'écran d'accueil : l'icône part en PNG,
# intégrée en data URI pour que la version publiée tienne en un fichier.
import base64
png = base64.b64encode(pathlib.Path('icon-180.png').read_bytes()).decode()
uri = 'data:image/png;base64,' + png
svg = 'data:image/svg+xml,' + urllib.parse.quote(pathlib.Path('icon.svg').read_text())

html = html.replace('<link rel="stylesheet" href="./css/app.css">', '<style>\n'+css+'\n</style>')
html = html.replace(
  '<script src="./js/exif.js"></script>\n<script src="./js/confirm.js"></script>\n'
  '<script src="./js/data.js"></script>\n<script src="./js/app.js"></script>',
  '\n'.join(f'<script>\n{p}\n</script>' for p in parts))
html = html.replace('<link rel="apple-touch-icon" sizes="180x180" href="./icon-180.png">',
                    f'<link rel="apple-touch-icon" sizes="180x180" href="{uri}">')
html = html.replace('<img id="appIcon" src="./icon-180.png" alt="">',
                    f'<img id="appIcon" src="{uri}" alt="">')
html = html.replace('<link rel="icon" type="image/svg+xml" href="./icon.svg">',
                    f'<link rel="icon" type="image/svg+xml" href="{svg}">')
assert './css/' not in html and './js/' not in html \
   and './icon.svg' not in html and './icon-180.png' not in html, 'référence locale résiduelle'

out = pathlib.Path('dist'); out.mkdir(exist_ok=True)
(out/'index.html').write_text(html)
print('dist/index.html :', len(html), 'caractères')
PY
