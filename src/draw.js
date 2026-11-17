/* ===== DESENHOS EM SVG: PLANTA E CORTE (convenções de projeto) ===== */
const r2 = v => Math.round(v * 100) / 100;
const escXml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const NS = 'vector-effect="non-scaling-stroke"';
let HCH = 0;
const FONT = "'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace";
/* camada: marca um trecho do desenho com o nome da camada que ele recebe na exportação DXF (data-camada).
   Um <g> sem estilo não muda nada na tela. */
function cam(nome, s) { return s ? '<g data-camada="' + nome + '">' + s + '</g>' : ''; }
/* tamanho base do texto (cm no desenho): o.fs, quando a prancha em escala pede um tamanho fixo; senão, o automático */
const fsDe = (o, auto) => (o && o.fs > 0 ? o.fs : auto);

function sLine(a, b, col, w, dash) {
  return '<line x1="' + r2(a[0]) + '" y1="' + r2(-a[1]) + '" x2="' + r2(b[0]) + '" y2="' + r2(-b[1]) + '" stroke="' + col + '" stroke-width="' + w + '" ' + NS + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
}
function sPolyline(pts, col, w, dash) {
  return '<polyline points="' + pts.map(q => r2(q[0]) + ',' + r2(-q[1])).join(' ') + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linejoin="round" stroke-linecap="round" ' + NS + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
}
function sText(x, y, s, size, fill, anchor, rot, weight) {
  const tr = rot ? ' transform="rotate(' + r2(rot) + ' ' + r2(x) + ' ' + r2(-y) + ')"' : '';
  return '<text x="' + r2(x) + '" y="' + r2(-y) + '" font-size="' + r2(size) + '" fill="' + fill + '" text-anchor="' + (anchor || 'middle') + '" dominant-baseline="central" font-family="' + FONT + '"' + (weight ? ' font-weight="' + weight + '"' : '') + tr + '>' + escXml(s) + '</text>';
}
function sPoly(pts, fill, stroke, w, dash, fop) {
  return '<polygon points="' + pts.map(q => r2(q[0]) + ',' + r2(-q[1])).join(' ') + '" fill="' + fill + '"' + (fop !== undefined ? ' fill-opacity="' + fop + '"' : '') + ' stroke="' + stroke + '" stroke-width="' + w + '" stroke-linejoin="round" ' + NS + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
}
function sCircle(x, y, r, fill, stroke, w) {
  return '<circle cx="' + r2(x) + '" cy="' + r2(-y) + '" r="' + r2(r) + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="' + (w || 1.2) + '" ' + NS : '') + '/>';
}

/* cota linear: a,b pontos; (ux,uy) direção para onde a cota se afasta; dist em cm */
function dimLine(a, b, ux, uy, dist, label, fs, C) {
  const A = [a[0] + ux * dist, a[1] + uy * dist], B = [b[0] + ux * dist, b[1] + uy * dist];
  const ext = fs * 0.6, gap = fs * 0.35;
  const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
  const ax = dx / len, ay = dy / len;
  let tx = ax + ux, ty = ay + uy; const tl = Math.hypot(tx, ty) || 1; tx = tx / tl * fs * 0.5; ty = ty / tl * fs * 0.5;
  let s = '';
  s += sLine([a[0] + ux * gap, a[1] + uy * gap], [A[0] + ux * ext, A[1] + uy * ext], C.muted, 0.9);
  s += sLine([b[0] + ux * gap, b[1] + uy * gap], [B[0] + ux * ext, B[1] + uy * ext], C.muted, 0.9);
  s += sLine(A, B, C.ink, 1);
  s += sLine([A[0] - tx, A[1] - ty], [A[0] + tx, A[1] + ty], C.ink, 1.3);
  s += sLine([B[0] - tx, B[1] - ty], [B[0] + tx, B[1] + ty], C.ink, 1.3);
  let ang = deg(Math.atan2(-dy, dx)); if (ang > 90) ang -= 180; if (ang <= -90) ang += 180;
  const mxp = (A[0] + B[0]) / 2 + ux * fs * 0.95, myp = (A[1] + B[1]) / 2 + uy * fs * 0.95;
  s += sText(mxp, myp, label, fs * 0.95, C.ink, 'middle', ang, 500);
  return cam('COTAS', s);
}

