/* =========================================================
   CRIATURIX · Futurmovil — juego (interfaz)
   ========================================================= */
'use strict';
const CFG = {
  API: 'https://script.google.com/macros/s/AKfycbzcvbIi3O4cTPtVQlPJ-EZXpalqK4L6IUtMQjGqsz-DAoorGUqyi_4l-KG3Ii8DFSkX/exec',
  GOOGLE: '454055120059-nuhaop4r62urc3u036cc3grpqo71ulg7.apps.googleusercontent.com',
  URL: 'https://puntofibra.github.io/criaturix/',
  WHATSAPP: '34633200100'
};

/* ---------- utilidades ---------- */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = n => (Number(n) || 0).toLocaleString('es-ES');
const euros = c => ((Number(c) || 0) / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const espera = ms => new Promise(r => setTimeout(r, ms));
const vib = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
function store(k, v) { try { localStorage.setItem('cx_' + k, JSON.stringify(v)); } catch (e) {} }
function load(k, d) { try { const v = localStorage.getItem('cx_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
const esMovil = matchMedia('(pointer:coarse)').matches;
const colClase = c => (CX.CLASES[c] || {}).col || '#00e5ff';
const nomCr = c => c.nombre || ('Criaturix #' + c.num);
function tiempo(ms) {
  if (ms <= 0) return '¡Listo!';
  const s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}:${String(ss).padStart(2, '0')}`;
}

/* =========================================================
   AUDIO (síntesis, sin archivos)
   ========================================================= */
const Son = (() => {
  let ac = null, master, mus, on = load('son', true), musT = null, paso = 0, prox = 0;
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ac = new AC(); master = ac.createGain(); master.gain.value = on ? 0.8 : 0;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; master.connect(comp); comp.connect(ac.destination);
    mus = ac.createGain(); mus.gain.value = modo === 'batalla' ? 0.3 : 0.16; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800; mus.connect(lp); lp.connect(master);
    prox = ac.currentTime + 0.1; musT = setInterval(musica, 30);
  }
  function tono(f, d, tipo, vol, slide, delay, dest) {
    if (!ac) return; const t = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo || 'sine'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + d + 0.05);
  }
  function ruido(d, vol, f1, f2, delay) {
    if (!ac) return; const t = ac.currentTime + (delay || 0), n = ac.sampleRate * d, b = ac.createBuffer(1, n, ac.sampleRate), x = b.getChannelData(0);
    for (let i = 0; i < n; i++) x[i] = Math.random() * 2 - 1;
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = b; f.type = 'lowpass';
    f.frequency.setValueAtTime(f1, t); f.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(f); f.connect(g); g.connect(master); s.start(t);
  }
  // música: 'menu' = arpegio synthwave suave · 'batalla' = tema de combate · '' = silencio
  const acordes = [[57, 60, 64, 69], [53, 57, 60, 65], [48, 55, 60, 64], [55, 59, 62, 67]];
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  let modo = 'menu', ruidoBuf = null, musVol = 0.16;
  function nBuf() { if (ruidoBuf) return ruidoBuf; const n = ac.sampleRate, b = ac.createBuffer(1, n, ac.sampleRate), x = b.getChannelData(0); for (let i = 0; i < n; i++) x[i] = Math.random() * 2 - 1; return (ruidoBuf = b); }
  // nota con filtro y desafinado (para bajo, pads y metales); t = tiempo absoluto
  function voz(f, t, d, o) {
    o = o || {}; const g = ac.createGain(), fl = ac.createBiquadFilter(); fl.type = o.ft || 'lowpass'; fl.Q.value = o.q || 1;
    const f0 = o.f0 || 2400, f1 = o.f1 || f0; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(Math.max(60, f1), t + d);
    const at = o.at || 0.008, v = o.vol || 0.1;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + at); g.gain.setValueAtTime(v, t + Math.max(at, d * (o.sus || 0.1))); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    (o.det || [0]).forEach(dt => { const os = ac.createOscillator(); os.type = o.tipo || 'sawtooth'; os.frequency.setValueAtTime(f, t); os.detune.value = dt; if (o.slide) os.frequency.exponentialRampToValueAtTime(f * o.slide, t + d); os.connect(fl); os.start(t); os.stop(t + d + 0.05); });
    fl.connect(g); g.connect(o.dest || master);
  }
  function golpeRuido(t, d, vol, ft, f, dest, q) {
    const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = nBuf(); fl.type = ft; fl.frequency.value = f; fl.Q.value = q || 0.8;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(fl); fl.connect(g); g.connect(dest || master); s.start(t, Math.random() * 0.5, d + 0.05);
  }
  function bombo(t, dest, v) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(155, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.22); g.gain.setValueAtTime(v || 0.9, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32); o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.35); }
  // tema de batalla: La menor, Am · F · C · G, 128 BPM
  const BAT = { bpm: 128, acordes: [[45, 57, 60, 64], [41, 57, 60, 65], [48, 55, 60, 64], [43, 55, 59, 62]],
    melA: [76, -1, 74, 76, -1, 72, 74, -1, 72, -1, 69, -1, 71, 72, 74, -1], melB: [77, -1, 76, 74, -1, 72, -1, 74, 76, -1, 79, -1, 76, -1, 74, -1] };
  function pasoBatalla(t, i) {
    const bar = Math.floor(i / 16) % 4, st = i % 16, ch = BAT.acordes[bar], sec = Math.floor(i / 64) % 4, d16 = 60 / BAT.bpm / 4;
    const intro = Math.floor(i / 16) < 2;
    if (!intro || st % 8 === 0) { if (st % 4 === 0) bombo(t, mus, 0.85); }
    if (!intro && (st === 4 || st === 12)) { golpeRuido(t, 0.18, 0.5, 'bandpass', 1900, mus, 0.7); voz(190, t, 0.12, { tipo: 'triangle', vol: 0.12, f0: 3000, slide: 0.6, dest: mus }); }
    if (st % 2 === 0 || sec >= 1) golpeRuido(t, st % 4 === 2 ? 0.07 : 0.035, st % 4 === 2 ? 0.22 : 0.09, 'highpass', 8500, mus);
    if (st === 14 && bar === 3) golpeRuido(t, 0.3, 0.25, 'highpass', 5000, mus);   // platillo antes de volver a empezar
    // bajo: corcheas con octava
    if (st % 2 === 0) { const n = ch[0] + (st % 8 === 6 ? 12 : 0); voz(mtof(n), t, d16 * 1.8, { tipo: 'sawtooth', vol: 0.2, f0: 900, f1: 180, q: 6, det: [-6, 6], dest: mus }); }
    // pad al empezar cada compás
    if (st === 0) ch.slice(1).forEach(n => voz(mtof(n), t, d16 * 16, { tipo: 'sawtooth', vol: 0.028, f0: 600, f1: 1500, at: 0.3, sus: 0.8, det: [-12, 0, 12], dest: mus }));
    // arpegio de 16avas desde la segunda vuelta
    if (sec >= 1 && !intro) { const n = ch[1 + (st % 3)] + 12; voz(mtof(n), t, d16 * 0.9, { tipo: 'square', vol: 0.026, f0: 3200, f1: 900, dest: mus }); }
    // melodía heroica en vueltas alternas
    if (sec % 2 === 1 || sec === 2) { const m = (bar % 2 ? BAT.melB : BAT.melA)[st]; if (m > 0) voz(mtof(m), t, d16 * 2.2, { tipo: 'sawtooth', vol: 0.05, f0: 2600, f1: 1400, det: [-8, 8], dest: mus }); }
  }
  function musica() {
    if (!ac || !on || !load('mus', true) || !modo) { if (ac) prox = ac.currentTime + 0.1; return; }
    const bat = modo === 'batalla', dur = bat ? 60 / BAT.bpm / 4 : 0.15;
    while (prox < ac.currentTime + 0.15) {
      if (bat) pasoBatalla(prox, paso);
      else {
        const ac4 = acordes[Math.floor(paso / 16) % 4], n = ac4[paso % 4] + (paso % 8 >= 4 ? 12 : 0);
        tono(mtof(n), 0.22, 'triangle', 0.05, 0, prox - ac.currentTime, mus);
        if (paso % 16 === 0) tono(mtof(ac4[0] - 24), 1.6, 'sawtooth', 0.035, 0, prox - ac.currentTime, mus);
      }
      paso++; prox += dur;
    }
  }
  function ponModo(m) {
    if (m === modo) return; modo = m; paso = 0;
    if (!ac) return;
    const v = m === 'batalla' ? 0.3 : 0.16, t = ac.currentTime;
    mus.gain.cancelScheduledValues(t); mus.gain.setValueAtTime(0.0001, t); mus.gain.exponentialRampToValueAtTime(v, t + 0.6); prox = t + 0.08;
  }
  // notas de la escala (La menor pentatónica) para que las cartas suenen con la música
  const PENTA = [69, 72, 74, 76, 79, 81, 84, 86, 88, 91];
  let pausadoFondo = false;
  function fondo(oculto) {   // pantalla apagada / otra app: se calla la música
    if (!ac) return;
    if (oculto) { if (ac.state === 'running') { pausadoFondo = true; ac.suspend().catch(() => {}); } }
    else if (pausadoFondo) { pausadoFondo = false; ac.resume().catch(() => {}); prox = ac.currentTime + 0.1; }
  }
  document.addEventListener('visibilitychange', () => fondo(document.visibilityState !== 'visible'));
  addEventListener('pagehide', () => fondo(true));
  addEventListener('pageshow', () => { if (document.visibilityState === 'visible') fondo(false); });
  return {
    init, get on() { return on; }, callar() { if (ac) { pausadoFondo = false; ac.suspend().catch(() => {}); } },
    alternar() { on = !on; store('son', on); if (master) master.gain.value = on ? 0.8 : 0; return on; },
    click() { tono(880, 0.06, 'square', 0.06); },
    modo: ponModo,
    carta(n) {   // elegir carta: nota de la escala que sube con cada carta elegida + chasquido
      if (!ac) return; const t = ac.currentTime, k = Math.max(0, Math.min(PENTA.length - 1, n || 0)), f = mtof(PENTA[k]);
      golpeRuido(t, 0.05, 0.18, 'highpass', 4500);
      voz(f, t, 0.28, { tipo: 'triangle', vol: 0.16, f0: 5000, f1: 1800 }); voz(f * 2, t + 0.012, 0.16, { tipo: 'sine', vol: 0.06 });
    },
    quita() { if (!ac) return; const t = ac.currentTime; voz(mtof(64), t, 0.16, { tipo: 'triangle', vol: 0.1, f0: 2000, slide: 0.7 }); golpeRuido(t, 0.06, 0.08, 'lowpass', 1500); },
    golpe(fuerte) { ruido(0.18, fuerte ? 0.5 : 0.32, 3000, 200); tono(fuerte ? 90 : 140, 0.22, 'sawtooth', 0.2, 0.4); },
    crit() { ruido(0.3, 0.5, 6000, 300); tono(220, 0.3, 'square', 0.18, 0.3); tono(1200, 0.2, 'sine', 0.12, 2, 0.05); },
    escudo() { tono(400, 0.25, 'sine', 0.14, 2.2); tono(800, 0.2, 'sine', 0.08, 1.6, 0.05); },
    cura() { [523, 659, 784].forEach((f, i) => tono(f, 0.25, 'sine', 0.12, 1.02, i * 0.07)); },
    falla() { tono(300, 0.25, 'sine', 0.12, 0.5); },
    cae() { tono(400, 0.7, 'sawtooth', 0.16, 0.12); ruido(0.5, 0.2, 2000, 100, 0.1); },
    estado() { tono(980, 0.12, 'square', 0.07, 0.7); tono(740, 0.12, 'square', 0.06, 0.7, 0.08); },
    turno() { tono(330, 0.1, 'square', 0.09); tono(495, 0.14, 'square', 0.09, 1, 0.09); },
    gana() { [523, 659, 784, 1047, 1319].forEach((f, i) => tono(f, 0.35, 'triangle', 0.16, 1, i * 0.11)); },
    pierde() { [392, 330, 262, 196].forEach((f, i) => tono(f, 0.4, 'sawtooth', 0.1, 1, i * 0.16)); },
    moneda() { tono(988, 0.08, 'square', 0.1); tono(1319, 0.25, 'square', 0.1, 1, 0.08); },
    eclosion() { ruido(0.6, 0.4, 8000, 400); [392, 523, 659, 784, 1047].forEach((f, i) => tono(f, 0.4, 'sine', 0.14, 1, 0.3 + i * 0.08)); },
    nfc() { tono(1500, 0.08, 'sine', 0.12); tono(2000, 0.12, 'sine', 0.12, 1, 0.1); },
    // combate: disparo según la clase, impacto, K.O., carta lanzada, VS
    disparo(cl) {
      if (cl === 'plasma') { ruido(0.35, 0.3, 900, 3500); tono(180, 0.3, 'sawtooth', 0.1, 0.5); }
      else if (cl === 'voltio') { tono(1800, 0.18, 'square', 0.08, 0.15); ruido(0.2, 0.25, 9000, 2000); tono(90, 0.15, 'sawtooth', 0.12, 1.5); }
      else if (cl === 'bio') { tono(300, 0.25, 'sine', 0.16, 2.4); tono(600, 0.18, 'triangle', 0.06, 1.8, 0.05); }
      else if (cl === 'cromo') { tono(1047, 0.35, 'sine', 0.1, 0.98); tono(2890, 0.25, 'sine', 0.05, 0.97); ruido(0.08, 0.25, 7000, 3000); }
      else if (cl === 'cuantico') { tono(400, 0.22, 'sine', 0.13, 4); tono(1600, 0.18, 'square', 0.04, 0.5, 0.04); }
      else { tono(160, 0.45, 'sawtooth', 0.12, 0.45); tono(163, 0.45, 'sawtooth', 0.1, 0.42); ruido(0.4, 0.15, 600, 200); }
    },
    impacto(fuerte, crit) { ruido(crit ? 0.45 : 0.22, crit ? 0.7 : fuerte ? 0.55 : 0.4, crit ? 5000 : 2600, 120); tono(crit ? 70 : fuerte ? 85 : 120, crit ? 0.4 : 0.22, 'sine', 0.45, 0.35); if (crit) tono(1400, 0.25, 'square', 0.08, 0.4, 0.04); },
    ko() { ruido(1.1, 0.6, 3000, 60); tono(60, 0.9, 'sine', 0.5, 0.4); tono(400, 0.6, 'sawtooth', 0.12, 0.1, 0.05); },
    lanza(n) {   // carta que sale volando: barrido de aire + campanada afinada
      if (!ac) return; const t = ac.currentTime, f = mtof(PENTA[Math.min(PENTA.length - 1, 2 + (n || 0))]);
      const s0 = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s0.buffer = nBuf(); fl.type = 'bandpass'; fl.Q.value = 1.4;
      fl.frequency.setValueAtTime(700, t); fl.frequency.exponentialRampToValueAtTime(6500, t + 0.22); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      s0.connect(fl); fl.connect(g); g.connect(master); s0.start(t, Math.random() * 0.5, 0.32);
      voz(f, t + 0.05, 0.5, { tipo: 'sine', vol: 0.13 }); voz(f * 1.5, t + 0.05, 0.35, { tipo: 'triangle', vol: 0.05, f0: 4000, f1: 1200 });
    },
    victoria() {   // fanfarria de metales
      if (!ac) return; const t = ac.currentTime + 0.05, met = (n, a, d, v) => voz(mtof(n), t + a, d, { tipo: 'sawtooth', vol: v || 0.09, f0: 900, f1: 3200, at: 0.03, sus: 0.6, det: [-10, 0, 10] });
      bombo(t, master, 1); golpeRuido(t, 1.4, 0.35, 'highpass', 4000);
      [[60, 0], [64, 0.16], [67, 0.32]].forEach(([n, a]) => met(n, a, 0.22));
      [60, 64, 67, 72].forEach(n => met(n, 0.5, 1.9, 0.07)); met(48, 0.5, 1.9, 0.09);
      bombo(t + 0.5, master, 1); golpeRuido(t + 0.5, 2.2, 0.4, 'highpass', 6000);
      [84, 88, 91, 96].forEach((n, i) => voz(mtof(n), t + 0.55 + i * 0.07, 0.9, { tipo: 'sine', vol: 0.06 }));
    },
    derrota() {
      if (!ac) return; const t = ac.currentTime + 0.05;
      [[57, 0], [53, 0.35], [52, 0.7]].forEach(([n, a]) => voz(mtof(n), t + a, 0.6, { tipo: 'sawtooth', vol: 0.08, f0: 1400, f1: 300, det: [-12, 12] }));
      voz(mtof(45), t + 1.05, 2.2, { tipo: 'sawtooth', vol: 0.1, f0: 900, f1: 120, det: [-15, 0, 15] }); bombo(t + 1.05, master, 0.8);
    },
    ping() {   // pitido de sonar al pasar el barrido
      if (!ac) return; const t = ac.currentTime;
      [0, 0.22, 0.44].forEach((dl, i) => voz(1320, t + dl, 0.5, { tipo: 'sine', vol: 0.07 / (i + 1), f0: 4000 }));
      voz(660, t, 0.35, { tipo: 'triangle', vol: 0.03 });
    },
    grieta(i) {   // crujido de cáscara, más fuerte en cada fase
      if (!ac) return; const t = ac.currentTime, f = 1 + (i || 0) * .35;
      golpeRuido(t, .05, .35 * f, 'highpass', 2500); golpeRuido(t + .03, .09, .25 * f, 'bandpass', 1400, master, 3); golpeRuido(t + .07, .05, .18 * f, 'highpass', 4200);
      voz(90 + i * 15, t, .18, { tipo: 'sine', vol: .25 * f, slide: .5 });
      if (i >= 3) voz(mtof(76 + i), t + .05, .6, { tipo: 'sine', vol: .06 });
    },
    cuenta() { if (!ac) return; voz(mtof(88 + Math.floor(Math.random() * 3) * 2), ac.currentTime, 0.07, { tipo: 'square', vol: 0.04, f0: 5000 }); },
    vs() { ruido(0.8, 0.45, 200, 4000); tono(55, 1, 'sawtooth', 0.22, 1); tono(110, 0.6, 'square', 0.1, 1, 0.5); tono(880, 0.4, 'square', 0.06, 1, 0.55); },
    ronda() { tono(660, 0.08, 'square', 0.07); tono(990, 0.16, 'square', 0.07, 1, 0.08); ruido(0.15, 0.12, 4000, 8000, 0.04); }
  };
})();

/* =========================================================
   FONDO ANIMADO (rejilla neón + partículas)
   ========================================================= */
(() => {
  const cv = $('#bg'), cx = cv.getContext('2d'); let W, H, dpr, t = 0;
  const parts = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random(), c: ['#19ff6a', '#00e5ff', '#ff2bd6', '#b14bff'][Math.floor(Math.random() * 4)] }));
  function tam() { dpr = Math.min(2, devicePixelRatio || 1); W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr; }
  addEventListener('resize', tam); tam();
  function frame() {
    t += 0.004;
    cx.fillStyle = '#05060f'; cx.fillRect(0, 0, W, H);
    const hz = H * 0.58;
    const g = cx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#070a1c'); g.addColorStop(0.58, '#0b0f2a'); g.addColorStop(1, '#05060f');
    cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    const sol = cx.createRadialGradient(W / 2, hz, 0, W / 2, hz, H * 0.5); sol.addColorStop(0, 'rgba(255,43,214,.16)'); sol.addColorStop(1, 'rgba(255,43,214,0)');
    cx.fillStyle = sol; cx.fillRect(0, 0, W, H);
    cx.lineWidth = 1 * dpr;
    for (let i = 0; i < 18; i++) {   // líneas horizontales que se acercan
      const p = ((i / 18) + t * 2) % 1, y = hz + Math.pow(p, 2.2) * (H - hz);
      cx.strokeStyle = `rgba(0,229,255,${0.05 + p * 0.25})`; cx.beginPath(); cx.moveTo(0, y); cx.lineTo(W, y); cx.stroke();
    }
    for (let i = -14; i <= 14; i++) {
      cx.strokeStyle = 'rgba(25,255,106,.12)'; cx.beginPath(); cx.moveTo(W / 2 + i * W * 0.012, hz); cx.lineTo(W / 2 + i * W * 0.18, H); cx.stroke();
    }
    parts.forEach(p => {
      p.y -= 0.0006 * (0.4 + p.z); if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
      const r = (0.6 + p.z * 1.8) * dpr;
      cx.fillStyle = p.c; cx.globalAlpha = 0.25 + p.z * 0.5; cx.beginPath(); cx.arc(p.x * W + Math.sin(t * 6 + p.z * 9) * 8 * dpr, p.y * H, r, 0, 7); cx.fill();
    });
    cx.globalAlpha = 1;
    if (!document.hidden) requestAnimationFrame(frame); else setTimeout(() => requestAnimationFrame(frame), 500);
  }
  frame();
})();

/* =========================================================
   API Y SESIÓN
   ========================================================= */
let SES = load('ses', null), DATA = { criaturas: [], reglas: {}, aviso: '' }, VISTA = '', trasSesion = null;
function api(accion, datos) {
  return fetch(CFG.API, { method: 'POST', body: JSON.stringify(Object.assign({ accion }, datos || {})) })
    .then(r => r.json())
    .then(d => { if (!d.ok && d.error === 'SESION') { cerrarSesion(true); d.error = 'Tu sesión ha caducado. Vuelve a entrar.'; } return d; })
    .catch(() => ({ ok: false, error: 'Sin conexión. Inténtalo otra vez.' }));
}
function conSes(accion, datos) { return api(accion, Object.assign({ token: SES && SES.token }, datos || {})); }
function aplicaPerfil(p) {
  if (!p || !SES) return;
  const antes = SES.perfil || {};
  SES.perfil = p; store('ses', SES); pintaTop();
  if (antes.chips != null && p.chips !== antes.chips) { $('#tChips').classList.remove('pop'); void $('#tChips').offsetWidth; $('#tChips').classList.add('pop'); }
  if (antes.creditos != null && p.creditos !== antes.creditos) { $('#tCred').classList.remove('pop'); void $('#tCred').offsetWidth; $('#tCred').classList.add('pop'); }
}
function refrescar() {
  return conSes('yo').then(d => {
    if (!d.ok) return d;
    DATA.criaturas = d.criaturas; DATA.reglas = d.reglas; DATA.aviso = d.aviso;
    aplicaPerfil(d.perfil); return d;
  });
}
function pintaTop() {
  if (!SES) return;
  const p = SES.perfil;
  $('#tChips span').textContent = fmt(p.chips);
  $('#tCred span').textContent = fmt(p.creditos);
  $('#tEner span').textContent = p.energia + '/' + p.energiaMax;
  $('#tYo span').textContent = (p.usuario || '?')[0].toUpperCase();
  $('#tSonido').classList.toggle('off', !Son.on);
}
function entrarSesion(d) {
  SES = { token: d.token, perfil: d.perfil }; store('ses', SES);
  Son.init(); Son.moneda();
  toast('¡Hola, ' + d.perfil.usuario + '!', 'ok');
  refrescar().then(() => { if (trasSesion) { const f = trasSesion; trasSesion = null; return f(); } ir('inicio'); });
}
function cerrarSesion(silencio) {
  if (SES && !silencio) api('salir', { token: SES.token });
  SES = null; store('ses', null); DATA = { criaturas: [], reglas: {}, aviso: '' };
  ir('login');
}
function mia(id) { return DATA.criaturas.find(c => c.id === id); }

/* =========================================================
   INTERFAZ COMÚN
   ========================================================= */
function toast(t, tipo) { const d = document.createElement('div'); d.className = 'toast ' + (tipo || ''); d.textContent = t; $('#toasts').appendChild(d); setTimeout(() => d.remove(), 3500); }
function banner(txt, sub, col) {
  const b = $('#banner'); b.innerHTML = (sub ? `<small>${esc(sub)}</small>` : '') + `<span>${esc(txt)}</span>`;
  b.style.setProperty('--bc', col || '#19ff6a'); b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
}
let alCerrarModal = null;
function modal(html, opts) {
  opts = opts || {};
  const m = $('#modal'); $('.mCont', m).innerHTML = html; $('.mCaja', m).className = 'mCaja ' + (opts.cls || '');
  m.classList.remove('oculto'); $('.mCaja', m).scrollTop = 0; alCerrarModal = opts.alCerrar || null;
  $('.mCerrar', m).classList.toggle('oculto', !!opts.sinCerrar);
  return $('.mCont', m);
}
function cerrarModal() { $('#modal').classList.add('oculto'); $('.mCont', $('#modal')).innerHTML = ''; if (alCerrarModal) { const f = alCerrarModal; alCerrarModal = null; f(); } }
$('#modal .mFondo').onclick = () => { if (!$('#modal .mCerrar').classList.contains('oculto')) cerrarModal(); };
$('#modal .mCerrar').onclick = () => { Son.click(); cerrarModal(); };
function confirmar(titulo, texto, si, clsBtn) {
  return new Promise(ok => {
    const c = modal(`<h2>${esc(titulo)}</h2><p class="nota">${texto}</p><div class="acciones" style="justify-content:flex-end"><button class="btn sec" data-r="0">Cancelar</button><button class="btn ${clsBtn || ''}" data-r="1">${esc(si || 'Aceptar')}</button></div>`, { alCerrar: () => ok(false) });
    $$('[data-r]', c).forEach(b => b.onclick = () => { alCerrarModal = null; cerrarModal(); ok(b.dataset.r === '1'); });
  });
}
function ocupado(btn, si) { if (!btn) return; if (si) { btn.dataset.t = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="orb">···</span>'; } else { btn.disabled = false; if (btn.dataset.t) btn.innerHTML = btn.dataset.t; } }
/* celebración pro (huevo creado / eclosión): rayos de luz, onda y chispas */
function celebrar(el, col) {
  if (!el) return;
  const d = document.createElement('div'); d.className = 'celeb'; d.style.setProperty('--fc', col || '#ffd23f');
  d.innerHTML = '<i class="fcRayos"></i><i class="fcAro"></i><canvas></canvas>'; el.prepend(d);
  const cv = $('canvas', d), g = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), P = [], R = (a, b) => a + Math.random() * (b - a);
  const W = cv.width = d.clientWidth * dpr, H = cv.height = d.clientHeight * dpr, cols = [col, '#ffffff', '#fff3b0', col];
  const burst = (n, v) => { for (let i = 0; i < n; i++) { const an = R(0, 6.283), sp = R(v * .25, v) * dpr; P.push({ x: W / 2, y: H / 2, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, t: 0, v: R(.8, 1.6), r: R(1.2, 3) * dpr, c: cols[i % 4] }); } };
  burst(120, 520); setTimeout(() => burst(60, 320), 350);
  let ult = performance.now();
  (function f(now) {
    if (!cv.isConnected) return; const dt = Math.min(.05, (now - ult) / 1000); ult = now;
    if (P.length < 160 && Math.random() < .5) P.push({ x: R(W * .2, W * .8), y: H, vx: R(-20, 20) * dpr, vy: R(-120, -50) * dpr, t: 0, v: R(1.5, 2.6), r: R(1, 2.2) * dpr, c: cols[Math.floor(R(0, 4))], sube: 1 });
    g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'lighter';
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.t += dt; if (p.t > p.v) { P.splice(i, 1); continue; }
      if (!p.sube) { p.vx *= .97; p.vy = p.vy * .97 + 160 * dpr * dt; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      const a = Math.min(1, (p.v - p.t) / .5), gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
      gr.addColorStop(0, '#fff'); gr.addColorStop(.3, p.c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = a; g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.r * 3, 0, 6.283); g.fill();
      if (!p.sube) { g.strokeStyle = p.c; g.lineWidth = p.r * .8; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * .04, p.y - p.vy * .04); g.stroke(); }
    }
    g.globalAlpha = 1; requestAnimationFrame(f);
  })(ult);
}
function confeti(n) {
  for (let i = 0; i < (n || 70); i++) {
    const d = document.createElement('i'); d.className = 'confeti';
    d.style.left = Math.random() * 100 + 'vw'; d.style.background = ['#19ff6a', '#00e5ff', '#ff2bd6', '#ffd23f', '#b14bff'][i % 5];
    d.style.animationDuration = (1.8 + Math.random() * 2) + 's'; d.style.animationDelay = Math.random() * 0.6 + 's';
    document.body.appendChild(d); setTimeout(() => d.remove(), 4500);
  }
}

/* ---------- piezas visuales reutilizables ---------- */
const ICO_SLOT = {   // iconos del tipo de pieza (esquina de la carta)
  boca: '<svg viewBox="0 0 24 24"><path class="b" d="M3 8.5Q12 4 21 8.5L19.5 15Q12 20.5 4.5 15Z"/><path class="o" d="M5.5 10.2 7 13l1.6-2.6L10.2 13.4 12 10.4l1.8 3 1.6-3 1.6 2.6 1.5-2.8"/><path class="l" d="M4 9Q12 5.2 20 9"/></svg>',
  cuerno: '<svg viewBox="0 0 24 24"><path class="b" d="M5 21.5Q5.5 11 19.5 2.5Q14.5 12 14.8 21.5Z"/><path class="o" d="M7.6 16.5Q11 15.6 14.6 16.4M8.8 12.2Q12 11.3 15.2 11.8M10.6 8.2Q13.2 7.4 16.2 7.8"/><path class="l" d="M7 20Q8 12 17.5 4.8"/></svg>',
  espalda: '<svg viewBox="0 0 24 24"><path class="b" d="M4 21h7l-1-6H5z M13 21h7l-1-6h-5z"/><path class="f" d="M7.5 15q-3-4 0-9 1 3 2.2 3.5Q9 6 11 3q1.5 5-.5 8.5Q10 14 7.5 15z M16.5 15q-3-4 0-9 1 3 2.2 3.5Q18 6 20 3q1.5 5-.5 8.5Q19 14 16.5 15z"/></svg>',
  cola: '<svg viewBox="0 0 24 24"><path class="b" d="M21 15.5Q14 23 7 18Q2 14 5.5 8.5Q8 5 11 7.5Q8 9 8.2 12.4Q9 16.5 14 16.4Q17.5 16.2 21 15.5Z"/><path class="f" d="M11 7.5 13.5 2.5 15.5 8.2Z"/><path class="o" d="M6.2 15.5 8.4 14M9.6 18.2 10.6 16.2M13.4 19.4 13.6 17"/></svg>',
  ojos: '<svg viewBox="0 0 24 24"><path class="b" d="M2 12Q12 2 22 12Q12 22 2 12Z"/><circle cx="12" cy="12" r="4.2" fill="#05060f"/><circle class="f" cx="12" cy="12" r="2.4"/><circle cx="13.3" cy="10.7" r="1" fill="#fff"/></svg>',
  antenas: '<svg viewBox="0 0 24 24"><path class="o" d="M8 22V9M16 22V9" style="stroke-width:2.2"/><circle class="f" cx="8" cy="6" r="3"/><circle class="f" cx="16" cy="6" r="3"/></svg>'
};
const ARTE_CORTE = { espalda: [20, 0, 420, 330] };   // recorte del cuerpo (marco 1024x907) para la espalda: los cañones
function arteCarta(k) {
  const c = CX.CLASES[k.clase] ? k.clase : 'cromo', v = '?v=12';
  let img;
  if (k.slot === 'espalda') {
    const [x, y, w, h] = ARTE_CORTE.espalda, esc = 100 / w;   // background que enseña la zona de los cañones
    img = `<i class="kImg corte" style="background-image:url(img/piezas/cuerpo_${c}.webp${v});background-size:${1024 * esc}% auto;background-position:${x / (1024 - w) * 100}% ${y / (907 - h) * 100}%;aspect-ratio:${w}/${h}"></i><i class="kFx"></i>`;
  } else {
    const f = { boca: 'cara_boca_', cuerno: 'cuerno_', cola: 'cola_', ojos: 'cara_ojo_' }[k.slot] || 'cuerno_';
    img = `<img class="kImg" src="img/piezas/${f}${c}.webp${v}" alt="" loading="lazy">`;
  }
  return `<div class="kArte s-${k.slot}">${img}</div>`;
}
function cartaHTML(k, o) {
  o = o || {};
  const txt = CX.textoCarta(k);
  return `<button class="carta ${o.cls || ''}" style="--cc:${colClase(k.clase)}" ${o.attr || ''}>
    ${arteCarta(k)}
    <span class="kCoste">${k.c}</span><span class="kSlot">${ICO_SLOT[k.slot] || ''}</span>
    <div class="kNom">${esc(k.n)}</div>
    <div class="kVal">${k.a ? `<span class="a">⚔${k.a}</span>` : ''}${k.e ? `<span class="e">⛨${k.e}</span>` : ''}</div>
    <div class="kTxt">${esc(txt)}</div></button>`;
}
function claseHTML(c) { const K = CX.CLASES[c]; return K ? `<span class="clase" style="--cc:${K.col}">${K.nom}</span>` : '<span class="clase" style="--cc:#56606c">???</span>'; }
function purezaHTML(g) { const n = CX.pureza(g); return `<span class="pur" title="Pureza ${n}/6" style="--cc:${colClase(g.c)}">${[0, 1, 2, 3, 4, 5].map(i => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`; }
function dibujo(c, cls) {
  if (c.tipo === 'huevo') return ROBOT.huevo(c.clase, { cls: (cls || '') + (c.eclosion && c.eclosion <= Date.now() && c.dueno === (SES && SES.perfil.id) ? ' listo' : '') });
  return ROBOT.svg(c.genes, { cls });
}
function tcHTML(c, o) {
  o = o || {};
  const huevo = c.tipo === 'huevo', g = c.genes, enEq = SES && SES.perfil.equipo.indexOf(c.id) >= 0;
  let etq = '';
  if (c.estado === 'venta' && !o.mercado) etq = '<span class="etq venta">EN VENTA</span>';
  else if (c.estado === 'reservado') etq = '<span class="etq reservado">RESERVADA</span>';
  else if (huevo && c.eclosion <= Date.now() && !o.mercado) etq = '<span class="etq listo">¡LISTO!</span>';
  else if (enEq && !o.mercado) etq = '<span class="etq equipo">EQUIPO</span>';
  else if (c.inicial) etq = '<span class="etq inicial">INICIAL</span>';
  return `<div class="tc ${o.cls || ''}" data-id="${c.id}" style="--cc:${huevo ? '#19ff6a' : colClase(c.clase)}">
    <span class="tcNum">#${c.num}</span>${etq}${dibujo(c)}
    <div class="tcNom">${esc(huevo ? (c.nombre || 'Huevo #' + c.num) : nomCr(c))}</div>
    <div class="tcInfo">${huevo ? '<span class="clase" style="--cc:#56606c">Huevo</span>' : claseHTML(c.clase) + purezaHTML(g) + `<span>♥ ${c.crias}/${DATA.reglas.maxCrias || 7}</span>`}</div>
    ${o.mercado ? `<div class="tcPrecio">${euros(c.precio)} €</div><div class="tcInfo">${c.dueno === 'TIENDA' ? '<span style="color:var(--v)">★ Tienda oficial</span>' : 'de ' + esc(c.duenoNombre)}</div>` : ''}
  </div>`;
}

/* ---------- comprar créditos (1 céntimo = 1 crédito) ---------- */
const PACKS_CR = [{ c: 500 }, { c: 1000, pop: 1 }, { c: 2500 }, { c: 5000, top: 1 }, { c: 10000 }];
function comprarCreditos() {
  if (!SES) return;
  Son.init(); Son.click();
  const m = modal(`<div class="crCompra"><div class="crCab"><i class="ic-cred"></i><div><h2>Comprar créditos</h2><p class="nota">Tienes <b style="color:var(--c)">${fmt(SES.perfil.creditos)} créditos</b> · 1 crédito = 1 céntimo</p></div></div>
    <div class="crPacks">${PACKS_CR.map(p => `<button class="crPack${p.pop ? ' pop' : ''}${p.top ? ' top' : ''}" data-c="${p.c}">${p.pop ? '<span class="crEtq">MÁS POPULAR</span>' : p.top ? '<span class="crEtq oro">MEJOR OPCIÓN</span>' : ''}
      <i class="ic-cred"></i><b>${fmt(p.c)}</b><small>créditos</small><span class="crPrecio">${euros(p.c)} €</span></button>`).join('')}</div>
    <p class="nota" style="text-align:center;margin-top:12px">Pagas con myPOS y, en cuanto Futurmovil confirme el pago, los créditos aparecen en tu cuenta.</p>
    <div class="acciones" style="justify-content:center"><button class="btn sec peq" id="crMovs">VER MIS MOVIMIENTOS</button></div></div>`, { cls: 'ancha' });
  $('#crMovs', m).onclick = () => { cerrarModal(); ir('cuenta'); };
  $$('.crPack', m).forEach(b => b.onclick = () => {
    const c = +b.dataset.c; ocupado(b, true);
    conSes('recargar', { cantidad: c }).then(d => {
      ocupado(b, false); if (!d.ok) return toast(d.error, 'err');
      Son.moneda && Son.moneda();
      const waTxt = `Hola, soy ${SES.perfil.usuario} y he pagado ${euros(c)} € por ${fmt(c)} créditos en CRIATURIX, pero todavía no me han llegado. Pedido: ${d.pedido.id}`;
      const m2 = modal(`<div class="pago crCompra"><h2 style="padding:0">RECARGA DE ${fmt(c)} CRÉDITOS</h2><div class="imp">${euros(c)} €</div>
        <a class="btn oro grande bloque" id="crPagar" href="${d.pedido.url}" target="_blank" rel="noopener">PAGAR CON myPOS · ${euros(c)} €</a>
        <div class="crPasos"><div><b>1</b><span>Paga <b>${euros(c)} €</b> en la ventana de myPOS que se ha abierto.</span></div>
          <div><b>2</b><span>Futurmovil comprobará el pago a mano. En cuanto lo confirme, se sumarán <b style="color:var(--c)">${fmt(c)} créditos</b> a tu cuenta automáticamente.</span></div>
          <div><b>3</b><span>Puedes ver el estado en <b>Mercado › Mis compras</b>. Tu número de pedido es <b>${esc(d.pedido.id)}</b>.</span></div></div>
        <div class="crReclama"><p>¿Has pagado y no te llegan los créditos?</p><a class="btn wa bloque" target="_blank" rel="noopener" href="https://wa.me/${CFG.WHATSAPP}?text=${encodeURIComponent(waTxt)}"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>RECLAMAR POR WHATSAPP</a></div>
        <div class="acciones" style="justify-content:center"><button class="btn sec" id="crOk">ENTENDIDO</button></div></div>`);
      $('#crOk', m2).onclick = () => cerrarModal();
      try { window.open(d.pedido.url, '_blank', 'noopener'); } catch (e) {}
    });
  });
}

/* ---------- salir del juego (botón power) ---------- */
const ICO_POWER = '<svg viewBox="0 0 24 24"><path d="M12 3v8" stroke-width="2.4" stroke-linecap="round" fill="none"/><path d="M6.4 6.6a8 8 0 1 0 11.2 0" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg>';
function salirJuego() {
  try { Son.click(); } catch (e) {}
  const m = modal(`<div class="salirJ"><div class="sjIco">${ICO_POWER}</div><h2>¿Salir de CRIATURIX?</h2><p class="nota">Tu progreso está guardado. Podrás volver cuando quieras.</p>
    <div class="acciones"><button class="btn rojo" id="sjSi">SALIR DEL JUEGO</button><button class="btn sec" id="sjNo">SEGUIR JUGANDO</button></div></div>`);
  $('#sjNo', m).onclick = () => cerrarModal();
  $('#sjSi', m).onclick = () => {
    cerrarModal(); try { Son.callar(); } catch (e) {}
    try { window.close(); } catch (e) {}
    setTimeout(() => {   // si el navegador no deja cerrar la ventana, pantalla de despedida
      if (document.querySelector('.adios')) return;
      const d = document.createElement('div'); d.className = 'adios';
      d.innerHTML = `<img src="img/logo_criaturix.webp?v=2" alt="CRIATURIX"><b>¡HASTA PRONTO!</b><small>Ya puedes cerrar esta ventana</small><button class="btn" id="adVolver">VOLVER A JUGAR</button>`;
      document.body.appendChild(d); $('#adVolver', d).onclick = () => location.reload();
    }, 350);
  };
}
document.addEventListener('click', e => { if (e.target.closest('.bPower')) { e.preventDefault(); salirJuego(); } });

/* =========================================================
   NAVEGACIÓN
   ========================================================= */
const VISTAS = {};
function ir(v, arg) {
  if (v !== 'login' && !SES) v = 'login';
  if (VISTA === 'combate' && v !== 'combate' && window.Combate && Combate.activo()) { if (!Combate.salirOk()) return; }
  VISTA = v; Son.click(); Son.modo(v === 'combate' ? 'batalla' : 'menu');
  const conBarras = v !== 'login' && v !== 'combate';
  $('#top').classList.toggle('oculto', !conBarras); $('#nav').classList.toggle('oculto', !conBarras);
  $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.v === v || (b.dataset.v === 'combatir' && ['aventura', 'arena', 'ranking', 'combatir'].includes(v))));
  const div = document.createElement('div'); div.className = 'vista' + (conBarras ? '' : ' sinBarras');
  $('#app').innerHTML = ''; $('#app').appendChild(div);
  (VISTAS[v] || VISTAS.inicio)(div, arg);
  if (SES) pintaTop();
}
$$('#nav button').forEach(b => b.onclick = () => ir(b.dataset.v));
$('#tMarca').onclick = () => ir('inicio');
$('#tSonido').onclick = () => { Son.init(); const on = Son.alternar(); $('#tSonido').classList.toggle('off', !on); if (on) Son.click(); };
$('#tYo').onclick = () => ir('cuenta');
$('#tChips').onclick = () => toast('Chips: los ganas combatiendo y sirven para criar');
$('#tCred').onclick = () => comprarCreditos();
$('#tEner').onclick = () => toast('Combates con premio que te quedan hoy. Se recargan cada día.');

/* =========================================================
   LOGIN
   ========================================================= */
VISTAS.login = div => {
  const g1 = CX.genesAzar(Date.now() % 9973, 'bio', 0.9), g2 = CX.genesAzar((Date.now() + 7) % 9973, 'cuantico', 0.9), g3 = CX.genesAzar((Date.now() + 13) % 9973, 'plasma', 0.9);
  div.innerHTML = `<button class="ibtn bPower lPower" aria-label="Salir del juego" title="Salir del juego">${ICO_POWER}</button><div class="login">
    <div class="lHero">
      <img class="lLogo" id="lLogo" src="img/logo.webp" alt="Futurmovil">
      <div class="lPresenta">PRESENTA</div>
      <h1 class="lCx"><img src="img/logo_criaturix.webp?v=2" alt="CRIATURIX"></h1>
      <div class="lLema">Cría · Combate · Colecciona</div>
      <div class="lDesfile">${ROBOT.svg(g1)}${ROBOT.svg(g2)}${ROBOT.svg(g3)}</div>
    </div>
    <div class="lForm panel">
      <div class="lv on" data-v="entrar">
        <h2>ENTRAR</h2>
        <form id="fEntrar" autocomplete="on">
          <label class="campo"><span>Correo</span><input type="email" name="email" id="eEmail" autocomplete="username" required></label>
          <label class="campo"><span>Contraseña</span><input type="password" name="password" id="ePass" autocomplete="current-password" required></label>
          <button class="btn bloque grande btnEntrar" id="bEntrar" type="submit">ENTRAR<span class="carga"></span></button>
        </form>
        <div class="lAlt"><a href="#" class="enlace" data-ir="recuperar">¿Olvidaste tu contraseña?</a><a href="#" class="enlace" data-ir="registro">Crear cuenta</a></div>
        <div class="sep">o</div><div id="gBtn"></div>
      </div>
      <div class="lv" data-v="registro">
        <h2>CREAR CUENTA</h2>
        <form id="fReg" autocomplete="on">
          <label class="campo"><span>Correo</span><input type="email" id="rEmail" autocomplete="email" required></label>
          <label class="campo"><span>Nombre de usuario</span><input id="rUsu" maxlength="16" autocomplete="nickname" required><small id="rUsuMsg"></small></label>
          <label class="campo"><span>Contraseña</span><input type="password" id="rPass" autocomplete="new-password" minlength="6" required></label>
          <button class="btn bloque grande" type="submit">CREAR Y JUGAR</button>
        </form>
        <p class="nota" style="margin-top:10px">Recibirás 3 criaturas iniciales para empezar a combatir.</p>
        <div class="lAlt"><a href="#" class="enlace" data-ir="entrar">Ya tengo cuenta</a></div>
        <div class="sep">o</div><div id="gBtn2"></div>
      </div>
      <div class="lv" data-v="recuperar">
        <h2>RECUPERAR CONTRASEÑA</h2>
        <form id="fRec"><label class="campo"><span>Tu correo</span><input type="email" id="cEmail" required></label><button class="btn bloque cian" type="submit">ENVIARME UN CÓDIGO</button></form>
        <form id="fRes" class="oculto" style="margin-top:14px" autocomplete="on">
          <label class="campo"><span>Código del correo</span><input id="cCod" inputmode="numeric" maxlength="6" autocomplete="one-time-code" required></label>
          <label class="campo"><span>Contraseña nueva</span><input type="password" id="cPass" autocomplete="new-password" minlength="6" required></label>
          <button class="btn bloque" type="submit">GUARDAR Y ENTRAR</button>
        </form>
        <div class="lAlt"><a href="#" class="enlace" data-ir="entrar">Volver</a></div>
      </div>
      <div class="lv" data-v="usuario">
        <h2>ELIGE TU NOMBRE</h2>
        <p class="nota" style="margin-bottom:12px">Es el nombre que verán los demás jugadores.</p>
        <form id="fUsu"><label class="campo"><span>Nombre de usuario</span><input id="gUsu" maxlength="16" required><small id="gUsuMsg"></small></label><button class="btn bloque grande" type="submit">EMPEZAR</button></form>
      </div>
      <div class="msg" id="lMsg"></div>
      <div class="lExtras"><button class="btn sec peq" id="bInstalar">⤓ INSTALAR APP</button><button class="btn sec peq" id="bCompartir">⇪ COMPARTIR</button></div>
    </div></div>`;
  const msg = (t, c) => { const m = $('#lMsg'); m.textContent = t || ''; m.className = 'msg ' + (c || ''); };
  const vista = v => { $$('.lv', div).forEach(x => x.classList.toggle('on', x.dataset.v === v)); msg(''); };
  $$('[data-ir]', div).forEach(a => a.onclick = e => { e.preventDefault(); Son.init(); Son.click(); vista(a.dataset.ir); });
  $('#fEntrar').onsubmit = e => {
    e.preventDefault(); if (pulsadoLargo) return; Son.init();
    const b = $('#bEntrar'); ocupado(b, true); msg('');
    api('entrar', { id: $('#eEmail').value, pass: $('#ePass').value }).then(d => { ocupado(b, false); if (!d.ok) return msg(d.error, 'err'); entrarSesion(d); });
  };
  let tUsu = 0;
  function compruebaUsu(inp, out) {
    clearTimeout(tUsu); const u = inp.value.trim(); out.textContent = ''; out.className = '';
    if (!u) return;
    if (!/^[A-Za-z0-9ÑñÁÉÍÓÚáéíóúÜü_.\-]{3,16}$/.test(u)) { out.textContent = 'De 3 a 16 letras, números, punto o guion'; out.className = 'err'; return; }
    tUsu = setTimeout(() => api('disponible', { usuario: u }).then(d => { if (inp.value.trim() !== u) return; out.textContent = d.disponible ? '✓ Disponible' : '✗ Ese nombre ya está cogido'; out.className = d.disponible ? 'ok' : 'err'; }), 400);
  }
  $('#rUsu').oninput = () => compruebaUsu($('#rUsu'), $('#rUsuMsg'));
  $('#gUsu').oninput = () => compruebaUsu($('#gUsu'), $('#gUsuMsg'));
  $('#fReg').onsubmit = e => {
    e.preventDefault(); Son.init(); const b = $('button', e.target); ocupado(b, true); msg('');
    api('registrar', { email: $('#rEmail').value, usuario: $('#rUsu').value.trim(), pass: $('#rPass').value }).then(d => {
      ocupado(b, false); if (!d.ok) return msg(d.error, 'err');
      guardaPass($('#rEmail').value, $('#rPass').value); entrarSesion(d); setTimeout(() => bienvenida(), 900);
    });
  };
  let recEmail = '';
  $('#fRec').onsubmit = e => {
    e.preventDefault(); const b = $('button', e.target); ocupado(b, true); recEmail = $('#cEmail').value;
    api('recuperar', { email: recEmail }).then(d => { ocupado(b, false); if (!d.ok) return msg(d.error, 'err'); msg('Si el correo existe, te hemos enviado un código. Mira también en spam.', 'ok'); $('#fRes').classList.remove('oculto'); $('#cCod').focus(); });
  };
  $('#fRes').onsubmit = e => {
    e.preventDefault(); const b = $('button', e.target); ocupado(b, true);
    api('restablecer', { email: recEmail, codigo: $('#cCod').value, pass: $('#cPass').value }).then(d => { ocupado(b, false); if (!d.ok) return msg(d.error, 'err'); guardaPass(recEmail, $('#cPass').value); entrarSesion(d); });
  };
  let credGoogle = null;
  $('#fUsu').onsubmit = e => {
    e.preventDefault(); const b = $('button', e.target); ocupado(b, true);
    api('google', { credential: credGoogle, usuario: $('#gUsu').value.trim() }).then(d => { ocupado(b, false); if (!d.ok) return msg(d.error, 'err'); entrarSesion(d); setTimeout(() => bienvenida(), 900); });
  };
  // Google
  window.alGoogle = r => {
    credGoogle = r.credential; msg('Comprobando tu cuenta de Google…');
    api('google', { credential: credGoogle }).then(d => {
      if (!d.ok) return msg(d.error, 'err');
      if (d.necesitaUsuario) { vista('usuario'); $('#gUsu').value = d.sugerido || ''; compruebaUsu($('#gUsu'), $('#gUsuMsg')); return; }
      entrarSesion(d);
    });
  };
  cargaGoogle(() => {
    google.accounts.id.initialize({ client_id: CFG.GOOGLE, callback: window.alGoogle, ux_mode: 'popup' });
    const w = Math.min(380, $('.lForm').clientWidth - 40);
    ['gBtn', 'gBtn2'].forEach(id => { const el = document.getElementById(id); if (el) google.accounts.id.renderButton(el, { theme: 'filled_black', size: 'large', shape: 'pill', text: 'continue_with', locale: 'es', width: w }); });
  });
  // acceso admin: mantener ENTRAR 3 s o 10 toques en el logo
  let pulsadoLargo = false, tLargo = 0;
  const bE = $('#bEntrar');
  bE.addEventListener('pointerdown', () => { pulsadoLargo = false; bE.classList.add('cargando'); tLargo = setTimeout(() => { pulsadoLargo = true; bE.classList.remove('cargando'); vib([30, 40, 30]); Admin.abrir(); }, 3000); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => bE.addEventListener(ev, () => { clearTimeout(tLargo); bE.classList.remove('cargando'); setTimeout(() => pulsadoLargo = false, 50); }));
  bE.addEventListener('contextmenu', e => e.preventDefault());
  let toques = [];
  $('#lLogo').onclick = () => { const t = performance.now(); toques = toques.filter(x => t - x < 5000); toques.push(t); if (toques.length >= 10) { toques = []; Admin.abrir(); } };
  $('#bInstalar').onclick = instalar;
  $('#bCompartir').onclick = compartir;
};
function cargaGoogle(fn) {
  if (window.google && google.accounts) return fn();
  if (!document.getElementById('gsi')) { const s = document.createElement('script'); s.id = 'gsi'; s.src = 'https://accounts.google.com/gsi/client'; s.async = true; document.head.appendChild(s); }
  const t = setInterval(() => { if (window.google && google.accounts) { clearInterval(t); fn(); } }, 200); setTimeout(() => clearInterval(t), 15000);
}
function guardaPass(id, pass) { try { if (window.PasswordCredential) navigator.credentials.store(new PasswordCredential({ id, password: pass })).catch(() => {}); } catch (e) {} }

/* instalar y compartir */
let promptInstalar = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); promptInstalar = e; });
function instalar() {
  Son.init(); Son.click();
  if (matchMedia('(display-mode: standalone)').matches) return toast('Ya tienes CRIATURIX instalado ✓', 'ok');
  if (promptInstalar) { promptInstalar.prompt(); promptInstalar.userChoice.then(() => promptInstalar = null); return; }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  modal(`<h2>Instalar CRIATURIX</h2>${ios ? `<ol class="pasos"><li>Abre esta página en <b>Safari</b>.</li><li>Pulsa el botón <b>Compartir</b> (el cuadrado con la flecha hacia arriba).</li><li>Elige <b>«Añadir a pantalla de inicio»</b> y pulsa <b>Añadir</b>.</li></ol>`
    : `<ol class="pasos"><li>Abre el menú del navegador (⋮ arriba a la derecha).</li><li>Pulsa <b>«Instalar aplicación»</b> o <b>«Añadir a pantalla de inicio»</b>.</li></ol>`}<p class="nota">Así lo tendrás como una app más, a pantalla completa.</p>`);
}
/* cartel de instalación al abrir el juego si no está instalado */
function instalado() { return matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true; }
function cartelInstalar() {
  if (instalado() || document.querySelector('.cInst')) return;
  try { if (sessionStorage.getItem('cxInstVisto')) return; sessionStorage.setItem('cxInstVisto', '1'); } catch (e) {}
  const d = document.createElement('div'); d.className = 'cInst';
  d.innerHTML = `<div class="ciFondo"></div><div class="ciCaja">
    <div class="ciArte"><img src="img/compartir.jpg?v=1" alt=""><i class="ciBrillo"></i>${Array.from({ length: 14 }, (_, i) => `<b class="ciChispa" style="--x:${Math.round(Math.random() * 100)}%;--d:${(Math.random() * 3).toFixed(2)}s;--t:${(2.4 + Math.random() * 2).toFixed(2)}s"></b>`).join('')}</div>
    <div class="ciTxt"><small>EXPERIENCIA COMPLETA</small><h3>Instala CRIATURIX</h3>
    <p>Llévate tus criaturas contigo: juega a <b>pantalla completa</b>, ábrelo con <b>un solo toque</b> desde tu pantalla de inicio y recibe las <b>actualizaciones automáticas</b>.</p>
    <div class="ciBtns"><button class="btn grande" id="ciSi">⤓ INSTALAR EN ESTE EQUIPO</button><button class="btn sec" id="ciNo">CONTINUAR SIN INSTALAR</button></div></div></div>`;
  document.body.appendChild(d);
  try { Son.init(); } catch (e) {}
  const cerrar = () => { d.classList.add('fuera'); setTimeout(() => d.remove(), 400); };
  $('#ciNo', d).onclick = () => { try { Son.click(); } catch (e) {} cerrar(); };
  $('.ciFondo', d).onclick = $('#ciNo', d).onclick;
  $('#ciSi', d).onclick = () => { cerrar(); instalar(); };
}
setTimeout(cartelInstalar, 1600);
function compartir() {
  Son.init(); Son.click();
  const txt = '¡Juega conmigo a CRIATURIX! 🤖⚡ Cría, combate y gana dinero real con criaturas robot.', url = CFG.URL;
  if (navigator.share) {   // intenta compartir la ilustración junto al enlace
    const sinImg = () => navigator.share({ title: 'CRIATURIX', text: txt, url }).catch(() => {});
    return fetch('img/compartir.jpg?v=1').then(r => r.blob()).then(b => {
      const f = new File([b], 'criaturix.jpg', { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ title: 'CRIATURIX', text: txt + '\n' + url, files: [f] }).catch(e => { if (e && e.name !== 'AbortError') sinImg(); });
      return sinImg();
    }).catch(sinImg);
  }
  const c = modal(`<h2>Compartir CRIATURIX</h2><div class="acciones">
    <a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(txt + ' ' + url)}">WhatsApp</a>
    <a class="btn cian" href="mailto:?subject=CRIATURIX&body=${encodeURIComponent(txt + '\n' + url)}">Correo</a>
    <a class="btn sec" target="_blank" rel="noopener" href="https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(txt)}">Telegram</a>
    <button class="btn sec" id="bCopiar">Copiar enlace</button></div>`);
  $('#bCopiar', c).onclick = () => { navigator.clipboard.writeText(url).then(() => toast('Enlace copiado', 'ok')); };
}
function bienvenida() {
  modal(`<div style="text-align:center"><h2 style="padding:0">¡BIENVENIDO A CRIATURIX!</h2>
    <div class="rivales">${DATA.criaturas.slice(0, 3).map(c => dibujo(c)).join('')}</div>
    <p class="nota" style="margin:10px 0">Estas son tus <b>3 criaturas iniciales</b>. Con ellas puedes combatir en la <b>Aventura</b> y en la <b>Arena</b> para ganar <b>chips</b>.</p>
    <p class="nota">Consigue más criaturas en el <b>Mercado</b>, críalas en el <b>Criadero</b> y vende los huevos y crías: ganarás <b>créditos</b> con cada venta.</p>
    <button class="btn grande" style="margin-top:14px" onclick="cerrarModal();ir('aventura')">¡A LA AVENTURA!</button></div>`);
}

/* =========================================================
   INICIO
   ========================================================= */
const ICO = {
  espadas: '<svg viewBox="0 0 24 24"><path d="M3 3h5l9 9-2 2-9-9zM21 3h-5l-4 4 2 2zM5 15l4 4-2 2-2-2-2 1 1-2-2-2z"/><path d="M19 15l-4 4 2 2 2-2 2 1-1-2 2-2z"/></svg>',
  mapa: '<svg viewBox="0 0 24 24"><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/></svg>',
  copa: '<svg viewBox="0 0 24 24"><path d="M6 3h12v4a6 6 0 0 1-12 0zM3 4h3v3H3zm15 0h3v3h-3zM10 14h4v3h3v4H7v-4h3z"/></svg>',
  huevo: '<svg viewBox="0 0 24 24"><path d="M12 2c5 0 8 9 8 13a8 8 0 0 1-16 0c0-4 3-13 8-13z"/></svg>',
  tienda: '<svg viewBox="0 0 24 24"><path d="M3 9l2-6h14l2 6zM4 10h16v11H4zm5 3v6h6v-6z"/></svg>',
  robot: '<svg viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="12" rx="5"/><path d="M8 3v4M16 3v4" stroke="currentColor" stroke-width="2"/></svg>'
};
const UIV = '?v=2', imU = (f, c) => `<img class="la ${c}" src="img/ui/${f}.webp${UIV}" alt="" draggable="false">`;
const LOSA_FONDO = { aventura: 1, arena: 1, criaturas: 1, criadero: 1, mercado: 1, ranking: 1 };   // fondos ilustrados img/ui/fondo_<vista>.webp
const COPA_SVG = '<img class="lCopa" src="img/ui/copa.webp?v=1" alt="" draggable="false">';
const LOSA_ARTE = {
  aventura: `<i class="lSuelo"></i>${imU('cx_bio', 'solo')}<svg class="lPin" viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.6" fill="#05060f"/></svg>`,
  arena: `<i class="lSuelo"></i>${imU('cx_plasma', 'izq')}${imU('cx_sombra', 'der')}<i class="lVs">VS</i>`,
  criaturas: `<i class="lSuelo"></i>${imU('cx_cromo', 't3')}${imU('cx_voltio', 't2')}${imU('cx_cuantico', 't1')}`,
  criadero: `<i class="lSuelo"></i>${imU('huevo', 'huevo')}<i class="lCor c1">♥</i><i class="lCor c2">♥</i><i class="lCor c3">♥</i>`,
  mercado: `<i class="lSuelo"></i>${imU('cx_cromo', 'merc')}<img class="lPrecio" src="img/ui/moneda.webp?v=1" alt="" draggable="false"><img class="lMon m1" src="img/ui/moneda.webp?v=1" alt=""><img class="lMon m2" src="img/ui/moneda.webp?v=1" alt=""><img class="lMon m3" src="img/ui/moneda.webp?v=1" alt="">`,
  ranking: `<i class="lSuelo"></i>${COPA_SVG}<i class="lEst s1">★</i><i class="lEst s2">★</i><i class="lEst s3">★</i>`
};
function losa(v, titulo, sub, col, ico, extra, badge) {
  return `<button class="losa${LOSA_FONDO[v] ? ' conFondo' : ''}" data-ir="${v}" style="--lc:${col}"><span class="lFondo"${LOSA_FONDO[v] ? ` style="background-image:url(img/ui/fondo_${v}.webp${UIV})"` : ''}></span><span class="lRejilla"></span>
    <span class="lArte">${LOSA_ARTE[v] || ''}</span><i class="lChispa"></i><i class="lChispa"></i><i class="lChispa"></i><i class="lChispa"></i><span class="lBrillo"></span><i class="lEsq e1"></i><i class="lEsq e2"></i>
    ${badge ? `<em class="lBadge">${badge}</em>` : ''}<span class="lTxt"><b>${titulo}</b><small>${sub}</small>${extra || ''}</span></button>`;
}
VISTAS.inicio = div => {
  const p = SES.perfil, eq = p.equipo.map(mia).filter(Boolean);
  const huevosListos = DATA.criaturas.filter(c => c.tipo === 'huevo' && c.eclosion <= Date.now() && !c.estado).length;
  div.innerHTML = `<div class="ancho">
    ${DATA.aviso ? `<div class="aviso">📣 ${esc(DATA.aviso)}</div>` : ''}
    <div class="hero">
      <div><h1>Hola, <span style="color:var(--v)">${esc(p.usuario)}</span></h1>
        <p>${eq.length === 3 ? 'Tu equipo está listo para combatir.' : 'Elige tu equipo de 3 criaturas para combatir.'}</p>
        <div class="acciones"><button class="btn grande" data-ir="combatir">⚔ COMBATIR</button><button class="btn sec" data-ir="equipo">EQUIPO</button></div></div>
      <div class="escenario" id="esc">${eq.map(c => dibujo(c)).join('') || `<div class="vacio">Sin equipo</div>`}</div>
    </div>
    <div class="losas">
      ${losa('aventura', 'AVENTURA', `Etapa ${Math.min(30, p.etapa + 1)} de 30`, '#19ff6a', 'mapa', `<div class="prog"><i style="width:${p.etapa / 30 * 100}%"></i></div>`)}
      ${losa('arena', 'ARENA', `${p.elo} puntos · ${p.victorias}V ${p.derrotas}D`, '#ff2bd6', 'espadas')}
      ${losa('criaturas', 'MIS CRIATURAS', `${DATA.criaturas.filter(c => c.tipo === 'criatura').length} criaturas · ${DATA.criaturas.filter(c => c.tipo === 'huevo').length} huevos`, '#00e5ff', 'robot')}
      ${losa('criadero', 'CRIADERO', huevosListos ? `¡${huevosListos} huevo${huevosListos > 1 ? 's' : ''} listo${huevosListos > 1 ? 's' : ''}!` : 'Cría nuevas criaturas', '#ffd23f', 'huevo', '', huevosListos ? '¡LISTO!' : '')}
      ${losa('mercado', 'MERCADO', 'Compra y vende criaturas y huevos', '#b14bff', 'tienda')}
      ${losa('ranking', 'RANKING', 'Los mejores de CRIATURIX', '#ff4d2e', 'copa')}
    </div></div>`;
  $$('[data-ir]', div).forEach(b => b.onclick = () => ir(b.dataset.ir));
  $$('#esc .rb', div).forEach((r, i) => r.onclick = () => detalle(eq[i].id));
  if (p.admin) { const b = document.createElement('button'); b.className = 'btn mag peq'; b.style.marginTop = '14px'; b.textContent = '⚙ PANEL ADMIN'; b.onclick = () => Admin.abrir(); $('.ancho', div).appendChild(b); }
};

/* =========================================================
   MIS CRIATURAS + DETALLE
   ========================================================= */
let filtroCr = { tipo: 'todas', clase: '' };
VISTAS.criaturas = div => {
  div.innerHTML = `<div class="ancho"><div class="tit"><h1>MIS CRIATURAS</h1><div class="der"><button class="btn sec peq" id="bEq">EQUIPO</button><button class="btn peq" id="bMer">CONSEGUIR MÁS</button></div></div>
    <div class="filtros"><div class="chips" id="fTipo">${[['todas', 'Todas'], ['criatura', 'Criaturas'], ['huevo', 'Huevos'], ['venta', 'En venta']].map(([k, n]) => `<button class="chip ${filtroCr.tipo === k ? 'on' : ''}" data-k="${k}">${n}</button>`).join('')}</div>
    <select id="fClase"><option value="">Todas las clases</option>${CX.LISTA_CLASES.map(c => `<option value="${c}" ${filtroCr.clase === c ? 'selected' : ''}>${CX.CLASES[c].nom}</option>`).join('')}</select></div>
    <div class="rejilla" id="lista"></div></div>`;
  $('#bEq').onclick = () => ir('equipo'); $('#bMer').onclick = () => ir('mercado');
  function pinta() {
    let l = DATA.criaturas.slice().sort((a, b) => b.creada - a.creada);
    if (filtroCr.tipo === 'venta') l = l.filter(c => c.estado); else if (filtroCr.tipo !== 'todas') l = l.filter(c => c.tipo === filtroCr.tipo);
    if (filtroCr.clase) l = l.filter(c => c.clase === filtroCr.clase);
    $('#lista').innerHTML = l.map(c => tcHTML(c)).join('') || `<div class="vacio" style="grid-column:1/-1">No hay nada por aquí.</div>`;
    $$('#lista .tc').forEach(t => t.onclick = () => detalle(t.dataset.id));
  }
  $$('#fTipo .chip').forEach(b => b.onclick = () => { filtroCr.tipo = b.dataset.k; $$('#fTipo .chip').forEach(x => x.classList.toggle('on', x === b)); Son.click(); pinta(); });
  $('#fClase').onchange = e => { filtroCr.clase = e.target.value; pinta(); };
  pinta();
};
function statsHTML(g) {
  const s = CX.stats(g), max = { hp: 61, vel: 61, hab: 47, mor: 61 };
  return `<div class="stats">${[['hp', 'VIDA', '#19ff6a', s.pv], ['vel', 'VELOCIDAD', '#ffd23f', s.vel], ['hab', 'HABILIDAD', '#00e5ff', s.hab], ['mor', 'MORAL', '#ff2bd6', s.mor]].map(([k, n, c, v]) =>
    `<div class="st" style="--sc:${c}"><b style="color:${c}">${v}</b><small>${n}</small><div class="bar"><i style="width:${Math.min(100, s[k] / max[k] * 100)}%"></i></div></div>`).join('')}</div>`;
}
function genesHTML(g) {
  return `<table class="genes"><tr><th>PIEZA</th><th>DOMINANTE</th><th>R1</th><th>R2</th></tr>${CX.SLOTS.map(sl => `<tr><td>${CX.NOM_SLOT[sl]}</td>${g.p[sl].map((x, i) =>
    `<td class="${i ? 'r' : ''}"><span class="g" style="--cc:${colClase(CX.parteGen(x).c)}">${esc(CX.nombreParte(sl, x))}</span></td>`).join('')}</tr>`).join('')}</table>`;
}
function detalle(id, o) {
  o = o || {};
  const c = o.criatura || mia(id); if (!c) return;
  const huevo = c.tipo === 'huevo', esMia = c.dueno === SES.perfil.id, enEq = SES.perfil.equipo.indexOf(c.id) >= 0, R = DATA.reglas;
  let cuerpo = '';
  if (huevo) {
    const listo = c.eclosion <= Date.now();
    cuerpo = `<div class="detVis" style="--cc:#19ff6a">${dibujo(c)}</div><div>
      <div class="detNom"><h2>${esc(c.nombre || 'Huevo #' + c.num)}</h2></div>
      <p class="nota" style="margin:10px 0">${c.padres[0] ? 'Hijo de dos criaturas de ' + esc(c.duenoNombre || 'su criador') + '.' : 'Huevo sorpresa de la tienda oficial.'} Nadie sabe qué criatura saldrá hasta que eclosione.</p>
      ${esMia ? `<div class="hv"><div class="cuenta" id="dCuenta">${listo ? '¡LISTO PARA ECLOSIONAR!' : tiempo(c.eclosion - Date.now())}</div></div>` : ''}
      <div class="acciones" id="dAcc"></div></div>`;
  } else {
    cuerpo = `<div class="detVis" style="--cc:${colClase(c.clase)}">${dibujo(c)}</div><div>
      <div class="detNom"><h2>${esc(nomCr(c))}</h2>${claseHTML(c.clase)}${purezaHTML(c.genes)}</div>
      <p class="nota">#${c.num} · ${c.crias}/${R.maxCrias || 7} crías${c.inicial ? ' · Criatura inicial (no se puede criar ni vender)' : ''}${o.mercado ? ' · ' + (c.dueno === 'TIENDA' ? 'Tienda oficial' : 'Vende ' + esc(c.duenoNombre)) : ''}</p>
      ${statsHTML(c.genes)}
      <h3 style="font-size:13px;color:var(--tx2);margin:12px 0 8px">CARTAS</h3>
      <div class="cartasDet">${CX.cartasDe(c.genes).map(k => cartaHTML(k, { genes: c.genes })).join('')}</div>
      <h3 style="font-size:13px;color:var(--tx2);margin:14px 0 6px">GENES</h3>${genesHTML(c.genes)}
      <div class="acciones" id="dAcc"></div></div>`;
  }
  const m = modal(`<div class="det">${cuerpo}</div>`, { cls: 'ancha' });
  const acc = $('#dAcc', m);
  const boton = (txt, cls, fn) => { const b = document.createElement('button'); b.className = 'btn ' + (cls || ''); b.innerHTML = txt; b.onclick = () => fn(b); acc.appendChild(b); return b; };
  if (o.mercado) {
    if (c.dueno !== SES.perfil.id) boton('COMPRAR · ' + euros(c.precio) + ' €', 'oro grande', () => Mercado.comprar(c));
    return;
  }
  if (!esMia) return;
  if (huevo) {
    if (c.estado === 'venta') boton('RETIRAR DE LA VENTA', 'sec', b => Mercado.retirar(c, b));
    else if (c.eclosion <= Date.now()) boton('🥚 ECLOSIONAR', 'grande', () => eclosionar(c));
    else boton('PONER A LA VENTA', 'oro', () => Mercado.vender(c));
    if (c.eclosion > Date.now()) { const t = setInterval(() => { const el = $('#dCuenta'); if (!el) return clearInterval(t); el.textContent = c.eclosion <= Date.now() ? '¡LISTO PARA ECLOSIONAR!' : tiempo(c.eclosion - Date.now()); }, 1000); }
    return;
  }
  if (!enEq && !c.estado) boton('AL EQUIPO', 'cian', () => { cerrarModal(); ir('equipo', c.id); });
  if (!c.inicial && !c.estado) boton('♥ CRIAR', 'mag', () => { cerrarModal(); ir('criadero', c.id); });
  if (!c.inicial) {
    if (c.estado === 'venta') boton('RETIRAR DE LA VENTA', 'sec', b => Mercado.retirar(c, b));
    else if (!c.estado) boton('VENDER', 'oro', () => Mercado.vender(c));
  }
  const ren = $('#dRen', m);
  if (ren) ren.onclick = () => {
    const nuevo = prompt('Nombre para tu criatura (máx. 20 letras):', c.nombre || ''); if (nuevo == null) return;
    conSes('renombrar', { id: c.id, nombre: nuevo }).then(d => { if (!d.ok) return toast(d.error, 'err'); Object.assign(c, d.criatura); toast('Nombre guardado', 'ok'); detalle(c.id); });
  };
}

/* =========================================================
   EQUIPO
   ========================================================= */
VISTAS.equipo = (div, idNuevo) => {
  const eq = SES.perfil.equipo.slice(); let sel = eq.length < 3 ? eq.length : 0;
  if (idNuevo && eq.indexOf(idNuevo) < 0) { if (eq.length < 3) eq.push(idNuevo); else eq[0] = idNuevo; }
  div.innerHTML = `<div class="ancho"><div class="tit"><h1>EQUIPO</h1><div class="sub">La criatura de <b>delante</b> recibe casi todos los golpes: pon ahí a la más resistente.</div></div>
    <div class="panel"><div class="formacion" id="form"></div><div class="acciones" style="justify-content:center"><button class="btn grande" id="bGuardar">GUARDAR EQUIPO</button></div></div>
    <h3 style="margin:18px 0 10px;font-size:14px;color:var(--tx2)">ELIGE UNA CRIATURA PARA EL PUESTO MARCADO</h3><div class="rejilla" id="lista"></div></div>`;
  const nombres = ['DELANTE', 'CENTRO', 'DETRÁS'];
  function pinta() {
    $('#form').innerHTML = [0, 1, 2].map(i => { const c = mia(eq[i]); return `<div class="puesto ${sel === i ? 'on' : ''}" data-i="${i}"><h4>${nombres[i]}</h4>${c ? dibujo(c) + `<b style="font-size:13px">${esc(nomCr(c))}</b>` : '<div class="mas" style="font-size:40px;color:var(--c)">+</div>'}</div>`; }).join('');
    $$('#form .puesto').forEach(p => p.onclick = () => { sel = +p.dataset.i; Son.click(); pinta(); });
    const l = DATA.criaturas.filter(c => c.tipo === 'criatura' && c.estado !== 'reservado');
    $('#lista').innerHTML = l.map(c => tcHTML(c, { cls: eq.indexOf(c.id) >= 0 ? 'sel' : '' })).join('');
    $$('#lista .tc').forEach(t => t.onclick = () => {
      const id = t.dataset.id, ya = eq.indexOf(id);
      if (ya >= 0) { const x = eq[sel]; eq[sel] = id; eq[ya] = x; } else eq[sel] = id;
      for (let i = 0; i < 3; i++) if (!eq[i]) eq[i] = undefined;
      Son.carta(); sel = (sel + 1) % 3; pinta();
    });
  }
  $('#bGuardar').onclick = e => {
    const ids = eq.filter(Boolean); if (ids.length !== 3) return toast('Elige 3 criaturas', 'err');
    ocupado(e.target, true);
    conSes('equipo', { ids }).then(d => { ocupado(e.target, false); if (!d.ok) return toast(d.error, 'err'); aplicaPerfil(d.perfil); Son.moneda(); toast('Equipo guardado', 'ok'); ir('inicio'); });
  };
  pinta();
};

/* =========================================================
   CRIADERO
   ========================================================= */
VISTAS.criadero = (div, idA) => {
  const R = DATA.reglas; let A = idA || null, B = null;
  const aptas = () => DATA.criaturas.filter(c => c.tipo === 'criatura' && !c.inicial && !c.estado && c.crias < (R.maxCrias || 7));
  const huevos = () => DATA.criaturas.filter(c => c.tipo === 'huevo' && c.dueno === SES.perfil.id).sort((a, b) => a.eclosion - b.eclosion);
  div.innerHTML = `<div class="ancho"><div class="tit"><h1>CRIADERO</h1><div class="sub">Junta dos criaturas y nacerá un huevo con una mezcla de sus genes.</div></div>
    <div class="panel"><div class="nido"><div class="ranura" id="rA"></div><svg class="corazon" viewBox="0 0 24 24"><path fill="#ff2bd6" d="M12 21s-8-5.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.5-8 11-8 11z"/></svg><div class="ranura" id="rB"></div></div>
    <div id="cInfo" style="text-align:center;margin-top:12px"></div><div id="cProb"></div></div>
    <h3 style="margin:20px 0 6px;font-size:14px;color:var(--tx2)">HUEVOS</h3><div class="incuba" id="hvs"></div></div>`;
  function ranura(el, c, cual) {
    el.classList.toggle('llena', !!c); el.style.setProperty('--cc', c ? colClase(c.clase) : '');
    el.innerHTML = c ? dibujo(c) + `<b style="font-size:13px">${esc(nomCr(c))}</b><small style="color:var(--tx2)">${c.crias}/${R.maxCrias} crías</small>` : `<div><div class="mas">+</div><b style="font-size:13px">ELEGIR ${cual}</b></div>`;
    el.onclick = () => elegir(cual);
  }
  function coste(c) { const t = R.costeCria || [100]; return t[c.crias] != null ? t[c.crias] : t[t.length - 1]; }
  function pinta() {
    ranura($('#rA'), mia(A), 'A'); ranura($('#rB'), mia(B), 'B');
    const a = mia(A), b = mia(B);
    if (a && b) {
      const total = coste(a) + coste(b), pr = CX.probCria(a.genes, b.genes);
      $('#cInfo').innerHTML = `<p class="nota">Coste: <b style="color:var(--o)">${total} chips</b>${R.costeCriaCreditos ? ' + <b style="color:var(--c)">' + fmt(R.costeCriaCreditos) + ' créditos</b>' : ''} · El huevo tarda <b>${R.horasEclosion} h</b> en eclosionar</p>
        <button class="btn mag grande" id="bCriar" style="margin-top:10px" ${SES.perfil.chips < total ? 'disabled' : ''}>♥ CRIAR</button>${SES.perfil.chips < total ? `<p class="nota" style="color:var(--r);margin-top:6px">Te faltan ${total - SES.perfil.chips} chips. ¡Combate para conseguirlos!</p>` : ''}`;
      $('#cProb').innerHTML = `<h3 style="margin:16px 0 4px;font-size:13px;color:var(--tx2)">PROBABILIDAD DE CADA PIEZA</h3><div class="prob">${CX.SLOTS.map(sl => `<div class="pb"><h4>${CX.NOM_SLOT[sl].toUpperCase()}</h4>${pr[sl].slice(0, 4).map(x =>
        `<div class="fila" style="--cc:${colClase(CX.parteGen(x.g).c)}"><span style="width:44%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${esc(x.n)}</span><span class="bar"><i style="width:${x.p * 100}%"></i></span><b>${Math.round(x.p * 100)}%</b></div>`).join('')}</div>`).join('')}</div>`;
      $('#bCriar').onclick = e => criar(e.target);
    } else { $('#cInfo').innerHTML = `<p class="nota">Elige dos criaturas tuyas. Las iniciales y las que están a la venta no pueden criar.</p>`; $('#cProb').innerHTML = ''; }
    const hs = huevos();
    $('#hvs').innerHTML = hs.map(h => { const listo = h.eclosion <= Date.now(), tot = (R.horasEclosion || 24) * 3600000, pct = listo ? 100 : Math.max(2, 100 - (h.eclosion - Date.now()) / tot * 100);
      return `<div class="hv" data-id="${h.id}">${dibujo(h)}<div class="hvBar"><i style="width:${pct}%"></i></div><div class="cuenta" data-t="${h.eclosion}">${h.estado === 'venta' ? 'EN VENTA' : h.estado === 'reservado' ? 'RESERVADO' : tiempo(h.eclosion - Date.now())}</div>
      ${listo && !h.estado ? '<button class="btn peq bloque">ECLOSIONAR</button>' : '<button class="btn sec peq bloque">VER</button>'}</div>`; }).join('') || '<div class="vacio" style="grid-column:1/-1">Aún no tienes huevos.</div>';
    $$('#hvs .hv').forEach(h => $('button', h).onclick = () => { const c = mia(h.dataset.id); if (c.eclosion <= Date.now() && !c.estado) eclosionar(c); else detalle(c.id); });
  }
  function elegir(cual) {
    const otro = cual === 'A' ? B : A, l = aptas().filter(c => c.id !== otro);
    if (!l.length) return toast(aptas().length ? 'No tienes más criaturas que puedan criar' : 'Necesitas criaturas que no sean iniciales. Consíguelas en el Mercado.', 'err');
    const m = modal(`<h2>Elige la criatura ${cual}</h2><div class="rejilla">${l.map(c => tcHTML(c)).join('')}</div>`, { cls: 'ancha' });
    $$('.tc', m).forEach(t => t.onclick = () => { if (cual === 'A') A = t.dataset.id; else B = t.dataset.id; Son.carta(); cerrarModal(); pinta(); });
  }
  function criar(btn) {
    const a = mia(A), b = mia(B); ocupado(btn, true);
    conSes('criar', { a: A, b: B }).then(d => {
      ocupado(btn, false); if (!d.ok) return toast(d.error, 'err');
      aplicaPerfil(d.perfil); a.crias++; b.crias++; DATA.criaturas.push(d.huevo);
      const m = modal(`<div class="eclosion" style="--cc:#ff2bd6"><div class="flashE"></div>${dibujo(a, 'espejo')}${dibujo(b)}</div><h2 style="text-align:center;padding:0">¡HUEVO CREADO!</h2><p class="nota" style="text-align:center">Eclosionará en ${R.horasEclosion} horas. Puedes abrirlo entonces o venderlo en el mercado.</p>`, { sinCerrar: true });
      const ec = $('.eclosion', m), rbs = $$('.rb', ec);
      rbs[0].style.cssText = 'transition:transform .8s;transform:translateX(-60%) scale(.8)'; rbs[1].style.cssText = 'transition:transform .8s;transform:translateX(60%) scale(.8)';
      Son.cura();
      setTimeout(() => { rbs[0].style.transform = 'translateX(0) scale(.5)'; rbs[1].style.transform = 'translateX(0) scale(.5)'; }, 100);
      setTimeout(() => { ec.innerHTML = '<div class="flashE"></div>' + ROBOT.huevo(null, { cls: 'nuevo' }); ec.classList.add('boom'); Son.eclosion(); celebrar(ec, '#ff2bd6'); }, 1000);
      setTimeout(() => { $('#modal .mCerrar').classList.remove('oculto'); }, 1800);
      A = null; B = null; pinta();
    });
  }
  pinta();
  const t = setInterval(() => { if (VISTA !== 'criadero') return clearInterval(t); $$('#hvs .cuenta[data-t]').forEach(el => { const ms = +el.dataset.t - Date.now(); if (!/VENTA|RESERV/.test(el.textContent)) el.textContent = tiempo(ms); }); }, 1000);
};
/* eclosión: el huevo se va agrietando (5 fotogramas img/huevo/h0-h4), tiembla cada vez más y estalla */
const HV_V = '?v=1';
function eclosionar(c) {
  const m = modal(`<div class="eclosion hvSec"><div class="flashE"></div><div class="hvAnim" id="hvAnim"><i class="hvLuz"></i>${[0, 1, 2, 3, 4].map(i => `<img src="img/huevo/h${i}.webp${HV_V}" alt="" class="f${i}${i ? '' : ' on'}" draggable="false">`).join('')}</div><canvas class="hvTrozos"></canvas></div>
    <h2 style="text-align:center;padding:0" id="eTit">Eclosionando…</h2><div id="eInfo"></div>`, { sinCerrar: true, cls: 'eclModal' });
  const an = $('#hvAnim', m), ec = $('.eclosion', m), fr = $$('img', an);
  let resp = null, listoAnim = false;
  const paso = (i, fuerza) => {
    fr.forEach((f, j) => f.classList.toggle('on', j <= i));
    an.style.setProperty('--luz', (i * 0.25).toFixed(2)); an.className = 'hvAnim t' + fuerza;
    Son.grieta && Son.grieta(i); vib(20 + i * 25);
    an.classList.remove('golpe'); void an.offsetWidth; an.classList.add('golpe');
  };
  Son.estado(); an.className = 'hvAnim t1';
  setTimeout(() => paso(1, 1), 700);
  setTimeout(() => paso(2, 2), 1400);
  setTimeout(() => paso(3, 3), 2100);
  setTimeout(() => { paso(4, 4); listoAnim = true; if (resp) estalla(); }, 2750);
  conSes('eclosionar', { id: c.id }).then(d => {
    if (!d.ok) { cerrarModal(); return toast(d.error, 'err'); }
    resp = d; if (listoAnim) estalla();
  });
  function estalla() {
    if (ec.classList.contains('boom')) return;
    const n = resp.criatura, col = colClase(n.clase);
    setTimeout(() => {
      ec.style.setProperty('--cc', col);
      trozosHuevo($('.hvTrozos', ec), an);
      an.classList.add('fuera');
      ec.insertAdjacentHTML('beforeend', ROBOT.svg(n.genes, { cls: 'nace' })); ec.classList.add('boom');
      Son.eclosion(); celebrar(ec, col); vib([60, 40, 160]);
      Object.assign(c, n);
      $('#eTit').innerHTML = '¡Ha nacido ' + esc(nomCr(n)) + '!';
      $('#eInfo').innerHTML = `<div style="text-align:center;margin:8px 0">${claseHTML(n.clase)} ${purezaHTML(n.genes)}</div>${statsHTML(n.genes)}<div class="acciones" style="justify-content:center"><button class="btn" id="eVer">VER CRIATURA</button></div>`;
      $('#modal .mCerrar').classList.remove('oculto');
      $('#eVer').onclick = () => detalle(n.id);
      alCerrarModal = () => { if (VISTA === 'criadero' || VISTA === 'criaturas') ir(VISTA); };
    }, 380);
  }
}
/* trozos de cáscara que salen volando al estallar */
function trozosHuevo(cv, an) {
  if (!cv) return;
  const g = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), W = cv.width = cv.clientWidth * dpr, H = cv.height = cv.clientHeight * dpr;
  const r = an.getBoundingClientRect(), b = cv.getBoundingClientRect(), cx = (r.left - b.left + r.width / 2) * dpr, cy = (r.top - b.top + r.height * .48) * dpr, R = (a, z) => a + Math.random() * (z - a);
  const cols = ['#e9c9a4', '#d9ab80', '#c08a5e', '#f3dcc0', '#8a6a52'], P = [];
  for (let i = 0; i < 38; i++) {
    const a = R(0, 6.283), v = R(260, 760) * dpr, s = R(6, 22) * dpr, n = 3 + Math.floor(R(0, 3)), pts = [];
    for (let k = 0; k < n; k++) { const aa = k / n * 6.283 + R(-.4, .4); pts.push([Math.cos(aa) * s * R(.5, 1), Math.sin(aa) * s * R(.5, 1)]); }
    P.push({ x: cx + R(-40, 40) * dpr, y: cy + R(-60, 60) * dpr, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200 * dpr, rot: R(0, 6), vr: R(-12, 12), pts, c: cols[i % 5], t: 0, vida: R(.9, 1.5) });
  }
  for (let i = 0; i < 70; i++) { const a = R(0, 6.283), v = R(200, 700) * dpr; P.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, vida: R(.4, .9), chispa: 1, c: i % 2 ? '#19ff6a' : '#b6ff3a' }); }
  let ult = performance.now();
  (function f(now) {
    if (!cv.isConnected) return; const dt = Math.min(.05, (now - ult) / 1000); ult = now; g.clearRect(0, 0, W, H); let vivos = 0;
    for (const p of P) {
      p.t += dt; if (p.t > p.vida) continue; vivos++;
      const a = Math.min(1, (p.vida - p.t) / .35);
      p.vx *= .985; p.vy = p.vy * .985 + 900 * dpr * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.chispa) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; g.strokeStyle = p.c; g.lineWidth = 2.2 * dpr; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * .03, p.y - p.vy * .03); g.stroke(); continue; }
      p.rot += p.vr * dt; g.globalCompositeOperation = 'source-over'; g.globalAlpha = a;
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.beginPath(); p.pts.forEach((q, k) => k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath();
      g.fillStyle = p.c; g.fill(); g.strokeStyle = 'rgba(60,40,25,.6)'; g.lineWidth = 1.2 * dpr; g.stroke(); g.restore();
    }
    g.globalAlpha = 1; if (vivos) requestAnimationFrame(f); else g.clearRect(0, 0, W, H);
  })(ult);
}

