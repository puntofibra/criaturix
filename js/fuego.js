/* =========================================================
   CRIATURIX · efectos de espalda que salen por los tubos
   Un único canvas encima de la página dibuja, con mezcla aditiva,
   el efecto de cada criatura visible (como el fuego de Lucas 5G).
   Cada <svg class="rb" data-fx="clase"> lleva 3 marcadores .rb-tubo
   con un punto en la boca del tubo y otro 10 unidades más afuera.
   ========================================================= */
var FUEGO = (function () {
  'use strict';
  var cv, g, lista = [], tLista = 0, tPrev = 0, est = new WeakMap(), SPR = {};
  var R = Math.random, rnd = function (a, b) { return a + R() * (b - a); };
  var MAXR = 18;

  function spr(col) {   // círculo luminoso precalculado
    if (SPR[col]) return SPR[col];
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, col); gr.addColorStop(.35, col + 'aa'); gr.addColorStop(1, col + '00');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return (SPR[col] = c);
  }
  function humoSpr(col) {
    var k = 'h' + col; if (SPR[k]) return SPR[k];
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, col + 'cc'); gr.addColorStop(.5, col + '55'); gr.addColorStop(1, col + '00');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return (SPR[k] = c);
  }
  function glow(col, x, y, r, a) { g.globalAlpha = a; g.drawImage(spr(col), x - r, y - r, r * 2, r * 2); g.globalAlpha = 1; }

  /* llama con forma de gota, en coordenadas locales: sale hacia +x */
  function llama(w, L, wob, stops) {
    var gr = g.createLinearGradient(0, 0, L, 0); stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); });
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, -w / 2);
    g.bezierCurveTo(L * .35, -w / 2, L * .7, -w * .2 + wob * .5, L, wob);
    g.bezierCurveTo(L * .7, w * .2 + wob * .5, L * .35, w / 2, 0, w / 2);
    g.closePath(); g.fill();
  }

  function montar() {
    cv = document.createElement('canvas'); cv.id = 'fxTubos';
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9998';
    document.body.appendChild(cv); g = cv.getContext('2d');
    requestAnimationFrame(bucle);
  }

  function visible(svg) {
    var r = svg.getBoundingClientRect();
    if (r.width < 24 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return false;
    var cx = Math.min(innerWidth - 1, Math.max(0, r.left + r.width * .45)), cy = Math.min(innerHeight - 1, Math.max(0, r.top + r.height * .5));
    var h = document.elementFromPoint(cx, cy);
    return !!h && (svg.contains(h) || h.contains(svg) || (svg.parentElement && svg.parentElement.contains(h)));
  }

  function bucle(t) {
    requestAnimationFrame(bucle);
    t /= 1000; var dt = Math.min(.05, tPrev ? t - tPrev : .016); tPrev = t;
    if (document.hidden) return;
    var d = Math.min(window.devicePixelRatio || 1, 2), W = Math.round(innerWidth * d), H = Math.round(innerHeight * d);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, innerWidth, innerHeight);
    if (t - tLista > .25) {   // refrescar qué criaturas se ven
      tLista = t;
      var capa = document.querySelector('.cIntro, .finCx, .busca');   // con una pantalla encima, solo los efectos de esa pantalla
      lista = Array.prototype.slice.call(document.querySelectorAll('svg.rb[data-fx]:not(.quieto)')).filter(function (v) { return capa ? capa.contains(v) : visible(v); }).slice(0, MAXR);
    }
    lista.forEach(function (svg) {
      if (!svg.isConnected) return;
      var fx = svg.getAttribute('data-fx'), tubos = svg.querySelectorAll('.rb-tubo');
      // criatura muerta en combate: el efecto también en gris clarito y apagado, como ella
      g.filter = svg.closest('.muerto') ? 'grayscale(1) brightness(1.1) opacity(.35)' : 'none';
      for (var i = 0; i < tubos.length; i++) {
        var a = tubos[i].firstChild.getBoundingClientRect(), b = tubos[i].lastChild.getBoundingClientRect();
        var x = a.left + a.width / 2, y = a.top + a.height / 2, dx = b.left + b.width / 2 - x, dy = b.top + b.height / 2 - y;
        var u = Math.hypot(dx, dy) / 10; if (!u) continue;                  // píxeles por unidad del svg
        var st = est.get(tubos[i]); if (!st) { st = { p: [], s: R() * 9, n: 0 }; est.set(tubos[i], st); }
        dibuja(fx, st, x, y, Math.atan2(dy, dx), u, t + st.s, dt, i);
      }
      g.filter = 'none';
    });
  }

  function particulas(st, dt, modo) {
    for (var i = st.p.length - 1; i >= 0; i--) {
      var p = st.p[i]; p.l -= dt; if (p.l <= 0) { st.p.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= p.dr || .97; p.vy *= p.dr || .97; if (p.gy) p.vy += p.gy * dt;
      var k = p.l / p.m;
      if (p.luz) {   // luciérnaga: vuela a la deriva y parpadea
        p.ph += dt; p.vx += Math.sin(p.ph * p.fw) * 38 * p.u * dt; p.vy += (Math.cos(p.ph * p.fw * .8) * 38 - 5) * p.u * dt;
        p.vx *= .992; p.vy *= .992; p.l += dt * 0;
        var vida = 1 - k, ent = Math.min(1, vida * p.m / .4), fade = Math.min(ent, Math.min(1, p.l / .8));
        var bl = .45 + .55 * Math.pow(.5 + .5 * Math.sin(p.ph * 4.2 + p.fw), 2);
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = fade * bl * .55;
        var ro = p.r * 4.5; g.drawImage(spr(p.c), p.x - ro, p.y - ro, ro * 2, ro * 2);
        g.globalAlpha = fade * bl; var rc = p.r * 1.3; g.drawImage(spr('#ffffff'), p.x - rc, p.y - rc, rc * 2, rc * 2);
        continue;
      }
      if (p.humo) {
        g.globalCompositeOperation = p.humo === 2 ? 'source-over' : 'lighter';
        var r = p.r * (1 + (1 - k) * p.cr); g.globalAlpha = Math.min(1, k * 1.6) * p.a;
        g.drawImage(humoSpr(p.c), p.x - r, p.y - r, r * 2, r * 2);
      } else if (p.rayo) {
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = k; g.strokeStyle = p.c; g.lineWidth = p.r; g.lineCap = 'round';
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * .035, p.y - p.vy * .035); g.stroke();
      } else {
        g.globalCompositeOperation = 'lighter'; var rr = p.r * (.4 + k * .8) * (p.tw ? (.6 + .4 * Math.sin(p.l * 30)) : 1);
        g.globalAlpha = k; g.drawImage(spr(p.c), p.x - rr, p.y - rr, rr * 2, rr * 2);
      }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    if (st.p.length > 90) st.p.splice(0, st.p.length - 90);
  }
  function emite(st, o) { st.p.push(o); }

  function dibuja(fx, st, x, y, ang, u, t, dt, i) {
    var cs = Math.cos(ang), sn = Math.sin(ang);
    g.globalCompositeOperation = 'lighter';
    switch (fx) {

      case 'plasma': {   // llamas gorditas rojas
        var w = 10.5 * u, L = (38 + Math.sin(t * 27) * 3 + Math.sin(t * 43) * 2 + R() * 3) * u, wob = (Math.sin(t * 15) + Math.sin(t * 31) * .5) * w * .22;
        glow('#ff4d2e', x + cs * L * .3, y + sn * L * .3, L * .75, .55 + Math.sin(t * 20) * .1);
        g.save(); g.translate(x, y); g.rotate(ang);
        llama(w * 1.9, L * 1.25, wob * 1.4, [[0, 'rgba(255,90,40,.6)'], [.5, 'rgba(255,50,20,.3)'], [1, 'rgba(255,30,0,0)']]);
        llama(w * 1.15, L, wob, [[0, 'rgba(255,255,220,.95)'], [.2, 'rgba(255,214,90,.92)'], [.55, 'rgba(255,90,30,.8)'], [1, 'rgba(255,40,10,0)']]);
        llama(w * .55, L * .48, wob * .4, [[0, 'rgba(255,255,255,1)'], [.7, 'rgba(255,240,190,.7)'], [1, 'rgba(255,255,255,0)']]);
        g.restore();
        if (R() < .55) emite(st, { x: x + cs * L * rnd(.3, .7), y: y + sn * L * rnd(.3, .7), vx: (cs * rnd(30, 70) + rnd(-15, 15)) * u, vy: (sn * rnd(30, 70) + rnd(-15, 15)) * u - 8 * u, l: rnd(.3, .7), m: .7, r: rnd(1.2, 2.6) * u, c: R() < .5 ? '#ffb02e' : '#ff4d2e', gy: -20 * u });
        if (R() < .12) emite(st, { x: x, y: y, vx: (cs * rnd(80, 140) + rnd(-40, 40)) * u, vy: (sn * rnd(80, 140) + rnd(-40, 40)) * u, l: .4, m: .4, r: .35 * u, c: '#fff2c0', rayo: 1 });
        break;
      }

      case 'voltio': {   // rayos amarillos tipo trueno
        st.n -= dt;
        if (st.n <= 0) {   // regenerar el rayo
          st.n = rnd(.05, .11); st.bolts = [];
          var nb = R() < .35 ? 2 : 1;
          for (var b = 0; b < nb; b++) {
            var pts = [[0, 0]], Lb = rnd(26, 40), seg = 7, desv = rnd(-.5, .5);
            for (var k = 1; k <= seg; k++) pts.push([Lb * k / seg, (k === seg ? desv * 8 : rnd(-5, 5) + desv * k)]);
            var ram = null;
            if (R() < .6) { var s0 = pts[Math.floor(rnd(2, 5))]; ram = [s0, [s0[0] + rnd(6, 12), s0[1] + rnd(-9, 9)], [s0[0] + rnd(12, 18), s0[1] + rnd(-12, 12)]]; }
            st.bolts.push({ p: pts, r: ram });
          }
          st.on = R() < .85;
        }
        glow('#ffe03a', x + cs * 6 * u, y + sn * 6 * u, (st.on ? 26 : 14) * u, st.on ? .55 : .3);
        if (st.on) {
          g.save(); g.translate(x, y); g.rotate(ang); g.lineJoin = 'round'; g.lineCap = 'round';
          st.bolts.forEach(function (bo) {
            [[4.2 * u, 'rgba(255,224,58,.35)'], [2.2 * u, 'rgba(255,240,120,.9)'], [.9 * u, '#fff']].forEach(function (lw) {
              g.strokeStyle = lw[1]; g.lineWidth = lw[0]; g.beginPath();
              bo.p.forEach(function (q, j) { if (j) g.lineTo(q[0] * u, q[1] * u); else g.moveTo(q[0] * u, q[1] * u); }); g.stroke();
              if (bo.r) { g.beginPath(); bo.r.forEach(function (q, j) { if (j) g.lineTo(q[0] * u, q[1] * u); else g.moveTo(q[0] * u, q[1] * u); }); g.stroke(); }
            });
          });
          g.restore();
          var tip = st.bolts[0].p[st.bolts[0].p.length - 1];
          glow('#fff6a8', x + (cs * tip[0] - sn * tip[1]) * u, y + (sn * tip[0] + cs * tip[1]) * u, 8 * u, .9);
        }
        if (R() < .3) emite(st, { x: x, y: y, vx: (cs * rnd(60, 130) + rnd(-70, 70)) * u, vy: (sn * rnd(60, 130) + rnd(-70, 70)) * u, l: .25, m: .25, r: .4 * u, c: '#fff6a8', rayo: 1 });
        break;
      }

      case 'bio': {   // raíces verdes que se mueven + destellos
        glow('#19ff6a', x + cs * 8 * u, y + sn * 8 * u, 18 * u, .35 + Math.sin(t * 3) * .1);
        g.save(); g.translate(x, y); g.rotate(ang); g.lineCap = 'round';
        for (var rz = 0; rz < 3; rz++) {
          var Lr = (24 + rz * 5 + Math.sin(t * 1.3 + rz * 2) * 4) * u, fase = t * (2.1 + rz * .4) + rz * 2.3, lado = rz === 1 ? 0 : (rz ? 1 : -1);
          var pts2 = []; for (var q = 0; q <= 12; q++) { var f = q / 12; pts2.push([Lr * f, (Math.sin(f * 5 + fase) * 4 * f + lado * f * f * 7) * u]); }
          [[3.4 * u * (1 - rz * .2), 'rgba(40,120,50,.95)', 'source-over'], [1.4 * u, 'rgba(25,255,106,.85)', 'lighter']].forEach(function (s) {
            g.globalCompositeOperation = s[2]; g.strokeStyle = s[1]; g.lineWidth = s[0]; g.beginPath();
            pts2.forEach(function (pq, j) { if (j) g.lineTo(pq[0], pq[1]); else g.moveTo(pq[0], pq[1]); }); g.stroke();
          });
          var pf = pts2[pts2.length - 1]; g.globalCompositeOperation = 'lighter'; g.globalAlpha = .9;
          g.drawImage(spr('#b6ff3a'), pf[0] - 3 * u, pf[1] - 3 * u, 6 * u, 6 * u); g.globalAlpha = 1;
        }
        g.restore();
        if (R() < .18) { var fr = rnd(.3, 1); emite(st, { x: x + cs * 30 * u * fr + rnd(-6, 6) * u, y: y + sn * 30 * u * fr + rnd(-6, 6) * u, vx: rnd(-8, 8) * u, vy: rnd(-22, -8) * u, l: rnd(.6, 1.2), m: 1.2, r: rnd(1.4, 2.8) * u, c: R() < .5 ? '#b6ff3a' : '#19ff6a', tw: 1, dr: .99 }); }
        break;
      }

      case 'cromo': {   // humo azul
        glow('#4ab8ff', x, y, 10 * u, .35 + Math.sin(t * 6) * .08);
        if (R() < .7) emite(st, { x: x + cs * 2 * u, y: y + sn * 2 * u, vx: (cs * rnd(30, 55) + rnd(-10, 10)) * u, vy: (sn * rnd(30, 55) + rnd(-10, 10)) * u - 8 * u, l: rnd(1.2, 1.9), m: 1.9, r: rnd(4, 6) * u, cr: 3.2, c: R() < .5 ? '#7fb8e8' : '#4a7fb8', a: .5, humo: 2, gy: -10 * u, dr: .985 });
        break;
      }

      case 'cuantico': {   // luciérnagas de luz cian que salen de los cristales y revolotean
        glow('#00e5ff', x, y, 7 * u, .25 + Math.sin(t * 2.3) * .1);
        if (R() < .06) emite(st, { luz: 1, x: x + rnd(-2, 2) * u, y: y + rnd(-2, 2) * u, vx: (cs * rnd(22, 40) + rnd(-14, 14)) * u, vy: (sn * rnd(22, 40) + rnd(-14, 14)) * u, l: rnd(2.8, 4.2), m: 4.2, r: rnd(1, 1.7) * u, u: u, ph: R() * 9, fw: rnd(1.5, 3), c: R() < .7 ? '#00e5ff' : '#8af9ff' });
        break;
      }

      default: {   // sombra: llamas finas + humo morado
        if (R() < .5) emite(st, { x: x + cs * 6 * u, y: y + sn * 6 * u, vx: (cs * rnd(15, 30) + rnd(-6, 6)) * u, vy: (sn * rnd(15, 30) + rnd(-6, 6)) * u - 5 * u, l: rnd(1.1, 1.8), m: 1.8, r: rnd(2.5, 4) * u, cr: 2.2, c: '#8a4ac9', a: .55, humo: 1, gy: -8 * u, dr: .985 });
        particulas(st, dt);
        g.globalCompositeOperation = 'lighter';
        var w2 = 4 * u, L2 = (34 + Math.sin(t * 19) * 4 + R() * 3) * u, wb = (Math.sin(t * 11) + Math.sin(t * 23) * .6) * w2 * .5;
        glow('#ff4fd8', x + cs * 8 * u, y + sn * 8 * u, 16 * u, .45);
        g.save(); g.translate(x, y); g.rotate(ang);
        llama(w2 * 2.2, L2 * 1.15, wb * 1.5, [[0, 'rgba(177,75,255,.55)'], [1, 'rgba(120,30,200,0)']]);
        llama(w2, L2, wb, [[0, 'rgba(255,230,250,.95)'], [.25, 'rgba(255,79,216,.9)'], [.7, 'rgba(177,75,255,.6)'], [1, 'rgba(120,30,200,0)']]);
        g.rotate(.18); llama(w2 * .6, L2 * .7, -wb, [[0, 'rgba(255,255,255,.9)'], [.5, 'rgba(255,79,216,.7)'], [1, 'rgba(177,75,255,0)']]);
        g.restore();
        if (R() < .15) emite(st, { x: x, y: y, vx: (cs * rnd(50, 90) + rnd(-25, 25)) * u, vy: (sn * rnd(50, 90) + rnd(-25, 25)) * u, l: .45, m: .45, r: 1.2 * u, c: '#ff4fd8' });
        g.globalCompositeOperation = 'source-over';
        return;
      }
    }
    g.globalCompositeOperation = 'source-over';
    particulas(st, dt);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
  return {};
})();
