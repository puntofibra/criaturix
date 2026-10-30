/* =========================================================
   CRIATURIX · Futurmovil — datos del juego
   (este mismo archivo se usa en el navegador y en Apps Script como Datos.gs)
   ========================================================= */
var CX = (function () {
  'use strict';

  /* ---------- clases ----------
     Ventaja: grupo 0 (Plasma, Voltio) > grupo 1 (Bio, Cromo) > grupo 2 (Cuántico, Sombra) > grupo 0 */
  var CLASES = {
    plasma:   { nom: 'Plasma',   col: '#ff4d2e', col2: '#ffb02e', grupo: 0, base: { hp: 31, vel: 35, hab: 31, mor: 43 }, bono: { vel: 1, mor: 3 } },
    voltio:   { nom: 'Voltio',   col: '#ffe03a', col2: '#fff6a8', grupo: 0, base: { hp: 27, vel: 43, hab: 35, mor: 35 }, bono: { vel: 3, mor: 1 } },
    bio:      { nom: 'Bio',      col: '#19ff6a', col2: '#b6ff3a', grupo: 1, base: { hp: 43, vel: 31, hab: 31, mor: 35 }, bono: { hp: 3, mor: 1 } },
    cromo:    { nom: 'Cromo',    col: '#9fc2e0', col2: '#eef6ff', grupo: 1, base: { hp: 39, vel: 35, hab: 31, mor: 35 }, bono: { hp: 3, vel: 1 } },
    cuantico: { nom: 'Cuántico', col: '#00e5ff', col2: '#8af9ff', grupo: 2, base: { hp: 39, vel: 39, hab: 35, mor: 27 }, bono: { hp: 1, vel: 3 } },
    sombra:   { nom: 'Sombra',   col: '#b14bff', col2: '#ff4fd8', grupo: 2, base: { hp: 35, vel: 31, hab: 35, mor: 39 }, bono: { hp: 1, mor: 3 } }
  };
  var LISTA_CLASES = ['plasma', 'voltio', 'bio', 'cromo', 'cuantico', 'sombra'];
  var SLOTS = ['ojos', 'antenas', 'boca', 'cuerno', 'espalda', 'cola'];
  var SLOTS_CARTA = ['boca', 'cuerno', 'espalda', 'cola'];
  var NOM_SLOT = { ojos: 'Ojos', antenas: 'Antenas', boca: 'Boca', cuerno: 'Cuerno', espalda: 'Espalda', cola: 'Cola' };

  /* ---------- nombres de las piezas sin carta ---------- */
  var PIEZAS = {
    ojos: {
      plasma: ['Visor Brasa', 'Ojos Ascua'], voltio: ['Visor Rayo', 'Ojos Chispa'], bio: ['Ojos Brote', 'Visor Clorofila'],
      cromo: ['Ojos Remache', 'Visor Acero'], cuantico: ['Ojos Prisma', 'Visor Qubit'], sombra: ['Ojos Eclipse', 'Visor Umbra']
    },
    antenas: {
      plasma: ['Antenas Llama', 'Antenas Mecha'], voltio: ['Antenas Bobina', 'Antenas Tesla'], bio: ['Antenas Hoja', 'Antenas Musgo'],
      cromo: ['Antenas Perno', 'Antenas Radar'], cuantico: ['Antenas Cristal', 'Antenas Onda'], sombra: ['Antenas Asta', 'Antenas Niebla']
    }
  };

  /* ---------- cartas (una por pieza de boca, cuerno, espalda y cola) ----------
     c = energía, a = ataque, e = escudo, f = efecto, x = valor del efecto, o = objetivo (cerca | atras | debil | yo | equipo) */
  function K(n, c, a, e, f, x, o) { return { n: n, c: c, a: a, e: e, f: f || '', x: x || 0, o: o || 'cerca' }; }
  var CARTAS = {
    boca: {
      plasma:   [K('Mordida Ígnea', 1, 110, 0), K('Escupefuego', 1, 75, 0, 'corrosion', 2)],
      voltio:   [K('Chispazo', 1, 85, 0, 'aturde'), K('Pitido Sónico', 1, 85, 0, 'rapido')],
      bio:      [K('Mordisco Savia', 1, 90, 0, 'drenaje'), K('Brote Bucal', 1, 0, 0, 'cura', 130, 'yo')],
      cromo:    [K('Mandíbula Hierro', 1, 95, 30), K('Triturador', 1, 90, 0, 'antiEsc')],
      cuantico: [K('Rayo Qubit', 1, 90, 0, 'expuesto'), K('Eco Cuántico', 0, 45, 0, 'robar', 1)],
      sombra:   [K('Susurro Umbra', 1, 60, 0, 'miedo'), K('Colmillo Nocturno', 1, 100, 0, 'remata')]
    },
    cuerno: {
      plasma:   [K('Cuerno Magma', 1, 125, 0), K('Pico Brasa', 1, 95, 0, 'atkMas')],
      voltio:   [K('Pararrayos', 1, 85, 45), K('Lanza Voltio', 1, 100, 0, 'combo')],
      bio:      [K('Espina Rosal', 1, 75, 60), K('Bellota Blindada', 1, 40, 105)],
      cromo:    [K('Taladro', 1, 110, 20), K('Ariete', 2, 175, 50, 'atkMenos')],
      cuantico: [K('Fractal', 1, 80, 55), K('Punta Prisma', 1, 90, 0, 'velMenos')],
      sombra:   [K('Asta Venenosa', 1, 60, 0, 'corrosion', 3), K('Cuerno Eclipse', 1, 95, 0, '', 0, 'debil')]
    },
    espalda: {
      plasma:   [K('Turbina Ígnea', 1, 110, 0, '', 0, 'atras'), K('Escudo Lava', 1, 55, 90)],
      voltio:   [K('Batería Extra', 0, 0, 0, 'energia', 1, 'yo'), K('Alas Dínamo', 1, 95, 0, 'velMas')],
      bio:      [K('Panel Solar', 1, 0, 0, 'curaEq', 70, 'equipo'), K('Caparazón Musgo', 1, 40, 125)],
      cromo:    [K('Coraza Titanio', 1, 50, 130), K('Cañones Gemelos', 1, 55, 0, 'multi', 2)],
      cuantico: [K('Núcleo Espejo', 1, 60, 60, 'robar', 1), K('Campo Estático', 1, 0, 0, 'escudoEq', 65, 'equipo')],
      sombra:   [K('Capa Sombría', 1, 70, 75), K('Drenador', 1, 75, 0, 'quitaEn', 1)]
    },
    cola: {
      plasma:   [K('Cola Cometa', 1, 100, 0, 'rapido'), K('Látigo Ascua', 1, 85, 0, 'corrosion', 1)],
      voltio:   [K('Cable Cargado', 1, 80, 0, 'expuesto'), K('Cola Relámpago', 1, 105, 0, '', 0, 'atras')],
      bio:      [K('Cola Raíz', 1, 70, 50, 'cura', 40), K('Liana', 1, 90, 0, 'velMenos')],
      cromo:    [K('Cola Muelle', 1, 95, 25), K('Maza', 1, 105, 0, 'atkMenos')],
      cuantico: [K('Cola Bucle', 0, 55, 0), K('Hélice Cuántica', 1, 85, 0, 'combo')],
      sombra:   [K('Aguijón', 1, 95, 0, 'remata'), K('Cola Espectro', 1, 75, 0, 'corrosion', 2, 'atras')]
    }
  };

  var EFECTOS = {
    corrosion: function (x) { return 'Aplica ' + x + ' de corrosión (pierde ' + (x * 8) + ' PV por ronda, se acumula)'; },
    aturde: function () { return 'Aturde: su próximo ataque falla y el siguiente golpe que reciba atraviesa su escudo'; },
    miedo: function () { return 'Miedo: el objetivo no podrá atacar la próxima ronda'; },
    atkMas: function () { return 'Su próximo ataque hace +25 % de daño'; },
    atkMenos: function () { return 'El próximo ataque del objetivo hace -25 % de daño'; },
    velMas: function () { return '+25 % de velocidad durante 2 rondas'; },
    velMenos: function () { return 'El objetivo pierde 25 % de velocidad durante 2 rondas'; },
    cura: function (x) { return 'Se cura ' + x + ' PV'; },
    curaEq: function (x) { return 'Cura ' + x + ' PV a todo el equipo'; },
    robar: function (x) { return 'Robas ' + x + ' carta' + (x > 1 ? 's' : ''); },
    energia: function (x) { return 'Ganas ' + x + ' de energía'; },
    quitaEn: function (x) { return 'El rival pierde ' + x + ' de energía'; },
    expuesto: function () { return 'Expone al objetivo: el siguiente golpe que reciba hace +30 %'; },
    multi: function (x) { return 'Golpea ' + x + ' veces'; },
    drenaje: function () { return 'Se cura la mitad del daño que hace'; },
    combo: function () { return '+40 % de daño si esta criatura juega 2 cartas o más en la ronda'; },
    rapido: function () { return '+30 % de daño si es más rápida que el objetivo'; },
    escudoEq: function (x) { return 'Da ' + x + ' de escudo a todo el equipo'; },
    remata: function () { return '+50 % de daño si al objetivo le queda menos del 40 % de vida'; },
    antiEsc: function () { return 'Hace el doble de daño a los escudos'; }
  };
  var NOM_OBJ = { cerca: '', atras: 'Ataca a la criatura de más atrás', debil: 'Ataca a la criatura con menos vida', yo: '', equipo: '' };

  /* ---------- genes ----------
     genes = { c: clase del cuerpo, col: 0-3 (tono), p: { slot: [D, R1, R2] } }   cada gen = 'clase' + variante, p. ej. 'voltio1' */
  function parteGen(g) { var m = /^([a-z]+)([01])$/.exec(String(g || '')); return m && CLASES[m[1]] ? { c: m[1], v: Number(m[2]) } : { c: 'cromo', v: 0 }; }
  function nombreParte(slot, g) {
    var p = parteGen(g);
    if (PIEZAS[slot]) return PIEZAS[slot][p.c][p.v];
    return CARTAS[slot][p.c][p.v].n;
  }
  function carta(slot, g) {
    var p = parteGen(g), k = CARTAS[slot][p.c][p.v];
    return { id: slot + ':' + g, slot: slot, clase: p.c, n: k.n, c: k.c, a: k.a, e: k.e, f: k.f, x: k.x, o: k.o };
  }
  function textoCarta(k) {
    var t = [];
    if (k.f && EFECTOS[k.f]) t.push(EFECTOS[k.f](k.x));
    if (NOM_OBJ[k.o]) t.push(NOM_OBJ[k.o]);
    return t.join('. ');
  }
  function cartasDe(genes) { return SLOTS_CARTA.map(function (s) { return carta(s, genes.p[s][0]); }); }

  function stats(genes) {
    var b = CLASES[genes.c].base, s = { hp: b.hp, vel: b.vel, hab: b.hab, mor: b.mor };
    SLOTS.forEach(function (sl) {
      var bo = CLASES[parteGen(genes.p[sl][0]).c].bono;
      for (var k in bo) s[k] += bo[k];
    });
    s.pv = s.hp * 6 + 150;
    return s;
  }
  function pureza(genes) {
    var n = 0; SLOTS.forEach(function (sl) { if (parteGen(genes.p[sl][0]).c === genes.c) n++; }); return n;
  }
  function ventaja(atk, def) {
    var a = CLASES[atk].grupo, d = CLASES[def].grupo;
    if ((a + 1) % 3 === d) return 1.15;
    if ((d + 1) % 3 === a) return 0.85;
    return 1;
  }

  /* números aleatorios: si se pasa una semilla, siempre salen igual */
  function rng(semilla) {
    if (semilla == null) return Math.random;
    var a = semilla >>> 0;
    return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function elige(r, a) { return a[Math.floor(r() * a.length)]; }
  function genAzar(r, clase) { return (clase || elige(r, LISTA_CLASES)) + (r() < 0.5 ? 0 : 1); }

  /* criatura aleatoria; puro = probabilidad de que cada pieza sea de su clase */
  function genesAzar(semilla, clase, puro) {
    var r = rng(semilla), c = clase || elige(r, LISTA_CLASES), pu = puro == null ? 0.45 : puro, p = {};
    SLOTS.forEach(function (sl) {
      p[sl] = [0, 1, 2].map(function () { return genAzar(r, r() < pu ? c : null); });
    });
    return { c: c, col: Math.floor(r() * 4), p: p };
  }

  /* cría al estilo Axie: cada padre aporta D 37,5 %, R1 9,375 %, R2 3,125 % */
  function cruzar(a, b, semilla) {
    var r = rng(semilla), p = {};
    function uno() {
      var x = r(), padre = x < 0.5 ? a : b; x = (x % 0.5) * 2;
      return function (sl) { var g = padre.p[sl]; return x < 0.75 ? g[0] : x < 0.9375 ? g[1] : g[2]; };
    }
    SLOTS.forEach(function (sl) {
      var gen = [uno()(sl), uno()(sl), uno()(sl)];
      if (r() < 0.02) gen[0] = genAzar(r);          // mutación
      p[sl] = gen;
    });
    return { c: r() < 0.5 ? a.c : b.c, col: r() < 0.08 ? Math.floor(r() * 4) : (r() < 0.5 ? a.col : b.col), p: p };
  }
  /* probabilidad de cada pieza dominante en la cría (para enseñarla antes de criar) */
  function probCria(a, b) {
    var out = {};
    SLOTS.forEach(function (sl) {
      var m = {};
      [a, b].forEach(function (pa) { [0.375, 0.09375, 0.03125].forEach(function (w, i) { var g = pa.p[sl][i]; m[g] = (m[g] || 0) + w; }); });
      out[sl] = Object.keys(m).map(function (g) { return { g: g, n: nombreParte(sl, g), p: m[g] }; }).sort(function (x, y) { return y.p - x.p; });
    });
    return out;
  }
  function validaGenes(g) {
    if (!g || !CLASES[g.c] || !g.p) return false;
    for (var i = 0; i < SLOTS.length; i++) {
      var a = g.p[SLOTS[i]]; if (!a || a.length !== 3) return false;
      for (var j = 0; j < 3; j++) if (!/^([a-z]+)([01])$/.test(a[j]) || !CLASES[a[j].replace(/[01]$/, '')]) return false;
    }
    return g.col >= 0 && g.col <= 3;
  }

  /* reglas por defecto (el admin las cambia en Ajustes) */
  var REGLAS = {
    costeCria: [100, 150, 250, 400, 600, 900, 1300],   // chips por cría de cada padre según sus crías previas
    maxCrias: 7,
    horasEclosion: 24,
    comision: 50,             // % que recibe el vendedor en créditos
    energiaDia: 20,           // combates con premio al día
    chipsInicio: 200,
    pvpGana: 18,              // chips por victoria en arena
    etapas: 30,
    reservaHoras: 48
  };

  /* etapas de la aventura: siempre los mismos rivales para cada etapa */
  var ZONAS = ['Chatarrería Neón', 'Bosque de Silicio', 'Fundición Roja', 'Red Cuántica', 'Ciudad Sombra', 'Núcleo 5G'];
  function etapa(n) {
    var jefe = n % 5 === 0, eq = [];
    for (var i = 0; i < 3; i++) eq.push(genesAzar(n * 1000 + i * 17, null, Math.min(0.95, 0.25 + n * 0.025 + (jefe ? 0.3 : 0))));
    return { n: n, zona: ZONAS[Math.min(ZONAS.length - 1, Math.floor((n - 1) / 5))], jefe: jefe,
      mult: Math.round((0.78 + 0.028 * (n - 1) + (jefe ? 0.12 : 0)) * 1000) / 1000, eq: eq };
  }

  return {
    etapa: etapa, ZONAS: ZONAS,
    CLASES: CLASES, LISTA_CLASES: LISTA_CLASES, SLOTS: SLOTS, SLOTS_CARTA: SLOTS_CARTA, NOM_SLOT: NOM_SLOT, CARTAS: CARTAS, EFECTOS: EFECTOS,
    parteGen: parteGen, nombreParte: nombreParte, carta: carta, cartasDe: cartasDe, textoCarta: textoCarta, stats: stats, pureza: pureza, ventaja: ventaja,
    rng: rng, genesAzar: genesAzar, cruzar: cruzar, probCria: probCria, validaGenes: validaGenes, REGLAS: REGLAS
  };
})();