/* =========================================================
   MERCADO
   ========================================================= */
const Mercado = (() => {
  let pest = 'tienda', f = { tipo: '', clase: '', orden: 'nuevo' }, lista = [];
  function vista(div) {
    div.innerHTML = `<div class="ancho"><div class="tit"><h1>MERCADO</h1><div class="sub">Pagas con myPOS y, cuando Futurmovil confirma el pago, la criatura pasa a tu cuenta. Quien vende recibe el ${DATA.reglas.comision || 50} % en créditos.</div></div>
      <div class="pestanas" id="pest">${[['tienda', '★ TIENDA OFICIAL'], ['jugadores', 'JUGADORES'], ['mios', 'MIS COMPRAS Y VENTAS']].map(([k, n]) => `<button data-k="${k}" class="${pest === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div id="mCont"></div></div>`;
    $$('#pest button').forEach(b => b.onclick = () => { pest = b.dataset.k; Son.click(); vista(div); });
    if (pest === 'mios') return mios();
    $('#mCont').innerHTML = `<div class="filtros"><select id="mfT"><option value="">Todo</option><option value="criatura">Criaturas</option><option value="huevo">Huevos</option></select>
      <select id="mfC"><option value="">Todas las clases</option>${CX.LISTA_CLASES.map(c => `<option value="${c}">${CX.CLASES[c].nom}</option>`).join('')}</select>
      <select id="mfO"><option value="nuevo">Más nuevos</option><option value="barato">Más baratos</option><option value="caro">Más caros</option><option value="puro">Más puros</option></select></div><div class="rejilla" id="mLista"><div class="vacio" style="grid-column:1/-1">Cargando…</div></div>`;
    $('#mfT').value = f.tipo; $('#mfC').value = f.clase; $('#mfO').value = f.orden;
    ['mfT', 'mfC', 'mfO'].forEach(id => $('#' + id).onchange = () => { f.tipo = $('#mfT').value; f.clase = $('#mfC').value; f.orden = $('#mfO').value; pinta(); });
    api('mercado').then(d => { if (!d.ok) return toast(d.error, 'err'); lista = d.lista; pinta(); });
  }
  function pinta() {
    let l = lista.filter(c => pest === 'tienda' ? c.dueno === 'TIENDA' : c.dueno !== 'TIENDA');
    if (f.tipo) l = l.filter(c => c.tipo === f.tipo);
    if (f.clase) l = l.filter(c => c.clase === f.clase);
    l.sort((a, b) => f.orden === 'barato' ? a.precio - b.precio : f.orden === 'caro' ? b.precio - a.precio : f.orden === 'puro' ? (b.genes ? CX.pureza(b.genes) : -1) - (a.genes ? CX.pureza(a.genes) : -1) : b.creada - a.creada);
    const el = $('#mLista'); if (!el) return;
    el.innerHTML = l.map(c => tcHTML(c, { mercado: true })).join('') || `<div class="vacio" style="grid-column:1/-1">${pest === 'tienda' ? 'La tienda oficial está vacía ahora mismo. ¡Vuelve pronto!' : 'Nadie está vendiendo nada todavía. ¡Sé el primero!'}</div>`;
    $$('.tc', el).forEach(t => t.onclick = () => { const c = lista.find(x => x.id === t.dataset.id); detalle(c.id, { criatura: c, mercado: true }); });
  }
  function mios() {
    $('#mCont').innerHTML = '<div class="vacio">Cargando…</div>';
    conSes('pedidos').then(d => {
      if (!d.ok) return toast(d.error, 'err');
      const enVenta = DATA.criaturas.filter(c => c.estado === 'venta');
      const fila = (x, comoComprador) => `<div class="ped">${x.item ? dibujo(x.item, 'quieto') : ''}<div class="pInfo"><b>${x.item ? esc(x.item.tipo === 'huevo' ? 'Huevo #' + x.item.num : nomCr(x.item)) : x.tipo === 'creditos' ? '💎 ' + fmt(x.importe) + ' créditos' : '—'}</b>
        <small>${new Date(x.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })} · ${comoComprador ? (x.tipo === 'creditos' ? 'Recarga de créditos' : x.vendedor === 'TIENDA' ? 'Tienda oficial' : 'de ' + esc(x.vendedor)) : 'para ' + esc(x.comprador)}</small>
        <span class="est ${x.estado}">${{ pendiente: 'ESPERANDO CONFIRMACIÓN', pagado: comoComprador ? 'RECIBIDA' : 'VENDIDA', rechazado: 'RECHAZADO', anulado: 'ANULADO' }[x.estado] || x.estado}</span>${x.nota && x.estado !== 'pagado' ? `<small>${esc(x.nota)}</small>` : ''}</div>
        <div style="text-align:right"><div class="pImp">${euros(x.importe)} €</div>${!comoComprador && x.estado === 'pagado' ? `<small style="color:var(--c);font-weight:700">+${fmt(Math.floor(x.importe * (DATA.reglas.comision || 50) / 100))} créditos</small>` : ''}
        ${comoComprador && x.estado === 'pendiente' ? `<div class="acciones" style="justify-content:flex-end;margin-top:6px"><a class="btn oro peq" target="_blank" rel="noopener" href="${x.url}">PAGAR</a><button class="btn sec peq" data-anular="${x.id}">ANULAR</button></div>` : ''}</div></div>`;
      $('#mCont').innerHTML = `<div class="panel" style="margin-bottom:14px"><h3 style="font-size:14px;margin-bottom:10px">MIS COMPRAS</h3>${d.compras.map(x => fila(x, true)).join('') || '<p class="nota">Aún no has comprado nada.</p>'}</div>
        <div class="panel" style="margin-bottom:14px"><h3 style="font-size:14px;margin-bottom:10px">PUESTO A LA VENTA</h3><div class="rejilla">${enVenta.map(c => tcHTML(c, { mercado: true })).join('')}</div>${enVenta.length ? '' : '<p class="nota">No tienes nada a la venta. Abre una criatura o un huevo y pulsa «Vender».</p>'}</div>
        <div class="panel"><h3 style="font-size:14px;margin-bottom:10px">MIS VENTAS</h3>${d.ventas.map(x => fila(x, false)).join('') || '<p class="nota">Aún no has vendido nada.</p>'}</div>`;
      $$('[data-anular]').forEach(b => b.onclick = async () => {
        if (!await confirmar('Anular compra', '¿Seguro? Si ya has pagado, no la anules: espera a que se confirme.', 'Anular', 'rojo')) return;
        conSes('cancelar', { id: b.dataset.anular }).then(r => { if (!r.ok) return toast(r.error, 'err'); toast('Compra anulada'); mios(); });
      });
      $$('#mCont .rejilla .tc').forEach(t => t.onclick = () => detalle(t.dataset.id));
    });
  }
  function comprar(c) {
    const nombre = c.tipo === 'huevo' ? 'Huevo #' + c.num : nomCr(c);
    const m = modal(`<div class="pago">${dibujo(c)}<h2 style="padding:0">${esc(nombre)}</h2><div class="imp">${euros(c.precio)} €</div>
      <ol class="pasos"><li>Pulsa <b>«Pagar con myPOS»</b>: se abrirá la página de pago de Futurmovil con el importe ya puesto.</li><li>Paga con tu tarjeta, Apple Pay o Google Pay.</li><li>Cuando Futurmovil confirme el pago, <b>${c.tipo === 'huevo' ? 'el huevo' : 'la criatura'} aparecerá en tu cuenta</b>. Mientras, queda reservado para ti.</li></ol>
      <button class="btn oro grande bloque" id="bPagar">PAGAR CON myPOS · ${euros(c.precio)} €</button>
      <p class="nota" style="margin-top:10px">¿Dudas? Escríbenos por <a class="enlace" target="_blank" rel="noopener" href="https://wa.me/${CFG.WHATSAPP}">WhatsApp</a>.</p></div>`);
    $('#bPagar', m).onclick = e => {
      const w = window.open('', '_blank'); ocupado(e.target, true);
      conSes('comprar', { id: c.id }).then(d => {
        ocupado(e.target, false);
        if (!d.ok) { if (w) w.close(); return toast(d.error, 'err'); }
        if (w) w.location = d.pedido.url; else location.href = d.pedido.url;
        Son.moneda();
        modal(`<div class="pago"><h2 style="padding:0">¡RESERVADO PARA TI!</h2>${dibujo(c)}<p class="nota">Completa el pago de <b>${euros(d.pedido.importe)} €</b> en la ventana de myPOS. En cuanto Futurmovil lo confirme, ${c.tipo === 'huevo' ? 'el huevo será tuyo' : 'la criatura será tuya'}.</p>
          <p class="nota" style="margin-top:8px">Pedido <b>${d.pedido.id}</b></p><div class="acciones" style="justify-content:center"><a class="btn oro" target="_blank" rel="noopener" href="${d.pedido.url}">ABRIR EL PAGO OTRA VEZ</a><button class="btn sec" onclick="cerrarModal();Mercado.ir('mios')">MIS COMPRAS</button></div></div>`);
        lista = lista.filter(x => x.id !== c.id); pinta();
      });
    };
  }
  function vender(c) {
    const R = DATA.reglas, nombre = c.tipo === 'huevo' ? 'Huevo #' + c.num : nomCr(c);
    const m = modal(`<h2>Vender ${esc(nombre)}</h2><div style="max-width:200px;margin:0 auto">${dibujo(c)}</div>
      <label class="campo"><span>Precio en euros</span><input id="vPre" inputmode="decimal" placeholder="10,00"></label>
      <p class="nota" id="vInfo">Recibirás el ${R.comision} % del precio en créditos cuando el comprador pague.</p>
      <div class="acciones" style="justify-content:flex-end"><button class="btn sec" onclick="cerrarModal()">Cancelar</button><button class="btn oro" id="vOk">PONER A LA VENTA</button></div>`);
    const inp = $('#vPre', m);
    inp.oninput = () => { const v = parseFloat(inp.value.replace(',', '.')) || 0; $('#vInfo').innerHTML = v ? `Si se vende a <b>${euros(v * 100)} €</b> recibirás <b style="color:var(--c)">${fmt(Math.floor(v * 100 * R.comision / 100))} créditos</b>.` : `Recibirás el ${R.comision} % del precio en créditos cuando el comprador pague.`; };
    setTimeout(() => inp.focus(), 100);
    $('#vOk', m).onclick = e => {
      ocupado(e.target, true);
      conSes('vender', { id: c.id, precio: inp.value }).then(d => {
        ocupado(e.target, false); if (!d.ok) return toast(d.error, 'err');
        Object.assign(c, d.criatura); aplicaPerfil(d.perfil); cerrarModal(); Son.moneda(); toast('¡Puesto a la venta!', 'ok'); ir(VISTA);
      });
    };
  }
  function retirar(c, b) {
    ocupado(b, true);
    conSes('retirar', { id: c.id }).then(d => { ocupado(b, false); if (!d.ok) return toast(d.error, 'err'); Object.assign(c, d.criatura); cerrarModal(); toast('Retirado del mercado'); ir(VISTA); });
  }
  return { vista, comprar, vender, retirar, ir: p => { pest = p; ir('mercado'); } };
})();
VISTAS.mercado = div => Mercado.vista(div);

