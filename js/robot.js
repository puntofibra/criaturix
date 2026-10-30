/* =========================================================
   CRIATURIX · dibujo de las criaturas robot (SVG por piezas)
   robotSVG(genes, {clase extra}) -> cadena SVG. Mira a la derecha.
   ========================================================= */
var ROBOT = (function () {
  'use strict';
  var n = 0;
  var TONOS = {   // 4 tonos de metal por clase (col del gen)
    plasma:   [['#ffd9cc', '#c2533a', '#5a1d14'], ['#ffe6c4', '#c9792f', '#5a3310'], ['#f4d2dc', '#b34a68', '#4c1428'], ['#e9e3dc', '#8c6f63', '#3a2a24']],
    voltio:   [['#fff6c9', '#c9a52a', '#584510'], ['#f6ffd0', '#a2b52c', '#3f4a10'], ['#fff0dc', '#d2963a', '#5c3a10'], ['#eeeeea', '#9c9a7c', '#3c3b2c']],
    bio:      [['#dcffe6', '#3aa860', '#0f4a22'], ['#ecffd4', '#7bb02f', '#2f4a10'], ['#d8fff4', '#2fa88c', '#0e4a3c'], ['#e6ece4', '#7b8f78', '#2c3a2a']],
    cromo:    [['#f3f8ff', '#8ea3b8', '#36414e'], ['#fff8ee', '#b5a58c', '#4a4030'], ['#eef0ff', '#8e92c4', '#30345a'], ['#ffffff', '#a8b0b8', '#3c4248']],
    cuantico: [['#dcfdff', '#2fb5c9', '#0c4552'], ['#e2ecff', '#4a7ce0', '#14285a'], ['#e6fff8', '#33c4a6', '#0c4a3c'], ['#f0f4ff', '#7a8cc0', '#262f52']],
    sombra:   [['#f1e2ff', '#8a4ac9', '#2e1052'], ['#ffe0f6', '#c04aa8', '#4a1040'], ['#e2e2ff', '#5a4ac9', '#1c1452'], ['#e9e4ee', '#6e5a80', '#251c30']]
  };
  function C(cls) { return CX.CLASES[cls] || CX.CLASES.cromo; }

  var CUERPO = {
    plasma: 'M68 148 C58 108 82 70 126 68 C162 66 180 96 178 126 C176 162 150 180 114 180 C88 180 72 168 68 148Z',
    voltio: 'M80 86 Q120 62 164 80 Q182 100 180 130 Q176 166 150 176 Q112 186 78 168 Q58 150 62 116 Q66 96 80 86Z',
    bio:    'M64 136 C56 96 94 64 130 70 C168 74 184 106 178 140 C172 174 140 184 110 180 C80 177 68 160 64 136Z',
    cromo:  'M84 72 H158 Q180 72 180 94 V156 Q180 178 158 178 H84 Q62 178 62 156 V94 Q62 72 84 72Z',
    cuantico: 'M98 68 H150 Q156 68 160 72 L176 90 Q180 94 180 100 V150 Q180 156 176 160 L158 176 Q154 180 148 180 H96 Q90 180 86 176 L68 158 Q64 154 64 148 V100 Q64 94 68 90 L86 72 Q90 68 98 68Z',
    sombra: 'M52 112 C66 84 96 68 132 70 C166 72 182 102 178 134 C174 168 146 182 112 180 C84 178 70 160 66 140 C64 130 58 122 52 112Z'
  };

  /* ---------- ojos (dentro del visor, centro aprox 147,108) ---------- */
  function ojos(cls, v, id) {
    var c = C(cls).col, c2 = C(cls).col2, f = 'url(#gl' + id + ')', s = '';
    var par = function (fn) { return fn(136) + fn(160); };
    switch (cls + v) {
      case 'plasma0': s = '<path d="M127 102 L145 108 L144 118 Q134 119 128 112Z M152 108 L170 102 L169 112 Q163 119 153 118Z" fill="' + c + '"/><circle cx="138" cy="112" r="3" fill="#fff"/><circle cx="160" cy="112" r="3" fill="#fff"/>'; break;
      case 'plasma1': s = par(function (x) { return '<ellipse cx="' + x + '" cy="110" rx="8" ry="10" fill="#1a0806"/><path d="M' + x + ' 116 q-6 -4 -2 -10 q1 4 3 4 q-1 -5 3 -8 q0 5 3 7 q2 5 -1 7z" fill="' + c + '"/><path d="M' + (x - 1) + ' 115 q-2 -3 0 -5 q2 3 3 5z" fill="' + c2 + '"/>'; }); break;
      case 'voltio0': s = '<path d="M124 108 L134 100 L140 110 L148 100 L156 110 L164 100 L172 108 L164 118 L156 110 L148 120 L140 110 L132 118Z" fill="' + c + '"/>'; break;
      case 'voltio1': s = par(function (x) { return '<circle cx="' + x + '" cy="110" r="10" fill="#fff"/><circle cx="' + (x + 2) + '" cy="111" r="6" fill="' + c + '"/><circle cx="' + (x + 3) + '" cy="111" r="3" fill="#111"/><path d="M' + (x - 4) + ' 104 l3 3 -2 1 3 3" stroke="#fff" stroke-width="1.6" fill="none"/>'; }); break;
      case 'bio0': s = par(function (x) { return '<circle cx="' + x + '" cy="111" r="9" fill="#fff"/><circle cx="' + (x + 2) + '" cy="112" r="5.5" fill="' + c + '"/><circle cx="' + (x + 3) + '" cy="112" r="2.6" fill="#0a1a0e"/><circle cx="' + (x + 4) + '" cy="109" r="1.6" fill="#fff"/><path d="M' + (x - 7) + ' 101 q4 -6 10 -4 q-5 1 -10 4z" fill="' + c2 + '"/>'; }); break;
      case 'bio1': s = '<rect x="124" y="104" width="48" height="12" rx="6" fill="' + c + '"/><rect x="128" y="106" width="16" height="4" rx="2" fill="' + c2 + '" opacity=".9"/>'; break;
      case 'cromo0': s = par(function (x) { return '<circle cx="' + x + '" cy="110" r="9" fill="#cfd8e2" stroke="#56606c" stroke-width="2"/><circle cx="' + x + '" cy="110" r="5" fill="' + c + '"/><path d="M' + (x - 3) + ' 110 h6 M' + x + ' 107 v6" stroke="#0b1016" stroke-width="1.6"/>'; }); break;
      case 'cromo1': s = '<rect x="124" y="102" width="48" height="16" rx="3" fill="#0b1016" stroke="' + c + '" stroke-width="1.5"/>' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return '<rect x="' + (127 + i * 5.6) + '" y="106" width="4" height="8" fill="' + (i === 2 || i === 5 ? c2 : c) + '"/>'; }).join(''); break;
      case 'cuantico0': s = par(function (x) { return '<path d="M' + x + ' 99 L' + (x + 9) + ' 110 L' + x + ' 121 L' + (x - 9) + ' 110Z" fill="' + c + '"/><path d="M' + x + ' 104 L' + (x + 4) + ' 110 L' + x + ' 116 L' + (x - 4) + ' 110Z" fill="#fff"/>'; }); break;
      case 'cuantico1': s = '<circle cx="148" cy="110" r="13" fill="#04141a" stroke="' + c + '" stroke-width="3"/><circle cx="148" cy="110" r="7" fill="' + c + '"/><circle cx="148" cy="110" r="3" fill="#fff"/><circle cx="148" cy="110" r="17" fill="none" stroke="' + c2 + '" stroke-width="1" stroke-dasharray="3 4"/>'; break;
      case 'sombra0': s = par(function (x) { return '<path d="M' + (x - 9) + ' 106 Q' + x + ' 124 ' + (x + 9) + ' 106 Q' + x + ' 114 ' + (x - 9) + ' 106Z" fill="' + c + '"/>'; }); break;
      default: s = '<path d="M124 112 Q148 98 172 108 Q150 112 124 112Z" fill="' + c + '"/><circle cx="160" cy="107" r="2.2" fill="#fff"/>';
    }
    return '<g class="rb-ojos" filter="' + f + '">' + s + '</g>';
  }

  /* ---------- antenas (parte de arriba, base ~ (118,72) y (138,70)) ---------- */
  function antenas(cls, v, id) {
    var c = C(cls).col, c2 = C(cls).col2, m = 'url(#mt' + id + ')', s = '';
    var dos = function (fn) { return '<g class="rb-ant a1">' + fn(112, 74, -1) + '</g><g class="rb-ant a2">' + fn(138, 70, 1) + '</g>'; };
    switch (cls + v) {
      case 'plasma0': s = dos(function (x, y, d) { return '<path d="M' + x + ' ' + y + ' l' + (d * 4) + ' -22" stroke="#59606a" stroke-width="4" stroke-linecap="round"/><path d="M' + (x + d * 4) + ' ' + (y - 38) + ' q10 12 4 20 q-4 5 -8 0 q-6 -8 4 -20z" fill="' + c + '"/><path d="M' + (x + d * 4) + ' ' + (y - 28) + ' q4 6 1 10 q-3 1 -4 -2 q-1 -4 3 -8z" fill="' + c2 + '"/>'; }); break;
      case 'plasma1': s = dos(function (x, y, d) { return '<path d="M' + x + ' ' + y + ' q' + (d * 10) + ' -14 ' + (d * 4) + ' -26" stroke="#2a2a2a" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="' + (x + d * 4) + '" cy="' + (y - 28) + '" r="4" fill="' + c2 + '" class="rb-chispa"/>'; }); break;
      case 'voltio0': s = dos(function (x, y, d) { var p = 'M' + x + ' ' + y; for (var i = 0; i < 5; i++) p += ' l' + (i % 2 ? -6 : 6) + ' -4'; return '<path d="' + p + '" stroke="' + m + '" stroke-width="3" fill="none" stroke-linejoin="round"/><circle cx="' + x + '" cy="' + (y - 26) + '" r="6" fill="' + c + '"/><circle cx="' + (x - 2) + '" cy="' + (y - 28) + '" r="2" fill="#fff"/>'; }); break;
      case 'voltio1': s = dos(function (x, y, d) { return '<path d="M' + x + ' ' + y + ' v-20 M' + (x - 7) + ' ' + (y - 20) + ' h14 M' + (x - 7) + ' ' + (y - 20) + ' v-8 M' + (x + 7) + ' ' + (y - 20) + ' v-8" stroke="' + m + '" stroke-width="3.5" stroke-linecap="round" fill="none"/><path class="rb-arco" d="M' + (x - 7) + ' ' + (y - 29) + ' l4 3 3 -4 4 3 3 -2" stroke="' + c + '" stroke-width="1.8" fill="none"/>'; }); break;
      case 'bio0': s = dos(function (x, y, d) { return '<path d="M' + x + ' ' + y + ' q' + (d * 2) + ' -14 ' + (d * 6) + ' -18" stroke="#3a7a3a" stroke-width="3" fill="none"/><path d="M' + (x + d * 6) + ' ' + (y - 18) + ' q' + (d * 16) + ' -4 ' + (d * 20) + ' -18 q' + (d * -16) + ' -2 ' + (d * -20) + ' 18z" fill="' + c + '"/><path d="M' + (x + d * 6) + ' ' + (y - 18) + ' l' + (d * 15) + ' -14" stroke="' + c2 + '" stroke-width="1.2"/>'; }); break;
      case 'bio1': s = dos(function (x, y, d) { return '<path d="M' + x + ' ' + y + ' v-16" stroke="' + m + '" stroke-width="4"/><circle cx="' + x + '" cy="' + (y - 22) + '" r="9" fill="' + c + '"/><circle cx="' + (x - 4) + '" cy="' + (y - 25) + '" r="3" fill="' + c2 + '"/><circle cx="' + (x + 3) + '" cy="' + (y - 19) + '" r="2" fill="' + c2 + '"/>'; }); break;
      case 'cromo0': s = dos(function (x, y, d) { return '<path d="M' + x + ' ' + y + ' v-22" stroke="' + m + '" stroke-width="5" stroke-linecap="round"/><path d="M' + (x - 7) + ' ' + (y - 28) + ' h14 l-3 7 h-8z" fill="' + m + '" stroke="#3c4550" stroke-width="1.2"/><circle cx="' + x + '" cy="' + (y - 25) + '" r="2" fill="' + c + '"/>'; }); break;
      case 'cromo1': s = '<g class="rb-ant a2"><path d="M126 72 v-14" stroke="' + m + '" stroke-width="5"/><path d="M104 54 Q126 30 150 46 Q132 58 104 54Z" fill="' + m + '" stroke="#3c4550" stroke-width="1.5"/><path d="M127 49 l10 -14" stroke="#3c4550" stroke-width="2"/><circle cx="138" cy="34" r="3.5" fill="' + c + '"/></g>'; break;
      case 'cuantico0': s = dos(function (x, y, d) { return '<path d="M' + (x - 5) + ' ' + y + ' L' + (x + d * 3) + ' ' + (y - 34) + ' L' + (x + 6) + ' ' + y + 'Z" fill="' + c + '" opacity=".9"/><path d="M' + (x - 1) + ' ' + y + ' L' + (x + d * 3) + ' ' + (y - 34) + ' L' + (x + 2) + ' ' + y + 'Z" fill="' + c2 + '"/>'; }); break;
      case 'cuantico1': s = '<g class="rb-ant a2"><path d="M126 72 v-20" stroke="' + m + '" stroke-width="4"/><circle cx="126" cy="46" r="5" fill="' + c + '"/><path class="rb-onda" d="M114 40 a14 14 0 0 1 24 0 M108 34 a22 22 0 0 1 36 0" stroke="' + c + '" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>'; break;
      case 'sombra0': s = dos(function (x, y, d) { return '<path d="M' + x + ' ' + y + ' q' + (d * -4) + ' -20 ' + (d * 12) + ' -32 q' + (d * -6) + ' 14 ' + (d * -2) + ' 32z" fill="' + c + '"/><path d="M' + (x + d * 3) + ' ' + (y - 14) + ' l' + (d * 8) + ' -4" stroke="' + c + '" stroke-width="3" stroke-linecap="round"/>'; }); break;
      default: s = dos(function (x, y, d) { return '<path class="rb-humo" d="M' + x + ' ' + y + ' c' + (d * -8) + ' -8 ' + (d * 8) + ' -14 0 -22 c' + (d * -8) + ' -8 ' + (d * 6) + ' -12 ' + (d * 2) + ' -16" stroke="' + c + '" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>'; });
    }
    return s;
  }

  /* ---------- cuerno (frente de la cabeza ~ (166,84)) ---------- */
  function cuerno(cls, v, id) {
    var c = C(cls).col, c2 = C(cls).col2, m = 'url(#mt' + id + ')', s = '';
    switch (cls + v) {
      case 'plasma0': s = '<path d="M154 80 Q168 52 186 46 Q178 64 172 86Z" fill="' + c + '"/><path d="M160 80 Q170 62 182 52 Q176 66 170 82Z" fill="' + c2 + '" opacity=".8"/>'; break;
      case 'plasma1': s = '<path d="M158 82 L188 70 L168 92Z" fill="' + c + '"/><path d="M162 82 L184 72 L168 86Z" fill="' + c2 + '"/>'; break;
      case 'voltio0': s = '<path d="M162 84 v-22" stroke="' + m + '" stroke-width="4"/><path d="M164 40 l-8 14 h6 l-4 12 l12 -16 h-6 l4 -10z" fill="' + c + '"/>'; break;
      case 'voltio1': s = '<path d="M156 86 L196 58 L164 90Z" fill="' + m + '" stroke="#3c4550" stroke-width="1.2"/><path d="M178 70 L196 58 L184 72Z" fill="' + c + '"/>'; break;
      case 'bio0': s = '<path d="M154 82 Q170 66 172 46 Q178 66 166 86Z" fill="#3c8a42"/><path d="M168 58 l8 -4 M164 70 l9 -2" stroke="' + c + '" stroke-width="3" stroke-linecap="round"/><circle cx="172" cy="46" r="3" fill="' + c2 + '"/>'; break;
      case 'bio1': s = '<ellipse cx="166" cy="72" rx="12" ry="14" fill="#a8743a"/><path d="M152 68 Q166 52 180 68 Q166 62 152 68Z" fill="' + c + '"/><path d="M166 56 v-6" stroke="#5a3a1a" stroke-width="3" stroke-linecap="round"/>'; break;
      case 'cromo0': s = '<path d="M156 88 L190 66 L164 96Z" fill="' + m + '" stroke="#3c4550" stroke-width="1.2"/><path d="M164 84 l6 -1 M171 79 l6 -1 M178 74 l5 -1" stroke="#3c4550" stroke-width="2"/><circle cx="160" cy="90" r="4" fill="' + c + '"/>'; break;
      case 'cromo1': s = '<path d="M150 76 Q172 58 186 74 Q184 92 166 94 Q176 84 170 76 Q162 72 150 76Z" fill="' + m + '" stroke="#3c4550" stroke-width="1.4"/><circle cx="174" cy="80" r="3" fill="' + c + '"/>'; break;
      case 'cuantico0': s = '<path d="M158 84 L166 56 L174 70 L182 52 L178 88Z" fill="' + c + '" opacity=".85"/><path d="M164 82 L168 64 L172 78Z" fill="#fff" opacity=".7"/>'; break;
      case 'cuantico1': s = '<path d="M158 86 L180 50 L176 90Z" fill="' + c + '"/><path d="M168 82 L180 50 L172 84Z" fill="' + c2 + '"/><circle cx="180" cy="50" r="2.5" fill="#fff"/>'; break;
      case 'sombra0': s = '<path d="M154 84 Q160 50 190 48 Q170 58 166 88Z" fill="' + c + '"/><circle cx="188" cy="49" r="2.5" fill="' + c2 + '"/>'; break;
      default: s = '<circle cx="168" cy="66" r="13" fill="' + c + '"/><circle cx="174" cy="62" r="11" fill="url(#bg' + id + ')"/><path d="M160 82 v-4" stroke="' + m + '" stroke-width="5"/>';
    }
    return '<g class="rb-cuerno" filter="url(#sg' + id + ')">' + s + '</g>';
  }

  /* ---------- boca (frente abajo ~ (168,140)) ---------- */
  function boca(cls, v, id) {
    var c = C(cls).col, c2 = C(cls).col2, s = '';
    switch (cls + v) {
      case 'plasma0': s = '<path d="M150 136 Q166 150 180 136 Q176 148 164 150 Q154 148 150 136Z" fill="#2a0a06"/><path d="M154 138 l3 5 3 -5 3 5 3 -5 3 5 3 -5" stroke="#fff" stroke-width="1.6" fill="none"/>'; break;
      case 'plasma1': s = '<ellipse cx="168" cy="142" rx="10" ry="7" fill="#2a0a06"/><ellipse cx="168" cy="144" rx="6" ry="3.5" fill="' + c + '" class="rb-brasa"/>'; break;
      case 'voltio0': s = '<rect x="152" y="136" width="26" height="10" rx="5" fill="#141006"/><path d="M155 141 l4 -3 4 5 4 -5 4 5 4 -3" stroke="' + c + '" stroke-width="2" fill="none"/>'; break;
      case 'voltio1': s = '<circle cx="168" cy="142" r="8" fill="#141006" stroke="' + c + '" stroke-width="2"/><circle cx="168" cy="142" r="4" fill="none" stroke="' + c2 + '" stroke-width="1.5"/>'; break;
      case 'bio0': s = '<path d="M154 138 Q166 152 178 138" stroke="#0a2a10" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M164 145 q2 5 5 0" fill="' + c + '"/>'; break;
      case 'bio1': s = '<path d="M156 140 q12 -8 22 2 q-10 10 -22 -2z" fill="' + c + '"/><path d="M158 140 q10 0 18 1" stroke="#0a2a10" stroke-width="1.4"/>'; break;
      case 'cromo0': s = '<path d="M150 134 H182 V148 Q166 154 150 148Z" fill="#202830" stroke="#8ea3b8" stroke-width="1.4"/><path d="M156 136 v12 M162 136 v13 M168 136 v13 M174 136 v12" stroke="#8ea3b8" stroke-width="1.6"/>'; break;
      case 'cromo1': s = '<rect x="150" y="134" width="30" height="14" rx="3" fill="#202830"/><path d="M152 141 h26" stroke="' + c + '" stroke-width="2"/><path d="M154 134 l3 4 3 -4 3 4 3 -4 3 4 3 -4 3 4 3 -4" stroke="#dfe7ef" stroke-width="1.4" fill="none"/>'; break;
      case 'cuantico0': s = '<path d="M154 138 L178 138 L166 148Z" fill="#04141a" stroke="' + c + '" stroke-width="2"/><circle cx="166" cy="141" r="2" fill="' + c2 + '"/>'; break;
      case 'cuantico1': s = '<path d="M152 142 q4 -6 8 0 t8 0 t8 0 t8 0" stroke="' + c + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>'; break;
      case 'sombra0': s = '<path d="M152 138 Q166 148 180 136" stroke="#1a0a2a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M158 140 l2 6 2 -5 M172 140 l2 6 2 -6" fill="#fff"/>'; break;
      default: s = '<path d="M152 136 Q168 154 182 134 Q176 150 166 150 Q156 150 152 136Z" fill="#14061e"/><path d="M158 140 l2 7 3 -6 M170 140 l2 7 3 -7" fill="#fff"/><path d="M164 148 q2 4 4 0" fill="' + c + '"/>';
    }
    return '<g class="rb-boca">' + s + '</g>';
  }

  /* ---------- espalda (arriba-atrás ~ (86,84)) ---------- */
  function espalda(cls, v, id) {
    var c = C(cls).col, c2 = C(cls).col2, m = 'url(#mt' + id + ')', s = '';
    switch (cls + v) {
      case 'plasma0': s = '<rect x="58" y="82" width="22" height="44" rx="9" fill="' + m + '" stroke="#3c4550" stroke-width="1.4" transform="rotate(-18 69 104)"/><circle cx="62" cy="96" r="6" fill="' + c + '" class="rb-brasa"/><path class="rb-fuego2" d="M56 122 q6 18 -2 26 q12 -6 10 -24z" fill="' + c2 + '"/>'; break;
      case 'plasma1': s = '<path d="M64 120 Q48 80 92 66 Q84 92 96 112Z" fill="' + c + '" opacity=".95"/><path d="M70 114 Q60 88 88 74 Q84 94 92 108Z" fill="' + c2 + '" opacity=".75"/>'; break;
      case 'voltio0': s = '<rect x="64" y="70" width="26" height="36" rx="5" fill="' + m + '" stroke="#3c4550" stroke-width="1.4"/><rect x="70" y="64" width="14" height="6" rx="2" fill="#3c4550"/><rect x="69" y="78" width="16" height="22" rx="2" fill="#141006"/><rect class="rb-carga" x="71" y="80" width="12" height="18" fill="' + c + '"/>'; break;
      case 'voltio1': s = '<g class="rb-alas"><path d="M88 82 Q48 54 30 70 Q52 74 62 92Z" fill="' + m + '" stroke="#3c4550" stroke-width="1.2"/><path d="M78 84 Q50 66 38 74" stroke="' + c + '" stroke-width="2.4" fill="none"/></g>'; break;
      case 'bio0': s = '<path d="M74 84 L44 60 L104 50Z" fill="#17324a" stroke="' + m + '" stroke-width="3" stroke-linejoin="round"/><path d="M60 62 L84 80 M74 55 L88 74 M54 66 L98 54" stroke="' + c + '" stroke-width="1.4" opacity=".9"/><path d="M80 84 v8" stroke="' + m + '" stroke-width="5"/>'; break;
      case 'bio1': s = '<path d="M62 118 Q52 72 100 66 Q120 66 118 78 Q90 76 80 118Z" fill="#4a7a3a"/><circle cx="76" cy="84" r="6" fill="' + c + '"/><circle cx="94" cy="74" r="5" fill="' + c2 + '"/><circle cx="68" cy="102" r="4" fill="' + c + '"/>'; break;
      case 'cromo0': s = '<path d="M60 122 Q50 74 104 64 Q120 64 122 74 Q86 80 78 124Z" fill="' + m + '" stroke="#3c4550" stroke-width="1.6"/><circle cx="72" cy="94" r="2.5" fill="#3c4550"/><circle cx="90" cy="76" r="2.5" fill="#3c4550"/><path d="M66 112 Q64 88 96 74" stroke="' + c + '" stroke-width="1.6" fill="none"/>'; break;
      case 'cromo1': s = '<g><rect x="62" y="64" width="42" height="9" rx="4" fill="' + m + '" stroke="#3c4550" stroke-width="1.2" transform="rotate(-14 83 68)"/><rect x="62" y="78" width="42" height="9" rx="4" fill="' + m + '" stroke="#3c4550" stroke-width="1.2" transform="rotate(-14 83 82)"/><circle cx="104" cy="62" r="3" fill="' + c + '"/><circle cx="104" cy="76" r="3" fill="' + c + '"/><rect x="72" y="84" width="16" height="12" rx="3" fill="#3c4550"/></g>'; break;
      case 'cuantico0': s = '<circle cx="80" cy="78" r="17" fill="#04141a" stroke="' + m + '" stroke-width="4"/><circle cx="80" cy="78" r="9" fill="' + c + '" class="rb-nucleo"/><circle cx="80" cy="78" r="13" fill="none" stroke="' + c2 + '" stroke-width="1" stroke-dasharray="2 3"/>'; break;
      case 'cuantico1': s = '<path d="M60 112 Q44 80 74 60" stroke="' + c + '" stroke-width="3" fill="none" class="rb-onda"/><path d="M70 110 Q58 84 82 66" stroke="' + c2 + '" stroke-width="2" fill="none" class="rb-onda"/><circle cx="76" cy="92" r="7" fill="' + m + '" stroke="#3c4550"/>'; break;
      case 'sombra0': s = '<path d="M66 126 Q30 96 58 58 Q74 84 104 70 Q92 100 66 126Z" fill="' + c + '" opacity=".85"/><path d="M66 118 Q44 96 60 70" stroke="' + c2 + '" stroke-width="1.6" fill="none"/>'; break;
      default: s = '<path d="M76 90 L60 64 L70 62 L84 84Z M92 80 L86 52 L96 52 L100 78Z" fill="' + c + '"/><path d="M66 100 q-12 -4 -16 -14" stroke="' + c2 + '" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="88" cy="86" r="6" fill="' + m + '"/>';
    }
    return '<g class="rb-espalda" filter="url(#sg' + id + ')">' + s + '</g>';
  }

  /* ---------- cola (detrás ~ (62,146)) ---------- */
  function cola(cls, v, id) {
    var c = C(cls).col, c2 = C(cls).col2, m = 'url(#mt' + id + ')', s = '';
    switch (cls + v) {
      case 'plasma0': s = '<path d="M70 150 Q40 150 30 124" stroke="' + m + '" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M30 124 q-10 -12 4 -24 q-2 10 6 12 q-4 -10 8 -16 q-4 12 2 22 q-8 10 -20 6z" fill="' + c + '"/>'; break;
      case 'plasma1': s = '<path d="M70 152 Q44 160 34 140 Q28 128 18 132" stroke="#2a2a2a" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M18 132 l-6 -6 2 8 -8 0 8 4z" fill="' + c + '" class="rb-chispa"/>'; break;
      case 'voltio0': s = '<path d="M70 150 Q48 152 40 136" stroke="' + m + '" stroke-width="5" fill="none"/><path d="M40 136 l-4 -6 h8 l-4 -8" stroke="' + c + '" stroke-width="3" fill="none" stroke-linejoin="round"/><circle cx="40" cy="120" r="4" fill="' + c2 + '"/>'; break;
      case 'voltio1': s = '<path d="M70 148 L50 150 L56 138 L34 140 L42 128 L20 126" stroke="' + c + '" stroke-width="5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>'; break;
      case 'bio0': s = '<path d="M70 152 Q40 166 30 146 Q26 136 36 132" stroke="#4a6a2a" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M42 156 q-6 8 -14 6 q4 -8 14 -6z M52 160 q0 10 -8 12 q0 -8 8 -12z" fill="' + c + '"/>'; break;
      case 'bio1': s = '<path d="M70 150 C44 150 50 124 30 128 C18 130 20 146 32 144" stroke="' + c + '" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M46 140 q-8 -6 -4 -12 q6 4 4 12z" fill="' + c2 + '"/>'; break;
      case 'cromo0': s = '<path d="M70 150 q-6 -8 -12 0 q-6 8 -12 0 q-6 -8 -12 0" stroke="' + m + '" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="30" cy="150" r="7" fill="' + m + '" stroke="#3c4550" stroke-width="1.4"/><circle cx="30" cy="150" r="2.5" fill="' + c + '"/>'; break;
      case 'cromo1': s = '<path d="M70 150 L40 146" stroke="' + m + '" stroke-width="6" stroke-linecap="round"/><circle cx="30" cy="144" r="12" fill="' + m + '" stroke="#3c4550" stroke-width="1.6"/><path d="M30 128 v-4 M30 160 v4 M14 144 h-4 M46 144 h4 M19 133 l-3 -3 M41 155 l3 3 M19 155 l-3 3 M41 133 l3 -3" stroke="#56606c" stroke-width="4" stroke-linecap="round"/>'; break;
      case 'cuantico0': s = '<path d="M70 150 C40 170 20 140 40 130 C56 122 60 150 40 150" stroke="' + c + '" stroke-width="4.5" fill="none" stroke-linecap="round"/>'; break;
      case 'cuantico1': s = '<path d="M70 150 L44 150" stroke="' + m + '" stroke-width="5"/><g class="rb-helice"><path d="M38 150 l-2 -18 q4 -2 6 0z M38 150 l2 18 q-4 2 -6 0z" fill="' + c + '"/></g><circle cx="38" cy="150" r="4" fill="' + c2 + '"/>'; break;
      case 'sombra0': s = '<path d="M70 150 Q50 160 40 144 Q32 128 44 118" stroke="' + m + '" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M44 118 L36 100 L54 112Z" fill="' + c + '"/>'; break;
      default: s = '<path d="M72 150 Q40 168 24 140 Q40 152 52 142 Q36 140 30 124 Q50 138 72 140Z" fill="' + c + '" opacity=".85"/>';
    }
    return '<g class="rb-cola">' + s + '</g>';
  }

  /* =========== MONTAJE CON LAS PIEZAS DIBUJADAS (img/piezas/*.webp) =========== */
  var RAT = {"antena_bio_1":1.863,"antena_bio_2":1.492,"antena_cromo_1":2.243,"antena_cromo_2":1.657,"antena_cuantico_1":1.845,"antena_cuantico_2":2.215,"antena_plasma_1":1.855,"antena_plasma_2":1.662,"antena_sombra_1":2.67,"antena_sombra_2":1.612,"antena_voltio_1":2.8,"boca_bio_1":0.658,"boca_bio_2":0.565,"boca_cromo_1":0.563,"boca_cromo_2":0.563,"boca_cuantico_1":0.642,"boca_cuantico_2":0.71,"boca_plasma_1":0.822,"boca_plasma_2":0.85,"boca_sombra_1":0.515,"boca_sombra_2":0.515,"boca_voltio_1":0.462,"boca_voltio_2":0.487,"cola_bio_1":0.423,"cola_bio_2":0.703,"cola_cromo_1":0.661,"cola_cromo_2":0.691,"cola_cuantico_1":0.473,"cola_cuantico_2":0.417,"cola_plasma_1":0.487,"cola_plasma_2":0.744,"cola_sombra_1":0.801,"cola_sombra_2":0.633,"cola_voltio_1":0.47,"cola_voltio_2":0.473,"cuerno_bio_1":1.015,"cuerno_bio_2":1.532,"cuerno_cromo_1":0.977,"cuerno_cromo_2":1.112,"cuerno_cuantico_1":1.955,"cuerno_cuantico_2":1.1,"cuerno_plasma_1":1.103,"cuerno_plasma_2":1.02,"cuerno_sombra_1":1.153,"cuerno_sombra_2":1.617,"cuerno_voltio_1":2.68,"cuerno_voltio_2":1.022,"cuerpo_bio":0.881,"cuerpo_cromo":0.902,"cuerpo_cuantico":0.87,"cuerpo_plasma":0.86,"cuerpo_sombra":0.878,"cuerpo_voltio":0.839,"espalda_bio_1":2.141,"espalda_bio_2":0.851,"espalda_cromo_1":1.926,"espalda_cromo_2":0.603,"espalda_cuantico_1":2.014,"espalda_cuantico_2":1.114,"espalda_plasma_1":0.63,"espalda_plasma_2":1.759,"espalda_sombra_1":1.241,"espalda_sombra_2":1.39,"espalda_voltio_1":1.014,"espalda_voltio_2":1.067,"ojos_bio_1":0.967,"ojos_bio_2":1.02,"ojos_cromo_1":0.917,"ojos_cromo_2":0.987,"ojos_cuantico_1":0.833,"ojos_cuantico_2":0.997,"ojos_plasma_1":0.927,"ojos_plasma_2":1.007,"ojos_sombra_1":0.873,"ojos_sombra_2":0.993,"ojos_voltio_1":0.98,"ojos_voltio_2":0.997};
  var ANC = {   // anclajes de cada cuerpo (fracciones de la imagen): t=arriba en x .3/.55/.78, L=borde trasero
    plasma:   { t30: .110, t55: .091, t78: .148, L: .100, ox: .84, oy: .42, bx: .82, by: .64 },
    voltio:   { t30: .085, t55: .065, t78: .133, L: .048, ox: .86, oy: .36, bx: .87, by: .66 },
    bio:      { t30: .068, t55: .103, t78: .145, L: .068, ox: .85, oy: .4, bx: .81, by: .61 },
    cromo:    { t30: .041, t55: .036, t78: .092, L: .004, ox: .85, oy: .38, bx: .80, by: .60 },
    cuantico: { t30: .034, t55: .019, t78: .073, L: .052, ox: .84, oy: .33, bx: .80, by: .60 },
    sombra:   { t30: .044, t55: .010, t78: .065, L: .015, ox: .83, oy: .33, bx: .79, by: .57 }
  };
  var TINTE = ['', 'hue-rotate(16deg) saturate(1.1)', 'hue-rotate(-16deg)', 'saturate(.65) brightness(1.08)'];
  var BASE = 'img/piezas/';
  function nom(slot, g) {
    var k = (slot === 'antenas' ? 'antena' : slot) + '_' + g.c + '_' + (g.v + 1);
    if (!RAT[k]) k = (slot === 'antenas' ? 'antena' : slot) + '_' + g.c + '_1';   // pieza aún sin dibujar
    return RAT[k] ? k : null;
  }
  // coloca una imagen dentro de una caja (bw x bh) manteniendo proporción; ax/ay = punto de anclaje (0-1) que va en (x,y)
  function img(k, x, y, bw, bh, ax, ay, extra) {
    if (!k) return '';
    var r = RAT[k], w = bw, h = bw * r;
    if (h > bh) { h = bh; w = bh / r; }
    return '<image href="' + BASE + k + '.webp?v=10" x="' + (x - w * ax).toFixed(1) + '" y="' + (y - h * ay).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '"' + (extra || '') + '/>';
  }
  function svg(genes, opts) {
    opts = opts || {};
    if (!genes || !genes.p) return '';
    var cls = genes.c, K = C(cls), A = ANC[cls] || ANC.cromo;
    var pp = {}; CX.SLOTS.forEach(function (s) { pp[s] = CX.parteGen(genes.p[s][0]); });
    var kc = 'cuerpo_' + (RAT['cuerpo_' + cls] ? cls : 'cromo'), r = RAT[kc];
    var BW = 160, BH = BW * r, X0 = 52, Y0 = 198 - BH;          // caja del cuerpo
    var P = function (fx, fy) { return [X0 + fx * BW, Y0 + fy * BH]; };
    var tinte = TINTE[genes.col || 0];
    var e = P(.30, A.t30 + .16), an = P(.52, A.t55 + .10), cu = P(.80, A.t78 + .10), co = P(A.L + .07, .56),
        oj = P(A.ox, A.oy), bo = P(A.ox + .08, A.oy + .18);
    var out = '<svg class="rb ' + (opts.cls || '') + '" viewBox="0 0 240 220" overflow="visible" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse class="rb-sombra" cx="124" cy="200" rx="68" ry="7" fill="' + K.col + '" opacity=".25"/>' +
      '<g class="rb-cuerpo">' +
      '<g class="rb-cola">' + img(nom('cola', pp.cola), co[0], co[1], 68, 56, 1, .5) + '</g>' +
      '<g class="rb-espalda">' + img(nom('espalda', pp.espalda), e[0], e[1], 86, 96, .5, 1) + '</g>' +
      '<g class="rb-ant">' + img(nom('antenas', pp.antenas), an[0], an[1], 56, 76, .5, 1) + '</g>' +
      '<g class="rb-cuerno">' + img(nom('cuerno', pp.cuerno), cu[0], cu[1], 44, 58, .5, 1) + '</g>' +
      img(kc, X0, Y0, BW, 999, 0, 0, tinte ? ' style="filter:' + tinte + '"' : '') +
      '<g class="rb-ojos">' + img(nom('ojos', pp.ojos), oj[0], oj[1], 26, 26, .5, .5) + '</g>' +
      '<g class="rb-boca">' + img(nom('boca', pp.boca), bo[0], bo[1], 45, 40, .5, .5) + '</g>' +
      '</g></svg>';
    return out;
  }
  /* huevo con su clase (o '?' si no se conoce) */
  function huevo(clase, opts) {
    opts = opts || {};
    var id = 'h' + (++n), K = clase && CX.CLASES[clase] ? CX.CLASES[clase] : { col: '#19ff6a', col2: '#00e5ff' };
    return '<svg class="rb huevo ' + (opts.cls || '') + '" viewBox="0 0 240 220" xmlns="http://www.w3.org/2000/svg"><defs>' +
      '<radialGradient id="hg' + id + '" cx=".38" cy=".3" r=".9"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#b9c4d2"/><stop offset="1" stop-color="#4a5666"/></radialGradient>' +
      '<filter id="hf' + id + '" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
      '<ellipse cx="120" cy="206" rx="46" ry="7" fill="' + K.col + '" opacity=".25"/>' +
      '<g class="hv-cuerpo"><path d="M120 34 C160 34 184 104 182 140 C180 180 154 200 120 200 C86 200 60 180 58 140 C56 104 80 34 120 34Z" fill="url(#hg' + id + ')" stroke="#1a2230" stroke-width="3"/>' +
      '<path d="M64 120 L88 112 L104 128 L124 108 L142 126 L160 110 L178 120" stroke="' + K.col + '" stroke-width="4" fill="none" stroke-linejoin="round" filter="url(#hf' + id + ')"/>' +
      '<path d="M66 150 Q120 168 174 150" stroke="' + K.col2 + '" stroke-width="2" fill="none" opacity=".7"/>' +
      '<circle class="hv-luz" cx="120" cy="150" r="10" fill="' + K.col + '" filter="url(#hf' + id + ')"/>' +
      '<ellipse cx="100" cy="72" rx="12" ry="22" fill="#fff" opacity=".45" transform="rotate(18 100 72)"/></g></svg>';
  }
  return { svg: svg, huevo: huevo };
})();
