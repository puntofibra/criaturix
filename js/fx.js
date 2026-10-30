/* =========================================================
   CRIATURIX · efectos de combate (partículas en canvas, temblor, destellos)
   ========================================================= */
'use strict';
const FX = (() => {
  let cv = null, cx = null, campo = null, W = 0, H = 0, dpr = 1, parts = [], rayos = [], raf = 0, trauma = 0;
  const POCO = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MAX = POCO ? 200 : 700;
  const R = (a, b) => a + Math.random() * (b - a);
  const COL = { plasma: ['#ff4d2e', '#ffb02e', '#fff1a8'], voltio: ['#ffe03a', '#fff6a8', '#ffffff'], bio: ['#19ff6a', '#b6ff3a', '#eaffc8'],
    cromo: ['#9fc2e0', '#eef6ff', '#ffffff'], cuantico: ['#00e5ff', '#8af9ff', '#ffffff'], sombra: ['#b14bff', '#ff4fd8', '#f1d2ff'] };
  const cols = c => COL[c] || COL.cuantico;

  function montar(el) {
    campo = el; cv = document.createElement('canvas'); cv.className = 'cfx'; el.appendChild(cv); cx = cv.getContext('2d');
    tam(); parts = []; rayos = []; trauma = 0;
  }
  function tam() {
    if (!campo || !cv) return; const r = campo.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height; cv.width = Math.max(1, W * dpr); cv.height = Math.max(1, H * dpr);
  }
  addEventListener('resize', tam);
  function vivo() { return cv && cv.isConnected; }
  function arranca() { if (!raf) raf = requestAnimationFrame(frame); }
  function add(p) { if (parts.length < MAX) parts.push(Object.assign({ vx: 0, vy: 0, g: 0, drag: 0.98, vida: 0.8, t: 0, tam: 3, rot: 0, vr: 0, tipo: 'punto', a: 1 }, p)); }

  let ult = 0;
  function frame(ts) {
    raf = 0; if (!vivo()) { parts = []; rayos = []; return; }
    const dt = Math.min(0.05, ult ? (ts - ult) / 1000 : 0.016); ult = ts;
    if (cv.width !== Math.round(campo.clientWidth * dpr)) tam();
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    cx.globalCompositeOperation = 'lighter';
    // rayos en zigzag
    rayos = rayos.filter(r => (r.t += dt) < r.vida);
    rayos.forEach(r => {
      const a = 1 - r.t / r.vida; cx.lineCap = 'round'; cx.lineJoin = 'round';
      [[r.ancho * 4, r.col, 0.25], [r.ancho * 1.8, r.col, 0.7], [r.ancho * 0.7, '#fff', 1]].forEach(([w, c, o]) => {
        cx.globalAlpha = a * o; cx.strokeStyle = c; cx.lineWidth = w; cx.beginPath(); r.pts.forEach((p, i) => i ? cx.lineTo(p[0], p[1]) : cx.moveTo(p[0], p[1])); cx.stroke();
      });
      if (Math.random() < 0.5) r.pts = zigzag(r.A, r.B, r.seg, r.amp);
    });
    // partículas
    parts = parts.filter(p => (p.t += dt) < p.vida);
    for (const p of parts) {
      p.vx *= p.drag; p.vy = p.vy * p.drag + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      const k = p.t / p.vida, a = p.a * (p.tipo === 'onda' ? 1 - k : k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85);
      cx.globalAlpha = Math.max(0, a);
      if (p.tipo === 'punto') {
        const s = p.tam * (1 - k * 0.6), gr = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, s * 2.4);
        gr.addColorStop(0, '#fff'); gr.addColorStop(0.25, p.col); gr.addColorStop(1, 'rgba(0,0,0,0)');
        cx.fillStyle = gr; cx.beginPath(); cx.arc(p.x, p.y, s * 2.4, 0, 7); cx.fill();
      } else if (p.tipo === 'chispa') {
        const l = Math.min(26, Math.hypot(p.vx, p.vy) * 0.05 + 2); const ang = Math.atan2(p.vy, p.vx);
        cx.strokeStyle = p.col; cx.lineWidth = p.tam; cx.lineCap = 'round'; cx.beginPath();
        cx.moveTo(p.x, p.y); cx.lineTo(p.x - Math.cos(ang) * l, p.y - Math.sin(ang) * l); cx.stroke();
      } else if (p.tipo === 'onda') {
        const r = p.tam + (p.fin - p.tam) * (1 - Math.pow(1 - k, 3));
        cx.strokeStyle = p.col; cx.lineWidth = Math.max(0.5, p.grosor * (1 - k)); cx.beginPath(); cx.ellipse(p.x, p.y, r, r * (p.aplasta || 1), 0, 0, 7); cx.stroke();
      } else if (p.tipo === 'humo') {
        const s = p.tam * (1 + k * 1.6), gr = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, s);
        gr.addColorStop(0, p.col); gr.addColorStop(1, 'rgba(0,0,0,0)'); cx.globalAlpha = Math.max(0, a * 0.5);
        cx.fillStyle = gr; cx.beginPath(); cx.arc(p.x, p.y, s, 0, 7); cx.fill();
      } else if (p.tipo === 'esquirla' || p.tipo === 'hoja' || p.tipo === 'cubo' || p.tipo === 'cruz' || p.tipo === 'hex') {
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.fillStyle = p.col; cx.strokeStyle = p.col; const s = p.tam;
        cx.shadowColor = p.col; cx.shadowBlur = 8;
        if (p.tipo === 'esquirla') { cx.beginPath(); cx.moveTo(0, -s); cx.lineTo(s * 0.5, s * 0.7); cx.lineTo(-s * 0.5, s * 0.5); cx.closePath(); cx.fill(); }
        else if (p.tipo === 'hoja') { cx.beginPath(); cx.ellipse(0, 0, s, s * 0.45, 0, 0, 7); cx.fill(); }
        else if (p.tipo === 'cubo') { cx.lineWidth = 1.5; cx.strokeRect(-s / 2, -s / 2, s, s); }
        else if (p.tipo === 'cruz') { cx.fillRect(-s / 2, -s / 6, s, s / 3); cx.fillRect(-s / 6, -s / 2, s / 3, s); }
        else { cx.lineWidth = 2; cx.beginPath(); for (let i = 0; i < 6; i++) { const an = i * Math.PI / 3; cx.lineTo(Math.cos(an) * s, Math.sin(an) * s); } cx.closePath(); cx.stroke(); }
        cx.restore();
      }
    }
    cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
    // temblor
    if (trauma > 0 && !POCO) {
      trauma = Math.max(0, trauma - dt * 1.8); const s = trauma * trauma;
      campo.style.transform = s > 0.001 ? `translate(${R(-1, 1) * 16 * s}px,${R(-1, 1) * 12 * s}px) rotate(${R(-1, 1) * 1.6 * s}deg)` : '';
    } else if (campo.style.transform) campo.style.transform = '';
    if (parts.length || rayos.length || trauma > 0) raf = requestAnimationFrame(frame); else ult = 0;
  }
  function zigzag(A, B, seg, amp) {
    const pts = [[A.x, A.y]], dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    for (let i = 1; i < seg; i++) { const k = i / seg, o = R(-1, 1) * amp * Math.sin(k * Math.PI); pts.push([A.x + dx * k + nx * o, A.y + dy * k + ny * o]); }
    pts.push([B.x, B.y]); return pts;
  }

  /* ---------- efectos públicos ---------- */
  function temblor(n) { trauma = Math.min(1, trauma + n); arranca(); }
  function destello(col, fuerza) {
    if (!campo) return; const d = document.createElement('div'); d.className = 'cFlash';
    d.style.cssText = `--fc:${col || '#fff'};--fo:${fuerza || 0.5}`; campo.closest('.vista').appendChild(d); setTimeout(() => d.remove(), 420);
  }
  function onda(P, col, fin, grosor, vida, aplasta) { add({ tipo: 'onda', x: P.x, y: P.y, tam: 6, fin, grosor: grosor || 4, col, vida: vida || 0.5, drag: 1, aplasta }); }

  /* proyectil de A a B según la clase. Devuelve una promesa que se resuelve al impactar */
  function proyectil(A, B, clase, vel) {
    vel = vel || 1; const c = cols(clase); arranca();
    if (clase === 'voltio') {   // rayo instantáneo
      rayos.push({ A, B, seg: 9, amp: 26, pts: zigzag(A, B, 9, 26), col: c[0], ancho: 3.2, t: 0, vida: 0.32 / vel });
      for (let i = 0; i < 10; i++) add({ tipo: 'chispa', x: A.x, y: A.y, vx: R(-260, 260), vy: R(-260, 260), col: c[i % 2], tam: 2, vida: 0.3 });
      return new Promise(r => setTimeout(r, 90 / vel));
    }
    const dur = ({ plasma: 0.36, bio: 0.48, cromo: 0.24, cuantico: 0.3, sombra: 0.46 }[clase] || 0.34) / vel;
    const arco = clase === 'bio' ? -Math.min(90, Math.abs(B.x - A.x) * 0.35 + 30) : clase === 'sombra' ? 0 : -12;
    return new Promise(res => {
      const t0 = performance.now();
      (function paso() {
        if (!vivo()) return res();
        const k = Math.min(1, (performance.now() - t0) / 1000 / dur), e = clase === 'cromo' ? k : k * k * (3 - 2 * k);
        const x = A.x + (B.x - A.x) * e, y = A.y + (B.y - A.y) * e + arco * Math.sin(Math.PI * e) + (clase === 'sombra' ? Math.sin(k * 18) * 10 : 0);
        if (clase === 'plasma') {
          add({ tipo: 'punto', x, y, tam: 9, col: c[0], vida: 0.18 });
          for (let i = 0; i < 3; i++) add({ tipo: 'punto', x: x + R(-5, 5), y: y + R(-5, 5), vx: R(-40, 40), vy: R(-90, -20), tam: R(2, 5), col: c[i % 3], vida: R(0.25, 0.45) });
        } else if (clase === 'bio') {
          add({ tipo: 'punto', x, y, tam: 8, col: c[0], vida: 0.16 });
          if (Math.random() < 0.6) add({ tipo: 'hoja', x, y, vx: R(-50, 50), vy: R(-30, 50), g: 80, tam: R(3, 6), rot: R(0, 6), vr: R(-8, 8), col: c[1], vida: 0.7 });
        } else if (clase === 'cromo') {
          for (let i = 0; i < 3; i++) add({ tipo: 'esquirla', x: x + R(-12, 12), y: y + R(-12, 12), tam: 7, rot: k * 30 + i * 2, col: c[i % 2], vida: 0.06 });
          add({ tipo: 'chispa', x, y, vx: (B.x - A.x) * 2, vy: (B.y - A.y) * 2, tam: 2, col: '#fff', vida: 0.1 });
        } else if (clase === 'cuantico') {
          add({ tipo: 'onda', x, y, tam: 2, fin: 14, grosor: 2.5, col: c[0], vida: 0.25, drag: 1 });
          if (Math.random() < 0.5) add({ tipo: 'cubo', x: x + R(-14, 14), y: y + R(-14, 14), tam: R(3, 7), col: c[1], vida: 0.35, drag: 1 });
          add({ tipo: 'punto', x, y, tam: 5, col: '#fff', vida: 0.1 });
        } else {   // sombra
          add({ tipo: 'humo', x: x + R(-6, 6), y: y + R(-6, 6), vx: R(-20, 20), vy: R(-20, 20), tam: R(10, 18), col: c[0], vida: 0.6 });
          add({ tipo: 'punto', x, y, tam: 6, col: c[1], vida: 0.14 });
        }
        if (k < 1) requestAnimationFrame(paso); else res();
      })();
    });
  }

  /* impacto: explosión de partículas según la clase */
  function impacto(P, clase, fuerte, crit) {
    arranca(); const c = cols(clase), n = (crit ? 46 : fuerte ? 32 : 22) * (POCO ? 0.5 : 1);
    onda(P, c[0], crit ? 95 : fuerte ? 70 : 52, crit ? 7 : 5, 0.45, 0.55);
    onda(P, '#fff', crit ? 60 : 38, 3, 0.3, 0.55);
    add({ tipo: 'punto', x: P.x, y: P.y, tam: crit ? 30 : 20, col: c[0], vida: 0.2 });
    for (let i = 0; i < n; i++) {
      const an = R(0, Math.PI * 2), v = R(140, crit ? 560 : 400);
      add({ tipo: 'chispa', x: P.x, y: P.y, vx: Math.cos(an) * v, vy: Math.sin(an) * v, g: 420, drag: 0.93, tam: R(1.5, 3), col: c[i % 3], vida: R(0.3, 0.65) });
    }
    const extra = { plasma: 'humo', bio: 'hoja', cromo: 'esquirla', cuantico: 'cubo', sombra: 'humo', voltio: 'chispa' }[clase] || 'punto';
    for (let i = 0; i < n / 2; i++) {
      const an = R(0, Math.PI * 2), v = R(60, 260);
      add({ tipo: extra, x: P.x, y: P.y, vx: Math.cos(an) * v, vy: Math.sin(an) * v - 40, g: extra === 'humo' ? -30 : 300, drag: 0.94, tam: extra === 'humo' ? R(10, 22) : R(3, 7), rot: R(0, 6), vr: R(-12, 12), col: extra === 'humo' && clase === 'plasma' ? '#ff7a2e' : c[i % 3], vida: R(0.4, 0.8) });
    }
    if (clase === 'voltio') for (let i = 0; i < 3; i++) { const an = R(0, 6.28), L = R(40, 80); rayos.push({ A: P, B: { x: P.x + Math.cos(an) * L, y: P.y + Math.sin(an) * L }, seg: 5, amp: 10, pts: [], col: c[0], ancho: 1.6, t: 0, vida: 0.22 }); }
    rayos.forEach(r => { if (!r.pts.length) r.pts = zigzag(r.A, r.B, r.seg, r.amp); });
  }
  function escudo(P) {
    arranca(); onda(P, '#6bd6ff', 70, 4, 0.55, 0.9);
    for (let i = 0; i < 10; i++) { const an = i / 10 * 6.28; add({ tipo: 'hex', x: P.x + Math.cos(an) * 46, y: P.y + Math.sin(an) * 40, vx: Math.cos(an) * 20, vy: Math.sin(an) * 20, tam: 7, rot: 0, col: '#6bd6ff', vida: 0.55, drag: 0.9 }); }
  }
  function cura(P) {
    arranca(); onda(P, '#19ff6a', 60, 3, 0.5, 0.5);
    for (let i = 0; i < 16; i++) add({ tipo: i % 3 ? 'punto' : 'cruz', x: P.x + R(-40, 40), y: P.y + R(-10, 40), vy: R(-140, -60), vx: R(-10, 10), drag: 0.97, tam: i % 3 ? R(2, 4) : R(7, 11), col: i % 2 ? '#19ff6a' : '#b6ff3a', vida: R(0.6, 1) });
  }
  function estado(P, col) { arranca(); for (let i = 0; i < 12; i++) { const an = i / 12 * 6.28; add({ tipo: 'punto', x: P.x + Math.cos(an) * 38, y: P.y + Math.sin(an) * 30, vx: -Math.sin(an) * 90, vy: Math.cos(an) * 70 - 30, tam: 3, col, vida: 0.6, drag: 0.95 }); } }
  function veneno(P) { arranca(); for (let i = 0; i < 12; i++) add({ tipo: i % 2 ? 'humo' : 'punto', x: P.x + R(-30, 30), y: P.y + R(-10, 30), vy: R(-80, -30), vx: R(-20, 20), tam: i % 2 ? R(8, 14) : 3, col: '#d38bff', vida: R(0.5, 0.9) }); }
  function explosion(P, clase) {
    arranca(); const c = cols(clase);
    onda(P, '#fff', 130, 8, 0.6, 0.6); onda(P, c[0], 170, 6, 0.8, 0.6);
    for (let i = 0; i < (POCO ? 30 : 70); i++) {
      const an = R(0, 6.28), v = R(150, 620);
      add({ tipo: i % 3 ? 'chispa' : 'esquirla', x: P.x, y: P.y, vx: Math.cos(an) * v, vy: Math.sin(an) * v - 120, g: 700, drag: 0.95, tam: i % 3 ? R(2, 3.5) : R(4, 9), rot: R(0, 6), vr: R(-15, 15), col: i % 4 === 0 ? '#ffffff' : c[i % 3], vida: R(0.6, 1.2) });
    }
    for (let i = 0; i < 14; i++) add({ tipo: 'humo', x: P.x + R(-20, 20), y: P.y + R(-20, 20), vx: R(-60, 60), vy: R(-90, -20), g: -20, tam: R(20, 40), col: i % 2 ? '#3a3a50' : '#ff7a2e', vida: R(0.8, 1.4) });
  }
  /* energía que vuela de la carta a la criatura */
  function chispasCarta(A, B, col) { arranca(); for (let i = 0; i < 14; i++) { const k = i / 14; add({ tipo: 'punto', x: A.x + (B.x - A.x) * k + R(-6, 6), y: A.y + (B.y - A.y) * k + R(-6, 6), tam: R(2, 4), col, vida: 0.35 + k * 0.2 }); } }
  return { montar, tam, temblor, destello, proyectil, impacto, escudo, cura, estado, veneno, explosion, chispasCarta, onda: (P, c, f) => { arranca(); onda(P, c, f, 4, 0.5, 0.6); }, POCO };
})();