/* =========================================================
   COMBATIR · AVENTURA · ARENA · RANKING
   ========================================================= */
VISTAS.combatir = div => {
  const p = SES.perfil;
  div.innerHTML = `<div class="ancho"><div class="tit"><h1>COMBATIR</h1><div class="sub">Te quedan <b style="color:var(--v)">${p.energia}</b> combates con premio hoy.</div></div>
    <div class="losas" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
      ${losa('aventura', 'AVENTURA', `30 etapas contra robots salvajes · vas por la ${Math.min(30, p.etapa + 1)}`, '#19ff6a', 'mapa', `<div class="prog"><i style="width:${p.etapa / 30 * 100}%"></i></div>`)}
      ${losa('arena', 'ARENA', `Contra equipos de otros jugadores · ${p.elo} puntos`, '#ff2bd6', 'espadas')}
      ${losa('ranking', 'RANKING', 'Clasificación de la arena y la aventura', '#ffd23f', 'copa')}
    </div>
    <div class="panel" style="margin-top:16px"><h3 style="font-size:14px;margin-bottom:8px">CÓMO SE JUEGA</h3>
    <p class="nota">Cada criatura tiene 4 cartas (boca, cuerno, espalda y cola). En cada ronda recibes energía y cartas: toca las cartas para asignarlas y pulsa <b>¡LUCHAR!</b>. Actúa primero la criatura más rápida. Las cartas de la misma clase que la criatura pegan un 10 % más, y hay ventaja entre clases:
    <b style="color:var(--plasma)">Plasma</b> y <b style="color:var(--voltio)">Voltio</b> ganan a <b style="color:var(--bio)">Bio</b> y <b style="color:var(--cromo)">Cromo</b>, que ganan a <b style="color:var(--cuantico)">Cuántico</b> y <b style="color:var(--sombra)">Sombra</b>, que ganan a Plasma y Voltio (+15 %).</p></div></div>`;
  $$('[data-ir]', div).forEach(b => b.onclick = () => ir(b.dataset.ir));
};
VISTAS.aventura = div => {
  const p = SES.perfil, zc = ['#19ff6a', '#00e5ff', '#ff4d2e', '#8af9ff', '#b14bff', '#ffd23f'];
  let h = '';
  for (let n = 1; n <= 30; n++) {
    const z = Math.floor((n - 1) / 5);
    if ((n - 1) % 5 === 0) h += `<div class="zona" style="--zc:${zc[z]}">${CX.ZONAS[z].toUpperCase()}</div>`;
    const ok = n <= p.etapa, act = n === p.etapa + 1, bloq = n > p.etapa + 1, jefe = n % 5 === 0;
    h += `<button class="nodo ${jefe ? 'jefe' : ''} ${bloq ? 'bloq' : ''} ${act ? 'actual' : ''}" style="--zc:${zc[z]}" data-n="${n}"><span>${jefe ? '☠' : n}</span>${ok ? '<i class="ok">✓</i>' : ''}</button>`;
  }
  div.innerHTML = `<div class="ancho"><div class="tit"><h1>AVENTURA</h1><div class="sub">Supera las 30 etapas. La primera vez que ganas una etapa te llevas muchos más chips.</div></div><div class="panel"><div class="mapa">${h}</div></div></div>`;
  $$('.nodo', div).forEach(b => b.onclick = () => {
    const n = +b.dataset.n, e = CX.etapa(n), primera = n > p.etapa;
    const m = modal(`<h2>${e.jefe ? '☠ JEFE · ' : ''}Etapa ${n} · ${esc(e.zona)}</h2><div class="rivales">${e.eq.map(g => `<div class="espejo">${ROBOT.svg(g)}</div>`).join('')}</div>
      <div style="display:flex;justify-content:center;gap:6px;margin:8px 0">${e.eq.map(g => claseHTML(g.c)).join('')}</div>
      <p class="nota" style="text-align:center">Fuerza ${Math.round(e.mult * 100)} % · Premio: <b style="color:var(--o)">${primera ? 15 + 3 * n : 4 + Math.floor(n / 2)} chips</b>${primera ? ' (primera victoria)' : ''}</p>
      <div class="acciones" style="justify-content:center"><button class="btn grande" id="bLuchar">⚔ LUCHAR</button></div>`);
    $('#bLuchar', m).onclick = ev => { ocupado(ev.target, true); Combate.empezar({ modo: 'pve', etapa: n }).then(() => ocupado(ev.target, false)); };
  });
};
VISTAS.arena = div => {
  const p = SES.perfil;
  div.innerHTML = `<div class="ancho"><div class="tit"><h1>ARENA</h1><div class="sub">Lucha contra el equipo de otro jugador. Ganar sube tus puntos y te da chips.</div></div>
    <div class="arenaTop"><div class="kpi"><b>${p.elo}</b><small>PUNTOS</small></div><div class="kpi"><b style="color:var(--v)">${p.victorias}</b><small>VICTORIAS</small></div><div class="kpi"><b style="color:var(--r)">${p.derrotas}</b><small>DERROTAS</small></div></div>
    <div class="panel" style="text-align:center"><div class="radar" id="radar"></div><button class="btn mag grande" id="bBuscar">BUSCAR RIVAL</button></div></div>`;
  $('#bBuscar').onclick = e => { ocupado(e.target, true); Son.estado(); Combate.empezar({ modo: 'pvp' }).then(() => ocupado(e.target, false)); };
};
VISTAS.ranking = div => {
  let pest = 'arena', D = null;
  div.innerHTML = `<div class="ancho"><div class="tit"><h1>RANKING</h1></div><div class="pestanas" id="rp"><button class="on" data-k="arena">⚔ ARENA</button><button data-k="aventura">🗺 AVENTURA</button></div><div id="rkC"><div class="vacio">Cargando…</div></div></div>`;
  const pct = r => r.v + r.d ? Math.round(r.v / (r.v + r.d) * 100) : 0;
  const AYUDA = {
    arena: '<b>Ordenado por puntos de arena.</b> Todos empiezan con <b>1000</b>. Ganar suma puntos y perder resta: ganar a alguien con más puntos que tú suma mucho y perder contra alguien con menos resta mucho. Cuentan las partidas contra jugadores y contra bots.',
    aventura: '<b>Ordenado por la etapa más alta superada</b> en la Aventura (hay 30). Gana quien haya llegado más lejos.'
  };
  function valor(k, r) { return k === 'arena' ? `<b class="rkPts">${fmt(r.elo)}</b><small>puntos</small>` : `<b class="rkPts">${r.etapa}</b><small>de 30</small>`; }
  function pinta() {
    $$('#rp button').forEach(b => b.classList.toggle('on', b.dataset.k === pest));
    const L = (D && D[pest]) || [], yoU = SES.perfil.usuario, iy = L.findIndex(r => r.usuario === yoU), p = SES.perfil;
    const mio = pest === 'arena' ? { usuario: yoU, elo: p.elo, v: p.victorias, d: p.derrotas } : { usuario: yoU, etapa: p.etapa };
    const jugado = pest === 'arena' ? p.victorias + p.derrotas > 0 : p.etapa > 0;
    const puesto = iy >= 0 ? `<b>${iy + 1}º</b> de ${L.length}` : jugado ? 'Fuera del top 50' : (pest === 'arena' ? 'Juega en la Arena para entrar' : 'Supera la etapa 1 para entrar');
    const stats = pest === 'arena'
      ? `<div class="rkSt"><b>${fmt(mio.elo)}</b><small>PUNTOS</small></div><div class="rkSt v"><b>${mio.v}</b><small>VICTORIAS</small></div><div class="rkSt d"><b>${mio.d}</b><small>DERROTAS</small></div><div class="rkSt"><b>${pct(mio)}%</b><small>GANADAS</small></div>`
      : `<div class="rkSt"><b>${mio.etapa}/30</b><small>ETAPA</small></div><div class="rkBar"><i style="width:${mio.etapa / 30 * 100}%"></i></div>`;
    const med = i => ['oro', 'plata', 'bronce'][i];
    const podio = L.slice(0, 3).map((r, i) => ({ r, i }));
    const ordenPodio = podio.length === 3 ? [podio[1], podio[0], podio[2]] : podio;
    $('#rkC').innerHTML = `<p class="rkAyuda">${AYUDA[pest]}</p>
      <div class="rkYo"><span class="rkAv">${esc((yoU || '?')[0].toUpperCase())}</span><div class="rkYoTxt"><small>TU POSICIÓN</small><div>${puesto}</div></div><div class="rkStats">${stats}</div></div>
      ${L.length ? `<div class="rkPodio">${ordenPodio.map(({ r, i }) => `<div class="rkP ${med(i)}${r.usuario === yoU ? ' yo' : ''}"><span class="rkMed">${i + 1}</span><b class="rkNom">${esc(r.usuario)}</b>${valor(pest, r)}${pest === 'arena' ? `<span class="rkVD"><i class="v">${r.v}V</i><i class="d">${r.d}D</i></span>` : ''}<div class="rkBase"></div></div>`).join('')}</div>` : ''}
      <div class="panel rkTabla"><table class="ranking"><thead><tr><th>#</th><th>JUGADOR</th>${pest === 'arena' ? '<th class="n">PUNTOS</th><th class="n v">V</th><th class="n d">D</th><th class="n m">%</th>' : '<th class="n">ETAPA</th><th class="m">PROGRESO</th>'}</tr></thead><tbody>
      ${L.map((r, i) => `<tr class="${r.usuario === yoU ? 'yo' : ''}"><td><span class="rkN ${i < 3 ? med(i) : ''}">${i + 1}</span></td><td class="rkJ">${esc(r.usuario)}${r.usuario === yoU ? ' <em>TÚ</em>' : ''}</td>${pest === 'arena'
        ? `<td class="n"><b>${fmt(r.elo)}</b></td><td class="n v">${r.v}</td><td class="n d">${r.d}</td><td class="n m">${pct(r)}%</td>`
        : `<td class="n"><b>${r.etapa}</b><small>/30</small></td><td class="m"><div class="rkBar mini"><i style="width:${r.etapa / 30 * 100}%"></i></div></td>`}</tr>`).join('') || `<tr><td colspan="6" class="nota" style="text-align:center;padding:18px">Todavía no hay nadie. ¡Sé el primero!</td></tr>`}</tbody></table></div>`;
  }
  $$('#rp button').forEach(b => b.onclick = () => { pest = b.dataset.k; Son.click(); pinta(); });
  api('ranking').then(d => { if (!d.ok) return toast(d.error, 'err'); D = d; pinta(); });
};

