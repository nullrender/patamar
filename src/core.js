/* ===== NÚCLEO DE CÁLCULO E GEOMETRIA (cm, plano x leste / y norte) ===== */
const PI = Math.PI;
const rad = d => d * PI / 180;
const deg = r => r * 180 / PI;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const num = (v, d) => { v = Number(v); return isFinite(v) ? v : d; };
const fmt = (n, d) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: d === undefined ? 1 : d });

/* Perfis de limites (editáveis aqui), conferidos em 16/11/2026 em fontes secundárias e numa revisão externa:
   NBR 9050:2020 (item 6.8): espelho 16-18, piso 28-32, 63 <= 2e+p <= 65, patamar a cada 3,20 m e nas mudanças de direção,
   largura 1,20 m em rota acessível, linha de piso a 55 cm da borda interna em lances curvos (6.8.6, não conferido por mim no texto).
   Estudo: valores usuais em apostilas e códigos de obras, sem norma única que os sustente. */
const NORMAS = {
  res:   { id: 'res',   nome: 'Estudo (valores usuais, sem norma específica)', curto: 'perfil de estudo', eMin: 16, eMax: 18, pMin: 25, pMax: 32, bMin: 63, bMax: 64, Lmin: 80,  hPat: 320, dw: 50, patReto: 0, acess: false },
  acess: { id: 'acess', nome: 'NBR 9050: conferência dimensional parcial',      curto: 'NBR 9050 (parcial)', eMin: 16, eMax: 18, pMin: 28, pMax: 32, bMin: 63, bMax: 65, Lmin: 120, hPat: 320, dw: 55, patReto: 120, acess: true },
};
const NMAX = 300; /* limite do aplicativo (capacidade de cálculo), não é norma */
Object.keys(NORMAS).forEach(k => { NORMAS[k].bMid = (NORMAS[k].bMin + NORMAS[k].bMax) / 2; });

const TIPOS = [
  { id: 'reta',         nome: 'Reta',              desc: 'Um lance, sem mudança de direção' },
  { id: 'reta-patamar', nome: 'Reta com patamar',  desc: 'Dois lances alinhados, com descanso no meio' },
  { id: 'l-patamar',    nome: 'Em L com patamar',  desc: 'Curva de 90° com patamar quadrado' },
  { id: 'l-leque',      nome: 'Em L com leques',   desc: 'Curva de 90° com degraus em leque' },
  { id: 'u-patamar',    nome: 'Em U com patamar',  desc: 'Retorno de 180° com patamar' },
  { id: 'u-leque',      nome: 'Em U com leques',   desc: 'Retorno de 180° com degraus em leque' },
  { id: 'helicoidal',   nome: 'Helicoidal',        desc: 'Caracol: degraus em volta de um pilar' },
];

const DEFAULTS = {
  tipo: 'l-patamar', norma: 'res',
  H: 280, L: 100,
  nAuto: true, N: 16, pAuto: true, p: 29, n1Auto: true, n1: 7,
  lado: 'dir', kLeque: 3, nMeio: 1, vao: 10, LpAuto: true, Lp: 100,
  D: 220, Dc: 20,
  hLivre: 210, espLaje: 12, tLaje: 10, espDegrau: 5,
  zCorte: 150, modoPlanta: 'inf', showDims: true, showNums: true, showPessoa: true,
  cEmin: 16, cEmax: 18, cPmin: 25, cPmax: 32, cBmin: 63, cBmax: 64, cLmin: 80, cHpat: 320, cDw: 50,
};

/* Quadro local: origem O, direção h, direita r. map(t,s): t = lateral (0 = esquerda), s = ao longo. */
function mkF(ox, oy, hx, hy) {
  const F = { ox, oy, hx, hy, rx: hy, ry: -hx };
  F.map = (t, s) => [F.ox + t * F.rx + s * F.hx, F.oy + t * F.ry + s * F.hy];
  return F;
}

/* faixa de piso que atende ao mesmo tempo os limites de piso e de Blondel */
function faixaP(e, nm) { return [Math.max(nm.pMin, nm.bMin - 2 * e), Math.min(nm.pMax, nm.bMax - 2 * e)]; }
function escolherN(H, nm, hel) {
  const nMin = Math.max(2, Math.ceil(H / nm.eMax - 1e-9));
  const nMax = Math.min(NMAX, Math.max(nMin, Math.floor(H / nm.eMin + 1e-9)));
  let best = null;
  for (let n = nMin; n <= nMax; n++) {
    const e = H / n, f = faixaP(e, nm);
    if (!hel && f[0] > f[1] + 1e-9) continue;
    const sc = Math.abs(e - 17.5);
    if (!best || sc < best.sc - 1e-9) best = { n, sc };
  }
  if (best) return best.n;
  let alt = nMin, sc = Infinity;
  for (let n = nMin; n <= nMax; n++) { const s = Math.abs(H / n - 17.5); if (s < sc) { sc = s; alt = n; } }
  return alt;
}

