/* ===== PRANCHA EM ESCALA (folha A4, A3 ou A2 deitada, em milímetros) =====
   pranchaSVG(R, C, op) devolve um SVG com width="<W>mm" height="<H>mm" e viewBox="0 0 W H": 1 unidade = 1 mm no papel.
   Cada vista é um <svg> aninhado com o viewBox original do desenho (em cm) e largura em mm = largura do viewBox × 10 / escala.
   É isso que garante a escala: em 1:50, 1 m da escada vira 20 mm no papel.
   Margens, moldura e carimbo seguem o uso comum em escolas de arquitetura (margem esquerda maior, para encadernar;
   carimbo no canto inferior direito). Não citamos norma de desenho técnico porque o texto dela não foi conferido.
   montarPrancha(R, C, op) devolve, além do SVG, a escala usada, o retângulo de cada vista e o aviso (o que não coube). */
const FOLHAS = { A4: [297, 210], A3: [420, 297], A2: [594, 420] };
const FOLHA_MAIOR = { A4: 'A3', A3: 'A2', A2: null };
const ESCALAS_AUTO = [50, 75, 100];
const ESCALAS_DET = [5, 10, 20, 25]; /* o detalhe tenta 1:5 e 1:10; se não couber, 1:20 ou 1:25 */
const MARGEM_ESQ = 25, MARGEM = 10; /* mm: uso comum (a da esquerda é maior, para encadernar) */
const FOLGA = 6;    /* mm entre vistas, e entre vistas e carimbo */
const RECUO = 5;    /* mm entre a moldura e as vistas */
const TXT_MM = 2.5; /* altura de texto desejada no papel, em mm */
const NOME_VISTA = { planta: 'PLANTA DO PAVIMENTO INFERIOR', plantaSup: 'PLANTA DO PAVIMENTO SUPERIOR', corteA: 'CORTE A-A', corteB: 'CORTE B-B', elevacao: 'ELEVAÇÃO', detalhe: 'DETALHE DO DEGRAU' };
const VISTAS_PADRAO = ['planta', 'plantaSup', 'corteA', 'corteB', 'detalhe'];
const LADOS_PRANCHA = { frente: 'FRENTE', direita: 'LADO DIREITO', esquerda: 'LADO ESQUERDO', fundos: 'FUNDOS' };

const mm = v => Math.round(v * 1000) / 1000;
/* largura aproximada de um texto em fonte monoespaçada (cada letra ocupa 0,6 da altura) */
const largTxt = (t, h) => String(t).length * h * 0.6;
const hojeBR = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear(); };

/* tira a casca <svg ...> de um desenho e devolve o viewBox (em cm) e o miolo */
function abrirDesenho(str) {
  if (!str) return null;
  const m = /^<svg\b[^>]*?viewBox="([^"]+)"[^>]*>/.exec(str); if (!m) return null;
  const vb = m[1].trim().split(/[\s,]+/).map(Number); if (vb.length !== 4 || vb.some(v => !isFinite(v)) || vb[2] <= 0 || vb[3] <= 0) return null;
  return { vb, corpo: str.slice(m[0].length, str.lastIndexOf('</svg>')) };
}

/* desenha uma vista com o texto do tamanho certo para a escala (o.fs, em cm); sem suporte a o.fs sai com o tamanho de sempre */
function desenhoDaVista(R, C, v, escala, lado) {
  const o = { fs: TXT_MM * escala / 10, semTitulo: true };
  if (v === 'planta') return planSVG(R, Object.assign(o, { modo: 'inf', cortes: true }), C);
  if (v === 'plantaSup') return planSVG(R, Object.assign(o, { modo: 'sup' }), C);
  if (v === 'corteA') return corteSVG(R, o, C, 'A');
  if (v === 'corteB') return corteSVG(R, o, C, 'B');
  if (v === 'elevacao') return elevacaoSVG(R, o, C, lado);
  if (v === 'detalhe') return detalheSVG(R, o, C);
  return '';
}