/* =========================================================
   CUENTA
   ========================================================= */
VISTAS.cuenta = div => {
  const p = SES.perfil;
  div.innerHTML = `<div class="ancho"><div class="tit"><h1>MI CUENTA</h1></div>
    <div class="arenaTop"><div class="kpi"><b style="color:var(--o)">${fmt(p.chips)}</b><small>CHIPS</small></div><div class="kpi"><b>${fmt(p.creditos)}</b><small>CRÉDITOS</small></div><div class="kpi"><b style="color:var(--v)">${p.energia}/${p.energiaMax}</b><small>COMBATES HOY</small></div></div>
    <div class="panel" style="margin-bottom:14px"><p><b>${esc(p.usuario)}</b> · <span class="nota">${esc(p.email)}</span></p>
    <p class="nota" style="margin-top:8px">Los <b>créditos</b> son lo que ganas al vender tus criaturas y huevos (1 céntimo = 1 crédito). Pronto podrás usarlos dentro del juego.</p>
    <div class="acciones"><button class="btn sec" id="bMus">${load('mus', true) ? '♫ QUITAR MÚSICA' : '♫ PONER MÚSICA'}</button><button class="btn sec" id="bIns">⤓ INSTALAR</button><button class="btn sec" id="bCom">⇪ COMPARTIR</button><button class="btn rojo" id="bSalir">CERRAR SESIÓN</button></div></div>
    <div class="panel"><h3 style="font-size:14px;margin-bottom:8px">MOVIMIENTOS</h3><div id="movs" class="nota">Cargando…</div></div></div>`;
  $('#bSalir').onclick = async () => { if (await confirmar('Cerrar sesión', '¿Seguro que quieres salir?', 'Salir', 'rojo')) cerrarSesion(); };
  $('#bMus').onclick = () => { store('mus', !load('mus', true)); ir('cuenta'); };
  $('#bIns').onclick = instalar; $('#bCom').onclick = compartir;
  conSes('movimientos').then(d => {
    if (!d.ok) return;
    $('#movs').innerHTML = d.lista.length ? `<table class="tabla">${d.lista.map(m => `<tr><td style="color:var(--tx2);white-space:nowrap">${new Date(m.fecha).toLocaleDateString('es-ES')}</td><td>${esc(m.concepto)}</td><td style="text-align:right;white-space:nowrap">${m.creditos ? `<b style="color:${m.creditos > 0 ? 'var(--c)' : 'var(--r)'}">${m.creditos > 0 ? '+' : ''}${fmt(m.creditos)} cr</b> ` : ''}${m.chips ? `<b style="color:var(--o)">${m.chips > 0 ? '+' : ''}${m.chips} chips</b>` : ''}</td></tr>`).join('')}</table>` : 'Aún no hay movimientos.';
  });
};

