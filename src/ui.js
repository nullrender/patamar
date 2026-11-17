/* ===== INTERFACE ===== */
const $ = id => document.getElementById(id);
const LS_KEY = 'patamar-v1';
let S = Object.assign({}, DEFAULTS);
let VIEW = 'planta', YAW = -32, PIT = 42, CUR = null, THEME = null, CV3 = null;
/* painel visível no celular (Dados, Desenho ou Verificações); em telas maiores os três aparecem juntos */
let PAINEL = 'desenho';
const TEMA_KEY = 'patamar-tema';

function getTheme() {
  const cs = getComputedStyle(document.documentElement), g = n => cs.getPropertyValue(n).trim();
  return { paper: g('--paper'), ink: g('--ink'), muted: g('--muted'), line: g('--line'), accent: g('--accent'), info: g('--info'), tread: g('--tread'), winder: g('--winder'), patamar: g('--patamar'), piso: g('--piso'), t3: g('--t3'), w3: g('--w3'), p3: g('--p3'), f3: g('--f3'), ground: g('--ground'), ok: g('--ok') };
}
const plain = v => String(Math.round(v * 100) / 100).replace('.', ',');
/* leitura estrita: aceita 280, 17,5 ou 17.5; recusa vazio, letras e separador de milhar */
const parseNum = s => { const t = String(s).trim(); if (!/^[+-]?\d+(?:[.,]\d+)?$/.test(t) || /^[+-]?\d{1,3}\.\d{3}$/.test(t)) return NaN; /* "1.000" é ambíguo (milhar?), então é recusado */ const v = Number(t.replace(',', '.')); return isFinite(v) ? v : NaN; };
const BAD = {};

/* Perfis que deixaram de existir: 'sec' (escada secundária) e 'serv' (escada de serviço) vinham da NBR 9077:2001, 4.7.5,
   cancelada pela edição de 2025. Quem tinha um deles salvo passa para 'mez' (NBR 9077:2025, 9.5.9.1) e vê um aviso.
   Devolve true quando trocou. */
function migrarNorma(s) {
  if (s && (s.norma === 'sec' || s.norma === 'serv')) { s.norma = 'mez'; return true; }
  return false;
}
const AVISO_MIGRA = 'O perfil que você usava vinha da NBR 9077:2001, cancelada pela edição de 2025. Agora usamos \u201cMezanino ou área privativa (NBR 9077:2025, 9.5.9.1)\u201d.';

function load() {
  try { const j = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); if (j && j.S) S = Object.assign(S, j.S); } catch (e) { }
  if (migrarNorma(S)) { const a = $('avisoMigra'); if (a) { $('avisoMigraTxt').textContent = AVISO_MIGRA; a.hidden = false; } }
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
  { id: 'nMeio', key: 'nMeio', kind: 'int' }, { id: 'nPer', key: 'nPer', kind: 'int', auto: 'nPerAuto' }, { id: 'nMeioP', key: 'nMeioP', kind: 'int', auto: 'nMeioPAuto' }, { id: 'vao', key: 'vao', kind: 'num' },
  { id: 'D', key: 'D', kind: 'num' }, { id: 'Dc', key: 'Dc', kind: 'num' },
  { id: 'hLivre', key: 'hLivre', kind: 'num' }, { id: 'espLaje', key: 'espLaje', kind: 'num' },
  { id: 'tLaje', key: 'tLaje', kind: 'num' }, { id: 'espDegrau', key: 'espDegrau', kind: 'num' },
  { id: 'zCorte', key: 'zCorte', kind: 'num' }, { id: 'avanco', key: 'avanco', kind: 'num' },
  { id: 'cEmin', key: 'cEmin', kind: 'num' }, { id: 'cEmax', key: 'cEmax', kind: 'num' }, { id: 'cPmin', key: 'cPmin', kind: 'num' }, { id: 'cPmax', key: 'cPmax', kind: 'num' },
  { id: 'cBmin', key: 'cBmin', kind: 'num' }, { id: 'cBmax', key: 'cBmax', kind: 'num' }, { id: 'cLmin', key: 'cLmin', kind: 'num' }, { id: 'cHpat', key: 'cHpat', kind: 'num' }, { id: 'cDw', key: 'cDw', kind: 'num' }, { id: 'cLq', key: 'cLq', kind: 'num' },
];

