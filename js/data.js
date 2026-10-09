/* BTHX Travel — données de référence et stockage
   ------------------------------------------------------------------
   L'itinéraire Le Cap 2026 reprend la boucle arrêtée dans le road book :
   côte à l'aller (Garden Route), retour par la Route 62 / Klein Karoo.
   Les coordonnées sont un point de départ : chaque étape reste éditable.
*/

/* Corrections apportées après coup à l'itinéraire : appliquées aux voyages
   déjà chargés, tant que l'utilisateur n'a pas lui-même changé la date. */
const CAPE_FIXES = {
  "Bonne Esperance Guest House — Stellenbosch": { from:"2026-09-24", to:"2026-09-26" },
  "Tokara":                                     { from:"2026-09-24", to:"2026-09-26" },
  "Overture":                                   { from:"2026-09-25", to:"2026-09-27" },
  "Babylonstoren — Simondium":                  { from:"2026-09-25", to:"2026-09-26" },
  "Simon's Town Quayside Hotel":                { from:"2026-09-26", to:"2026-09-27" },
  "Harbour House — Kalk Bay":                   { from:"2026-09-26", to:"2026-09-27" }
};

const CAPE_TRIP = {
  name: "Le Cap & Western Cape",
  start: "2026-09-22",
  end: "2026-10-10",
  sites: [
    // ---- Semaine 1 — réservée ----
    { name:"Blue Peter Hotel — Bloubergstrand", kind:"hotel", lat:-33.80670, lon:18.46940, date:"2026-09-22",
      notes:"+27 21 554 1956\nBase des premières nuits, vue sur Table Mountain depuis la plage.\nÀ proximité : Petiscos (peri-peri), Ons Huisie." },
    { name:"Le Cap — V&A / Oranjezicht Market", kind:"site", lat:-33.92490, lon:18.42410, date:"2026-09-23",
      notes:"Oranjezicht City Farm Market le samedi matin (V&A).\nSturk's Tobacconists — la référence historique en ville." },
    { name:"Bonne Esperance Guest House — Stellenbosch", kind:"hotel", lat:-33.93210, lon:18.86020, date:"2026-09-26", time:"15:00",
      notes:"+27 21 887 0225\nDorp Street à deux pas, Stellenbosch Tobacconist dans la rue." },
    { name:"Tokara", kind:"table", lat:-33.91807, lon:18.92092, date:"2026-09-26", time:"12:30", via:true,
      notes:"Winelands. Vue sur la vallée, cuisine sud-africaine. Réserver." },
    { name:"Overture", kind:"table", lat:-33.96860, lon:18.85240, date:"2026-09-27", time:"12:30",
      notes:"Hidden Valley. Table de référence des Winelands. Réserver largement à l'avance." },
    { name:"Babylonstoren — Simondium", kind:"site", lat:-33.82394, lon:18.92635, date:"2026-09-26", time:"10:00", via:true,
      notes:"Jardin potager historique, ferme et cave. Repéré via l'email Air France." },
    { name:"Simon's Town Quayside Hotel", kind:"hotel", lat:-34.19280, lon:18.43260, date:"2026-09-27", time:"17:00",
      notes:"+27 21 786 3838\nSur le port. Manchots de Boulders à côté, Cap de Bonne-Espérance au sud." },
    { name:"Harbour House — Kalk Bay", kind:"table", lat:-34.12760, lon:18.44850, date:"2026-09-27", time:"19:30",
      notes:"Poisson, les pieds au-dessus de l'eau. Bertha's juste à côté à Simon's Town." },
    { name:"11 Westcliff — Hermanus", kind:"hotel", lat:-34.41870, lon:19.23450, date:"2026-09-28",
      notes:"11 Westcliff Rd, Westcliff · +27 82 758 6889 · 11westcliffrentals.com\nSaison des baleines : observation depuis la falaise du Cliff Path.\n\n★ TESTÉ ET APPROUVÉ — maison d'hôtes incroyable, accueil très agréable, emplacement exceptionnel.\nDeux séjours : 28-30 sept., puis RE-RÉSERVÉ du 4 au 7 oct.\nChambres occupées : 7, 10 et 6. Les trois sont très bien.\nPréférence : la 7 d'abord, puis la 10, enfin la 6." },
    { name:"Creation Wines — Hemel-en-Aarde", kind:"table", lat:-34.34280, lon:19.33360, date:"2026-09-28",
      notes:"Accords mets-vins dans la vallée Hemel-en-Aarde. Réserver." },
    { name:"Bientang's Cave — Hermanus", kind:"table", lat:-34.41940, lon:19.24040, date:"2026-09-29",
      notes:"Restaurant dans une grotte au ras des vagues. Baleines depuis la table en saison.\nAutres : Perlemoen Seafront, Fick's Pool, The Rock, La Pentola." },
    { name:"Oceans Guest House — Struisbaai", kind:"hotel", lat:-34.79750, lon:20.05220, date:"2026-09-30",
      notes:"+27 60 980 0664\nLe port aux raies. Cap Agulhas à 5 min : le vrai point le plus austral de l'Afrique." },
    { name:"Cap Agulhas", kind:"site", lat:-34.83330, lon:20.00000, date:"2026-10-01",
      notes:"Pointe sud de l'Afrique, séparation des deux océans. Phare de 1848." },

    { name:"Chapman's Peak Beach Hotel — Hout Bay", kind:"hotel", lat:-34.04706, lon:18.36175, date:"2026-10-02", time:"15:00",
      notes:"2 Chapmans Peak Dr, Scott Estate · +27 21 790 1036 · 4,4/5\nSéjour du 2 au 4 oct., 2 nuits.\nTerrasse face à la baie, calamars réputés — l'institution du coin pour le sundowner.\nÀ pied : port de Hout Bay (otaries de Duiker Island), Bay Harbour Market le ven. soir et le week-end.\nDépart de Chapman's Peak Drive juste devant ; East Fort à 20 min de marche." },

    { name:"The Sir David Boutique Guest House — Bloubergstrand", kind:"hotel", lat:-33.79762, lon:18.45977, date:"2026-10-07", time:"15:00",
      notes:"1 Popham St · +27 21 554 5987 · 4,7/5\nSÉJOUR DU 7 AU 11 OCT. — remplacement du Blue Peter (8 Popham St), fermé pour travaux. Proposé par leur direction, accepté.\n150 m du Blue Peter, même plage, même vue sur Table Mountain.\nMaison d'hôtes : piscine, terrasse panoramique, petit-déjeuner très bien noté, groupe électrogène et onduleurs.\nPlus calme que le Blue Peter, qui a un pub à pizzas au rez-de-chaussée — mais sa terrasse reste à 2 min à pied pour le sundowner." },

    // ---- Informations : réponses aux questions posées en route (1er oct. 2026) ----
    { name:"Hermanus — que faire", kind:"info", lat:-34.41870, lon:19.23450,
      notes:"BALEINES (pic sept.-oct.)\n• Sortie en mer : Southern Right Charters, New Harbour, +27 82 353 0550. Départs 9h / 12h / 15h, ~2h, ~R1 580. Réserver le matin même.\n• Cliff Path : 12 km le long des falaises. Le meilleur tronçon : Gearings Point → Old Harbour → Sievers Point. Baleines à 50 m du bord, tôt le matin.\n\nAUTOUR\n• Hemel-en-Aarde (15 min) : Hamilton Russell, Bouchard Finlayson, Newton Johnson, Creation.\n• Fernkloof Nature Reserve : fynbos et sentiers au-dessus de la ville, 1 à 2 h.\n• Rotary Way : route de crête, le meilleur panorama pour l'effort fourni.\n• Old Harbour et son musée de la chasse à la baleine ; le whale crier à la corne de kelp.\n• Stanford (25 min) : village d'artisans, brasserie Birkenhead.\n• Gansbaai / Kleinbaai (45 min) : cage à requins. De Kelders et les grottes de Klipgat : observation des baleines depuis la terre.\n• Balades à cheval dans le fynbos et sur la plage (Stanford, Grotto Beach), à réserver la veille.\n\nBientang's Cave ferme vers 16h en semaine, 20h ven. et sam." },

    { name:"Hout Bay — que faire", kind:"info", lat:-34.04800, lon:18.34600,
      notes:"OTARIES (otaries à fourrure du Cap)\n• Colonie de Duiker Island : bateaux depuis le port, 30-45 min, sans réservation. Nauticat, Circe Launches, Drumbeat.\n• Le matin, mer plus calme. Des otaries traînent aussi autour des bateaux de pêche, gratuit et souvent plus photogénique.\n\nMANGER\n• Fish on the Rocks — poisson-frites au bout du port, sur les rochers.\n• Mariner's Wharf — marché aux poissons et grill à l'étage.\n• Kitima at the Kronendal — asiatique dans une maison cape dutch de 1713. Réserver.\n• Chapman's Peak Hotel — calamars et terrasse face à la baie. Sundowner.\n• Dunes — les pieds dans le sable.\n\nAUTOUR\n• Bay Harbour Market : vendredi soir, samedi, dimanche. Musique live, meilleur moment de la semaine.\n• Chapman's Peak Drive : 9 km, 114 virages. Péage ~R70, ferme par grand vent.\n• East Fort : 20 min de montée, la plus belle vue du secteur.\n• Sleepy Hollow (Noordhoek) : cheval sur la plage, réserver la veille.\n\nNe rien laisser de visible dans la voiture au port et à East Fort." },

    { name:"Paarl — que faire", kind:"info", lat:-33.73420, lon:18.96210,
      notes:"• Paarl Mountain Nature Reserve : dômes de granit, montée en voiture + courte marche au Bretagne Rock.\n• Taalmonument : monument à la langue afrikaans, architecture de béton, meilleur panorama. Café sur place, superbe au lever du jour.\n• KWV : cave cathédrale et dégustation de brandy — Paarl est la capitale du brandy sud-africain. L'accord local par excellence avec un cigare.\n• Fairview : vins + fromages de chèvre, tour à chèvres. Très couru le week-end.\n• Spice Route (à côté) : grappa, bière artisanale, charcuterie, chocolat, biltong.\n• Rupert & Rothschild (Fredericksburg), sur la route de Franschhoek : grands rouges.\n• Rhebokskloof : balades à cheval dans les vignes, 1 à 2 h, réserver la veille.\n• Main Street : 10 km bordés de chênes, façades cape dutch, Paarl Museum.\n• Tables : Noop (Main Street), Bosman's au Grande Roche (manoir XVIIIe).\n• À 10 min sur la R301 : prison de Drakenstein, où Mandela est sorti libre en 1990 (statue au bord de la route) ; Drakenstein Lion Park, sanctuaire de lions sauvés de captivité.\n\nDemi-journée : Taalmonument au réveil, KWV en fin de matinée, déjeuner à Fairview, montagne en fin d'après-midi." },

    { name:"Agriculture de l'Overberg (le Rûens)", kind:"info", lat:-34.47000, lon:19.89000,
      notes:"Région à pluies d'hiver : semis en mai-juin, moisson en novembre-décembre.\n\n• BLÉ — la culture reine, avec le Swartland c'est le grenier du pays. Silos à Napier, Bredasdorp, Protem.\n• CANOLA (colza) — les champs jaune vif de fin août et septembre. Huile et tourteau.\n• ORGE BRASSICOLE — surtout vers Caledon, grande malterie.\n• AVOINE, LUPINS, TRÈFLES — maillons de la rotation, azote et fourrage.\n• MOUTONS MÉRINOS — laine et viande, pâturent chaumes et repousses. Rotation blé-canola-pâture. De plus en plus de semis direct : le chaume reste au sol contre l'érosion.\n• Près d'Agulhas : vigne d'Elim, la plus australe du continent ; cueillette de fynbos (protées, leucadendrons) pour la fleur coupée.\n\nÀ REGARDER : les grues bleues, oiseau national, se nourrissent dans les blés et les chaumes, souvent par dizaines au bord de la route. L'Overberg en abrite la plus grande population du pays. Les carrés de renosterveld (végétation d'origine) ne subsistent que sur les pentes trop raides pour la charrue." },

    { name:"Colza et canola — ce qui est vrai", kind:"info", lat:-34.47000, lon:19.88000,
      notes:"Le colza n'est PAS interdit au Canada ni aux États-Unis : le Canada en est le premier producteur mondial (~9 M ha), sa première culture en valeur. Le mot canola est canadien — CANadian Oil, Low Acid.\n\nCe qui existe, c'est une règle sur la composition de l'huile, pas sur la culture :\n• Le colza traditionnel est riche en acide érucique, mis en cause dans les années 1970 (lésions cardiaques chez l'animal de laboratoire).\n• Stefansson et Downey (Manitoba) ont sélectionné, par croisement classique et non par génie génétique, des variétés double zéro : moins de 2 % d'acide érucique, peu de glucosinolates dans le tourteau. Autorisation FDA en 1985.\n• Le colza à haute teneur en acide érucique reste cultivé sous contrat, pour l'industrie (lubrifiants, plastiques), avec des distances d'isolement.\n\nDeux idées fausses : le canola ne dérive pas du gaz moutarde, et il n'est pas interdit en Europe (mêmes limites, la France est un gros producteur). Les champs de l'Overberg sont aussi des double zéro." },

    { name:"Loutres au Cap des Aiguilles", kind:"info", lat:-34.79750, lon:20.05220,
      notes:"Loutre à joues blanches du Cap (Aonyx capensis) : sédentaire, visible toute l'année. PAS de saison — ce qui compte, c'est l'heure et la marée.\n\n• À L'AUBE et au crépuscule. La première heure après le lever du jour est la meilleure.\n• À MARÉE BASSE, quand elle fouille les cuvettes et les chenaux (crabes, poulpes).\n• PRÈS D'EAU DOUCE : elle doit rincer le sel de sa fourrure, donc jamais loin d'une embouchure ou d'un suintement.\n\nOÙ\n• De Mond Nature Reserve, embouchure de la Heuningnes (entre Struisbaai et Arniston) — le meilleur endroit du secteur.\n• Rivage rocheux Struisbaai → phare d'Agulhas, vers l'épave du Meishu Maru et Rasperpunt.\n• Port de Struisbaai à l'aube, au retour des bateaux.\n• Suiderstrand, dans le parc national.\n• Vlei de De Hoop (excursion à part entière).\n\nREPÉRER : cherche les épreintes — crottes posées bien en vue sur un rocher plat, pleines de fragments de carapaces de crabe : territoire actif, l'animal repasse. En mer, un dos sombre qui roule, sans le museau rond du phoque. Jumelles, vêtement neutre, rester assis 10 min : elle est curieuse. Par grosse houle, repérage quasi impossible." },

    { name:"Safari Big Five — solutions de repli", kind:"info", lat:-33.78660, lon:20.12160,
      notes:"Aquila (le plus proche du Cap) est le premier complet en vacances scolaires.\n\n• SANBONA WILDLIFE RESERVE — le meilleur choix. Route 62, après Montagu, 62 000 ha de Karoo, Big Five et lions blancs. 3 lodges : Dwyka Tented Lodge, Gondwana Family Lodge, Tilney Manor (demander les trois).\n  sanbona.com · +27 21 010 0028 · reservations@sanbona.com\n  ⚠️ Le « Gondwana Family Lodge » est un lodge DANS Sanbona, rien à voir avec la réserve Gondwana de Mossel Bay.\n• GONDWANA (Mossel Bay) — celui de l'itinéraire, Big Five dans le fynbos, format une nuit.\n• GARDEN ROUTE GAME LODGE (Albertinia, sur la N2) — Big Five, moins exclusif, c'est là qu'il reste le plus souvent de la place en dernière minute. Safari à la journée possible.\n• BOTLIERSKOP (Mossel Bay) — éléphants et lions, drives à la journée.\n\nÀ ÉVITER : Fairy Glen (Worcester), surface trop réduite ; Inverdoorn (Ceres), excellent pour les guépards mais sans léopards, donc pas les Big Five.\n\nTROUVER DE LA PLACE : appeler la réserve directement (les désistements ne s'affichent pas sur les sites de réservation), viser la semaine plutôt que le week-end, et demander un day safari si les chambres sont pleines." },

    { name:"Baleines — quel opérateur à Hermanus", kind:"info", lat:-34.42300, lon:19.22900,
      notes:"TROIS OPÉRATEURS SÉRIEUX\n• Southern Right Charters (New Harbour, Hermanus) — le permis historique, +27 82 353 0550. Bateau moyen, on est bas sur l'eau et proche des animaux, souvent un biologiste à bord. Départs 9h / 12h / 15h, ~2h. LE CHOIX PAR DÉFAUT.\n• Hermanus Whale Cruises (même port) — catamaran plus grand, plus stable, toilettes, pont supérieur. À préférer en cas de mal de mer.\n• Dyer Island Cruises (Kleinbaai, Gansbaai, 45 min) — excellent, utile si Hermanus est complet ou si la baie est trop formée.\n\nCONSEILS\n• Prendre le départ de 9h : mer la plus calme, vent plus tard, lumière rasante.\n• Réserver la veille au soir, même hors du pic.\n• S'habiller bien plus chaudement qu'à terre : 10°C de moins sur l'eau.\n• Comprimé contre le mal de mer 45 min AVANT l'embarquement.\n• Se placer au milieu du bateau. Manger un peu avant. Dragonne au poignet pour l'appareil.\n• Annulation par vent fort = bon signe. Repli : le Cliff Path à l'aube." },

    { name:"Perlemoen (abalone) — ce que c'est", kind:"info", lat:-34.41900, lon:19.23800,
      notes:"Abalone = ORMEAU, aussi appelé oreille de mer. Espèce locale Haliotis midae, nom afrikaans PERLEMOEN — souvent le seul mot sur les cartes.\n\nMollusque blanc nacré, ferme, goût iodé mais doux, plus proche de la Saint-Jacques que de l'huître. Attendri puis saisi rapidement, en tranches, ail ou beurre citronné. Trop cuit = caoutchouteux.\n\n⚠️ Le perlemoen sauvage est massivement braconné pour le marché asiatique, les stocks se sont effondrés et la pêche sauvage est très restreinte. Ce qui est servi légalement vient d'ÉLEVAGE (fermes de la côte ouest et de Hermanus). Un ormeau sauvage à prix cassé = braconnage.\n\nCompter souvent plus de 400 rands la portion." },

    { name:"Horaires des repas en Afrique du Sud", kind:"info", lat:null, lon:null,
      notes:"Nettement plus tôt qu'en France, surtout dans la tradition afrikaans.\n• Breakfast 7h-9h. Copieux le week-end : œufs, bacon, boerewors, parfois du pap.\n• Déjeuner 12h30-13h30, léger : sandwich ou salade. Pas le repas central.\n• DÎNER 18h-19h30 : c'est LE repas. En famille on passe à table vers 18h30. Au restaurant, premier service 18h, coup de feu 19h, cuisines qui ferment les commandes vers 21h, y compris dans les bonnes tables.\n• Tea time vers 10h et 15h, hérité des Britanniques.\n• Le braai n'est pas un repas mais une journée : feu en début d'après-midi, on mange tard — la seule exception.\n\nCONSÉQUENCE : réserver pour 19h, pas 20h30. À 21h dans un village de l'Overberg ou du Klein Karoo, c'est porte close." },

    { name:"Réserves près de Langebaan", kind:"info", lat:-33.26559, lon:18.21935,
      notes:"BUFFELSFONTEIN GAME & NATURE RESERVE — R27 près de Darling, ~30 min au sud de Langebaan, 1h30 du Cap. +27 22 451 2824 · bookings@buffelsfontein.co.za · 8h-17h.\n• QUATRE des Big Five : lion, buffle, rhinocéros, léopard, plus guépards. PAS d'éléphant.\n• Domaine familial de 1 600 ha. Carnivores en enclos, nourris du lundi au samedi — le nourrissage fait partie du game drive de l'après-midi. C'est l'origine du « chaque groupe d'animaux a son ranger ».\n• Pas d'auto-visite : sorties guidées 3h (9h ou 14h) ou 1h30. Sorties à cheval et bungalows sur place.\n• À savoir : ce n'est PAS un safari sauvage type Sanbona. Mais pour voir des lions de près à 30 min de Langebaan sans réserver des mois à l'avance, imbattable.\n\nWEST COAST PRIVATE GAME RESERVE — Yzerfontein, +27 66 525 1994. Girafes, zèbres, buffles, élands, 1 700 ha en bordure du parc national. AUCUN prédateur, pas de Big Five. Belles sorties guidées, mais la promesse Big Five serait inexacte." },

    { name:"Afrique du Sud — population et groupes", kind:"info", lat:null, lon:null,
      notes:"63,1 millions d'habitants (Stats SA, mi-2025).\n• Noirs africains : 51,6 M, ~82 %\n• Coloured : 5,3 M, ~8,4 %\n• Blancs : 4,5 M, ~7,1 %\n• Indiens / Asiatiques : 1,6 M, ~2,5 %\n\nCes catégories sont héritées de l'apartheid, conservées après 1994 pour mesurer les inégalités et piloter le rattrapage. Déclaration volontaire au recensement.\n\nCOLOURED n'a pas d'équivalent français, et surtout pas « métis » : communauté née au Cap du croisement entre Khoïkhoï et San, esclaves de Malaisie, d'Inde et du Mozambique, et colons européens. Langue propre (variante de l'afrikaans), cuisine Cape Malay, quartier du Bo-Kaap. Terme utilisé sans gêne par les intéressés.\n\nDANS LE WESTERN CAPE les proportions s'inversent : Coloured ~40 %, à peu près à égalité avec les Noirs africains, Blancs ~15 % (le double de la moyenne). L'afrikaans y est la première langue." },

    { name:"Eucalyptus — plantations, pas forêts", kind:"info", lat:null, lon:null,
      notes:"AUCUNE forêt d'eucalyptus n'est naturelle ici : l'arbre est australien, introduit au XIXe siècle. Tout est planté. Les forêts indigènes du pays sont d'une autre nature : Knysna et Tsitsikamma, poches afromontane, et le fynbos, végétation basse sans arbres.\n\nPOURQUOI : après la découverte de l'or au Witwatersrand (1886), il fallait des étais de mine et des traverses de chemin de fer — l'eucalyptus pousse vite et droit. Les fermiers en ont fait des brise-vent et des réserves de bois de feu : ce sont les rangées de blue gums de l'Overberg et des Winelands.\n\nUSAGES AUJOURD'HUI : pâte à papier, et surtout pâte à dissoudre exportée vers l'Asie pour la viscose (textile) ; poteaux traités ; bois de mine ; charbon de bois ; huiles essentielles ; miel.\n\nLE REVERS : très gros consommateur d'eau, se ressème le long des rivières, classé espèce envahissante hors plantations. Le programme Working for Water emploie des milliers de personnes à l'abattre dans les bassins versants pour rendre de l'eau aux rivières." },

    { name:"La crise de l'eau du Cap (Day Zero)", kind:"info", lat:null, lon:null,
      notes:"2015-2018 : trois hivers de pluies très déficitaires. Le Cap dépend presque entièrement de six barrages alimentés par les pluies d'hiver — ni nappe profonde, ni fleuve de secours.\n\nDÉBUT 2018 : réserves tombées à ~13 % (les derniers pourcents sont de la vase inexploitable). La ville annonce DAY ZERO au 12 avril 2018 : coupure du réseau, 25 litres par jour à retirer dans 200 points de distribution sous surveillance, pour 4 millions d'habitants.\n\nCOMMENT ÇA A ÉTÉ ÉVITÉ — par la consommation, plus que par la pluie :\n• 50 litres par personne et par jour, tout usage confondu (un bain en consomme 150).\n• Douches de 2 minutes, chasses tirées une fois sur deux, piscines et jardins interdits.\n• Débit réduit chez les gros consommateurs ; carte en ligne montrant maison par maison qui respectait son quota.\n• L'agriculture relâche une partie de ses quotas d'irrigation.\n→ Consommation divisée par deux. Pluies de retour à l'hiver 2018. Day Zero annulé.\n\nCE QU'ON EN VOIT AUJOURD'HUI : panneaux dans les salles de bains, mitigeurs à faible débit, seaux sous la douche, et un réflexe culturel très réel — laisser couler un robinet choque ici.\n\nDEPUIS : diversification des sources — forages dans l'aquifère du Table Mountain Group et celui des Cape Flats, réutilisation des eaux usées, petites unités de dessalement — pour ne plus dépendre que de la pluie.\n\nÀ RELIER : l'arrachage des eucalyptus et des pins dans les bassins versants (programme Working for Water) est l'une des mesures les plus rentables jamais évaluées pour rendre de l'eau aux barrages." },

    { name:"L'ibis sacré — les oiseaux en V au-dessus du Cap", kind:"info", lat:null, lon:null, illus:"ibis-sacre",
      notes:"Ibis sacré, Threskiornis aethiopicus. Ce sont eux, les grandes formations en V qui traversent le ciel du Cap en ce moment.\n\nPOURQUOI ILS PARAISSENT GRIS : l'oiseau est blanc, mais la tête et le cou sont noirs et nus, et le bout des ailes est noir. À contre-jour, le blanc disparaît et il ne reste que le contour sombre — la troupe semble grise, et la silhouette (cou tendu devant, pattes tendues derrière, long bec courbé) ressemble à s'y méprendre à un vol de flamants.\n\nQUAND : toute l'année, mais surtout en fin de journée, quand les bandes rejoignent leurs dortoirs — arbres, îlots, bassins d'épuration. Les groupes du Cap se déplacent entre les zones humides (Rietvlei, Milnerton, Strandfontein, Rondevlei) et les champs des alentours.\n\nLE CRITÈRE QUI TRANCHE : LE BEC.\n• Bec en faucille, courbé vers le bas → ibis sacré.\n• Bec droit et fin, oiseau gris très haut sur pattes → grue bleue (Anthropoides paradiseus), l'oiseau national, abondant dans les blés de l'Overberg. En vol : formations lâches, longues plumes d'ailes traînantes.\n• Bec droit à crochet, oiseau de mer sombre en longues lignes ondulantes au ras des vagues → cormoran du Cap (Phalacrocorax capensis).\n\nLE COUSIN BRUYANT : l'ibis hagedash (hadada) est brun-gris à reflets verts, plus trapu, et pousse un cri hystérique en trois ou quatre notes au décollage — c'est lui qu'on entend depuis les jardins le matin. Il vole par petits groupes, jamais en grandes formations.\n\nCE QU'ILS MANGENT : tout. Le long bec courbé est une sonde, plantée dans la vase, le sable humide ou la pelouse et travaillée au toucher, sans regarder — vers, larves, criquets, crabes et crevettes d'estuaire, grenouilles, petits poissons piégés dans les flaques, lézards. Il pille aussi les œufs et les poussins des autres oiseaux, ce qui lui vaut une solide mauvaise réputation chez les protecteurs des sternes et des cormorans. Et il mange nos déchets : les décharges de Vissershok et de Coastal Park nourrissent des milliers d'individus au Cap.\n\nLEUR JOURNÉE : dispersés en petites bandes sur tout ce qui est plat et humide dans un rayon de 30 à 40 km — zones humides de Rietvlei et de Milnerton, bassins de Strandfontein, labours et prairies irriguées du Swartland, terrains de sport, pelouses de golf, bords de route après la pluie. Du lever du jour au milieu de l'après-midi.\n\nPOURQUOI ILS PARTENT VERS LA MER LE SOIR : ils ne dorment jamais où ils mangent. Chaque soir, toute la population d'un secteur converge vers un DORTOIR COMMUN, qui doit être hors d'atteinte des prédateurs terrestres. Sur le continent ce sont les grands arbres et les roselières ; la meilleure solution reste une île — ni caracal, ni mangouste, ni chien errant. ROBBEN ISLAND, à 8 km de Bloubergstrand, abrite des colonies nicheuses d'ibis sacrés, comme les îles de Saldanha. Elles y sont surveillées, justement à cause des razzias sur les nids de sternes et de cormorans.\n\nCe n'est donc pas une migration mais une NAVETTE QUOTIDIENNE : arrivée du large le matin pour se nourrir, retour au nid le soir. Octobre tombe en pleine reproduction (août à janvier). Le V n'est que de l'économie d'énergie : chaque oiseau vole dans le sillage ascendant du précédent, et la tête tourne régulièrement.\n\nL'ibis sacré est l'oiseau momifié par millions dans l'Égypte ancienne, consacré à Thot — d'où son nom. Il a disparu d'Égypte depuis le XIXe siècle. Il vit en revanche en France : des oiseaux échappés du parc de Branféré (Morbihan) dans les années 1970 ont fondé une population sauvage sur le littoral atlantique et au lac de Grand-Lieu, où ils pillent les colonies de sternes et font l'objet de campagnes de régulation. Même oiseau, même habitude, deux hémisphères.\n\nPour identifier un chant sur le terrain : l'application BirdNET (gratuite, Cornell) écoute et propose une espèce ; sa couverture sud-africaine est bonne." },

    { name:"Le leucospermum — la protée « pelote d'épingles »", kind:"info", lat:null, lon:null, illus:"leucospermum",
      notes:"Genre Leucospermum, famille des Proteaceae. Nom anglais PINCUSHION, pelote d'épingles. L'espèce la plus répandue, et la plus probable pour la fleur crème-abricot à pointes roses : Leucospermum cordifolium.\n\nCE QU'ON PREND POUR DES PÉTALES N'EN EST PAS. L'inflorescence est un capitule de plusieurs centaines de petites fleurs ; ce qui en jaillit, ce sont les STYLES, raides, chacun terminé par une pointe colorée qui porte le pollen. D'où l'aspect de pelote piquée d'épingles.\n\nFLORAISON : août à décembre, pic en septembre-octobre — pleine saison. Couleurs selon les espèces et les cultivars : crème, jaune, abricot, orange, rouge vif.\n\nPOLLINISÉ PAR LES OISEAUX, pas par les insectes : souimangas et sucriers du Cap se posent sur le capitule, et les styles leur déposent le pollen sur le front. La robustesse des tiges et des styles est faite pour supporter le poids d'un oiseau.\n\nFYNBOS ET FEU : sol de sable acide extrêmement pauvre, racines protéoïdes en brosse pour capter le peu de phosphore disponible. Les graines sont des akènes que les FOURMIS emportent sous terre (myrmécochorie) ; elles y attendent l'incendie, et la fumée déclenche la germination. Sans feu, pas de renouvellement.\n\nOÙ EN VOIR : Kirstenbosch (collection de référence), Fernkloof à Hermanus, Harold Porter à Betty's Bay, les pentes du Cap de Bonne-Espérance, et les champs de fleurs coupées autour d'Elim et de Stanford.\n\nLA FAMILLE : même famille que la protée royale (Protea cynaroides, fleur nationale) et les leucadendrons argentés. Le fynbos du Cap compte environ 9 000 espèces végétales, dont les deux tiers ne poussent nulle part ailleurs — c'est le plus petit et le plus dense des six règnes floraux de la planète." },

    { name:"Cigarettes — où acheter (Hout Bay)", kind:"info", lat:-34.04561, lon:18.36117,
      notes:"Vendues en supermarché et en station-service.\n• Village Superstore, 17 Main Rd (Bay Beach Centre) — 7h-21h50, le plus simple au centre.\n• Woolworths, Fishermans World, Princess St — 8h-20h.\n• KwikSpar Oakhurst, Main Rd — 7h30-20h.\n• 24h/24 : Astron Energy (angle The Promenade / Main Rd), BP (122 Main Rd), Engen Sentinel (Victoria Ave).\n\nÀ SAVOIR : la loi interdit l'exposition des produits du tabac — rien n'est visible en rayon, il faut demander à la caisse. Choix de marques internationales plus restreint qu'en Europe." },

    { name:"La belle route Bloubergstrand → Stellenbosch", kind:"info", lat:-33.82493, lon:18.56581,
      notes:"~95 km, 2 h de volant contre 50 min par la N1. Principe : ne jamais prendre la N1, traverser trois vallées viticoles d'ouest en est, et entrer dans Stellenbosch PAR LE HAUT en descendant Helshoogte.\n\n1. Blue Peter → Durbanville par la M14 puis la M13. Belvédère de Durbanville Hills : la baie derrière, les vignes devant.\n2. Durbanville → Klapmuts par la R302 : blé et vignes, le Paarl Rock droit devant. Le tronçon que personne ne prend.\n3. Klapmuts → Simondium par la R101 puis la R45 : Babylonstoren au pied du Simonsberg.\n4. Simondium → Boschendal par la R45 : allée de chênes entre Groot Drakenstein et Simonsberg, le plus beau bitume des Winelands.\n5. Boschendal → Tokara par la R310, COL DE HELSHOOGTE : route de montagne, vue plongeante sur la vallée de Banhoek.\n6. Tokara → Stellenbosch : 10 min de descente jusqu'au centre historique.\n\nVariante rapide : M12 puis R304 par Muldersvlei, 55 km, 1 h — déjà dans les vignes. La N1 n'est pas une alternative.\nTout est goudronné. Plein à Durbanville. La lumière de fin d'après-midi sur Helshoogte est la plus belle du parcours." },

    // ---- La belle route Bloubergstrand → Stellenbosch (26 sept.) ----
    // Ces trois points sont cochés « passage sur la route » : le tracé du
    // voyage emprunte donc les vallées viticoles au lieu de la N1.
    { name:"Durbanville Hills — belvédère", kind:"vin", lat:-33.82493, lon:18.56581, date:"2026-09-26", time:"09:30", via:true,
      notes:"Tygerberg Valley Rd · +27 21 558 1300 · cave ouverte à partir de 11h (sam. 11h–16h30)\nPremier point de vue en quittant la côte : la baie derrière, les vignes devant.\nOn y arrive par la M14 puis la M13, jamais par la N1." },
    { name:"Boschendal — allée de chênes", kind:"vin", lat:-33.87679, lon:18.97434, date:"2026-09-26", time:"12:00", via:true,
      notes:"R45 entre Simondium et Franschhoek · +27 21 870 4279\nLa plus belle ligne droite des Winelands, chênes et montagnes des deux côtés.\nDe là, on remonte le col de Helshoogte (R310) vers Tokara." },
    { name:"Col de Helshoogte (R310)", kind:"site", lat:-33.91000, lon:18.94000, date:"2026-09-26", time:"12:15",
      notes:"Route de montagne goudronnée entre Banhoek et Stellenbosch. Vue plongeante sur la vallée.\nLa plus belle arrivée sur Stellenbosch — magnifique en fin d'après-midi.\n📍 Position approximative." },

    // ---- Tables ajoutées le 23 sept. (conversation « Voyage personnel au Cap ») ----
    { name:"Ons Huisie — Bloubergstrand", kind:"table", lat:-33.79958, lon:18.45893, date:"2026-09-22", time:"19:30",
      notes:"Chaumière de pêcheur les pieds dans le sable, cheminée. Poisson et fruits de mer.\nJuste à côté du Blue Peter." },
    { name:"Petiscos — Parklands", kind:"table", lat:-33.81835, lon:18.49655, date:"2026-09-23", time:"19:30",
      notes:"Portugais authentique à ~10 min de Bloubergstrand : gambas peri-peri, espetada, plateaux grillés.\nLe plus proche du souvenir de Durban." },
    { name:"La Colombe — Constantia", kind:"table", lat:-34.00830, lon:18.38110, date:"2026-09-24", time:"12:30",
      notes:"Silvermist, Constantia Nek. La grande table de la vallée, à caler sur la journée Constantia.\n📍 Position approximative. Réserver." },
    { name:"Caramba — Green Point", kind:"table", lat:-33.90882, lon:18.41200, date:"2026-09-24", time:"19:30",
      notes:"Petite tasca portugaise : gambas peri-peri, sardines grillées." },
    { name:"Die Strandloper — Langebaan", kind:"table", lat:-33.07232, lon:18.03923, date:"2026-09-25", time:"12:30",
      notes:"~1h15 au nord. Festin de poisson multi-plats cuit sur feux ouverts, sur la plage.\nRéserver, apporter ses boissons, espèces." },
    { name:"Dias Tavern — District Six", kind:"table", lat:-33.92757, lon:18.42510, date:"2026-09-25", time:"19:30",
      notes:"Institution portugaise du Cap : sardines, poulet et poisson peri-peri, ambiance taverne." },
    { name:"Kalky's — Kalk Bay", kind:"table", lat:-34.12905, lon:18.44882, date:"2026-09-27", time:"12:30",
      notes:"Sur le port. Snoek et thon grillés à l'huile peri-peri, gambas. Rustique, espèces.\nSur la route de la péninsule." },
    { name:"Saveur — Simon's Town", kind:"table", lat:-34.19300, lon:18.43290, date:"2026-09-27", time:"20:00",
      notes:"Au-dessus du port, près de Jubilee Square. Coucher de soleil sur False Bay, belle carte des vins.\n📍 Position approximative. Réserver." },
    { name:"Bertha's — Simon's Town", kind:"table", lat:-34.19310, lon:18.43310, date:"2026-09-28", time:"08:00",
      notes:"Quayside Centre, 1 Wharf St · +27 21 786 2138 · 8h–22h\nSur le quai, juste sous l'hôtel : c'est là qu'on prend le petit-déjeuner." },
    { name:"Fick's Pool — Westcliff, Hermanus", kind:"table", lat:-34.41850, lon:19.22900, date:"2026-09-28", time:"18:00",
      notes:"8 Marine Dr, Westcliff · +27 28 312 4082 · 11h–18h (ven.-sam. 19h)\nTapas et sundowners au-dessus de la piscine de marée, à côté du logement.\n📍 Position approximative." },
    { name:"La Pentola — Hermanus", kind:"table", lat:-34.41850, lon:19.23200, date:"2026-09-28", time:"19:30",
      notes:"87 Marine Dr · +27 28 313 1685 · lapentola.co.za · 11h–22h\nVue Walker Bay, baleines depuis la table.\n📍 Position approximative." },
    { name:"Southern Right Charters — sortie baleines", kind:"site", lat:-34.42300, lon:19.22900, date:"2026-09-29", time:"09:00",
      notes:"The Whale Shack, New Harbour · +27 82 353 0550 · southernrightcharters.co.za\nDéparts 9h / 12h / 15h · ~2 h · ~R1 580 par adulte. RÉSERVER.\n📍 Position approximative." },
    { name:"Perlemoen Seafront — Hermanus", kind:"table", lat:-34.41900, lon:19.23800, date:"2026-09-29", time:"12:30",
      notes:"64 Marine Dr · +27 79 314 8658 · ~9h–15h\nFruits de mer, spécialiste de l'ormeau (perlemoen) et du snoek. Plutôt le midi.\n📍 Position approximative." },
    { name:"The Rock — New Harbour, Hermanus", kind:"table", lat:-34.42300, lon:19.22950, date:"2026-09-29", time:"19:00",
      notes:"New Harbour · +27 28 312 2920 · 8h30–21h\nFruits de mer et sushi, vue port, aussi le petit-déjeuner. Là où part le bateau baleines.\n📍 Position approximative." },
    { name:"Lemonicious — Hermanus", kind:"table", lat:-34.41991, lon:19.24354, date:"2026-10-05", time:"19:30",
      notes:"Village Square, Market Square St & Marine Dr · +27 82 334 4034 · 11h-22h tous les jours\nTesté et approuvé : poissons remarquables, thon exceptionnel. Plateaux de fruits de mer, curry de la mer, sushi.\nDemander une table côté baie. Réserver, c'est très demandé." },
    { name:"The Hart — Melkbosstrand", kind:"table", lat:-33.72956, lon:18.43899, date:"2026-10-09", time:"19:00",
      notes:"Shop 4, Mira Mar Centre, 26 Beach Rd · +27 69 332 7323 · 4,5/5\nTesté et approuvé : ambiance incroyable, gens adorables. Fish & chips excellent, houmous et burgers au même niveau.\nMUSIQUE LIVE LE VENDREDI SOIR.\n« The Hart » s'écrit à l'afrikaans — c'est bien « le cœur ».\nHoraires : 7h30-22h du mercredi au vendredi, 7h30-15h les autres jours. Service du soir seulement trois soirs par semaine : vérifier avant de s'y rendre pour dîner.\nÀ 12 min au nord du Sir David par la M14, face à la plage." },
    { name:"Catch Cook — port de Struisbaai", kind:"table", lat:-34.79750, lon:20.05250, date:"2026-10-01", time:"12:30",
      notes:"Sur le quai. Déjeuner de fruits de mer, là où Parrie la raie vient se faire nourrir.\n📍 Position approximative." },

    // ---- Cigares (conversation « Voyage personnel au Cap ») ----
    { name:"Sturk's Tobacconists", kind:"shop", lat:-33.92221, lon:18.42004, date:"2026-09-23",
      notes:"54 Shortmarket St, City Centre · +27 21 423 3928 · sturks.co.za\nLA référence historique (1793), Churchill y achetait son tabac. Cubains, pipes faites main.\n⚠️ Adresse incertaine depuis 2020 (Shortmarket St ou Garden Centre, Mill St) : appeler avant." },
    { name:"Cape Cigars & Tobacconist — Green Point", kind:"shop", lat:-33.90788, lon:18.40944, date:"2026-09-23",
      notes:"105 Main Rd, Green Point · +27 72 457 4189 · 9h–19h (dim. 9h–14h)\nPetite boutique, patron serviable, prix corrects, choix limité." },
    { name:"The Cock 'n Bull — V&A Waterfront", kind:"shop", lat:-33.90361, lon:18.42081, date:"2026-09-23",
      notes:"Shop 6192, 1 Breakwater Blvd · +27 21 421 1860 · 9h–21h · cocknbull.co.za\nHumidor correct, bon conseil. Le plus accessible depuis le Waterfront." },
    { name:"Smokers Deli Shop", kind:"shop", lat:-33.92553, lon:18.41529, date:"2026-09-23",
      notes:"City Centre · +27 65 839 5735 · ouvert jusqu'à 23h\nMontecristo frais, cubains et américains." },
    { name:"Bascule Bar — Cape Grace", kind:"shop", lat:-33.90823, lon:18.42017, date:"2026-09-24",
      notes:"V&A Waterfront · capegrace.com\nCarte de whiskies monumentale, terrasse sur la marina." },
    { name:"JJ Cale Premiere Tobacconist — Stellenbosch", kind:"shop", lat:-33.97840, lon:18.84200, date:"2026-09-26",
      notes:"Stellenbosch Square · jjcale.co.za\nChaîne nationale au fonds sérieux : Cohiba, Bolivar, Partagas, Behike, Padrón…" },
    { name:"Stellenbosch Tobacconist", kind:"shop", lat:-33.93927, lon:18.85933, date:"2026-09-26",
      notes:"Dorp St, plein centre — à deux pas de Bonne Esperance · 8h30–22h\ninstagram.com/stellenboschtobacconist" },
    { name:"Blix Tavern", kind:"shop", lat:-33.93934, lon:18.85694, date:"2026-09-26",
      notes:"Stellenbosch · blix.africa\nLe plus petit bar de Stellenbosch. Cigares à la carte, bières maison. Fermé le dimanche." },
    { name:"Balboa Balcony Bar", kind:"shop", lat:-33.93737, lon:18.86119, date:"2026-09-26",
      notes:"Stellenbosch · +27 21 886 7110\nOn peut y fumer. Interdit aux moins de 23 ans, alcools premium." },

    // ---- Domaines viticoles (conversation « Voyage personnel au Cap ») ----
    // Positions approximatives pour les domaines sans coordonnées dans la conversation : à vérifier.
    { name:"Klein Constantia", kind:"vin", lat:-34.03810, lon:18.41250, date:"2026-09-24",
      notes:"Vallée de Constantia, la plus ancienne. Le mythique Vin de Constance (celui de Napoléon à Sainte-Hélène).\n📍 Position approximative." },
    { name:"Groot Constantia", kind:"vin", lat:-34.02710, lon:18.42460, date:"2026-09-24",
      notes:"Le plus ancien domaine du pays (1685), manoir cape dutch.\n📍 Position approximative." },
    { name:"Delaire Graff", kind:"vin", lat:-33.92050, lon:18.92250, date:"2026-09-26",
      notes:"Col de Helshoogte, voisin de Tokara. Registre luxe ; resto japonais Hōseki.\n📍 Position approximative." },
    { name:"Hamilton Russell Vineyards", kind:"vin", lat:-34.38450, lon:19.25300, date:"2026-09-29",
      notes:"Hemel-en-Aarde. Pinot Noir et Chardonnay de climat frais, référence du pays.\n📍 Position approximative." },
    { name:"Bouchard Finlayson", kind:"vin", lat:-34.38100, lon:19.26100, date:"2026-09-29",
      notes:"Hemel-en-Aarde. Pinot Noir « Galpin Peak ».\n📍 Position approximative." },
    { name:"Newton Johnson", kind:"vin", lat:-34.36900, lon:19.26700, date:"2026-09-29",
      notes:"Upper Hemel-en-Aarde. Pinot Noir, belle vue sur la vallée.\n📍 Position approximative." },
    { name:"Strandveld Vineyards — Elim", kind:"vin", lat:-34.66300, lon:19.81000, date:"2026-10-01",
      notes:"Route des vins d'Elim, la plus australe d'Afrique. Gamme First Sighting, Sauvignon Blanc et Syrah.\n📍 Position approximative." },
    { name:"Black Oystercatcher — Elim", kind:"vin", lat:-34.62600, lon:19.81500, date:"2026-10-01",
      notes:"Elim. Sauvignon Blanc de climat venté, restaurant sur le domaine.\n📍 Position approximative." },
    { name:"Boplaas — Calitzdorp", kind:"vin", lat:-33.53300, lon:21.68700, date:"2026-10-09",
      notes:"Capitale sud-africaine du porto. Dégustation le matin du départ vers Montagu.\n📍 Position approximative." },
    { name:"Die Krans — Calitzdorp", kind:"vin", lat:-33.52500, lon:21.69200, date:"2026-10-09",
      notes:"Porto de Calitzdorp, voisin de Boplaas.\n📍 Position approximative." },
    { name:"Graham Beck — Robertson", kind:"vin", lat:-33.79900, lon:19.84600, date:"2026-10-10",
      notes:"Vallée de Robertson. Les bulles MCC de référence. Dernière dégustation avant Le Cap.\n📍 Position approximative." },
    { name:"Springfield Estate — Robertson", kind:"vin", lat:-33.83900, lon:19.91500, date:"2026-10-10",
      notes:"Vallée de Robertson.\n📍 Position approximative." },
    { name:"De Wetshof — Robertson", kind:"vin", lat:-33.87100, lon:20.00000, date:"2026-10-10",
      notes:"Vallée de Robertson, grande maison du Chardonnay.\n📍 Position approximative." },

    // ---- Semaine 2 — à réserver ----
    { name:"Gondwana Game Reserve — safari", kind:"hotel", lat:-34.08042, lon:21.91110, date:"2026-10-02",
      notes:"+27 44 333 0200\nUNE nuit, pas plus. Réserve privée sans paludisme, Big Five dans le fynbos.\nDrive de l'après-midi + drive du matin.\n⚠️ À RÉSERVER" },
    { name:"Knysna", kind:"etape", lat:-34.07870, lon:23.06250, date:"2026-10-03",
      notes:"2 nuits. Lagune, les Heads, huîtres au port, Featherbed en bateau, forêt ancienne.\n⚠️ HÉBERGEMENT À RÉSERVER" },
    { name:"Plettenberg Bay", kind:"etape", lat:-34.05940, lon:23.37830, date:"2026-10-05",
      notes:"2 nuits. Point de demi-tour.\nRando de Robberg, plages, baleines et dauphins en bateau.\nTsitsikamma (pont de Storms River) en excursion.\n⚠️ HÉBERGEMENT À RÉSERVER" },
    { name:"Oudtshoorn — Klein Karoo", kind:"etape", lat:-33.59060, lon:22.20140, date:"2026-10-07",
      notes:"2 nuits. Retour par l'intérieur via l'Outeniqua Pass.\nAutruches, suricates à l'aube.\n⚠️ HÉBERGEMENT À RÉSERVER" },
    { name:"Grottes de Cango", kind:"site", lat:-33.39250, lon:22.21470, date:"2026-10-07",
      notes:"À 30 min d'Oudtshoorn. Réserver le créneau de visite." },
    { name:"Col du Swartberg", kind:"site", lat:-33.35000, lon:22.03330, date:"2026-10-08",
      notes:"Col de gravier de 1583 m, un des plus beaux du monde. Praticable en voiture de tourisme par temps sec.\nDescente sur Prince Albert de l'autre côté." },
    { name:"Prince Albert", kind:"site", lat:-33.22640, lon:22.02810, date:"2026-10-08",
      notes:"Village du Grand Karoo au pied du Swartberg. Architecture cape dutch, figues et olives." },
    { name:"Calitzdorp", kind:"site", lat:-33.52970, lon:21.68860, date:"2026-10-08",
      notes:"Capitale sud-africaine du porto. Dégustation sur la Route 62." },
    { name:"Montagu — Route 62", kind:"etape", lat:-33.78660, lon:20.12160, date:"2026-10-09",
      notes:"Dernière étape avant le retour au Cap. Sources chaudes, passe de Cogmanskloof.\n⚠️ HÉBERGEMENT À RÉSERVER" },
    { name:"Retour Le Cap", kind:"etape", lat:-33.92490, lon:18.42410, date:"2026-10-10",
      notes:"Retour obligatoire au Cap (pas d'open-jaw). Restitution du véhicule Hertz." }
  ]
};

