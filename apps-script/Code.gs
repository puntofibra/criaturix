/* ==========================================================
   CRIATURIX · Futurmovil — API
   Hoja: "criaturix"   ·   Archivos del proyecto: Code, Datos, Motor
   ========================================================== */
const SHEET_ID = '16JWu2kQJLx7xOEQk9zoHwVTrzW5G9dUR_eRlxf4OdiY';
const TZ = 'Europe/Madrid';
const ADMIN_EMAIL = 'futurmovil.com@gmail.com';
const GOOGLE_CLIENT_ID = '454055120059-nuhaop4r62urc3u036cc3grpqo71ulg7.apps.googleusercontent.com';
const MYPOS = 'https://mypos.com/@futurmovil/';
const WEB = 'https://puntofibra.github.io/criaturix/';

const CAB_U = ['Id', 'Usuario', 'Email', 'Hash', 'Sal', 'Creado', 'UltimoAcceso', 'Google', 'Token', 'TokenExpira', 'CodigoRec', 'CodigoExpira',
  'Chips', 'Creditos', 'Elo', 'Victorias', 'Derrotas', 'Equipo', 'Etapa', 'EnergiaFecha', 'EnergiaUsada'];
const CAB_C = ['Id', 'Num', 'Nombre', 'Dueno', 'DuenoNombre', 'Tipo', 'Genes', 'Clase', 'PadreA', 'PadreB', 'Crias', 'Creada', 'Eclosion', 'Estado', 'Precio', 'Inicial', 'Origen'];
const CAB_P = ['Id', 'Fecha', 'IdComprador', 'Comprador', 'IdVendedor', 'Vendedor', 'IdCriatura', 'Tipo', 'Importe', 'Estado', 'Resuelto', 'Nota'];
const CAB_M = ['Fecha', 'IdUsuario', 'Usuario', 'Concepto', 'Creditos', 'Chips', 'Ref'];
const CAB_B = ['Fecha', 'IdUsuario', 'Usuario', 'Modo', 'Rival', 'Resultado', 'Rondas', 'Chips', 'Elo'];
const U = {}; CAB_U.forEach((k, i) => U[k] = i);
const C = {}; CAB_C.forEach((k, i) => C[k] = i);
const P = {}; CAB_P.forEach((k, i) => P[k] = i);
const TIENDA = 'TIENDA';

/* ---------------- entrada ---------------- */
function doGet(e) { const p = (e && e.parameter) || {}; return responder_(manejar_(p), p.cb); }
function doPost(e) { let p = {}; try { p = JSON.parse(e.postData.contents || '{}'); } catch (err) {} return responder_(manejar_(p)); }
function responder_(out, cb) {
  const json = JSON.stringify(out);
  if (cb && /^[\w$.]+$/.test(cb)) return ContentService.createTextOutput(cb + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
function manejar_(p) {
  try {
    const f = ACCIONES[p.accion];
    if (!f) return { ok: true, juego: 'CRIATURIX', google: !!GOOGLE_CLIENT_ID };
    return f(p);
  } catch (err) { return { ok: false, error: String(err && err.message || err) }; }
}
const ACCIONES = {
  disponible: p => ({ ok: true, disponible: usuarioLibre_(p.usuario) }),
  registrar: p => registrar_(p), entrar: p => entrar_(p), google: p => google_(p), salir: p => salir_(p),
  recuperar: p => recuperar_(p), restablecer: p => restablecer_(p),
  yo: p => yo_(p), renombrar: p => renombrar_(p), equipo: p => equipo_(p),
  criar: p => criar_(p), eclosionar: p => eclosionar_(p),
  mercado: p => mercado_(p), vender: p => vender_(p), retirar: p => retirar_(p), comprar: p => comprar_(p),
  recargar: p => recargar_(p), cancelar: p => cancelarPedido_(p), pedidos: p => misPedidos_(p), movimientos: p => movimientos_(p),
  ranking: p => ranking_(p),
  combate: p => combateInicio_(p), turno: p => combateTurno_(p), rendirse: p => combateRendirse_(p), encurso: p => combateEnCurso_(p),
  buscar: p => buscarRival_(p), nobuscar: p => noBuscar_(p), esperar: p => esperar_(p),
  admin_entrar: p => adminEntrar_(p), qr_nuevo: p => qrNuevo_(), qr_estado: p => qrEstado_(p),   // sin Google Authenticator: solo llave NFC (o QR + llave)
  admin: p => admin_(p)
};

/* Ejecutar una vez a mano: crea las hojas y pide los permisos */
function preparar() {
  hojaU_(); hojaC_(); hoja_('Pedidos', CAB_P); hoja_('Movimientos', CAB_M); hoja_('Combates', CAB_B); hojaConfig_();
  MailApp.getRemainingDailyQuota();
  UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=x', { muteHttpExceptions: true });
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('totp')) props.setProperty('totp', base32Nuevo_());
  Logger.log('Google Authenticator: ' + otpauth_());
  return 'Hojas listas';
}

/* ---------------- hojas ---------------- */
let SS_ = null;
function ss_() { return SS_ || (SS_ = SpreadsheetApp.openById(SHEET_ID)); }
function hoja_(nombre, cab) {
  const ss = ss_(); let sh = ss.getSheetByName(nombre);
  if (!sh) {
    sh = ss.insertSheet(nombre);
    sh.getRange(1, 1, 1, cab.length).setValues([cab]).setFontWeight('bold').setBackground('#0b1222').setFontColor('#19ff6a');
    sh.setFrozenRows(1);
    const h1 = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
    if (h1 && h1.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(h1);
  }
  return sh;
}
function hojaU_() { const sh = hoja_('Usuarios', CAB_U); sh.getRange('C:C').setNumberFormat('@'); sh.getRange('I:L').setNumberFormat('@'); sh.getRange('R:R').setNumberFormat('@'); return sh; }
function hojaC_() { const sh = hoja_('Criaturas', CAB_C); sh.getRange('A:A').setNumberFormat('@'); sh.getRange('G:G').setNumberFormat('@'); return sh; }
function tabla_(sh, n) { const k = sh.getLastRow() - 1; return k > 0 ? sh.getRange(2, 1, k, n).getValues() : []; }
function guarda_(sh, i, row) { sh.getRange(i + 2, 1, 1, row.length).setValues([row]); }

/* ---------------- ajustes ---------------- */
const AJUSTES = [
  ['horasEclosion', 24, 'Horas que tarda un huevo en eclosionar'],
  ['maxCrias', 7, 'Máximo de crías por criatura'],
  ['costeCria', '100,150,250,400,600,900,1300', 'Chips que cuesta criar según las crías que ya tiene cada padre'],
  ['costeCriaCreditos', 0, 'Créditos (céntimos) que cuesta criar, además de los chips (0 = gratis)'],
  ['comision', 50, '% del precio que recibe el vendedor en créditos'],
  ['energiaDia', 20, 'Combates con premio al día'],
  ['chipsInicio', 200, 'Chips de regalo al crear la cuenta'],
  ['pvpGana', 18, 'Chips por victoria en la arena'],
  ['precioMin', 1, 'Precio mínimo de venta en euros'],
  ['arenaEspera', 5, 'Segundos que la arena espera a un jugador real antes de jugar contra un bot'],
  ['arenaRepetir', 2, 'Partidas que tienen que pasar antes de volver a enfrentarse al mismo jugador real'],
  ['turnoSeg', 40, 'Segundos para elegir cartas en los combates entre dos jugadores'],
  ['aviso', '', 'Aviso que ven los jugadores en el inicio (vacío = nada)']
];
function hojaConfig_() {
  const sh = hoja_('Config', ['Clave', 'Valor', 'Ayuda']);
  const rows = tabla_(sh, 3), hay = {}; rows.forEach(r => hay[r[0]] = 1);
  AJUSTES.forEach(a => { if (!hay[a[0]]) sh.appendRow(a); });
  return sh;
}
function cfg_() {
  const c = CacheService.getScriptCache(), v = c.get('cfg'); if (v) return JSON.parse(v);
  const o = {}; AJUSTES.forEach(a => o[a[0]] = a[1]);
  tabla_(hojaConfig_(), 2).forEach(r => { if (r[0]) o[r[0]] = r[1]; });
  ['horasEclosion', 'maxCrias', 'costeCriaCreditos', 'comision', 'energiaDia', 'chipsInicio', 'pvpGana', 'precioMin', 'arenaEspera', 'arenaRepetir', 'turnoSeg'].forEach(k => o[k] = Number(o[k]) || 0);
  o.costeCria = String(o.costeCria).split(/[,;\s]+/).map(Number).filter(n => n >= 0);
  c.put('cfg', JSON.stringify(o), 300);
  return o;
}

/* ---------------- utilidades ---------------- */
function sha_(s) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8).map(b => ('0' + (b & 255).toString(16)).slice(-2)).join(''); }
function hashPass_(pass, sal) { let h = sal + '|' + pass; for (let i = 0; i < 300; i++) h = sha_(h + '|' + sal); return h; }
function limpiaEmail_(e) { return String(e || '').trim().toLowerCase(); }
function emailValido_(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 120; }
function usuarioValido_(u) { return /^[A-Za-z0-9ÑñÁÉÍÓÚáéíóúÜü_.\-]{3,16}$/.test(u); }
function passValida_(p) { return typeof p === 'string' && p.length >= 6 && p.length <= 100; }
function nuevoId_(pre) { const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + Date.now()); let s = pre; for (let i = 0; i < 9; i++) s += abc[(b[i] & 255) % abc.length]; return s; }
function freno_(clave, max, seg) { const c = CacheService.getScriptCache(), n = Number(c.get(clave) || 0); if (n >= max) throw new Error('Demasiados intentos. Espera unos minutos.'); c.put(clave, String(n + 1), seg); }
let LOCK_DENTRO_ = false;   // el bloqueo se puede anidar dentro de la misma ejecución
function conLock_(fn) { if (LOCK_DENTRO_) return fn(); const lock = LockService.getScriptLock(); lock.waitLock(20000); LOCK_DENTRO_ = true; try { return fn(); } finally { LOCK_DENTRO_ = false; lock.releaseLock(); } }
function urlPago_(cent) { cent = Math.round(Number(cent) || 0); return MYPOS + (cent % 100 ? euros_(cent) : String(cent / 100)); }   // myPOS: /5 = 5 €, /7,50 = 7,50 €
function euros_(cent) { return (cent / 100).toFixed(2).replace('.', ','); }
function hoy_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }
function num_(v) { return Number(v) || 0; }