function mount() {
  /* no seletor vai o rótulo curto (cabe no celular); o nome completo aparece na dica embaixo */
  const norm = Object.keys(NORMAS).map(k => '<option value="' + k + '">' + rotuloNorma(k) + '</option>').join('') + '<option value="custom">Personalizada</option>';
  $('ctrl').innerHTML =
    '<section class="card"><h2>Medidas</h2><div class="grid2">' +
    fieldNum('H', 'Desnível piso a piso', 'cm', 'Do piso de baixo ao piso de cima, acabados.') + fieldNum('L', 'Largura útil', 'cm', 'Espaço livre para passar, entre paredes ou guardas.') + '</div>' +
    '<div class="field"><label for="norma">Referência de limites</label><select id="norma" aria-describedby="normaHint">' + norm + '</select><p class="hint" id="normaHint"></p></div>' +
    '<div id="customNorm" hidden><p class="hint" style="margin:0 0 8px">Digite os limites que o seu professor ou o código de obras da cidade usa.</p><div class="grid2">' + fieldNum('cEmin', 'Espelho mínimo', 'cm') + fieldNum('cEmax', 'Espelho máximo', 'cm') + fieldNum('cPmin', 'Piso mínimo', 'cm') + fieldNum('cPmax', 'Piso máximo', 'cm') + fieldNum('cBmin', 'Blondel mínimo', 'cm') + fieldNum('cBmax', 'Blondel máximo', 'cm') + fieldNum('cLmin', 'Largura mínima', 'cm') + fieldNum('cHpat', 'Desnível máx. sem patamar', 'cm') + fieldNum('cDw', 'Linha de caminhamento (do lado interno)', 'cm') + fieldNum('cLq', 'Ponta mínima do leque', 'cm') + '</div></div>' +
    '<div class="field" data-for="l-patamar l-leque u-patamar u-leque c-patamar z-patamar helicoidal"><span class="lab" id="ladoLab">Ao subir, a escada vira para</span><div class="seg" id="lado" role="group" aria-labelledby="ladoLab"><button type="button" data-v="dir">Direita</button><button type="button" data-v="esq">Esquerda</button></div></div></section>' +
    '<section class="card"><h2>Degraus</h2>' +
    '<div class="field"><div class="labrow"><label for="N">Número de espelhos</label><label class="auto"><input type="checkbox" id="nAuto"> sugerido</label></div><div class="stepper"><button type="button" id="Nminus" aria-label="Menos um espelho">−</button><input id="N" type="text" inputmode="numeric" autocomplete="off"><button type="button" id="Nplus" aria-label="Mais um espelho">+</button></div><p class="hint" id="Nhint"></p></div>' +
    '<div class="field"><div class="labrow"><label for="p" id="pLab">Piso (profundidade)</label><label class="auto"><input type="checkbox" id="pAuto"> pela fórmula</label></div><div class="inp"><input id="p" type="text" inputmode="decimal" autocomplete="off"><span class="un">cm</span></div></div>' +
    '<div class="field"><span class="lab" id="bocLab">Borda do degrau</span><div class="seg" id="bocel" role="group" aria-labelledby="bocLab"><button type="button" data-v="bocel">Bocel</button><button type="button" data-v="inclinado">Espelho inclinado</button><button type="button" data-v="sem">Sem saliência</button></div></div>' +
    '<div class="field" id="avancoWrap"><label for="avanco">Avanço sobre o degrau de baixo</label><div class="inp"><input id="avanco" type="text" inputmode="decimal" autocomplete="off"><span class="un">cm</span></div><p class="hint" id="bocHint"></p></div>' +
    '<div class="field" data-for="reta-patamar l-patamar l-leque u-patamar u-leque c-patamar z-patamar"><div class="labrow"><label for="n1">Pisos no 1º lance</label><label class="auto"><input type="checkbox" id="n1Auto"> dividir ao meio</label></div><div class="inp"><input id="n1" type="text" inputmode="numeric" autocomplete="off"><span class="un" id="n1Un"></span></div></div></section>' +
    '<section class="card" id="cardEsp"><h2>Detalhes do tipo</h2>' +
    '<div class="field" data-for="l-leque u-leque"><span class="lab" id="lqLab">Forma dos leques</span><div class="seg" id="leque" role="group" aria-labelledby="lqLab"><button type="button" data-v="bal">Balanceados</button><button type="button" data-v="conv">Convergentes</button></div><p class="hint" id="lqHint"></p></div>' +
    '<div class="field" data-for="l-leque u-leque"><label for="kLeque" id="kLab">Degraus em cada curva</label><select id="kLeque"></select><p class="hint" id="kHint"></p></div>' +
    '<div class="field" data-for="u-leque"><label for="nMeio">Pisos retos entre as duas curvas</label><div class="inp"><input id="nMeio" type="text" inputmode="numeric" autocomplete="off"><span class="un">pisos</span></div><p class="hint" id="nMeioHint"></p></div>' +
    '<div class="field" data-for="u-patamar"><label for="vao">Vão entre os dois lances</label><div class="inp"><input id="vao" type="text" inputmode="decimal" autocomplete="off"><span class="un">cm</span></div></div>' +
    '<div class="field" data-for="reta-patamar u-patamar"><div class="labrow"><label for="Lp">Profundidade do patamar</label><label class="auto"><input type="checkbox" id="LpAuto"> igual à largura</label></div><div class="inp"><input id="Lp" type="text" inputmode="decimal" autocomplete="off"><span class="un">cm</span></div></div>' +
    '<div class="grid2" data-for="helicoidal">' + fieldNum('D', 'Diâmetro externo', 'cm') + fieldNum('Dc', 'Diâmetro do pilar', 'cm') + '</div>' +
    '<div class="field" data-for="helicoidal"><div class="labrow"><label for="nPer">Degraus por volta</label><label class="auto"><input type="checkbox" id="nPerAuto"> automático</label></div><div class="stepper"><button type="button" id="nPerMinus" aria-label="Menos um degrau por volta">−</button><input id="nPer" type="text" inputmode="numeric" autocomplete="off"><button type="button" id="nPerPlus" aria-label="Mais um degrau por volta">+</button></div><p class="hint" id="nPerHint"></p></div>' +
    '<div class="field" data-for="c-patamar z-patamar"><div class="labrow"><label for="nMeioP">Pisos no lance do meio</label><label class="auto"><input type="checkbox" id="nMeioPAuto"> um terço</label></div><div class="inp"><input id="nMeioP" type="text" inputmode="numeric" autocomplete="off"><span class="un">pisos</span></div></div>' +
    '<div class="field"><span class="lab" id="estLab">Estrutura</span><div class="seg" id="estrutura" role="group" aria-labelledby="estLab"><button type="button" data-v="laje">Laje de concreto (maciça)</button><button type="button" data-v="balanco">Degraus em balanço</button></div><p class="hint" id="estHint"></p></div></section>' +
    '<details class="card"><summary>Altura livre e laje</summary><div class="grid2" style="margin-top:12px">' +
    fieldNum('hLivre', 'Altura livre mínima', 'cm') + fieldNum('espLaje', 'Laje do piso de cima', 'cm') +
    '<div id="tLajeWrap">' + fieldNum('tLaje', 'Laje da escada', 'cm') + '</div>' +
    '<div id="espDegrauWrap">' + fieldNum('espDegrau', 'Espessura do degrau', 'cm') + '</div></div></details>';
  $('tabs').innerHTML = [['planta', 'Planta'], ['corte', 'Cortes'], ['3d', '3D'], ['explica', 'Explicação']].map(v => '<button type="button" role="tab" data-v="' + v[0] + '" id="tab-' + v[0] + '" aria-controls="board" tabindex="-1">' + v[1] + '</button>').join('');
}
/* rótulo curto do perfil (NORMAS[k].rotulo); enquanto o núcleo não tiver o campo, usa o nome */
function rotuloNorma(k) { const n = NORMAS[k]; return n ? (n.rotulo || n.nome) : 'Personalizada'; }
function nomeNorma(k) { return k === 'custom' ? 'Personalizada: limites digitados por você (do professor ou do código de obras da cidade).' : (NORMAS[k] ? NORMAS[k].nome : ''); }
function fieldNum(id, label, unit, hint) {
  return '<div class="field"><label for="' + id + '">' + label + '</label><div class="inp"><input id="' + id + '" type="text" inputmode="decimal" autocomplete="off"><span class="un">' + unit + '</span></div>' + (hint ? '<p class="hint">' + hint + '</p>' : '') + '</div>';
}

