#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Génère les deux illustrations originales (SVG) des fiches Information
et les encode en data URI base64 dans js/illus.js.

Dessins faits ici, à la main / par calcul : aucune image tierce."""
import base64, math, os, random

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "js/illus.js")
SVGDIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")

# ---------------------------------------------------------------- ibis sacré
def ibis():
    rnd = random.Random(7)
    # La formation en V, au loin : un oiseau de tête, puis deux branches.
    chevrons = []
    pts = [(352, 30)]
    for k in range(1, 5):
        pts.append((352 - k * 26, 30 + k * 7))   # branche basse
        pts.append((352 - k * 24, 30 - k * 6))   # branche haute
    for (px, py) in pts:
        w = 6.5 + rnd.random() * 2
        up = -3 - rnd.random() * 1.6
        chevrons.append(
            f'<path d="M{px - w:.0f} {py:.0f}Q{px:.0f} {py + up:.0f} {px + w:.0f} {py:.0f}"/>'
        )
    chev = "".join(chevrons)

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" role="img" aria-label="Ibis sacre en vol">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#cadff0"/><stop offset=".62" stop-color="#e6e9e4"/><stop offset="1" stop-color="#f2dfc3"/>
</linearGradient></defs>
<rect width="400" height="260" fill="url(#sky)"/>
<g fill="none" stroke="#6f8292" stroke-width="2.1" stroke-linecap="round" opacity=".5">{chev}</g>
<g stroke="#232a30" stroke-linejoin="round">
<path d="M188 148C214 170 236 194 231 207 215 200 192 176 178 155Z" fill="#c9d6df" stroke-width="2"/>
<path d="M243 139 286 149 245 157Z" fill="#eef3f6" stroke-width="2"/>
<path d="M249 151 317 169" stroke-width="3.2" stroke-linecap="round" fill="none"/>
<path d="M317 169 330 172M317 169 328 164" stroke-width="2.2" stroke-linecap="round" fill="none"/>
<path d="M150 136C170 123 214 121 245 135 263 144 258 158 236 160 205 163 167 154 150 144Z" fill="#fbfdfe" stroke-width="2"/>
<path d="M151 138C129 132 111 124 100 115" stroke="#1b2126" stroke-width="13.5" stroke-linecap="round" fill="none"/>
<circle cx="95" cy="112" r="10.5" fill="#1b2126" stroke="none"/>
<path d="M88 115C70 120 55 130 43 148" stroke="#1b2126" stroke-width="5.6" stroke-linecap="round" fill="none"/>
<path d="M190 131C213 95 247 61 285 43 299 55 285 91 255 125 231 139 204 141 190 131Z" fill="#fdfefe" stroke-width="2"/>
<path d="M285 43C299 55 291 77 275 97 266 84 271 60 285 43Z" fill="#1b2126" stroke-width="1.6"/>
</g>
<g font-family="Georgia,serif" font-size="12.5" fill="#4a5a66">
<text x="14" y="246">Ibis sacré — Threskiornis aethiopicus</text>
</g>
</svg>'''


# ------------------------------------------------------------- leucospermum
def leucospermum():
    rnd = random.Random(19)
    cx, cy = 200, 132
    back, front, tips = [], [], []
    n = 132
    for i in range(n):
        a = -math.pi / 2 + i * (2 * math.pi / n) + rnd.uniform(-0.012, 0.012)
        deg = math.degrees(a) % 360
        # on laisse passer la tige : pas de style vers le bas
        if 72 < deg < 108:
            continue
        r0 = 20 + rnd.uniform(-2, 2)
        r1 = 78 + rnd.uniform(-9, 11)
        # raccourcis vers le bas : la fleur est posée sur son involucre
        if 40 < deg < 140:
            r1 *= 0.78
        bend = 0.30 + rnd.uniform(-0.1, 0.1)
        x0, y0 = cx + r0 * math.cos(a), cy + r0 * math.sin(a)
        x1, y1 = cx + r1 * math.cos(a), cy + r1 * math.sin(a)
        # courbure tangentielle (les styles s'enroulent légèrement)
        mx = cx + (r0 + r1) / 2 * math.cos(a + bend * 0.5)
        my = cy + (r0 + r1) / 2 * math.sin(a + bend * 0.5)
        d = f'<path d="M{x0:.1f} {y0:.1f}Q{mx:.1f} {my:.1f} {x1:.1f} {y1:.1f}"/>'
        (back if i % 2 else front).append(d)
        tips.append(f'<circle cx="{x1:.1f}" cy="{y1:.1f}" r="{2.5 + rnd.uniform(-.4, .6):.1f}"/>')

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="Leucospermum, protee pelote d epingles">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#f7f3ea"/><stop offset="1" stop-color="#e9e6dc"/></linearGradient>
<radialGradient id="dome" cx=".42" cy=".38" r=".7">
<stop offset="0" stop-color="#fbe7c4"/><stop offset="1" stop-color="#e0ab6d"/></radialGradient></defs>
<rect width="400" height="300" fill="url(#bg)"/>
<path d="M200 196C198 232 196 258 194 288" stroke="#5c7a46" stroke-width="7" stroke-linecap="round" fill="none"/>
<path d="M198 232C176 226 160 210 154 190 176 192 192 208 198 232Z" fill="#6d8f52"/>
<path d="M199 258C221 254 240 240 248 220 226 219 207 234 199 258Z" fill="#7a9c5d"/>
<path d="M197 282C177 279 161 268 153 252 172 250 189 261 197 282Z" fill="#688a4f"/>
<g fill="none" stroke="#f0cfa3" stroke-width="2.3" stroke-linecap="round" opacity=".95">{''.join(back)}</g>
<path d="M164 176C158 196 186 206 200 206 214 206 242 196 236 176 224 190 176 190 164 176Z" fill="#8aa868"/>
<circle cx="200" cy="132" r="30" fill="url(#dome)"/>
<g fill="none" stroke="#f7dcb4" stroke-width="2.5" stroke-linecap="round">{''.join(front)}</g>
<g fill="#d4607f" opacity=".92">{''.join(tips)}</g>
<g font-family="Georgia,serif" font-size="12.5" fill="#6b6354">
<text x="14" y="26">Leucospermum cordifolium — pincushion</text>
</g>
</svg>'''


def put(name, svg):
    os.makedirs(SVGDIR, exist_ok=True)
    p = os.path.join(SVGDIR, name + ".svg")
    with open(p, "w", encoding="utf-8") as f:
        f.write(svg)
    b64 = base64.b64encode(svg.encode("utf-8")).decode("ascii")
    print(f"{name}: {len(svg)} car. SVG, {len(b64)} car. base64 -> {p}")
    return "data:image/svg+xml;base64," + b64


a = put("ibis-sacre", ibis())
b = put("leucospermum", leucospermum())

js = f'''/* ===================== Illustrations des fiches Information ==================
   Dessins originaux (SVG) faits pour l'application : aucune image tierce, donc
   aucune question de droits, et le poids reste minuscule. Les fiches ne
   stockent qu'une clé courte ({{illus:'ibis-sacre'}}) : les images vivent ici,
   dans le code, et jamais dans localStorage. */
const ILLUS = {{
  'ibis-sacre': '{a}',
  'leucospermum': '{b}'
}};
'''
with open(OUT, "w", encoding="utf-8") as f:
    f.write(js)
print("écrit", OUT, os.path.getsize(OUT), "octets")
