#!/usr/bin/env python3
"""BTHX Travel — génération de l'icône d'écran d'accueil.

iOS ignore les SVG pour `apple-touch-icon` : il lui faut un PNG, sinon
l'écran d'accueil affiche une capture de la page. Ce script produit
l'icône aux tailles utiles, dans la palette du road book.

Dessin : une route ocre qui serpente — la Route 62 — depuis un point de
départ jusqu'à une épingle d'arrivée. Fond plein : iOS applique lui-même
le masque arrondi, dessiner des coins les ferait rogner deux fois.
"""

from PIL import Image, ImageDraw
import pathlib, base64, io

TEAL      = (29, 78, 95)
TEAL_DARK = (16, 45, 56)
OCRE      = (194, 133, 58)
WHITE     = (255, 255, 255)

S = 1024          # on dessine large, on réduit ensuite : c'est l'anticrénelage


def bezier(p0, p1, p2, p3, n=900):
    """Échantillonne une Bézier cubique."""
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        x = u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0]
        y = u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1]
        pts.append((x, y))
    return pts


def stamp(d, pts, radius, fill):
    """Trace une courbe épaisse en tamponnant un disque le long du chemin.

    `ImageDraw.line(width=…, joint='curve')` laisse des jointures crénelées
    qui, une fois l'image réduite, produisent un moiré en travers du tracé.
    Le tamponnage donne un bord net et régulier.
    """
    for x, y in pts:
        d.ellipse([x - radius, y - radius, x + radius, y + radius], fill=fill)


def draw_icon():
    img = Image.new('RGB', (S, S), TEAL)
    d = ImageDraw.Draw(img)

    # Fond légèrement dégradé : la lumière vient du haut.
    for y in range(S):
        k = y / S
        d.line([(0, y), (S, y)], fill=(
            int(TEAL[0] + (TEAL_DARK[0] - TEAL[0]) * k),
            int(TEAL[1] + (TEAL_DARK[1] - TEAL[1]) * k),
            int(TEAL[2] + (TEAL_DARK[2] - TEAL[2]) * k)))

    # La route : elle part en bas à gauche et monte vers l'épingle.
    # Pas de marquage axial — à 180 px il devient du bruit, et une route
    # lisse se lit mieux à toutes les tailles.
    route = bezier((205, 828), (330, 560), (640, 720), (726, 430))

    # Ombre portée, pour détacher la route du fond.
    stamp(d, [(x + 7, y + 12) for x, y in route], 33, (13, 38, 48))
    stamp(d, route, 29, OCRE)

    # Point de départ.
    cx, cy, r = 205, 828, 74
    d.ellipse([cx - r - 6, cy - r + 2, cx + r + 6, cy + r + 12], fill=(13, 38, 48))
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=WHITE)
    d.ellipse([cx - 31, cy - 31, cx + 31, cy + 31], fill=TEAL)

    # Épingle d'arrivée : disque + pointe.
    px, py, pr = 726, 322, 138
    tip = (px, py + 302)
    d.polygon([(px - pr * 0.80, py + pr * 0.52), (px + pr * 0.80, py + pr * 0.52),
               (tip[0] + 7, tip[1] + 10)], fill=(13, 38, 48))
    d.ellipse([px - pr - 7, py - pr + 5, px + pr + 7, py + pr + 16], fill=(13, 38, 48))
    d.polygon([(px - pr * 0.78, py + pr * 0.50), (px + pr * 0.78, py + pr * 0.50), tip],
              fill=WHITE)
    d.ellipse([px - pr, py - pr, px + pr, py + pr], fill=WHITE)
    d.ellipse([px - 57, py - 57, px + 57, py + 57], fill=TEAL)

    return img


def main():
    here = pathlib.Path(__file__).resolve().parent.parent
    icon = draw_icon()

    out = {}
    for size in (180, 192, 512):
        im = icon.resize((size, size), Image.LANCZOS)
        path = here / f'icon-{size}.png'
        im.save(path, 'PNG', optimize=True)
        buf = io.BytesIO()
        im.save(buf, 'PNG', optimize=True)
        b64 = base64.b64encode(buf.getvalue()).decode()
        out[size] = 'data:image/png;base64,' + b64
        print(f'icon-{size}.png  {path.stat().st_size / 1024:.1f} Ko  '
              f'(data URI {len(out[size]) / 1024:.1f} Ko)')

    (here / 'tools' / 'icon-data-uris.txt').write_text(
        '\n\n'.join(f'{k}\n{v}' for k, v in out.items()))
    return out


if __name__ == '__main__':
    main()