function treadFill(kind, C) { return kind === 'leque' ? C.winder : kind === 'patamar' ? C.patamar : C.tread; }
function centroid(pts) { let x = 0, y = 0; pts.forEach(q => { x += q[0]; y += q[1]; }); return [x / pts.length, y / pts.length]; }
const nivel = cm => (cm === 0 ? '±0,00' : '+' + (cm / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

function svgWrap(vx, vy, vw, vh, body, o, extraDefs) {
  const size = o && o.pxW ? ' width="' + Math.round(o.pxW) + '" height="' + Math.round(o.pxW * vh / vw) + '"' : o && o.thumb ? ' preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block"' : ' style="width:100%;height:auto;display:block"';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + r2(vx) + ' ' + r2(vy) + ' ' + r2(vw) + ' ' + r2(vh) + '"' + size + ' role="img">' + (extraDefs || '') + body + '</svg>';
}

/* linha de ruptura (zigue-zague) ao longo de um segmento */
function breakLine(e0, e1, fs, C) {
  const dx = e1[0] - e0[0], dy = e1[1] - e0[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const ext = fs * 0.9, A = [e0[0] - ux * ext, e0[1] - uy * ext], L2 = len + 2 * ext;
  const pt = (t, off) => [A[0] + ux * L2 * t + nx * off, A[1] + uy * L2 * t + ny * off];
  const pts = [pt(0, 0), pt(0.4, 0), pt(0.46, fs * 0.9), pt(0.54, -fs * 0.9), pt(0.6, 0), pt(1, 0)];
  return sPolyline(pts, C.paper, 4.5) + sPolyline(pts, C.ink, 1.9);
}

/* bloco de título + escala gráfica */
function titleBlock(vx, ymin, vw, fs, l1, l2, C) {
  let s = sLine([vx + fs * 0.5, ymin], [vx + vw - fs * 0.5, ymin], C.ink, 1.2);
  s += sText(vx + fs, ymin - fs * 1.4, l1, fs * 0.9, C.ink, 'start', 0, 600);
  s += sText(vx + fs, ymin - fs * 2.9, l2, fs * 0.8, C.muted, 'start', 0, 400);
  /* escala gráfica: 0 - 50 - 100 cm, em tamanho real do desenho */
  const x0 = vx + fs, y0 = ymin - fs * 5.2, h = fs * 0.55;
  [0, 1].forEach(i => { s += '<rect x="' + r2(x0 + i * 50) + '" y="' + r2(-y0 - h) + '" width="50" height="' + r2(h) + '" fill="' + (i ? C.paper : C.ink) + '" stroke="' + C.ink + '" stroke-width="1" ' + NS + '/>'; });
  [0, 50, 100].forEach(v => { s += sText(x0 + v, y0 - fs * 0.9, String(v), fs * 0.7, C.muted, 'middle'); });
  s += sText(x0 + 108, y0 - fs * 0.15, 'cm', fs * 0.7, C.muted, 'start');
  return cam('TITULO', s);
}

function planSVG(R, o, C) {
  o = o || {};
  const thumb = !!o.thumb;
  const modo = thumb ? 'inf' : (o.modo || R.st.modoPlanta || 'inf');
  const sup = modo === 'sup';
  let bbA = thumb ? R.bbox : R.bboxAll; const bb = R.bbox;
  const span0 = Math.max(bbA[2] - bbA[0], bbA[3] - bbA[1]);
  const fs = thumb ? span0 / 14 : fsDe(o, clamp(span0 / 40, 5, 14));
  /* as chamadas de corte deslocadas podem cair fora da escada: o desenho cresce para mostrá-las */
  const comCortes = !thumb && modoInf(o, R) && (o.cortes === true || (o.cortes !== false && R.st.showCortes !== false));
  const bbEsc = bbA;
  if (comCortes) { const ext = ['A', 'B'].map(q => chamadaPontos(R, q, fs, bbEsc)).flat(); bbA = bboxOf(ext.concat([[bbA[0], bbA[1]], [bbA[2], bbA[3]]])); }
  const w = bbA[2] - bbA[0], h = bbA[3] - bbA[1], span = Math.max(w, h);
  /* o.semTitulo (prancha): sem o bloco de título e a escala gráfica, que a prancha já põe embaixo de cada vista */
  const semT = !!(o && o.semTitulo);
  const m = thumb ? span * 0.07 : comCortes || semT ? fs * 3.5 : fs * 10, tb = thumb || semT ? 0 : fs * 7.5;
  const vx = bbA[0] - m, vy = -(bbA[3] + m), vw = w + 2 * m, vh = h + 2 * m + tb;
  const showDims = !thumb && o.dims !== false && R.st.showDims !== false;
  const showNums = !thumb && o.nums !== false && R.st.showNums !== false;
  const kCut = R.kCut, T = R.T;
  const op = R.opening;
  const visible = pl => sup ? (!op || pl.k >= op.kc) : pl.k <= kCut;
  const useCut = !thumb && o.cut !== false;
  let s = '';
  if (!thumb) {
    const arr = R.arrival, ac = centroid(arr.pts);
    s += cam('PISO_SUPERIOR', sSolidArrival(arr.pts, sup, C));
    if (!sup) {
      s += cam('TEXTO', sText(ac[0], ac[1] + fs * 0.6, R.hel ? 'PISO SUP.' : 'PISO SUPERIOR', fs * 0.72, C.muted, 'middle', 0, 500) +
        sText(ac[0], ac[1] - fs * 0.7, nivel(R.H), fs * 0.8, C.ink, 'middle', 0, 600));
    }
  }
  let clipId = null;
  if (sup && !thumb && op) {
    /* pavimento superior: só se vê a escada pela abertura da laje; o que está mais alto cobre o que está embaixo */
    const cid = clipId = 'cl' + Math.random().toString(36).slice(2, 8);
    const shape = op.circle ? '<circle cx="0" cy="0" r="' + r2(op.circle) + '"/>' : '<rect x="' + r2(op.bbox[0]) + '" y="' + r2(-op.bbox[3]) + '" width="' + r2(op.bbox[2] - op.bbox[0]) + '" height="' + r2(op.bbox[3] - op.bbox[1]) + '"/>';
    s += '<defs><clipPath id="' + cid + '">' + shape + '</clipPath></defs><g clip-path="url(#' + cid + ')">';
    R.polys.forEach(pl => { s += cam(camadaDegrau(pl), sPoly(pl.pts, treadFill(pl.kind, C), C.ink, 1.5)); });
    s += '</g>';
  } else {
    /* pavimento inferior: primeiro o que está abaixo do corte (traço cheio), depois a projeção do que está acima (tracejado, por cima) */
    const on = pl => !useCut ? true : visible(pl);
    R.polys.forEach(pl => { if (on(pl)) s += cam(camadaDegrau(pl), sPoly(pl.pts, treadFill(pl.kind, C), C.ink, thumb ? 1 : 1.5)); });
    R.polys.forEach(pl => { if (!on(pl)) s += cam('PROJECAO', sPoly(pl.pts, treadFill(pl.kind, C), C.muted, 1.1, '6 4', R.hel ? 0 : 0.28)); });
  }
  if (R.hel) s += cam('PILAR', sCircle(0, 0, R.helix.rc, C.ink, C.ink, 1));
  if (!thumb && !sup && useCut && kCut >= 1 && kCut < T) {
    const nx = R.polys[kCut];
    if (nx && nx.entry) s += breakLine(nx.entry[0], nx.entry[1], fs, C);
  }
  /* vão na laje */
  if (!thumb && o.opening !== false && op) {
    const dash = sup ? null : '7 5', col = sup ? C.ink : C.info, wd = sup ? 2.8 : 1.8;
    if (op.circle) s += cam('VAO_LAJE', '<circle cx="0" cy="0" r="' + r2(op.circle) + '" fill="none" stroke="' + col + '" stroke-width="' + wd + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + ' ' + NS + '/>');
    else { const q = op.bbox; s += cam('VAO_LAJE', sPoly([[q[0], q[1]], [q[2], q[1]], [q[2], q[3]], [q[0], q[3]]], 'none', col, wd, dash)); }
  }
  /* linha de caminhamento + seta (na planta superior, recortadas pela abertura junto com os números) */
  let rotulos = '';
  if (clipId) s += '<g clip-path="url(#' + clipId + ')">';
  if (o.walk !== false && R.walk.length) {
    let wk = '';
    R.walk.forEach(wl => { wk += sPolyline(wl, C.accent, thumb ? 1.6 : 2.3); });
    const all = [].concat.apply([], R.walk);
    const first = all[0], f2 = all.find(q => Math.hypot(q[0] - first[0], q[1] - first[1]) > 1) || first;
    const end = all[all.length - 1], pre = all.slice().reverse().find(q => Math.hypot(q[0] - end[0], q[1] - end[1]) > 1) || end;
    const head = sup ? first : end, hpre = sup ? f2 : pre, tail = sup ? end : first, tnext = sup ? pre : f2;
    let ux = head[0] - hpre[0], uy = head[1] - hpre[1]; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
    const hs = fs * (thumb ? 1.3 : 1.2), base = [head[0] - ux * hs, head[1] - uy * hs];
    wk += sPoly([[head[0] + ux * hs * 0.2, head[1] + uy * hs * 0.2], [base[0] - uy * hs * 0.5, base[1] + ux * hs * 0.5], [base[0] + uy * hs * 0.5, base[1] - ux * hs * 0.5]], C.accent, C.accent, 1);
    wk += sCircle(tail[0], tail[1], fs * 0.5, C.accent);
    s += cam('LINHA_CAMINHAMENTO', wk);
    if (!thumb) {
      let fx = tail[0] - tnext[0], fy = tail[1] - tnext[1]; const fl = Math.hypot(fx, fy) || 1; fx /= fl; fy /= fl;
      let d1 = fs * 2.6, d2 = fs * 4.4;
      if (R.hel) { const tl = Math.hypot(tail[0], tail[1]) || 1; fx = tail[0] / tl; fy = tail[1] / tl; d1 += R.dw; d2 += R.dw; }
      rotulos += cam('TEXTO', sText(tail[0] + fx * d1, tail[1] + fy * d1, sup ? 'DESCE' : 'SOBE', fs * 0.95, C.accent, 'middle', 0, 600) +
        sText(tail[0] + fx * d2, tail[1] + fy * d2, sup ? nivel(R.H) : nivel(0), fs * 0.85, C.ink, 'middle', 0, 600));
    }
  }
  /* numeração dos degraus */
  if (showNums) {
    const nP = R.hel ? R.helix.nPer : 0;
    R.polys.forEach(pl => {
      if (R.hel && (sup ? pl.k <= T - nP : pl.k > nP)) return;
      let cx, cy;
      if (R.hel) { const mid = pl.arc.outer.length >> 1; const ph = Math.atan2(pl.arc.outer[mid][1], pl.arc.outer[mid][0]); cx = R.helix.rw * Math.cos(ph); cy = R.helix.rw * Math.sin(ph); }
      else { const c = centroid(pl.pts); cx = c[0]; cy = c[1]; }
      const on = !useCut && !sup ? true : visible(pl);
      s += '<g data-camada="NUMEROS" stroke="' + treadFill(pl.kind, C) + '" stroke-width="' + r2(fs * 0.45) + '" stroke-linejoin="round" paint-order="stroke">' + sText(cx, cy, String(pl.k), fs * 0.85, on ? C.ink : C.muted, 'middle', 0, 500) + '</g>';
    });
  }
  if (clipId) s += '</g>';
  s += rotulos;
  /* chamadas dos cortes A-A e B-B (só na planta do pavimento inferior) */
  if (comCortes) s += cam('LINHA_CORTE', chamadaCorte(R, 'A', fs, C, bbEsc) + chamadaCorte(R, 'B', fs, C, bbEsc));
  /* ponta mais estreita dos degraus balanceados: marca no canto interno */
  if (showDims && !sup && R.bal && R.nLeque) {
    const lqs = R.polys.filter(pl => pl.kind === 'leque');
    const pm = lqs.reduce((m, pl) => pl.wIn < m.wIn ? pl : m, lqs[0]);
    const I = pm.entry[1], c = centroid(pm.pts);
    let dx = I[0] - c[0], dy = I[1] - c[1]; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
    const T2 = [I[0] + dx * fs * 2.2, I[1] + dy * fs * 2.2];
    s += cam('COTAS', sLine(I, T2, C.accent, 0.9) + sText(T2[0] + dx * fs * 1.6, T2[1] + dy * fs * 0.9, 'ponta ' + fmt(pm.wIn, 1), fs * 0.75, C.accent, 'middle', 0, 600));
  }
  /* cotas */
  if (showDims) {
    const topGap = (bbEsc[3] - bb[3]) + fs * 5.4, rightGap = (bbEsc[2] - bb[2]) + fs * 5.4;
    if (R.hel) {
      s += dimLine([bb[0], bb[3]], [bb[2], bb[3]], 0, 1, topGap, 'Ø ' + fmt(R.helix.R * 2, 0), fs, C);
      s += cam('COTAS', sText(0, -R.helix.R - fs * 7.2, 'pilar Ø ' + fmt(R.helix.rc * 2, 0) + ' · ' + fmt(R.helix.th, 1) + '° por degrau', fs * 0.85, C.muted, 'middle'));
    } else {
      s += dimLine([bb[0], bb[3]], [bb[2], bb[3]], 0, 1, topGap, fmt(bb[2] - bb[0], 0), fs, C);
      s += dimLine([bb[2], bb[1]], [bb[2], bb[3]], 1, 0, rightGap, fmt(bb[3] - bb[1], 0), fs, C);
      const se = R.startEdge;
      s += dimLine(se[0], se[1], 0, -1, fs * 7, 'L ' + fmt(R.L, 0), fs, C);
      const groups = {};
      R.polys.forEach(pl => { if (pl.kind === 'reto' && pl.grp) (groups[pl.grp] = groups[pl.grp] || []).push(pl); });
      Object.keys(groups).forEach(k => {
        const g = groups[k], f = g[0], l = g[g.length - 1];
        let ux = f.pts[0][0] - f.pts[1][0], uy = f.pts[0][1] - f.pts[1][1]; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
        /* a cota sai para o lado de fora da escada (longe do centro do desenho), para não cair em cima de outro lance */
        const cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2, gm = centroid([f.pts[0], f.pts[1], l.pts[2], l.pts[3]]);
        let a0 = f.pts[0], a1 = l.pts[3];
        if ((gm[0] - cx) * ux + (gm[1] - cy) * uy < 0) { ux = -ux; uy = -uy; a0 = f.pts[1]; a1 = l.pts[2]; }
        s += dimLine(a0, a1, ux, uy, fs * 1.7, g.length + ' × ' + fmt(R.pInput, 1) + ' = ' + fmt(g.length * R.pInput, 0), fs * 0.9, C);
      });
    }
  }
  if (!thumb && !semT) {
    const ymin = bbA[1] - m;
    const t1 = (R.hel ? 'ESCADA HELICOIDAL' : 'ESCADA ' + TIPOS.find(t => t.id === R.tipo).nome.toUpperCase()) + ' · PLANTA ' + (sup ? 'DO PAV. SUPERIOR' : 'DO PAV. INFERIOR');
    const t2 = 'H ' + fmt(R.H, 0) + ' · ' + R.N + ' espelhos de ' + fmt(R.e, 1) + ' · ' + R.contagem + (R.nReto ? ' (piso ' + fmt(R.p, 1) + ')' : '') + ' · cotas em cm' + (sup ? '' : ' · corte a ' + fmt(R.zc, 0));
    s += titleBlock(vx, ymin, vw, fs, t1, t2, C);
  }
  return svgWrap(vx, vy, vw, vh, s, o);
}
/* camada do degrau na planta, pelo tipo de superfície */
function camadaDegrau(pl) { return pl.kind === 'patamar' ? 'PATAMAR' : pl.kind === 'leque' ? 'LEQUE' : 'DEGRAUS'; }
function sSolidArrival(pts, sup, C) {
  return sup ? sPoly(pts, C.piso, C.ink, 1.6) : sPoly(pts, C.piso, C.muted, 1, '5 4');
}

function sectionSVG(R, o, C) {
  o = o || {};
  const H = R.H, e = R.e, X = R.Wtot, st = R.st;
  const left = -70, slabR = 110, right = X + slabR;
  const span = Math.max(right - left, H + 90);
  const fs = fsDe(o, clamp(span / 46, 5, 13));
  const xmin = left - fs * 4, xmax = right + fs * 8;
  const ymin = -fs * 15.5, ymax = H + 92 + fs * 3;
  const vx = xmin, vy = -ymax, vw = xmax - xmin, vh = ymax - ymin;
  const hid = 'hch' + (++HCH); /* id único: a mesma página pode ter dois perfis (tela e impressão) */
  const defs = '<defs><pattern id="' + hid + '" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="' + C.muted + '" stroke-width="1"/></pattern></defs>';
  let s = '';
  /* terreno */
  s += '<rect x="' + left + '" y="0" width="' + (0 - left) + '" height="' + r2(fs * 2.2) + '" fill="url(#' + hid + ')" stroke="none"/>';
  s += sLine([left, 0], [0, 0], C.ink, 2.4);
  /* degraus: placas soltas (em balanço) ou laje maciça */
  if (R.placas) {
    R.polys.forEach(pl => {
      const top = pl.k * e, bot = Math.max(top - R.st.espDegrau, 0);
      s += '<rect x="' + r2(pl.x0) + '" y="' + r2(-top) + '" width="' + r2(pl.x1 - pl.x0) + '" height="' + r2(top - bot) + '" fill="' + treadFill(pl.kind, C) + '" stroke="' + C.ink + '" stroke-width="1.3" ' + NS + '/>';
    });
  } else {
    /* laje da escada: dentes dos degraus sobre uma laje inclinada de espessura constante (horizontal nos patamares) */
    const tl = st.tLaje;
    const top = [[0, 0]];
    R.polys.forEach(pl => { top.push([pl.x0, pl.k * e], [pl.x1, pl.k * e]); });
    /* face inferior: a mesma do núcleo (R.undX), com o "joelho" da laje inclinada entrando no patamar */
    const und = R.undX && R.undX.length ? R.undX : R.polys.map(pl => [pl.x0, pl.k * e - tl]);
    top.push([X, H]);
    const U = und.map(q => [q[0], Math.max(0, q[1])]);
    const lastZ = U.length ? U[U.length - 1][1] : 0;
    const poly = top.concat([[X, Math.min(lastZ, H)]]).concat(U.slice().reverse()).concat([[0, 0]]);
    s += sPoly(poly, C.tread, C.ink, 1.4);
    R.polys.forEach(pl => { if (pl.kind !== 'reto') { const z1 = pl.k * e; s += '<rect x="' + r2(pl.x0) + '" y="' + r2(-z1) + '" width="' + r2(pl.x1 - pl.x0) + '" height="' + r2(Math.min(pl.kind === 'patamar' ? st.tLaje : e, z1)) + '" fill="' + treadFill(pl.kind, C) + '" stroke="none"/>'; } });
    s += sPolyline(top, C.ink, 1.4);
  }
  /* laje superior */
  const kcPoly = R.opening ? R.polys.find(pl => pl.k === R.opening.kc) : null;
  const xo = kcPoly ? kcPoly.x0 : X;
  const slabBox = (x0, x1) => '<rect x="' + r2(x0) + '" y="' + r2(-H) + '" width="' + r2(x1 - x0) + '" height="' + r2(st.espLaje) + '" fill="url(#' + hid + ')" stroke="' + C.ink + '" stroke-width="1.5" ' + NS + '/>';
  if (!R.hel && xo > left + 1) s += slabBox(left, xo); /* na helicoidal a laje fica fora do furo, longe do percurso */
  s += slabBox(X, X + slabR);
  /* linha dos narizes e corrimão */
  const nos = [];
  /* no patamar o corrimão fica horizontal até encontrar a inclinação do lance seguinte (um piso antes da borda), sem degrau */
  R.polys.forEach(pl => { nos.push([pl.x0, pl.k * e]); if (pl.kind === 'patamar') nos.push([Math.max(pl.x0, pl.x1 - R.pInput), pl.k * e]); });
  if (nos.length) {
    const alturas = R.nm.acess ? [92, 70] : [92];
    /* NBR 9050:2020, 6.9.3.2: corrimãos prolongados 30 cm (na horizontal) antes do primeiro e depois do último degrau */
    const ext = R.nm.acess ? 30 : 0;
    alturas.forEach(hR => {
      const pl = nos.concat([[X, H]]).map(q => [q[0], q[1] + hR]);
      if (ext) { pl.unshift([pl[0][0] - ext, pl[0][1]]); pl.push([pl[pl.length - 1][0] + ext, pl[pl.length - 1][1]]); }
      s += cam('CORRIMAO', sPolyline(pl, C.ink, 1.1));
    });
    if (ext) s += sText(X + ext / 2, H + 92 + fs * 1.1, '+30', fs * 0.7, C.muted, 'middle');
    s += sLine([nos[0][0], nos[0][1] + 92], [nos[0][0], nos[0][1]], C.muted, 0.8, '3 3');
    s += sText(nos[Math.min(1, nos.length - 1)][0] - fs * 0.6, nos[Math.min(1, nos.length - 1)][1] + 92 + fs * 1.2, 'corrimão ' + alturas.join(' e '), fs * 0.8, C.muted, 'start', -R.incl);
  }
  /* linha de altura livre */
  const hp = [];
  R.polys.forEach(pl => { const z = pl.k * e + st.hLivre; if (z <= H - st.espLaje + 0.01) hp.push([pl.x0, z]); });
  if (hp.length && kcPoly) {
    const zU = H - st.espLaje, z1 = kcPoly.k * e + st.hLivre, last = hp[hp.length - 1];
    if (z1 > zU && last[1] < zU) { const t = (zU - last[1]) / (z1 - last[1]); hp.push([last[0] + (kcPoly.x0 - last[0]) * t, zU]); }
  }
  if (hp.length > 1) {
    s += cam('ALTURA_LIVRE', sPolyline(hp, C.accent, 1.7, '6 4'));
    const lp = hp[Math.max(0, hp.length - 2)];
    s += sText(lp[0] + fs * 0.8, lp[1] - fs * 1.6, 'altura livre ' + fmt(st.hLivre, 0), fs * 0.85, C.accent, 'start', 0, 500);
  }
  /* números dos degraus e rótulos */
  R.polys.forEach(pl => {
    const wmid = (pl.x0 + pl.x1) / 2, top = pl.k * e;
    if (pl.x1 - pl.x0 >= fs * 1.4) s += sText(wmid, top - e / 2, String(pl.k), fs * 0.75, C.ink, 'middle', 0, 500);
  });
  const groups = [];
  R.polys.forEach(pl => { if (pl.kind === 'patamar' || pl.kind === 'leque') { const g = groups[groups.length - 1]; if (g && g.kind === pl.kind && g.last === pl.k - 1) { g.x1 = pl.x1; g.last = pl.k; g.top = pl.k * e; } else groups.push({ kind: pl.kind, x0: pl.x0, x1: pl.x1, last: pl.k, top: pl.k * e }); } });
  groups.forEach(g => {
    s += sText((g.x0 + g.x1) / 2, g.top + fs * 2.2, g.kind === 'leque' ? 'leques' : 'patamar ' + nivel(g.top), fs * 0.78, C.muted, 'middle', 0, 500);
  });
  /* níveis */
  s += sText(left + fs * 0.5, fs * 1.1, nivel(0), fs * 0.9, C.ink, 'start', 0, 600);
  s += sText(X + slabR, H + fs * 1.1, nivel(H), fs * 0.9, C.ink, 'end', 0, 600);
  /* cotas */
  s += dimLine([X + slabR, 0], [X + slabR, H], 1, 0, fs * 2.6, 'H ' + fmt(H, 0), fs, C);
  s += dimLine([0, 0], [X, 0], 0, -1, fs * 2.8, fmt(X, 0) + ' (desenvolvido)', fs, C);
  s += dimLine([left, H - st.espLaje], [left, H], -1, 0, fs * 1.0, 'laje ' + fmt(st.espLaje, 0), fs * 0.8, C);
  s += sText(left + fs * 0.5, -fs * 5.6, 'degrau: espelho ' + fmt(e, 1) + ' × piso ' + fmt(R.p, 1) + ' cm  ·  ' + fmt(R.incl, 1) + '°' + (R.placas ? '  ·  degraus em balanço de ' + fmt(st.espDegrau) + ' cm' : '  ·  laje da escada ' + fmt(st.tLaje) + ' cm'), fs * 0.9, C.ink, 'start', 0, 500);
  const t1 = 'PERFIL DESENVOLVIDO · ESCADA ' + (R.hel ? 'HELICOIDAL' : TIPOS.find(t => t.id === R.tipo).nome.toUpperCase());
  const t2 = 'esquema ao longo da linha de caminhamento (não é corte A-A) · H ' + fmt(H) + ' · ' + R.N + ' espelhos de ' + fmt(e, 1) + ' · cotas em cm';
  s += titleBlock(vx, -fs * 8, vw, fs, t1, t2, C);
  return svgWrap(vx, vy, vw, vh, s, o, defs);
}

/* ===== CORTES A-A E B-B (plano vertical de verdade, com chamada na planta) =====
   Um corte é um plano vertical que passa pela linha P0 + s·u da planta; quem desenha olha na direção n.
   u é a direita de quem olha (assim o desenho não sai espelhado). O que o plano corta vira poché (hachura e traço
   grosso); o que está além do plano aparece em vista, do mais longe para o mais perto; o que está atrás não aparece. */
function cortesDe(R) {
  const st = R.st, un = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
  let A, B;
  if (R.hel) {
    A = { P0: [0, 0], n: [1, 0] };
    B = { P0: [0, 0], n: [0, 1] };
  } else {
    const se = R.startEdge, mid = [(se[0][0] + se[1][0]) / 2, (se[0][1] + se[1][1]) / 2];
    const din = un([se[1][0] - se[0][0], se[1][1] - se[0][1]]), h = [0, 1];
    const g1 = R.polys.filter(pl => pl.kind === 'reto' && pl.grp === (R.polys[0].grp || -1)).length;
    const d1 = Math.max(R.p / 2, g1 * R.p / 2);
    A = { P0: mid, n: din };
    B = { P0: [mid[0] + h[0] * d1, mid[1] + h[1] * d1], n: h };
  }
  const desl = (c, d) => { d = num(d, 0); return { P0: [c.P0[0] + c.n[0] * d, c.P0[1] + c.n[1] * d], n: c.n, u: [c.n[1], -c.n[0]] }; };
  return { A: desl(A, st.corteA), B: desl(B, st.corteB) };
}

/* trechos (em s, ao longo de u) em que a reta do corte passa por dentro do polígono (regra par-ímpar) */
function cortaPoligono(pts, P0, n, u) {
  const sv = [], eps = 1e-7;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const da = (a[0] - P0[0]) * n[0] + (a[1] - P0[1]) * n[1] + eps, db = (b[0] - P0[0]) * n[0] + (b[1] - P0[1]) * n[1] + eps;
    if ((da < 0) !== (db < 0)) { const k = da / (da - db), q = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; sv.push((q[0] - P0[0]) * u[0] + (q[1] - P0[1]) * u[1]); }
  }
  sv.sort((x, y) => x - y);
  const out = []; for (let i = 0; i + 1 < sv.length; i += 2) if (sv[i + 1] - sv[i] > 1e-6) out.push([sv[i], sv[i + 1]]);
  return out;
}
/* parte do polígono do lado de lá do plano (n·(q − P0) >= 0) */
function ladoDeLa(pts, P0, n) {
  const out = [], f = q => (q[0] - P0[0]) * n[0] + (q[1] - P0[1]) * n[1];
  for (let i = 0; i < pts.length; i++) {
    const P = pts[i], Q = pts[(i + 1) % pts.length], fp = f(P), fq = f(Q);
    if (fp >= 0) out.push(P);
    if ((fp > 0 && fq < 0) || (fp < 0 && fq > 0)) { const k = fp / (fp - fq); out.push([P[0] + (Q[0] - P[0]) * k, P[1] + (Q[1] - P[1]) * k]); }
  }
  return out;
}

/* ELEVAÇÃO: o mesmo mecanismo do corte, com o plano posto fora da escada, do lado de quem olha. Nada é atravessado,
   então tudo aparece em vista (traço fino). lado: 'frente' (de quem vai subir o 1º lance), 'direita', 'esquerda', 'fundos'.
   Direita e esquerda são as de quem sobe o 1º lance. */
const LADOS_ELEV = { frente: 'frente', direita: 'lado direito', esquerda: 'lado esquerdo', fundos: 'fundos' };
function elevacaoDe(R, lado) {
  const pts = []; R.polys.forEach(pl => pl.pts.forEach(q => pts.push(q))); R.arrival.pts.forEach(q => pts.push(q));
  if (R.hel) pts.push([-R.helix.R, -R.helix.R], [R.helix.R, R.helix.R]);
  const b = bboxOf(pts), mg = 40;
  const v = { frente: { P0: [0, b[1] - mg], n: [0, 1] }, fundos: { P0: [0, b[3] + mg], n: [0, -1] }, direita: { P0: [b[2] + mg, 0], n: [-1, 0] }, esquerda: { P0: [b[0] - mg, 0], n: [1, 0] } }[LADOS_ELEV[lado] ? lado : 'frente'];
  return { P0: v.P0, n: v.n, u: [v.n[1], -v.n[0]] };
}
function elevacaoSVG(R, o, C, lado) { return corteSVG(R, o, C, 'E', lado); }

function corteSVG(R, o, C, qual, lado) {
  o = o || {};
  const elev = qual === 'E';
  qual = elev ? 'E' : qual === 'B' ? 'B' : 'A';
  const cs = elev ? elevacaoDe(R, lado) : cortesDe(R)[qual], P0 = cs.P0, n = cs.n, u = cs.u, st = R.st, H = R.H, e = R.e;
  const S = q => (q[0] - P0[0]) * u[0] + (q[1] - P0[1]) * u[1], Dp = q => (q[0] - P0[0]) * n[0] + (q[1] - P0[1]) * n[1];
  const ptAt = (s, d) => [P0[0] + u[0] * s + n[0] * d, P0[1] + u[1] * s + n[1] * d];
  /* extensão do desenho */
  const todos = []; R.polys.forEach(pl => pl.pts.forEach(q => todos.push(S(q)))); R.arrival.pts.forEach(q => todos.push(S(q)));
  if (R.hel) todos.push(-R.helix.R, R.helix.R);
  const s0 = Math.min.apply(null, todos) - 70, s1 = Math.max.apply(null, todos) + 70;
  const span = Math.max(s1 - s0, H + 60), fs = fsDe(o, clamp(span / 46, 5, 13));
  const hid = 'hch' + (++HCH), hid2 = 'hcc' + HCH;
  const defs = '<defs><pattern id="' + hid + '" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="' + C.muted + '" stroke-width="1"/></pattern>' +
    '<pattern id="' + hid2 + '" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="' + C.tread + '"/><line x1="0" y1="0" x2="0" y2="9" stroke="' + C.ink + '" stroke-width="0.9"/></pattern></defs>';
  let s = '';
  /* ---- elementos além do plano (em vista), do mais longe para o mais perto ---- */
  const vistas = [], itens = [];
  R.polys.forEach((pl, idx) => {
    const lado = ladoDeLa(pl.pts, P0, n); if (lado.length < 3) return;
    const ss = lado.map(S), ta = Math.min.apply(null, ss), tb = Math.max.apply(null, ss);
    if (tb - ta < 1e-6) return;
    const prof = Math.min.apply(null, lado.map(Dp));
    /* fundo: a cada posição s, o ponto mais baixo do intradorso na fatia do degrau */
    const fundo = [], NS2 = 8;
    for (let i = 0; i <= NS2; i++) {
      const sx = Math.min(tb - 1e-6, Math.max(ta + 1e-6, ta + (tb - ta) * i / NS2));
      let zmin = pl.top;
      const base = ptAt(sx, 0);
      cortaPoligono(lado, base, u, n).forEach(iv => [iv[0] + 1e-4, (iv[0] + iv[1]) / 2, iv[1] - 1e-4].forEach(d => { zmin = Math.min(zmin, R.zBot(pl, [base[0] + n[0] * d, base[1] + n[1] * d])); }));
      fundo.push([sx, zmin]);
    }
    /* para onde o degrau "sobe" em relação a quem olha: de frente (vê os espelhos), de lado (vê o perfil) ou por baixo (vê a laje) */
    const sai = idx + 1 < R.polys.length ? R.polys[idx + 1].entry : R.arrival.pts.slice(0, 2);
    const ce = [(pl.entry[0][0] + pl.entry[1][0]) / 2, (pl.entry[0][1] + pl.entry[1][1]) / 2], cs2 = [(sai[0][0] + sai[1][0]) / 2, (sai[0][1] + sai[1][1]) / 2];
    const dl = Math.hypot(cs2[0] - ce[0], cs2[1] - ce[1]) || 1, d = ((cs2[0] - ce[0]) * n[0] + (cs2[1] - ce[1]) * n[1]) / dl;
    const cls = R.placas ? 'placa' : pl.kind === 'patamar' ? 'plano' : d > 0.35 ? 'frente' : d < -0.35 ? 'baixo' : 'lado';
    itens.push({ k: pl.k, kind: pl.kind, ta, tb, top: pl.top, fundo, prof, cls });
  });
  /* junta degraus seguidos do mesmo lance num só contorno: numa elevação não há aresta entre um degrau e o outro
     dentro da laje; só ficam o contorno, as linhas dos bocéis (vistos de frente) e o perfil dentado (vistos de lado) */
  const grupos2 = [];
  itens.forEach(it => {
    const g = grupos2[grupos2.length - 1], ult = g && g[g.length - 1];
    const junta = g && it.cls === ult.cls && it.cls !== 'plano' && it.cls !== 'placa' && it.k === ult.k + 1 && it.ta <= ult.tb + 1e-3 && it.tb >= ult.ta - 1e-3;
    if (junta) g.push(it); else grupos2.push([it]);
  });
  const fundoEm = (it, sx) => { const f = it.fundo; if (sx <= f[0][0]) return f[0][1]; for (let i = 1; i < f.length; i++) if (sx <= f[i][0]) { const a = f[i - 1], b = f[i], t = (sx - a[0]) / ((b[0] - a[0]) || 1); return a[1] + (b[1] - a[1]) * t; } return f[f.length - 1][1]; };
  grupos2.forEach(g => {
    const prof = Math.min.apply(null, g.map(it => it.prof));
    if (g.length === 1) { const it = g[0]; vistas.push({ prof, svg: cam('VISTA', sPoly([[it.ta, it.top], [it.tb, it.top]].concat(it.fundo.slice().reverse()), treadFill(it.kind, C), C.ink, 0.9)) }); return; }
    /* contorno da união: em cada trecho entre bordas, topo = o mais alto e fundo = o mais baixo dos degraus que cobrem o trecho */
    const bps = []; g.forEach(it => { bps.push(it.ta, it.tb); it.fundo.forEach(q => bps.push(q[0])); });
    bps.sort((a, b) => a - b);
    const xs = bps.filter((v, i) => i === 0 || v - bps[i - 1] > 1e-6);
    const topo = [], baixo = [];
    for (let i = 0; i + 1 < xs.length; i++) {
      const a = xs[i], b = xs[i + 1], m = (a + b) / 2, cob = g.filter(it => it.ta <= m && it.tb >= m);
      if (!cob.length) continue;
      const tz = Math.max.apply(null, cob.map(it => it.top));
      topo.push([a, tz], [b, tz]);
      baixo.push([a, Math.min.apply(null, cob.map(it => fundoEm(it, a + 1e-6)))], [b, Math.min.apply(null, cob.map(it => fundoEm(it, b - 1e-6)))]);
    }
    let svg = sPoly(topo.concat(baixo.reverse()), treadFill(g[0].kind, C), C.ink, 0.9);
    /* de frente: as linhas dos bocéis (topo de cada degrau) aparecem; de lado e por baixo, não */
    if (g[0].cls === 'frente') g.forEach(it => { svg += sLine([it.ta, it.top], [it.tb, it.top], C.ink, 0.7); });
    vistas.push({ prof, svg: cam('VISTA', svg) });
  });
  /* dente da chegada (espelho do último degrau sob a laje de cima) em vista */
  if (R.dente) {
    const lado = ladoDeLa(R.dente.pts, P0, n);
    if (lado.length >= 3) { const ss = lado.map(S), ta = Math.min.apply(null, ss), tb = Math.max.apply(null, ss); if (tb - ta > 1e-6) vistas.push({ prof: Math.min.apply(null, lado.map(Dp)), svg: cam('VISTA', sPoly([[ta, R.dente.z1], [tb, R.dente.z1], [tb, R.dente.z0], [ta, R.dente.z0]], C.tread, C.ink, 0.9)) }); }
  }
  /* pilar da helicoidal em vista, quando fica além do plano: entra na ordem de profundidade como os degraus */
  const zU0 = H - st.espLaje;
  if (R.hel && R.pole) { const d = Dp([0, 0]), c = S([0, 0]); if (d > R.pole.r) vistas.push({ prof: d - R.pole.r, svg: cam('PILAR', '<rect x="' + r2(c - R.pole.r) + '" y="' + r2(-zU0) + '" width="' + r2(2 * R.pole.r) + '" height="' + r2(zU0) + '" fill="' + C.paper + '" stroke="' + C.ink + '" stroke-width="0.9" ' + NS + '/>') }); }
  vistas.sort((a, b) => b.prof - a.prof);
  vistas.forEach(v => { s += v.svg; });
  if (elev) {
    /* na elevação nada é cortado: a laje do piso de cima aparece em vista, como a faixa da borda dela (traço fino, sem hachura).
       Ela passa na frente do que fica atrás dela nessa altura; por isso é desenhada depois das vistas da escada, mas antes dos corrimãos, que ficam visíveis. */
    s += cam('VISTA', '<rect x="' + r2(s0) + '" y="' + r2(-H) + '" width="' + r2(s1 - s0) + '" height="' + r2(st.espLaje) + '" fill="' + C.piso + '" stroke="' + C.ink + '" stroke-width="1" ' + NS + '/>');
    s += sText(s0 + fs * 0.4, H + fs * 2.2, 'piso superior: laje de ' + fmt(st.espLaje) + ' cm, em vista', fs * 0.72, C.muted, 'start', 0, 500);
  }
  /* corrimãos em vista: os dois lados, pelo mesmo caminho do 3D (railLado: contorna os patamares na horizontal),
     só nos trechos além do plano, cortados exatamente no plano */
  if (typeof railLado === 'function') {
    const listas = R.hel ? [railHel(R, 4).pts] : [].concat.apply([], (R.nm.acess ? [92, 70] : [92]).map(hR => [0, 1].map(lado => railLado(R, lado, hR))));
    listas.forEach(pts => {
      let tr = [];
      const fecha = () => { if (tr.length > 1) s += cam('CORRIMAO', sPolyline(tr, C.ink, 1.2)); tr = []; };
      for (let i = 0; i < pts.length; i++) {
        const A = pts[i], dA = Dp(A);
        if (dA > 0) tr.push([S(A), A[2]]);
        const B = pts[i + 1]; if (!B) break;
        const dB = Dp(B);
        if ((dA > 0) !== (dB > 0)) { const k = dA / (dA - dB), q = [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k], z = A[2] + (B[2] - A[2]) * k; tr.push([S(q), z]); if (dA > 0) fecha(); }
      }
      fecha();
    });
  }
  /* ---- pisos e lajes ---- */
  const zU = H - st.espLaje;
  /* chão cortado */
  s += '<rect x="' + r2(s0) + '" y="0" width="' + r2(s1 - s0) + '" height="' + r2(fs * 1.6) + '" fill="url(#' + hid + ')" stroke="none"/>';
  s += sLine([s0, 0], [s1, 0], C.ink, 2.4);
  /* laje superior: cortada onde não há abertura; na abertura, a borda da laje do outro lado aparece em vista */
  let furo = null;
  if (R.opening) {
    if (R.opening.circle) { const r = R.opening.circle, d = Dp([0, 0]), c = S([0, 0]); if (Math.abs(d) < r) { const hw = Math.sqrt(r * r - d * d); furo = [c - hw, c + hw]; } }
    else { const b = R.opening.bbox; const box = [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]]; const iv = cortaPoligono(box, P0, n, u); if (iv.length) furo = iv[0]; }
  }
  const lajeRet = (a, b) => b - a > 1e-6 ? '<rect x="' + r2(a) + '" y="' + r2(-H) + '" width="' + r2(b - a) + '" height="' + r2(st.espLaje) + '" fill="url(#' + hid2 + ')" stroke="' + C.ink + '" stroke-width="1.8" ' + NS + '/>' : '';
  if (elev) {
    /* a faixa da laje do piso de cima já foi desenhada antes dos corrimãos */
  } else if (furo) {
    s += lajeRet(s0, furo[0]) + lajeRet(furo[1], s1);
    s += sLine([furo[0], zU], [furo[1], zU], C.muted, 0.9) + sLine([furo[0], H], [furo[1], H], C.muted, 0.9);
  } else s += lajeRet(s0, s1);
  /* ---- o que o plano corta (poché) ---- */
  const pecas = [];
  R.polys.forEach(pl => {
    cortaPoligono(pl.pts, P0, n, u).forEach(iv => {
      const NS3 = pl.kind === 'reto' || pl.kind === 'patamar' ? 1 : 8, fundo = [];
      for (let i = 0; i <= NS3; i++) { const sx = iv[0] + (iv[1] - iv[0]) * i / NS3; fundo.push([sx, R.zBot(pl, ptAt(sx, 0))]); }
      pecas.push({ k: pl.k, top: pl.top, a: iv[0], b: iv[1], fundo });
    });
  });
  if (R.dente) cortaPoligono(R.dente.pts, P0, n, u).forEach(iv => { s += sPoly([[iv[0], R.dente.z1], [iv[1], R.dente.z1], [iv[1], R.dente.z0], [iv[0], R.dente.z0]], 'url(#' + hid2 + ')', C.ink, 2); });
  pecas.sort((x, y) => x.a - y.a);
  /* junta peças vizinhas de degraus consecutivos num só contorno */
  const grupos = [];
  /* na helicoidal os degraus são placas soltas (sem espelho): cada uma tem o próprio contorno */
  pecas.forEach(pc => { const g = grupos[grupos.length - 1], ult = g && g[g.length - 1]; if (!R.placas && ult && Math.abs(ult.b - pc.a) < 1e-4 && Math.abs(ult.k - pc.k) === 1) g.push(pc); else grupos.push([pc]); });
  grupos.forEach(g => {
    const topo = [], fundo = [];
    g.forEach(pc => { topo.push([pc.a, pc.top], [pc.b, pc.top]); pc.fundo.forEach(q => fundo.push(q)); });
    const poly = topo.concat(fundo.reverse());
    s += sPoly(poly, 'url(#' + hid2 + ')', C.ink, 2);
  });
  /* pilar da helicoidal cortado */
  if (R.hel && R.pole) { const d = Dp([0, 0]), c = S([0, 0]); if (Math.abs(d) < R.pole.r) { const hw = Math.sqrt(R.pole.r * R.pole.r - d * d); s += cam('PILAR', '<rect x="' + r2(c - hw) + '" y="' + r2(-zU) + '" width="' + r2(2 * hw) + '" height="' + r2(zU) + '" fill="url(#' + hid2 + ')" stroke="' + C.ink + '" stroke-width="2" ' + NS + '/>'); } }
  /* a linha não atravessa a escada: avisa em vez de mostrar um corte vazio sem explicação */
  if (!pecas.length && !vistas.length) s += sText((s0 + s1) / 2, H / 2, 'A linha deste corte não passa pela escada nem por trás dela: desloque-a de volta.', fs * 0.9, C.accent, 'middle', 0, 600);
  /* altura livre sobre os degraus cortados */
  pecas.forEach(pc => { const z = pc.top + st.hLivre; if (z <= H + 1e-6) s += cam('ALTURA_LIVRE', sLine([pc.a, z], [pc.b, z], C.accent, 1.4, '5 4')); });
  /* números dos degraus cortados */
  pecas.forEach(pc => { if (pc.b - pc.a >= fs * 1.2) s += sText((pc.a + pc.b) / 2, pc.top - Math.min(e, 12) / 2 - 1, String(pc.k), fs * 0.7, C.ink, 'middle', 0, 600); });
  /* ---- níveis, cotas, título ---- */
  s += sText(s0 + fs * 0.4, fs * 1.0, nivel(0), fs * 0.85, C.ink, 'start', 0, 600);
  s += sText(s0 + fs * 0.4, H + fs * 1.0, nivel(H), fs * 0.85, C.ink, 'start', 0, 600);
  s += dimLine([s1, 0], [s1, H], 1, 0, fs * 2.4, 'H ' + fmt(H, 0), fs, C);
  s += dimLine([s1, zU], [s1, H], 1, 0, fs * 0.9, fmt(st.espLaje, 0), fs * 0.75, C);
  if (pecas.some(pc => pc.top + st.hLivre <= H + 1e-6)) s += cam('ALTURA_LIVRE', sText(s0 + fs * 0.4, H + fs * 3.2, 'tracejado laranja: altura livre de ' + fmt(st.hLivre, 0) + ' sobre os degraus cortados', fs * 0.72, C.accent, 'start', 0, 500));
  const nomeT = R.hel ? 'HELICOIDAL' : TIPOS.find(t => t.id === R.tipo).nome.toUpperCase();
  const t1 = elev ? 'ELEVAÇÃO · ' + LADOS_ELEV[LADOS_ELEV[lado] ? lado : 'frente'].toUpperCase() + ' · ESCADA ' + nomeT : 'CORTE ' + qual + '-' + qual + ' · ESCADA ' + nomeT;
  const t2 = elev ? 'vista de fora, sem cortar nada · tudo em traço fino · cm' : 'hachura: cortado · traço fino: em vista · cm';
  const semT = !!(o && o.semTitulo), ymin = semT ? -fs * 2.5 : -fs * 9.5;
  if (!semT) s += titleBlock(s0 - fs * 2, -fs * 3, s1 - s0 + fs * 8, fs, t1, t2, C);
  const vx = s0 - fs * 3, vxw = s1 - s0 + fs * 11, ymax = H + (R.hel ? 0 : 92) + fs * 5;
  return svgWrap(vx, -ymax, vxw, ymax - ymin, s, o, defs);
}

function modoInf(o, R) { return (o.modo || R.st.modoPlanta || 'inf') !== 'sup'; }
/* extremos da linha de corte na planta: passam das cotas (a 5,4 fs do desenho) para as letras não caírem em cima de texto */
function chamadaExtremos(R, qual, fs, bbA) {
  const cs = cortesDe(R)[qual], P0 = cs.P0, u = cs.u;
  const S = q => (q[0] - P0[0]) * u[0] + (q[1] - P0[1]) * u[1];
  const cantos = [[bbA[0], bbA[1]], [bbA[2], bbA[1]], [bbA[2], bbA[3]], [bbA[0], bbA[3]]].map(S);
  return [Math.min.apply(null, cantos) - fs * 7.5, Math.max.apply(null, cantos) + fs * 7.5];
}
/* pontos que a chamada ocupa (pontas, setas e letras), para o desenho reservar espaço */
function chamadaPontos(R, qual, fs, bbA) {
  const cs = cortesDe(R)[qual], P0 = cs.P0, n = cs.n, u = cs.u, ex = chamadaExtremos(R, qual, fs, bbA), out = [];
  ex.forEach(sx => { const q = [P0[0] + u[0] * sx, P0[1] + u[1] * sx]; out.push(q, [q[0] + n[0] * fs * 3, q[1] + n[1] * fs * 3], [q[0] + u[0] * fs * 2, q[1] + u[1] * fs * 2], [q[0] - u[0] * fs * 2, q[1] - u[1] * fs * 2]); });
  return out;
}
/* linha de corte na planta: traço-ponto fino, pontas grossas, setas no sentido do olhar e as letras */
function chamadaCorte(R, qual, fs, C, bbA) {
  const cs = cortesDe(R)[qual], P0 = cs.P0, n = cs.n, u = cs.u;
  const ab = chamadaExtremos(R, qual, fs, bbA), a = ab[0], b = ab[1];
  const P = s => [P0[0] + u[0] * s, P0[1] + u[1] * s];
  let out = sLine(P(a), P(b), C.info, 0.9, '14 4 2 4');
  [a, b].forEach((sx, i) => {
    const q = P(sx), dir = i ? 1 : -1, q2 = P(sx - dir * fs * 1.6);
    out += sLine(q, q2, C.info, 3);
    const tip = [q[0] + n[0] * fs * 1.8, q[1] + n[1] * fs * 1.8];
    out += sLine(q, tip, C.info, 1.6) + sPoly([[tip[0] + n[0] * fs * 0.6, tip[1] + n[1] * fs * 0.6], [tip[0] + u[0] * fs * 0.4, tip[1] + u[1] * fs * 0.4], [tip[0] - u[0] * fs * 0.4, tip[1] - u[1] * fs * 0.4]], C.info, C.info, 1);
    const lt = [q[0] + n[0] * fs * 1.2 + u[0] * dir * fs * 1.3, q[1] + n[1] * fs * 1.2 + u[1] * dir * fs * 1.3];
    out += sText(lt[0], lt[1], qual, fs * 1.1, C.info, 'middle', 0, 700);
  });
  return out;
}
