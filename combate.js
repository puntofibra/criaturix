/* =========================================================
   CRIATURIX · pantalla de combate
   ========================================================= */
'use strict';
const Combate = (() => {
  let S = null, sel = { 0: [], 1: [], 2: [] }, ocup = false, vel = load('vel', 1);
  const EST = { corr: ['CORR', '#d38bff'], aturde: ['ATURD', '#ffe03a'], miedo: ['MIEDO', '#ff4fd8'], atkMas: ['ATQ▲', '#ff6b5a'], atkMenos: ['ATQ▼', '#9fb6c4'], velMas: ['VEL▲', '#19ff6a'], velMenos: ['VEL▼', '#9fb6c4'], expuesto: ['EXPU', '#ffb02e'] };
  const NOM_EST = { corrosion: 'CORROSIÓN', aturdido: 'ATURDIDO', miedo: 'MIEDO', debilitado: 'DEBILITADO', lento: 'LENTO', expuesto: 'EXPUESTO', potenciado: 'POTENCIADO', veloz: 'VELOZ' };

  function empezar(o) {
    return conSes('combate', o).then(d => {
      if (!d.ok) { toast(d.error, 'err'); return; }
      cerrarModal(); S = { meta: d.meta, vista: d.vista }; sel = { 0: [], 1: [], 2: [] };
      ir('combate');
      setTimeout(() => { banner('¡A LUCHAR!', d.meta.modo === 'pve' ? 'ETAPA ' + d.meta.etapa : 'ARENA', '#ff2bd6'); Son.turno(); }, 2100);
    });
  }
  function reanudar(c) {
    S = { meta: c.meta, vista: c.vista }; sel = { 0: [], 1: [], 2: [] };
    const m = modal(`<h2>Tienes un combate a medias</h2><p class="nota">Contra <b>${esc(c.meta.rival)}</b>, ronda ${c.vista.ronda}.</p><div class="acciones" style="justify-content:flex-end"><button class="btn sec" id="cRen">Rendirme</button><button class="btn" id="cSeg">CONTINUAR</button></div>`);
    $('#cSeg', m).onclick = () => { cerrarModal(); ir('combate'); };
    $('#cRen', m).onclick = () => { cerrarModal(); rendirse(); };
  }
  function energiaUsada() { let n = 0; const V = S.vista; [0, 1, 2].forEach(p => sel[p].forEach(u => { const k = V.yo.mano.find(x => x.u === u); if (k) n += k.c; })); return n; }

  function vista(div) {
    if (!S) return ir('inicio');
    div.className = 'vista combate';
    const V = S.vista;
    div.innerHTML = `<div class="cbTop"><span class="ronda">RONDA <b id="cRonda">${V.ronda}</b></span><div class="vs">${esc(V.yo.nombre)} <em>VS</em> ${esc(V.el.nombre)}</div>
        <button class="ibtn" id="cSon"><svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path class="ondas" d="M16 8a5 5 0 0 1 0 8" fill="none" stroke-width="2"/></svg></button><button class="ibtn vel" id="cVel" title="Velocidad de la animación">x${vel}</button><button class="btn sec peq" id="cSalir">SALIR</button></div>
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
    if (ocup) return;
    const V = S.vista, k = V.yo.mano.find(x => x.u === u); if (!k) return;
    const c = V.yo.cr[k.p]; if (!c.vivo) return;
    const i = sel[k.p].indexOf(u);
    if (i >= 0) { sel[k.p].splice(i, 1); Son.quita(); }
    else {
      if (sel[k.p].length >= 4) return toast('Máximo 4 cartas por criatura');
      if (k.c > V.yo.en - energiaUsada()) { toast('No tienes energía suficiente'); Son.falla(); return; }
      sel[k.p].push(u); Son.carta(); vib(10);
    }
    pintaMano(); pintaPilas();
  }
  function luchar() {
    if (ocup) return; ocup = true;
    const btn = $('#cLuchar'); ocupado(btn, true);
    $('#campo').insertAdjacentHTML('beforeend', '<div class="esperando" id="cEsp"><span>RESOLVIENDO…</span></div>');
    conSes('turno', { ronda: S.vista.ronda, jug: sel }).then(async d => {
      const e = $('#cEsp'); if (e) e.remove();
      if (!d.ok) { ocup = false; ocupado(btn, false); return toast(d.error, 'err'); }
      sel = { 0: [], 1: [], 2: [] }; pintaPilas();
      $('#cMano').innerHTML = '';
      await animar(d.ev || []);
      S.vista = d.vista; S.meta = d.meta || S.meta;
      if (VISTA !== 'combate') { ocup = false; return; }
      pintaLados(); pintaMano(); $('#cRonda').textContent = S.vista.ronda;
      ocup = false; ocupado(btn, false);
      if (d.premio) fin(d.premio);
      else { cartelRonda(S.vista.ronda); }
    });
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
  function centro(el) { const r = $('.cuerpo', el).getBoundingClientRect(), b = $('#campo').getBoundingClientRect(); return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 }; }
  function clase(el, c, ms) { if (!el) return; el.classList.remove(c); void el.offsetWidth; el.classList.add(c); setTimeout(() => el.classList.remove(c), ms); }
  const EST_COL = { corrosion: '#d38bff', aturdido: '#ffe03a', miedo: '#ff4fd8', debilitado: '#9fb6c4', lento: '#9fb6c4', expuesto: '#ffb02e', potenciado: '#ff6b5a', veloz: '#19ff6a' };
  /* la carta sale de la mano (o de arriba si es del rival) y vuela hasta su criatura */
  function lanzaCarta(el, k, l) {
    const campo = $('#campo'); if (!el || !campo) return;
    const B = centro(el), Wc = campo.clientWidth, Hc = campo.clientHeight, A = { x: Wc / 2 + (Math.random() - 0.5) * 60, y: l ? -50 : Hc + 40 };
    const d = document.createElement('div'); d.className = 'cCast'; d.style.setProperty('--cc', colClase(k.clase));
    d.innerHTML = `<span>${k.c}</span><b>${esc(k.n)}</b><em>${k.a ? '⚔' + k.a : ''}${k.e ? ' ⛨' + k.e : ''}</em>`;
    d.style.left = A.x + 'px'; d.style.top = A.y + 'px'; campo.appendChild(d);
    const dur = 340 / vel, giro = (Math.random() - 0.5) * 30;
    d.animate([{ transform: `translate(-50%,-50%) scale(.6) rotate(${giro}deg)`, opacity: 0 }, { opacity: 1, offset: 0.2 },
      { transform: `translate(calc(-50% + ${B.x - A.x}px),calc(-50% + ${B.y - 40 - A.y}px)) scale(1.05) rotate(0deg)`, opacity: 1 }], { duration: dur, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' });
    Son.lanza();
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
          for (const k of e.k) { lanzaCarta(el, k, e.l); await T(200); }
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
  function fin(pr) {
    const gana = pr.resultado === 'gana', emp = pr.resultado === 'empate';
    if (pr.perfil) aplicaPerfil(pr.perfil);
    if (gana) { Son.gana(); confeti(90); banner('¡VICTORIA!', S.meta.modo === 'pve' ? 'ETAPA ' + S.meta.etapa : 'ARENA', '#19ff6a'); }
    else { Son.pierde(); banner(emp ? 'EMPATE' : 'DERROTA', '', emp ? '#ffd23f' : '#ff2b4e'); }
    setTimeout(() => {
      const sig = S.meta.modo === 'pve' && gana && S.meta.etapa < 30;
      const m = modal(`<div class="resultado"><h2 style="color:${gana ? 'var(--v)' : emp ? 'var(--o)' : 'var(--r)'}">${gana ? '¡VICTORIA!' : emp ? 'EMPATE' : 'DERROTA'}</h2>
        <div class="rivales">${S.vista.yo.cr.map(c => ROBOT.svg(c.genes, { cls: c.vivo ? '' : 'quieto' })).join('')}</div>
        <div class="premios"><div>+${pr.chips}<small>CHIPS</small></div>${S.meta.modo === 'pvp' ? `<div style="color:${pr.elo >= 0 ? 'var(--v)' : 'var(--r)'}">${pr.elo >= 0 ? '+' : ''}${pr.elo}<small>PUNTOS ARENA</small></div>` : ''}</div>
        ${pr.nuevaEtapa ? '<p class="nota" style="color:var(--v)">¡Nueva etapa superada!</p>' : ''}${pr.sinEnergia ? '<p class="nota">Has gastado tus combates con premio de hoy. Mañana más.</p>' : ''}
        <div class="acciones" style="justify-content:center">${sig ? '<button class="btn grande" id="rSig">SIGUIENTE ETAPA</button>' : ''}<button class="btn ${sig ? 'sec' : 'grande'}" id="rOtra">${S.meta.modo === 'pve' ? 'REPETIR' : 'OTRO RIVAL'}</button><button class="btn sec" id="rVolver">VOLVER</button></div></div>`, { alCerrar: () => { if (VISTA === 'combate') { S = null; ir(volverA()); } } });
      const modo = S.meta.modo, et = S.meta.etapa;
      if (sig) $('#rSig', m).onclick = e => { ocupado(e.target, true); alCerrarModal = null; empezar({ modo: 'pve', etapa: et + 1 }); };
      $('#rOtra', m).onclick = e => { ocupado(e.target, true); alCerrarModal = null; empezar(modo === 'pve' ? { modo, etapa: et } : { modo }); };
      $('#rVolver', m).onclick = () => cerrarModal();
    }, 1600);
  }
  function volverA() { return S && S.meta.modo === 'pvp' ? 'arena' : 'aventura'; }
  async function rendirse() {
    const d = await conSes('rendirse'); if (d.premio && d.premio.perfil) aplicaPerfil(d.premio.perfil);
    S = null; ir('inicio');
  }
  function salir() {
    const m = modal(`<h2>¿Salir del combate?</h2><p class="nota">Puedes dejarlo a medias y seguir después, o rendirte (cuenta como derrota).</p><div class="acciones" style="justify-content:flex-end"><button class="btn rojo" id="sRen">RENDIRME</button><button class="btn sec" id="sGuar">SALIR Y SEGUIR LUEGO</button><button class="btn" id="sSeg">SEGUIR</button></div>`);
    $('#sSeg', m).onclick = () => cerrarModal();
    $('#sGuar', m).onclick = () => { cerrarModal(); const v = volverA(); S = null; ir(v); };
    $('#sRen', m).onclick = () => { cerrarModal(); rendirse(); };
  }
  return { empezar, reanudar, vista, activo: () => false, salirOk: () => true };
})();
const CX_MAX_EN = 10;
VISTAS.combate = div => Combate.vista(div);
