/* ===== EXPORTAÇÃO DXF (AutoCAD R12, ASCII) =====
   Converte os SVGs dos nossos próprios desenhos (planta, cortes, elevação, detalhe) em entidades DXF em unidades reais.
   Os desenhos já estão em centímetros reais (viewBox em cm, y para baixo); aqui o y volta para cima e a unidade
   vira metro (padrão) ou centímetro. O formato é o R12 (AC1009), o mais aceito: AutoCAD, LibreCAD, QCAD, BricsCAD, SketchUp.
   O R12 não tem $INSUNITS: a unidade fica escrita no próprio desenho ("Unidade: metros").
   Função pura (sem DOM): dxfDe(R, C, op) devolve o texto do DXF; dxfBytes(texto) devolve os bytes em windows-1252. */

/* camadas: nome, cor ACI e tipo de linha padrão */
const DXF_CAMADAS = [
  ['0', 7, 'CONTINUOUS'], ['CONTORNO', 7, 'CONTINUOUS'], ['DEGRAUS', 7, 'CONTINUOUS'], ['PATAMAR', 3, 'CONTINUOUS'],
  ['LEQUE', 40, 'CONTINUOUS'], ['VISTA', 8, 'CONTINUOUS'], ['PROJECAO', 8, 'CONTINUOUS'], ['PISO_SUPERIOR', 8, 'CONTINUOUS'],
  ['LINHA_CAMINHAMENTO', 30, 'CONTINUOUS'], ['VAO_LAJE', 5, 'CONTINUOUS'], ['LINHA_CORTE', 5, 'CONTINUOUS'],
  ['ALTURA_LIVRE', 30, 'CONTINUOUS'], ['LINHA_BOCEIS', 5, 'CONTINUOUS'], ['COTAS', 1, 'CONTINUOUS'], ['TEXTO', 7, 'CONTINUOUS'],
  ['NUMEROS', 8, 'CONTINUOUS'], ['TITULO', 7, 'CONTINUOUS'], ['HACHURA', 8, 'CONTINUOUS'], ['PILAR', 7, 'CONTINUOUS'],
  ['CORRIMAO', 6, 'CONTINUOUS']
];
/* tipos de linha, em cm (convertidos para a unidade pedida); os "_DET" são para o detalhe ampliado, que é pequeno */
const DXF_LTYPES = [
  ['DASHED', 'Tracejado __ __ __', [12, -6]],
  ['DASHDOT', 'Traco e ponto __ . __ .', [20, -5, 0, -5]],
  ['DASHED_DET', 'Tracejado fino (detalhe) _ _ _', [2, -1]],
  ['DASHDOT_DET', 'Traco e ponto fino (detalhe) _ . _', [3, -1, 0, -1]]
];
/* o detalhe desenha os degraus em verdadeira grandeza, mas a altura do corrimão fora de escala (cota interrompida, detail.js) */
const DXF_TITULOS = { planta: 'PLANTA DO PAVIMENTO INFERIOR', plantaSup: 'PLANTA DO PAVIMENTO SUPERIOR', corteA: 'CORTE A-A', corteB: 'CORTE B-B', elevacao: 'ELEVAÇÃO', detalhe: 'DETALHE DO DEGRAU (degraus em 1:1; altura do corrimão fora de escala)' };
/* tema claro (o mesmo do template.html), se ninguém passar as cores */
const DXF_TEMA = { paper: '#eef2f4', ink: '#13242f', muted: '#5a6b78', line: '#cdd7dd', accent: '#d9531a', info: '#2a6fbb', tread: '#dbe6ec', winder: '#f6d9c4', patamar: '#cfe5d9', piso: '#e8edf0' };

/* windows-1252: de 0x80 a 0x9F não é igual ao Latin-1 */
const CP1252_ALTO = { 0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F };
function byte1252(cp) {
  if (cp < 0x80 || (cp >= 0xA0 && cp <= 0xFF)) return cp;
  return CP1252_ALTO[cp] === undefined ? -1 : CP1252_ALTO[cp];
}
/* texto para o DXF: ≥ e ≤ (que não existem no windows-1252) viram >= e <=, legíveis em qualquer programa;
   outro caractere fora do windows-1252 vira \U+XXXX (notação do AutoCAD) */
function dxfTexto(s) {
  let out = '';
  for (const ch of String(s).replace(/[\r\n]+/g, ' ').replace(/≥/g, '>=').replace(/≤/g, '<=')) {
    const cp = ch.codePointAt(0);
    out += byte1252(cp) >= 0 ? ch : '\\U+' + cp.toString(16).toUpperCase().padStart(4, '0');
  }
  return out;
}
/* bytes do DXF em windows-1252 (o cabeçalho diz $DWGCODEPAGE ANSI_1252), para a interface baixar o arquivo */
function dxfBytes(str) {
  const out = [];
  for (const ch of String(str)) {
    const b = byte1252(ch.codePointAt(0));
    out.push(b >= 0 ? b : 0x3F);
  }
  return Uint8Array.from(out);
}