/* ---------------- cuentas ---------------- */
function usuarios_() { const sh = hojaU_(); return { sh, rows: tabla_(sh, CAB_U.length) }; }
function buscar_(rows, col, valor) { valor = String(valor || '').toLowerCase(); if (!valor) return -1; for (let i = 0; i < rows.length; i++) if (String(rows[i][col]).toLowerCase() === valor) return i; return -1; }
function usuarioLibre_(u) { u = String(u || '').trim(); if (!usuarioValido_(u)) return false; return buscar_(usuarios_().rows, U.Usuario, u) < 0 && u.toLowerCase() !== 'tienda'; }
function nuevaSesion_(sh, i, row) {
  if (!(String(row[U.Token]).length >= 30 && num_(row[U.TokenExpira]) > Date.now())) row[U.Token] = Utilities.getUuid() + Utilities.getUuid().slice(0, 8);   // misma sesión en móvil y PC
  row[U.TokenExpira] = String(Date.now() + 1000 * 60 * 60 * 24 * 90);
  row[U.UltimoAcceso] = new Date();
  guarda_(sh, i, row);
  return { ok: true, token: row[U.Token], perfil: perfil_(row) };
}
function perfil_(row) {
  const cf = cfg_(), energia = row[U.EnergiaFecha] === hoy_() ? Math.max(0, cf.energiaDia - num_(row[U.EnergiaUsada])) : cf.energiaDia;
  let eq = []; try { eq = JSON.parse(row[U.Equipo] || '[]'); } catch (e) {}
  return { id: row[U.Id], usuario: row[U.Usuario], email: row[U.Email], chips: num_(row[U.Chips]), creditos: num_(row[U.Creditos]), elo: num_(row[U.Elo]) || 1000,
    victorias: num_(row[U.Victorias]), derrotas: num_(row[U.Derrotas]), equipo: eq, etapa: num_(row[U.Etapa]), energia, energiaMax: cf.energiaDia,
    admin: limpiaEmail_(row[U.Email]) === ADMIN_EMAIL, google: !!row[U.Google] };
}
function sesion_(token) {
  token = String(token || ''); if (token.length < 30) throw new Error('SESION');
  const f = usuarios_(), i = buscar_(f.rows, U.Token, token);
  if (i < 0 || num_(f.rows[i][U.TokenExpira]) < Date.now()) throw new Error('SESION');
  return { sh: f.sh, i, row: f.rows[i], rows: f.rows };
}
function filaNueva_(usuario, email) {
  const row = new Array(CAB_U.length).fill('');
  row[U.Id] = 'u' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  row[U.Usuario] = usuario; row[U.Email] = email; row[U.Creado] = new Date();
  row[U.Chips] = cfg_().chipsInicio; row[U.Creditos] = 0; row[U.Elo] = 1000; row[U.Victorias] = 0; row[U.Derrotas] = 0; row[U.Etapa] = 0;
  return row;
}
function darIniciales_(row) {
  const pool = CX.LISTA_CLASES.slice().sort(() => Math.random() - 0.5).slice(0, 3);
  const ids = pool.map((cl, i) => crearCriatura_({ dueno: row[U.Id], duenoNombre: row[U.Usuario], genes: CX.genesAzar(Math.floor(Math.random() * 1e9), cl, 0.7), inicial: true, origen: 'Inicial' }).id);
  row[U.Equipo] = JSON.stringify(ids);
}
function registrar_(p) {
  const email = limpiaEmail_(p.email), usuario = String(p.usuario || '').trim(), pass = p.pass;
  if (!emailValido_(email)) throw new Error('El correo no es válido');
  if (!usuarioValido_(usuario)) throw new Error('El nombre de usuario debe tener de 3 a 16 letras, números, punto, guion o guion bajo');
  if (!passValida_(pass)) throw new Error('La contraseña debe tener al menos 6 caracteres');
  return conLock_(() => {
    const f = usuarios_();
    if (buscar_(f.rows, U.Email, email) >= 0) throw new Error('Ya existe una cuenta con ese correo');
    if (buscar_(f.rows, U.Usuario, usuario) >= 0 || usuario.toLowerCase() === 'tienda') throw new Error('Ese nombre de usuario ya está cogido');
    const row = filaNueva_(usuario, email), sal = Utilities.getUuid();
    row[U.Sal] = sal; row[U.Hash] = hashPass_(pass, sal);
    darIniciales_(row);
    f.sh.appendRow(row);
    return nuevaSesion_(f.sh, f.rows.length, row);
  });
}
function entrar_(p) {
  const id = String(p.id || '').trim();
  freno_('login_' + id.toLowerCase(), 8, 900);
  const f = usuarios_();
  let i = buscar_(f.rows, U.Email, limpiaEmail_(id)); if (i < 0) i = buscar_(f.rows, U.Usuario, id);
  if (i < 0 || !f.rows[i][U.Hash] || hashPass_(String(p.pass || ''), f.rows[i][U.Sal]) !== f.rows[i][U.Hash]) throw new Error('Correo o contraseña incorrectos');
  return nuevaSesion_(f.sh, i, f.rows[i]);
}
function google_(p) {
  const r = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(p.credential || ''), { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error('No se pudo verificar tu cuenta de Google');
  const info = JSON.parse(r.getContentText());
  if (info.aud !== GOOGLE_CLIENT_ID || String(info.email_verified) !== 'true') throw new Error('Cuenta de Google no válida');
  const email = limpiaEmail_(info.email);
  return conLock_(() => {
    const f = usuarios_(), i = buscar_(f.rows, U.Email, email);
    if (i >= 0) { f.rows[i][U.Google] = info.sub; return nuevaSesion_(f.sh, i, f.rows[i]); }
    const usuario = String(p.usuario || '').trim();
    if (!usuario) return { ok: true, necesitaUsuario: true, email, sugerido: (info.given_name || email.split('@')[0]).replace(/[^A-Za-z0-9_.\-]/g, '').slice(0, 16) };
    if (!usuarioValido_(usuario)) throw new Error('El nombre de usuario debe tener de 3 a 16 letras, números, punto, guion o guion bajo');
    if (buscar_(f.rows, U.Usuario, usuario) >= 0 || usuario.toLowerCase() === 'tienda') throw new Error('Ese nombre de usuario ya está cogido');
    const row = filaNueva_(usuario, email); row[U.Google] = info.sub;
    darIniciales_(row);
    f.sh.appendRow(row);
    return nuevaSesion_(f.sh, f.rows.length, row);
  });
}
function salir_(p) { try { CacheService.getScriptCache().remove('tk_' + String(p.token || '').slice(0, 60)); const s = sesion_(p.token); s.row[U.Token] = ''; s.row[U.TokenExpira] = ''; guarda_(s.sh, s.i, s.row); } catch (e) {} return { ok: true }; }
function recuperar_(p) {
  const email = limpiaEmail_(p.email);
  freno_('rec_' + email, 4, 1800);
  const f = usuarios_(), i = buscar_(f.rows, U.Email, email);
  if (i >= 0) {
    const code = String(Math.floor(100000 + Math.random() * 900000)), row = f.rows[i];
    row[U.CodigoRec] = sha_(code + '|' + row[U.Id]); row[U.CodigoExpira] = String(Date.now() + 15 * 60 * 1000);
    guarda_(f.sh, i, row);
    MailApp.sendEmail({ to: email, name: 'CRIATURIX · Futurmovil', subject: 'Tu código para recuperar la contraseña: ' + code,
      htmlBody: mail_('Hola <b>' + row[U.Usuario] + '</b>, tu código para crear una contraseña nueva es:<p style="font-size:34px;letter-spacing:8px;font-weight:bold;color:#00e5ff;margin:14px 0">' + code + '</p><p style="color:#9cd">Caduca en 15 minutos. Si no lo has pedido tú, ignora este correo.</p>') });
  }
  return { ok: true };
}
function mail_(html) { return '<div style="font-family:Arial,sans-serif;background:#05060f;color:#e9fff1;padding:24px;border-radius:14px;max-width:480px"><h2 style="color:#19ff6a;margin:0 0 10px">CRIATURIX</h2>' + html + '</div>'; }
function restablecer_(p) {
  const email = limpiaEmail_(p.email), code = String(p.codigo || '').trim();
  freno_('res_' + email, 6, 1800);
  if (!passValida_(p.pass)) throw new Error('La contraseña debe tener al menos 6 caracteres');
  const f = usuarios_(), i = buscar_(f.rows, U.Email, email);
  if (i < 0) throw new Error('Código incorrecto o caducado');
  const row = f.rows[i];
  if (!row[U.CodigoRec] || num_(row[U.CodigoExpira]) < Date.now() || sha_(code + '|' + row[U.Id]) !== row[U.CodigoRec]) throw new Error('Código incorrecto o caducado');
  const sal = Utilities.getUuid(); row[U.Sal] = sal; row[U.Hash] = hashPass_(p.pass, sal); row[U.CodigoRec] = ''; row[U.CodigoExpira] = '';
  return nuevaSesion_(f.sh, i, row);
}

/* ---------------- criaturas ---------------- */
function criaturas_() { const sh = hojaC_(); return { sh, rows: tabla_(sh, CAB_C.length) }; }
function genes_(r) { try { return JSON.parse(r[C.Genes]); } catch (e) { return null; } }
function siguienteNum_() { const pr = PropertiesService.getScriptProperties(), n = num_(pr.getProperty('num')) + 1; pr.setProperty('num', String(n)); return n; }
function crearCriatura_(o) {
  const row = new Array(CAB_C.length).fill('');
  row[C.Id] = nuevoId_('CX-'); row[C.Num] = siguienteNum_(); row[C.Nombre] = o.nombre || ''; row[C.Dueno] = o.dueno; row[C.DuenoNombre] = o.duenoNombre || '';
  row[C.Tipo] = o.tipo || 'criatura'; row[C.Genes] = JSON.stringify(o.genes); row[C.Clase] = o.genes.c; row[C.PadreA] = o.padreA || ''; row[C.PadreB] = o.padreB || '';
  row[C.Crias] = 0; row[C.Creada] = new Date(); row[C.Eclosion] = o.eclosion || ''; row[C.Estado] = o.estado || ''; row[C.Precio] = o.precio || '';
  row[C.Inicial] = o.inicial ? 'SI' : ''; row[C.Origen] = o.origen || '';
  hojaC_().appendRow(row);
  return pub_(row, true);
}
function pub_(r, verGenes) {
  const huevo = r[C.Tipo] === 'huevo', g = genes_(r);
  return { id: String(r[C.Id]), num: num_(r[C.Num]), nombre: String(r[C.Nombre] || ''), dueno: String(r[C.Dueno]), duenoNombre: String(r[C.DuenoNombre] || ''),
    tipo: huevo ? 'huevo' : 'criatura', genes: huevo && !verGenes ? null : g, clase: huevo && !verGenes ? null : String(r[C.Clase]),
    padres: [String(r[C.PadreA] || ''), String(r[C.PadreB] || '')], crias: num_(r[C.Crias]),
    creada: r[C.Creada] instanceof Date ? r[C.Creada].getTime() : 0, eclosion: num_(r[C.Eclosion]), estado: String(r[C.Estado] || ''), precio: num_(r[C.Precio]),
    inicial: r[C.Inicial] === 'SI', origen: String(r[C.Origen] || '') };
}
function nombreDe_(r) { return String(r[C.Nombre] || '') || ('Criaturix #' + r[C.Num]); }
function deUsuario_(rows, uid) { const out = []; rows.forEach((r, i) => { if (String(r[C.Dueno]) === uid) out.push(i); }); return out; }
function yo_(p) {
  const s = sesion_(p.token), cr = criaturas_(), uid = String(s.row[U.Id]);
  const mias = deUsuario_(cr.rows, uid).map(i => pub_(cr.rows[i], false));
  return { ok: true, perfil: perfil_(s.row), criaturas: mias, aviso: String(cfg_().aviso || ''), reglas: reglasPub_() };
}
function reglasPub_() { const c = cfg_(); return { horasEclosion: c.horasEclosion, maxCrias: c.maxCrias, costeCria: c.costeCria, costeCriaCreditos: c.costeCriaCreditos, comision: c.comision, precioMin: c.precioMin, energiaDia: c.energiaDia }; }
function renombrar_(p) {
  const s = sesion_(p.token), nombre = String(p.nombre || '').trim().slice(0, 20).replace(/[<>]/g, '');
  return conLock_(() => {
    const cr = criaturas_(), i = buscar_(cr.rows, C.Id, p.id);
    if (i < 0 || String(cr.rows[i][C.Dueno]) !== String(s.row[U.Id])) throw new Error('Esa criatura no es tuya');
    cr.rows[i][C.Nombre] = nombre; guarda_(cr.sh, i, cr.rows[i]);
    return { ok: true, criatura: pub_(cr.rows[i]) };
  });
}
function equipo_(p) {
  const s = sesion_(p.token), ids = Array.isArray(p.ids) ? p.ids.map(String).slice(0, 3) : [];
  if (ids.length !== 3 || new Set(ids).size !== 3) throw new Error('Elige 3 criaturas distintas');
  const cr = criaturas_(), uid = String(s.row[U.Id]);
  ids.forEach(id => { const i = buscar_(cr.rows, C.Id, id); if (i < 0 || String(cr.rows[i][C.Dueno]) !== uid || cr.rows[i][C.Tipo] !== 'criatura') throw new Error('Solo puedes usar tus criaturas ya nacidas'); });
  s.row[U.Equipo] = JSON.stringify(ids); guarda_(s.sh, s.i, s.row);
  return { ok: true, perfil: perfil_(s.row) };
}
function quitarDeEquipo_(urow, id) { let eq = []; try { eq = JSON.parse(urow[U.Equipo] || '[]'); } catch (e) {} const n = eq.filter(x => x !== id); if (n.length !== eq.length) { urow[U.Equipo] = JSON.stringify(n); return true; } return false; }
function mov_(uid, usuario, concepto, creditos, chips, ref) { hoja_('Movimientos', CAB_M).appendRow([new Date(), uid, usuario, concepto, creditos || 0, chips || 0, ref || '']); }

/* ---------------- cría ---------------- */
function criar_(p) {
  const s0 = sesion_(p.token);
  freno_('cria_' + s0.row[U.Id], 1, 4);
  return conLock_(() => {
    const s = sesion_(p.token), uid = String(s.row[U.Id]), cf = cfg_(), cr = criaturas_();
    const ia = buscar_(cr.rows, C.Id, p.a), ib = buscar_(cr.rows, C.Id, p.b);
    if (ia < 0 || ib < 0 || ia === ib) throw new Error('Elige dos criaturas distintas');
    const A = cr.rows[ia], B = cr.rows[ib];
    [A, B].forEach(r => {
      if (String(r[C.Dueno]) !== uid) throw new Error('Las dos criaturas tienen que ser tuyas');
      if (r[C.Tipo] !== 'criatura') throw new Error('Los huevos no pueden criar');
      if (r[C.Inicial] === 'SI') throw new Error(nombreDe_(r) + ' es una criatura inicial y no puede criar');
      if (r[C.Estado]) throw new Error(nombreDe_(r) + ' está a la venta. Retírala del mercado para criar');
      if (num_(r[C.Crias]) >= cf.maxCrias) throw new Error(nombreDe_(r) + ' ya ha criado ' + cf.maxCrias + ' veces');
    });
    const ida = String(A[C.Id]), idb = String(B[C.Id]), pa = [A[C.PadreA], A[C.PadreB]].filter(String), pb = [B[C.PadreA], B[C.PadreB]].filter(String);
    if (pa.indexOf(idb) >= 0 || pb.indexOf(ida) >= 0) throw new Error('Padres e hijos no pueden criar juntos');
    if (pa.some(x => pb.indexOf(x) >= 0)) throw new Error('Los hermanos no pueden criar juntos');
    const coste = (cf.costeCria[num_(A[C.Crias])] || cf.costeCria[cf.costeCria.length - 1] || 0) + (cf.costeCria[num_(B[C.Crias])] || cf.costeCria[cf.costeCria.length - 1] || 0);
    if (num_(s.row[U.Chips]) < coste) throw new Error('Necesitas ' + coste + ' chips para criar (tienes ' + num_(s.row[U.Chips]) + ')');
    if (num_(s.row[U.Creditos]) < cf.costeCriaCreditos) throw new Error('Necesitas ' + cf.costeCriaCreditos + ' créditos para criar');
    s.row[U.Chips] = num_(s.row[U.Chips]) - coste; s.row[U.Creditos] = num_(s.row[U.Creditos]) - cf.costeCriaCreditos;
    guarda_(s.sh, s.i, s.row);
    A[C.Crias] = num_(A[C.Crias]) + 1; B[C.Crias] = num_(B[C.Crias]) + 1;
    guarda_(cr.sh, ia, A); guarda_(cr.sh, ib, B);
    const genes = CX.cruzar(genes_(A), genes_(B));
    const huevo = crearCriatura_({ dueno: uid, duenoNombre: s.row[U.Usuario], tipo: 'huevo', genes, padreA: ida, padreB: idb, eclosion: Date.now() + cf.horasEclosion * 3600000, origen: 'Cría' });
    mov_(uid, s.row[U.Usuario], 'Cría ' + nombreDe_(A) + ' × ' + nombreDe_(B), -cf.costeCriaCreditos, -coste, huevo.id);
    huevo.genes = null; huevo.clase = null;
    return { ok: true, huevo, perfil: perfil_(s.row) };
  });
}
function eclosionar_(p) {
  const s = sesion_(p.token), uid = String(s.row[U.Id]);
  return conLock_(() => {
    const cr = criaturas_(), i = buscar_(cr.rows, C.Id, p.id); if (i < 0) throw new Error('No encuentro ese huevo');
    const r = cr.rows[i];
    if (String(r[C.Dueno]) !== uid || r[C.Tipo] !== 'huevo') throw new Error('Ese huevo no es tuyo');
    if (r[C.Estado]) throw new Error('Retira el huevo del mercado para abrirlo');
    if (num_(r[C.Eclosion]) > Date.now()) throw new Error('Todavía no está listo para eclosionar');
    r[C.Tipo] = 'criatura'; r[C.Creada] = new Date(); guarda_(cr.sh, i, r);
    return { ok: true, criatura: pub_(r) };
  });
}

/* ---------------- mercado ---------------- */
function mercado_(p) {
  const c = CacheService.getScriptCache(), v = c.get('mercado'); if (v) return JSON.parse(v);
  const cr = criaturas_(), lista = [];
  cr.rows.forEach(r => { if (r[C.Estado] === 'venta') lista.push(pub_(r, false)); });
  const out = { ok: true, lista: lista.slice(-400) };
  c.put('mercado', JSON.stringify(out), 20);
  return out;
}
function centimos_(v) { const n = Math.round(parseFloat(String(v || '').replace(',', '.')) * 100); return isFinite(n) ? n : 0; }
function vender_(p) {
  const s = sesion_(p.token), uid = String(s.row[U.Id]), cf = cfg_(), precio = centimos_(p.precio);
  if (precio < cf.precioMin * 100 || precio > 100000) throw new Error('El precio tiene que estar entre ' + cf.precioMin + ' € y 1.000 €');
  return conLock_(() => {
    const cr = criaturas_(), i = buscar_(cr.rows, C.Id, p.id); if (i < 0) throw new Error('No encontrada');
    const r = cr.rows[i];
    if (String(r[C.Dueno]) !== uid) throw new Error('No es tuya');
    if (r[C.Inicial] === 'SI') throw new Error('Las criaturas iniciales no se pueden vender');
    if (r[C.Estado]) throw new Error('Ya está a la venta');
    r[C.Estado] = 'venta'; r[C.Precio] = precio; guarda_(cr.sh, i, r);
    const s2 = sesion_(p.token); if (quitarDeEquipo_(s2.row, String(r[C.Id]))) guarda_(s2.sh, s2.i, s2.row);
    CacheService.getScriptCache().remove('mercado');
    return { ok: true, criatura: pub_(r, false), perfil: perfil_(s2.row) };
  });
}
function retirar_(p) {
  const s = sesion_(p.token), uid = String(s.row[U.Id]);
  return conLock_(() => {
    const cr = criaturas_(), i = buscar_(cr.rows, C.Id, p.id); if (i < 0) throw new Error('No encontrada');
    const r = cr.rows[i];
    if (String(r[C.Dueno]) !== uid) throw new Error('No es tuya');
    if (r[C.Estado] === 'reservado') throw new Error('Alguien la está comprando: espera a que se confirme o se anule el pago');
    r[C.Estado] = ''; r[C.Precio] = ''; guarda_(cr.sh, i, r);
    CacheService.getScriptCache().remove('mercado');
    return { ok: true, criatura: pub_(r, false) };
  });
}
function comprar_(p) {
  const s0 = sesion_(p.token);
  freno_('compra_' + s0.row[U.Id], 5, 600);
  return conLock_(() => {
    const s = sesion_(p.token), uid = String(s.row[U.Id]), cr = criaturas_(), i = buscar_(cr.rows, C.Id, p.id);
    if (i < 0) throw new Error('Ya no está disponible');
    const r = cr.rows[i];
    if (r[C.Estado] !== 'venta') throw new Error('Lo siento, otra persona se te ha adelantado');
    if (String(r[C.Dueno]) === uid) throw new Error('Es tuya');
    const shP = hoja_('Pedidos', CAB_P), ped = tabla_(shP, CAB_P.length);
    if (ped.filter(x => String(x[P.IdComprador]) === uid && x[P.Estado] === 'pendiente').length >= 3) throw new Error('Tienes 3 compras pendientes de confirmar. Espera a que se confirmen.');
    const importe = num_(r[C.Precio]), id = nuevoId_('PD-');
    shP.appendRow([id, new Date(), uid, s.row[U.Usuario], String(r[C.Dueno]), String(r[C.Dueno]) === TIENDA ? TIENDA : r[C.DuenoNombre], String(r[C.Id]), r[C.Tipo], importe, 'pendiente', '', '']);
    r[C.Estado] = 'reservado'; guarda_(cr.sh, i, r);
    CacheService.getScriptCache().remove('mercado');
    try {
      MailApp.sendEmail({ to: ADMIN_EMAIL, name: 'CRIATURIX', subject: '💰 Pedido ' + euros_(importe) + ' € de ' + s.row[U.Usuario],
        htmlBody: mail_('<b>' + s.row[U.Usuario] + '</b> quiere comprar <b>' + nombreDe_(r) + '</b> (' + r[C.Tipo] + ') por <b>' + euros_(importe) + ' €</b>.<br>Vendedor: ' + (String(r[C.Dueno]) === TIENDA ? 'Tienda oficial' : r[C.DuenoNombre]) + '<br>Pedido: ' + id + '<p>Cuando recibas el pago en myPOS, confírmalo en el panel de administración.</p><p><a style="color:#00e5ff" href="' + WEB + '">' + WEB + '</a></p>') });
    } catch (e) {}
    return { ok: true, pedido: { id, importe, url: urlPago_(importe) } };
  });
}
const PACKS_CREDITOS = [500, 1000, 2500, 5000, 10000];   // créditos (1 crédito = 1 céntimo)
function recargar_(p) {
  const s0 = sesion_(p.token);
  freno_('recarga_' + s0.row[U.Id], 6, 600);
  const cant = parseInt(p.cantidad, 10);
  if (PACKS_CREDITOS.indexOf(cant) < 0) throw new Error('Cantidad no válida');
  return conLock_(() => {
    const s = sesion_(p.token), uid = String(s.row[U.Id]), shP = hoja_('Pedidos', CAB_P), ped = tabla_(shP, CAB_P.length);
    if (ped.filter(x => String(x[P.IdComprador]) === uid && x[P.Estado] === 'pendiente').length >= 3) throw new Error('Tienes 3 compras pendientes de confirmar. Espera a que se confirmen.');
    const id = nuevoId_('PD-');
    shP.appendRow([id, new Date(), uid, s.row[U.Usuario], TIENDA, 'Recarga de créditos', '', 'creditos', cant, 'pendiente', '', '']);
    try {
      MailApp.sendEmail({ to: ADMIN_EMAIL, name: 'CRIATURIX', subject: '💎 Recarga de ' + cant + ' créditos (' + euros_(cant) + ' €) de ' + s.row[U.Usuario],
        htmlBody: mail_('<b>' + s.row[U.Usuario] + '</b> quiere comprar <b>' + cant + ' créditos</b> por <b>' + euros_(cant) + ' €</b>.<br>Pedido: ' + id + '<p>Cuando recibas el pago en myPOS, confírmalo en el panel de administración y se le sumarán los créditos.</p><p><a style="color:#00e5ff" href="' + WEB + '">' + WEB + '</a></p>') });
    } catch (e) {}
    return { ok: true, pedido: { id, importe: cant, creditos: cant, url: urlPago_(cant) } };
  });
}
function cancelarPedido_(p) {
  const s = sesion_(p.token), uid = String(s.row[U.Id]);
  return conLock_(() => {
    const shP = hoja_('Pedidos', CAB_P), ped = tabla_(shP, CAB_P.length), i = buscar_(ped, P.Id, p.id);
    if (i < 0 || String(ped[i][P.IdComprador]) !== uid || ped[i][P.Estado] !== 'pendiente') throw new Error('No se puede anular ese pedido');
    ped[i][P.Estado] = 'anulado'; ped[i][P.Resuelto] = new Date(); ped[i][P.Nota] = 'Anulado por el comprador'; guarda_(shP, i, ped[i]);
    liberar_(ped[i][P.IdCriatura]);
    return { ok: true };
  });
}
function liberar_(idc) { const cr = criaturas_(), j = buscar_(cr.rows, C.Id, idc); if (j >= 0 && cr.rows[j][C.Estado] === 'reservado') { cr.rows[j][C.Estado] = 'venta'; guarda_(cr.sh, j, cr.rows[j]); } CacheService.getScriptCache().remove('mercado'); }
function pedPub_(x, crIdx) {
  const r = crIdx[String(x[P.IdCriatura])];
  return { id: String(x[P.Id]), fecha: x[P.Fecha] instanceof Date ? x[P.Fecha].getTime() : 0, comprador: String(x[P.Comprador]), idComprador: String(x[P.IdComprador]),
    vendedor: String(x[P.Vendedor]), idVendedor: String(x[P.IdVendedor]), tipo: String(x[P.Tipo]), importe: num_(x[P.Importe]), estado: String(x[P.Estado]),
    nota: String(x[P.Nota] || ''), url: urlPago_(num_(x[P.Importe])), item: r ? pub_(r, false) : null };
}
function misPedidos_(p) {
  const s = sesion_(p.token), uid = String(s.row[U.Id]), ped = tabla_(hoja_('Pedidos', CAB_P), CAB_P.length), cr = criaturas_(), idx = {};
  cr.rows.forEach(r => idx[String(r[C.Id])] = r);
  const compras = [], ventas = [];
  ped.forEach(x => { if (String(x[P.IdComprador]) === uid) compras.push(pedPub_(x, idx)); if (String(x[P.IdVendedor]) === uid) ventas.push(pedPub_(x, idx)); });
  return { ok: true, compras: compras.reverse().slice(0, 50), ventas: ventas.reverse().slice(0, 50) };
}
function movimientos_(p) {
  const s = sesion_(p.token), uid = String(s.row[U.Id]), out = [];
  tabla_(hoja_('Movimientos', CAB_M), CAB_M.length).forEach(m => { if (String(m[1]) === uid) out.push({ fecha: m[0] instanceof Date ? m[0].getTime() : 0, concepto: m[3], creditos: num_(m[4]), chips: num_(m[5]) }); });
  return { ok: true, lista: out.reverse().slice(0, 60) };
}
function ranking_() {
  const c = CacheService.getScriptCache(), v = c.get('ranking'); if (v) return JSON.parse(v);
  const rows = usuarios_().rows.map(r => ({ usuario: String(r[U.Usuario]), elo: num_(r[U.Elo]) || 1000, v: num_(r[U.Victorias]), d: num_(r[U.Derrotas]), etapa: num_(r[U.Etapa]) }));
  const out = { ok: true, arena: rows.filter(r => r.v + r.d > 0).sort((a, b) => b.elo - a.elo).slice(0, 50), aventura: rows.filter(r => r.etapa > 0).sort((a, b) => b.etapa - a.etapa).slice(0, 50) };
  c.put('ranking', JSON.stringify(out), 60);
  return out;
}

/* ---------------- combates ---------------- */
function equipoDe_(urow, cr) {
  let eq = []; try { eq = JSON.parse(urow[U.Equipo] || '[]'); } catch (e) {}
  const uid = String(urow[U.Id]), out = [];
  eq.forEach(id => { const i = buscar_(cr.rows, C.Id, id); if (i >= 0 && String(cr.rows[i][C.Dueno]) === uid && cr.rows[i][C.Tipo] === 'criatura') out.push({ id: String(id), nom: nombreDe_(cr.rows[i]), genes: genes_(cr.rows[i]) }); });
  return out;
}
const NOMBRES_BOT = ['Óxido', 'Tornillo', 'Chispa', 'Pixel', 'Bit', 'Tuerca', 'Voltia', 'Nano', 'Glitch', 'Turbo', 'Sprocket', 'Quark', 'Neón', 'Byte', 'Diodo'];
function equipoBot_(genes, pre) { return genes.map((g, i) => ({ id: pre + i, nom: NOMBRES_BOT[(i * 5 + g.p.boca[0].length + g.col) % NOMBRES_BOT.length] + '-' + (100 + i * 37 % 900), genes: g })); }
function guardarCombate_(uid, B) { CacheService.getScriptCache().put('cb_' + uid, JSON.stringify(B), 21600); }
function cargarCombate_(uid) { const v = CacheService.getScriptCache().get('cb_' + uid); return v ? JSON.parse(v) : null; }
function cGet_(k) { const v = CacheService.getScriptCache().get(k); if (!v) return null; try { return JSON.parse(v); } catch (e) { return null; } }
function cPut_(k, o, seg) { CacheService.getScriptCache().put(k, JSON.stringify(o), seg || 21600); }
/* sesión rápida (solo el id del jugador) para las llamadas que se repiten cada segundo */
function uidRapido_(token) {
  token = String(token || ''); const c = CacheService.getScriptCache(), k = 'tk_' + token.slice(0, 60), v = c.get(k);
  if (v && token.length >= 30) return v;
  const uid = String(sesion_(token).row[U.Id]); c.put(k, uid, 600); return uid;
}

/* ---------- aventura (contra robots salvajes) ---------- */
function combateInicio_(p) {
  if (p.modo !== 'pve') return buscarRival_(Object.assign({}, p, { nueva: 1 }));
  const s = sesion_(p.token), uid = String(s.row[U.Id]), cr = criaturas_(), mio = equipoDe_(s.row, cr);
  freno_('cbi_' + uid, 12, 60);
  if (mio.length < 3) throw new Error('Necesitas 3 criaturas en tu equipo. Ve a «Equipo» y elígelas.');
  const n = Math.max(1, Math.min(30, parseInt(p.etapa, 10) || 1));
  if (n > num_(s.row[U.Etapa]) + 1) throw new Error('Primero supera la etapa ' + (num_(s.row[U.Etapa]) + 1));
  const e = CX.etapa(n), rival = equipoBot_(e.eq, 'e' + n + '-');
  const meta = { modo: 'pve', etapa: n, rival: (e.jefe ? 'JEFE · ' : '') + e.zona, mult: e.mult };
  const B = MOTOR.crear([mio, rival], { mult: [1, meta.mult], nombres: [String(s.row[U.Usuario]), meta.rival] });
  B.meta = meta; B.t = Date.now();
  guardarCombate_(uid, B);
  return { ok: true, meta, vista: MOTOR.vista(B, 0) };
}

/* ---------- arena: emparejamiento en tiempo real ----------
   El jugador entra en la cola y el móvil pregunta cada segundo. Si aparece otro jugador conectado
   (y no os habéis enfrentado hace poco) jugáis los dos la MISMA partida. Si pasan «arenaEspera»
   segundos sin nadie, juega contra un bot con un nombre distinto cada vez. */
const BOT_A = ['Turbo', 'Pixel', 'Glitch', 'Nano', 'Tuerca', 'Voltia', 'Quark', 'Diodo', 'Chispa', 'Oxido', 'Byte', 'Neon', 'Tornillo', 'Rayo', 'Ciber', 'Zeta', 'Mecha', 'Robi', 'Flux', 'Nitro', 'Vortex', 'Krono', 'Laser', 'Blitz', 'Astro', 'Dinamo', 'Ion', 'Rocket', 'Cobra', 'Drako', 'Furia', 'Lobo', 'Magma', 'Orion', 'Pulsar', 'Sigma', 'Trueno', 'Volt', 'Yeti', 'Zafiro'];
const BOT_B = ['Max', 'Pro', 'King', 'Rex', 'Boy', 'Master', 'X', 'Zero', 'Gamer', 'Lord', 'Wolf', 'Star', 'Fox', 'Ninja', 'Crack', 'Titan', 'Storm', 'Kid', 'One', 'GG'];
function nombreBot_(usados, cogidos) {
  const al = a => a[Math.floor(Math.random() * a.length)];
  for (let k = 0; k < 40; k++) {
    const a = al(BOT_A), b = al(BOT_B), r = Math.random(), nn = Math.floor(Math.random() * 98) + 2;
    const n = (r < .3 ? a + b : r < .55 ? a + '_' + nn : r < .75 ? (a + b).toLowerCase() + (nn % 10) : r < .9 ? a + nn : b + a).slice(0, 16);
    if (usados.indexOf(n) < 0 && !cogidos[n.toLowerCase()]) return n;
  }
  return 'Robi' + Date.now() % 10000;
}
function histArena_(uid) { return cGet_('ah_' + uid) || { r: [], n: [] }; }
function apuntaRival_(uid, rival, nombreBot) {
  const h = histArena_(uid); h.r.push(rival); h.r = h.r.slice(-10);
  if (nombreBot) { h.n.push(nombreBot); h.n = h.n.slice(-30); }
  cPut_('ah_' + uid, h);
}
function ultimos_(lista, n) { return n > 0 ? lista.slice(-n) : []; }
function puedenJugar_(a, b, n) { return ultimos_(histArena_(a).r, n).indexOf(b) < 0 && ultimos_(histArena_(b).r, n).indexOf(a) < 0; }
const COLA_FRESCA = 3500, ABANDONO_MS = 35000;
function buscarRival_(p) {
  const uid = uidRapido_(p.token), cf = cfg_();
  freno_('busca_' + uid, 60, 60);
  return conLock_(() => {
    const c = CacheService.getScriptCache(), ahora = Date.now();
    // ¿ya estoy en una partida contra otro jugador? (me han emparejado o la dejé a medias)
    const emp = c.get('emp_' + uid); if (emp) c.remove('emp_' + uid);
    const ref = cargarCombate_(uid);
    if (ref && ref.pvp) { const B = cGet_('pb_' + ref.pvp); if (B && !B.fin) { ping_(ref.pvp, ref.lado); return pvpSalida_(B, ref.lado); } }
    const todos = cGet_('cola') || [], yo0 = todos.find(x => x.uid === uid);
    const cola = todos.filter(x => x.uid !== uid && ahora - x.t < COLA_FRESCA);
    let yo = !p.nueva && yo0 && ahora - yo0.t < COLA_FRESCA ? yo0 : null;
    if (!yo) {
      const s = sesion_(p.token), eq = equipoDe_(s.row, criaturas_());
      if (eq.length < 3) throw new Error('Necesitas 3 criaturas en tu equipo. Ve a «Equipo» y elígelas.');
      yo = { uid, nom: String(s.row[U.Usuario]), elo: num_(s.row[U.Elo]) || 1000, eq, t0: ahora };
    }
    yo.t = ahora;
    // 1. otro jugador real esperando
    const cands = cola.filter(x => puedenJugar_(uid, x.uid, cf.arenaRepetir)).sort((a, b) => Math.abs(a.elo - yo.elo) - Math.abs(b.elo - yo.elo));
    if (cands.length) {
      const el = cands[0], bid = nuevoId_('PV');
      cPut_('cola', cola.filter(x => x.uid !== el.uid), 600);
      const B = MOTOR.crear([yo.eq, el.eq], { nombres: [yo.nom, el.nom] });
      B.meta = { modo: 'pvp', real: 1, bid, uids: [uid, el.uid], nombres: [yo.nom, el.nom], elos: [yo.elo, el.elo] };
      B.t = ahora; B.pend = [null, null]; B.faltas = [0, 0]; B.ult = null; B.premios = [null, null];
      B.limite = ahora + (cf.turnoSeg + 6) * 1000;   // +6 s para la presentación
      cPut_('pb_' + bid, B);
      guardarCombate_(uid, { pvp: bid, lado: 0 }); guardarCombate_(el.uid, { pvp: bid, lado: 1 });
      c.put('emp_' + el.uid, bid, 300);
      ping_(bid, 0); ping_(bid, 1);
      apuntaRival_(uid, el.uid); apuntaRival_(el.uid, uid);
      return pvpSalida_(B, 0);
    }
    // 2. nadie en el tiempo de espera: bot
    if (ahora - yo.t0 >= cf.arenaEspera * 1000) { cPut_('cola', cola, 600); return combateBot_(yo); }
    // 3. sigo esperando
    cola.push(yo); cPut_('cola', cola, 600);
    return { ok: true, esperando: 1, quedan: Math.max(0, yo.t0 + cf.arenaEspera * 1000 - ahora) };
  });
}
function noBuscar_(p) {
  const uid = uidRapido_(p.token);
  return conLock_(() => {
    cPut_('cola', (cGet_('cola') || []).filter(x => x.uid !== uid), 600);
    const c = CacheService.getScriptCache(), emp = c.get('emp_' + uid);
    if (emp) { c.remove('emp_' + uid); const ref = cargarCombate_(uid), B = cGet_('pb_' + emp); if (ref && ref.pvp === emp && B && !B.fin) { ping_(emp, ref.lado); return pvpSalida_(B, ref.lado); } }
    return { ok: true };
  });
}
function combateBot_(yo) {
  const h = histArena_(yo.uid), cogidos = {}; usuarios_().rows.forEach(r => cogidos[String(r[U.Usuario]).toLowerCase()] = 1);
  const nom = nombreBot_(h.n, cogidos), base = Math.floor(Math.random() * 1e9);
  const tope = Math.max(60, num_(PropertiesService.getScriptProperties().getProperty('num')));
  const rival = [0, 1, 2].map(i => ({ id: 'b' + i, nom: 'Criaturix #' + (1 + Math.floor(Math.random() * tope)), genes: CX.genesAzar(base + i * 7919, null, 0.4 + Math.random() * 0.35) }));
  const meta = { modo: 'pvp', rival: nom, eloRival: Math.max(0, yo.elo + Math.round((Math.random() - 0.5) * 140)), mult: 1 };
  const B = MOTOR.crear([yo.eq, rival], { mult: [1, 1], nombres: [yo.nom, nom] });
  B.meta = meta; B.t = Date.now();
  guardarCombate_(yo.uid, B);
  apuntaRival_(yo.uid, 'bot', nom);
  return { ok: true, meta, vista: MOTOR.vista(B, 0) };
}

/* ---------- partida entre dos jugadores reales (la misma para los dos) ---------- */
function ping_(bid, l) { CacheService.getScriptCache().put('pp_' + bid + '_' + l, String(Date.now()), 3600); }
function pingDe_(bid, l) { return num_(CacheService.getScriptCache().get('pp_' + bid + '_' + l)); }
function giraRes_(r) { return r === 'gana' ? 'pierde' : r === 'pierde' ? 'gana' : r; }
function giraEv_(ev, l) {   // los eventos se guardan desde el lado 0: al otro jugador se le dan la vuelta
  if (!l) return ev;
  return ev.map(e => { const o = Object.assign({}, e); if ('l' in o) o.l = 1 - o.l; if ('tl' in o) o.tl = 1 - o.tl; if (o.t === 'fin') o.r = giraRes_(o.r); return o; });
}
function vistaL_(B, l) { const v = MOTOR.vista(B, l); if (l === 1 && v.fin) v.fin = giraRes_(v.fin); return v; }
function metaL_(B, l) { const m = B.meta; return { modo: 'pvp', real: 1, rival: m.nombres[1 - l], eloRival: m.elos[1 - l], mult: 1 }; }
function pvpSalida_(B, l, ronda) {
  const out = { ok: true, meta: metaL_(B, l), vista: vistaL_(B, l), quedan: Math.max(0, B.limite - Date.now()), enviado: !!B.pend[l], rivalListo: !!B.pend[1 - l] };
  if (ronda != null) {
    if (B.ult && B.ult.ronda === ronda) { out.ev = giraEv_(B.ult.ev, l); out.resuelta = 1; }
    else if (B.fin) { out.ev = []; out.resuelta = 1; }
    else out.esperando = 1;
  }
  if (B.fin) out.premio = B.premios[l];
  return out;
}
function pvpPremios_(B) {
  const m = B.meta;
  B.premios = [0, 1].map(l => { try { return terminar_(m.uids[l], l ? giraRes_(B.fin) : B.fin, { modo: 'pvp', real: 1, rival: m.nombres[1 - l], eloRival: m.elos[1 - l] }, B.ronda); } catch (e) { return null; } });
}
/* resuelve la ronda si ya han elegido los dos, si se acabó el tiempo o si alguien se ha ido */
function pvpResolver_(B, cf, bid) {
  if (B.fin) return false;
  const ahora = Date.now(), ambos = !!(B.pend[0] && B.pend[1]), tarde = ahora > B.limite;
  let aband = [0, 1].filter(l => !B.pend[l] && ahora - pingDe_(bid, l) > ABANDONO_MS);
  if (!aband.length && !ambos && !tarde) return false;
  if (!aband.length && !ambos) {   // se acabó el tiempo: el ordenador elige por quien no lo ha hecho
    [0, 1].forEach(l => { if (!B.pend[l]) B.faltas[l]++; });
    aband = [0, 1].filter(l => !B.pend[l] && B.faltas[l] >= 3);
  }
  const r = B.ronda; let ev;
  if (aband.length) {
    B.fin = aband.length === 2 ? 'empate' : aband[0] === 0 ? 'pierde' : 'gana';
    ev = aband.map(l => ({ t: 'aviso', m: '¡' + B.meta.nombres[l].toUpperCase() + ' HA ABANDONADO!' })).concat([{ t: 'fin', r: B.fin }]);
  } else {
    const jug = [0, 1].map(l => { const j = B.pend[l]; if (j) { try { MOTOR.comprobar(B, l, j); return j; } catch (e) {} } return MOTOR.ia(B, l, 1); });
    ev = MOTOR.ronda(B, jug[0], jug[1]);
  }
  B.ult = { ronda: r, ev }; B.pend = [null, null];
  B.limite = Date.now() + (cf.turnoSeg + Math.min(25, ev.length * 0.5) + 2) * 1000;   // + lo que tarda la animación
  if (B.fin) pvpPremios_(B);
  return true;
}
function pvpTurno_(uid, ref, p) {
  const cf = cfg_(), r = parseInt(p.ronda, 10);
  return conLock_(() => {
    const B = cGet_('pb_' + ref.pvp); if (!B) throw new Error('El combate ha caducado');
    const l = ref.lado; ping_(ref.pvp, l);
    if (!B.fin && r === B.ronda && !B.pend[l]) {
      const jug = p.jug || {};
      MOTOR.comprobar(B, l, jug);
      B.pend[l] = jug; B.faltas[l] = 0;
      pvpResolver_(B, cf, ref.pvp);
      cPut_('pb_' + ref.pvp, B);
    }
    return pvpSalida_(B, l, r);
  });
}
/* el móvil pregunta cada 1-2 s: ¿ha elegido ya el rival? ¿se ha resuelto la ronda? */
function esperar_(p) {
  const uid = uidRapido_(p.token), ref = cargarCombate_(uid);
  if (!ref || !ref.pvp) return { ok: true, sinCombate: 1 };
  const cf = cfg_(), bid = ref.pvp, ahora = Date.now();
  ping_(bid, ref.lado);
  let B = cGet_('pb_' + bid); if (!B) return { ok: false, error: 'El combate ha caducado' };
  const toca = !B.fin && ((B.pend[0] && B.pend[1]) || ahora > B.limite || [0, 1].some(l => ahora - pingDe_(bid, l) > ABANDONO_MS));
  if (toca) B = conLock_(() => { const B2 = cGet_('pb_' + bid); if (B2 && pvpResolver_(B2, cf, bid)) cPut_('pb_' + bid, B2); return B2 || B; });
  return pvpSalida_(B, ref.lado, parseInt(p.ronda, 10));
}

function combateEnCurso_(p) {
  const s = sesion_(p.token), B = cargarCombate_(String(s.row[U.Id]));
  if (B && B.pvp) { const P = cGet_('pb_' + B.pvp); return { ok: true, combate: P && !P.fin ? pvpSalida_(P, B.lado) : null }; }
  if (!B || B.fin) return { ok: true, combate: null };
  return { ok: true, combate: { meta: B.meta, vista: MOTOR.vista(B, 0) } };
}
function combateTurno_(p) {
  const uid = uidRapido_(p.token), B = cargarCombate_(uid);
  if (!B) throw new Error('El combate ha caducado');
  if (B.pvp) return pvpTurno_(uid, B, p);
  if (B.fin) return { ok: true, ev: [], vista: MOTOR.vista(B, 0), meta: B.meta, premio: B.premio || null };
  if (parseInt(p.ronda, 10) !== B.ronda) return { ok: true, ev: [], vista: MOTOR.vista(B, 0), meta: B.meta, repetido: 1 };
  const ev = MOTOR.ronda(B, p.jug || {}, MOTOR.ia(B, 1, B.meta.modo === 'pve' ? 0.6 + B.meta.etapa / 40 : 1));
  let premio = null;
  if (B.fin) premio = B.premio = terminar_(uid, B.fin, B.meta, B.ronda);
  guardarCombate_(uid, B);
  return { ok: true, ev, vista: MOTOR.vista(B, 0), meta: B.meta, premio };
}
function combateRendirse_(p) {
  const uid = uidRapido_(p.token), B = cargarCombate_(uid);
  if (B && B.pvp) return conLock_(() => {
    const P = cGet_('pb_' + B.pvp); if (!P || P.fin) return { ok: true };
    const l = B.lado; P.fin = l ? 'gana' : 'pierde';
    P.ult = { ronda: P.ronda, ev: [{ t: 'aviso', m: '¡' + P.meta.nombres[l].toUpperCase() + ' SE HA RENDIDO!' }, { t: 'fin', r: P.fin }] };
    P.pend = [null, null]; pvpPremios_(P); cPut_('pb_' + B.pvp, P);
    return { ok: true, premio: P.premios[l] };
  });
  if (!B || B.fin) return { ok: true };
  B.fin = 'pierde'; B.premio = terminar_(uid, 'pierde', B.meta, B.ronda); guardarCombate_(uid, B);
  return { ok: true, premio: B.premio };
}
/* res = 'gana' | 'pierde' | 'empate' visto desde este jugador */
function terminar_(uid, res, m, rondas) {
  return conLock_(() => {
    const f = usuarios_(), i = buscar_(f.rows, U.Id, uid); if (i < 0) return null;
    const row = f.rows[i], cf = cfg_();
    if (row[U.EnergiaFecha] !== hoy_()) { row[U.EnergiaFecha] = hoy_(); row[U.EnergiaUsada] = 0; }
    const conPremio = num_(row[U.EnergiaUsada]) < cf.energiaDia;
    let chips = 0, dElo = 0, nueva = false;
    if (m.modo === 'pve') {
      if (res === 'gana') {
        if (m.etapa > num_(row[U.Etapa])) { row[U.Etapa] = m.etapa; chips = 15 + 3 * m.etapa; nueva = true; }
        else if (conPremio) chips = 4 + Math.floor(m.etapa / 2);
      }
    } else {
      const elo = num_(row[U.Elo]) || 1000, esp = 1 / (1 + Math.pow(10, ((m.eloRival || 1000) - elo) / 400));
      const pts = res === 'gana' ? 1 : res === 'empate' ? 0.5 : 0;
      dElo = Math.round(32 * (pts - esp)); row[U.Elo] = Math.max(0, elo + dElo);
      if (res === 'gana') { row[U.Victorias] = num_(row[U.Victorias]) + 1; if (conPremio) chips = cf.pvpGana + Math.floor(Math.max(0, elo - 1000) / 150); }
      else if (res === 'pierde') row[U.Derrotas] = num_(row[U.Derrotas]) + 1;
    }
    if (chips && !nueva) row[U.EnergiaUsada] = num_(row[U.EnergiaUsada]) + 1;
    row[U.Chips] = num_(row[U.Chips]) + chips;
    guarda_(f.sh, i, row);
    hoja_('Combates', CAB_B).appendRow([new Date(), uid, row[U.Usuario], m.modo === 'pve' ? 'Aventura ' + m.etapa : m.real ? 'Arena (jugador)' : 'Arena', m.rival, res, rondas || '', chips, dElo]);
    CacheService.getScriptCache().remove('ranking');
    return { resultado: res, chips, elo: dElo, nuevaEtapa: nueva, sinEnergia: !conPremio && !nueva && res === 'gana', perfil: perfil_(row) };
  });
}

/* ================= ADMINISTRACIÓN ================= */
/* Acceso: sesión de futurmovil.com@gmail.com + llave NFC (la primera que se pase queda registrada),
   QR para el ordenador (se autoriza pasando la llave en el móvil) o código de Google Authenticator. */
function tokenAdmin_() { const t = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().slice(0, 8); CacheService.getScriptCache().put('adm_' + t, '1', 14400); return t; }
function adminEntrar_(p) {
  let esAdmin = false; try { const s = sesion_(p.token); esAdmin = limpiaEmail_(s.row[U.Email]) === ADMIN_EMAIL; } catch (e) {}
  freno_('admllave', 10, 600);
  const llave = String(p.llave || '').toLowerCase().replace(/[^0-9a-f]/g, '');
  if (llave.length < 6) throw new Error('Llave no válida');
  const props = PropertiesService.getScriptProperties();
  let llaves = []; try { llaves = JSON.parse(props.getProperty('llaves') || '[]'); } catch (e) {}
  const h = sha_('criaturix|' + llave);
  let nueva = false;
  if (!llaves.length) {
    if (!esAdmin) throw new Error('Para registrar tu primera llave, entra antes con la cuenta ' + ADMIN_EMAIL);
    llaves.push(h); props.setProperty('llaves', JSON.stringify(llaves)); nueva = true;
  }
  else if (llaves.indexOf(h) < 0) throw new Error('Esta llave no está autorizada');
  const t = tokenAdmin_();
  if (p.qr) {
    const c = CacheService.getScriptCache();
    if (c.get('qr_' + p.qr) !== 'esperando') throw new Error('El código del ordenador ha caducado');
    c.put('qr_' + p.qr, t, 300);
  }
  return { ok: true, admin: t, nueva };
}
function qrNuevo_() { freno_('qrnuevo', 20, 600); const code = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').slice(0, 32); CacheService.getScriptCache().put('qr_' + code, 'esperando', 300); return { ok: true, code, seg: 300 }; }
function qrEstado_(p) { const c = CacheService.getScriptCache(), v = c.get('qr_' + String(p.code || '')); if (v && v !== 'esperando') { c.remove('qr_' + p.code); return { ok: true, admin: v }; } return { ok: true, admin: null }; }
function adminTotp_(p) {
  freno_('admtotp', 6, 900);
  const sec = PropertiesService.getScriptProperties().getProperty('totp');
  if (!sec) throw new Error('Google Authenticator no está configurado');
  if (!totpOk_(sec, String(p.codigo || '').replace(/\D/g, ''))) throw new Error('Código incorrecto');
  return { ok: true, admin: tokenAdmin_() };
}
function base32Nuevo_() { const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; const b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + Date.now()); let s = ''; for (let i = 0; i < 32; i++) s += abc[(b[i] & 255) % 32]; return s; }
function otpauth_() { const s = PropertiesService.getScriptProperties().getProperty('totp'); return 'otpauth://totp/CRIATURIX:admin?secret=' + s + '&issuer=CRIATURIX'; }
function b32bytes_(s) {
  const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '', out = [];
  s.replace(/=+$/, '').toUpperCase().split('').forEach(ch => { const v = abc.indexOf(ch); if (v >= 0) bits += ('00000' + v.toString(2)).slice(-5); });
  for (let i = 0; i + 8 <= bits.length; i += 8) { const v = parseInt(bits.substr(i, 8), 2); out.push(v > 127 ? v - 256 : v); }
  return out;
}
function totpOk_(sec, code) {
  if (!/^\d{6}$/.test(code)) return false;
  const key = b32bytes_(sec), t = Math.floor(Date.now() / 30000);
  for (let d = -1; d <= 1; d++) {
    let c = t + d; const msg = [];
    for (let i = 7; i >= 0; i--) { const v = c & 255; msg[i] = v > 127 ? v - 256 : v; c = Math.floor(c / 256); }
    const h = Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_1, msg, key).map(b => b & 255);
    const o = h[19] & 15, n = ((h[o] & 127) << 24 | h[o + 1] << 16 | h[o + 2] << 8 | h[o + 3]) % 1000000;
    if (('000000' + n).slice(-6) === code) return true;
  }
  return false;
}
function admin_(p) {
  if (!p.admin || !CacheService.getScriptCache().get('adm_' + p.admin)) return { ok: false, caducada: true, error: 'Sesión de administrador caducada' };
  const op = ADMIN_OPS[p.op]; if (!op) throw new Error('Operación desconocida');
  return op(p);
}
const ADMIN_OPS = {
  resumen: () => {
    const u = usuarios_().rows, cr = criaturas_().rows, ped = tabla_(hoja_('Pedidos', CAB_P), CAB_P.length);
    const pagado = ped.filter(x => x[P.Estado] === 'pagado');
    return { ok: true, jugadores: u.length, criaturas: cr.filter(r => r[C.Tipo] === 'criatura').length, huevos: cr.filter(r => r[C.Tipo] === 'huevo').length,
      pendientes: ped.filter(x => x[P.Estado] === 'pendiente').length, ventas: pagado.length, facturado: pagado.reduce((a, x) => a + num_(x[P.Importe]), 0),
      creditosJugadores: u.reduce((a, r) => a + num_(r[U.Creditos]), 0), enTienda: cr.filter(r => String(r[C.Dueno]) === TIENDA).length };
  },
  pedidos: p => {
    const ped = tabla_(hoja_('Pedidos', CAB_P), CAB_P.length), cr = criaturas_(), idx = {};
    cr.rows.forEach(r => idx[String(r[C.Id])] = r);
    const lista = ped.map(x => { const o = pedPub_(x, idx); if (o.item && idx[o.item.id]) o.item = pub_(idx[o.item.id], true); return o; }).reverse();
    return { ok: true, pendientes: lista.filter(x => x.estado === 'pendiente'), historial: lista.filter(x => x.estado !== 'pendiente').slice(0, 60) };
  },
  confirmar: p => conLock_(() => {
    const shP = hoja_('Pedidos', CAB_P), ped = tabla_(shP, CAB_P.length), i = buscar_(ped, P.Id, p.id);
    if (i < 0 || ped[i][P.Estado] !== 'pendiente') throw new Error('Ese pedido ya no está pendiente');
    if (ped[i][P.Tipo] === 'creditos') {   // recarga de créditos: se suman al comprador
      const x = ped[i], f = usuarios_(), ib = buscar_(f.rows, U.Id, x[P.IdComprador]);
      if (ib < 0) throw new Error('El comprador ya no existe');
      const cant = num_(x[P.Importe]);
      f.rows[ib][U.Creditos] = num_(f.rows[ib][U.Creditos]) + cant; guarda_(f.sh, ib, f.rows[ib]);
      mov_(String(x[P.IdComprador]), f.rows[ib][U.Usuario], 'Recarga de créditos (' + euros_(cant) + ' € en myPOS)', cant, 0, x[P.Id]);
      x[P.Estado] = 'pagado'; x[P.Resuelto] = new Date(); x[P.Nota] = 'Recarga de ' + cant + ' créditos'; guarda_(shP, i, x);
      return { ok: true };
    }
    const x = ped[i], cr = criaturas_(), j = buscar_(cr.rows, C.Id, x[P.IdCriatura]);
    if (j < 0) throw new Error('La criatura del pedido ya no existe');
    const r = cr.rows[j], f = usuarios_(), ib = buscar_(f.rows, U.Id, x[P.IdComprador]);
    if (ib < 0) throw new Error('El comprador ya no existe');
    const vendedor = String(x[P.IdVendedor]), cf = cfg_();
    r[C.Dueno] = String(x[P.IdComprador]); r[C.DuenoNombre] = f.rows[ib][U.Usuario]; r[C.Estado] = ''; r[C.Precio] = '';
    guarda_(cr.sh, j, r);
    let paraVendedor = 0;
    if (vendedor !== TIENDA) {
      const iv = buscar_(f.rows, U.Id, vendedor);
      if (iv >= 0) {
        paraVendedor = Math.floor(num_(x[P.Importe]) * cf.comision / 100);
        f.rows[iv][U.Creditos] = num_(f.rows[iv][U.Creditos]) + paraVendedor;
        quitarDeEquipo_(f.rows[iv], String(r[C.Id]));
        guarda_(f.sh, iv, f.rows[iv]);
        mov_(vendedor, f.rows[iv][U.Usuario], 'Venta de ' + nombreDe_(r) + ' a ' + f.rows[ib][U.Usuario], paraVendedor, 0, x[P.Id]);
      }
    }
    mov_(String(x[P.IdComprador]), f.rows[ib][U.Usuario], 'Compra de ' + nombreDe_(r) + ' (' + euros_(num_(x[P.Importe])) + ' € en myPOS)', 0, 0, x[P.Id]);
    x[P.Estado] = 'pagado'; x[P.Resuelto] = new Date(); x[P.Nota] = paraVendedor ? 'Vendedor recibe ' + paraVendedor + ' créditos' : 'Venta de la tienda';
    guarda_(shP, i, x);
    CacheService.getScriptCache().removeAll(['mercado']);
    return { ok: true, paraVendedor };
  }),
  rechazar: p => conLock_(() => {
    const shP = hoja_('Pedidos', CAB_P), ped = tabla_(shP, CAB_P.length), i = buscar_(ped, P.Id, p.id);
    if (i < 0 || ped[i][P.Estado] !== 'pendiente') throw new Error('Ese pedido ya no está pendiente');
    ped[i][P.Estado] = 'rechazado'; ped[i][P.Resuelto] = new Date(); ped[i][P.Nota] = String(p.nota || 'Pago no recibido').slice(0, 120); guarda_(shP, i, ped[i]);
    liberar_(ped[i][P.IdCriatura]);
    return { ok: true };
  }),
  crear: p => conLock_(() => {
    const n = Math.max(1, Math.min(20, parseInt(p.cantidad, 10) || 1)), precio = centimos_(p.precio), tipo = p.tipo === 'huevo' ? 'huevo' : 'criatura', out = [];
    for (let k = 0; k < n; k++) {
      let genes = p.genes;
      if (!genes || p.azar) genes = CX.genesAzar(Math.floor(Math.random() * 1e9), p.clase && CX.CLASES[p.clase] ? p.clase : null, p.pureza != null ? Number(p.pureza) : 0.5);
      if (!CX.validaGenes(genes)) throw new Error('Genes no válidos');
      out.push(crearCriatura_({ dueno: TIENDA, duenoNombre: 'Tienda oficial', tipo, genes, nombre: String(p.nombre || '').slice(0, 20).replace(/[<>]/g, ''), estado: precio > 0 ? 'venta' : '', precio: precio > 0 ? precio : '', eclosion: tipo === 'huevo' ? Date.now() : '', origen: 'Tienda' }));
    }
    CacheService.getScriptCache().remove('mercado');
    return { ok: true, creadas: out };
  }),
  tienda: () => { const cr = criaturas_(); return { ok: true, lista: cr.rows.filter(r => String(r[C.Dueno]) === TIENDA).map(r => pub_(r, true)).reverse() }; },
  precio: p => conLock_(() => {
    const cr = criaturas_(), i = buscar_(cr.rows, C.Id, p.id); if (i < 0 || String(cr.rows[i][C.Dueno]) !== TIENDA) throw new Error('No es de la tienda');
    if (cr.rows[i][C.Estado] === 'reservado') throw new Error('Tiene un pedido pendiente');
    const precio = centimos_(p.precio);
    cr.rows[i][C.Estado] = precio > 0 ? 'venta' : ''; cr.rows[i][C.Precio] = precio > 0 ? precio : '';
    if (p.nombre != null) cr.rows[i][C.Nombre] = String(p.nombre).slice(0, 20).replace(/[<>]/g, '');
    guarda_(cr.sh, i, cr.rows[i]); CacheService.getScriptCache().remove('mercado');
    return { ok: true, criatura: pub_(cr.rows[i], true) };
  }),
  borrar: p => conLock_(() => {
    const cr = criaturas_(), i = buscar_(cr.rows, C.Id, p.id); if (i < 0 || String(cr.rows[i][C.Dueno]) !== TIENDA) throw new Error('Solo se pueden borrar criaturas de la tienda');
    if (cr.rows[i][C.Estado] === 'reservado') throw new Error('Tiene un pedido pendiente');
    cr.sh.deleteRow(i + 2); CacheService.getScriptCache().remove('mercado');
    return { ok: true };
  }),
  entregar: p => conLock_(() => {
    const cr = criaturas_(), i = buscar_(cr.rows, C.Id, p.id); if (i < 0 || String(cr.rows[i][C.Dueno]) !== TIENDA) throw new Error('Solo se pueden regalar criaturas de la tienda');
    if (cr.rows[i][C.Estado] === 'reservado') throw new Error('Tiene un pedido pendiente');
    const f = usuarios_(); let j = buscar_(f.rows, U.Usuario, String(p.usuario || '').trim()); if (j < 0) j = buscar_(f.rows, U.Email, limpiaEmail_(p.usuario));
    if (j < 0) throw new Error('No encuentro ese jugador');
    cr.rows[i][C.Dueno] = f.rows[j][U.Id]; cr.rows[i][C.DuenoNombre] = f.rows[j][U.Usuario]; cr.rows[i][C.Estado] = ''; cr.rows[i][C.Precio] = '';
    guarda_(cr.sh, i, cr.rows[i]); CacheService.getScriptCache().remove('mercado');
    mov_(String(f.rows[j][U.Id]), f.rows[j][U.Usuario], 'Regalo de la tienda: ' + nombreDe_(cr.rows[i]), 0, 0, cr.rows[i][C.Id]);
    return { ok: true };
  }),
  jugadores: () => {
    const cr = criaturas_().rows, cuenta = {};
    cr.forEach(r => cuenta[r[C.Dueno]] = (cuenta[r[C.Dueno]] || 0) + 1);
    return { ok: true, lista: usuarios_().rows.map(r => ({ id: String(r[U.Id]), usuario: String(r[U.Usuario]), email: String(r[U.Email]), chips: num_(r[U.Chips]), creditos: num_(r[U.Creditos]),
      elo: num_(r[U.Elo]), etapa: num_(r[U.Etapa]), criaturas: cuenta[r[U.Id]] || 0, ultimo: r[U.UltimoAcceso] instanceof Date ? r[U.UltimoAcceso].getTime() : 0 })).reverse() };
  },
  saldo: p => conLock_(() => {
    const f = usuarios_(), i = buscar_(f.rows, U.Id, p.id); if (i < 0) throw new Error('No existe');
    const dc = parseInt(p.creditos, 10) || 0, dch = parseInt(p.chips, 10) || 0;
    f.rows[i][U.Creditos] = Math.max(0, num_(f.rows[i][U.Creditos]) + dc); f.rows[i][U.Chips] = Math.max(0, num_(f.rows[i][U.Chips]) + dch);
    guarda_(f.sh, i, f.rows[i]);
    mov_(String(p.id), f.rows[i][U.Usuario], String(p.nota || 'Ajuste del administrador').slice(0, 120), dc, dch, 'ADMIN');
    return { ok: true, creditos: num_(f.rows[i][U.Creditos]), chips: num_(f.rows[i][U.Chips]) };
  }),
  ajustes: () => ({ ok: true, lista: tabla_(hojaConfig_(), 3).filter(r => r[0]).map(r => ({ k: r[0], v: r[1], ayuda: r[2] })) }),
  guardarAjustes: p => {
    const sh = hojaConfig_(), rows = tabla_(sh, 3), vals = p.valores || {};
    rows.forEach((r, i) => { if (Object.prototype.hasOwnProperty.call(vals, r[0])) sh.getRange(i + 2, 2).setValue(String(vals[r[0]]).slice(0, 300)); });
    CacheService.getScriptCache().remove('cfg');
    return { ok: true };
  },
  totp: () => { const pr = PropertiesService.getScriptProperties(); if (!pr.getProperty('totp')) pr.setProperty('totp', base32Nuevo_()); return { ok: true, url: otpauth_(), secreto: pr.getProperty('totp') }; },
  borrarLlaves: () => { PropertiesService.getScriptProperties().deleteProperty('llaves'); return { ok: true }; }
};
