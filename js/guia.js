/* =========================================================
   CRIATURIX · Academia (guía oficial del jugador)
   Se ve dentro del juego (VISTAS.guia) y es la misma página que se imprime al PDF.
   ========================================================= */
(function () {
  'use strict';
  const IMG = 'img/guia/', V = '?v=1';
  const SL = ['ojos', 'antenas', 'boca', 'cuerno', 'espalda', 'cola'];
  function pura(c, col, vs) { const p = {}; SL.forEach((s, i) => { const v = vs ? vs[i] : 0; p[s] = [c + v, c + v, c + v]; }); return { c, col: col || 0, p }; }
  function mezcla(c, col, partes) { const g = pura(c, col); Object.keys(partes).forEach(s => { g.p[s] = [partes[s], partes[s], c + '0']; }); return g; }
  const bot = (g, cls) => ROBOT.svg(g, { cls: cls || 'quieto' });
  const tel = (img, pie) => `<figure class="gTel"><div class="gTelMarco"><img src="${IMG}${img}.webp${V}" alt="" loading="lazy"></div>${pie ? `<figcaption>${pie}</figcaption>` : ''}</figure>`;
  const col = c => CX.CLASES[c].col;
  const cl = c => `<b style="color:${col(c)}">${CX.CLASES[c].nom}</b>`;
  const sec = (n, id, tit, lead, cuerpo, cls) => `<section class="gSec ${cls || ''}" id="g-${id}"><div class="gCab"><span class="gNum">${n}</span><div><h2>${tit}</h2>${lead ? `<p class="gLead">${lead}</p>` : ''}</div></div>${cuerpo}</section>`;
  const tip = (t, ico) => `<div class="gTip"><i>${ico || '💡'}</i><p>${t}</p></div>`;
  const dato = (v, t, c) => `<div class="gDato" style="--gc:${c || 'var(--c)'}"><b>${v}</b><small>${t}</small></div>`;

  const CAP = [
    ['empezar', 'Primeros pasos'], ['clases', 'Las 6 clases'], ['anatomia', 'Anatomía'], ['cartas', 'Las cartas'], ['combate', 'El combate'],
    ['aventura', 'Aventura'], ['arena', 'Arena y ranking'], ['criadero', 'Criadero y genes'], ['mercado', 'Mercado y economía'], ['pro', 'Consejos pro']
  ];

  function html(pdf) {
    const R = (window.DATA && DATA.reglas) || {};
    const coste = (R.costeCria && R.costeCria.length ? R.costeCria : CX.REGLAS.costeCria);
    const k = (slot, g) => cartaHTML(CX.carta(slot, g), { cls: 'gCarta' });

    /* ---------- portada ---------- */
    const portada = `<header class="gHero">
      <div class="gHeroFx"></div>
      <div class="gHeroTxt"><span class="gKicker">GUÍA OFICIAL DEL JUGADOR</span><h1>ACADEMIA<br><em>CRIATURIX</em></h1>
      <p>Todo lo que necesitas para pasar de novato a leyenda: clases, cartas, combates, cría de genes, mercado y los trucos de los mejores jugadores.</p>
      ${pdf ? '<div class="gHeroPie">FuturMovil presenta · CRIATURIX · Cría · Combate · Colecciona</div>' : `<div class="gHeroBtns"><a class="btn oro grande" href="guia/criaturix-guia.pdf?v=1" download="Guia-CRIATURIX.pdf">⤓ DESCARGAR GUÍA EN PDF</a><button class="btn sec" id="gVolver">VOLVER A MIS CRIATURAS</button></div>`}</div>
      <div class="gHeroBots"><div class="gB1">${bot(pura('sombra', 0))}</div><div class="gB2">${bot(pura('voltio', 0))}</div><div class="gB3">${bot(pura('bio', 0))}</div></div>
    </header>`;

    const indice = `<nav class="gIndice">${CAP.map(([id, n], i) => `<a href="#g-${id}" data-g="${id}"><span>${String(i + 1).padStart(2, '0')}</span>${n}</a>`).join('')}</nav>`;

    /* ---------- 01 primeros pasos ---------- */
    const s1 = sec('01', 'empezar', 'PRIMEROS PASOS', 'Crea tu cuenta y en menos de un minuto estarás combatiendo.', `
      <div class="gDos"><div>
        <ol class="gPasos">
          <li><b>Crea tu cuenta</b> con tu correo o con Google. Te regalamos <b class="o">${R.chipsInicio || CX.REGLAS.chipsInicio} chips</b> y <b>3 criaturas iniciales</b> para que empieces a jugar ya.</li>
          <li><b>Revisa tu equipo.</b> Tres criaturas luchan juntas: una <b>delante</b>, una en el <b>centro</b> y una <b>detrás</b>.</li>
          <li><b>Juega la Aventura.</b> Son 30 etapas para aprender, ganar chips y subir de nivel.</li>
          <li><b>Consigue más criaturas</b> en el Mercado o críalas tú en el Criadero.</li>
          <li><b>Salta a la Arena</b> y mide tu equipo contra el de otros jugadores.</li>
        </ol>
        <div class="gDatos">${dato(R.energiaDia || 20, 'combates con premio al día', 'var(--v)')}${dato('3', 'criaturas por equipo')}${dato('30', 'etapas de aventura', 'var(--o)')}</div>
        ${tip('La barra de arriba siempre te muestra tus <b class="o">chips</b>, tus <b style="color:var(--c)">créditos</b> y los <b style="color:var(--v)">combates con premio</b> que te quedan hoy.')}
      </div>${tel('inicio', 'La pantalla de inicio: desde aquí llegas a todo')}</div>`);

    /* ---------- 02 clases ---------- */
    const tarj = CX.LISTA_CLASES.map(c => { const K = CX.CLASES[c], b = K.base, bo = Object.keys(K.bono).map(x => ({ hp: 'Vida', vel: 'Velocidad', hab: 'Habilidad', mor: 'Moral' }[x] + ' +' + K.bono[x])).join(' · ');
      return `<div class="gClase" style="--gc:${K.col}"><div class="gClaseBot">${bot(pura(c, 0))}</div><h3>${K.nom.toUpperCase()}</h3>
        <div class="gMini">${[['Vida', b.hp, 'var(--v)'], ['Vel.', b.vel, 'var(--o)'], ['Hab.', b.hab, 'var(--c)'], ['Moral', b.mor, 'var(--m)']].map(([n, v, cc]) => `<div><small>${n}</small><i><u style="width:${v / 45 * 100}%;background:${cc}"></u></i><b>${v}</b></div>`).join('')}</div>
        <p class="gBono">Cada pieza ${K.nom} suma: ${bo}</p></div>`; }).join('');
    const tri = `<svg class="gTri" viewBox="0 0 420 330"><defs><marker id="gFl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#fff"/></marker></defs>
      <g stroke="#fff" stroke-width="3" fill="none" marker-end="url(#gFl)" opacity=".85"><path d="M150 70 L95 225"/><path d="M135 265 L285 265"/><path d="M325 225 L270 70"/></g>
      <g font-family="Orbitron" font-weight="900" font-size="15" fill="#ffd23f" text-anchor="middle"><text x="95" y="150">+15%</text><text x="210" y="290">+15%</text><text x="325" y="150">+15%</text></g>
      <g font-family="Orbitron" font-weight="900" font-size="15" text-anchor="middle">
        <circle cx="210" cy="50" r="40" fill="rgba(255,77,46,.18)" stroke="${col('plasma')}" stroke-width="3"/><text x="210" y="46" fill="${col('plasma')}">PLASMA</text><text x="210" y="64" fill="${col('voltio')}">VOLTIO</text>
        <circle cx="90" cy="265" r="40" fill="rgba(25,255,106,.15)" stroke="${col('bio')}" stroke-width="3"/><text x="90" y="261" fill="${col('bio')}">BIO</text><text x="90" y="279" fill="${col('cromo')}">CROMO</text>
        <circle cx="330" cy="265" r="40" fill="rgba(177,75,255,.18)" stroke="${col('sombra')}" stroke-width="3"/><text x="330" y="261" fill="${col('cuantico')}" font-size="12">CUÁNTICO</text><text x="330" y="279" fill="${col('sombra')}">SOMBRA</text></g></svg>`;
    const s2 = sec('02', 'clases', 'LAS 6 CLASES', 'Cada Criaturix pertenece a una clase. La clase decide sus estadísticas base, el tipo de cartas que usa y contra quién tiene ventaja.', `
      <div class="gClases">${tarj}</div>
      <div class="gDos gCentro"><div class="gPanel"><h3>EL TRIÁNGULO DE VENTAJA</h3>${tri}</div><div>
        <p>Las clases van por parejas y cada pareja gana a otra:</p>
        <ul class="gLista"><li>${cl('plasma')} y ${cl('voltio')} hacen <b class="o">+15 %</b> de daño a ${cl('bio')} y ${cl('cromo')}.</li>
        <li>${cl('bio')} y ${cl('cromo')} hacen <b class="o">+15 %</b> a ${cl('cuantico')} y ${cl('sombra')}.</li>
        <li>${cl('cuantico')} y ${cl('sombra')} hacen <b class="o">+15 %</b> a ${cl('plasma')} y ${cl('voltio')}.</li>
        <li>En sentido contrario pegas un <b style="color:var(--r)">15 % menos</b>.</li></ul>
        ${tip('La ventaja se mira con la clase de la <b>carta</b> que lanzas y la clase del <b>cuerpo</b> que recibe el golpe. Una criatura mezclada puede llevar cartas de varias clases y tener respuesta para todo.', '🎯')}
      </div></div>`);

    /* ---------- 03 anatomía ---------- */
    const ej = mezcla('voltio', 0, { cuerno: 'plasma0', cola: 'sombra1' });
    const s3 = sec('03', 'anatomia', 'ANATOMÍA DE UN CRIATURIX', 'Cada criatura está hecha de un cuerpo y 6 piezas. Las piezas deciden sus cartas y sus estadísticas.', `
      <div class="gDos gCentro"><div class="gAnat"><div class="gAnatBot">${bot(pura('cromo', 0))}</div>
        ${[['ojos', 'Ojos', 74, 40], ['antenas', 'Antenas', 40, 8], ['cuerno', 'Cuerno ⚔', 90, 18], ['boca', 'Boca ⚔', 84, 62], ['espalda', 'Espalda ⚔', 24, 30], ['cola', 'Cola ⚔', 8, 60]].map(([s, n, x, y]) => `<span class="gEtq" style="left:${x}%;top:${y}%">${n}</span>`).join('')}
        <p class="gPie">⚔ = pieza que da una carta de combate</p></div>
      <div><ul class="gLista">
        <li><b>6 piezas:</b> ojos, antenas, boca, cuerno, espalda y cola. Cada una puede ser de cualquier clase y tiene <b>2 variantes</b>.</li>
        <li><b>4 piezas dan cartas:</b> boca, cuerno, espalda y cola. Por eso cada criatura lleva 4 cartas.</li>
        <li><b>Pureza:</b> las barritas de colores te dicen cuántas piezas son de la misma clase que el cuerpo. Con 6 de 6 es un <b class="o">PURO</b>, lo más buscado.</li>
        <li><b>Tono de piel:</b> cada clase tiene 4 tonos de metal distintos. Solo es estética, pero hay coleccionistas que los buscan todos.</li></ul></div></div>
      <div class="gDos"><div><h3 class="gH3">LAS 4 ESTADÍSTICAS</h3><div class="gStats">
        <div style="--gc:var(--v)"><b>VIDA</b><p>Los puntos de vida (PV) que aguanta antes de caer.</p></div>
        <div style="--gc:var(--o)"><b>VELOCIDAD</b><p>La más rápida actúa primero en cada ronda.</p></div>
        <div style="--gc:var(--c)"><b>HABILIDAD</b><p>Daño extra cuando la misma criatura juega <b>2 cartas o más</b> en la ronda.</p></div>
        <div style="--gc:var(--m)"><b>MORAL</b><p>Probabilidad de <b>golpe crítico</b>, que hace un 75 % más de daño.</p></div></div>
        ${tip('Cada pieza suma el bono de su clase. Un cuerpo Voltio con un cuerno Plasma gana velocidad y además moral. Mezclar bien es un arte.', '🧬')}
      </div>${tel('detalle', 'La ficha de una criatura: estadísticas, cartas y genes')}</div>
      <div class="gEjemplo"><div class="gEjBot">${bot(ej)}</div><div><h3 class="gH3">EJEMPLO DE MEZCLA</h3><p>Cuerpo ${cl('voltio')} con cuerno ${cl('plasma')} y cola ${cl('sombra')}: pureza 4 de 6. Sus cartas de cuerno pegan fuerte contra ${cl('bio')} y ${cl('cromo')}, y la de cola contra ${cl('plasma')} y ${cl('voltio')}.</p></div></div>`);

    /* ---------- 04 cartas ---------- */
    const lv = CX.carta('cuerno', 'voltio1');
    const anatCarta = `<div class="gCartaAnat"><div class="gCartaG">${cartaHTML(lv, { cls: 'gCarta grande' })}</div>
      <span class="gCe" style="left:-4%;top:6%">① Energía</span><span class="gCe d" style="right:-4%;top:6%">② Pieza</span>
      <span class="gCe" style="left:-4%;top:60%">③ Nombre</span><span class="gCe d" style="right:-4%;top:70%">④ Ataque y escudo</span><span class="gCe" style="left:-4%;top:86%">⑤ Efecto</span></div>`;
    const efs = [['corrosion', 'Corrosión', 'Pierde 8 PV por cada punto al final de cada ronda. Se acumula.'], ['aturde', 'Aturdir', 'Su próximo ataque falla y el siguiente golpe que reciba atraviesa su escudo.'],
      ['miedo', 'Miedo', 'El objetivo no puede atacar la próxima ronda.'], ['expuesto', 'Exponer', 'El siguiente golpe que reciba hace +30 %.'], ['drenaje', 'Drenaje', 'Te curas la mitad del daño que haces.'],
      ['combo', 'Combo', '+40 % si la criatura juega 2 cartas o más en la ronda.'], ['remata', 'Rematar', '+50 % si al objetivo le queda menos del 40 % de vida.'], ['antiEsc', 'Rompe-escudos', 'Hace el doble de daño a los escudos.'],
      ['energia', 'Energía', 'Ganas energía extra para jugar más cartas.'], ['robar', 'Robar', 'Robas cartas nuevas a tu mano.'], ['curaEq', 'Cura de equipo', 'Cura a tus 3 criaturas a la vez.'], ['escudoEq', 'Escudo de equipo', 'Da escudo a tus 3 criaturas.']];
    const s4 = sec('04', 'cartas', 'LAS CARTAS', 'Las cartas son tus ataques. Cada criatura aporta sus 4 cartas al mazo del equipo.', `
      <div class="gDos gCentro">${anatCarta}<div><ol class="gPasos num">
        <li><b>Energía:</b> lo que cuesta jugarla. Hay cartas de 0, 1 y 2.</li>
        <li><b>Pieza:</b> de qué pieza sale (boca, cuerno, espalda o cola). El color es su clase.</li>
        <li><b>Nombre</b> de la carta.</li>
        <li><b>⚔ Ataque</b> es el daño que hace y <b>⛨ escudo</b> lo que protege a la criatura que la juega.</li>
        <li><b>Efecto especial</b> y a quién ataca: al de delante, al de más atrás o al que tenga menos vida.</li></ol>
        ${tip('Una carta de la <b>misma clase</b> que la criatura que la juega pega un <b class="o">10 % más</b>.', '⚡')}</div></div>
      <h3 class="gH3">ALGUNAS CARTAS DEL JUEGO</h3>
      <div class="gCartas">${k('boca', 'plasma0')}${k('espalda', 'cromo0')}${k('boca', 'bio1')}${k('cuerno', 'sombra0')}${k('espalda', 'voltio0')}${k('cola', 'cuantico0')}</div>
      <h3 class="gH3">EFECTOS ESPECIALES</h3><div class="gEfectos">${efs.map(([f, n, t]) => `<div><b>${n}</b><p>${t}</p></div>`).join('')}</div>`);

    /* ---------- 05 combate ---------- */
    const s5 = sec('05', 'combate', 'EL COMBATE', 'Los combates son por rondas. Los dos jugadores eligen cartas a la vez y después se resuelve todo en orden de velocidad.', `
      <div class="gDos">${tel('equipo', 'Formación: delante, centro y detrás')}<div>
        <h3 class="gH3">LA FORMACIÓN</h3><ul class="gLista">
        <li><b>Delante</b> recibe casi todos los golpes. Pon a tu criatura con más vida o más escudo.</li>
        <li><b>Centro</b> es el puesto equilibrado.</li>
        <li><b>Detrás</b> está protegida: ideal para las que curan, dan energía o rematan. ¡Ojo! Algunas cartas atacan justo a la de más atrás.</li></ul>
        <h3 class="gH3">CÓMO VA UNA RONDA</h3><ol class="gPasos num">
        <li>Recibes <b>energía</b> (empiezas con 3 y ganas 2 por ronda, máximo 10) y <b>cartas</b> (empiezas con 6 y robas 3 por ronda).</li>
        <li>Toca una carta y luego la criatura que la lanzará. Puedes darle varias cartas a la misma criatura.</li>
        <li>Pulsa <b>¡LUCHAR!</b> Actúa primero la criatura más rápida de las seis.</li>
        <li>Gana el que deje sin vida a las 3 criaturas del rival.</li></ol></div></div>
      <div class="gDos">${tel('combate', 'Eligiendo cartas: la energía está en las bolitas verdes')}${tel('combate2', 'La ronda en marcha: golpes, escudos y críticos')}</div>
      <div class="gDatos">${dato('3 → 10', 'energía: inicial → máxima', 'var(--v)')}${dato('+2', 'energía por ronda', 'var(--v)')}${dato('6 + 3', 'cartas al empezar + por ronda')}${dato('24', 'cartas en el mazo del equipo', 'var(--o)')}</div>
      ${tip('<b>¡SOBRECARGA!</b> Desde la ronda 11 todas las criaturas pierden vida cada ronda, y cada vez más. Los combates no se alargan para siempre: ataca con cabeza.', '⚠️')}`);

    /* ---------- 06 aventura ---------- */
    const zonas = CX.ZONAS.map((z, i) => `<div class="gZona" style="--gc:${['#19ff6a', '#00e5ff', '#ff4d2e', '#8af9ff', '#b14bff', '#ffd23f'][i]}"><b>${i * 5 + 1}–${i * 5 + 5}</b><span>${z}</span></div>`).join('');
    const s6 = sec('06', 'aventura', 'AVENTURA', '30 etapas contra robots salvajes repartidas en 6 zonas. Cada 5 etapas te espera un JEFE.', `
      <div class="gDos">${tel('aventura', 'El mapa de la aventura')}<div>
        <div class="gZonas">${zonas}</div>
        <ul class="gLista"><li>Los rivales de cada etapa son siempre los mismos: si pierdes, estudia sus clases y vuelve con el equipo adecuado.</li>
        <li><b>Premio:</b> la primera vez que ganas una etapa te llevas <b class="o">15 + 3 × etapa</b> chips (la etapa 10 da 45). Repetirla da menos, pero sigue sumando.</li>
        <li>Los <b>jefes ☠</b> son más fuertes que el resto. Llega con tu mejor formación.</li>
        <li>Tienes <b>${R.energiaDia || 20} combates con premio al día</b>. Al día siguiente se recargan.</li></ul>
        ${tel('etapa', 'Antes de luchar ves a los rivales, su fuerza y el premio')}</div></div>`);

    /* ---------- 07 arena ---------- */
    const s7 = sec('07', 'arena', 'ARENA Y RANKING', 'Lucha contra el equipo de otros jugadores en tiempo real y escala en la clasificación.', `
      <div class="gDos">${tel('arena', 'Buscando rival en la arena')}<div><ul class="gLista">
        <li>Pulsa <b>BUSCAR RIVAL</b> y el radar buscará a otro jugador conectado. Si no hay nadie libre en unos segundos, te enfrentarás a un bot.</li>
        <li>Cada ronda tienes <b>${R.turnoSeg || 40} segundos</b> para elegir tus cartas. Si se acaba el tiempo, se lucha con lo que tengas elegido.</li>
        <li>Todos empiezan con <b>1000 puntos</b>. Ganar a alguien con más puntos que tú suma mucho; perder contra alguien con menos resta mucho.</li>
        <li>Cada victoria en la arena te da <b class="o">chips</b>.</li></ul>
        ${tel('ranking', 'El ranking: arena y aventura')}</div></div>`);

    /* ---------- 08 criadero ---------- */
    const s8 = sec('08', 'criadero', 'CRIADERO Y GENES', 'Junta dos criaturas y nacerá un huevo con una mezcla de sus genes. Aquí es donde se crean los mejores Criaturix.', `
      <div class="gDos">${tel('criadero', 'Elige dos padres y mira la probabilidad de cada pieza')}<div>
        <h3 class="gH3">LOS GENES OCULTOS</h3>
        <p>Cada pieza tiene 3 genes: el <b>dominante</b> (el que se ve) y dos <b>recesivos</b> escondidos (R1 y R2). Al criar, cada padre aporta:</p>
        <div class="gGenes"><div style="--gc:var(--v)"><b>37,5 %</b><span>Dominante</span></div><div style="--gc:var(--c)"><b>9,4 %</b><span>Recesivo R1</span></div><div style="--gc:var(--p)"><b>3,1 %</b><span>Recesivo R2</span></div></div>
        <p class="gPie">por cada padre, en cada pieza · y un 2 % de mutación sorpresa</p>
        <ul class="gLista"><li>Dos padres puros de la misma clase con recesivos puros tienen muchísimas papeletas de dar otro puro.</li>
        <li>Mira los genes en la ficha de cada criatura (botón <b>GENES</b>) antes de elegir pareja.</li>
        <li>El huevo tarda <b>${R.horasEclosion || 24} h</b> en eclosionar. Luego lo abres con una animación… ¡y descubres lo que ha salido!</li></ul></div></div>
      <div class="gDos"><div class="gPanel"><h3>CUÁNTO CUESTA CRIAR</h3><p class="gPie" style="text-align:left">Chips que paga cada padre según las crías que ya ha tenido</p>
        <div class="gCoste">${coste.map((c, i) => `<div><small>${i}ª</small><b>${c}</b></div>`).join('')}</div>
        <p>Cada criatura puede criar como máximo <b>${R.maxCrias || 7} veces</b>. Las 3 criaturas iniciales no pueden criar.</p></div>
        ${tip('Cuantas menos crías tiene un Criaturix, más barato cría y más vale en el mercado. ¡Cuida a tus mejores reproductores!', '🥚')}</div>`);

    /* ---------- 09 mercado ---------- */
    const s9 = sec('09', 'mercado', 'MERCADO Y ECONOMÍA', 'Compra, vende e intercambia con otros jugadores. Hay tres monedas y cada una sirve para algo.', `
      <div class="gMonedas">
        <div style="--gc:var(--o)"><i class="ic-chip"></i><h3>CHIPS</h3><p>Se ganan jugando: aventura, arena y regalo de bienvenida. Sirven para <b>criar</b>.</p></div>
        <div style="--gc:var(--c)"><i class="ic-cred"></i><h3>CRÉDITOS</h3><p><b>1 crédito = 1 céntimo.</b> Los ganas al vender tus criaturas o recargando. Con ellos compras en el mercado al momento.</p></div>
        <div style="--gc:var(--v)"><b class="gEuro">€</b><h3>EUROS</h3><p>Paga con tarjeta, Apple Pay o Google Pay mediante myPOS. Cuando Futurmovil confirma el pago, es tuyo.</p></div></div>
      <div class="gDos">${tel('mercado', 'La tienda oficial y el mercado de jugadores')}<div>
        <h3 class="gH3">TIENDA OFICIAL</h3><div class="gPrecios">
        <div><b>5,99 €</b><span>Huevo sorpresa</span></div><div><b>6,99 €</b><span>Muy mezclado</span></div><div><b>7,99 €</b><span>Medio mezclado</span></div><div><b>8,99 €</b><span>Casi puro</span></div><div class="top"><b>9,99 €</b><span>PURO</span></div></div>
        <h3 class="gH3">VENDER TUS CRIATURAS</h3><ul class="gLista">
        <li>Abre una criatura o un huevo y pulsa <b>VENDER</b>. Tú pones el precio.</li>
        <li>Cuando alguien te la compra recibes el <b>${R.comision || 50} %</b> del precio en créditos.</li>
        <li>Mientras está a la venta no puede luchar ni criar. Puedes retirarla cuando quieras.</li></ul>
        ${tip('Una compra pagada con <b>créditos</b> es instantánea: la criatura aparece en tu cuenta al momento.', '💎')}</div></div>`);

    /* ---------- 10 consejos ---------- */
    const consejos = [
      ['Equipo equilibrado', 'Mezcla clases de parejas distintas para tener ventaja contra cualquier rival.'],
      ['El tanque, delante', 'Pon delante a la criatura con más vida y cartas de escudo. Es la que aguanta.'],
      ['No gastes por gastar', 'Guardar energía para la ronda siguiente te deja hacer jugadas de 3 y 4 cartas.'],
      ['Combos con habilidad', 'Dar 2 cartas a la misma criatura activa su habilidad y las cartas de Combo.'],
      ['Estados primero', 'Lanza Exponer, Aturdir o Miedo antes de tu golpe fuerte. La velocidad decide el orden.'],
      ['Remata al débil', 'Las cartas que atacan al que tiene menos vida quitan criaturas rivales de en medio.'],
      ['Cuidado con la sobrecarga', 'Desde la ronda 11 todos pierden vida: si vas ganando, defiende; si vas perdiendo, arriesga.'],
      ['Cría con cabeza', 'Mira los genes recesivos. Dos padres con recesivos iguales dan crías predecibles.'],
      ['Los puros valen oro', 'Un 6/6 con pocas crías es la joya del mercado. Críalos y véndelos bien.'],
      ['Juega todos los días', 'Tus combates con premio se recargan cada día: no los dejes sin usar.']];
    const s10 = sec('10', 'pro', 'CONSEJOS PRO', 'Lo que saben los jugadores del top del ranking.', `<div class="gConsejos">${consejos.map(([t, d], i) => `<div><span>${String(i + 1).padStart(2, '0')}</span><b>${t}</b><p>${d}</p></div>`).join('')}</div>
      <div class="gFinal"><div class="gFinalBots">${bot(pura('plasma', 0))}${bot(pura('cuantico', 0))}${bot(pura('cromo', 0))}</div><h2>¿LISTO PARA LA ARENA?</h2><p>Ahora ya sabes todo lo que hay que saber. ¡A combatir!</p>
      ${pdf ? '<p class="gPie">puntofibra.github.io/criaturix</p>' : '<div class="gHeroBtns" style="justify-content:center"><button class="btn grande" id="gCombatir">⚔ COMBATIR</button><a class="btn oro" href="guia/criaturix-guia.pdf?v=1" download="Guia-CRIATURIX.pdf">⤓ DESCARGAR PDF</a></div>'}</div>`);

    return `<div class="guia ${pdf ? 'gPdf' : ''}">${portada}${pdf ? '' : indice}${s1}${s2}${s3}${s4}${s5}${s6}${s7}${s8}${s9}${s10}</div>`;
  }

  VISTAS.guia = div => {
    const pdf = document.documentElement.classList.contains('modoPdf');
    div.classList.add('vGuia');
    div.innerHTML = html(pdf);
    const v = $('#gVolver', div); if (v) v.onclick = () => ir('criaturas');
    const c = $('#gCombatir', div); if (c) c.onclick = () => ir('combatir');
    $$('.gIndice a', div).forEach(a => a.onclick = e => { e.preventDefault(); const s = $('#g-' + a.dataset.g, div); if (s) div.scrollTo({ top: s.offsetTop - 70, behavior: 'smooth' }); });
  };
})();
