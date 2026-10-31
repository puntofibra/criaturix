/* =========================================================
   CRIATURIX · ARENA DE COMBATE (fondo animado)
   Cielo con nebulosas y estrellas, auroras, horizonte con sol de
   energía, suelo de rejilla hexagonal en perspectiva que avanza,
   pilares de energía, focos que barren, ascuas que suben y
   estrellas fugaces. Lado propio en cian/verde y rival en magenta.
   ========================================================= */
var ARENA = (function () {
  'use strict';
  var cv, g, cielo, W = 0, H = 0, dpr = 1, t0 = 0, raf = 0, parts = [], fugaz = null, cont = null;
  var R = Math.random;
  var SPR = {};
  function spr(col) {
    if (SPR[col]) return SPR[col];
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, '#fff'); gr.addColorStop(.18, col); gr.addColorStop(.5, col + '55'); gr.addColorStop(1, col + '00');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return (SPR[col] = c);
  }
  function horizontal() { return W > H * 1.15; }
  function HZ() { return H * (horizontal() ? .43 : .36); }

  /* ---------- cielo estático (se dibuja una vez por tamaño) ---------- */
  function pintaCielo() {
    cielo = document.createElement('canvas'); cielo.width = W; cielo.height = H;
    var c = cielo.getContext('2d'), hz = HZ(), f = hz / H;
    var gr = c.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#03040d'); gr.addColorStop(f * .55, '#0a0b26'); gr.addColorStop(f, '#1a0f3a'); gr.addColorStop(f + .01, '#0b0a20'); gr.addColorStop(1, '#030409');
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
    // nebulosas
    [[.18, .22, .5, '0,229,255', .13], [.82, .18, .55, '255,43,214', .14], [.5, .05, .7, '177,75,255', .10], [.3, .45, .35, '25,255,106', .06], [.72, .42, .4, '255,77,46', .06]].forEach(function (n) {
      var r = Math.max(W, H) * n[2], ng = c.createRadialGradient(W * n[0], H * n[1], 0, W * n[0], H * n[1], r);
      ng.addColorStop(0, 'rgba(' + n[3] + ',' + n[4] + ')'); ng.addColorStop(.5, 'rgba(' + n[3] + ',' + (n[4] * .35) + ')'); ng.addColorStop(1, 'rgba(' + n[3] + ',0)');
      c.fillStyle = ng; c.fillRect(0, 0, W, hz + 4);
    });
    // estrellas fijas
    for (var i = 0; i < W * H / 2600; i++) {
      var x = R() * W, y = Math.pow(R(), 1.4) * hz, s = R();
      c.globalAlpha = .25 + s * .6; c.fillStyle = s > .93 ? '#bfefff' : '#fff';
      c.fillRect(x, y, s > .85 ? 1.6 * dpr : dpr, s > .85 ? 1.6 * dpr : dpr);
    }
    c.globalAlpha = 1;
    // silueta lejana de torres / montañas tecnológicas en el horizonte
    c.fillStyle = '#07061a';
    c.beginPath(); c.moveTo(0, hz);
    var x2 = 0; while (x2 < W) { var w = (14 + R() * 40) * dpr, h = (R() < .2 ? 14 + R() * 34 : 3 + R() * 12) * dpr; c.lineTo(x2, hz - h); c.lineTo(x2 + w, hz - h); x2 += w; }
    c.lineTo(W, hz); c.closePath(); c.fill();
    // lucecitas en las torres
    for (var k = 0; k < W / (18 * dpr); k++) { c.fillStyle = R() < .5 ? 'rgba(0,229,255,.55)' : 'rgba(255,43,214,.5)'; c.fillRect(R() * W, hz - R() * 30 * dpr, 1.5 * dpr, 1.5 * dpr); }
  }

  function tam() {
    if (!cv) return;
    var r = cont.getBoundingClientRect(); dpr = Math.min(1.5, window.devicePixelRatio || 1);
    var w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (w === W && h === H) return;
    W = cv.width = w; H = cv.height = h; pintaCielo();
  }

  function montar(el) {
    parar(); cont = el;
    cv = document.createElement('canvas'); cv.className = 'arenaBg'; el.insertBefore(cv, el.firstChild); g = cv.getContext('2d');
    W = H = 0; parts = []; t0 = performance.now(); tam();
    raf = requestAnimationFrame(bucle);
  }
  function parar() { if (raf) cancelAnimationFrame(raf); raf = 0; if (cv && cv.parentNode) cv.parentNode.removeChild(cv); cv = null; }

  function bucle(now) {
    if (!cv || !cv.isConnected) { parar(); return; }
    raf = requestAnimationFrame(bucle);
    if (document.hidden) return;
    tam();
    var t = Math.max(0, (now - t0) / 1000), hz = HZ(), cxp = W / 2;
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.drawImage(cielo, 0, 0);

    /* auroras */
    g.globalCompositeOperation = 'lighter';
    for (var a = 0; a < 2; a++) {
      var col = a ? '255,43,214' : '0,229,255', base = H * (.16 + a * .1);
      g.beginPath(); g.moveTo(0, base);
      for (var x = 0; x <= W; x += W / 24) g.lineTo(x, base + Math.sin(x / W * 6 + t * (.25 + a * .1) + a * 2) * H * .04 + Math.sin(x / W * 13 - t * .4) * H * .015);
      g.lineTo(W, base + H * .16); g.lineTo(0, base + H * .16); g.closePath();
      var ag = g.createLinearGradient(0, base - H * .05, 0, base + H * .16);
      ag.addColorStop(0, 'rgba(' + col + ',0)'); ag.addColorStop(.3, 'rgba(' + col + ',' + (.07 + .03 * Math.sin(t * .7 + a)) + ')'); ag.addColorStop(1, 'rgba(' + col + ',0)');
      g.fillStyle = ag; g.fill();
    }

    /* estrellas que titilan */
    for (var s = 0; s < 40; s++) {
      var sx = (Math.sin(s * 91.7) * .5 + .5) * W, sy = (Math.sin(s * 53.3) * .5 + .5) * hz * .85, b = Math.max(0, Math.sin(t * (1 + s % 5 * .4) + s));
      g.globalAlpha = b * .9; var rr = (2 + (s % 3)) * dpr * (.6 + b * .6); g.drawImage(spr(s % 4 ? '#bfefff' : '#ffb0f0'), sx - rr * 2, sy - rr * 2, rr * 4, rr * 4);
    }
    g.globalAlpha = 1;

    /* estrella fugaz */
    if (!fugaz && R() < .004) fugaz = { x: R() * W * .7, y: R() * hz * .4, vx: (6 + R() * 5) * dpr, vy: (2 + R() * 2) * dpr, l: 1 };
    if (fugaz) {
      fugaz.x += fugaz.vx; fugaz.y += fugaz.vy; fugaz.l -= .02;
      var fg = g.createLinearGradient(fugaz.x, fugaz.y, fugaz.x - fugaz.vx * 14, fugaz.y - fugaz.vy * 14);
      fg.addColorStop(0, 'rgba(255,255,255,' + fugaz.l + ')'); fg.addColorStop(1, 'rgba(138,249,255,0)');
      g.strokeStyle = fg; g.lineWidth = 2 * dpr; g.beginPath(); g.moveTo(fugaz.x, fugaz.y); g.lineTo(fugaz.x - fugaz.vx * 14, fugaz.y - fugaz.vy * 14); g.stroke();
      if (fugaz.l <= 0 || fugaz.x > W) fugaz = null;
    }

    /* sol de energía en el horizonte */
    var pul = 1 + Math.sin(t * 1.3) * .06;
    var sg = g.createRadialGradient(cxp, hz, 0, cxp, hz, H * .55 * pul);
    sg.addColorStop(0, 'rgba(255,190,255,.35)'); sg.addColorStop(.12, 'rgba(255,43,214,.22)'); sg.addColorStop(.45, 'rgba(120,40,255,.08)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sg; g.fillRect(0, 0, W, H);

    /* focos que barren desde arriba */
    for (var f = 0; f < 2; f++) {
      var ang = Math.sin(t * .35 + f * 2.4) * .45 + (f ? -.25 : .25), ox = f ? W * .85 : W * .15;
      g.save(); g.translate(ox, -20 * dpr); g.rotate(ang);
      var fl = g.createLinearGradient(0, 0, 0, H * 1.1); fl.addColorStop(0, f ? 'rgba(255,43,214,.16)' : 'rgba(0,229,255,.16)'); fl.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = fl; g.beginPath(); g.moveTo(-6 * dpr, 0); g.lineTo(6 * dpr, 0); g.lineTo(W * .16, H * 1.1); g.lineTo(-W * .16, H * 1.1); g.closePath(); g.fill(); g.restore();
    }

    /* suelo: rejilla en perspectiva que avanza */
    g.globalCompositeOperation = 'source-over';
    var sue = g.createLinearGradient(0, hz, 0, H); sue.addColorStop(0, 'rgba(40,10,70,.9)'); sue.addColorStop(1, 'rgba(3,4,12,1)');
    g.fillStyle = sue; g.fillRect(0, hz, W, H - hz);
    g.globalCompositeOperation = 'lighter';
    var hor = horizontal();
    // tinte de cada equipo sobre el suelo
    var tY = g.createLinearGradient(hor ? 0 : 0, hor ? 0 : H, hor ? W : 0, hor ? 0 : hz);
    tY.addColorStop(0, 'rgba(0,229,255,.10)'); tY.addColorStop(.5, 'rgba(0,0,0,0)'); tY.addColorStop(1, 'rgba(255,43,214,.10)');
    g.fillStyle = tY; g.fillRect(0, hz, W, H - hz);
    g.lineWidth = Math.max(1, dpr);
    var vel = t * .35;
    for (var i = 0; i < 16; i++) {
      var p = ((i / 16) + vel) % 1, y = hz + Math.pow(p, 2.6) * (H - hz);
      g.strokeStyle = 'rgba(0,229,255,' + (.04 + p * .32) + ')'; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
    }
    for (var j = -16; j <= 16; j++) {
      var xb = cxp + j * W * .11, xa = cxp + j * W * .012;
      var lg = g.createLinearGradient(0, hz, 0, H); lg.addColorStop(0, 'rgba(177,75,255,0)'); lg.addColorStop(1, j < 0 ? 'rgba(0,229,255,.35)' : 'rgba(255,43,214,.35)');
      g.strokeStyle = lg; g.beginPath(); g.moveTo(xa, hz); g.lineTo(xb, H); g.stroke();
    }
    // línea de horizonte brillante
    var hl = g.createLinearGradient(0, 0, W, 0); hl.addColorStop(0, 'rgba(0,229,255,0)'); hl.addColorStop(.5, 'rgba(255,200,255,.9)'); hl.addColorStop(1, 'rgba(255,43,214,0)');
    g.fillStyle = hl; g.fillRect(0, hz - dpr, W, 2 * dpr);
    g.globalAlpha = .5; g.fillRect(0, hz - 5 * dpr, W, 10 * dpr); g.globalAlpha = 1;
    // onda de energía que recorre el suelo
    var ow = ((t * .22) % 1), oy = hz + Math.pow(ow, 2.2) * (H - hz);
    var og = g.createLinearGradient(0, oy - 14 * dpr, 0, oy + 14 * dpr); og.addColorStop(0, 'rgba(25,255,106,0)'); og.addColorStop(.5, 'rgba(25,255,106,' + (.25 * (1 - ow)) + ')'); og.addColorStop(1, 'rgba(25,255,106,0)');
    g.fillStyle = og; g.fillRect(0, oy - 14 * dpr, W, 28 * dpr);

    /* pilares de energía a los lados */
    [[.012, '0,229,255'], [.988, '255,43,214']].forEach(function (pl, k) {
      var px = W * pl[0], top = hz - H * .38, pw = Math.max(4, W * .006), pu = .55 + .45 * Math.sin(t * 2.2 + k * 1.7);
      var pg = g.createLinearGradient(0, top, 0, hz + H * .05); pg.addColorStop(0, 'rgba(' + pl[1] + ',0)'); pg.addColorStop(.5, 'rgba(' + pl[1] + ',' + (.35 * pu) + ')'); pg.addColorStop(1, 'rgba(' + pl[1] + ',.6)');
      g.fillStyle = pg; g.fillRect(px - pw / 2, top, pw, hz + H * .05 - top);
      g.globalAlpha = .6 * pu; g.drawImage(spr(k ? '#ff2bd6' : '#00e5ff'), px - pw * 6, hz - pw * 6, pw * 12, pw * 12); g.globalAlpha = 1;
      // anillos que suben
      var ry = hz - ((t * .5 + k * .5) % 1) * H * .38;
      g.strokeStyle = 'rgba(' + pl[1] + ',' + (.5 * pu) + ')'; g.lineWidth = 1.5 * dpr; g.beginPath(); g.ellipse(px, ry, pw * 1.8, pw * .5, 0, 0, 7); g.stroke();
    });

    /* ascuas / polvo de energía que sube */
    if (parts.length < 70 && R() < .6) parts.push({ x: R() * W, y: H + 10, vy: (.3 + R() * .9) * dpr, vx: (R() - .5) * .3 * dpr, s: (1 + R() * 2.2) * dpr, c: ['#00e5ff', '#ff2bd6', '#19ff6a', '#b14bff', '#ffd23f'][Math.floor(R() * 5)], f: R() * 9 });
    for (var q = parts.length - 1; q >= 0; q--) {
      var e = parts[q]; e.y -= e.vy; e.x += e.vx + Math.sin(t * 1.5 + e.f) * .3 * dpr;
      if (e.y < -10) { parts.splice(q, 1); continue; }
      var al = Math.min(1, (H - e.y) / (H * .2)) * Math.min(1, e.y / (H * .3));
      g.globalAlpha = al * (.5 + .5 * Math.sin(t * 3 + e.f)); g.drawImage(spr(e.c), e.x - e.s * 3, e.y - e.s * 3, e.s * 6, e.s * 6);
    }
    g.globalAlpha = 1;

    /* viñeta */
    g.globalCompositeOperation = 'source-over';
    var vg = g.createRadialGradient(cxp, H * .5, Math.min(W, H) * .35, cxp, H * .5, Math.max(W, H) * .8);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.7)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }

  return { montar: montar, parar: parar };
})();