function bind() {
  FIELDS.forEach(f => {
    const el = $(f.id); if (!el) return;
    el.addEventListener('input', () => {
      const v = parseNum(el.value);
      if (isNaN(v) || (f.kind === 'int' && Math.round(v) !== v)) { BAD[f.id] = true; el.classList.add('err'); el.setAttribute('aria-invalid', 'true'); render(true); return; }
      delete BAD[f.id]; el.classList.remove('err'); el.removeAttribute('aria-invalid');
      S[f.key] = v;
      if (f.auto) { S[f.auto] = false; $(f.auto).checked = false; }
      render(true);
    });
    el.addEventListener('blur', () => render());
    if (f.auto) $(f.auto).addEventListener('change', e => { S[f.auto] = e.target.checked; render(); });
  });
  $('norma').addEventListener('change', e => {
    const v = e.target.value;
    if (v === 'custom' && S.norma !== 'custom') { const b = NORMAS[S.norma] || NORMAS.res; Object.assign(S, { cEmin: b.eMin, cEmax: b.eMax, cPmin: b.pMin, cPmax: b.pMax, cBmin: b.bMin, cBmax: b.bMax, cLmin: b.Lmin, cHpat: b.hPat, cDw: b.dw, cLq: b.lqMin }); }
    S.norma = v; render();
  });
  $('modoP').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.modoPlanta = b.dataset.v; render(); });
  $('showDims').addEventListener('change', e => { S.showDims = e.target.checked; render(); });
  $('showNums').addEventListener('change', e => { S.showNums = e.target.checked; render(); });
  $('showCortes').addEventListener('change', e => { S.showCortes = e.target.checked; render(); });
  $('ladoE').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.ladoElev = b.dataset.v; render(); });
  $('vistaC').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.vistaCorte = b.dataset.v; render(); });
  $('desl').addEventListener('input', e => { const v = parseNum(e.target.value); if (isNaN(v) || Math.abs(v) > 2000) { e.target.classList.add('err'); return; } e.target.classList.remove('err'); if (S.vistaCorte === 'B') S.corteB = v; else S.corteA = v; render(true); });
  $('kLeque').addEventListener('change', e => { S.kLeque = +e.target.value; render(); });
  $('estrutura').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.estrutura = b.dataset.v; render(); });
  $('bocel').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.bocel = b.dataset.v; render(); });
  $('leque').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.leque = b.dataset.v; render(); });
  $('lado').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.lado = b.dataset.v; render(); });
  $('Nminus').addEventListener('click', () => { S.nAuto = false; S.N = Math.max(2, (CUR ? CUR.N : S.N) - 1); render(); });
  $('Nplus').addEventListener('click', () => { S.nAuto = false; S.N = (CUR ? CUR.N : S.N) + 1; render(); });
  const nPerAtual = () => CUR && CUR.helix ? CUR.helix.nPer : Math.round(num(S.nPer, 13));
  const limpaNPer = () => { delete BAD.nPer; $('nPer').classList.remove('err'); };
  $('nPerMinus').addEventListener('click', () => { limpaNPer(); S.nPerAuto = false; S.nPer = Math.max(4, nPerAtual() - 1); render(); });
  $('nPerPlus').addEventListener('click', () => { limpaNPer(); S.nPerAuto = false; S.nPer = Math.min(72, nPerAtual() + 1); render(); });
  $('tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; VIEW = b.dataset.v; render(); });
  $('tipos').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.tipo = b.dataset.v; render(); });
  /* teclado: só o item marcado entra no Tab (tabindex 0); as setas, Home e End andam entre os itens */
  const setas = (e, lista, atual) => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key], i = lista.indexOf(atual);
    if (d) return lista[(i + d + lista.length) % lista.length];
    if (e.key === 'Home') return lista[0];
    if (e.key === 'End') return lista[lista.length - 1];
    return null;
  };
  $('tipos').addEventListener('keydown', e => {
    const t = setas(e, TIPOS.map(x => x.id), S.tipo); if (!t) return;
    e.preventDefault(); S.tipo = t; render(); const b = document.querySelector('#tipos button[data-v="' + t + '"]'); if (b) b.focus();
  });
  $('tabs').addEventListener('keydown', e => {
    const v = setas(e, ['planta', 'corte', '3d', 'explica'], VIEW); if (!v) return;
    e.preventDefault(); VIEW = v; render(); $('tab-' + v).focus();
  });
  $('tipos').addEventListener('scroll', marcarRolagemTipos, { passive: true });
  $('mnav').addEventListener('click', e => { const b = e.target.closest('button[data-p]'); if (b) mostrarPainel(b.dataset.p); });
  /* o botão do resumo fixo é o mesmo nó em todo render (trocar o nó fazia o primeiro toque se perder quando um campo saía de foco) */
  $('miniBtn').addEventListener('click', () => {
    const b = $('miniBtn');
    if (b.dataset.campo) { const el = $(b.dataset.campo); if (el) { const d = el.closest('details'); if (d) d.open = true; el.focus(); el.scrollIntoView({ block: 'center', behavior: rolagem() }); } return; }
    if (b.dataset.p) mostrarPainel(b.dataset.p);
  });
  $('statusChip').addEventListener('click', () => { if (ehCelular()) mostrarPainel('verif'); else $('cardChecks').scrollIntoView({ block: 'start', behavior: rolagem() }); });
  $('btnTema').addEventListener('click', () => { const ordem = ['auto', 'light', 'dark'], t = ordem[(ordem.indexOf(lerTema()) + 1) % 3]; try { localStorage.setItem(TEMA_KEY, t); } catch (e) { } aplicarTema(t); toast('Tema: ' + TEMA_NOME[t]); });
  $('avisoMigraFechar').addEventListener('click', () => { $('avisoMigra').hidden = true; });
  $('yaw').addEventListener('input', e => { YAW = +e.target.value; draw3d(false); });
  $('pit').addEventListener('input', e => { PIT = +e.target.value; draw3d(false); });
  $('btnResumo').addEventListener('click', () => copiar(resumo(), 'Resumo copiado'));
  /* o desenho exportado sai sempre com as cores do tema claro, como no papel */
  $('btnSvg').addEventListener('click', () => { if (VIEW === '3d' || !CUR) return; const C = temaClaro(); copiar(VIEW === 'corte' ? svgCorte(CUR, { pxW: 1400 }, C) : planSVG(CUR, { pxW: 1400 }, C), 'SVG copiado'); });
  $('btnImg').addEventListener('click', gerarImagem);
  $('btnPrint').addEventListener('click', imprimir);
  $('modalClose').addEventListener('click', () => fecharDialogo('modal'));
  $('modal').addEventListener('click', e => { if (e.target.id === 'modal') fecharDialogo('modal'); });
  $('btnAmpliar').addEventListener('click', abrirZoom);
  $('btnAjustar').addEventListener('click', () => fecharDialogo('zoom'));
  $('zMais').addEventListener('click', () => zoomPor(1.4));
  $('zMenos').addEventListener('click', () => zoomPor(1 / 1.4));
  ligarPinca();
  document.addEventListener('keydown', e => {
    const aberto = ['zoom', 'modal'].find(id => !$(id).hidden); if (!aberto) return;
    if (e.key === 'Escape') { e.preventDefault(); fecharDialogo(aberto); return; }
    if (e.key === 'Tab') prenderFoco(e, $(aberto));
  });
  CV3 = $('cv3');
  let drag = null;
  CV3.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, yaw: YAW, pit: PIT }; CV3.setPointerCapture(e.pointerId); });
  CV3.addEventListener('pointermove', e => { if (!drag) return; YAW = ((drag.yaw + (e.clientX - drag.x) * 0.5) % 360 + 540) % 360 - 180; PIT = clamp(drag.pit + (e.clientY - drag.y) * 0.3, 12, 80); $('yaw').value = Math.round(YAW); $('pit').value = Math.round(PIT); draw3d(false); });
  const end = () => { if (drag) { drag = null; draw3d(true); } };
  CV3.addEventListener('pointerup', end); CV3.addEventListener('pointercancel', end);
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) mq.addEventListener('change', () => { THEME = null; renderTypes(); render(); });
  /* só redesenha quando o tema mudou de fato (a exportação troca para o claro e volta na mesma hora) */
  let temaVisto = document.documentElement.getAttribute('data-theme');
  new MutationObserver(() => { const t = document.documentElement.getAttribute('data-theme'); if (t === temaVisto) return; temaVisto = t; THEME = null; renderTypes(); render(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

const ehCelular = () => window.matchMedia('(max-width: 699px)').matches;
const rolagem = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
/* celular: mostra um painel por vez (Dados, Desenho ou Verificações), escolhido na barra de baixo */
function mostrarPainel(p) {
  PAINEL = p; $('app').dataset.painel = p;
  document.querySelectorAll('#mnav button').forEach(b => b.setAttribute('aria-selected', b.dataset.p === p));
  if (ehCelular()) window.scrollTo({ top: 0 });
  if (p === 'desenho') draw3d(true);
  if (p === 'verif' && SOL_PEND && SOL_PEND === CUR) agendarSol(CUR);
}
/* tema: automático (segue o aparelho), claro ou escuro; guardado só neste navegador */
const TEMA_NOME = { auto: 'automático (segue o aparelho)', light: 'claro', dark: 'escuro' };
const TEMA_ICO = {
  auto: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/>',
  light: '<circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  dark: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z" fill="currentColor"/>'
};
function lerTema() { try { const t = localStorage.getItem(TEMA_KEY); return t === 'light' || t === 'dark' ? t : 'auto'; } catch (e) { return 'auto'; } }
function aplicarTema(t) {
  const root = document.documentElement;
  if (t === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', t);
  const txt = $('temaTxt'), b = $('btnTema'), ico = $('temaIco');
  if (txt) txt.textContent = { auto: 'Automático', light: 'Claro', dark: 'Escuro' }[t];
  /* o ícone mostra o tema ativo também no celular, onde o texto fica escondido: meio círculo = automático, sol = claro, lua = escuro */
  if (ico) ico.innerHTML = TEMA_ICO[t];
  if (b) { b.setAttribute('aria-label', 'Tema: ' + TEMA_NOME[t] + '. Toque para trocar.'); b.title = 'Tema: ' + TEMA_NOME[t]; }
}

function renderTypes() {
  THEME = THEME || getTheme();
  $('tipos').innerHTML = TIPOS.map(t => {
    const R = calc({ tipo: t.id, H: 280, L: 90, norma: 'res', D: 220 });
    return '<button type="button" role="radio" data-v="' + t.id + '" aria-checked="false" title="' + t.desc + '"><span class="th">' + planSVG(R, { thumb: true }, THEME) + '</span><span class="nm">' + t.nome + '</span></button>';
  }).join('');
}

/* escreve o valor num campo que não está sendo digitado; o valor escrito é válido, então o campo sai do estado de erro
   (sem isso, um erro antigo de um campo escondido voltava a travar o app quando o campo reaparecia) */
function setVal(id, v, force) { const el = $(id); if (!el) return; if (force || document.activeElement !== el) { el.value = v; delete BAD[id]; el.classList.remove('err'); } }

const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/* campo marcado pelo erro de entrada que veio do núcleo (RangeError com .campo, a chave do estado) */
let CAMPO_ERR = null;
function marcarCampo(campo) {
  if (CAMPO_ERR && CAMPO_ERR !== campo && !BAD[CAMPO_ERR]) { const v = $(CAMPO_ERR); if (v) { v.classList.remove('err'); v.removeAttribute('aria-invalid'); v.removeAttribute('aria-describedby'); } }
  CAMPO_ERR = null;
  const el = campo ? $(campo) : null;
  if (!el || !/^(INPUT|SELECT)$/.test(el.tagName)) return null;
  CAMPO_ERR = campo; el.classList.add('err'); el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', 'erroDados');
  const d = el.closest('details'); if (d) d.open = true;
  return el;
}
/* resumo fixo do celular: o botão é sempre o mesmo nó; aqui só trocam o texto, a classe e o destino */
function miniRes(html, chip, rotulo, destino) {
  $('miniTxt').innerHTML = html;
  const b = $('miniBtn'); b.className = 'chip ' + chip; b.textContent = rotulo; b.hidden = !rotulo;
  b.dataset.p = destino && destino.p || ''; b.dataset.campo = destino && destino.campo || '';
}
function falha(msg, campo) {
  CUR = null;
  FIELDS.forEach(f => { if (f.auto) $(f.auto).checked = !!S[f.auto]; });
  ['tiles', 'memo', 'checks', 'legend', 'quant'].forEach(id => { $(id).innerHTML = ''; });
  const el = marcarCampo(campo || (Object.keys(BAD).find(id => $(id) && !$(id).closest('[hidden]')) || null));
  /* a mensagem fica no painel Dados, logo abaixo do campo com problema (ou no topo, se o erro não é de um campo) */
  const box = $('erroDados');
  box.innerHTML = '<b>Não dá para calcular com essas medidas.</b> ' + esc(msg);
  const fld = el && el.closest('.field');
  if (fld) fld.after(box); else $('ctrl').before(box);
  box.hidden = false;
  $('stage').dataset.view = 'erro';
  $('stage').innerHTML = '<div class="errbox"><b>Não dá para calcular com essas medidas.</b><p>' + esc(msg) + '</p><p>Nada foi desenhado para não mostrar uma escada que não corresponde ao que você pediu.</p></div>';
  $('checkSum').className = 'cs bad'; $('checkSum').textContent = 'Medidas inválidas';
  $('checks').innerHTML = '<li class="ck bad"><span class="pill">erro</span><div class="cb"><div class="cn">Entrada</div><div class="cnote">' + esc(msg) + '</div></div></li>';
  $('statusChip').className = 'chip bad'; $('statusChip').textContent = 'Medidas inválidas'; $('statusChip').setAttribute('aria-label', 'Medidas inválidas: ' + msg);
  $('navBadge').hidden = false; $('navBadge').className = 'badge'; $('navBadge').textContent = '!';
  miniRes('<span class="mrErr">' + (el ? 'Medida que o app não aceita: a mensagem está embaixo do campo.' : esc(msg)) + '</span>', 'bad', el ? 'Ir ao campo' : '', el ? { campo: el.id } : null);
  $('notaNorma').hidden = true;
  ['btnImg', 'btnSvg', 'btnResumo', 'btnPrint', 'btnAmpliar'].forEach(id => { $(id).disabled = true; });
  $('btnAmpliar').hidden = true;
  $('view3dBar').hidden = true; $('viewPlantaBar').hidden = true; $('viewCorteBar').hidden = true;
}
/* opções do número de degraus da curva: de 2 até pelo menos kw (o mínimo do balanceamento pode passar de 6) */
function opcoesK(bal, kMin, kAtual) {
  const top = Math.max(6, kAtual || 0, (kMin || 0) + 2), ops = [];
  for (let k = 2; k <= top; k++) ops.push('<option value="' + k + '"' + (bal && kMin && k < kMin ? ' disabled' : '') + '>' + k + (bal ? ' degraus' : ' leques (' + fmt(90 / k, 1) + '° cada)') + '</option>');
  const h = ops.join('');
  if ($('kLeque').innerHTML !== h) $('kLeque').innerHTML = h;
  $('kLeque').value = String(kAtual);
}
function render(typing) {
  THEME = THEME || getTheme();
  opcoesK(S.leque !== 'conv', 0, clamp(Math.round(num(S.kLeque, 3)), 2, 6));
  document.querySelectorAll('#leque button').forEach(b => b.classList.toggle('on', b.dataset.v === (S.leque === 'conv' ? 'conv' : 'bal')));
  const bocM = ['bocel', 'inclinado', 'sem'].indexOf(S.bocel) >= 0 ? S.bocel : 'bocel';
  document.querySelectorAll('#bocel button').forEach(b => b.classList.toggle('on', b.dataset.v === bocM));
  const estM = S.estrutura === 'laje' || S.estrutura === 'balanco' ? S.estrutura : (S.tipo === 'helicoidal' ? 'balanco' : 'laje');
  document.querySelectorAll('#estrutura button').forEach(b => b.classList.toggle('on', b.dataset.v === estM));
  $('tLajeWrap').hidden = estM === 'balanco'; $('espDegrauWrap').hidden = estM !== 'balanco';
  $('estHint').textContent = estM === 'balanco' ? (S.tipo === 'helicoidal' ? 'Cada degrau é uma placa presa no pilar central, sem laje embaixo e com o espelho aberto.' : 'Cada degrau é uma placa presa na parede ou numa viga lateral, sem laje embaixo e com o espelho aberto.') + ' A NBR 9050:2020 (6.7.1) não admite espelho vazado em rota acessível.' : (S.tipo === 'helicoidal' ? 'Uma peça só de concreto: os degraus apoiados numa laje helicoidal, que gira em volta do centro.' : 'Os degraus apoiados numa laje inclinada de concreto, com patamares horizontais.');
  const helB = estM === 'balanco';
  $('avancoWrap').hidden = bocM === 'sem';
  /* "Espelho inclinado" some quando não se aplica, mas continua visível se estiver marcado, junto com a mensagem de erro */
  document.querySelector('#bocel button[data-v="inclinado"]').hidden = (helB || S.tipo === 'helicoidal') && bocM !== 'inclinado';
  document.querySelector('#bocel button[data-v="bocel"]').textContent = helB ? 'Placas sobrepostas' : 'Bocel';
  document.querySelector('#bocel button[data-v="sem"]').textContent = helB ? 'Sem sobreposição' : 'Sem saliência';
  $('bocHint').textContent = (helB ? 'Quanto cada placa avança sobre a de baixo. ' : bocM === 'inclinado' ? 'Quanto a quina do espelho inclinado avança sobre o degrau de baixo. ' : 'Quanto o nariz do degrau avança sobre o espelho de baixo. ') + 'A NBR 9077:2001 (4.7.3.1 e), cancelada pela edição de 2025, pedia pelo menos 1,5 cm; a NBR 9050:2020 (6.7.1) admite no máximo 1,5 cm. O avanço não muda o piso p, medido de bocel a bocel.';
  document.querySelectorAll('[data-for]').forEach(el => { el.hidden = el.dataset.for.split(' ').indexOf(S.tipo) < 0; });
  marcarSelecao();
  $('customNorm').hidden = S.norma !== 'custom';
  /* só conta campo inválido que está à vista e em uso (não oculto, não no automático) */
  const bad = Object.keys(BAD).filter(id => { const el = $(id); if (!el || el.closest('[hidden]')) return false; const f = FIELDS.find(x => x.id === id); return !(f && f.auto && S[f.auto]); });
  if (bad.length) { const lab = bad.map(id => { const l = document.querySelector('label[for="' + id + '"]'); return l ? l.textContent : id; }); falha('Campo com valor que não é número: ' + lab.join(', ') + '. Use só algarismos, com vírgula para decimal (ex.: 17,5), sem ponto de milhar (escreva 1000, não 1.000).', bad[0]); return; }
  let R;
  try { R = calc(S); } catch (err) { if (!err.patamar) console.error(err); falha(err.message, err.campo); return; }
  CUR = R;
  marcarCampo(null); $('erroDados').hidden = true;
  /* "Como resolver" testa saídas recalculando a escada (na helicoidal leva perto de 1 s): roda depois de desenhar, fora da digitação, e fica guardado por estado */
  if (!solDoCache(R)) agendarSol(R, typing);
  ['btnImg', 'btnSvg', 'btnResumo', 'btnPrint', 'btnAmpliar'].forEach(id => { $(id).disabled = false; });
  /* controles */
  document.querySelectorAll('[data-for]').forEach(el => { el.hidden = el.dataset.for.split(' ').indexOf(S.tipo) < 0; });
  document.querySelectorAll('#lado button').forEach(b => b.classList.toggle('on', b.dataset.v === S.lado));
  $('norma').value = S.norma; $('customNorm').hidden = S.norma !== 'custom';
  $('normaHint').textContent = nomeNorma(S.norma);
  ['cEmin','cEmax','cPmin','cPmax','cBmin','cBmax','cLmin','cHpat','cDw','cLq'].forEach(k => setVal(k, plain(S[k])));
  setVal('zCorte', plain(S.zCorte)); $('showDims').checked = S.showDims !== false; $('showNums').checked = S.showNums !== false;
  document.querySelectorAll('#modoP button').forEach(b => b.classList.toggle('on', b.dataset.v === S.modoPlanta));
  $('zcWrap').hidden = S.modoPlanta === 'sup';
  document.querySelectorAll('#leque button').forEach(b => b.classList.toggle('on', b.dataset.v === (R.bal ? 'bal' : 'conv')));
  $('lqHint').textContent = R.bal ? 'Piso igual na linha de caminhamento, ponta larga na borda interna. A NBR 9077:2001, cancelada pela edição de 2025, recomendava balancear os leques.' : 'Todos saem do canto interno, com ponta zero. Serve para comparar com os balanceados.';
  opcoesK(R.bal, R.kwMin, R.kw);
  $('kLeque').value = String(R.kw);
  $('kLab').textContent = R.bal ? 'Degraus no trecho de cada curva' : 'Leques em cada curva';
  $('kHint').textContent = R.bal ? 'Mínimo ' + R.kwMin + ' para manter o piso de ' + fmt(R.p, 1) + ' cm na curva da linha (' + fmt(R.dw * Math.PI / 2, 1) + ' cm).' : '';
  FIELDS.forEach(f => { if (f.auto) $(f.auto).checked = !!S[f.auto]; });
  setVal('H', plain(S.H)); setVal('L', plain(S.L)); setVal('hLivre', plain(S.hLivre)); setVal('espLaje', plain(S.espLaje)); setVal('tLaje', plain(S.tLaje)); setVal('espDegrau', plain(S.espDegrau));
  setVal('D', plain(S.D)); setVal('Dc', plain(S.Dc)); setVal('vao', plain(S.vao)); setVal('nMeio', String(R.nMeio));
  if (R.helix) {
    setVal('nPer', String(R.helix.nPer));
    $('nPerHint').textContent = 'Cada degrau gira ' + fmt(R.helix.th, 1) + '°. Para o piso de ' + fmt(R.hel ? R.pAlvo : R.p, 1) + ' cm seriam ' + R.helix.nPref + '; para a altura livre, no mínimo ' + R.helix.nReq + '. Menos degraus por volta: piso mais largo e menos altura livre.';
  }
  setVal('nMeioP', String(R.nMeioP));
  setVal('avanco', plain(S.avanco));
  setVal('N', String(R.N)); setVal('p', S.pAuto ? plain(R.hel ? R.pAlvo : R.pInput) : plain(S.p)); setVal('n1', String(R.a)); setVal('Lp', plain(R.Lp));
  $('pLab').textContent = R.hel ? 'Piso desejado (linha de caminhamento)' : 'Piso (profundidade)';
  $('Nhint').textContent = 'Sugestão: ' + R.nSug + ' espelhos (espelho de ' + fmt(S.H / R.nSug, 2) + ' cm). Atual: ' + fmt(R.e, 2) + ' cm.';
  $('n1Un').textContent = 'de ' + Math.max(0, R.avail - (R.tipo === 'c-patamar' || R.tipo === 'z-patamar' ? R.nMeioP : 0)) + ' pisos retos';
  $('nMeioHint').textContent = 'Vão central entre os lances: ' + fmt(R.gU || R.nMeio * R.p, 1) + ' cm.';
  /* resultados */
  const incl = R.incl;
  $('tiles').innerHTML = [
    ['Espelhos', R.N, 'altura ' + fmt(R.e, 2) + ' cm'],
    ['Pisos', R.nReto + R.nLeque, R.hel ? 'degraus' : (R.nLeque ? [R.nReto ? R.nReto + ' retos' : '', R.nLeque + (R.bal ? ' balanceados' : ' leques')].filter(Boolean).join(' + ') : 'pisos comuns') + (R.nPat ? ' + ' + R.nPat + (R.nPat > 1 ? ' patamares' : ' patamar') : '')],
    ['Piso', fmt(R.p, 1) + ' cm', R.hel ? 'na linha de caminhamento' : 'profundidade'],
    ['Blondel', fmt(R.bl, 1) + ' cm', '2e + p'],
    ['Inclinação', fmt(incl, 1) + '°', fmt(R.e / R.p * 100, 0) + '%'],
    ['Em planta', metros((R.bbox[2] - R.bbox[0]) / 100) + ' × ' + metros((R.bbox[3] - R.bbox[1]) / 100), R.hel ? 'm · círculo de ' + fmt(R.areaOcup / 10000, 2) + ' m²' : 'm (retângulo) · ocupa ' + fmt(R.areaOcup / 10000, 2) + ' m²'],
  ].map(t => '<div class="tile"><span class="tl">' + t[0] + '</span><span class="tv">' + t[1] + '</span><span class="ts">' + t[2] + '</span></div>').join('');
  const cnt = { ok: 0, warn: 0, bad: 0 }; R.checks.forEach(c => { if (cnt[c.status] !== undefined) cnt[c.status]++; });
  const sev = cnt.bad ? 'bad' : cnt.warn ? 'warn' : 'ok';
  $('checkSum').className = 'cs ' + sev;
  $('checkSum').textContent = cnt.bad ? cnt.bad + ' fora da referência' + (cnt.warn ? ' e ' + cnt.warn + ' em atenção' : '') : cnt.warn ? cnt.warn + ' em atenção' : 'Tudo dentro da referência';
  const curto = cnt.bad ? cnt.bad + ' fora' : cnt.warn ? cnt.warn + ' em atenção' : 'Tudo ok';
  $('statusChip').className = 'chip ' + sev; $('statusChip').innerHTML = '<span class="longo">' + $('checkSum').textContent + '</span><span class="curto">' + curto + '</span>';
  $('statusChip').setAttribute('aria-label', 'Verificações: ' + $('checkSum').textContent + '. Ver a lista.');
  const nb = $('navBadge'); nb.hidden = !(cnt.bad + cnt.warn); nb.className = 'badge' + (cnt.bad ? '' : ' warn'); nb.textContent = cnt.bad || cnt.warn;
  miniRes('<b>' + R.N + '</b> × <b>' + fmt(R.e, 2) + '</b> cm · piso <b>' + fmt(R.p, 1) + '</b> · Blondel <b>' + fmt(R.bl, 1) + '</b>', sev, curto, { p: 'verif' });
  /* perfis que ainda usam números da NBR 9077:2001 como referência */
  $('notaNorma').hidden = !(R.nm.id === 'res' || R.nm.id === 'mez');
  $('checks').innerHTML = checksHTML(R);
  $('memo').innerHTML = R.memo.map(t => '<li>' + t + '</li>').join('');
  $('quant').innerHTML = quantHTML(R);
  $('title').textContent = TIPOS.find(t => t.id === S.tipo).nome;
  $('desc').textContent = TIPOS.find(t => t.id === S.tipo).desc + '. ' + R.nm.nome + '.';
  $('view3dBar').hidden = VIEW !== '3d';
  $('viewPlantaBar').hidden = VIEW !== 'planta';
  $('viewCorteBar').hidden = VIEW !== 'corte';
  document.querySelectorAll('#vistaC button').forEach(b => b.classList.toggle('on', b.dataset.v === (S.vistaCorte || 'A')));
  $('deslWrap').hidden = !(S.vistaCorte === 'A' || S.vistaCorte === 'B' || !S.vistaCorte);
  $('ladoE').hidden = S.vistaCorte !== 'E';
  document.querySelectorAll('#ladoE button').forEach(b => b.classList.toggle('on', b.dataset.v === (S.ladoElev || 'frente')));
  if (document.activeElement !== $('desl')) $('desl').classList.remove('err');
  setVal('desl', plain(num(S.vistaCorte === 'B' ? S.corteB : S.corteA, 0)));
  $('showCortes').checked = S.showCortes !== false;
  $('btnSvg').hidden = VIEW === '3d' || VIEW === 'explica';
  $('btnImg').hidden = VIEW === 'explica';
  $('btnAmpliar').hidden = !(VIEW === 'planta' || VIEW === 'corte');
  mostrarTipo();
  /* palco */
  const stg = $('stage');
  lembrarAbertas();
  stg.dataset.view = VIEW;
  let svg = '';
  if (VIEW === 'planta') { svg = planSVG(R, {}, THEME); stg.innerHTML = svg; }
  else if (VIEW === 'corte') { svg = svgCorte(R, {}, THEME); stg.innerHTML = svg + '<p class="cap">' + legCorte(R, S.vistaCorte || 'A') + '</p>'; }
  else if (VIEW === 'explica') { stg.innerHTML = explicacao(R, S, THEME); reabrir(); }
  else { stg.innerHTML = ''; stg.appendChild(CV3); draw3d(true); }
  $('legend').innerHTML = VIEW === 'explica' ? '' : legendaHTML(R, svg);
  $('legend').hidden = !$('legend').innerHTML;
  save();
}
/* seções da Explicação: as que a estudante abriu ou fechou continuam assim quando um dado muda (a aba se refaz a cada mudança) */
let EX_ABERTAS = null;
function lembrarAbertas() {
  const ds = $('stage').querySelectorAll('details.ex'); if (!ds.length) return;
  EX_ABERTAS = {}; ds.forEach((d, i) => { EX_ABERTAS[chaveSecao(d, i)] = d.open; });
}
function reabrir() {
  if (!EX_ABERTAS) return;
  $('stage').querySelectorAll('details.ex').forEach((d, i) => { const k = chaveSecao(d, i); if (k in EX_ABERTAS) d.open = EX_ABERTAS[k]; });
}
/* a chave é o começo do título, até o primeiro número, parêntese ou dois-pontos (alguns títulos mudam com o tipo ou com a medida) */
function chaveSecao(d, i) { const s = d.querySelector('summary'); const t = s ? s.textContent.replace(/[\d(:].*$/, '').replace(/[:,.\s]+$/, '').slice(0, 40) : ''; return t || 'sec' + i; }
function marcarSelecao() {
  document.querySelectorAll('#tipos button').forEach(b => { const on = b.dataset.v === S.tipo; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
  document.querySelectorAll('#tabs button').forEach(b => { const on = b.dataset.v === VIEW; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
  $('board').setAttribute('aria-labelledby', 'tab-' + VIEW);
}
const metros = v => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const LAB_ST = { ok: 'ok', warn: 'atenção', bad: 'fora', info: 'info' };
function checksHTML(R) {
  return R.checks.map(c => '<li class="ck ' + c.status + '"><span class="pill">' + LAB_ST[c.status] + '</span><div class="cb"><div class="cn">' + c.nome + '</div><div class="cv"><b>' + c.valor + '</b>' + (c.regra ? ' <span>referência ' + c.regra + '</span>' : '') + '</div>' + (c.nota ? '<div class="cnote">' + c.nota + '</div>' : '') + (c.sol ? '<div class="csol"><b>Como resolver:</b> ' + c.sol + '</div>' : '') + '</div></li>').join('');
}
/* legenda de cada vista: só o que aparece naquele desenho, com as cores daquele desenho */
function legendaHTML(R, svg) {
  const it = (marca, txt) => '<span class="lg">' + marca + txt + '</span>';
  const sw = cor => '<i class="sw" style="background:' + cor + '"></i>';
  const cores = VIEW === '3d' ? ['var(--t3)', 'var(--w3)', 'var(--p3)'] : ['var(--tread)', 'var(--winder)', 'var(--patamar)'];
  let lg = it(sw(cores[0]), R.hel ? 'Degrau' : 'Degrau reto');
  if (R.polys.some(p => p.kind === 'leque')) lg += it(sw(cores[1]), R.bal ? 'Degrau balanceado' : 'Leque');
  if (R.polys.some(p => p.kind === 'patamar')) lg += it(sw(cores[2]), 'Patamar');
  if (VIEW === '3d') return lg + '<span class="lg">Modelo de estudo: ' + (R.placas ? (R.hel ? 'degraus em balanço em volta do pilar' : 'degraus em balanço (placas soltas)') : (R.hel ? 'degraus sobre a laje helicoidal' : 'degraus com o fundo real da laje')) + ' e corrimãos, sem acabamentos. Arraste para girar.</span>';
  if (VIEW === 'planta') {
    const inf = S.modoPlanta !== 'sup';
    return lg + it('<i class="ln"></i>', 'Linha de caminhamento') + (R.opening && inf ? it('<i class="ln dash"></i>', 'Vão mínimo na laje') : '') + (inf && S.showCortes !== false ? it('<i class="ln dashdot"></i>', 'Linhas dos cortes A-A e B-B') : '') + '<span class="lg">Cotas em cm.</span>';
  }
  const v = S.vistaCorte || 'A';
  if (v === 'detalhe') return '';
  if (v === 'perfil') return lg + (/altura livre/.test(svg) ? it('<i class="ln dash acc"></i>', 'Altura livre') : '') + '<span class="lg">Esquema esticado na linha de caminhamento. Cotas em cm.</span>';
  if (v === 'E') return it('<i class="ln fino"></i>', 'Tudo em vista, em traço fino: nada é cortado') + '<span class="lg">Lado: ' + LADO_NOME[S.ladoElev || 'frente'] + '. Cotas em cm.</span>';
  return it('<i class="sw hach"></i>', 'Cortado pelo plano (hachura)') + it('<i class="ln fino"></i>', 'Em vista, além do plano (traço fino)') + (/tracejado laranja/.test(svg) ? it('<i class="ln dash acc"></i>', 'Altura livre sobre os degraus cortados') : '') + '<span class="lg">Cotas em cm.</span>';
}
const LADO_NOME = { frente: 'frente', direita: 'lado direito', esquerda: 'lado esquerdo', fundos: 'fundos' };

/* deixa o tipo escolhido à vista na faixa de tipos, que rola na horizontal */
function mostrarTipo() {
  const c = $('tipos'), b = c.querySelector('button.on'); if (!b || c.scrollWidth <= c.clientWidth) { marcarRolagemTipos(); return; }
  const l = b.offsetLeft - c.offsetLeft;
  if (l < c.scrollLeft || l + b.offsetWidth > c.scrollLeft + c.clientWidth) c.scrollLeft = Math.max(0, l - 12);
  marcarRolagemTipos();
}
/* quantitativos: estimativas da geometria, para orçamento preliminar e para conferir ordem de grandeza */
function quantHTML(R) {
  const q = R.quant, m2 = v => fmt(v / 10000, 2) + ' m²';
  const linhas = [
    ['Piso dos degraus e patamares', m2(q.aPisos), 'soma das superfícies em planta (revestimento de piso)'],
  ];
  if (R.hel) linhas[0][2] = 'soma dos pisos dos degraus; eles se sobrepõem em planta quando a escada dá mais de uma volta';
  if (!R.placas) linhas.push(['Espelhos', m2(q.aEspelhos), R.N + ' espelhos de ' + fmt(R.e, 2) + ' cm pelo comprimento de cada aresta'], ['Revestimento total', m2(q.aPisos + q.aEspelhos), 'pisos + espelhos, sem perda de corte']);
  if (R.placas) linhas.push(['Volume dos degraus', fmt(q.volConc / 1e6, 3) + ' m³', 'placas de ' + fmt(R.st.espDegrau) + ' cm' + (R.hel ? '; pilar fora da conta' : '; apoio na parede ou viga fora da conta')]);
  else {
    linhas.push(['Concreto da escada', fmt(q.volConc / 1e6, 3) + ' m³', 'degraus + laje de ' + fmt(R.st.tLaje) + ' cm, até o chão; sem a laje do piso de cima']);
    linhas.push(['Fôrma do fundo', m2(q.aForma), R.hel ? 'face de baixo da laje helicoidal, que gira em torno do pilar; sem as laterais' : 'face de baixo da laje inclinada e dos patamares; sem as laterais']);
  }
  linhas.push(['Corrimão (por lado)', fmt(q.corrimao / 100, 2) + ' m', 'medido na linha de caminhamento' + (R.nm.acess ? ', com os 30 cm de prolongamento em cada ponta' : '') + '; o lado externo de curvas é mais comprido']);
  return '<table class="tab tabq"><tbody>' + linhas.map(l => '<tr><td>' + l[0] + '<br><span class="hint">' + l[2] + '</span></td><td>' + l[1] + '</td></tr>').join('') + '</tbody></table><p class="hint" style="margin-top:8px">Contas feitas na geometria do desenho, para estudo e orçamento preliminar. Não incluem perdas, armadura, emendas nem detalhes de obra.</p>';
}
/* aba Cortes: corte A-A, corte B-B, perfil desenvolvido ou detalhe do degrau */
function svgCorte(R, o, C) {
  const v = S.vistaCorte || 'A';
  if (v === 'perfil') return sectionSVG(R, o, C);
  if (v === 'detalhe') return detalheSVG(R, o, C);
  if (v === 'E') return elevacaoSVG(R, o, C, S.ladoElev || 'frente');
  return corteSVG(R, o, C, v);
}
function legCorte(R, v) {
  const fora = R.st['corte' + v] ? ' A linha foi deslocada ' + fmt(R.st['corte' + v]) + ' cm.' : '';
  if (v === 'A') return (R.hel ? 'Corte A-A: plano vertical que passa pelo centro do pilar, marcado na planta com as letras A.' : 'Corte A-A: plano vertical ao longo do 1º lance, marcado na planta com as letras A.') + ' O que o plano corta aparece hachurado e com traço grosso; o que está além dele aparece em vista, com traço fino. A seta na planta mostra para onde se olha.' + fora;
  if (v === 'B') return (R.hel ? 'Corte B-B: plano vertical que passa pelo centro do pilar, perpendicular ao A-A, marcado na planta com as letras B.' : 'Corte B-B: plano vertical atravessado ao 1º lance, marcado na planta com as letras B.') + ' Hachura = cortado; traço fino = em vista, além do plano.' + fora;
  if (v === 'E') return 'Elevação (' + LADO_NOME[S.ladoElev || 'frente'] + '): a escada vista de fora, sem cortar nada, por isso tudo sai em traço fino. Frente é o lado de quem chega para subir o 1º lance; direita e esquerda são as de quem sobe esse lance. Compare com o corte, que mostra hachurado o que o plano atravessa.';
  if (v === 'perfil') return 'Perfil desenvolvido (esquema): a escada é esticada ao longo da linha de caminhamento, então curvas e leques viram trecho reto. Não é um corte A-A da edificação.';
  return R.placas ? 'Detalhe do degrau: ampliação dos degraus em balanço (placas soltas, sem laje e com o espelho aberto)' + (R.hel ? ', com o piso medido na linha de caminhamento' : '') + ' e o corrimão.' : 'Detalhe do degrau: ampliação de degraus típicos com espelho, piso, bocel, laje e corrimão' + (R.hel ? ' (na helicoidal, medidos na linha de caminhamento)' : '') + '.';
}
function draw3d(hq) {
  if (VIEW !== '3d' || !CUR) return;
  const box = $('stage'), cw = Math.max(280, box.clientWidth || 640);
  const k = hq ? 2 : 1;
  CV3.width = Math.round(cw * k); CV3.height = Math.round(Math.min(cw * 0.78, 620) * k);
  CV3.style.width = '100%'; CV3.style.height = 'auto';
  render3D(CV3, CUR, { yaw: YAW, pitch: PIT }, THEME || getTheme());
}

/* nome do tipo no meio da frase: "Escada em L com leques" (a letra que dá a forma fica maiúscula) */
function nomeTipoFrase(t) { return t.nome.toLowerCase().replace(/ ([lucz]) /g, (m, a) => ' ' + a.toUpperCase() + ' '); }

/* ---- "Como resolver": roda depois de desenhar e fica guardado por estado ---- */
const SOL_CACHE = new Map();
const SO_TELA = ['modoPlanta', 'showDims', 'showNums', 'showCortes', 'vistaCorte', 'ladoElev', 'corteA', 'corteB', 'zCorte'];
function chaveSol() { const o = {}; Object.keys(S).sort().forEach(k => { if (SO_TELA.indexOf(k) < 0) o[k] = S[k]; }); return JSON.stringify(o); }
/* aplica as soluções já calculadas para este estado; devolve false se ainda não há */
function solDoCache(R) {
  const sols = SOL_CACHE.get(chaveSol()); if (!sols || sols.length !== R.checks.length) return false;
  R.checks.forEach((c, i) => { if (sols[i]) c.sol = sols[i]; });
  R.resolver.feito = true;
  return true;
}
function resolverAgora(R) {
  if (R.resolver.feito) return;
  R.resolver();
  SOL_CACHE.set(chaveSol(), R.checks.map(c => c.sol || null));
  if (SOL_CACHE.size > 60) SOL_CACHE.delete(SOL_CACHE.keys().next().value);
}
let SOL_T = null, SOL_PEND = null;
function agendarSol(R) {
  clearTimeout(SOL_T); SOL_PEND = R;
  /* no celular só calcula quando a lista de verificações está à vista */
  if (ehCelular() && PAINEL !== 'verif') return;
  /* espera uma pausa nos cliques e na digitação (cada teste da helicoidal refaz o cálculo inteiro) */
  SOL_T = setTimeout(() => {
    const roda = () => { if (CUR !== R || SOL_PEND !== R) return; SOL_PEND = null; resolverAgora(R); $('checks').innerHTML = checksHTML(R); };
    if (window.requestIdleCallback) requestIdleCallback(roda, { timeout: 800 }); else roda();
  }, 600);
}

/* cores do tema claro, para exportar e imprimir (troca o tema por um instante e volta) */
function temaClaro() {
  const root = document.documentElement, antes = root.getAttribute('data-theme');
  root.setAttribute('data-theme', 'light');
  const C = getTheme();
  if (antes === null) root.removeAttribute('data-theme'); else root.setAttribute('data-theme', antes);
  return C;
}

/* ---- faixa de tipos: degradê na borda que ainda tem tipos para rolar ---- */
function marcarRolagemTipos() {
  const c = $('tipos'); if (!c) return;
  const mais = c.scrollWidth - c.clientWidth > 2;
  c.classList.toggle('maisDir', mais && c.scrollLeft + c.clientWidth < c.scrollWidth - 2);
  c.classList.toggle('maisEsq', mais && c.scrollLeft > 2);
}

/* ---- janelas (imagem gerada e desenho ampliado): foco vai para dentro, Tab fica preso, ao fechar volta para o botão ---- */
let FOCO_ANTES = null;
function abrirDialogo(id, foco) {
  FOCO_ANTES = document.activeElement;
  $(id).hidden = false;
  if (id === 'zoom') document.body.classList.add('travado');
  setTimeout(() => { const f = $(foco); if (f) f.focus(); }, 0);
}
function fecharDialogo(id) {
  $(id).hidden = true;
  if (id === 'zoom') { document.body.classList.remove('travado'); $('zArea').innerHTML = ''; }
  if (FOCO_ANTES && document.contains(FOCO_ANTES)) FOCO_ANTES.focus();
  FOCO_ANTES = null;
}
function prenderFoco(e, box) {
  const fs = [...box.querySelectorAll('a[href],button,input,select,[tabindex]:not([tabindex="-1"])')].filter(x => !x.disabled && !x.hidden && x.offsetParent !== null);
  if (!fs.length) return;
  const a = fs[0], z = fs[fs.length - 1];
  if (e.shiftKey && (document.activeElement === a || !box.contains(document.activeElement))) { e.preventDefault(); z.focus(); }
  else if (!e.shiftKey && (document.activeElement === z || !box.contains(document.activeElement))) { e.preventDefault(); a.focus(); }
}

/* ---- desenho ampliado: tela cheia com rolagem, pinça (dois dedos), Ctrl + roda do mouse e botões + / − ---- */
let ZW = 0, ZMIN = 0;
function abrirZoom() {
  if (!CUR || !(VIEW === 'planta' || VIEW === 'corte')) return;
  const area = $('zArea');
  area.innerHTML = VIEW === 'corte' ? svgCorte(CUR, {}, THEME) : planSVG(CUR, {}, THEME);
  abrirDialogo('zoom', 'btnAjustar');
  const svg = area.querySelector('svg'); if (!svg) return;
  svg.style.maxHeight = 'none';
  ZMIN = Math.max(200, area.clientWidth - 16);
  ZW = Math.max(ZMIN * 2, 900);
  svg.style.width = ZW + 'px'; svg.style.height = 'auto';
  /* começa no centro do desenho */
  requestAnimationFrame(() => { area.scrollLeft = (area.scrollWidth - area.clientWidth) / 2; area.scrollTop = (area.scrollHeight - area.clientHeight) / 2; });
}
/* muda a largura do desenho mantendo parado o ponto (cx, cy) da área visível */
function zoomPara(w, cx, cy) {
  const area = $('zArea'), svg = area.querySelector('svg'); if (!svg) return;
  const nw = clamp(w, ZMIN, 8000); if (Math.abs(nw - ZW) < 0.5) return;
  if (cx === undefined) { cx = area.clientWidth / 2; cy = area.clientHeight / 2; }
  const k = nw / ZW, x = area.scrollLeft + cx, y = area.scrollTop + cy;
  ZW = nw; svg.style.width = nw + 'px';
  area.scrollLeft = x * k - cx; area.scrollTop = y * k - cy;
}
function zoomPor(k) { zoomPara(ZW * k); }
function ligarPinca() {
  const area = $('zArea'); let p0 = null;
  const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  area.addEventListener('touchstart', e => { if (e.touches.length === 2) { const r = area.getBoundingClientRect(); p0 = { d: dist(e.touches), w: ZW, cx: (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left, cy: (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top }; } }, { passive: true });
  area.addEventListener('touchmove', e => { if (!p0 || e.touches.length !== 2) return; e.preventDefault(); zoomPara(p0.w * dist(e.touches) / p0.d, p0.cx, p0.cy); }, { passive: false });
  area.addEventListener('touchend', e => { if (e.touches.length < 2) p0 = null; });
  area.addEventListener('wheel', e => { if (!e.ctrlKey) return; e.preventDefault(); const r = area.getBoundingClientRect(); zoomPara(ZW * Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
}

function resumo() {
  resolverAgora(CUR);
  const R = CUR, t = TIPOS.find(x => x.id === S.tipo);
  return 'Escada ' + nomeTipoFrase(t) + ' · perfil: ' + R.nm.nome + '\n' +
    'Desnível ' + fmt(R.H) + ' cm · largura ' + fmt(R.L) + ' cm\n' +
    R.N + ' espelhos de ' + fmt(R.e, 2) + ' cm · ' + R.contagem + ' · piso ' + fmt(R.p, 1) + ' cm · Blondel ' + fmt(R.bl, 1) + ' cm\n' +
    'Inclinação ' + fmt(R.incl, 1) + '°\n\n' + R.memo.join('\n') + '\n\nVerificações:\n' + R.checks.map(c => '- ' + c.nome + ': ' + c.valor + (c.regra ? ' · referência: ' + c.regra : '') + ' [' + LAB_ST[c.status] + ']' + (c.sol ? '\n  Como resolver: ' + c.sol : '')).join('\n');
}

/* relatório para imprimir ou salvar em PDF: sempre com as cores do tema claro, que é o que sai no papel.
   Sem a opção "incluir explicação completa", leva só o Resumo, o Passo a passo e a Tabela de degraus. */
const EX_CURTA = ['Resumo', 'Passo a passo', 'Tabela de degraus'];
function montarRelatorio() {
  if (!CUR) { $('printArea').innerHTML = '<p>Corrija as medidas antes de imprimir: com entrada inválida o app não desenha a escada.</p>'; return; }
  resolverAgora(CUR);
  const R = CUR, t = TIPOS.find(x => x.id === S.tipo);
  const C = temaClaro();
  const hoje = new Date().toLocaleDateString('pt-BR');
  const lado = S.ladoElev || 'frente';
  const tiles = [['Espelhos', R.N + ' × ' + fmt(R.e, 2) + ' cm'], ['Piso', fmt(R.p, 1) + ' cm'], ['Blondel (2e + p)', fmt(R.bl, 1) + ' cm'], ['Inclinação', fmt(R.incl, 1) + '°'], ['Largura útil', fmt(R.L) + ' cm'], ['Superfícies', R.contagem]];
  let h = '<h1>Escada ' + nomeTipoFrase(t) + '</h1>';
  h += '<p class="sub">Desnível de ' + fmt(R.H) + ' cm · ' + R.nm.nome + ' · gerado pelo Patamar em ' + hoje + '</p>';
  h += '<div class="ptiles">' + tiles.map(x => '<div><span>' + x[0] + '</span><b>' + x[1] + '</b></div>').join('') + '</div>';
  h += '<figure class="grande">' + planSVG(R, { modo: 'inf', cortes: true }, C) + '<figcaption>Planta do pavimento inferior, com corte a ' + fmt(R.zc, 0) + ' cm do piso e as linhas dos cortes A-A e B-B.</figcaption></figure>';
  h += '<div class="quebra"></div><figure>' + corteSVG(R, {}, C, 'A') + '<figcaption>Corte A-A, marcado na planta.</figcaption></figure>';
  h += '<figure>' + corteSVG(R, {}, C, 'B') + '<figcaption>Corte B-B, marcado na planta.</figcaption></figure>';
  h += '<div class="quebra"></div><figure>' + elevacaoSVG(R, {}, C, lado) + '<figcaption>Elevação (' + LADO_NOME[lado] + '): a escada vista de fora, sem cortar nada.</figcaption></figure>';
  h += '<figure>' + sectionSVG(R, {}, C) + '<figcaption>Perfil desenvolvido ao longo da linha de caminhamento (esquema, não é corte A-A).</figcaption></figure>';
  const det = detalheSVG(R, {}, C); if (det) h += '<figure>' + det + '<figcaption>Detalhe do degrau.</figcaption></figure>';
  h += '<div class="quebra"></div><h2>Verificações</h2><ul class="checks">' + checksHTML(R) + '</ul>';
  h += '<h2>Memória de cálculo</h2><ol class="memo">' + R.memo.map(x => '<li>' + x + '</li>').join('') + '</ol>';
  h += '<h2>Quantitativos (estimativa)</h2>' + quantHTML(R);
  const tmp = document.createElement('div'); tmp.innerHTML = explicacao(R, S, C);
  const completa = $('printExp').checked;
  tmp.querySelectorAll('details.ex').forEach(d => { const tt = (d.querySelector('summary') || {}).textContent || ''; if (!completa && !EX_CURTA.some(k => tt.indexOf(k) === 0)) d.remove(); else d.open = true; });
  h += '<div class="quebra"></div><h2>Explicação' + (completa ? '' : ' (resumo, passo a passo e tabela de degraus)') + '</h2>' + tmp.innerHTML;
  h += '<p class="rodape">' + $('aviso').textContent + '</p>';
  $('printArea').innerHTML = h;
}
function imprimir() { montarRelatorio(); setTimeout(() => window.print(), 50); }

let toastT = null;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1800); }
function copiar(txt, msg) {
  const fallback = () => { const ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) { } ta.remove(); toast(ok ? msg : 'Não consegui copiar'); };
  try { navigator.clipboard.writeText(txt).then(() => toast(msg), fallback); } catch (e) { fallback(); }
}

/* imagem PNG do desenho à vista, sempre no tema claro (fundo de papel), qualquer que seja o tema da tela */
function gerarImagem() {
  if (!CUR) return;
  const T = temaClaro();
  const done = url => { $('modalImg').src = url; const a = $('modalDl'); a.href = url; a.download = 'patamar-' + S.tipo + '-' + (VIEW === 'corte' ? (S.vistaCorte === 'E' ? 'elevacao-' + (S.ladoElev || 'frente') : 'corte-' + (S.vistaCorte || 'A')) : VIEW) + '.png'; abrirDialogo('modal', 'modalDl'); };
  if (VIEW === '3d') { const c = document.createElement('canvas'); c.width = 1600; c.height = 1248; render3D(c, CUR, { yaw: YAW, pitch: PIT }, T); done(c.toDataURL('image/png')); return; }
  const svg = VIEW === 'corte' ? svgCorte(CUR, { pxW: 1600 }, T) : planSVG(CUR, { pxW: 1600 }, T);
  const m = svg.match(/width="(\d+)" height="(\d+)"/); const w = +m[1], h = +m[2];
  const img = new Image(), url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  img.onload = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = T.paper; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url); done(c.toDataURL('image/png')); };
  img.onerror = () => toast('Não consegui gerar a imagem');
  img.src = url;
}

window.addEventListener('beforeprint', montarRelatorio);
window.addEventListener('DOMContentLoaded', () => {
  aplicarTema(lerTema());
  load(); mount(); bind(); renderTypes(); mostrarPainel(PAINEL); render();
  let rt = null; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { draw3d(true); marcarRolagemTipos(); }, 120); });
  window.addEventListener('hashchange', () => { const before = S.tipo + VIEW; load(); if (S.tipo + VIEW !== before) render(); });
});
