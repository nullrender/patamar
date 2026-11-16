/* ===== INTERFACE ===== */
const $ = id => document.getElementById(id);
const LS_KEY = 'patamar-v1';
let S = Object.assign({}, DEFAULTS);
let VIEW = 'planta', YAW = -32, PIT = 42, CUR = null, THEME = null, CV3 = null;

function getTheme() {
  const cs = getComputedStyle(document.documentElement), g = n => cs.getPropertyValue(n).trim();
  return { paper: g('--paper'), ink: g('--ink'), muted: g('--muted'), line: g('--line'), accent: g('--accent'), info: g('--info'), tread: g('--tread'), winder: g('--winder'), patamar: g('--patamar'), piso: g('--piso'), t3: g('--t3'), w3: g('--w3'), p3: g('--p3'), f3: g('--f3'), ground: g('--ground') };
}
const plain = v => String(Math.round(v * 100) / 100).replace('.', ',');
/* leitura estrita: aceita 280, 17,5 ou 17.5; recusa vazio, letras e separador de milhar */
const parseNum = s => { const t = String(s).trim(); if (!/^[+-]?\d+(?:[.,]\d+)?$/.test(t) || /^[+-]?\d{1,3}\.\d{3}$/.test(t)) return NaN; /* "1.000" é ambíguo (milhar?), então é recusado */ const v = Number(t.replace(',', '.')); return isFinite(v) ? v : NaN; };
const BAD = {};

function load() {
  try { const j = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); if (j && j.S) S = Object.assign(S, j.S); } catch (e) { }
  const h = (location.hash || '').slice(1);
  const m = h.match(/^(.*?)(?:-(planta|corte|3d|explica))?$/);
  if (m && TIPOS.some(t => t.id === m[1])) { S.tipo = m[1]; VIEW = m[2] || 'planta'; }
}
function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ S })); } catch (e) { }
  try { history.replaceState(null, '', '#' + S.tipo + (VIEW === 'planta' ? '' : '-' + VIEW)); } catch (e) { }
}

const FIELDS = [
  { id: 'H', key: 'H', kind: 'num' }, { id: 'L', key: 'L', kind: 'num' },
  { id: 'N', key: 'N', kind: 'int', auto: 'nAuto' }, { id: 'p', key: 'p', kind: 'num', auto: 'pAuto' },
  { id: 'n1', key: 'n1', kind: 'int', auto: 'n1Auto' }, { id: 'Lp', key: 'Lp', kind: 'num', auto: 'LpAuto' },
  { id: 'nMeio', key: 'nMeio', kind: 'int' }, { id: 'vao', key: 'vao', kind: 'num' },
  { id: 'D', key: 'D', kind: 'num' }, { id: 'Dc', key: 'Dc', kind: 'num' },
  { id: 'hLivre', key: 'hLivre', kind: 'num' }, { id: 'espLaje', key: 'espLaje', kind: 'num' },
  { id: 'tLaje', key: 'tLaje', kind: 'num' }, { id: 'espDegrau', key: 'espDegrau', kind: 'num' },
  { id: 'zCorte', key: 'zCorte', kind: 'num' },
  { id: 'cEmin', key: 'cEmin', kind: 'num' }, { id: 'cEmax', key: 'cEmax', kind: 'num' }, { id: 'cPmin', key: 'cPmin', kind: 'num' }, { id: 'cPmax', key: 'cPmax', kind: 'num' },
  { id: 'cBmin', key: 'cBmin', kind: 'num' }, { id: 'cBmax', key: 'cBmax', kind: 'num' }, { id: 'cLmin', key: 'cLmin', kind: 'num' }, { id: 'cHpat', key: 'cHpat', kind: 'num' }, { id: 'cDw', key: 'cDw', kind: 'num' },
];