/* =========================================================
   ARRANQUE
   ========================================================= */
document.addEventListener('pointerdown', () => Son.init(), { once: true });
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

/* ---- actualización automática: si hay una versión nueva, se recarga sola cuando no estás en combate ---- */
const VERSION = 43;   // subir este número (y version.json) en cada actualización
let nuevaVersion = 0, actualizando = false, ultVer = 0;
function compruebaVersion(forzar) {
  if (actualizando || (!forzar && Date.now() - ultVer < 30000)) return; ultVer = Date.now();
  fetch('version.json?n=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.json() : null)
    .then(d => { if (d && Number(d.v) > VERSION) { nuevaVersion = Number(d.v); intentaActualizar(); } }).catch(() => {});
}
function libreParaActualizar() { return VISTA !== 'combate' && $('#modal').classList.contains('oculto'); }
function intentaActualizar() {
  if (!nuevaVersion || actualizando || !libreParaActualizar()) return;
  actualizando = true;
  const ov = document.createElement('div'); ov.className = 'actualiza'; ov.innerHTML = '<div class="aRueda"></div><b>ACTUALIZANDO</b><small>Nueva versión de CRIATURIX</small>'; document.body.appendChild(ov);
  (async () => {
    try { const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); if (reg) await reg.update(); } catch (e) {}
    try { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); } catch (e) {}
  })().finally(() => setTimeout(() => location.reload(), 1400));
}
setTimeout(() => compruebaVersion(true), 4000);
setInterval(() => compruebaVersion(true), 120000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') compruebaVersion(); });
setInterval(intentaActualizar, 3000);   // si llega durante un combate, se aplica al salir
function arrancar() {
  if (!SES) return ir('login');
  ir('inicio');
  refrescar().then(d => {
    if (!d || !d.ok) return;
    if (VISTA === 'inicio') ir('inicio');
    conSes('encurso').then(r => { if (r.ok && r.combate) Combate.reanudar(r.combate); });
  });
}
setTimeout(arrancar, 0);
