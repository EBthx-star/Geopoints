/* BTHX Travel — lecture des confirmations de réservation.
   ------------------------------------------------------------------
   Ni Air France ni Booking n'exposent d'API « mes réservations », et une
   page web n'a pas le droit d'interroger leurs sites. La voie robuste est
   donc le texte du mail de confirmation, collé ici.

   Ce module ne prétend pas tout comprendre : il propose ce qu'il a
   reconnu, et l'utilisateur corrige avant d'ajouter. Le texte collé est
   conservé en note, pour que rien ne se perde même si l'analyse rate.
*/

const Confirm = (() => {

  const MOIS = {
    'janvier':1,'février':2,'fevrier':2,'mars':3,'avril':4,'mai':5,'juin':6,
    'juillet':7,'août':8,'aout':8,'septembre':9,'octobre':10,'novembre':11,'décembre':12,'decembre':12,
    'jan':1,'feb':2,'fév':2,'mar':3,'apr':4,'avr':4,'may':5,'jun':6,'jul':7,
    'aug':8,'sep':9,'sept':9,'oct':10,'nov':11,'dec':12,'déc':12
  };

  // Aéroports utiles : ceux du voyage et les grandes plateformes.
  const AEROPORTS = {
    CDG:{v:'Paris Charles-de-Gaulle', lat:49.0097, lon:2.5479},
    ORY:{v:'Paris Orly',              lat:48.7233, lon:2.3794},
    CPT:{v:'Le Cap',                  lat:-33.9715, lon:18.6021},
    JNB:{v:'Johannesburg',            lat:-26.1392, lon:28.2460},
    AMS:{v:'Amsterdam',               lat:52.3105, lon:4.7683},
    DUR:{v:'Durban',                  lat:-29.6144, lon:31.1197},
    PLZ:{v:'Gqeberha',                lat:-33.9849, lon:25.6173},
    GRJ:{v:'George',                  lat:-34.0056, lon:22.3789}
  };

  /* ---------- Dates ---------- */
  // Reconnaît « 22 septembre 2026 », « 22/09/2026 », « 2026-09-22 », « 22 Sep 2026 »
  function findDates(text){
    const out = [];
    const annee = new Date().getFullYear();

    let re = /(\d{1,2})\s+([a-zéûôA-ZÉÛÔ]{3,10})\.?\s*(\d{4})?/g, m;
    while((m = re.exec(text))){
      const mois = MOIS[m[2].toLowerCase()];
      if(!mois) continue;
      out.push({ iso: iso(+(m[3]||annee), mois, +m[1]), at: m.index });
    }

    re = /(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})/g;
    while((m = re.exec(text))) out.push({ iso: iso(+m[3], +m[2], +m[1]), at: m.index });

    re = /(\d{4})-(\d{2})-(\d{2})/g;
    while((m = re.exec(text))) out.push({ iso: `${m[1]}-${m[2]}-${m[3]}`, at: m.index });

    out.sort((a,b)=>a.at-b.at);
    return out;
  }
  const iso = (y,m,d) => `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  function findTimes(text){
    const out = [];
    const re = /\b(\d{1,2})\s*[h:]\s*(\d{2})\b/g; let m;
    while((m = re.exec(text))){
      const h = +m[1];
      if(h <= 23) out.push({ t:`${String(h).padStart(2,'0')}h${m[2]}`, at:m.index });
    }
    return out;
  }

  /* ---------- Vols ---------- */
  function parseFlights(text){
    const vols = [];
    const re = /\b(AF|KL|SA|BA|LH|EK|QR|TK)\s?-?\s?(\d{2,4})\b/g; let m;
    const vus = new Set();
    while((m = re.exec(text))){
      const num = `${m[1]}${m[2].padStart(3,'0')}`;
      if(vus.has(num)) continue;
      vus.add(num);
      vols.push({ num, at: m.index });
    }
    if(!vols.length) return [];

    const codes = [];
    const rc = /\b([A-Z]{3})\b/g;
    while((m = rc.exec(text))) if(AEROPORTS[m[1]]) codes.push({ c:m[1], at:m.index });

    const dates = findDates(text);
    const heures = findTimes(text);
    const ref = findRef(text);

    return vols.map((v, i) => {
      // Les aéroports d'un vol sont écrits APRÈS son numéro, et avant le vol
      // suivant : sans cette borne, le retour héritait des escales de l'aller.
      const fin = vols[i+1] ? vols[i+1].at : Infinity;
      const suite = codes.filter(c => c.at > v.at && c.at < fin && c.at - v.at < 400)
                         .sort((a,b) => a.at - b.at);
      const dep = suite[0] || null;
      const arr = suite[1] || null;
      const d   = proche(dates, v.at, 600);
      const h   = proche(heures, v.at, 400);
      // On situe l'étape à l'arrivée : c'est là qu'on se trouve ensuite.
      const a   = arr ? AEROPORTS[arr.c] : (dep ? AEROPORTS[dep.c] : null);

      let nom = 'Vol ' + v.num;
      if(dep && arr) nom += ` ${dep.c} → ${arr.c}`;
      else if(arr)   nom += ` → ${arr.c}`;

      const lignes = [];
      lignes.push(`Vol ${v.num}`);
      if(dep && arr) lignes.push(`${AEROPORTS[dep.c].v} → ${AEROPORTS[arr.c].v}`);
      if(h) lignes.push(`Départ ${h.t}`);
      if(ref) lignes.push(`Dossier ${ref}`);

      return {
        kind: 'etape',
        name: nom,
        date: d ? d.iso : '',
        lat: a ? a.lat : null,
        lon: a ? a.lon : null,
        notes: lignes.join('\n')
      };
    });
  }
  function proche(list, at, max){
    let best=null, bd=max;
    list.forEach(x => { const d = Math.abs(x.at - at); if(d < bd){ bd = d; best = x; } });
    return best;
  }

  /* ---------- Hébergements ---------- */
  function parseStay(text){
    const lignes = text.split('\n').map(l => l.trim()).filter(Boolean);

    // Le nom de l'hôtel suit en général un libellé, ou ouvre le message.
    let nom = '';
    const apres = /(?:votre réservation (?:à|au|chez)?|confirmation de votre séjour|réservation confirmée(?: à| au| chez)?)\s*:?\s*(.+)/i;
    for(const l of lignes){
      const m = l.match(apres);
      if(m && m[1].length > 2){ nom = m[1].trim(); break; }
    }
    if(!nom){
      const candidat = lignes.find(l =>
        /h[ôo]tel|guest\s?house|lodge|b&b|resort|villa|maison|riad|apartment|appartement/i.test(l) && l.length < 90);
      if(candidat) nom = candidat;
    }
    if(!nom) return null;
    nom = nom
      .replace(/^[-–•\s]+/, '')
      // « Blue Peter Hotel est confirmée » → « Blue Peter Hotel »
      .replace(/\s+(?:est|a été)\s+confirm[ée]e?\b.*$/i, '')
      .replace(/\s+is\s+confirmed\b.*$/i, '')
      .replace(/\s*[–—|]\s.*$/, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 80);

    // Arrivée et départ : on prend la date qui suit chaque libellé.
    const dates = findDates(text);
    const dateApres = (mots) => {
      const re = new RegExp(mots, 'i');
      const m = re.exec(text);
      if(!m) return '';
      const d = dates.find(x => x.at >= m.index && x.at - m.index < 120);
      return d ? d.iso : '';
    };
    const arrivee = dateApres('arriv[ée]e|check[-\\s]?in|d[ée]but du s[ée]jour');
    const depart  = dateApres('d[ée]part|check[-\\s]?out|fin du s[ée]jour');

    const tel = (text.match(/(\+\d[\d\s().-]{7,}\d)/) || [])[1];
    const ref = findRef(text);

    const lignesNote = [];
    if(tel) lignesNote.push(tel);
    if(arrivee && depart) lignesNote.push(`Du ${arrivee} au ${depart}`);
    if(ref) lignesNote.push(`Confirmation ${ref}`);

    return {
      kind: 'hotel',
      name: nom,
      date: arrivee || (dates[0] ? dates[0].iso : ''),
      lat: null, lon: null,
      notes: lignesNote.join('\n')
    };
  }

  function findRef(text){
    const re = /(?:dossier|r[ée]f[ée]rence|confirmation|booking number|r[ée]servation)\s*(?:n[°o]|n[ou]m[ée]ro)?\s*:?\s*([A-Z0-9]{6,12})\b/gi;
    let m;
    while((m = re.exec(text))){
      const ref = m[1].toUpperCase();
      // Une référence porte toujours au moins un chiffre : sans ce garde-fou,
      // un simple « Bonjour » après « réservation » passerait pour un dossier.
      if(/\d/.test(ref)) return ref;
    }
    return '';
  }

  /* ---------- Entrée publique ---------- */
  function analyse(text){
    if(!text || text.trim().length < 20) return [];
    const propositions = [];

    const vols = parseFlights(text);
    propositions.push(...vols);

    // On ne cherche un hébergement que si le texte y fait référence :
    // sinon un mail de vol produirait un faux hôtel.
    if(/h[ôo]tel|guest\s?house|lodge|booking|s[ée]jour|check[-\s]?in|nuit[s]?\b/i.test(text)){
      const stay = parseStay(text);
      if(stay) propositions.push(stay);
    }

    // Le texte intégral rejoint la première proposition : rien ne se perd.
    if(propositions.length){
      const extrait = text.trim().slice(0, 1200);
      propositions[0].notes = (propositions[0].notes ? propositions[0].notes + '\n\n' : '')
                            + '— Confirmation —\n' + extrait;
    }
    return propositions;
  }

  return { analyse, AEROPORTS };
})();
