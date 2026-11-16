/* ===== DESENHOS EM SVG: PLANTA E CORTE (convenções de projeto) ===== */
const r2 = v => Math.round(v * 100) / 100;
const escXml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const NS = 'vector-effect="non-scaling-stroke"';
let HCH = 0;
const FONT = "'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace";

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
  return s;
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
  return s;
}

function planSVG(R, o, C) {
  o = o || {};
  const thumb = !!o.thumb;
  const modo = thumb ? 'inf' : (o.modo || R.st.modoPlanta || 'inf');
  const sup = modo === 'sup';
  const bbA = thumb ? R.bbox : R.bboxAll, bb = R.bbox;
  const w = bbA[2] - bbA[0], h = bbA[3] - bbA[1], span = Math.max(w, h);
  const fs = thumb ? span / 14 : clamp(span / 40, 5, 14);
  const m = thumb ? span * 0.07 : fs * 10, tb = thumb ? 0 : fs * 7.5;
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
    s += sSolidArrival(arr.pts, sup, C);
    if (!sup) {
      s += sText(ac[0], ac[1] + fs * 0.6, R.hel ? 'PISO SUP.' : 'PISO SUPERIOR', fs * 0.72, C.muted, 'middle', 0, 500);
      s += sText(ac[0], ac[1] - fs * 0.7, nivel(R.H), fs * 0.8, C.ink, 'middle', 0, 600);
    }
  }
  let clipId = null;
  if (sup && !thumb && op) {
    /* pavimento superior: só se vê a escada pela abertura da laje; o que está mais alto cobre o que está embaixo */
    const cid = clipId = 'cl' + Math.random().toString(36).slice(2, 8);
    const shape = op.circle ? '<circle cx="0" cy="0" r="' + r2(op.circle) + '"/>' : '<rect x="' + r2(op.bbox[0]) + '" y="' + r2(-op.bbox[3]) + '" width="' + r2(op.bbox[2] - op.bbox[0]) + '" height="' + r2(op.bbox[3] - op.bbox[1]) + '"/>';
    s += '<defs><clipPath id="' + cid + '">' + shape + '</clipPath></defs><g clip-path="url(#' + cid + ')">';
    R.polys.forEach(pl => { s += sPoly(pl.pts, treadFill(pl.kind, C), C.ink, 1.5); });
    s += '</g>';
  } else {
    /* pavimento inferior: primeiro o que está abaixo do corte (traço cheio), depois a projeção do que está acima (tracejado, por cima) */
    const on = pl => !useCut ? true : visible(pl);
    R.polys.forEach(pl => { if (on(pl)) s += sPoly(pl.pts, treadFill(pl.kind, C), C.ink, thumb ? 1 : 1.5); });
    R.polys.forEach(pl => { if (!on(pl)) s += sPoly(pl.pts, treadFill(pl.kind, C), C.muted, 1.1, '6 4', R.hel ? 0 : 0.28); });
  }
  if (R.hel) s += sCircle(0, 0, R.helix.rc, C.ink, C.ink, 1);
  if (!thumb && !sup && useCut && kCut >= 1 && kCut < T) {
    const nx = R.polys[kCut];
    if (nx && nx.entry) s += breakLine(nx.entry[0], nx.entry[1], fs, C);
  }
  /* vão na laje */
  if (!thumb && o.opening !== false && op) {
    const dash = sup ? null : '7 5', col = sup ? C.ink : C.info, wd = sup ? 2.8 : 1.8;
    if (op.circle) s += '<circle cx="0" cy="0" r="' + r2(op.circle) + '" fill="none" stroke="' + col + '" stroke-width="' + wd + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + ' ' + NS + '/>';
    else { const q = op.bbox; s += sPoly([[q[0], q[1]], [q[2], q[1]], [q[2], q[3]], [q[0], q[3]]], 'none', col, wd, dash); }
  }
  /* linha de caminhamento + seta (na planta superior, recortadas pela abertura junto com os números) */
  let rotulos = '';
  if (clipId) s += '<g clip-path="url(#' + clipId + ')">';
  if (o.walk !== false && R.walk.length) {
    R.walk.forEach(wl => { s += sPolyline(wl, C.accent, thumb ? 1.6 : 2.3); });
    const all = [].concat.apply([], R.walk);
    const first = all[0], f2 = all.find(q => Math.hypot(q[0] - first[0], q[1] - first[1]) > 1) || first;
    const end = all[all.length - 1], pre = all.slice().reverse().find(q => Math.hypot(q[0] - end[0], q[1] - end[1]) > 1) || end;
    const head = sup ? first : end, hpre = sup ? f2 : pre, tail = sup ? end : first, tnext = sup ? pre : f2;
    let ux = head[0] - hpre[0], uy = head[1] - hpre[1]; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
    const hs = fs * (thumb ? 1.3 : 1.2), base = [head[0] - ux * hs, head[1] - uy * hs];
    s += sPoly([[head[0] + ux * hs * 0.2, head[1] + uy * hs * 0.2], [base[0] - uy * hs * 0.5, base[1] + ux * hs * 0.5], [base[0] + uy * hs * 0.5, base[1] - ux * hs * 0.5]], C.accent, C.accent, 1);
    s += sCircle(tail[0], tail[1], fs * 0.5, C.accent);
    if (!thumb) {
      let fx = tail[0] - tnext[0], fy = tail[1] - tnext[1]; const fl = Math.hypot(fx, fy) || 1; fx /= fl; fy /= fl;
      let d1 = fs * 2.6, d2 = fs * 4.4;
      if (R.hel) { const tl = Math.hypot(tail[0], tail[1]) || 1; fx = tail[0] / tl; fy = tail[1] / tl; d1 += R.dw; d2 += R.dw; }
      rotulos += sText(tail[0] + fx * d1, tail[1] + fy * d1, sup ? 'DESCE' : 'SOBE', fs * 0.95, C.accent, 'middle', 0, 600);
      rotulos += sText(tail[0] + fx * d2, tail[1] + fy * d2, sup ? nivel(R.H) : nivel(0), fs * 0.85, C.ink, 'middle', 0, 600);
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
      s += '<g stroke="' + treadFill(pl.kind, C) + '" stroke-width="' + r2(fs * 0.45) + '" stroke-linejoin="round" paint-order="stroke">' + sText(cx, cy, String(pl.k), fs * 0.85, on ? C.ink : C.muted, 'middle', 0, 500) + '</g>';
    });
  }
  if (clipId) s += '</g>';
  s += rotulos;
  /* ponta mais estreita dos degraus balanceados: marca no canto interno */
  if (showDims && !sup && R.bal && R.nLeque) {
    const lqs = R.polys.filter(pl => pl.kind === 'leque');
    const pm = lqs.reduce((m, pl) => pl.wIn < m.wIn ? pl : m, lqs[0]);
    const I = pm.entry[1], c = centroid(pm.pts);
    let dx = I[0] - c[0], dy = I[1] - c[1]; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
    const T2 = [I[0] + dx * fs * 2.2, I[1] + dy * fs * 2.2];
    s += sLine(I, T2, C.accent, 0.9) + sText(T2[0] + dx * fs * 1.6, T2[1] + dy * fs * 0.9, 'ponta ' + fmt(pm.wIn, 1), fs * 0.75, C.accent, 'middle', 0, 600);
  }
  /* cotas */
  if (showDims) {
    const topGap = (bbA[3] - bb[3]) + fs * 5.4, rightGap = (bbA[2] - bb[2]) + fs * 5.4;
    if (R.hel) {
      s += dimLine([bb[0], bb[3]], [bb[2], bb[3]], 0, 1, topGap, 'Ø ' + fmt(R.helix.R * 2, 0), fs, C);
      s += sText(0, -R.helix.R - fs * 7.2, 'pilar Ø ' + fmt(R.helix.rc * 2, 0) + ' · ' + fmt(R.helix.th, 1) + '° por degrau', fs * 0.85, C.muted, 'middle');
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
  if (!thumb) {
    const ymin = bbA[1] - m;
    const t1 = (R.hel ? 'ESCADA HELICOIDAL' : 'ESCADA ' + TIPOS.find(t => t.id === R.tipo).nome.toUpperCase()) + ' · PLANTA ' + (sup ? 'DO PAV. SUPERIOR' : 'DO PAV. INFERIOR');
    const t2 = 'H ' + fmt(R.H, 0) + ' · ' + R.N + ' espelhos de ' + fmt(R.e, 1) + ' · ' + R.contagem + (R.nReto ? ' (piso ' + fmt(R.p, 1) + ')' : '') + ' · cotas em cm' + (sup ? '' : ' · corte a ' + fmt(R.zc, 0));
    s += titleBlock(vx, ymin, vw, fs, t1, t2, C);
  }
  return svgWrap(vx, vy, vw, vh, s, o);
}
function sSolidArrival(pts, sup, C) {
  return sup ? sPoly(pts, C.piso, C.ink, 1.6) : sPoly(pts, C.piso, C.muted, 1, '5 4');
}

function sectionSVG(R, o, C) {
  o = o || {};
  const H = R.H, e = R.e, X = R.Wtot, st = R.st;
  const left = -70, slabR = 110, right = X + slabR;
  const span = Math.max(right - left, H + 90);
  const fs = clamp(span / 46, 5, 13);
  const xmin = left - fs * 4, xmax = right + fs * 8;
  const ymin = -fs * 15.5, ymax = H + 92 + fs * 3;
  const vx = xmin, vy = -ymax, vw = xmax - xmin, vh = ymax - ymin;
  const hid = 'hch' + (++HCH); /* id único: a mesma página pode ter dois perfis (tela e impressão) */
  const defs = '<defs><pattern id="' + hid + '" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="' + C.muted + '" stroke-width="1"/></pattern></defs>';
  let s = '';
  /* terreno */
  s += '<rect x="' + left + '" y="0" width="' + (0 - left) + '" height="' + r2(fs * 2.2) + '" fill="url(#' + hid + ')" stroke="none"/>';
  s += sLine([left, 0], [0, 0], C.ink, 2.4);
  /* degraus */
  if (R.hel) {
    R.polys.forEach(pl => {
      const top = pl.k * e, bot = Math.max(top - R.thk, 0);
      s += '<rect x="' + r2(pl.x0) + '" y="' + r2(-top) + '" width="' + r2(pl.x1 - pl.x0) + '" height="' + r2(top - bot) + '" fill="' + treadFill(pl.kind, C) + '" stroke="' + C.ink + '" stroke-width="1.3" ' + NS + '/>';
    });
  } else {
    /* laje da escada: dentes dos degraus sobre uma laje inclinada de espessura constante (horizontal nos patamares) */
    const tl = st.tLaje;
    const top = [[0, 0]], und = [];
    R.polys.forEach(pl => {
      const z0 = (pl.k - 1) * e, z1 = pl.k * e;
      top.push([pl.x0, z1], [pl.x1, z1]);
      if (pl.kind === 'patamar') und.push([pl.x0, z1 - tl], [pl.x1, z1 - tl]);
      else { const w = (pl.x1 - pl.x0) || 1, dv = tl * Math.hypot(w, e) / w; und.push([pl.x0, z0 - dv], [pl.x1, z1 - dv]); }
    });
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
      s += sPolyline(pl, C.ink, 1.1);
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
    s += sPolyline(hp, C.accent, 1.7, '6 4');
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
  s += sText(left + fs * 0.5, -fs * 5.6, 'degrau: espelho ' + fmt(e, 1) + ' × piso ' + fmt(R.p, 1) + ' cm  ·  ' + fmt(R.incl, 1) + '°' + (R.hel ? '' : '  ·  laje da escada ' + fmt(st.tLaje) + ' cm'), fs * 0.9, C.ink, 'start', 0, 500);
  const t1 = 'PERFIL DESENVOLVIDO · ESCADA ' + (R.hel ? 'HELICOIDAL' : TIPOS.find(t => t.id === R.tipo).nome.toUpperCase());
  const t2 = 'esquema ao longo da linha de caminhamento (não é corte A-A) · H ' + fmt(H) + ' · ' + R.N + ' espelhos de ' + fmt(e, 1) + ' · cotas em cm';
  s += titleBlock(vx, -fs * 8, vw, fs, t1, t2, C);
  return svgWrap(vx, vy, vw, vh, s, o, defs);
}