/* retângulos [x0, y0, x1, y1] em mm */
const cruza = (a, b) => a[0] < b[2] - 1e-9 && b[0] < a[2] - 1e-9 && a[1] < b[3] - 1e-9 && b[1] < a[3] - 1e-9;
/* arranjo "de cima para baixo, da esquerda para a direita": cada caixa vai para o primeiro canto livre (menor y, depois menor x)
   em que cabe dentro da área sem encostar nas outras nem no carimbo. Devolve as posições ou null. */
function arranjar(caixas, area, obst) {
  const postas = obst.map(r => [r[0] - FOLGA, r[1] - FOLGA, r[2] + FOLGA, r[3] + FOLGA]);
  const pos = [];
  for (const c of caixas) {
    const xs = [area[0]].concat(postas.map(r => r[2])), ys = [area[1]].concat(postas.map(r => r[3]));
    const cands = [];
    xs.forEach(x => ys.forEach(y => { if (x >= area[0] - 1e-9 && y >= area[1] - 1e-9) cands.push([x, y]); }));
    cands.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    let achou = null;
    for (const q of cands) {
      const r = [q[0], q[1], q[0] + c.w, q[1] + c.h];
      if (r[2] > area[2] + 1e-9 || r[3] > area[3] + 1e-9) continue;
      if (postas.some(p => cruza(r, p))) continue;
      achou = r; break;
    }
    if (!achou) return null;
    pos.push(achou);
    postas.push([achou[0] - FOLGA, achou[1] - FOLGA, achou[2] + FOLGA, achou[3] + FOLGA]);
  }
  return pos;
}

/* célula do carimbo: rótulo pequeno em cima, valor embaixo (diminui a letra e, se ainda não couber, corta com reticências) */
function celula(x, y, w, h, rotulo, valor, C, tamValor, peso) {
  let s = '<rect x="' + mm(x) + '" y="' + mm(y) + '" width="' + mm(w) + '" height="' + mm(h) + '" fill="none" stroke="' + C.ink + '" stroke-width="0.25"/>';
  s += '<text x="' + mm(x + 1.5) + '" y="' + mm(y + 2.6) + '" font-size="1.8" fill="' + C.muted + '" font-family="' + FONT + '" letter-spacing="0.1">' + escXml(rotulo) + '</text>';
  let t = String(valor || ''), tam = tamValor || 3;
  const cabe = w - 3;
  while (largTxt(t, tam) > cabe && tam > 2) tam = Math.max(2, tam - 0.25);
  if (largTxt(t, tam) > cabe) { const n = Math.max(1, Math.floor(cabe / (tam * 0.6)) - 1); t = t.slice(0, n) + '…'; }
  s += '<text x="' + mm(x + 1.5) + '" y="' + mm(y + h - 1.8) + '" font-size="' + mm(tam) + '" fill="' + C.ink + '" font-family="' + FONT + '"' + (peso ? ' font-weight="' + peso + '"' : '') + ' data-campo="' + escXml(rotulo) + '">' + escXml(t) + '</text>';
  return s;
}