function mount() {
  const norm = Object.keys(NORMAS).map(k => '<option value="' + k + '">' + NORMAS[k].nome + '</option>').join('') + '<option value="custom">Personalizada (digite os limites)</option>';
  $('ctrl').innerHTML =
    '<section class="card o1"><h2>Tipo de escada</h2><div id="tipos" class="tipos" role="radiogroup" aria-label="Tipo de escada"></div></section>' +
    '<section class="card o2"><h2>Medidas</h2><div class="grid2">' +
    fieldNum('H', 'Desnível piso a piso', 'cm', 'Do piso de baixo ao piso de cima, acabados.') + fieldNum('L', 'Largura útil', 'cm', 'Espaço livre para passar, entre paredes ou guardas.') + '</div>' +
    '<div class="field"><label for="norma">Referência de limites</label><select id="norma">' + norm + '</select></div>' +
    '<div id="customNorm" hidden><p class="hint" style="margin:0 0 8px">Digite os limites que o seu professor ou o código de obras da cidade usa.</p><div class="grid2">' + fieldNum('cEmin', 'Espelho mínimo', 'cm') + fieldNum('cEmax', 'Espelho máximo', 'cm') + fieldNum('cPmin', 'Piso mínimo', 'cm') + fieldNum('cPmax', 'Piso máximo', 'cm') + fieldNum('cBmin', 'Blondel mínimo', 'cm') + fieldNum('cBmax', 'Blondel máximo', 'cm') + fieldNum('cLmin', 'Largura mínima', 'cm') + fieldNum('cHpat', 'Desnível máx. sem patamar', 'cm') + fieldNum('cDw', 'Linha de caminhamento (do lado interno)', 'cm') + '</div></div>' +
    '<div class="field" data-for="l-patamar l-leque u-patamar u-leque helicoidal"><span class="lab" id="ladoLab">Ao subir, a escada vira para</span><div class="seg" id="lado" role="group" aria-labelledby="ladoLab"><button type="button" data-v="dir">Direita</button><button type="button" data-v="esq">Esquerda</button></div></div></section>' +
    '<section class="card"><h2>Degraus</h2>' +
    '<div class="field"><div class="labrow"><label for="N">Número de espelhos</label><label class="auto"><input type="checkbox" id="nAuto"> sugerido</label></div><div class="stepper"><button type="button" id="Nminus" aria-label="Menos um espelho">−</button><input id="N" type="text" inputmode="numeric" autocomplete="off"><button type="button" id="Nplus" aria-label="Mais um espelho">+</button></div><p class="hint" id="Nhint"></p></div>' +
    '<div class="field"><div class="labrow"><label for="p" id="pLab">Piso (profundidade)</label><label class="auto"><input type="checkbox" id="pAuto"> pela fórmula</label></div><div class="inp"><input id="p" type="text" inputmode="decimal" autocomplete="off"><span class="un">cm</span></div></div>' +
    '<div class="field" data-for="reta-patamar l-patamar l-leque u-patamar u-leque"><div class="labrow"><label for="n1">Pisos no 1º lance</label><label class="auto"><input type="checkbox" id="n1Auto"> dividir ao meio</label></div><div class="inp"><input id="n1" type="text" inputmode="numeric" autocomplete="off"><span class="un" id="n1Un"></span></div></div></section>' +
    '<section class="card" id="cardEsp"><h2>Detalhes do tipo</h2>' +
    '<div class="field" data-for="l-leque u-leque"><label for="kLeque">Leques em cada curva</label><select id="kLeque"><option value="2">2 leques (45° cada)</option><option value="3">3 leques (30° cada)</option><option value="4">4 leques (22,5° cada)</option></select></div>' +
    '<div class="field" data-for="u-leque"><label for="nMeio">Pisos retos entre as duas curvas</label><div class="inp"><input id="nMeio" type="text" inputmode="numeric" autocomplete="off"><span class="un">pisos</span></div><p class="hint" id="nMeioHint"></p></div>' +
    '<div class="field" data-for="u-patamar"><label for="vao">Vão entre os dois lances</label><div class="inp"><input id="vao" type="text" inputmode="decimal" autocomplete="off"><span class="un">cm</span></div></div>' +
    '<div class="field" data-for="reta-patamar u-patamar"><div class="labrow"><label for="Lp">Profundidade do patamar</label><label class="auto"><input type="checkbox" id="LpAuto"> igual à largura</label></div><div class="inp"><input id="Lp" type="text" inputmode="decimal" autocomplete="off"><span class="un">cm</span></div></div>' +
    '<div class="grid2" data-for="helicoidal">' + fieldNum('D', 'Diâmetro externo', 'cm') + fieldNum('Dc', 'Diâmetro do pilar', 'cm') + '</div>' +
    '<p class="hint" id="semDetalhe" data-for="reta">Esse tipo não tem detalhes extras. Ajuste só as medidas e os degraus.</p></section>' +
    '<details class="card"><summary>Altura livre e laje</summary><div class="grid2" style="margin-top:12px">' +
    fieldNum('hLivre', 'Altura livre mínima', 'cm') + fieldNum('espLaje', 'Laje do piso de cima', 'cm') +
    '<div data-for="reta reta-patamar l-patamar l-leque u-patamar u-leque">' + fieldNum('tLaje', 'Laje da escada', 'cm') + '</div>' +
    '<div data-for="helicoidal">' + fieldNum('espDegrau', 'Espessura do degrau', 'cm') + '</div></div></details>';
  $('tabs').innerHTML = [['planta', 'Planta'], ['corte', 'Perfil'], ['3d', '3D'], ['explica', 'Explicação']].map(v => '<button type="button" role="tab" data-v="' + v[0] + '" id="tab-' + v[0] + '">' + v[1] + '</button>').join('');
}
function fieldNum(id, label, unit, hint) {
  return '<div class="field"><label for="' + id + '">' + label + '</label><div class="inp"><input id="' + id + '" type="text" inputmode="decimal" autocomplete="off"><span class="un">' + unit + '</span></div>' + (hint ? '<p class="hint">' + hint + '</p>' : '') + '</div>';
}