/* ==================================================================
   Stockage
   - localStorage : le dossier de voyage (léger, texte)
   - IndexedDB    : les photos (vignettes JPEG), qui feraient exploser
                    le quota de localStorage
   ================================================================== */

/* Plusieurs voyages depuis le 21 sept. 2026.
   - `bthx.index.v2`       : { current, trips:[{id,name,start,end}] }
   - `bthx.trip.v2.<id>`   : un voyage complet
   L'ancien emplacement unique `bthx.trip.v1` est repris au premier
   lancement : le voyage déjà saisi devient le premier de la liste. */
const LS_OLD   = 'bthx.trip.v1';
const LS_INDEX = 'bthx.index.v2';
const LS_TRIP  = 'bthx.trip.v2.';

const Store = {
  _uid(){ return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); },
  blank(name){
    return { id:this._uid(), name:name||'Nouveau voyage', start:'', end:'', sites:[], days:[] };
  },
  _read(k){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):null; }catch(e){ return null; } },
  /* Le voyage passe avant le cache des routes : si la mémoire est pleine,
     on vide les tracés (ils se recalculent) et on réessaie. */
  _write(k,v){
    const txt = JSON.stringify(v);
    try{ localStorage.setItem(k, txt); return true; }
    catch(e){
      RouteCache.purge();
      try{ localStorage.setItem(k, txt); return true; }
      catch(e2){ console.warn('save',e2); return false; }
    }
  },

  index(){
    let idx = this._read(LS_INDEX);
    if(idx && Array.isArray(idx.trips)) return idx;
    idx = { current:null, trips:[] };
    const old = this._read(LS_OLD);                    // migration v1 -> v2
    if(old){
      old.id = old.id || this._uid();
      if(this._write(LS_TRIP+old.id, old)){
        idx.trips.push(this._meta(old)); idx.current = old.id;
        try{ localStorage.removeItem(LS_OLD); }catch(e){}
      }
    }
    this._write(LS_INDEX, idx);
    return idx;
  },
  _meta(t){ return { id:t.id, name:t.name||'Nouveau voyage', start:t.start||'', end:t.end||'' }; },

  list(){ return this.index().trips; },
  load(id){
    const t = this._read(LS_TRIP+id);
    if(!t) return null;
    t.id = id; t.sites = t.sites||[]; t.days = t.days||[];
    return t;
  },
  /* Le voyage ouvert. Il y en a toujours un : on le crée au besoin. */
  current(){
    const idx = this.index();
    let t = idx.current ? this.load(idx.current) : null;
    if(!t && idx.trips.length) t = this.load(idx.trips[0].id);
    if(!t){ t = this.blank(); this.save(t); }
    this.setCurrent(t.id);
    return t;
  },
  setCurrent(id){ const idx=this.index(); idx.current=id; this._write(LS_INDEX, idx); },
  save(trip){
    if(!trip.id) trip.id = this._uid();
    if(!this._write(LS_TRIP+trip.id, trip)) return false; // quota — l'appelant prévient
    const idx = this.index();
    const i = idx.trips.findIndex(x=>x.id===trip.id);
    if(i<0) idx.trips.push(this._meta(trip)); else idx.trips[i] = this._meta(trip);
    return this._write(LS_INDEX, idx);
  },
  create(name){
    const t = this.blank(name);
    if(!this.save(t)) return null;          // mémoire pleine : l'appelant prévient
    this.setCurrent(t.id);
    return t;
  },
  remove(id){
    try{ localStorage.removeItem(LS_TRIP+id); }catch(e){}
    const idx = this.index();
    idx.trips = idx.trips.filter(x=>x.id!==id);
    if(idx.current===id) idx.current = idx.trips.length ? idx.trips[0].id : null;
    this._write(LS_INDEX, idx);
  }
};