/* ---------- leitura do SVG dos nossos desenhos ---------- */
function svgAttrs(tag) {
  const a = {}; let m; const re = /([\w:-]+)="([^"]*)"/g;
  while ((m = re.exec(tag))) a[m[1]] = m[2];
  return a;
}
const desescXml = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const svgPts = s => (s || '').trim().split(/\s+/).filter(Boolean).map(p => { const v = p.split(',').map(Number); return [v[0], -v[1]]; });
/* círculo como polígono (para recorte) */
const circPoly = (cx, cy, r, n) => { const o = []; for (let i = 0; i < (n || 72); i++) { const a = 2 * Math.PI * i / (n || 72); o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return o; };
/* fora: polígono circunscrito (raio / cos(π/n)), para um oclusor circular não deixar lascas entre o círculo e o polígono */
function formaPoly(nome, a, fora) {
  /* devolve a forma em coordenadas do mundo (y para cima) */
  if (nome === 'rect') { const x = +a.x || 0, y = +a.y || 0, w = +a.width || 0, h = +a.height || 0; return [[x, -y], [x + w, -y], [x + w, -(y + h)], [x, -(y + h)]]; }
  if (nome === 'circle') return circPoly(+a.cx || 0, -(+a.cy || 0), (+a.r || 0) / (fora ? Math.cos(Math.PI / 72) : 1));
  if (nome === 'polygon' || nome === 'polyline') return svgPts(a.points);
  return null;
}

/* recorte de um segmento por um polígono convexo (Cyrus-Beck); devolve [t0, t1] ou null */
function recorteSeg(A, B, clip) {
  let t0 = 0, t1 = 1;
  /* orientação do polígono: normais para dentro */
  let area = 0; for (let i = 0; i < clip.length; i++) { const p = clip[i], q = clip[(i + 1) % clip.length]; area += p[0] * q[1] - q[0] * p[1]; }
  const sg = area >= 0 ? 1 : -1, dx = B[0] - A[0], dy = B[1] - A[1];
  for (let i = 0; i < clip.length; i++) {
    const p = clip[i], q = clip[(i + 1) % clip.length];
    const nx = -(q[1] - p[1]) * sg, ny = (q[0] - p[0]) * sg; /* normal para dentro */
    const num = (A[0] - p[0]) * nx + (A[1] - p[1]) * ny, den = dx * nx + dy * ny;
    if (Math.abs(den) < 1e-12) { if (num < -1e-9) return null; continue; }
    const t = -num / den;
    if (den > 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t);
    if (t0 > t1 + 1e-12) return null;
  }
  return t1 - t0 > 1e-9 ? [t0, t1] : null;
}
function dentroConvexo(P, clip) { const A = P, B = [P[0] + 1e-9, P[1]]; return !!recorteSeg(A, B, clip); }

/* ---------- linhas escondidas ----------
   No SVG, o que é desenhado depois com preenchimento opaco cobre o que veio antes (é assim que os cortes e a elevação
   escondem o que fica atrás). No DXF não há preenchimento: as partes das linhas anteriores que caem dentro de uma
   figura opaca são apagadas. Em cima da borda não se apaga nada (a própria figura redesenha a borda). */
function dentroPoligono(P, pts) {
  let d = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i], b = pts[j];
    if ((a[1] > P[1]) !== (b[1] > P[1]) && P[0] < (b[0] - a[0]) * (P[1] - a[1]) / (b[1] - a[1]) + a[0]) d = !d;
  }
  return d;
}
function distBorda(P, pts) {
  let m = Infinity;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[j], b = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1e-18;
    const t = Math.max(0, Math.min(1, ((P[0] - a[0]) * dx + (P[1] - a[1]) * dy) / l2));
    m = Math.min(m, Math.hypot(P[0] - a[0] - dx * t, P[1] - a[1] - dy * t));
  }
  return m;
}
/* oclusor: polígono (e o recorte convexo ativo, se houver); devolve a função "está escondido?" e as bordas */
function oclusor(poly, clip) {
  const bordas = [];
  [poly, clip].forEach(p => { if (p) for (let i = 0; i < p.length; i++) bordas.push([p[i], p[(i + 1) % p.length]]); });
  const bb = [Infinity, Infinity, -Infinity, -Infinity];
  poly.forEach(q => { bb[0] = Math.min(bb[0], q[0]); bb[1] = Math.min(bb[1], q[1]); bb[2] = Math.max(bb[2], q[0]); bb[3] = Math.max(bb[3], q[1]); });
  const esc = q => dentroPoligono(q, poly) && distBorda(q, poly) > 1e-4 && (!clip || (dentroConvexo(q, clip) && distBorda(q, clip) > 1e-4));
  return { esc, bordas, bb };
}
/* trechos visíveis (parâmetros t em [0,1]) do segmento AB diante do oclusor */
function trechosVisiveis(A, B, oc) {
  const minx = Math.min(A[0], B[0]), maxx = Math.max(A[0], B[0]), miny = Math.min(A[1], B[1]), maxy = Math.max(A[1], B[1]);
  if (maxx < oc.bb[0] || minx > oc.bb[2] || maxy < oc.bb[1] || miny > oc.bb[3]) return [[0, 1]];
  const ts = [0, 1], dx = B[0] - A[0], dy = B[1] - A[1];
  oc.bordas.forEach(e => {
    const p = e[0], ex = e[1][0] - p[0], ey = e[1][1] - p[1], den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-14) return;
    const t = ((p[0] - A[0]) * ey - (p[1] - A[1]) * ex) / den, u = ((p[0] - A[0]) * dy - (p[1] - A[1]) * dx) / den;
    if (t > 0 && t < 1 && u >= -1e-9 && u <= 1 + 1e-9) ts.push(t);
  });
  ts.sort((x, y) => x - y);
  const out = [];
  for (let i = 0; i + 1 < ts.length; i++) {
    const t0 = ts[i], t1 = ts[i + 1]; if (t1 - t0 < 1e-9) continue;
    const tm = (t0 + t1) / 2;
    if (oc.esc([A[0] + dx * tm, A[1] + dy * tm])) continue;
    if (out.length && Math.abs(out[out.length - 1][1] - t0) < 1e-9) out[out.length - 1][1] = t1; else out.push([t0, t1]);
  }
  return out;
}
/* apaga das primitivas já desenhadas o que o oclusor cobre */
function esconder(prims, oc) {
  const lerp = (A, B, t) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
  const novas = [];
  prims.forEach(p => {
    if (p.t === 'line') {
      trechosVisiveis(p.a, p.b, oc).forEach(r => novas.push(Object.assign({}, p, { a: lerp(p.a, p.b, r[0]), b: lerp(p.a, p.b, r[1]) })));
    } else if (p.t === 'pline') {
      const n = p.pts.length, m = p.fechada ? n : n - 1, runs = [];
      let inteiro = true, cur = null;
      for (let i = 0; i < m; i++) {
        const A = p.pts[i], B = p.pts[(i + 1) % n], vs = trechosVisiveis(A, B, oc);
        if (!(vs.length === 1 && vs[0][0] === 0 && vs[0][1] === 1)) inteiro = false;
        vs.forEach(r => {
          const P = lerp(A, B, r[0]), Q = lerp(A, B, r[1]);
          if (cur && r[0] === 0 && Math.hypot(cur[cur.length - 1][0] - P[0], cur[cur.length - 1][1] - P[1]) < 1e-9) cur.push(Q);
          else { if (cur) runs.push(cur); cur = [P, Q]; }
        });
        if (!vs.length || vs[vs.length - 1][1] < 1) { if (cur) runs.push(cur); cur = null; }
      }
      if (cur) runs.push(cur);
      if (inteiro) { novas.push(p); return; }
      if (p.fechada && runs.length > 1) { const u = runs[runs.length - 1], f = runs[0]; if (Math.hypot(u[u.length - 1][0] - f[0][0], u[u.length - 1][1] - f[0][1]) < 1e-9) runs[0] = runs.pop().concat(f.slice(1)); }
      runs.forEach(r => novas.push(r.length === 2 ? { t: 'line', a: r[0], b: r[1], cam: p.cam, lt: p.lt } : Object.assign({}, p, { pts: r, fechada: false })));
    } else if (p.t === 'text') {
      if (!oc.esc(p.p)) novas.push(p);
    } else if (p.t === 'circle' || p.t === 'arc') {
      const amostra = [0, 1, 2, 3, 4, 5, 6, 7].map(i => [p.c[0] + p.r * Math.cos(i * Math.PI / 4), p.c[1] + p.r * Math.sin(i * Math.PI / 4)]);
      if (!(oc.esc(p.c) && amostra.every(oc.esc))) novas.push(p);
    } else if (p.t === 'solid') {
      if (!p.pts.every(oc.esc)) novas.push(p);
    }
  });
  prims.length = 0;
  novas.forEach(p => prims.push(p));
}