function montarPrancha(R, C, op) {
  op = op || {};
  const formato = FOLHAS[op.formato] ? op.formato : 'A3';
  const [W, H] = FOLHAS[formato];
  /* papel branco; o resto das cores vem do tema claro */
  const Cp = Object.assign({}, C, { paper: '#ffffff' });
  /* na prancha as cotas, os números e as chamadas de corte aparecem sempre, mesmo se a tela estiver sem eles */
  const Rp = Object.create(R); Rp.st = Object.assign({}, R.st, { showDims: true, showNums: true, showCortes: true });
  const pedidas = (Array.isArray(op.vistas) ? op.vistas : VISTAS_PADRAO).filter((v, i, a) => NOME_VISTA[v] && a.indexOf(v) === i);
  const lado = LADOS_PRANCHA[op.ladoElev] ? op.ladoElev : 'frente';
  const tipo = TIPOS.find(t => t.id === R.tipo) || { nome: '' };
  const titulo = String(op.titulo || '').trim() || ('ESCADA ' + tipo.nome.toUpperCase());

  /* moldura e carimbo */
  const mold = [MARGEM_ESQ, MARGEM, W - MARGEM, H - MARGEM];
  const cw = Math.min(175, mold[2] - mold[0]), lin = [12, 9, 9, 9, 9, 9, 13], ch = lin.reduce((a, b) => a + b, 0);
  const carimbo = [mold[2] - cw, mold[3] - ch, mold[2], mold[3]];
  const area = [mold[0] + RECUO, mold[1] + RECUO, mold[2] - RECUO, mold[3] - RECUO];

  /* tenta uma escala principal e uma do detalhe; devolve o arranjo ou null */
  const cache = {};
  const vista = (v, esc) => { const k = v + '@' + esc; if (!(k in cache)) cache[k] = abrirDesenho(desenhoDaVista(Rp, Cp, v, esc, lado)); return cache[k]; };
  const caixaDe = (v, esc) => {
    const d = vista(v, esc); if (!d) return null;
    const nome = NOME_VISTA[v] + (v === 'elevacao' ? ' · ' + LADOS_PRANCHA[lado] : '');
    const sub = 'ESCALA 1:' + esc;
    const w = d.vb[2] * 10 / esc, h = d.vb[3] * 10 / esc;
    return { v, d, esc, nome, sub, w: Math.max(w, largTxt(nome, 3), largTxt(sub, 2.5)), h: h + 11, dw: w, dh: h };
  };
  const tentar = (esc, escD, lista) => {
    const caixas = lista.map(v => caixaDe(v, v === 'detalhe' ? escD : esc)).filter(Boolean);
    let pos = arranjar(caixas, area, [carimbo]);
    if (!pos) {
      /* outras ordens de encaixe: primeiro das mais altas para as mais baixas, depois todas as permutações (no máximo 6 vistas = 720) */
      const ords = [caixas.slice().sort((a, b) => b.h - a.h || b.w - a.w)];
      const perm = (a) => a.length <= 1 ? [a] : [].concat.apply([], a.map((x, i) => perm(a.slice(0, i).concat(a.slice(i + 1))).map(r => [x].concat(r))));
      if (caixas.length <= 6) perm(caixas).forEach(o => ords.push(o));
      for (const ord of ords) { const p2 = arranjar(ord, area, [carimbo]); if (p2) { pos = caixas.map(c => p2[ord.indexOf(c)]); break; } }
    }
    return pos ? { caixas, pos } : null;
  };
  const escalas = op.escala === undefined || op.escala === 'auto' ? ESCALAS_AUTO : [Number(op.escala)].filter(e => e > 0);
  if (!escalas.length) escalas.push(50);
  const temDet = pedidas.indexOf('detalhe') >= 0;
  let res = null, esc = escalas[escalas.length - 1], escD = temDet ? ESCALAS_DET[ESCALAS_DET.length - 1] : null;
  fora: for (const e of escalas) for (const ed of (temDet ? ESCALAS_DET : [null])) {
    const r = tentar(e, ed, pedidas);
    if (r) { res = r; esc = e; escD = ed; break fora; }
  }
  /* não coube tudo: na menor escala, põe uma vista de cada vez, na ordem pedida, e avisa o que ficou de fora */
  const omitidas = [];
  if (!res) {
    let lista = [];
    for (const v of pedidas) { const r = tentar(esc, escD, lista.concat([v])); if (r) { lista.push(v); res = r; } else omitidas.push(v); }
    if (!res) res = { caixas: [], pos: [] };
  }
  let aviso = '';
  if (omitidas.length) {
    const maior = FOLHA_MAIOR[formato];
    aviso = 'Não coube na folha ' + formato + ' em 1:' + esc + ': ' + omitidas.map(v => NOME_VISTA[v].toLowerCase().replace(/ ([ab]-[ab])$/, m => m.toUpperCase())).join(', ') + '. ' +
      [maior ? 'use a folha ' + maior : '', esc < 100 ? 'a escala 1:100 (desenho menor)' : '', 'desmarque alguma vista'].filter(Boolean).join(', ').replace(/^./, c => c.toUpperCase()).replace(/, ([^,]+)$/, ' ou $1') + '.';
  }

  /* ---- monta a folha ---- */
  const T = (x, y, t, tam, cor, anc, peso, extra) => '<text x="' + mm(x) + '" y="' + mm(y) + '" font-size="' + mm(tam) + '" fill="' + cor + '" font-family="' + FONT + '"' + (anc ? ' text-anchor="' + anc + '"' : '') + (peso ? ' font-weight="' + peso + '"' : '') + (extra || '') + '>' + escXml(t) + '</text>';
  let s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + 'mm" height="' + H + 'mm" viewBox="0 0 ' + W + ' ' + H + '" class="folha" data-formato="' + formato + '" data-escala="' + esc + '"' + (escD ? ' data-escala-detalhe="' + escD + '"' : '') + (aviso ? ' data-aviso="' + escXml(aviso).replace(/"/g, '&quot;') + '"' : '') + ' role="img" aria-label="' + escXml('Prancha ' + formato + ': ' + titulo).replace(/"/g, '&quot;') + '">';
  if (aviso) s += '<!-- AVISO: ' + aviso.replace(/--/g, '—') + ' -->';
  s += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#ffffff"/>';
  s += '<rect x="' + mold[0] + '" y="' + mold[1] + '" width="' + (mold[2] - mold[0]) + '" height="' + (mold[3] - mold[1]) + '" fill="none" stroke="' + Cp.ink + '" stroke-width="0.5" data-moldura="1"/>';
  const vistas = [];
  res.caixas.forEach((c, i) => {
    const p = res.pos[i], dx = p[0] + (c.w - c.dw) / 2, dy = p[1];
    s += '<g data-vista="' + c.v + '">';
    s += '<svg x="' + mm(dx) + '" y="' + mm(dy) + '" width="' + mm(c.dw) + '" height="' + mm(c.dh) + '" viewBox="' + c.d.vb.join(' ') + '" overflow="hidden" data-escala="' + c.esc + '">' + c.d.corpo + '</svg>';
    const cx = p[0] + c.w / 2, yt = dy + c.dh + 4.5, lt = Math.max(largTxt(c.nome, 3), largTxt(c.sub, 2.5));
    s += T(cx, yt, c.nome, 3, Cp.ink, 'middle', 600);
    s += '<line x1="' + mm(cx - lt / 2) + '" y1="' + mm(yt + 1.2) + '" x2="' + mm(cx + lt / 2) + '" y2="' + mm(yt + 1.2) + '" stroke="' + Cp.ink + '" stroke-width="0.35"/>';
    s += T(cx, yt + 5, c.sub, 2.5, Cp.muted, 'middle');
    s += '</g>';
    vistas.push({ id: c.v, nome: c.nome, escala: c.esc, vb: c.d.vb.slice(), x: dx, y: dy, w: c.dw, h: c.dh, caixa: { x: p[0], y: p[1], w: c.w, h: c.h } });
  });

  /* carimbo */
  const [kx, ky] = carimbo;
  let y = ky, k = '<g data-carimbo="1">';
  k += '<rect x="' + mm(kx) + '" y="' + mm(ky) + '" width="' + mm(cw) + '" height="' + mm(ch) + '" fill="#ffffff" stroke="' + Cp.ink + '" stroke-width="0.5"/>';
  const w1 = cw - 60, wm = cw / 2;
  k += celula(kx, y, cw, lin[0], 'TÍTULO', titulo, Cp, 4.5, 600); y += lin[0];
  k += celula(kx, y, w1, lin[1], 'ALUNA(O)', op.aluno, Cp) + celula(kx + w1, y, 60, lin[1], 'DATA', op.data || hojeBR(), Cp); y += lin[1];
  k += celula(kx, y, wm, lin[2], 'DISCIPLINA', op.disciplina, Cp) + celula(kx + wm, y, cw - wm, lin[2], 'PROFESSOR(A)', op.professor, Cp); y += lin[2];
  const escTxt = 'PLANTAS E CORTES 1:' + esc + (escD && vistas.some(v => v.id === 'detalhe') ? ' · DETALHE 1:' + escD : '');
  k += celula(kx, y, w1, lin[3], 'ESCALAS', escTxt, Cp) + celula(kx + w1, y, 60, lin[3], 'FOLHA', '01/01 · ' + formato, Cp); y += lin[3];
  const nm = R.nm || {};
  k += celula(kx, y, cw, lin[4], 'PERFIL NORMATIVO', nm.rotulo || nm.nome || 'Personalizada', Cp); y += lin[4];
  const resumo = R.N + ' espelhos de ' + fmt(R.e, 2) + ' cm · piso ' + fmt(R.p, 1) + ' cm · Blondel ' + fmt(R.bl, 1) + ' cm · desnível ' + fmt(R.H) + ' cm';
  k += celula(kx, y, cw, lin[5], 'RESUMO', resumo, Cp); y += lin[5];
  /* régua de conferência: 100 mm no papel */
  k += '<rect x="' + mm(kx) + '" y="' + mm(y) + '" width="' + mm(cw) + '" height="' + lin[6] + '" fill="none" stroke="' + Cp.ink + '" stroke-width="0.25"/>';
  const rx = kx + 4, ry = y + 7.5;
  k += '<g data-regua="100">';
  k += '<line x1="' + mm(rx) + '" y1="' + mm(ry) + '" x2="' + mm(rx + 100) + '" y2="' + mm(ry) + '" stroke="' + Cp.ink + '" stroke-width="0.4" data-regua-traco="1"/>';
  for (let i = 0; i <= 10; i++) { const t = i % 5 === 0 ? 2.2 : 1.2; k += '<line x1="' + mm(rx + i * 10) + '" y1="' + mm(ry - t) + '" x2="' + mm(rx + i * 10) + '" y2="' + mm(ry) + '" stroke="' + Cp.ink + '" stroke-width="0.25"/>'; }
  k += T(rx, ry + 3.6, '0', 2, Cp.muted, 'middle') + T(rx + 50, ry + 3.6, '50', 2, Cp.muted, 'middle') + T(rx + 100, ry + 3.6, '100 mm', 2, Cp.muted, 'middle');
  k += T(rx, y + 3, 'Este traço mede 100 mm no papel:', 2, Cp.ink, 'start');
  k += '</g>';
  const nx = rx + 108;
  k += T(nx, y + 5.2, 'Imprimir em tamanho real', 2.4, Cp.ink, 'start', 600, ' data-nota="1"');
  k += T(nx, y + 8.6, '(escala 100%).', 2.4, Cp.ink, 'start', 600);
  k += T(nx, y + 11.6, 'Cotas em cm · níveis em m', 2, Cp.muted, 'start');
  k += '</g>';
  s += k + '</svg>';

  return { svg: s, W, H, formato, escala: esc, escalaDetalhe: vistas.some(v => v.id === 'detalhe') ? escD : null, vistas, omitidas, aviso, moldura: { x: mold[0], y: mold[1], w: mold[2] - mold[0], h: mold[3] - mold[1] }, carimbo: { x: kx, y: ky, w: cw, h: ch } };
}

function pranchaSVG(R, C, op) { return montarPrancha(R, C, op).svg; }