/* Les photos d'un voyage : c'est ce qui borne une sauvegarde ou une suppression. */
function tripPhotoIds(t){
  const ids = new Set();
  (t.days||[]).forEach(d=>(d.photos||[]).forEach(p=>ids.add(p)));
  return [...ids];
}

/* ---- IndexedDB pour les images ---- */
const Photos = (() => {
  const DB='bthx-photos', STORE='img'; let dbp=null;

  function open(){
    if(dbp) return dbp;
    dbp = new Promise((res,rej)=>{
      const r = indexedDB.open(DB,1);
      r.onupgradeneeded = ()=>{
        const db = r.result;
        if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      r.onsuccess = ()=>res(r.result);
      r.onerror  = ()=>rej(r.error);
    });
    return dbp;
  }
  async function tx(mode){
    const db = await open();
    return db.transaction(STORE, mode).objectStore(STORE);
  }
  return {
    async put(id, blob){
      const s = await tx('readwrite');
      return new Promise((res,rej)=>{ const r=s.put(blob,id); r.onsuccess=()=>res(); r.onerror=()=>rej(r.error); });
    },
    async get(id){
      const s = await tx('readonly');
      return new Promise((res)=>{ const r=s.get(id); r.onsuccess=()=>res(r.result||null); r.onerror=()=>res(null); });
    },
    async del(id){
      const s = await tx('readwrite');
      return new Promise((res)=>{ const r=s.delete(id); r.onsuccess=()=>res(); r.onerror=()=>res(); });
    },
    async clear(){
      const s = await tx('readwrite');
      return new Promise((res)=>{ const r=s.clear(); r.onsuccess=()=>res(); r.onerror=()=>res(); });
    },
    async keys(){
      const s = await tx('readonly');
      return new Promise((res)=>{ const r=s.getAllKeys(); r.onsuccess=()=>res(r.result||[]); r.onerror=()=>res([]); });
    }
  };
})();

/* ---- Cache des itinéraires routiers (OSRM) ----
   Indispensable hors ligne : une fois un segment calculé, il ne
   redemande plus rien au réseau. */
const RouteCache = {
  PREFIX: 'bthx.route.',
  key(a,b){ return `${a.lat.toFixed(4)},${a.lon.toFixed(4)}>${b.lat.toFixed(4)},${b.lon.toFixed(4)}`; },
  get(a,b){
    try{ const v = localStorage.getItem(this.PREFIX+this.key(a,b)); return v?JSON.parse(v):null; }
    catch(e){ return null; }
  },
  /* Un tracé OSRM complet compte des milliers de points : dix segments
     longs suffisaient à saturer les 5 Mo de l'iPhone. On arrondit au mètre
     et on ne garde qu'un point tous les 40 m environ — invisible à l'écran. */
  compact(val){
    const c = val.coords || [];
    const out = [];
    let last = null;
    c.forEach((p,i)=>{
      const q = [Math.round(p[0]*1e5)/1e5, Math.round(p[1]*1e5)/1e5];
      if(!last || i===c.length-1 || Math.abs(q[0]-last[0])+Math.abs(q[1]-last[1]) > 0.0004){ out.push(q); last = q; }
    });
    return Object.assign({}, val, {coords: out});
  },
  set(a,b,val){
    const txt = JSON.stringify(this.compact(val));
    try{ localStorage.setItem(this.PREFIX+this.key(a,b), txt); }
    catch(e){ this.purge(); try{ localStorage.setItem(this.PREFIX+this.key(a,b), txt); }catch(e2){} }
  },
  purge(){
    try{
      const ks = [];
      for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k && k.startsWith(this.PREFIX)) ks.push(k); }
      ks.forEach(k=>localStorage.removeItem(k));
      return ks.length;
    }catch(e){ return 0; }
  }
};