/* hachura: linhas a 45° recortadas pelo polígono (regra par-ímpar); esp = espaçamento em cm */
function hachuraLinhas(pts, esp) {
  const d = [Math.SQRT1_2, Math.SQRT1_2], n = [-Math.SQRT1_2, Math.SQRT1_2], out = [];
  const tn = pts.map(q => q[0] * n[0] + q[1] * n[1]);
  const t0 = Math.ceil(Math.min.apply(null, tn) / esp) * esp, t1 = Math.max.apply(null, tn);
  for (let t = t0; t <= t1; t += esp) {
    const sv = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], fa = tn[i] - t + 1e-9, fb = tn[(i + 1) % pts.length] - t + 1e-9;
      if ((fa < 0) !== (fb < 0)) { const k = fa / (fa - fb), q = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; sv.push(q[0] * d[0] + q[1] * d[1]); }
    }
    sv.sort((x, y) => x - y);
    for (let i = 0; i + 1 < sv.length; i += 2) if (sv[i + 1] - sv[i] > 1e-6) out.push([[n[0] * t + d[0] * sv[i], n[1] * t + d[1] * sv[i]], [n[0] * t + d[0] * sv[i + 1], n[1] * t + d[1] * sv[i + 1]]]);
  }
  return out;
}

/* lê um SVG nosso e devolve as primitivas em cm, y para cima:
   {t:'line'|'pline'|'circle'|'arc'|'text'|'solid', cam, lt, ...} */
