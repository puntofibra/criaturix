/* =========================================================
   CRIATURIX · pantalla de combate
   ========================================================= */
'use strict';
const Combate = (() => {
  let S = null, sel = { 0: [], 1: [], 2: [] }, ocup = false, animando = false, vel = load('vel', 1), relojT = 0, sondeoT = 0, buscando = null;
  const esPvp = () => !!(S && S.meta && S.meta.real);   // partida contra otro jugador real
  const conReloj = () => !!(S && S.meta && S.meta.modo === 'pvp');   // arena: reloj por turno (también contra bots, para que no se note)
  const turnoMs = () => ((DATA.reglas && DATA.reglas.turnoSeg) || 40) * 1000;
  // contra un bot: el «rival» tarda un rato aleatorio en elegir, como una persona
  function rivalBot(primera) { if (!S || esPvp()) return; S.rivalT = Date.now() + (primera ? 6000 : 0) + 2500 + Math.random() * 14000; S.rivalListo = false; }
  const EST = { corr: ['CORR', '#d38bff'], aturde: ['ATURD', '#ffe03a'], miedo: ['MIEDO', '#ff4fd8'], atkMas: ['ATQ▲', '#ff6b5a'], atkMenos: ['ATQ▼', '#9fb6c4'], velMas: ['VEL▲', '#19ff6a'], velMenos: ['VEL▼', '#9fb6c4'], expuesto: ['EXPU', '#ffb02e'] };
  const NOM_EST = { corrosion: 'CORROSIÓN', aturdido: 'ATURDIDO', miedo: 'MIEDO', debilitado: 'DEBILITADO', lento: 'LENTO', expuesto: 'EXPUESTO', potenciado: 'POTENCIADO', veloz: 'VELOZ' };

  function empezar(o) {
    if (o.modo === 'pvp') return buscar();
    return conSes('combate', o).then(d => {
      if (!d.ok) { toast(d.error, 'err'); return; }
      entrar(d);
    });
  }
  function nuevoS(d) {
    S = { meta: d.meta, vista: d.vista, enviado: d.enviado ? d.vista.ronda : 0, rivalListo: !!d.rivalListo, anim: 0 }; sel = { 0: [], 1: [], 2: [] };
    ponReloj(d.quedan);
    if (conReloj() && !esPvp()) { ponReloj(turnoMs() + 6000); rivalBot(true); }
  }
  function entrar(d) {
    cerrarModal(); nuevoS(d);
    ir('combate');
    setTimeout(() => { banner('¡A LUCHAR!', d.meta.modo === 'pve' ? 'ETAPA ' + d.meta.etapa : 'ARENA', '#ff2bd6'); Son.turno(); }, 2100);
  }
  /* ---------- arena: buscar rival (espera a jugadores reales y, si no hay, bot) ---------- */
  function buscar() {
    if (buscando) return buscando;
    let cancel = false, primera = true, msgI = 0;
    const t0 = Date.now(), sid = Math.random().toString(36).slice(2, 10);
    const blips = Array.from({ length: 9 }, () => { const an = Math.random() * 360, r = 18 + Math.random() * 28; return { an, r }; });
    const o = document.createElement('div'); o.className = 'busca';
    o.innerHTML = `<div class="bsFondo"></div>
      <div class="bsCaja">
        <div class="bsCab"><small>ARENA · TIEMPO REAL</small><h2>BUSCANDO RIVAL</h2></div>
        <div class="bsRadar">
          <i class="bsAro a1"></i><i class="bsAro a2"></i><i class="bsAro a3"></i><i class="bsAro a4"></i><i class="bsCruz"></i><i class="bsMarcas"></i>
          <i class="bsBarrido"></i>
          ${blips.map(b => `<i class="bsBlip" style="--x:${(50 + Math.cos((b.an - 90) * Math.PI / 180) * b.r).toFixed(1)}%;--y:${(50 + Math.sin((b.an - 90) * Math.PI / 180) * b.r).toFixed(1)}%;--d:${(b.an / 360 * 2.4).toFixed(2)}s"></i>`).join('')}
          <i class="bsOnda"></i><i class="bsOnda o2"></i>
          <div class="bsYo">${OJO_RADAR}</div>
        </div>
        <div class="bsEstado"><span class="bsPunto"></span><b id="bsTxt">Escaneando la red…</b><em id="bsSeg">0:00</em></div>
        <button class="btn sec" id="bsNo">CANCELAR</button>
      </div>`;
    document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
    const MSG = ['Escaneando la red…', 'Buscando jugadores conectados…', 'Buscando rivales de tu nivel…', 'Preparando la arena…'];
    Son.estado();
    const ping = setInterval(() => { if (!o.isConnected) return clearInterval(ping); Son.ping && Son.ping(); }, 2400);
    const reloj = setInterval(() => {
      if (!o.isConnected) return clearInterval(reloj);
      const sg = Math.floor((Date.now() - t0) / 1000); $('#bsSeg', o).textContent = Math.floor(sg / 60) + ':' + String(sg % 60).padStart(2, '0');
      if (sg && sg % 2 === 0) { msgI = (msgI + 1) % MSG.length; const el = $('#bsTxt', o); el.classList.remove('cambia'); void el.offsetWidth; el.classList.add('cambia'); el.textContent = MSG[msgI]; }
    }, 1000);
    const quitar = () => { clearInterval(ping); clearInterval(reloj); o.classList.remove('on'); setTimeout(() => o.remove(), 300); };
    buscando = new Promise(fin => {
      const acabar = () => { buscando = null; fin(); };
      const encontrado = d => {
        Son.moneda(); vib([30, 40, 30]); clearInterval(ping); clearInterval(reloj);
        o.classList.add('hallado');
        $('.bsCaja', o).insertAdjacentHTML('beforeend', `<div class="bsHallado"><small>¡RIVAL ENCONTRADO!</small><b>${esc(d.meta.rival)}</b></div>`);
        setTimeout(() => { quitar(); acabar(); entrar(d); }, 1300);
      };
      $('#bsNo', o).onclick = () => {
        cancel = true; Son.click(); quitar();
        if (VISTA === 'combate') { S = null; ir('arena'); }
        conSes('nobuscar').then(d => { if (d.ok && d.vista) entrar(d); });
        acabar();
      };
      const paso = () => {
        if (cancel) return;
        conSes('buscar', { nueva: primera ? 1 : 0, sid, ya: Date.now() - t0 > 7000 ? 1 : 0 }).then(d => {
          primera = false;
          if (cancel) return;
          if (!d.ok) { quitar(); toast(d.error, 'err'); return acabar(); }
          if (d.vista) return encontrado(d);
          setTimeout(paso, 700);
        });
      };
      paso();
    });
    return buscando;
  }
  /* ojo de criaturix bio con párpados (mismo parpadeo que las criaturas) */
  const OJO_RADAR = (() => {
    const cx = 149, cy = 172, r = 80, f = v => v.toFixed(1);
    return `<svg class="rb ojoRadar" viewBox="47 70 204 204"><defs><clipPath id="ojoRc"><ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 1.02}"/></clipPath>
      <linearGradient id="ojoRs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2e16"/><stop offset=".72" stop-color="#7a4e2a"/><stop offset=".84" stop-color="#b6ff3a" stop-opacity=".5"/><stop offset=".92" stop-color="#4a2e16"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></linearGradient>
      <linearGradient id="ojoRi" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#4a2e16"/><stop offset=".8" stop-color="#7a4e2a"/><stop offset="1" stop-color="#b6ff3a" stop-opacity=".4"/></linearGradient></defs>
      <image href="img/piezas/cara_ojo_bio.webp?v=23" x="0" y="0" width="307" height="307"/>
      <g class="rb-parp doble" clip-path="url(#ojoRc)" style="--pd:3.2s;--pdl:-1.4s">
      <path class="sup" d="M${f(cx - r * 1.1)} ${f(cy - r * 1.25)}H${f(cx + r * 1.1)}V${f(cy + r * .35)}Q${cx} ${f(cy + r * .72)} ${f(cx - r * 1.1)} ${f(cy + r * .35)}Z" fill="url(#ojoRs)"/>
      <path class="inf" d="M${f(cx - r * 1.1)} ${f(cy + r * 1.15)}H${f(cx + r * 1.1)}V${f(cy + r * .3)}Q${cx} ${f(cy + r * .1)} ${f(cx - r * 1.1)} ${f(cy + r * .3)}Z" fill="url(#ojoRi)"/></g></svg>`;
  })();
  function reanudar(c) {
    nuevoS(c);
    const m = modal(`<h2>Tienes un combate a medias</h2><p class="nota">Contra <b>${esc(c.meta.rival)}</b>, ronda ${c.vista.ronda}.</p><div class="acciones" style="justify-content:flex-end"><button class="btn sec" id="cRen">Rendirme</button><button class="btn" id="cSeg">CONTINUAR</button></div>`);
    $('#cSeg', m).onclick = () => { cerrarModal(); ir('combate'); };
    $('#cRen', m).onclick = () => { cerrarModal(); rendirse(); };
  }
  function energiaUsada() { let n = 0; const V = S.vista; [0, 1, 2].forEach(p => sel[p].forEach(u => { const k = V.yo.mano.find(x => x.u === u); if (k) n += k.c; })); return n; }

  function vista(div) {
    if (!S) return ir('inicio');
    div.className = 'vista combate';
    const V = S.vista;
    div.innerHTML = `<div class="cbTop"><span class="ronda">RONDA <b id="cRonda">${V.ronda}</b></span><div class="vs">${esc(V.yo.nombre)} <em>VS</em> ${esc(V.el.nombre)}</div>${conReloj() ? '<span class="reloj" id="cReloj"></span>' : ''}
        <button class="ibtn" id="cSon"><svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path class="ondas" d="M16 8a5 5 0 0 1 0 8" fill="none" stroke-width="2"/></svg></button><button class="ibtn vel" id="cVel" title="Velocidad de la animación">x${vel}</button><button class="ibtn bPower" aria-label="Salir del juego" title="Salir del juego">${ICO_POWER}</button><button class="btn sec peq" id="cSalir">SALIR</button></div>
      <div class="campo2" id="campo"><div class="lado el" id="ladoEl"></div><div class="lado yo" id="ladoYo"></div></div>
      <div class="cbBajo"><div class="cbCtrl"><div class="energia" id="cEn"></div><span class="mazoN" id="cMazo"></span>
        <div class="der"><button class="btn sec peq" id="cLimpiar">BORRAR</button><button class="btn grande" id="cLuchar">¡LUCHAR!</button></div></div>
        <div class="mano" id="cMano"></div></div>`;
    $('#cSon').classList.toggle('off', !Son.on);
    $('#cSon').onclick = () => { $('#cSon').classList.toggle('off', !Son.alternar()); };
    $('#cSalir').onclick = salir;
    $('#cLimpiar').onclick = () => { sel = { 0: [], 1: [], 2: [] }; Son.quita(); pintaMano(); pintaPilas(); };
    $('#cLuchar').onclick = luchar;
    $('#cVel').onclick = () => { vel = vel >= 3 ? 1 : vel + 1; store('vel', vel); $('#cVel').textContent = 'x' + vel; Son.click(); };
    pintaLados(); pintaMano();
    FX.montar($('#campo'));
    if (window.ARENA) ARENA.montar(div);
    if (!S.visto) { S.visto = 1; intro(div); }
    if (conReloj()) { if (S.enviado === V.ronda) ponEspera(); iniciaPvp(); }
    zoomCartas($('#cMano'));
  }
  /* ---------- partida contra otro jugador: reloj del turno y consulta al servidor ---------- */
  function ponReloj(q) { if (S && q != null) S.limite = Date.now() + q; }
  function ponEspera() { const c = $('#campo'); if (c && !$('#cEsp')) c.insertAdjacentHTML('beforeend', `<div class="esperando" id="cEsp"><span>${conReloj() ? 'ESPERANDO A ' + esc(S.vista.el.nombre.toUpperCase()) + '…' : 'RESOLVIENDO…'}</span></div>`); }
  function quitaEspera() { const e = $('#cEsp'); if (e) e.remove(); }
  function pintaReloj() {
    const el = $('#cReloj'); if (!el || !S) return;
    if (!esPvp() && S.rivalT && Date.now() > S.rivalT) S.rivalListo = true;
    if (animando || S.vista.fin || !S.limite) { el.innerHTML = ''; el.className = 'reloj'; return; }
    const q = Math.max(0, Math.ceil((S.limite - Date.now()) / 1000)), yaEnv = S.enviado === S.vista.ronda;
    el.innerHTML = `⏱<b>${q}</b>${S.rivalListo && !yaEnv ? '<small>RIVAL LISTO</small>' : ''}`;
    el.className = 'reloj' + (q <= 10 && !yaEnv ? ' poco' : '') + (S.rivalListo && !yaEnv ? ' listo' : '');
  }
  function iniciaPvp() {
    clearInterval(relojT); clearTimeout(sondeoT);
    relojT = setInterval(() => {
      if (VISTA !== 'combate' || !conReloj()) return clearInterval(relojT);
      pintaReloj();
      // se acaba el tiempo: se envían las cartas que haya elegidas
      if (!animando && !ocup && !S.vista.fin && S.enviado !== S.vista.ronda && S.limite && S.limite - Date.now() < 1200) luchar();
    }, 500);
    if (!esPvp()) return;   // contra bots el reloj es solo local
    const sondeo = () => {
      if (VISTA !== 'combate' || !esPvp()) return;
      const r = S.vista.ronda;
      conSes('esperar', { ronda: r }).then(d => {
        if (VISTA !== 'combate' || !esPvp()) return;
        if (d.ok && !d.sinCombate && !animando && S.vista.ronda === r) {
          ponReloj(d.quedan); S.rivalListo = !!d.rivalListo; pintaReloj();
          if (d.resuelta) procesar(d, r);
        }
        sondeoT = setTimeout(sondeo, S && S.enviado === S.vista.ronda ? 1200 : 2000);
      });
    };
    sondeoT = setTimeout(sondeo, 1500);
  }
  /* ---------- presentación VS ---------- */
  function intro(div) {
    const V = S.vista;
    $$('.lu', div).forEach((e, i) => { e.style.setProperty('--d', (0.55 + (+e.dataset.p) * 0.12 + (+e.dataset.l) * 0.06) + 's'); e.classList.add('entra'); });
    const eq = l => (l ? V.el : V.yo).cr.map(c => `<i style="--cc:${colClase(c.genes.c)}">${ROBOT.svg(c.genes, { cls: 'quieto' })}</i>`).join('');
    const d = document.createElement('div'); d.className = 'cIntro';
    d.innerHTML = `<div class="ciLado yo"><div class="ciEq">${eq(0)}</div><b>${esc(V.yo.nombre)}</b></div><div class="ciVs">VS</div><div class="ciLado el"><div class="ciEq">${eq(1)}</div><b>${esc(V.el.nombre)}</b></div>`;
    div.appendChild(d); Son.vs(); vib([20, 40, 60]);
    setTimeout(() => { FX.temblor(0.5); FX.destello('#fff', 0.35); }, 420);
    setTimeout(() => d.classList.add('fuera'), 1500); setTimeout(() => d.remove(), 2100);
    setTimeout(() => $$('.lu.entra', div).forEach(e => e.classList.remove('entra')), 3200);
  }
  function luHTML(c, l, p) {
    const pct = Math.max(0, c.pv / c.pvMax * 100), cls = pct < 30 ? 'bajo' : pct < 60 ? 'medio' : '';
    const ests = Object.keys(EST).filter(k => c.est && c.est[k] && (k !== 'miedo' || c.est[k] >= S.vista.ronda)).map(k => `<i style="color:${EST[k][1]}">${EST[k][0]}${k === 'corr' ? c.est.corr : ''}</i>`).join('');
    return `<div class="lu ${l ? 'el' : 'yo'} ${c.vivo ? '' : 'muerto'} ${c.esc > 0 ? 'conEsc' : ''}" data-l="${l}" data-p="${p}" style="--cc:${colClase(c.genes.c)}">
      <div class="ests">${ests}</div><div class="pila"></div>
      <div class="cuerpo"><div class="pad"></div>${ROBOT.svg(c.genes)}<div class="escudo"></div></div>
      <div class="hp"><b style="width:${pct}%"></b><i class="${cls}" style="width:${pct}%"></i><u style="width:${Math.min(100, c.esc / c.pvMax * 100)}%"></u></div>
      <div class="hpTxt"><span class="pv">${c.pv}</span>/${c.pvMax}${c.esc > 0 ? ` <span class="e">⛨${c.esc}</span>` : ''}</div><div class="luNom">${esc(c.nom)}</div></div>`;
  }
  function pintaLados() {
    const V = S.vista;
    // en horizontal: mis criaturas con la de delante a la derecha; las del rival con la de delante a la izquierda
    const yo = [2, 1, 0].map(p => luHTML(V.yo.cr[p], 0, p)).join(''), el = [0, 1, 2].map(p => luHTML(V.el.cr[p], 1, p)).join('');
    $('#ladoYo').innerHTML = yo; $('#ladoEl').innerHTML = el;
    $$('.lu.el').forEach(e => e.onclick = () => infoRival(+e.dataset.p));
    $$('.lu.yo').forEach(e => e.onclick = () => infoRival(+e.dataset.p, true));
    pintaPilas();
  }
  function infoRival(p, mio) {
    const c = (mio ? S.vista.yo : S.vista.el).cr[p];
    modal(`<h2>${esc(c.nom)} ${claseHTML(c.genes.c)}</h2>${statsHTML(c.genes)}<div class="cartasDet">${CX.cartasDe(c.genes).map(k => cartaHTML(k, { genes: c.genes })).join('')}</div>`, { cls: 'ancha' });
  }
  function pintaMano() {
    const V = S.vista, usada = energiaUsada(), libre = V.yo.en - usada;
    $('#cEn').innerHTML = Array.from({ length: CX_MAX_EN }, (_, i) => `<i class="${i < libre ? 'on' : i < V.yo.en ? 'gasto' : ''}"></i>`).join('') + `<span>${libre}</span>`;
    $('#cMazo').textContent = V.yo.mazo + ' en mazo';
    const elegidas = new Set([].concat(sel[0], sel[1], sel[2]));
    $('#cMano').innerHTML = V.yo.mano.map(k => {
      const c = V.yo.cr[k.p], el = elegidas.has(k.u), bloq = !c.vivo || (!el && (k.c > libre || sel[k.p].length >= 4));
      return cartaHTML(k, { genes: c.genes, cls: (el ? 'elegida ' : '') + (bloq ? 'bloq' : ''), attr: `data-u="${k.u}"` });
    }).join('') || '<p class="nota" style="padding:20px">Sin cartas en la mano</p>';
    $$('#cMano .carta').forEach(b => b.onclick = () => tocaCarta(b.dataset.u));
  }
  function pintaPilas() {
    const V = S.vista;
    [0, 1, 2].forEach(p => {
      const el = $(`.lu[data-l="0"][data-p="${p}"] .pila`); if (!el) return;
      el.innerHTML = sel[p].map(u => { const k = V.yo.mano.find(x => x.u === u); return k ? `<b style="--cc:${colClase(k.clase)}"></b>` : ''; }).join('');
    });
  }
  function tocaCarta(u) {
    if (ocup || zoomHecho || (conReloj() && S.enviado === S.vista.ronda)) return;
    const V = S.vista, k = V.yo.mano.find(x => x.u === u); if (!k) return;
    const c = V.yo.cr[k.p]; if (!c.vivo) return;
    const i = sel[k.p].indexOf(u);
    if (i >= 0) { sel[k.p].splice(i, 1); Son.quita(); }
    else {
      if (sel[k.p].length >= 4) return toast('Máximo 4 cartas por criatura');
      if (k.c > V.yo.en - energiaUsada()) { toast('No tienes energía suficiente'); Son.falla(); return; }
      sel[k.p].push(u); Son.carta(sel[0].length + sel[1].length + sel[2].length - 1); vib(10);
    }
    pintaMano(); pintaPilas();
  }
  /* mantener pulsada una carta: se ve en grande; al soltar, desaparece */
  let zoomHecho = false;
  function zoomCartas(cont) {
    if (!cont || cont._zoom) return; cont._zoom = 1;
    let t = 0, z = null, x0 = 0, y0 = 0;
    const quitar = () => { clearTimeout(t); if (z) { z.classList.add('fuera'); const zz = z; setTimeout(() => zz.remove(), 160); z = null; setTimeout(() => zoomHecho = false, 60); } };
    cont.addEventListener('pointerdown', e => {
      const c = e.target.closest('.carta'); if (!c) return;
      x0 = e.clientX; y0 = e.clientY; zoomHecho = false;
      t = setTimeout(() => {
        zoomHecho = true; vib(15);
        z = document.createElement('div'); z.className = 'zoomCarta';
        const k = c.cloneNode(true); k.classList.remove('elegida', 'bloq'); k.classList.add('grande'); z.appendChild(k);
        document.body.appendChild(z);
      }, 550);
    });
    cont.addEventListener('pointermove', e => { if (!z && (Math.abs(e.clientX - x0) > 10 || Math.abs(e.clientY - y0) > 10)) clearTimeout(t); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => cont.addEventListener(ev, quitar));
    cont.addEventListener('contextmenu', e => e.preventDefault());
  }
  function luchar() {
    if (ocup || animando || (conReloj() && S.enviado === S.vista.ronda)) return; ocup = true;
    const btn = $('#cLuchar'), r = S.vista.ronda; ocupado(btn, true);
    ponEspera();
    // contra un bot de arena: si el «rival» aún no ha elegido, se espera un poco como con una persona
    const espera0 = conReloj() && !esPvp() && S.rivalT > Date.now() ? Math.min(S.rivalT - Date.now(), 1200 + Math.random() * 2800) : 0;
    if (espera0) { S.enviado = r; pintaMano(); pintaReloj(); }
    const jug = sel;
    setTimeout(() => conSes('turno', { ronda: r, jug }).then(d => {
      if (!S || S.anim === r) return;   // la ronda ya se está animando (llegó antes por la consulta)
      if (!d.ok) { quitaEspera(); ocup = false; ocupado(btn, false); return toast(d.error, 'err'); }
      if (esPvp() && !d.resuelta) {   // falta que elija el rival
        S.enviado = r; ponReloj(d.quedan); S.rivalListo = false; ocup = false; pintaMano(); pintaReloj(); return;
      }
      procesar(d, r);
    }), espera0);
  }
  async function procesar(d, r) {
    if (!S || S.anim === r) return;
    S.anim = r; ocup = true; animando = true; ponReloj(d.quedan);
    quitaEspera(); sel = { 0: [], 1: [], 2: [] }; pintaPilas();
    $('#cMano').innerHTML = ''; pintaReloj();
    await animar(d.ev || []);
    animando = false;
    if (!S) { ocup = false; return; }
    S.vista = d.vista; S.meta = d.meta || S.meta; S.enviado = 0; S.rivalListo = false;
    if (conReloj() && !esPvp() && !S.vista.fin) { ponReloj(turnoMs()); rivalBot(false); }
    if (VISTA !== 'combate') { ocup = false; return; }
    pintaLados(); pintaMano(); $('#cRonda').textContent = S.vista.ronda;
    ocup = false; ocupado($('#cLuchar'), false); pintaReloj();
    if (d.premio) fin(d.premio);
    else if (S.vista.fin) fin({ resultado: S.vista.fin, chips: 0, elo: 0 });
    else { cartelRonda(S.vista.ronda); }
  }
  /* ---------- animación de eventos ---------- */
  function lu(l, p) { return $(`.lu[data-l="${l}"][data-p="${p}"]`); }
  function flot(el, html, cls) { if (!el) return; const d = document.createElement('div'); d.className = 'flot ' + cls; d.innerHTML = html; el.appendChild(d); setTimeout(() => d.remove(), 1300); }
  function setVida(l, p, pv, escudo) {
    const el = lu(l, p); if (!el) return;
    const c = (l ? S.vista.el : S.vista.yo).cr[p]; if (pv != null) c.pv = pv; if (escudo != null) c.esc = escudo;
    const pct = Math.max(0, c.pv / c.pvMax * 100), i = $('.hp i', el);
    i.style.width = pct + '%'; $('.hp b', el).style.width = pct + '%'; i.className = pct < 30 ? 'bajo' : pct < 60 ? 'medio' : '';
    $('.hp u', el).style.width = Math.min(100, c.esc / c.pvMax * 100) + '%';
    $('.hpTxt', el).innerHTML = `<span class="pv">${c.pv}</span>/${c.pvMax}${c.esc > 0 ? ` <span class="e">⛨${c.esc}</span>` : ''}`;
    el.classList.toggle('conEsc', c.esc > 0);
  }
  function centro(el) { const r = $('.cuerpo', el).getBoundingClientRect(), b = $('#campo').getBoundingClientRect(); return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height * 0.42 }; }   // centro del cuerpo de la criatura (no de su plataforma)
  function clase(el, c, ms) { if (!el) return; el.classList.remove(c); void el.offsetWidth; el.classList.add(c); setTimeout(() => el.classList.remove(c), ms); }
  const EST_COL = { corrosion: '#d38bff', aturdido: '#ffe03a', miedo: '#ff4fd8', debilitado: '#9fb6c4', lento: '#9fb6c4', expuesto: '#ffb02e', potenciado: '#ff6b5a', veloz: '#19ff6a' };
  /* la carta sale de la mano (o de arriba si es del rival) y vuela hasta su criatura */
  function lanzaCarta(el, k, l, n) {
    const campo = $('#campo'); if (!el || !campo) return;
    const B = centro(el), Wc = campo.clientWidth, Hc = campo.clientHeight, A = { x: Wc / 2 + (Math.random() - 0.5) * 60, y: l ? -50 : Hc + 40 };
    const d = document.createElement('div'); d.className = 'cCast'; d.style.setProperty('--cc', colClase(k.clase));
    d.innerHTML = `<span>${k.c}</span><b>${esc(k.n)}</b><em>${k.a ? '⚔' + k.a : ''}${k.e ? ' ⛨' + k.e : ''}</em>`;
    d.style.left = A.x + 'px'; d.style.top = A.y + 'px'; campo.appendChild(d);
    const dur = 340 / vel, giro = (Math.random() - 0.5) * 30;
    d.animate([{ transform: `translate(-50%,-50%) scale(.6) rotate(${giro}deg)`, opacity: 0 }, { opacity: 1, offset: 0.2 },
      { transform: `translate(calc(-50% + ${B.x - A.x}px),calc(-50% + ${B.y - 40 - A.y}px)) scale(1.05) rotate(0deg)`, opacity: 1 }], { duration: dur, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' });
    Son.lanza(n);
    setTimeout(() => { FX.onda({ x: B.x, y: B.y - 40 }, colClase(k.clase), 46); d.animate([{ opacity: 1, filter: 'brightness(1)' }, { opacity: 0, filter: 'brightness(3)', transform: `translate(calc(-50% + ${B.x - A.x}px),calc(-50% + ${B.y - 40 - A.y}px)) scale(1.5)` }], { duration: 260, fill: 'forwards' }); }, dur);
    setTimeout(() => d.remove(), dur + 300);
  }
  function ko(el, l) {
    const d = document.createElement('div'); d.className = 'koSello ' + (l ? 'el' : 'yo'); d.textContent = 'K.O.'; el.appendChild(d); setTimeout(() => d.remove(), 1600);
  }
  async function animar(ev) {
    const rapido = (ev.length > 40 ? 0.75 : 1) / vel;
    const T = ms => espera(ms * rapido);
    let racha = 0, ladoRacha = -1;
    for (const e of ev) {
      if (VISTA !== 'combate') return;
      switch (e.t) {
        case 'juega': {
          const el = lu(e.l, e.p); if (!el) break;
          el.classList.add('activo');
          for (let j = 0; j < e.k.length; j++) { lanzaCarta(el, e.k[j], e.l, j); await T(200); }
          await T(260); el.classList.remove('activo'); break;
        }
        case 'esc': { const el = lu(e.l, e.p); setVida(e.l, e.p, null, e.esc); if (el) FX.escudo(centro(el)); flot(el, '+' + e.v + ' ⛨', 'esc'); Son.escudo(); await T(240); break; }
        case 'golpe': {
          const a = lu(e.l, e.p), b = lu(e.tl, e.tp), cl = e.clase;
          if (e.l === ladoRacha) racha++; else { racha = 1; ladoRacha = e.l; }
          if (a) { clase(a, 'ataca', 520); a.classList.add('activo'); }
          await T(170);
          Son.disparo(cl);
          if (a && b) await FX.proyectil(centro(a), centro(b), cl, vel);
          const fuerte = e.v > 150, P = b ? centro(b) : null;
          if (P) FX.impacto(P, cl, fuerte, e.crit);
          FX.temblor(e.crit ? 0.75 : fuerte ? 0.45 : 0.28);
          if (e.crit) { FX.destello('#fff', 0.55); document.body.classList.add('hitstop'); }
          else if (e.vent > 1) FX.destello(colClase(cl), 0.25);
          clase(b, e.crit ? 'golpeadoFuerte' : 'golpeado', 420); setVida(e.tl, e.tp, e.pv, e.esc);
          Son.impacto(fuerte, e.crit); vib(e.crit ? [40, 30, 80] : fuerte ? 35 : 20);
          const extra = (e.crit ? '<small>¡CRÍTICO!</small>' : '') + (e.vent > 1 ? '<small style="color:#19ff6a">SUPEREFICAZ</small>' : e.vent < 1 ? '<small style="color:#9fb6c4">POCO EFICAZ</small>' : '') + (e.at ? '<small>ATRAVIESA</small>' : '');
          flot(b, '-' + e.v + extra, (e.crit ? 'crit' : 'dano') + (e.vent > 1 ? ' super' : ''));
          if (racha >= 3) comboCartel(racha, e.l);
          if (e.crit) { await T(200); document.body.classList.remove('hitstop'); }
          await T(380); if (a) a.classList.remove('activo'); break;
        }
        case 'falla': { const a = lu(e.l, e.p); clase(a, 'ataca', 520); await T(200); clase(a, 'tambalea', 500); flot(a, 'FALLA<small>' + (e.por === 'miedo' ? 'TIENE MIEDO' : 'ATURDIDO') + '</small>', 'falla'); Son.falla(); await T(450); break; }
        case 'estado': { const el = lu(e.l, e.p); if (el) FX.estado(centro(el), EST_COL[e.e] || '#fff'); flot(el, NOM_EST[e.e] || e.e, 'est'); Son.estado(); await T(320); break; }
        case 'cura': { const el = lu(e.l, e.p); setVida(e.l, e.p, e.pv); if (el) FX.cura(centro(el)); flot(el, '+' + e.v, 'cura'); clase(el, 'curado', 700); Son.cura(); await T(400); break; }
        case 'dot': { const el = lu(e.l, e.p); setVida(e.l, e.p, e.pv); if (el) FX.veneno(centro(el)); clase(el, 'golpeado', 380); flot(el, '-' + e.v + '<small>' + (e.por === 'subita' ? 'SOBRECARGA' : 'CORROSIÓN') + '</small>', 'dot'); Son.golpe(); await T(380); break; }
        case 'cae': {
          const el = lu(e.l, e.p); if (!el) break;
          await T(120);
          el.classList.add('cayendo'); Son.ko(); vib([80, 40, 120]);
          FX.explosion(centro(el), (e.l ? S.vista.el : S.vista.yo).cr[e.p].genes.c); FX.temblor(0.9); FX.destello('#ff7a2e', 0.4); ko(el, e.l);
          await T(950); el.classList.remove('cayendo'); el.classList.add('muerto'); (e.l ? S.vista.el : S.vista.yo).cr[e.p].vivo = false; break;
        }
        case 'energia': if (e.l === 0) { flot($('#cEn'), (e.v > 0 ? '+' : '') + e.v + ' ⚡', e.v > 0 ? 'cura' : 'dano'); clase($('#cEn'), 'pulso', 600); } await T(250); break;
        case 'robar': if (e.l === 0 && e.n) toast('Robas ' + e.n + ' carta' + (e.n > 1 ? 's' : '')); await T(150); break;
        case 'aviso': FX.destello('#ff2b4e', 0.35); FX.temblor(0.4); banner(e.m.split('!')[0] + '!', 'ATENCIÓN', '#ff2b4e'); await T(1200); break;
        case 'fin': {
          const campo = $('#campo'); if (!campo) break;
          const gano = e.r === 'gana' || e.r === 0 || e.r === '0' || e.r === 'yo';
          await espera(300);
          campo.classList.add(e.r === 'empate' ? 'finEmpate' : gano ? 'finGana' : 'finPierde');
          if (gano) $$('.lu.yo:not(.muerto)').forEach((x, i) => setTimeout(() => { x.classList.add('celebra'); FX.onda(centro(x), '#19ff6a', 80); }, i * 120));
          break;
        }
      }
    }
    await espera(250);
  }
  function comboCartel(n, l) {
    const campo = $('#campo'); if (!campo) return; let d = $('.combo', campo);
    if (!d) { d = document.createElement('div'); d.className = 'combo'; campo.appendChild(d); }
    d.className = 'combo ' + (l ? 'el' : 'yo'); d.innerHTML = `<b>${n}</b> COMBO`; void d.offsetWidth; d.classList.add('show');
    clearTimeout(d._t); d._t = setTimeout(() => d.remove(), 1400);
  }
  function cartelRonda(n) {
    const campo = $('#campo'); if (!campo) return;
    const d = document.createElement('div'); d.className = 'cRonda'; d.innerHTML = `<small>RONDA</small><b>${n}</b>`; campo.appendChild(d); Son.ronda(); setTimeout(() => d.remove(), 1300);
  }
  /* ---------- final del combate: pantalla de victoria / derrota ---------- */
  function fin(pr) {
    const gana = pr.resultado === 'gana', emp = pr.resultado === 'empate', tipo = gana ? 'gana' : emp ? 'empate' : 'pierde';
    if (pr.perfil) aplicaPerfil(pr.perfil);
    Son.modo('');
    const vista = $('.vista.combate'); if (!vista) return;
    const sig = S.meta.modo === 'pve' && gana && S.meta.etapa < 30, modo = S.meta.modo, et = S.meta.etapa;
    const titulo = gana ? 'VICTORIA' : emp ? 'EMPATE' : 'DERROTA';
    const sub = pr.rendido ? 'TE HAS RENDIDO' : modo === 'pve' ? (pr.nuevaEtapa ? '¡ETAPA ' + et + ' SUPERADA!' : 'ETAPA ' + et) : 'ARENA · contra ' + S.vista.el.nombre;
    const o = document.createElement('div'); o.className = 'finCx ' + tipo;
    o.innerHTML = `<canvas class="fcFx"></canvas><div class="fcRayos"></div><div class="fcAro"></div>
      <div class="fcCaja">
        <div class="fcTit"><small>${esc(sub)}</small><h2 data-t="${titulo}">${titulo}</h2><i class="fcBrillo"></i></div>
        <div class="fcEq">${S.vista.yo.cr.map((c, i) => `<div class="fcCr ${c.vivo ? '' : 'caido'}" style="--d:${0.9 + i * 0.12}s;--cc:${colClase(c.genes.c)}">${ROBOT.svg(c.genes, { cls: c.vivo ? '' : 'quieto' })}</div>`).join('')}</div>
        <div class="fcPremios">
          <div class="fcPr chips"><i class="ic-chip"></i><b data-n="${pr.chips || 0}">0</b><small>CHIPS</small></div>
          ${modo === 'pvp' ? `<div class="fcPr elo ${pr.elo >= 0 ? 'mas' : 'menos'}"><span>${pr.elo >= 0 ? '▲' : '▼'}</span><b data-n="${Math.abs(pr.elo || 0)}" data-s="${pr.elo >= 0 ? '+' : '-'}">0</b><small>PUNTOS ARENA</small></div>` : ''}
        </div>
        ${pr.sinEnergia ? '<p class="fcNota">Has gastado tus combates con premio de hoy. Mañana más.</p>' : ''}
        <div class="fcBtns">${sig ? '<button class="btn grande" id="rSig">SIGUIENTE ETAPA ›</button>' : ''}<button class="btn ${sig ? 'sec' : 'grande'}" id="rOtra">${modo === 'pve' ? 'REPETIR' : 'OTRO RIVAL'}</button><button class="btn sec" id="rVolver">VOLVER</button></div>
      </div>`;
    vista.appendChild(o);
    requestAnimationFrame(() => o.classList.add('on'));
    if (gana) { Son.victoria(); vib([40, 60, 40, 60, 160]); } else if (emp) { Son.estado(); } else { Son.derrota(); vib([120, 60, 200]); }
    setTimeout(() => { FX.temblor(gana ? 0.6 : 0.4); FX.destello(gana ? '#ffe9a0' : emp ? '#ffd23f' : '#ff2b4e', 0.5); }, 420);
    particulasFin($('.fcFx', o), tipo);
    // contadores
    setTimeout(() => $$('.fcPr b', o).forEach(b => {
      const n = +b.dataset.n, s0 = b.dataset.s || (b.closest('.chips') ? '+' : ''), t0 = performance.now(), dur = Math.min(1400, 300 + n * 25);
      if (!n) { b.textContent = s0 === '-' ? '0' : (b.closest('.chips') ? '+0' : '0'); return; }
      (function paso(now) { const k = Math.min(1, (now - t0) / dur), v = Math.round(n * (1 - Math.pow(1 - k, 3))); b.textContent = s0 + v; if (Math.random() < 0.5) Son.cuenta(); if (k < 1 && b.isConnected) requestAnimationFrame(paso); else { b.parentNode.classList.add('fin'); if (gana) Son.moneda(); } })(t0);
    }), 1500);
    const salir = destino => { o.remove(); if (destino) destino(); };
    if (sig) $('#rSig', o).onclick = e => { ocupado(e.target, true); salir(() => empezar({ modo: 'pve', etapa: et + 1 })); };
    $('#rOtra', o).onclick = e => { ocupado(e.target, true); salir(() => empezar(modo === 'pve' ? { modo, etapa: et } : { modo })); };
    $('#rVolver', o).onclick = () => salir(() => { if (VISTA === 'combate') { const v = volverA(); S = null; ir(v); } });
  }
  /* chispas doradas / ascuas / fuegos artificiales en canvas */
  function particulasFin(cv, tipo) {
    const g = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), P = [];
    const col = tipo === 'gana' ? ['#fff3b0', '#ffd23f', '#ffb02e', '#19ff6a', '#00e5ff'] : tipo === 'empate' ? ['#fff3b0', '#ffd23f', '#cfe0f0'] : ['#ff2b4e', '#ff6b5a', '#7a2030', '#3a1a2a'];
    let W, H, t0 = performance.now(), ult = t0;
    const tam = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); }; tam();
    const R = (a, b) => a + Math.random() * (b - a);
    const explota = (x, y, n, v) => { for (let i = 0; i < n; i++) { const an = R(0, 6.283), sp = R(v * 0.3, v); P.push({ x, y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, g: 260, dr: 0.985, v: R(0.9, 1.8), t: 0, c: col[i % col.length], r: R(1.2, 2.8), cola: 1 }); } };
    if (tipo === 'gana') { setTimeout(() => explota(W / 2, H * 0.32, 160, 620), 380); [700, 1150, 1600, 2100, 2700].forEach((ms, i) => setTimeout(() => explota(R(W * 0.15, W * 0.85), R(H * 0.12, H * 0.4), 70, 380), ms)); }
    else if (tipo === 'empate') setTimeout(() => explota(W / 2, H * 0.32, 80, 360), 380);
    (function frame(now) {
      if (!cv.isConnected) return;
      const dt = Math.min(0.05, (now - ult) / 1000); ult = now;
      if (cv.clientWidth !== W) tam();
      // ascuas que suben continuamente (en la derrota caen como ceniza)
      if (P.length < 260 && Math.random() < 0.5) P.push(tipo === 'pierde'
        ? { x: R(0, W), y: -10, vx: R(-15, 15), vy: R(20, 60), g: 0, dr: 1, v: R(3, 6), t: 0, c: col[Math.floor(R(0, col.length))], r: R(1, 2.4) }
        : { x: R(0, W), y: H + 10, vx: R(-20, 20), vy: R(-90, -40), g: 0, dr: 1, v: R(3, 6), t: 0, c: col[Math.floor(R(0, col.length))], r: R(1, 2.6) });
      g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'lighter';
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i]; p.t += dt; if (p.t > p.v) { P.splice(i, 1); continue; }
        p.vx *= p.dr; p.vy = p.vy * p.dr + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        const a = Math.min(1, (p.v - p.t) / 0.5) * (p.cola ? 1 : 0.7);
        if (p.cola) { g.strokeStyle = p.c; g.globalAlpha = a; g.lineWidth = p.r; g.lineCap = 'round'; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); g.stroke(); }
        const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3); gr.addColorStop(0, '#fff'); gr.addColorStop(0.3, p.c); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.globalAlpha = a; g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.r * 3, 0, 6.283); g.fill();
      }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      requestAnimationFrame(frame);
    })(t0);
  }
  function volverA() { return S && S.meta.modo === 'pvp' ? 'arena' : 'aventura'; }
  async function rendirse() {
    const d = await conSes('rendirse');
    if (VISTA === 'combate' && S && $('.vista.combate')) { const pr = Object.assign({ resultado: 'pierde', chips: 0, elo: 0 }, d.premio || {}); pr.rendido = 1; S.vista.fin = 'pierde'; return fin(pr); }
    if (d.premio && d.premio.perfil) aplicaPerfil(d.premio.perfil);
    S = null; ir('inicio');
  }
  function salir() {
    if (esPvp()) {
      const m = modal(`<h2>¿Salir del combate?</h2><p class="nota">Estás jugando contra <b>${esc(S.vista.el.nombre)}</b>. Si te vas, la partida sigue y perderás por abandono.</p><div class="acciones" style="justify-content:flex-end"><button class="btn rojo" id="sRen">RENDIRME</button><button class="btn" id="sSeg">SEGUIR</button></div>`);
      $('#sSeg', m).onclick = () => cerrarModal();
      $('#sRen', m).onclick = () => { cerrarModal(); rendirse(); };
      return;
    }
    const m = modal(`<h2>¿Salir del combate?</h2><p class="nota">Puedes dejarlo a medias y seguir después, o rendirte (cuenta como derrota).</p><div class="acciones" style="justify-content:flex-end"><button class="btn rojo" id="sRen">RENDIRME</button><button class="btn sec" id="sGuar">SALIR Y SEGUIR LUEGO</button><button class="btn" id="sSeg">SEGUIR</button></div>`);
    $('#sSeg', m).onclick = () => cerrarModal();
    $('#sGuar', m).onclick = () => { cerrarModal(); const v = volverA(); S = null; ir(v); };
    $('#sRen', m).onclick = () => { cerrarModal(); rendirse(); };
  }
  return { empezar, reanudar, vista, activo: () => false, salirOk: () => true };
})();
const CX_MAX_EN = 10;
VISTAS.combate = div => Combate.vista(div);