function bind() {
  FIELDS.forEach(f => {
    const el = $(f.id); if (!el) return;
    el.addEventListener('input', () => {
      const v = parseNum(el.value);
      if (isNaN(v) || (f.kind === 'int' && Math.round(v) !== v)) { BAD[f.id] = true; el.classList.add('err'); render(true); return; }
      delete BAD[f.id]; el.classList.remove('err');
      S[f.key] = v;
      if (f.auto) { S[f.auto] = false; $(f.auto).checked = false; }
      render(true);
    });
    el.addEventListener('blur', () => render());
    if (f.auto) $(f.auto).addEventListener('change', e => { S[f.auto] = e.target.checked; render(); });
  });
  $('norma').addEventListener('change', e => {
    const v = e.target.value;
    if (v === 'custom' && S.norma !== 'custom') { const b = NORMAS[S.norma] || NORMAS.res; Object.assign(S, { cEmin: b.eMin, cEmax: b.eMax, cPmin: b.pMin, cPmax: b.pMax, cBmin: b.bMin, cBmax: b.bMax, cLmin: b.Lmin, cHpat: b.hPat, cDw: b.dw }); }
    S.norma = v; render();
  });
  $('modoP').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.modoPlanta = b.dataset.v; render(); });
  $('showDims').addEventListener('change', e => { S.showDims = e.target.checked; render(); });
  $('showNums').addEventListener('change', e => { S.showNums = e.target.checked; render(); });
  $('kLeque').addEventListener('change', e => { S.kLeque = +e.target.value; render(); });
  $('lado').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.lado = b.dataset.v; render(); });
  $('Nminus').addEventListener('click', () => { S.nAuto = false; S.N = Math.max(2, (CUR ? CUR.N : S.N) - 1); render(); });
  $('Nplus').addEventListener('click', () => { S.nAuto = false; S.N = (CUR ? CUR.N : S.N) + 1; render(); });
  $('tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; VIEW = b.dataset.v; render(); });
  $('tipos').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.tipo = b.dataset.v; render(); });
  $('yaw').addEventListener('input', e => { YAW = +e.target.value; draw3d(false); });
  $('pit').addEventListener('input', e => { PIT = +e.target.value; draw3d(false); });
  $('btnResumo').addEventListener('click', () => copiar(resumo(), 'Resumo copiado'));
  $('btnSvg').addEventListener('click', () => { if (VIEW === '3d') return; copiar(VIEW === 'corte' ? sectionSVG(CUR, { pxW: 1400 }, THEME) : planSVG(CUR, { pxW: 1400 }, THEME), 'SVG copiado'); });
  $('btnImg').addEventListener('click', gerarImagem);
  $('modalClose').addEventListener('click', () => $('modal').hidden = true);
  $('modal').addEventListener('click', e => { if (e.target.id === 'modal') $('modal').hidden = true; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $('modal').hidden = true; });
  CV3 = $('cv3');
  let drag = null;
  CV3.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, yaw: YAW, pit: PIT }; CV3.setPointerCapture(e.pointerId); });
  CV3.addEventListener('pointermove', e => { if (!drag) return; YAW = ((drag.yaw + (e.clientX - drag.x) * 0.5) % 360 + 540) % 360 - 180; PIT = clamp(drag.pit + (e.clientY - drag.y) * 0.3, 12, 80); $('yaw').value = Math.round(YAW); $('pit').value = Math.round(PIT); draw3d(false); });
  const end = () => { if (drag) { drag = null; draw3d(true); } };
  CV3.addEventListener('pointerup', end); CV3.addEventListener('pointercancel', end);
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) mq.addEventListener('change', () => { THEME = null; renderTypes(); render(); });
  new MutationObserver(() => { THEME = null; renderTypes(); render(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

function renderTypes() {
  THEME = THEME || getTheme();
  $('tipos').innerHTML = TIPOS.map(t => {
    const R = calc({ tipo: t.id, H: 280, L: 90, norma: 'res', D: 220 });
    return '<button type="button" role="radio" data-v="' + t.id + '" aria-checked="false" title="' + t.desc + '"><span class="th">' + planSVG(R, { thumb: true }, THEME) + '</span><span class="nm">' + t.nome + '</span></button>';
  }).join('');
}

function setVal(id, v, force) { const el = $(id); if (!el) return; if (force || document.activeElement !== el) el.value = v; }

function falha(msg) {
  CUR = null;
  ['tiles', 'memo', 'checks', 'legend'].forEach(id => { $(id).innerHTML = ''; });
  $('stage').dataset.view = 'erro';
  $('stage').innerHTML = '<div class="errbox"><b>Não dá para calcular com essas medidas.</b><p>' + msg + '</p><p>Nada foi desenhado para não mostrar uma escada que não corresponde ao que você pediu.</p></div>';
  $('checkSum').className = 'cs bad'; $('checkSum').textContent = 'Entrada ou configuração inválida';
  ['btnImg', 'btnSvg', 'btnResumo'].forEach(id => { $(id).disabled = true; });
  $('view3dBar').hidden = true; $('viewPlantaBar').hidden = true;
}
function render(typing) {
  THEME = THEME || getTheme();
  document.querySelectorAll('[data-for]').forEach(el => { el.hidden = el.dataset.for.split(' ').indexOf(S.tipo) < 0; });
  document.querySelectorAll('#tipos button').forEach(b => { const on = b.dataset.v === S.tipo; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
  document.querySelectorAll('#tabs button').forEach(b => { const on = b.dataset.v === VIEW; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  $('customNorm').hidden = S.norma !== 'custom';
  /* só conta campo inválido que está à vista e em uso (não oculto, não no automático) */
  const bad = Object.keys(BAD).filter(id => { const el = $(id); if (!el || el.closest('[hidden]')) return false; const f = FIELDS.find(x => x.id === id); return !(f && f.auto && S[f.auto]); });
  if (bad.length) { const lab = bad.map(id => { const l = document.querySelector('label[for="' + id + '"]'); return l ? l.textContent : id; }); falha('Campo com valor que não é número: ' + lab.join(', ') + '. Use só algarismos, com vírgula para decimal (ex.: 17,5), sem ponto de milhar (escreva 1000, não 1.000).'); return; }
  let R;
  try { R = calc(S); } catch (err) { if (!err.patamar) console.error(err); falha(err.message); return; }
  CUR = R;
  ['btnImg', 'btnSvg', 'btnResumo'].forEach(id => { $(id).disabled = false; });
  /* controles */
  document.querySelectorAll('[data-for]').forEach(el => { el.hidden = el.dataset.for.split(' ').indexOf(S.tipo) < 0; });
  document.querySelectorAll('#tipos button').forEach(b => { const on = b.dataset.v === S.tipo; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
  document.querySelectorAll('#lado button').forEach(b => b.classList.toggle('on', b.dataset.v === S.lado));
  document.querySelectorAll('#tabs button').forEach(b => { const on = b.dataset.v === VIEW; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  $('norma').value = S.norma; $('customNorm').hidden = S.norma !== 'custom';
  ['cEmin','cEmax','cPmin','cPmax','cBmin','cBmax','cLmin','cHpat','cDw'].forEach(k => setVal(k, plain(S[k])));
  setVal('zCorte', plain(S.zCorte)); $('showDims').checked = S.showDims !== false; $('showNums').checked = S.showNums !== false;
  document.querySelectorAll('#modoP button').forEach(b => b.classList.toggle('on', b.dataset.v === S.modoPlanta));
  $('zcWrap').hidden = S.modoPlanta === 'sup';
  $('kLeque').value = String(R.kw);
  FIELDS.forEach(f => { if (f.auto) $(f.auto).checked = !!S[f.auto]; });
  setVal('H', plain(S.H)); setVal('L', plain(S.L)); setVal('hLivre', plain(S.hLivre)); setVal('espLaje', plain(S.espLaje)); setVal('tLaje', plain(S.tLaje)); setVal('espDegrau', plain(S.espDegrau));
  setVal('D', plain(S.D)); setVal('Dc', plain(S.Dc)); setVal('vao', plain(S.vao)); setVal('nMeio', String(R.nMeio));
  setVal('N', String(R.N)); setVal('p', S.pAuto ? plain(R.hel ? R.pAlvo : R.pInput) : plain(S.p)); setVal('n1', String(R.a)); setVal('Lp', plain(R.Lp));
  $('pLab').textContent = R.hel ? 'Piso desejado (linha de caminhamento)' : 'Piso (profundidade)';
  $('Nhint').textContent = 'Sugestão: ' + R.nSug + ' espelhos (espelho de ' + fmt(S.H / R.nSug, 2) + ' cm). Atual: ' + fmt(R.e, 2) + ' cm.';
  $('n1Un').textContent = 'de ' + Math.max(0, R.avail) + ' pisos retos';
  $('nMeioHint').textContent = 'Vão central entre os lances: ' + fmt(R.nMeio * R.p) + ' cm.';
  /* resultados */
  const incl = R.incl;
  $('tiles').innerHTML = [
    ['Espelhos', R.N, 'altura ' + fmt(R.e, 2) + ' cm'],
    ['Pisos', R.nReto + R.nLeque, R.hel ? 'degraus' : [R.nLeque ? R.nReto + ' retos + ' + R.nLeque + ' leques' : 'pisos comuns', R.nPat ? '+ ' + R.nPat + ' patamar' : ''].filter(Boolean).join(' ')],
    ['Piso', fmt(R.p, 1) + ' cm', R.hel ? 'na linha de caminhamento' : 'profundidade'],
    ['Blondel', fmt(R.bl, 1) + ' cm', '2e + p'],
    ['Inclinação', fmt(incl, 1) + '°', fmt(R.e / R.p * 100, 0) + '%'],
    ['Em planta', fmt((R.bbox[2] - R.bbox[0]) / 100, 2) + ' × ' + fmt((R.bbox[3] - R.bbox[1]) / 100, 2), R.hel ? 'm · círculo de ' + fmt(R.areaOcup / 10000, 2) + ' m²' : 'm (retângulo) · ocupa ' + fmt(R.areaOcup / 10000, 2) + ' m²'],
  ].map(t => '<div class="tile"><span class="tl">' + t[0] + '</span><span class="tv">' + t[1] + '</span><span class="ts">' + t[2] + '</span></div>').join('');
  const cnt = { ok: 0, warn: 0, bad: 0 }; R.checks.forEach(c => { if (cnt[c.status] !== undefined) cnt[c.status]++; });
  const sev = cnt.bad ? 'bad' : cnt.warn ? 'warn' : 'ok';
  $('checkSum').className = 'cs ' + sev;
  $('checkSum').textContent = cnt.bad ? cnt.bad + ' fora da referência' + (cnt.warn ? ' e ' + cnt.warn + ' em atenção' : '') : cnt.warn ? cnt.warn + ' em atenção' : 'Tudo dentro da referência';
  const lab = { ok: 'ok', warn: 'atenção', bad: 'fora', info: 'info' };
  $('checks').innerHTML = R.checks.map(c => '<li class="ck ' + c.status + '"><span class="pill">' + lab[c.status] + '</span><div class="cb"><div class="cn">' + c.nome + '</div><div class="cv"><b>' + c.valor + '</b>' + (c.regra ? ' <span>referência ' + c.regra + '</span>' : '') + '</div>' + (c.nota ? '<div class="cnote">' + c.nota + '</div>' : '') + '</div></li>').join('');
  $('memo').innerHTML = R.memo.map(t => '<li>' + t + '</li>').join('');
  $('title').textContent = TIPOS.find(t => t.id === S.tipo).nome;
  $('desc').textContent = TIPOS.find(t => t.id === S.tipo).desc + '. ' + R.nm.nome + '.';
  /* legenda */
  const lg = [['sw', 'var(--tread)', 'Degrau reto']];
  if (R.polys.some(p => p.kind === 'leque')) lg.push(['sw', 'var(--winder)', 'Leque']);
  if (R.polys.some(p => p.kind === 'patamar')) lg.push(['sw', 'var(--patamar)', 'Patamar']);
  const lgH = lg.map(l => '<span class="lg"><i class="sw" style="background:' + l[1] + '"></i>' + l[2] + '</span>').join('');
  $('legend').innerHTML = VIEW === '3d' ? lgH + '<span class="lg">Volumes esquemáticos, só para visualizar. Arraste para girar.</span>' : lgH + '<span class="lg"><i class="ln"></i>Linha de caminhamento</span>' + (R.opening ? '<span class="lg"><i class="ln dash"></i>Vão mínimo na laje</span>' : '') + '<span class="lg">Cotas em cm.</span>';
  $('view3dBar').hidden = VIEW !== '3d';
  $('viewPlantaBar').hidden = VIEW !== 'planta';
  $('btnSvg').hidden = VIEW === '3d' || VIEW === 'explica';
  $('btnImg').hidden = VIEW === 'explica';
  $('legend').hidden = VIEW === 'explica';
  /* palco */
  $('stage').dataset.view = VIEW;
  if (VIEW === 'planta') { $('stage').innerHTML = planSVG(R, {}, THEME); }
  else if (VIEW === 'corte') { $('stage').innerHTML = sectionSVG(R, {}, THEME) + '<p class="cap">Perfil desenvolvido (esquema): a escada é esticada ao longo da linha de caminhamento, então curvas e leques viram trecho reto. Não é um corte A-A da edificação.</p>'; }
  else if (VIEW === 'explica') { $('stage').innerHTML = explicacao(R, S, THEME); }
  else { $('stage').innerHTML = ''; $('stage').appendChild(CV3); draw3d(true); }
  save();
}

function draw3d(hq) {
  if (VIEW !== '3d' || !CUR) return;
  const box = $('stage'), cw = Math.max(280, box.clientWidth || 640);
  const k = hq ? 2 : 1;
  CV3.width = Math.round(cw * k); CV3.height = Math.round(Math.min(cw * 0.78, 620) * k);
  CV3.style.width = '100%'; CV3.style.height = 'auto';
  render3D(CV3, CUR, { yaw: YAW, pitch: PIT }, THEME || getTheme());
}

function resumo() {
  const R = CUR, t = TIPOS.find(x => x.id === S.tipo);
  return 'Escada ' + t.nome.toLowerCase() + ' (' + R.nm.nome + ')\n' +
    'Desnível ' + fmt(R.H) + ' cm · largura ' + fmt(R.L) + ' cm\n' +
    R.N + ' espelhos de ' + fmt(R.e, 2) + ' cm · ' + R.contagem + ' · piso ' + fmt(R.p, 1) + ' cm · Blondel ' + fmt(R.bl, 1) + ' cm\n' +
    'Inclinação ' + fmt(R.incl, 1) + '°\n\n' + R.memo.join('\n') + '\n\nVerificações:\n' + R.checks.map(c => '- ' + c.nome + ': ' + c.valor + (c.regra ? ' (ref. ' + c.regra + ')' : '') + ' [' + c.status + ']').join('\n');
}

let toastT = null;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1800); }
function copiar(txt, msg) {
  const fallback = () => { const ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) { } ta.remove(); toast(ok ? msg : 'Não consegui copiar'); };
  try { navigator.clipboard.writeText(txt).then(() => toast(msg), fallback); } catch (e) { fallback(); }
}

function gerarImagem() {
  const T = THEME || getTheme();
  const done = url => { $('modalImg').src = url; const a = $('modalDl'); a.href = url; a.download = 'patamar-' + S.tipo + '-' + VIEW + '.png'; $('modal').hidden = false; };
  if (VIEW === '3d') { draw3d(true); done(CV3.toDataURL('image/png')); return; }
  const svg = VIEW === 'corte' ? sectionSVG(CUR, { pxW: 1600 }, T) : planSVG(CUR, { pxW: 1600 }, T);
  const m = svg.match(/width="(\d+)" height="(\d+)"/); const w = +m[1], h = +m[2];
  const img = new Image(), url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  img.onload = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = T.paper; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url); done(c.toDataURL('image/png')); };
  img.onerror = () => toast('Não consegui gerar a imagem');
  img.src = url;
}

window.addEventListener('DOMContentLoaded', () => {
  load(); mount(); bind(); renderTypes(); render();
  let rt = null; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => draw3d(true), 120); });
  window.addEventListener('hashchange', () => { const before = S.tipo + VIEW; load(); if (S.tipo + VIEW !== before) render(); });
});
