/* =========================================================
   CRIATURIX · motor de combate por cartas (se ejecuta en el servidor: Motor.gs)
   Necesita CX (datos.js)
   ========================================================= */
var MOTOR = (function () {
  'use strict';
  var MAX_EN = 10, EN_INI = 3, EN_RONDA = 2, ROBA_INI = 6, ROBA_RONDA = 3, MAX_MANO = 12, MAX_RONDAS = 30, SUBITA = 10;

  function baraja(a, r) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* equipos: [[{id, nom, genes}, x3], [...]]; mult: multiplicador de fuerza de cada lado (aventura) */
  function crear(equipos, opts) {
    opts = opts || {};
    var B = { v: 1, ronda: 1, fin: '', uid: 0, lados: [] , modo: opts.modo || '', log: 0 };
    equipos.forEach(function (eq, l) {
      var m = (opts.mult && opts.mult[l]) || 1;
      var L = { nombre: (opts.nombres && opts.nombres[l]) || (l ? 'Rival' : 'Tú'), en: EN_INI, mazo: [], mano: [], desc: [], cr: [] };
      eq.forEach(function (c, p) {
        var s = CX.stats(c.genes), pv = Math.round(s.pv * m);
        L.cr.push({ id: c.id, nom: c.nom, genes: c.genes, clase: c.genes.c, pv: pv, pvMax: pv, vel: s.vel, hab: s.hab, mor: s.mor, m: m, esc: 0, vivo: true,
          est: { corr: 0, aturde: 0, roto: 0, miedo: 0, atkMas: 0, atkMenos: 0, velMas: 0, velMenos: 0, expuesto: 0 } });
        for (var s2 = 0; s2 < 4; s2++) for (var k = 0; k < 2; k++) L.mazo.push({ u: 'k' + (++B.uid), p: p, s: s2 });
      });
      baraja(L.mazo, Math.random);
      B.lados.push(L);
      robar(B, l, ROBA_INI);
    });
    return B;
  }
  function cartaDe(B, l, h) { var c = B.lados[l].cr[h.p]; return CX.carta(CX.SLOTS_CARTA[h.s], c.genes.p[CX.SLOTS_CARTA[h.s]][0]); }
  function robar(B, l, n) {
    var L = B.lados[l], hechas = 0;
    for (var i = 0; i < n; i++) {
      if (!L.mazo.length) { L.mazo = baraja(L.desc.filter(function (h) { return L.cr[h.p].vivo; }), Math.random); L.desc = []; }
      if (!L.mazo.length || L.mano.length >= MAX_MANO) break;
      var h = L.mazo.pop(); if (!L.cr[h.p].vivo) { i--; continue; }
      L.mano.push(h); hechas++;
    }
    return hechas;
  }
  function velEf(c) { var v = c.vel; if (c.est.velMas) v *= 1.25; if (c.est.velMenos) v *= 0.75; return v; }

  /* lo que ve cada jugador (su mano completa, del rival solo cuántas cartas tiene) */
  function vista(B, l) {
    function cr(c) { return { id: c.id, nom: c.nom, genes: c.genes, pv: c.pv, pvMax: c.pvMax, esc: c.esc, vivo: c.vivo, vel: Math.round(velEf(c)), est: c.est }; }
    var yo = B.lados[l], el = B.lados[1 - l];
    return {
      ronda: B.ronda, fin: B.fin,
      yo: { nombre: yo.nombre, en: yo.en, mazo: yo.mazo.length, cr: yo.cr.map(cr), mano: yo.mano.map(function (h) { var k = cartaDe(B, l, h); k.u = h.u; k.p = h.p; return k; }) },
      el: { nombre: el.nombre, en: el.en, mano: el.mano.length, cr: el.cr.map(cr) }
    };
  }

  /* comprueba y aplica la selección de cartas de un lado: jug = { p: [u, u...] } */
  function validar(B, l, jug) {
    var L = B.lados[l], gasto = 0, usadas = {}, out = [[], [], []];
    jug = jug || {};
    for (var p = 0; p < 3; p++) {
      var lista = jug[p] || [];
      if (!L.cr[p] || !L.cr[p].vivo) { if (lista.length) throw new Error('Esa criatura no puede jugar'); continue; }
      if (lista.length > 4) throw new Error('Máximo 4 cartas por criatura');
      lista.forEach(function (u) {
        if (usadas[u]) throw new Error('Carta repetida');
        var h = null; for (var i = 0; i < L.mano.length; i++) if (L.mano[i].u === u) h = L.mano[i];
        if (!h || h.p !== p) throw new Error('Esa carta no está en tu mano');
        usadas[u] = 1; gasto += cartaDe(B, l, h).c; out[p].push(h);
      });
    }
    if (gasto > L.en) throw new Error('No tienes energía suficiente');
    L.en -= gasto;
    L.mano = L.mano.filter(function (h) { return !usadas[h.u]; });
    out.forEach(function (a) { a.forEach(function (h) { L.desc.push(h); }); });
    return out;
  }

  /* IA: elige cartas de forma voraz con algo de picardía */
  function ia(B, l, nivel) {
    var L = B.lados[l], E = B.lados[1 - l], en = L.en, por = [0, 0, 0], jug = {};
    var obj = E.cr.filter(function (c) { return c.vivo; })[0];
    var op = L.mano.map(function (h) {
      var k = cartaDe(B, l, h), c = L.cr[h.p];
      var v = (obj ? CX.ventaja(k.clase, obj.clase) : 1) * k.a * (k.clase === c.clase ? 1.1 : 1) + k.e * (c.pv < c.pvMax * 0.5 ? 1 : 0.55);
      if (k.f) v += k.f === 'cura' || k.f === 'curaEq' ? (c.pv < c.pvMax * 0.6 ? 90 : 10) : k.f === 'miedo' || k.f === 'aturde' ? 55 : 35;
      v *= 0.8 + Math.random() * 0.4 * (nivel || 1);
      return { h: h, k: k, v: v / Math.max(0.6, k.c) };
    }).sort(function (a, b) { return b.v - a.v; });
    op.forEach(function (o) {
      if (o.k.c > en || por[o.h.p] >= 4 || !L.cr[o.h.p].vivo) return;
      en -= o.k.c; por[o.h.p]++; (jug[o.h.p] = jug[o.h.p] || []).push(o.h.u);
    });
    return jug;
  }

  function vivos(L) { return L.cr.filter(function (c) { return c.vivo; }); }
  function objetivo(L, tipo) {
    var v = L.cr.map(function (c, i) { return { c: c, i: i }; }).filter(function (o) { return o.c.vivo; });
    if (!v.length) return null;
    if (tipo === 'atras') return v[v.length - 1];
    if (tipo === 'debil') return v.slice().sort(function (a, b) { return a.c.pv - b.c.pv; })[0];
    return v[0];
  }
  function quitarMano(L, p) { L.mano = L.mano.filter(function (h) { return h.p !== p; }); }

  /* juega una ronda completa: devuelve la lista de eventos para animar */
  function ronda(B, jug0, jug1) {
    if (B.fin) throw new Error('El combate ha terminado');
    var sel = [validar(B, 0, jug0), validar(B, 1, jug1)], ev = [];
    // 1. cartas jugadas y escudos
    [0, 1].forEach(function (l) {
      var L = B.lados[l];
      sel[l].forEach(function (lista, p) {
        if (!lista.length) return;
        var c = L.cr[p], ks = lista.map(function (h) { return cartaDe(B, l, h); });
        ev.push({ t: 'juega', l: l, p: p, k: ks.map(function (k) { return { n: k.n, clase: k.clase, slot: k.slot, c: k.c, a: k.a, e: k.e, f: k.f, x: k.x }; }) });
        ks.forEach(function (k) {
          if (k.e) { c.esc += Math.round(k.e * c.m); ev.push({ t: 'esc', l: l, p: p, v: Math.round(k.e * c.m), esc: c.esc }); }
          if (k.f === 'escudoEq') L.cr.forEach(function (a, i) { if (a.vivo) { a.esc += Math.round(k.x * c.m); ev.push({ t: 'esc', l: l, p: i, v: Math.round(k.x * c.m), esc: a.esc }); } });
        });
      });
    });
    // 2. orden por velocidad
    var orden = [];
    [0, 1].forEach(function (l) { sel[l].forEach(function (lista, p) { if (lista.length) orden.push({ l: l, p: p, lista: lista, r: Math.random() }); }); });
    orden.sort(function (a, b) {
      var A = B.lados[a.l].cr[a.p], C = B.lados[b.l].cr[b.p];
      return velEf(C) - velEf(A) || A.pv - C.pv || a.r - b.r;
    });
    // 3. acciones
    for (var oi = 0; oi < orden.length && !B.fin; oi++) {
      var o = orden[oi], L = B.lados[o.l], E = B.lados[1 - o.l], c = L.cr[o.p];
      if (!c.vivo) continue;
      var nCartas = o.lista.length;
      for (var ci = 0; ci < o.lista.length; ci++) {
        if (!c.vivo || !vivos(E).length) break;
        var k = cartaDe(B, o.l, o.lista[ci]);
        if (k.a > 0) {
          var t = objetivo(E, k.o); if (!t) break;
          if (c.est.miedo === B.ronda) { ev.push({ t: 'falla', l: o.l, p: o.p, por: 'miedo', k: k.n }); continue; }
          if (c.est.aturde) { c.est.aturde = 0; ev.push({ t: 'falla', l: o.l, p: o.p, por: 'aturdido', k: k.n }); continue; }
          var golpes = k.f === 'multi' ? k.x : 1;
          for (var g = 0; g < golpes && t.c.vivo; g++) golpe(B, ev, o.l, o.p, c, 1 - o.l, t, k, nCartas);
          // efectos sobre el objetivo
          if (t.c.vivo) {
            var te = t.c.est, efe = null;
            if (k.f === 'corrosion') { te.corr = Math.min(12, te.corr + k.x); efe = 'corrosion'; }
            if (k.f === 'aturde') { te.aturde = 1; te.roto = 1; efe = 'aturdido'; }
            if (k.f === 'miedo') { te.miedo = B.ronda + 1; efe = 'miedo'; }
            if (k.f === 'atkMenos') { te.atkMenos = 1; efe = 'debilitado'; }
            if (k.f === 'velMenos') { te.velMenos = 2; efe = 'lento'; }
            if (k.f === 'expuesto') { te.expuesto = 1; efe = 'expuesto'; }
            if (efe) ev.push({ t: 'estado', l: 1 - o.l, p: t.i, e: efe });
          }
        } else if (c.est.miedo === B.ronda && k.f !== 'cura' && k.f !== 'curaEq' && k.f !== 'energia' && k.f !== 'robar') {
          // las cartas de apoyo funcionan con miedo
        }
        // efectos propios
        if (k.f === 'atkMas') { c.est.atkMas = 1; ev.push({ t: 'estado', l: o.l, p: o.p, e: 'potenciado' }); }
        if (k.f === 'velMas') { c.est.velMas = 2; ev.push({ t: 'estado', l: o.l, p: o.p, e: 'veloz' }); }
        if (k.f === 'cura') curar(ev, o.l, o.p, c, Math.round(k.x * c.m));
        if (k.f === 'curaEq') L.cr.forEach(function (a, i) { if (a.vivo) curar(ev, o.l, i, a, Math.round(k.x * c.m)); });
        if (k.f === 'robar') { var n = robar(B, o.l, k.x); ev.push({ t: 'robar', l: o.l, n: n }); }
        if (k.f === 'energia') { L.en = Math.min(MAX_EN, L.en + k.x); ev.push({ t: 'energia', l: o.l, v: k.x, en: L.en }); }
        if (k.f === 'quitaEn') { var q = Math.min(E.en, k.x); E.en -= q; ev.push({ t: 'energia', l: 1 - o.l, v: -q, en: E.en }); }
      }
      comprobarFin(B);
    }
    // 4. final de ronda
    if (!B.fin) {
      [0, 1].forEach(function (l) {
        B.lados[l].cr.forEach(function (c, p) {
          if (!c.vivo) return;
          if (c.est.corr) danoDirecto(B, ev, l, p, c, c.est.corr * 8, 'corrosion');
          if (c.vivo && B.ronda > SUBITA) danoDirecto(B, ev, l, p, c, 30 * (B.ronda - SUBITA), 'subita');
        });
      });
      comprobarFin(B);
    }
    [0, 1].forEach(function (l) {
      B.lados[l].cr.forEach(function (c) {
        c.esc = 0;
        if (c.est.velMas) c.est.velMas--; if (c.est.velMenos) c.est.velMenos--;
        if (c.est.miedo && c.est.miedo <= B.ronda) c.est.miedo = 0;
      });
    });
    if (!B.fin) {
      B.ronda++;
      if (B.ronda > MAX_RONDAS) { B.fin = 'empate'; }
      else [0, 1].forEach(function (l) { var L = B.lados[l]; L.en = Math.min(MAX_EN, L.en + EN_RONDA); robar(B, l, ROBA_RONDA); });
      if (B.ronda === SUBITA + 1) ev.push({ t: 'aviso', m: '¡SOBRECARGA! Desde ahora todas pierden vida cada ronda' });
    }
    if (B.fin) ev.push({ t: 'fin', r: B.fin });
    return ev;
  }

  function golpe(B, ev, la, pa, c, ld, t, k, nCartas) {
    var d = t.c, dmg = k.a * c.m, info = {};
    if (k.clase === c.clase) dmg *= 1.1;
    var vent = CX.ventaja(k.clase, d.clase); dmg *= vent;
    if (c.est.atkMas) { dmg *= 1.25; c.est.atkMas = 0; }
    if (c.est.atkMenos) { dmg *= 0.75; c.est.atkMenos = 0; }
    if (d.est.expuesto) { dmg *= 1.3; d.est.expuesto = 0; }
    if (k.f === 'combo' && nCartas >= 2) dmg *= 1.4;
    if (k.f === 'rapido' && velEf(c) > velEf(d)) dmg *= 1.3;
    if (k.f === 'remata' && d.pv < d.pvMax * 0.4) dmg *= 1.5;
    if (nCartas >= 2) dmg += k.a * c.hab / 500;
    var crit = Math.random() < c.mor / 400; if (crit) dmg *= 1.75;
    dmg = Math.max(1, Math.round(dmg));
    var aEsc = 0, aPv = dmg;
    if (d.esc > 0 && !d.est.roto) {
      if (k.f === 'antiEsc') { var cap = d.esc / 2; if (dmg <= cap) { aEsc = dmg * 2; aPv = 0; } else { aEsc = d.esc; aPv = dmg - cap; } }
      else { aEsc = Math.min(d.esc, dmg); aPv = dmg - aEsc; }
      d.esc -= aEsc; aPv = Math.round(aPv);
    }
    if (d.est.roto) { d.est.roto = 0; info.atraviesa = 1; }
    d.pv = Math.max(0, d.pv - aPv);
    ev.push({ t: 'golpe', l: la, p: pa, tl: ld, tp: t.i, k: k.n, clase: k.clase, slot: k.slot, v: dmg, vPv: aPv, vEsc: aEsc, crit: crit ? 1 : 0, vent: vent, pv: d.pv, esc: d.esc, at: info.atraviesa || 0 });
    if (k.f === 'drenaje' && aPv > 0) curar(ev, la, pa, c, Math.round(aPv / 2));
    if (d.pv <= 0) morir(B, ev, ld, t.i, d);
  }
  function curar(ev, l, p, c, v) { var antes = c.pv; c.pv = Math.min(c.pvMax, c.pv + v); ev.push({ t: 'cura', l: l, p: p, v: c.pv - antes, pv: c.pv }); }
  function danoDirecto(B, ev, l, p, c, v, por) { c.pv = Math.max(0, c.pv - v); ev.push({ t: 'dot', l: l, p: p, v: v, por: por, pv: c.pv }); if (c.pv <= 0) morir(B, ev, l, p, c); }
  function morir(B, ev, l, p, c) { c.vivo = false; c.esc = 0; quitarMano(B.lados[l], p); ev.push({ t: 'cae', l: l, p: p }); }
  function comprobarFin(B) {
    var a = vivos(B.lados[0]).length, b = vivos(B.lados[1]).length;
    if (!a && !b) B.fin = 'empate'; else if (!b) B.fin = 'gana'; else if (!a) B.fin = 'pierde';
  }

  /* comprueba una jugada sin tocar el combate (lanza error si no vale) */
  function comprobar(B, l, jug) { validar(JSON.parse(JSON.stringify(B)), l, jug); }

  return { crear: crear, vista: vista, ronda: ronda, ia: ia, comprobar: comprobar, MAX_EN: MAX_EN };
})();
