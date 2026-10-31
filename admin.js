/* =========================================================
   CRIATURIX · panel de administración
   Acceso: mantener ENTRAR 3 s, 10 toques al logo o botón PANEL ADMIN
   Llave NFC (Android) · QR para el ordenador · Google Authenticator
   ========================================================= */
'use strict';
const Admin = (() => {
  let ADM = null, nfcCtrl = null, leyendo = false, modoQr = '', qrPoll = 0, pest = 'pedidos';
  const hayNfc = 'NDEFReader' in window;
  const NFC_SVG = '<svg viewBox="0 0 64 64"><rect x="14" y="6" width="36" height="52" rx="7" fill="none" stroke="currentColor" stroke-width="3"/><path d="M27 24a9 9 0 0 1 0 16M33 19a16 16 0 0 1 0 26M39 14a23 23 0 0 1 0 36" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';

  function abrir() {
    Son.init(); Son.nfc();
    if (ADM) return panel();
    const m = modal(`<div class="admLlave"><div class="nfcAnim" id="nfcAnim">${NFC_SVG}<i></i><i></i></div>
      <h2 style="padding:0" id="aTit">${modoQr ? 'Autorizar ordenador' : 'Acceso administrador'}</h2><p class="msg" id="aMsg"></p>
      <div id="aQr" class="oculto"><div id="admQrImg"></div><p class="nota" id="aQrT"></p></div>
      <button class="btn cian oculto" id="aNfc">ESCANEAR LLAVE</button>
      <div class="sep">o con Google Authenticator</div>
      <form id="aTotp" style="display:flex;gap:8px;max-width:320px;margin:0 auto"><input id="aCod" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000" style="flex:1;padding:12px;border-radius:12px;background:rgba(0,0,0,.45);border:1px solid rgba(0,229,255,.3);font-family:Orbitron;font-size:20px;letter-spacing:.3em;text-align:center"><button class="btn" type="submit">ENTRAR</button></form>
      </div>`, { alCerrar: parar });
    $('#aTotp', m).onsubmit = e => {
      e.preventDefault(); const b = $('button', e.target); ocupado(b, true);
      api('admin_totp', { codigo: $('#aCod').value }).then(d => { ocupado(b, false); if (!d.ok) return msgA(d.error, 'err'); ok(d.admin, false); });
    };
    $('#aNfc', m).onclick = () => escanear(false);
    if (hayNfc) { $('#aNfc', m).classList.remove('oculto'); msgA(modoQr ? 'Pasa tu llave para dar acceso al ordenador' : 'Acerca tu llave NFC a la parte trasera del móvil'); escanear(true); }
    else if (!modoQr) mostrarQr();
    else msgA('Este navegador no puede leer NFC. Usa Chrome en Android.', 'err');
  }
  function msgA(t, c) { const m = $('#aMsg'); if (m) { m.textContent = t; m.className = 'msg ' + (c || ''); } }
  function anim(c) { const a = $('#nfcAnim'); if (a) a.className = 'nfcAnim ' + (c || ''); }
  function parar() { if (nfcCtrl) { nfcCtrl.abort(); nfcCtrl = null; } leyendo = false; clearInterval(qrPoll); qrPoll = 0; }
  async function escanear(auto) {
    try {
      if (!nfcCtrl) {
        nfcCtrl = new AbortController(); const r = new NDEFReader();
        await r.scan({ signal: nfcCtrl.signal });
        r.onreadingerror = () => { if (!leyendo) { anim('err'); msgA('No pude leer esa llave. Prueba otra vez.', 'err'); } };
        r.onreading = e => leida(e.serialNumber || '');
      }
      anim('busca'); msgA(modoQr ? 'Esperando llave… acércala para autorizar el ordenador' : 'Esperando llave… acércala al móvil');
    } catch (err) {
      parar(); anim('');
      msgA(auto ? 'Pulsa «Escanear llave» y acerca tu llave NFC' : (err && err.name === 'NotAllowedError' ? 'Necesito permiso para usar NFC.' : 'No se pudo activar el NFC. ¿Está encendido?'), auto ? '' : 'err');
    }
  }
  function leida(llave) {
    if (leyendo) return;
    if (!llave) { anim('err'); return msgA('La llave no tiene número de serie legible.', 'err'); }
    leyendo = true; msgA('Comprobando llave…');
    api('admin_entrar', { token: SES && SES.token, llave, qr: modoQr || undefined }).then(d => {
      if (!d.ok) { leyendo = false; anim('err'); vib([80, 60, 80]); return msgA(d.error, 'err'); }
      anim('ok'); vib([30, 30, 120]); Son.gana();
      if (modoQr) { parar(); modoQr = ''; msgA('✓ Ordenador autorizado. Ya puedes seguir en el PC.', 'ok'); $('#aNfc').classList.add('oculto'); return; }
      ok(d.admin, d.nueva);
    });
  }
  function ok(t, nueva) { parar(); ADM = t; anim('ok'); msgA(nueva ? '¡Llave registrada como llave de administrador!' : '¡Acceso concedido!', 'ok'); setTimeout(panel, 600); }
  function mostrarQr() {
    $('#aQr').classList.remove('oculto'); msgA('Generando código…');
    const lib = window.qrcode ? Promise.resolve() : new Promise(r => { const t = setInterval(() => { if (window.qrcode) { clearInterval(t); r(); } }, 100); });
    Promise.all([api('qr_nuevo'), lib]).then(([d]) => {
      if (!d.ok) return msgA(d.error, 'err');
      const q = qrcode(0, 'M'); q.addData(CFG.URL + '?admqr=' + d.code); q.make();
      $('#admQrImg').innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
      msgA('Escanea este código con tu móvil y pasa la llave NFC en el móvil'); anim('busca');
      const finT = Date.now() + d.seg * 1000;
      qrPoll = setInterval(() => {
        const q2 = Math.max(0, Math.round((finT - Date.now()) / 1000)), el = $('#aQrT'); if (!el) return parar();
        el.textContent = q2 ? `Caduca en ${Math.floor(q2 / 60)}:${String(q2 % 60).padStart(2, '0')}` : 'El código ha caducado. Cierra y vuelve a abrir.';
        if (!q2) return parar();
        if (q2 % 2) return;
        api('qr_estado', { code: d.code }).then(r => { if (r.ok && r.admin && qrPoll) { Son.gana(); ok(r.admin, false); } });
      }, 1000);
    });
  }
  // el móvil abre el juego desde el QR del ordenador
  const qp = new URLSearchParams(location.search).get('admqr');
  if (qp && /^[A-Za-z0-9]{20,64}$/.test(qp)) { modoQr = qp; history.replaceState(null, '', location.pathname); setTimeout(abrir, 900); }

  function adm(op, datos) {
    return api('admin', Object.assign({ admin: ADM, op }, datos || {})).then(d => {
      if (d.caducada) { ADM = null; toast('La sesión de administrador ha caducado', 'err'); abrir(); }
      else if (!d.ok) toast(d.error, 'err');
      return d;
    });
  }

  /* ---------------- panel ---------------- */
  function panel() {
    const m = modal(`<div class="adm"><div class="tit" style="margin-top:0"><h1 style="font-size:20px">⚙ ADMINISTRACIÓN</h1></div>
      <div class="pestanas" id="aPest">${[['pedidos', 'PEDIDOS'], ['resumen', 'RESUMEN'], ['crear', 'CREAR'], ['tienda', 'TIENDA'], ['jugadores', 'JUGADORES'], ['ajustes', 'AJUSTES'], ['seguridad', 'SEGURIDAD']].map(([k, n]) => `<button data-k="${k}" class="${pest === k ? 'on' : ''}">${n}<span id="b_${k}"></span></button>`).join('')}</div>
      <div id="aCont"></div></div>`, { cls: 'ancha', alCerrar: () => { if (VISTA === 'inicio' || VISTA === 'mercado') ir(VISTA); } });
    $$('#aPest button', m).forEach(b => b.onclick = () => { pest = b.dataset.k; Son.click(); $$('#aPest button').forEach(x => x.classList.toggle('on', x === b)); pinta(); });
    pinta();
  }
  function pinta() { const c = $('#aCont'); if (!c) return; c.innerHTML = '<p class="nota">Cargando…</p>'; ({ pedidos, resumen, crear, tienda, jugadores, ajustes, seguridad })[pest](c); }

  function resumen(c) {
    adm('resumen').then(d => {
      if (!d.ok) return;
      c.innerHTML = `<div class="kpis">${[['Jugadores', d.jugadores], ['Criaturas', d.criaturas], ['Huevos', d.huevos], ['Pedidos pendientes', d.pendientes], ['Ventas', d.ventas], ['Facturado', euros(d.facturado) + ' €'], ['Créditos de jugadores', fmt(d.creditosJugadores)], ['En tu tienda', d.enTienda]].map(([n, v]) => `<div class="kpi"><b>${v}</b><small>${n}</small></div>`).join('')}</div>
        <p class="nota">Los créditos de jugadores son lo que debes a los vendedores en moneda del juego (1 céntimo = 1 crédito).</p>`;
    });
  }

  function pedidos(c) {
    adm('pedidos').then(d => {
      if (!d.ok) return;
      const fila = (x, pend) => `<div class="ped">${x.item ? dibujo(x.item, 'quieto') : ''}<div class="pInfo"><b>${x.item ? esc(x.item.tipo === 'huevo' ? 'Huevo #' + x.item.num : nomCr(x.item)) : x.tipo === 'creditos' ? '💎 Recarga de ' + fmt(x.importe) + ' créditos' : '—'}</b>
        <small>${new Date(x.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })} · ${esc(x.id)}</small>
        <small>Compra <b style="color:var(--tx)">${esc(x.comprador)}</b> · ${x.tipo === 'creditos' ? 'recarga de créditos: se le sumarán al confirmar' : 'vende ' + (x.vendedor === 'TIENDA' ? '<b style="color:var(--v)">tu tienda</b>' : '<b style="color:var(--tx)">' + esc(x.vendedor) + '</b> (recibirá ' + fmt(Math.floor(x.importe * (DATA.reglas.comision || 50) / 100)) + ' créditos)')}</small>
        ${pend ? '' : `<span class="est ${x.estado}">${x.estado.toUpperCase()}</span> <small>${esc(x.nota)}</small>`}</div>
        <div style="text-align:right"><div class="pImp">${euros(x.importe)} €</div>${pend ? `<div class="acciones" style="justify-content:flex-end;margin-top:6px"><button class="btn peq" data-ok="${x.id}">✓ PAGO RECIBIDO</button><button class="btn rojo peq" data-no="${x.id}">✕ RECHAZAR</button></div>` : ''}</div></div>`;
      c.innerHTML = `<h3 style="font-size:14px;margin-bottom:8px">PENDIENTES DE CONFIRMAR (${d.pendientes.length})</h3>${d.pendientes.map(x => fila(x, true)).join('') || '<p class="nota">No hay pedidos pendientes. 👌</p>'}
        <p class="nota" style="margin:8px 0 16px">Comprueba en tu app de myPOS que ha llegado un pago con ese importe y pulsa «Pago recibido». La criatura pasa al comprador y el vendedor recibe sus créditos.</p>
        <h3 style="font-size:14px;margin-bottom:8px">HISTORIAL</h3>${d.historial.map(x => fila(x, false)).join('') || '<p class="nota">Sin historial.</p>'}`;
      const b = $('#b_pedidos'); if (b) b.textContent = d.pendientes.length ? ' (' + d.pendientes.length + ')' : '';
      $$('[data-ok]', c).forEach(b => b.onclick = async () => {
        const x = d.pendientes.find(p => p.id === b.dataset.ok);
        if (!await confirmar('Confirmar pago', `¿Has recibido <b>${euros(x.importe)} €</b> de <b>${esc(x.comprador)}</b> en myPOS?`, 'Sí, recibido')) return panel();
        panel(); adm('confirmar', { id: x.id }).then(r => { if (r.ok) { Son.moneda(); toast('Pago confirmado. Entregado a ' + x.comprador, 'ok'); } pinta(); });
      });
      $$('[data-no]', c).forEach(b => b.onclick = async () => {
        const nota = prompt('Motivo del rechazo (lo verá el comprador):', 'Pago no recibido'); if (nota == null) return;
        adm('rechazar', { id: b.dataset.no, nota }).then(r => { if (r.ok) toast('Pedido rechazado. Vuelve a estar a la venta.'); pinta(); });
      });
    });
  }

  /* ---------- editor de criaturas ---------- */
  let G = null, ocultos = 'iguales';
  function crear(c) {
    if (!G) G = CX.genesAzar(Math.floor(Math.random() * 1e9));
    c.innerHTML = `<div class="editor"><div class="edVis"><div class="detVis" id="eVis"></div><div id="eStats"></div>
      <div class="panel" style="margin-top:10px">
        <div class="chips" style="margin-bottom:10px"><button class="chip" id="eAzar">🎲 Aleatoria</button><button class="chip" id="ePura">★ Pura</button></div>
        <label class="campo"><span>Nombre (opcional)</span><input id="eNom" maxlength="20" placeholder="Criaturix #…"></label>
        <label class="campo"><span>Qué vender</span><select id="eTipo"><option value="criatura">Esta criatura</option><option value="huevo">Huevo con esta criatura dentro</option><option value="sorpresa">Huevos sorpresa (al azar)</option></select></label>
        <label class="campo"><span>Genes ocultos (R1, R2)</span><select id="eOcu"><option value="iguales">Iguales a los visibles (crías predecibles)</option><option value="azar">Al azar</option></select></label>
        <div style="display:flex;gap:8px"><label class="campo" style="flex:1"><span>Precio €</span><input id="ePre" inputmode="decimal" placeholder="9,99"></label><label class="campo" style="width:96px"><span>Cantidad</span><input id="eCan" type="number" min="1" max="20" value="1"></label></div>
        <button class="btn oro bloque" id="eOk">CREAR Y PONER A LA VENTA</button><p class="nota" style="margin-top:6px">Sin precio se guarda en tu tienda sin publicar.</p></div></div>
      <div><h3 style="font-size:13px;color:var(--tx2);margin-bottom:6px">CLASE DEL CUERPO</h3><div class="edOps" id="eCla" style="margin-bottom:10px"></div>
      <h3 style="font-size:13px;color:var(--tx2);margin-bottom:6px">TONO</h3><div class="chips" id="eCol" style="margin-bottom:12px"></div>
      <div class="edPiezas" id="ePie"></div><h3 style="font-size:13px;color:var(--tx2);margin:12px 0 6px">CARTAS</h3><div class="cartasDet" id="eCar"></div></div></div>`;
    $('#eOcu').value = ocultos;
    $('#eOcu').onchange = e => { ocultos = e.target.value; };
    $('#eAzar').onclick = () => { G = CX.genesAzar(Math.floor(Math.random() * 1e9)); Son.carta(); dib(); };
    $('#ePura').onclick = () => { CX.SLOTS.forEach(s => { const v = CX.parteGen(G.p[s][0]).v; G.p[s][0] = G.c + v; }); Son.carta(); dib(); };
    $('#eOk').onclick = e => {
      const tipo = $('#eTipo').value, genes = JSON.parse(JSON.stringify(G));
      CX.SLOTS.forEach(s => { if (ocultos === 'iguales') { genes.p[s][1] = genes.p[s][0]; genes.p[s][2] = genes.p[s][0]; } else { genes.p[s][1] = CX.LISTA_CLASES[Math.floor(Math.random() * 6)] + Math.round(Math.random()); genes.p[s][2] = CX.LISTA_CLASES[Math.floor(Math.random() * 6)] + Math.round(Math.random()); } });
      ocupado(e.target, true);
      adm('crear', { genes: tipo === 'sorpresa' ? null : genes, azar: tipo === 'sorpresa' ? 1 : 0, tipo: tipo === 'criatura' ? 'criatura' : 'huevo', nombre: $('#eNom').value, precio: $('#ePre').value, cantidad: $('#eCan').value })
        .then(d => { ocupado(e.target, false); if (!d.ok) return; Son.moneda(); confeti(30); toast(d.creadas.length + (d.creadas.length > 1 ? ' creadas' : ' creada') + ' en tu tienda', 'ok'); });
    };
    dib();
  }
  function dib() {
    const K = CX.CLASES[G.c];
    $('#eVis').style.setProperty('--cc', K.col); $('#eVis').innerHTML = ROBOT.svg(G);
    $('#eStats').innerHTML = statsHTML(G) + `<div style="text-align:center">${claseHTML(G.c)} ${purezaHTML(G)}</div>`;
    $('#eCla').innerHTML = CX.LISTA_CLASES.map(c => `<button style="--cc:${CX.CLASES[c].col}" class="${G.c === c ? 'on' : ''}" data-c="${c}" title="${CX.CLASES[c].nom}">${CX.CLASES[c].nom.slice(0, 3).toUpperCase()}</button>`).join('');
    $$('#eCla button').forEach(b => b.onclick = () => { G.c = b.dataset.c; Son.click(); dib(); });
    $('#eCol').innerHTML = [0, 1, 2, 3].map(i => `<button class="chip ${G.col === i ? 'on' : ''}" data-i="${i}">Tono ${i + 1}</button>`).join('');
    $$('#eCol .chip').forEach(b => b.onclick = () => { G.col = +b.dataset.i; Son.click(); dib(); });
    $('#ePie').innerHTML = CX.SLOTS.map(s => `<div class="edPieza"><h4>${CX.NOM_SLOT[s].toUpperCase()}</h4><div class="edOps">${[0, 1].map(v => CX.LISTA_CLASES.map(c => `<button style="--cc:${CX.CLASES[c].col}" class="${G.p[s][0] === c + v ? 'on' : ''}" data-s="${s}" data-g="${c + v}" title="${esc(CX.nombreParte(s, c + v))}">${v + 1}</button>`).join('')).join('')}</div><div class="pn">${esc(CX.nombreParte(s, G.p[s][0]))}</div></div>`).join('');
    $$('#ePie button').forEach(b => b.onclick = () => { G.p[b.dataset.s][0] = b.dataset.g; Son.carta(); dib(); });
    $('#eCar').innerHTML = CX.cartasDe(G).map(k => cartaHTML(k, { genes: G })).join('');
  }

  function tienda(c) {
    adm('tienda').then(d => {
      if (!d.ok) return;
      c.innerHTML = `<p class="nota" style="margin-bottom:10px">Todo lo que has creado. Cambia el precio (vacío = retirar de la venta), regálalo a un jugador o bórralo.</p>
        <div class="rejilla">${d.lista.map(x => `<div class="tc" data-id="${x.id}" style="--cc:${x.tipo === 'huevo' ? '#19ff6a' : colClase(x.clase)}"><span class="tcNum">#${x.num}</span>${x.estado ? `<span class="etq ${x.estado}">${x.estado === 'venta' ? 'EN VENTA' : 'RESERVADA'}</span>` : ''}${x.tipo === 'huevo' ? ROBOT.huevo(x.clase) : ROBOT.svg(x.genes)}
          <div class="tcNom">${esc(x.tipo === 'huevo' ? (x.nombre || 'Huevo #' + x.num) : nomCr(x))}</div><div class="tcPrecio">${x.precio ? euros(x.precio) + ' €' : '—'}</div>
          <div class="acciones"><button class="btn peq" data-pre="${x.id}">PRECIO</button><button class="btn cian peq" data-reg="${x.id}">REGALAR</button><button class="btn rojo peq" data-bor="${x.id}">✕</button></div></div>`).join('') || '<p class="nota">Aún no has creado nada. Ve a «Crear».</p>'}</div>`;
      $$('.tc', c).forEach(t => t.onclick = e => { if (e.target.closest('button')) return; });
      $$('[data-pre]', c).forEach(b => b.onclick = () => {
        const x = d.lista.find(i => i.id === b.dataset.pre), v = prompt('Precio en euros (vacío = no vender):', x.precio ? euros(x.precio) : ''); if (v == null) return;
        adm('precio', { id: x.id, precio: v }).then(r => { if (r.ok) toast('Precio guardado', 'ok'); pinta(); });
      });
      $$('[data-reg]', c).forEach(b => b.onclick = () => {
        const u = prompt('Nombre de usuario o correo del jugador:'); if (!u) return;
        adm('entregar', { id: b.dataset.reg, usuario: u }).then(r => { if (r.ok) { toast('Regalado a ' + u, 'ok'); Son.moneda(); } pinta(); });
      });
      $$('[data-bor]', c).forEach(b => b.onclick = async () => { panelTrasConfirmar(await confirmar('Borrar', '¿Borrar esta criatura de tu tienda? No se puede deshacer.', 'Borrar', 'rojo'), () => adm('borrar', { id: b.dataset.bor }).then(r => { if (r.ok) toast('Borrada'); pinta(); })); });
    });
  }
  function panelTrasConfirmar(si, fn) { panel(); if (si) fn(); }

  function jugadores(c) {
    adm('jugadores').then(d => {
      if (!d.ok) return;
      c.innerHTML = `<input id="jBus" placeholder="Buscar jugador…" style="width:100%;padding:11px;border-radius:12px;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.15);margin-bottom:10px">
        <div class="scrollx"><table class="tabla" id="jT"></table></div>`;
      const pintaT = f => {
        $('#jT').innerHTML = '<tr><th>Usuario</th><th>Correo</th><th>Chips</th><th>Créditos</th><th>Arena</th><th>Etapa</th><th>Criat.</th><th></th></tr>' +
          d.lista.filter(j => !f || (j.usuario + j.email).toLowerCase().includes(f)).map(j => `<tr><td><b>${esc(j.usuario)}</b></td><td>${esc(j.email)}</td><td>${fmt(j.chips)}</td><td>${fmt(j.creditos)}</td><td>${j.elo}</td><td>${j.etapa}</td><td>${j.criaturas}</td><td><button class="btn sec peq" data-aj="${j.id}">AJUSTAR</button></td></tr>`).join('');
        $$('[data-aj]').forEach(b => b.onclick = () => {
          const j = d.lista.find(x => x.id === b.dataset.aj);
          const m2 = modal(`<h2>Ajustar saldo de ${esc(j.usuario)}</h2><p class="nota">Pon números positivos para sumar o negativos para restar.</p>
            <label class="campo"><span>Chips</span><input id="ajC" type="number" value="0"></label><label class="campo"><span>Créditos (1 crédito = 1 céntimo)</span><input id="ajCr" type="number" value="0"></label>
            <label class="campo"><span>Motivo</span><input id="ajN" value="Ajuste del administrador"></label><div class="acciones" style="justify-content:flex-end"><button class="btn sec" id="ajX">Cancelar</button><button class="btn" id="ajOk">GUARDAR</button></div>`);
          $('#ajX', m2).onclick = panel;
          $('#ajOk', m2).onclick = () => adm('saldo', { id: j.id, chips: $('#ajC').value, creditos: $('#ajCr').value, nota: $('#ajN').value }).then(r => { if (r.ok) toast('Saldo actualizado', 'ok'); panel(); });
        });
      };
      $('#jBus').oninput = e => pintaT(e.target.value.toLowerCase()); pintaT('');
    });
  }

  function ajustes(c) {
    adm('ajustes').then(d => {
      if (!d.ok) return;
      c.innerHTML = `<form id="ajF">${d.lista.map(a => `<label class="campo"><span>${esc(a.k)}</span><input name="${esc(a.k)}" value="${esc(a.v)}"><small style="color:var(--tx2)">${esc(a.ayuda)}</small></label>`).join('')}<button class="btn" type="submit">GUARDAR AJUSTES</button></form>`;
      $('#ajF').onsubmit = e => { e.preventDefault(); const v = {}; $$('#ajF input').forEach(i => v[i.name] = i.value); adm('guardarAjustes', { valores: v }).then(r => { if (r.ok) { toast('Ajustes guardados', 'ok'); refrescar(); } }); };
    });
  }

  function seguridad(c) {
    c.innerHTML = `<div class="panel"><h3 style="font-size:14px;margin-bottom:8px">GOOGLE AUTHENTICATOR</h3><p class="nota">Escanea este código con Google Authenticator para poder entrar al panel solo con el código de 6 cifras.</p><div id="admQrImg" style="margin:12px auto"></div><p class="nota" id="sSec" style="text-align:center;font-family:Orbitron;word-break:break-all"></p></div>
      <div class="panel" style="margin-top:12px"><h3 style="font-size:14px;margin-bottom:8px">LLAVES NFC</h3><p class="nota">Si pierdes tu llave, bórralas aquí. La próxima llave que pases (con tu cuenta ${esc('futurmovil.com@gmail.com')} abierta) quedará registrada.</p><button class="btn rojo" id="sBor" style="margin-top:10px">BORRAR LLAVES</button></div>`;
    adm('totp').then(d => {
      if (!d.ok || !$('#admQrImg')) return;
      const go = () => { const q = qrcode(0, 'M'); q.addData(d.url); q.make(); $('#admQrImg').innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); $('#sSec').textContent = d.secreto; };
      window.qrcode ? go() : setTimeout(go, 800);
    });
    $('#sBor').onclick = async () => panelTrasConfirmar(await confirmar('Borrar llaves', '¿Borrar todas las llaves NFC registradas?', 'Borrar', 'rojo'), () => adm('borrarLlaves').then(r => { if (r.ok) toast('Llaves borradas'); }));
  }
  return { abrir };
})();