function bboxOf(list) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  list.forEach(q => { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); });
  return [x0, y0, x1, y1];
}

/* erro de entrada: o app para e mostra a mensagem, em vez de desenhar algo que não corresponde ao pedido */
function erro(msg) { const x = new RangeError(msg); x.patamar = true; throw x; }
function calc(inp) {
  const st = Object.assign({}, DEFAULTS, inp || {});
  const pos = (k, nome, min, max) => { const v = Number(st[k]); if (!isFinite(v)) erro(nome + ': valor inválido.'); if (v < min || v > max) erro(nome + ' precisa estar entre ' + fmt(min) + ' e ' + fmt(max) + ' cm (você digitou ' + fmt(v) + ').'); st[k] = v; };
  pos('H', 'Desnível', 1, 3000); pos('L', 'Largura útil', 30, 1000);
  pos('hLivre', 'Altura livre', 100, 500); pos('espLaje', 'Laje do piso de cima', 0, 100);
  pos('tLaje', 'Laje da escada', 0, 100); pos('espDegrau', 'Espessura do degrau', 1, 50);
  pos('vao', 'Vão entre lances', 0, 500); pos('Lp', 'Profundidade do patamar', 30, 1000);
  pos('D', 'Diâmetro externo', 60, 1000); pos('Dc', 'Diâmetro do pilar', 4, 200);
  pos('zCorte', 'Altura do corte', 20, 3000);
  if (!st.pAuto) pos('p', 'Piso', 10, 100);
  let nm = NORMAS[st.norma] || NORMAS.res;
  if (st.norma === 'custom') {
    nm = { id: 'custom', nome: 'Personalizada (limites digitados)', curto: 'perfil personalizado', eMin: Number(st.cEmin), eMax: Number(st.cEmax), pMin: Number(st.cPmin), pMax: Number(st.cPmax), bMin: Number(st.cBmin), bMax: Number(st.cBmax), Lmin: Number(st.cLmin), hPat: Number(st.cHpat), dw: Number(st.cDw), patReto: 0, acess: false };
    const nomes = { eMin: 'Espelho mínimo', eMax: 'Espelho máximo', pMin: 'Piso mínimo', pMax: 'Piso máximo', bMin: 'Blondel mínimo', bMax: 'Blondel máximo', Lmin: 'Largura mínima', hPat: 'Desnível máximo sem patamar', dw: 'Linha de caminhamento' };
    Object.keys(nomes).forEach(k => { if (!isFinite(nm[k]) || nm[k] <= 0) erro('Limite personalizado inválido: ' + nomes[k] + ' precisa ser um número maior que zero.'); });
    [['eMin', 'eMax'], ['pMin', 'pMax'], ['bMin', 'bMax']].forEach(q => { if (nm[q[0]] > nm[q[1]]) erro('Limite personalizado invertido: ' + nomes[q[0]] + ' maior que ' + nomes[q[1]] + '.'); });
    nm.bMid = (nm.bMin + nm.bMax) / 2;
  }
  const tipo = TIPOS.some(t => t.id === st.tipo) ? st.tipo : 'reta';
  const hel = tipo === 'helicoidal';
  const H = st.H;
  if (H / nm.eMax > NMAX) erro('Desnível grande demais para o app (mais de ' + NMAX + ' espelhos).');
  const nSug = escolherN(H, nm, hel);
  let N = nSug;
  if (!st.nAuto) { N = Math.round(Number(st.N)); if (!isFinite(N) || N < 2 || N > NMAX) erro('Número de espelhos precisa estar entre 2 e ' + NMAX + '.'); }
  const e = H / N, T = N - 1;
  const fP = faixaP(e, nm), temFaixa = fP[0] <= fP[1] + 1e-9;
  /* piso automático: o inteiro mais perto do centro de Blondel que cabe na faixa; se nenhum inteiro cabe, o decimal mais perto */
  let pAlvo;
  if (temFaixa) { const lo = Math.ceil(fP[0] - 1e-9), hi = Math.floor(fP[1] + 1e-9); pAlvo = lo <= hi ? clamp(Math.round(nm.bMid - 2 * e), lo, hi) : clamp(nm.bMid - 2 * e, fP[0], fP[1]); }
  else pAlvo = clamp(nm.bMid - 2 * e, nm.pMin, nm.pMax);
  const thk = hel ? st.espDegrau : e + st.tLaje;
  const mirror = st.lado === 'esq' && !hel;

  const polys = [], walk = [], checks = [], memo = [];
  let kk = 0, grpN = 0;
  const add = (pts, kind, wlen, extra) => { kk++; polys.push(Object.assign({ k: kk, pts, kind, wlen }, extra || {})); };
  const chk = (id, nome, valor, regra, status, nota) => checks.push({ id, nome, valor, regra, status, nota: nota || '' });

  let L = st.L;
  let p = st.pAuto ? pAlvo : st.p;
  let dw = Math.min(nm.dw, L / 2);
  const kw = clamp(Math.round(num(st.kLeque, 3)), 2, 4);
  const nMeio = clamp(Math.round(num(st.nMeio, 1)), 0, 6);
  const g = Math.max(0, st.vao);
  const Lp = st.LpAuto ? Math.max(L, nm.patReto || 0) : st.Lp;

  let a = 0, b = 0, avail = 0, endF = null, endS = 0;
  let arrival = null, slab = null, pole = null, startEdge = null, rises = [], helix = null, lancesTxt = [];
  let pReal = p;

  const rectPts = (F, t0, t1, s0, s1) => [F.map(t0, s0), F.map(t1, s0), F.map(t1, s1), F.map(t0, s1)];
  const flight = (F, s0, m) => {
    const gid = ++grpN;
    for (let j = 0; j < m; j++) { const aa = s0 + j * p; add(rectPts(F, 0, L, aa, aa + p), 'reto', p, { grp: gid, entry: [F.map(0, aa), F.map(L, aa)] }); }
    if (m > 0) walk.push([F.map(L - dw, s0), F.map(L - dw, s0 + m * p)]);
    return s0 + m * p;
  };
  const arcWalk = (F, s0) => {
    const arc = [];
    for (let i = 0; i <= 24; i++) { const ph = i / 24 * PI / 2; arc.push(F.map(L - dw * Math.cos(ph), s0 + dw * Math.sin(ph))); }
    walk.push(arc);
  };
  const winders = (F, s0, k) => {
    const piv = F.map(L, s0);
    const bpt = d => {
      if (d >= 89.999) return F.map(L, s0 + L);
      const t = Math.tan(rad(d));
      return d <= 45 ? F.map(0, s0 + L * t) : F.map(L - L / t, s0 + L);
    };
    for (let i = 1; i <= k; i++) {
      const da = (i - 1) * 90 / k, db = i * 90 / k;
      const pts = [piv, bpt(da)];
      if (da < 45 - 1e-9 && db > 45 + 1e-9) pts.push(F.map(0, s0 + L));
      pts.push(bpt(db));
      add(pts, 'leque', dw * rad(db - da), { entry: [piv, bpt(da)] });
    }
    arcWalk(F, s0);
  };
  const turn = (F, s0) => { const o = F.map(L, s0 + L); return mkF(o[0], o[1], F.rx, F.ry); };
  const split = av => {
    av = Math.max(0, av);
    const aa = st.n1Auto ? Math.ceil(av / 2) : clamp(Math.round(num(st.n1, 1)), 0, av);
    return [aa, av - aa];
  };

  const F1 = mkF(0, 0, 0, 1);
  const need = x => { if (x < 0) erro('Desnível pequeno demais para este tipo: faltam ' + (-x) + ' espelho(s). Aumente o desnível ou o número de espelhos, reduza os leques ou os pisos do meio, ou escolha outro tipo.'); };

  if (!hel) {
    switch (tipo) {
      case 'reta': {
        avail = T; a = T; b = 0;
        flight(F1, 0, T); endF = F1; endS = T * p;
        rises = [H];
        lancesTxt.push('Lance único com ' + T + ' pisos de ' + fmt(p) + ' cm e ' + N + ' espelhos.');
        break;
      }
      case 'reta-patamar': {
        avail = T - 1; need(avail);
        [a, b] = split(avail);
        let s = flight(F1, 0, a);
        add(rectPts(F1, 0, L, s, s + Lp), 'patamar', Lp, { entry: [F1.map(0, s), F1.map(L, s)] });
        walk.push([F1.map(L - dw, s), F1.map(L - dw, s + Lp)]);
        s += Lp;
        s = flight(F1, s, b);
        endF = F1; endS = s;
        rises = [(a + 1) * e, H - (a + 1) * e];
        lancesTxt.push('1º lance: ' + a + ' pisos + patamar (' + fmt(L) + ' × ' + fmt(Lp) + ' cm) no degrau ' + (a + 1) + ', a ' + fmt((a + 1) * e, 1) + ' cm do piso.');
        lancesTxt.push('2º lance: ' + b + ' pisos até o piso superior.');
        break;
      }
      case 'l-patamar': {
        avail = T - 1; need(avail);
        [a, b] = split(avail);
        let s = flight(F1, 0, a);
        add(rectPts(F1, 0, L, s, s + L), 'patamar', dw * PI / 2, { entry: [F1.map(0, s), F1.map(L, s)] });
        arcWalk(F1, s);
        const F2 = turn(F1, s);
        flight(F2, 0, b);
        endF = F2; endS = b * p;
        rises = [(a + 1) * e, H - (a + 1) * e];
        lancesTxt.push('1º lance: ' + a + ' pisos; patamar quadrado de ' + fmt(L) + ' × ' + fmt(L) + ' cm no degrau ' + (a + 1) + ', a ' + fmt((a + 1) * e, 1) + ' cm do piso.');
        lancesTxt.push('2º lance (virado 90°): ' + b + ' pisos até o piso superior.');
        break;
      }
      case 'l-leque': {
        avail = T - kw; need(avail);
        [a, b] = split(avail);
        let s = flight(F1, 0, a);
        winders(F1, s, kw);
        const F2 = turn(F1, s);
        flight(F2, 0, b);
        endF = F2; endS = b * p;
        rises = [H];
        lancesTxt.push('1º lance: ' + a + ' pisos retos; curva de 90° com ' + kw + ' degraus em leque (' + fmt(90 / kw, 1) + '° cada); 2º lance: ' + b + ' pisos retos.');
        break;
      }
      case 'u-patamar': {
        avail = T - 1; need(avail);
        [a, b] = split(avail);
        let s = flight(F1, 0, a);
        const W = 2 * L + g;
        add(rectPts(F1, 0, W, s, s + Lp), 'patamar', Lp + g + 2 * dw, { entry: [F1.map(0, s), F1.map(L, s)] });
        walk.push([F1.map(L - dw, s), F1.map(L - dw, s + Lp / 2), F1.map(L + g + dw, s + Lp / 2), F1.map(L + g + dw, s)]);
        const o = F1.map(W, s);
        const F3 = mkF(o[0], o[1], 0, -1);
        flight(F3, 0, b);
        endF = F3; endS = b * p;
        rises = [(a + 1) * e, H - (a + 1) * e];
        lancesTxt.push('1º lance: ' + a + ' pisos; patamar de ' + fmt(W) + ' × ' + fmt(Lp) + ' cm no degrau ' + (a + 1) + ', a ' + fmt((a + 1) * e, 1) + ' cm do piso.');
        lancesTxt.push('2º lance (retorno 180°): ' + b + ' pisos; vão central entre os lances de ' + fmt(g) + ' cm.');
        break;
      }
      case 'u-leque': {
        avail = T - 2 * kw - nMeio; need(avail);
        [a, b] = split(avail);
        let s = flight(F1, 0, a);
        winders(F1, s, kw);
        const F2 = turn(F1, s);
        flight(F2, 0, nMeio);
        winders(F2, nMeio * p, kw);
        const F3 = turn(F2, nMeio * p);
        flight(F3, 0, b);
        endF = F3; endS = b * p;
        rises = [H];
        lancesTxt.push('1º lance: ' + a + ' pisos; 1ª curva com ' + kw + ' leques; trecho do meio com ' + nMeio + ' piso(s); 2ª curva com ' + kw + ' leques; último lance: ' + b + ' pisos.');
        lancesTxt.push('Vão central entre os lances: ' + fmt(nMeio * p) + ' cm.');
        break;
      }
    }
    pReal = p;
    arrival = rectPts(endF, 0, L, endS, endS + 60);
    slab = rectPts(endF, -10, L + 10, endS, endS + 70);
    startEdge = [F1.map(0, 0), F1.map(L, 0)];
  } else {
    /* helicoidal */
    const R = st.D / 2, rc = st.Dc / 2;
    if (R - rc < 30) erro('Na helicoidal, o raio externo menos o raio do pilar precisa dar pelo menos 30 cm de largura (hoje dá ' + fmt(R - rc) + ' cm).');
    const Leff = R - rc; L = Leff;
    dw = Math.min(nm.dw, Leff / 2);
    const rw = rc + dw; /* linha de caminhamento medida a partir da borda interna (o pilar) */
    const pT = st.pAuto ? pAlvo : st.p;
    const nPref = Math.max(6, Math.round(2 * PI * rw / pT));
    const nReq = Math.ceil((st.hLivre + thk) / e - 1e-9);
    const nPer = Math.max(nPref, nReq);
    const th = 360 / nPer;
    const dir = st.lado === 'esq' ? 1 : -1;
    const phi0 = -90;
    const segs = Math.max(2, Math.ceil(th / 8));
    for (let j = 0; j < T; j++) {
      const A = phi0 + dir * j * th, B = phi0 + dir * (j + 1) * th;
      const outer = [], inner = [];
      for (let s = 0; s <= segs; s++) {
        const ph = rad(A + (B - A) * s / segs);
        outer.push([R * Math.cos(ph), R * Math.sin(ph)]);
        inner.push([rc * Math.cos(ph), rc * Math.sin(ph)]);
      }
      add(outer.concat(inner.slice().reverse()), 'helice', rw * rad(th), { arc: { outer, inner }, entry: [inner[0], outer[0]] });
    }
    const wl = [];
    const phiEnd = phi0 + dir * T * th;
    for (let ang = phi0; dir > 0 ? ang <= phiEnd + 1e-6 : ang >= phiEnd - 1e-6; ang += dir * 4) wl.push([rw * Math.cos(rad(ang)), rw * Math.sin(rad(ang))]);
    walk.push(wl);
    const aSpan = th; /* chegada = uma posição de degrau, no nível do piso superior */
    const mkSector = (r0, r1, A, B) => {
      const outer = [], inner = [];
      for (let s = 0; s <= 8; s++) { const ph = rad(A + (B - A) * s / 8); outer.push([r1 * Math.cos(ph), r1 * Math.sin(ph)]); inner.push([r0 * Math.cos(ph), r0 * Math.sin(ph)]); }
      return { pts: outer.concat(inner.slice().reverse()), arc: { outer, inner } };
    };
    arrival = mkSector(rc, R, phiEnd, phiEnd + dir * aSpan);
    slab = mkSector(R / Math.cos(rad(90 / 16)), R + 50, phiEnd, phiEnd + dir * 90); /* laje fora do furo: o raio interno compensa as cordas do polígono */
    pole = { r: rc, h: H };
    pReal = rw * rad(th);
    helix = { R, rc, rw, th, nPer, dir, phi0, phiEnd, turns: T * th / 360, clearance: nPer * e - thk, Leff, dw };
    rises = [H];
    avail = 0;
    endF = null;
    lancesTxt.push(T + ' degraus em ' + fmt(T * th / 360, 2) + ' volta(s), ' + fmt(th, 1) + '° por degrau, ' + nPer + ' degraus por volta.');
    lancesTxt.push('Piso medido na linha de caminhamento (raio ' + fmt(rw) + ' cm): ' + fmt(pReal, 1) + ' cm.');
  }

  /* espelho */
  const bl = 2 * e + pReal;
  const mx = q => mirror ? [-q[0], q[1]] : q;
  if (mirror) {
    polys.forEach(pl => { pl.pts = pl.pts.map(mx); if (pl.entry) pl.entry = pl.entry.map(mx); });
    walk.forEach((w, i) => { walk[i] = w.map(mx); });
    arrival = arrival.map(mx);
    slab = slab.map(mx);
    startEdge = startEdge.map(mx);
  }
  const arrivalPts = hel ? arrival.pts : arrival;
  const slabPts = hel ? slab.pts : slab;

  const zc = Math.max(20, num(st.zCorte, 150));
  const kCut = Math.floor(zc / e + 1e-9);
  const person = hel ? [0, -helix.R - 30] : [(startEdge[0][0] + startEdge[1][0]) / 2, (startEdge[0][1] + startEdge[1][1]) / 2 - 45];
  /* distância acumulada na linha de caminhamento (corte desenvolvido) */
  let cum = 0;
  polys.forEach(pl => { pl.x0 = cum; cum += pl.wlen; pl.x1 = cum; });
  const Wtot = cum;

  /* vão mínimo na laje */
  const limite = H - st.espLaje - st.hLivre;
  const kc = limite < 0 ? 1 : Math.floor(limite / e + 1e-9) + 1;
  let opening = null;
  if (kc <= T) {
    if (hel) opening = { circle: helix.R, kc };
    else {
      const pts = [];
      polys.filter(pl => pl.k >= kc).forEach(pl => pl.pts.forEach(q => pts.push(q)));
      if (pts.length) { const bb = bboxOf(pts); opening = { bbox: bb, kc, w: bb[2] - bb[0], h: bb[3] - bb[1] }; }
    }
  }

  const allPts = [];
  polys.forEach(pl => pl.pts.forEach(q => allPts.push(q)));
  const bbox = bboxOf(allPts);
  const allPts2 = allPts.concat(arrivalPts);
  if (hel) { allPts2.push([-helix.R, -helix.R], [helix.R, helix.R]); }
  const bboxAll = bboxOf(allPts2);

  const nReto = polys.filter(q => q.kind === 'reto' || q.kind === 'helice').length;
  const nLeque = polys.filter(q => q.kind === 'leque').length;
  const nPat = polys.filter(q => q.kind === 'patamar').length;
  if (polys.length !== T) erro('Geometria inconsistente: ' + polys.length + ' superfícies para ' + N + ' espelhos. Avise quem fez o app.');
  const areaPoly = pts => { let s = 0; for (let i = 0; i < pts.length; i++) { const a2 = pts[i], b2 = pts[(i + 1) % pts.length]; s += a2[0] * b2[1] - b2[0] * a2[1]; } return Math.abs(s) / 2; };
  const areaOcup = hel ? PI * helix.R * helix.R : polys.reduce((s, q) => s + areaPoly(q.pts), 0);
  const contagem = [nReto + (hel ? ' degraus' : ' pisos comuns'), nLeque ? nLeque + ' leques' : '', nPat ? nPat + ' patamar' + (nPat > 1 ? 'es' : '') : ''].filter(Boolean).join(' + ');
  /* ---- verificações ---- */
  const TOL = 1e-6; /* só erro de arredondamento do computador; não é tolerância de obra */
  const fora = (v, a, b2) => v < a - TOL || v > b2 + TOL;
  const trecho = hel ? '' : nLeque ? ' (trechos retos)' : '';
  const eOk = fora(e, nm.eMin, nm.eMax) ? 'bad' : 'ok';
  chk('e', 'Espelho (altura do degrau)', fmt(e, 2) + ' cm', nm.eMin + ' a ' + nm.eMax + ' cm', eOk, eOk === 'bad' ? (e > nm.eMax ? 'Não atende: espelho alto. Aumente o nº de espelhos.' : 'Não atende: espelho baixo. Diminua o nº de espelhos.') : '');
  const pOk = fora(pReal, nm.pMin, nm.pMax) ? 'bad' : 'ok';
  chk('p', (hel ? 'Piso na linha de caminhamento' : 'Piso (profundidade)') + trecho, fmt(pReal, 1) + ' cm', nm.pMin + ' a ' + nm.pMax + ' cm', pOk, pOk === 'bad' ? (pReal < nm.pMin ? 'Não atende: piso curto.' + (hel ? ' Aumente o diâmetro ou o espelho.' : '') : 'Não atende: piso longo.') : '');
  const bOk = fora(bl, nm.bMin, nm.bMax) ? 'bad' : 'ok';
  chk('blondel', 'Fórmula de Blondel (2e + p)' + trecho, fmt(bl, 1) + ' cm', nm.bMin + ' a ' + nm.bMax + ' cm', bOk, bOk === 'bad' ? 'Não atende: ajuste espelho ou piso.' + (!temFaixa ? ' Com este espelho nenhum piso atende piso e Blondel ao mesmo tempo.' : '') : '');
  const Lval = L;
  const lOk = Lval < nm.Lmin - 1e-6 ? 'bad' : 'ok';
  chk('L', hel ? 'Largura útil (raio − pilar)' : 'Largura útil', fmt(Lval) + ' cm', 'mín. ' + nm.Lmin + ' cm', lOk, lOk !== 'ok' ? (hel ? 'Não atende: abaixo do mínimo do perfil. Alguns códigos de obras têm regra própria para caracol; se for o caso, use "Personalizada".' : 'Não atende: abaixo do mínimo do perfil.') : '');
  const maxRise = Math.max.apply(null, rises);
  chk('patamar', 'Desnível sem patamar', fmt(maxRise, 1) + ' cm', 'até ' + nm.hPat + ' cm', maxRise > nm.hPat + 1e-6 ? 'bad' : 'ok', maxRise > nm.hPat + 1e-6 ? 'Passou do máximo sem patamar: use um tipo com patamar.' : '');
  if (tipo === 'reta-patamar') {
    const mn = Math.max(L, nm.patReto || 0);
    chk('patprof', 'Comprimento do patamar (no sentido da escada)', fmt(Lp) + ' cm', 'mín. ' + fmt(mn) + ' cm' + (nm.patReto ? ' (perfil NBR)' : ' (= largura)'), Lp < mn - 1e-6 ? 'bad' : 'ok', Lp < mn - 1e-6 ? 'Não atende: patamar curto.' : '');
  }
  if (tipo === 'u-patamar') chk('patprof', 'Profundidade do patamar de retorno', fmt(Lp) + ' cm', 'mín. = largura (' + fmt(L) + ' cm)', Lp < L - 1e-6 ? 'bad' : 'ok', Lp < L - 1e-6 ? 'Não atende: na mudança de direção o patamar deve ter ao menos a largura da escada.' : '');
  if (tipo === 'l-patamar') chk('patprof', 'Patamar de canto', fmt(L) + ' × ' + fmt(L) + ' cm', 'lados = largura', 'ok', 'Quadrado com lado igual à largura, por construção.');
  if (nm.acess && (nLeque || hel)) chk('mudanca', 'Mudança de direção sem patamar', hel ? 'helicoidal' : nLeque + ' leques', 'patamar obrigatório', 'bad', 'Não atende ao perfil NBR 9050: a norma pede patamar nas mudanças de direção. Use um tipo com patamar.');
  if (tipo === 'l-leque' || tipo === 'u-leque') {
    const pL = dw * rad(90 / kw), bL = 2 * e + pL;
    chk('leque', 'Piso do leque na linha de caminhamento', fmt(pL, 1) + ' cm', nm.pMin + ' a ' + nm.pMax + ' cm', fora(pL, nm.pMin, nm.pMax) ? 'bad' : 'ok', fora(pL, nm.pMin, nm.pMax) ? (pL < nm.pMin ? 'Não atende: leque apertado. Aumente a largura ou use menos leques.' : 'Não atende: leque longo. Use mais leques por curva.') : '');
    chk('blondel-leque', 'Blondel nos leques', fmt(bL, 1) + ' cm', nm.bMin + ' a ' + nm.bMax + ' cm', fora(bL, nm.bMin, nm.bMax) ? 'bad' : 'ok', fora(bL, nm.bMin, nm.bMax) ? 'Não atende: o passo na curva fica diferente do passo nos trechos retos (' + fmt(bl, 1) + ' cm).' : '');
    chk('colo', 'Forma dos leques', 'ponta de 0 cm no canto', 'NBR 9077: balanceados, ponta ≥ 15 cm', 'warn', 'Os leques convergem num ponto do lado interno. A NBR 9077 (4.7.3.1 c) pede leques balanceados, com a parte mais estreita de pelo menos 15 cm. O app não faz balanceamento: trate a forma como estudo geométrico.');
  }
  if (hel) {
    chk('altura', 'Altura livre sob a volta de cima e a chegada', fmt(helix.clearance, 0) + ' cm', 'mín. ' + fmt(st.hLivre, 0) + ' cm', helix.clearance < st.hLivre - 1e-6 ? 'bad' : 'ok', 'Degraus por volta × espelho − espessura do degrau = ' + helix.nPer + ' × ' + fmt(e, 2) + ' − ' + fmt(thk) + '. A laje do piso de cima fica fora do furo, então não passa sobre os degraus.');
  }
  if (dw < nm.dw - 1e-9) chk('dw', 'Linha de caminhamento', fmt(dw) + ' cm do lado interno', fmt(nm.dw) + ' cm no perfil', 'warn', 'A escada é estreita: a linha foi posta no meio da largura, mais perto do lado interno que o perfil pede.');
  if (opening && !hel) chk('laje', 'Vão mínimo na laje superior', fmt(opening.w, 0) + ' × ' + fmt(opening.h, 0) + ' cm', 'altura livre ' + fmt(st.hLivre, 0) + ' cm', 'info', 'Cobre os degraus ' + kc + ' a ' + T + ' (a partir do degrau ' + kc + ' o teto ficaria baixo).');
  if (opening && hel) chk('laje', 'Furo mínimo na laje superior', 'Ø ' + fmt(helix.R * 2, 0) + ' cm', 'altura livre ' + fmt(st.hLivre, 0) + ' cm', 'info', 'Furo circular na laje, com a chegada no degrau ' + T + '.');
  if (!opening) chk('laje', 'Vão na laje superior', 'não precisa', '', 'info', 'A altura livre fica atendida sem abrir a laje.');

  /* ---- memória de cálculo ---- */
  const incl = deg(Math.atan(e / pReal));
  memo.push('Desnível a vencer (piso a piso): H = ' + fmt(H) + ' cm.');
  memo.push('Número de espelhos: N = ' + N + (st.nAuto ? ' (sugerido para ficar perto de 17,5 cm)' : ' (definido por você)') + '. Altura do espelho: e = H ÷ N = ' + fmt(H) + ' ÷ ' + N + ' = ' + fmt(e, 2) + ' cm.');
  if (!hel) memo.push('Piso (Blondel): p = ' + fmt(nm.bMid, 1) + ' − 2e = ' + fmt(nm.bMid, 1) + ' − ' + fmt(2 * e, 1) + ' = ' + fmt(nm.bMid - 2 * e, 1) + (st.pAuto ? ' → ' + fmt(p) + ' cm (arredondado e dentro de ' + nm.pMin + '–' + nm.pMax + ').' : '. Você definiu p = ' + fmt(p) + ' cm.'));
  else memo.push('Piso na linha de caminhamento (raio ' + fmt(helix.rw) + ' cm): p = r × ângulo = ' + fmt(helix.rw) + ' × ' + fmt(rad(helix.th), 3) + ' rad = ' + fmt(pReal, 1) + ' cm.');
  memo.push('Conferência de Blondel: 2e + p = ' + fmt(bl, 1) + ' cm (referência ' + nm.bMin + '–' + nm.bMax + ' cm).');
  memo.push('Superfícies entre espelhos: N − 1 = ' + T + ' (' + contagem + '). O último espelho chega ao piso superior, que não conta como degrau.');
  lancesTxt.forEach(t => memo.push(t));
  memo.push('Inclinação do lance: arctg(e ÷ p) = ' + fmt(incl, 1) + '° (' + fmt(e / pReal * 100, 0) + '%).');
  if (hel) memo.push('Em planta: círculo envolvente de Ø ' + fmt(helix.R * 2, 0) + ' cm (' + fmt(areaOcup / 10000, 2) + ' m²), dentro de um quadrado de ' + fmt(helix.R * 2, 0) + ' × ' + fmt(helix.R * 2, 0) + ' cm.');
  else memo.push('Em planta: retângulo envolvente de ' + fmt(bbox[2] - bbox[0], 0) + ' × ' + fmt(bbox[3] - bbox[1], 0) + ' cm; a escada ocupa ' + fmt(areaOcup / 10000, 2) + ' m² (soma das superfícies, sem o piso de chegada).');
  memo.push('Altura livre pedida: ' + fmt(st.hLivre, 0) + ' cm; laje superior com ' + fmt(st.espLaje, 0) + ' cm. ' + (opening ? 'A laje precisa de abertura a partir do degrau ' + kc + '.' : 'Não precisa abrir a laje.'));
  memo.push('Linha de caminhamento: ' + fmt(dw) + ' cm do lado interno' + (hel ? ' (raio ' + fmt(helix.rw) + ' cm a partir do centro)' : '') + '; percurso de ' + fmt(Wtot / 100, 2) + ' m.');

  return {
    st, nm, tipo, hel, H, N, e, T, p: pReal, pInput: p, pAlvo, bl, incl, L, Lp, g, kw, nMeio, dw, thk,
    a, b, avail, nSug, rises, polys, walk, arrival: hel ? arrival : { pts: arrivalPts }, slab: hel ? slab : { pts: slabPts },
    pole, helix, opening, kc, kCut, zc, person, lances: lancesTxt, nReto, nLeque, nPat, contagem, areaOcup, temFaixa, fP, bbox, bboxAll, startEdge, Wtot, checks, memo, mirror,
  };
}

if (typeof module !== 'undefined') module.exports = { calc, NORMAS, TIPOS, DEFAULTS, fmt, escolherN, faixaP };