function svgParaPrims(svg, C, det) {
  const prims = [], pilha = [{ cam: null, clip: null, defs: false }], padroes = {}, clips = {};
  let defsAtual = null, clipAtual = null, textoAberto = null;
  const topo = () => pilha[pilha.length - 1];
  const camPadrao = (a, eTexto) => {
    if (eTexto) return 'TEXTO';
    const st = a.stroke;
    if (st === C.accent) return 'LINHA_CAMINHAMENTO';
    if (st === C.info) return 'LINHA_CORTE';
    if (st === C.muted) return a['stroke-dasharray'] ? 'PROJECAO' : 'VISTA';
    return 'CONTORNO';
  };
  const ltDe = a => { const d = a['stroke-dasharray']; if (!d) return null; const k = d.trim().split(/[\s,]+/).length >= 3 ? 'DASHDOT' : 'DASHED'; return det ? k + '_DET' : k; };
  const temTraco = a => a.stroke && a.stroke !== 'none' && a.stroke !== C.paper;
  /* recorta uma polilinha pelo clip ativo; devolve trechos */
  const recorta = (pts, fechada) => {
    const clip = topo().clip;
    if (!clip) return [{ pts, fechada }];
    const segs = [], n = pts.length, m = fechada ? n : n - 1, out = [];
    let inteiro = true;
    for (let i = 0; i < m; i++) {
      const A = pts[i], B = pts[(i + 1) % n], r = recorteSeg(A, B, clip);
      if (!r) { segs.push(null); inteiro = false; continue; }
      if (r[0] > 1e-9 || r[1] < 1 - 1e-9) inteiro = false;
      segs.push([[A[0] + (B[0] - A[0]) * r[0], A[1] + (B[1] - A[1]) * r[0]], [A[0] + (B[0] - A[0]) * r[1], A[1] + (B[1] - A[1]) * r[1]]]);
    }
    if (inteiro) return [{ pts, fechada }]; /* tudo dentro do recorte */
    const junto = (P, Q) => Math.hypot(P[0] - Q[0], P[1] - Q[1]) < 1e-6;
    let cur = null;
    segs.forEach(sg => {
      if (!sg) { if (cur) out.push(cur); cur = null; return; }
      if (cur && junto(sg[0], cur.pts[cur.pts.length - 1])) cur.pts.push(sg[1]);
      else { if (cur) out.push(cur); cur = { pts: [sg[0], sg[1]], fechada: false }; }
    });
    if (cur) out.push(cur);
    /* polígono fechado: o último trecho continua no primeiro */
    if (fechada && out.length > 1 && junto(out[out.length - 1].pts[out[out.length - 1].pts.length - 1], out[0].pts[0])) out[0].pts = out.pop().pts.concat(out[0].pts.slice(1));
    return out;
  };
  const hachura = (a, poly) => {
    const m = /^url\(#([^)]+)\)$/.exec(a.fill || ''); if (!m || !poly || poly.length < 3) return;
    const p = padroes[m[1]] || { w: 7, linhas: true };
    const esp = p.linhas ? p.w : p.w / 3;
    hachuraLinhas(poly, esp).forEach(sg => recorta(sg, false).forEach(tr => prims.push({ t: 'line', a: tr.pts[0], b: tr.pts[tr.pts.length - 1], cam: 'HACHURA' })));
  };
  const contorno = (a, pts, fechada, cam) => {
    if (!temTraco(a)) return;
    const lt = ltDe(a);
    recorta(pts, fechada).forEach(tr => {
      if (tr.pts.length === 2 && !tr.fechada) prims.push({ t: 'line', a: tr.pts[0], b: tr.pts[1], cam, lt });
      else prims.push({ t: 'pline', pts: tr.pts, fechada: tr.fechada, cam, lt });
    });
  };
  /* preenchimento sólido nos triângulos e quadriláteros pequenos (pontas de seta, escala gráfica) */
  const solido = (a, pts, cam) => {
    if (pts.length < 3 || pts.length > 4 || (topo().clip && !pts.every(q => dentroConvexo(q, topo().clip)))) return;
    const f = a.fill;
    if (f && (f === a.stroke || f === C.ink) && f !== 'none' && !/^url/.test(f)) prims.push({ t: 'solid', pts, cam });
  };
  const tokens = svg.match(/<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>|[^<]+/g) || [];
  tokens.forEach(tk => {
    if (tk[0] !== '<') { if (textoAberto) textoAberto.s += desescXml(tk); return; }
    if (tk.startsWith('<!--')) return;
    const fecha = tk[1] === '/', auto = /\/>$/.test(tk), nome = (/^<\/?([a-zA-Z]+)/.exec(tk) || [])[1];
    if (fecha) {
      if (nome === 'text' && textoAberto) { if (textoAberto.s.trim()) prims.push(textoAberto); textoAberto = null; return; }
      if (nome === 'g' || nome === 'svg') pilha.pop();
      else if (nome === 'pattern') defsAtual = true;
      else if (nome === 'defs') defsAtual = null, topo().defs = false;
      else if (nome === 'clipPath') clipAtual = null;
      return;
    }
    const a = svgAttrs(tk);
    const pai = topo();
    if (nome === 'svg') { pilha.push({ cam: null, clip: null, defs: false }); return; }
    if (nome === 'defs') { if (!auto) { defsAtual = true; pai.defs = true; } return; }
    if (defsAtual) {
      if (nome === 'pattern') { padroes[a.id] = { w: +a.width || 7, linhas: false }; defsAtual = a.id; }
      else if (nome === 'line' && padroes[defsAtual]) padroes[defsAtual].linhas = true;
      else if (nome === 'rect' && padroes[defsAtual]) padroes[defsAtual].fundo = true; /* padrão com fundo: é opaco */
      else if (nome === 'clipPath') clipAtual = a.id;
      else if (clipAtual && !clips[clipAtual]) { const f = formaPoly(nome, a); if (f) clips[clipAtual] = f; }
      return;
    }
    if (nome === 'g') {
      const cl = /^url\(#([^)]+)\)$/.exec(a['clip-path'] || '');
      pilha.push({ cam: a['data-camada'] || pai.cam, clip: cl ? clips[cl[1]] || pai.clip : pai.clip, defs: false });
      return;
    }
    const camEl = a['data-camada'] || pai.cam;
    if (nome === 'text') {
      const x = +a.x, y = -(+a.y), rm = /rotate\(([-\d.e]+)/.exec(a.transform || '');
      if (pai.clip && !dentroConvexo([x, y], pai.clip)) { textoAberto = { s: '' }; textoAberto.t = 'nada'; return; }
      textoAberto = { t: 'text', p: [x, y], h: +a['font-size'] || 1, rot: rm ? -(+rm[1]) : 0, anc: a['text-anchor'] || 'start', s: '', cam: camEl || 'TEXTO' };
      if (auto) textoAberto = null;
      return;
    }
    const cam = camEl || camPadrao(a);
    /* figura opaca: esconde o que já foi desenhado embaixo dela */
    if (nome === 'polygon' || nome === 'rect' || nome === 'circle') {
      const f = a.fill || '', pm = /^url\(#([^)]+)\)$/.exec(f);
      const opaca = f && f !== 'none' && (a['fill-opacity'] === undefined || +a['fill-opacity'] >= 1) && (!pm || (padroes[pm[1]] && padroes[pm[1]].fundo));
      const forma = opaca && formaPoly(nome, a, true);
      if (forma && forma.length >= 3) esconder(prims, oclusor(forma, pai.clip));
    }
    if (nome === 'line') contorno(a, [[+a.x1, -a.y1], [+a.x2, -a.y2]], false, cam);
    else if (nome === 'polyline') contorno(a, svgPts(a.points), false, cam);
    else if (nome === 'polygon' || nome === 'rect') {
      const pts = formaPoly(nome, a);
      hachura(a, pts); solido(a, pts, cam); contorno(a, pts, true, cam);
    } else if (nome === 'circle') {
      const c = [+a.cx || 0, -(+a.cy || 0)], r = +a.r || 0;
      if (r <= 0 || (pai.clip && !dentroConvexo(c, pai.clip))) return;
      if (temTraco(a) || (a.fill && a.fill !== 'none' && a.fill !== C.paper)) prims.push({ t: 'circle', c, r, cam, lt: ltDe(a) });
    } else if (nome === 'path') {
      /* só o que os desenhos usam: M x,y e A r,r 0 large sweep x,y (arco de círculo) */
      const d = a.d || '', mm = /M\s*([-\d.e]+)[ ,]([-\d.e]+)/.exec(d), am = /A\s*([-\d.e]+)[ ,]([-\d.e]+)\s+[-\d.e]+\s+([01])\s+([01])\s+([-\d.e]+)[ ,]([-\d.e]+)/.exec(d);
      if (!mm || !am || !temTraco(a)) return;
      const P0 = [+mm[1], -mm[2]], P1 = [+am[5], -am[6]], r = +am[1], grande = am[3] === '1', ccw = am[4] === '0';
      /* no SVG (y para baixo) sweep 0 é anti-horário na tela; com o y invertido continua anti-horário */
      const mx = (P0[0] + P1[0]) / 2, my = (P0[1] + P1[1]) / 2, dx = P1[0] - P0[0], dy = P1[1] - P0[1], cd = Math.hypot(dx, dy) / 2 || 1e-9;
      const h = Math.sqrt(Math.max(0, r * r - cd * cd)), esq = (ccw && !grande) || (!ccw && grande), sg = esq ? 1 : -1;
      const c = [mx - dy / (2 * cd) * h * sg, my + dx / (2 * cd) * h * sg];
      const ang = P => Math.atan2(P[1] - c[1], P[0] - c[0]) * 180 / Math.PI;
      prims.push({ t: 'arc', c, r, a0: ccw ? ang(P0) : ang(P1), a1: ccw ? ang(P1) : ang(P0), cam, lt: ltDe(a) });
    }
  });
  return prims.filter(p => p.t !== 'nada');
}

/* caixa das primitivas (em cm, y para cima); o texto conta pelo ponto de inserção e uma largura estimada */
function primsBbox(prims) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  const B = (x, y) => { if (!isFinite(x) || !isFinite(y)) return; b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y); };
  prims.forEach(p => {
    if (p.t === 'line') { B(p.a[0], p.a[1]); B(p.b[0], p.b[1]); }
    else if (p.t === 'pline' || p.t === 'solid') p.pts.forEach(q => B(q[0], q[1]));
    else if (p.t === 'circle' || p.t === 'arc') { B(p.c[0] - p.r, p.c[1] - p.r); B(p.c[0] + p.r, p.c[1] + p.r); }
    else if (p.t === 'text') {
      const w = p.s.length * p.h * 0.6, f = p.anc === 'middle' ? 0.5 : p.anc === 'end' ? 1 : 0;
      const r = p.rot * Math.PI / 180, ux = Math.cos(r), uy = Math.sin(r);
      B(p.p[0] - ux * w * f, p.p[1] - uy * w * f); B(p.p[0] + ux * w * (1 - f), p.p[1] + uy * w * (1 - f));
    }
  });
  return b;
}

/* SVG de cada vista, com o tamanho de texto da tela (o DXF é em verdadeira grandeza) ou o op.fs pedido.
   Sem o título interno nem a escala gráfica do SVG (semTitulo): cada vista recebe um só título, o do dxfDe */
function dxfVistaSVG(R, C, v, op) {
  const o = Object.assign({ semTitulo: true }, op.fs > 0 ? { fs: op.fs } : {});
  if (v === 'planta') return planSVG(R, Object.assign({ modo: 'inf' }, o), C);
  if (v === 'plantaSup') return planSVG(R, Object.assign({ modo: 'sup' }, o), C);
  if (v === 'corteA') return corteSVG(R, o, C, 'A');
  if (v === 'corteB') return corteSVG(R, o, C, 'B');
  if (v === 'elevacao') return elevacaoSVG(R, o, C, op.ladoElev || 'frente');
  if (v === 'detalhe') return detalheSVG(R, o, C);
  return '';
}

function dxfDe(R, C, op) {
  op = op || {};
  C = C && C.ink ? C : DXF_TEMA;
  const unidade = op.unidade === 'cm' ? 'cm' : 'm', k = unidade === 'cm' ? 1 : 0.01;
  const VISTAS = ['planta', 'plantaSup', 'corteA', 'corteB', 'elevacao', 'detalhe'];
  const vistas = (Array.isArray(op.vistas) && op.vistas.length ? op.vistas : ['planta', 'corteA', 'corteB']).filter((v, i, a) => VISTAS.indexOf(v) >= 0 && a.indexOf(v) === i);
  if (!vistas.length) throw new RangeError('Escolha ao menos uma vista para o DXF.');
  /* a planta vem primeiro e fica na origem do app (início da escada); as outras ficam à direita, com 1 m entre elas */
  const ordem = vistas.indexOf('planta') >= 0 ? ['planta'].concat(vistas.filter(v => v !== 'planta')) : vistas;
  const nomeLado = { frente: 'FRENTE', direita: 'LADO DIREITO', esquerda: 'LADO ESQUERDO', fundos: 'FUNDOS' };
  const todas = [];
  let xLivre = null, topoMax = -Infinity, x0 = 0, hMax = 0;
  ordem.forEach((v, i) => {
    const prims = svgParaPrims(dxfVistaSVG(R, C, v, op), C, v === 'detalhe');
    const bb = primsBbox(prims);
    if (!isFinite(bb[0])) return;
    const primeira = xLivre === null, dx = primeira ? 0 : xLivre + 100 - bb[0];
    const largura = bb[2] - bb[0], hT = Math.min(15, Math.max(3, largura / 25));
    const titulo = DXF_TITULOS[v] + (v === 'elevacao' ? ' · ' + (nomeLado[op.ladoElev] || 'FRENTE') : '');
    prims.push({ t: 'text', p: [bb[0], bb[3] + hT * 1.5], h: hT, rot: 0, anc: 'start', s: titulo, cam: 'TITULO' });
    prims.forEach(p => { p.dx = dx; todas.push(p); });
    if (primeira) x0 = bb[0];
    xLivre = bb[2] + dx;
    topoMax = Math.max(topoMax, bb[3] + hT * 3);
    hMax = Math.max(hMax, hT);
  });
  /* a unidade, escrita no desenho (o R12 não guarda $INSUNITS) */
  const hU = Math.max(2, hMax * 0.7);
  todas.push({ t: 'text', p: [x0, topoMax + hU], h: hU, rot: 0, anc: 'start', dx: 0, cam: 'TITULO',
    s: 'Unidade: ' + (unidade === 'm' ? 'metros (1 unidade = 1 m)' : 'centímetros (1 unidade = 1 cm)') + ' · desenho em verdadeira grandeza (1:1)' + (ordem.indexOf('detalhe') >= 0 ? ', exceto a altura do corrimão no detalhe' : '') + ' · os números das cotas estão em cm' });

  /* limpeza: sem vértices repetidos em seguida, sem linhas de comprimento zero nem polilinhas que viraram quase um ponto
     (sobras do recorte e das linhas escondidas, que atrapalham o OSNAP e a contagem de objetos no CAD) */
  const MIN = 1e-3, dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const limpas = [];
  todas.forEach(p => {
    if (p.t === 'line') { if (dist(p.a, p.b) >= MIN) limpas.push(p); return; }
    if (p.t !== 'pline') { limpas.push(p); return; }
    const pts = [];
    p.pts.forEach(q => { if (!pts.length || dist(pts[pts.length - 1], q) >= MIN) pts.push(q); });
    if (p.fechada && pts.length > 1 && dist(pts[0], pts[pts.length - 1]) < MIN) pts.pop();
    let L = 0; for (let i = 0; i + 1 < pts.length; i++) L += dist(pts[i], pts[i + 1]);
    /* polilinha de menos de 2 mm no total: lasca do recorte junto ao pilar ou ao olho (o contorno já cobre esse trecho) */
    if (pts.length < 2 || L < 0.2) return;
    if (pts.length === 2 && !p.fechada) limpas.push({ t: 'line', a: pts[0], b: pts[1], cam: p.cam, lt: p.lt, dx: p.dx });
    else limpas.push(Object.assign({}, p, { pts, fechada: p.fechada && pts.length > 2 }));
  });
  todas.length = 0; limpas.forEach(p => todas.push(p));

  /* ---------- escrita ---------- */
  const L = [];
  const num = v => { const r = Math.round(v * 1e6) / 1e6; return String(Object.is(r, -0) ? 0 : r); };
  const par = (c, v) => { L.push(String(c), String(v)); };
  const X = (p, q) => num((q[0] + p.dx) * k), Y = q => num(q[1] * k);
  const ext = [Infinity, Infinity, -Infinity, -Infinity];
  const E = (p, q) => { const x = (q[0] + p.dx) * k, y = q[1] * k; ext[0] = Math.min(ext[0], x); ext[1] = Math.min(ext[1], y); ext[2] = Math.max(ext[2], x); ext[3] = Math.max(ext[3], y); };
  todas.forEach(p => {
    if (p.t === 'line') { E(p, p.a); E(p, p.b); } else if (p.pts) p.pts.forEach(q => E(p, q));
    else if (p.c) { E(p, [p.c[0] - p.r, p.c[1] - p.r]); E(p, [p.c[0] + p.r, p.c[1] + p.r]); } else if (p.p) E(p, p.p);
  });
  if (!isFinite(ext[0])) { ext[0] = ext[1] = 0; ext[2] = ext[3] = 1; }

  par(0, 'SECTION'); par(2, 'HEADER');
  par(9, '$ACADVER'); par(1, 'AC1009');
  par(9, '$DWGCODEPAGE'); par(3, 'ANSI_1252');
  par(9, '$INSBASE'); par(10, 0); par(20, 0); par(30, 0);
  par(9, '$EXTMIN'); par(10, num(ext[0])); par(20, num(ext[1])); par(30, 0);
  par(9, '$EXTMAX'); par(10, num(ext[2])); par(20, num(ext[3])); par(30, 0);
  par(9, '$LIMMIN'); par(10, num(ext[0])); par(20, num(ext[1]));
  par(9, '$LIMMAX'); par(10, num(ext[2])); par(20, num(ext[3]));
  par(9, '$LTSCALE'); par(40, 1);
  par(9, '$TEXTSTYLE'); par(7, 'STANDARD');
  par(9, '$CLAYER'); par(8, '0');
  par(0, 'ENDSEC');

  par(0, 'SECTION'); par(2, 'TABLES');
  par(0, 'TABLE'); par(2, 'LTYPE'); par(70, DXF_LTYPES.length + 1);
  par(0, 'LTYPE'); par(2, 'CONTINUOUS'); par(70, 0); par(3, 'Solid line'); par(72, 65); par(73, 0); par(40, 0);
  DXF_LTYPES.forEach(t => {
    const d = t[2].map(v => v * k), tot = d.reduce((s, v) => s + Math.abs(v), 0);
    par(0, 'LTYPE'); par(2, t[0]); par(70, 0); par(3, t[1]); par(72, 65); par(73, d.length); par(40, num(tot));
    d.forEach(v => par(49, num(v)));
  });
  par(0, 'ENDTAB');
  /* a camada PILAR só existe quando há pilar (a caracol autoportante tem o olho vazio no meio) */
  const camadas = DXF_CAMADAS.filter(c => c[0] !== 'PILAR' || R.pole);
  par(0, 'TABLE'); par(2, 'LAYER'); par(70, camadas.length);
  camadas.forEach(c => { par(0, 'LAYER'); par(2, c[0]); par(70, 0); par(62, c[1]); par(6, c[2]); });
  par(0, 'ENDTAB');
  par(0, 'TABLE'); par(2, 'STYLE'); par(70, 1);
  par(0, 'STYLE'); par(2, 'STANDARD'); par(70, 0); par(40, 0); par(41, 1); par(50, 0); par(71, 0); par(42, num(2.5 * k)); par(3, 'txt'); par(4, '');
  par(0, 'ENDTAB');
  par(0, 'ENDSEC');

  const conhecidas = new Set(camadas.map(c => c[0]));
  par(0, 'SECTION'); par(2, 'ENTITIES');
  const cab = (tipo, p) => { par(0, tipo); par(8, conhecidas.has(p.cam) ? p.cam : 'CONTORNO'); if (p.lt) par(6, p.lt); };
  todas.forEach(p => {
    if (p.t === 'line') {
      cab('LINE', p); par(10, X(p, p.a)); par(20, Y(p.a)); par(30, 0); par(11, X(p, p.b)); par(21, Y(p.b)); par(31, 0);
    } else if (p.t === 'pline') {
      /* 70: bit 1 = fechada; bit 128 = tipo de linha contínuo ao longo da polilinha (o tracejado não recomeça a cada vértice,
         senão os trechos curtos das curvas da helicoidal saem cheios no AutoCAD) */
      cab('POLYLINE', p); par(66, 1); par(10, 0); par(20, 0); par(30, 0); par(70, (p.fechada ? 1 : 0) | 128);
      p.pts.forEach(q => { par(0, 'VERTEX'); par(8, conhecidas.has(p.cam) ? p.cam : 'CONTORNO'); par(10, X(p, q)); par(20, Y(q)); par(30, 0); });
      par(0, 'SEQEND'); par(8, conhecidas.has(p.cam) ? p.cam : 'CONTORNO');
    } else if (p.t === 'solid') {
      const q = p.pts, ord = q.length === 3 ? [q[0], q[1], q[2], q[2]] : [q[0], q[1], q[3], q[2]];
      cab('SOLID', p); ord.forEach((v, i) => { par(10 + i, X(p, v)); par(20 + i, Y(v)); par(30 + i, 0); });
    } else if (p.t === 'circle') {
      cab('CIRCLE', p); par(10, X(p, p.c)); par(20, Y(p.c)); par(30, 0); par(40, num(p.r * k));
    } else if (p.t === 'arc') {
      cab('ARC', p); par(10, X(p, p.c)); par(20, Y(p.c)); par(30, 0); par(40, num(p.r * k)); par(50, num(p.a0)); par(51, num(p.a1));
    } else if (p.t === 'text') {
      /* altura no DXF = altura das maiúsculas, ~0,7 do corpo da fonte do SVG; meio da altura como no dominant-baseline central */
      const h = num(p.h * 0.7 * k), j = p.anc === 'middle' ? 1 : p.anc === 'end' ? 2 : 0;
      cab('TEXT', p); par(10, X(p, p.p)); par(20, Y(p.p)); par(30, 0); par(40, h); par(1, dxfTexto(p.s.trim())); par(50, num(p.rot)); par(7, 'STANDARD');
      par(72, j); par(11, X(p, p.p)); par(21, Y(p.p)); par(31, 0); par(73, 2);
    }
  });
  par(0, 'ENDSEC');
  par(0, 'EOF');
  return L.join('\r\n') + '\r\n';
}
if (typeof module !== 'undefined') module.exports = { dxfDe, dxfBytes };
