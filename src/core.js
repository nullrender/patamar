/* ===== NÚCLEO DE CÁLCULO E GEOMETRIA (cm, plano x leste / y norte) ===== */
const PI = Math.PI;
const rad = d => d * PI / 180;
const deg = r => r * 180 / PI;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const num = (v, d) => { v = Number(v); return isFinite(v) ? v : d; };
const fmt = (n, d) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: d === undefined ? 1 : d });

/* Perfis de limites (editáveis aqui). Conferidos no texto das normas em 16/11/2026:
   NBR 9050:2020, versão corrigida de 25/01/2021 (cópia publicada pela Prefeitura de São Paulo):
     6.8.2 espelho 16-18, piso 28-32, 63 <= p+2e <= 65; 6.8.3 largura mínima 1,20 m em rota acessível;
     6.8.6 lances curvos: pisos conforme 6.8.2 a 0,55 m da borda interna, Figura 75 com ponta >= 0,15 m;
     6.8.7 patamar a cada 3,20 m e em toda mudança de direção; 6.8.8 patamar entre lances >= 1,20 m;
     6.9.3.2 corrimãos a 0,92 e 0,70 m, dos dois lados, prolongados 0,30 m nas pontas.
   NBR 9077:2001 (Emenda 1 + texto de 1993, cópia publicada pelo CNMP), usada como referência no perfil Estudo:
     4.7.3.1 b Blondel 63-64; 4.7.3.1 c leques balanceados, medidos na linha de percurso, ponta >= 15 cm;
     3.32 linha de percurso a 0,55 m (no eixo se a escada tem menos de 1,10 m); 4.7.3.2 lanço de 3 degraus no mínimo.
     A NBR 9077 ganhou edição nova em 16/07/2025, que NÃO foi lida: os itens acima são da edição de 2001.
   Estudo: piso 25, largura 80 e desnível 3,20 m sem patamar são valores usuais, sem norma nacional que os sustente. */
const NORMAS = {
  res:   { id: 'res',   nome: 'Estudo (valores usuais, sem norma específica)', curto: 'perfil de estudo', eMin: 16, eMax: 18, pMin: 25, pMax: 32, bMin: 63, bMax: 64, Lmin: 80,  hPat: 320, dw: 50, patReto: 0, lqMin: 15, lancoMin: 3, acess: false },
  acess: { id: 'acess', nome: 'NBR 9050: conferência dimensional parcial',      curto: 'NBR 9050 (parcial)', eMin: 16, eMax: 18, pMin: 28, pMax: 32, bMin: 63, bMax: 65, Lmin: 120, hPat: 320, dw: 55, patReto: 120, lqMin: 15, lancoMin: 3, acess: true },
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
  lado: 'dir', kLeque: 3, nMeio: 1, vao: 10, LpAuto: true, Lp: 100, leque: 'bal',
  D: 220, Dc: 20,
  hLivre: 210, espLaje: 12, tLaje: 10, espDegrau: 5,
  zCorte: 150, modoPlanta: 'inf', showDims: true, showNums: true, showPessoa: true,
  cEmin: 16, cEmax: 18, cPmin: 25, cPmax: 32, cBmin: 63, cBmax: 64, cLmin: 80, cHpat: 320, cDw: 50, cLq: 15,
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
    nm = { id: 'custom', nome: 'Personalizada (limites digitados)', curto: 'perfil personalizado', eMin: Number(st.cEmin), eMax: Number(st.cEmax), pMin: Number(st.cPmin), pMax: Number(st.cPmax), bMin: Number(st.cBmin), bMax: Number(st.cBmax), Lmin: Number(st.cLmin), hPat: Number(st.cHpat), dw: Number(st.cDw), lqMin: Number(st.cLq), patReto: 0, lancoMin: 3, acess: false };
    const nomes = { eMin: 'Espelho mínimo', eMax: 'Espelho máximo', pMin: 'Piso mínimo', pMax: 'Piso máximo', bMin: 'Blondel mínimo', bMax: 'Blondel máximo', Lmin: 'Largura mínima', hPat: 'Desnível máximo sem patamar', dw: 'Linha de caminhamento' };
    Object.keys(nomes).forEach(k => { if (!isFinite(nm[k]) || nm[k] <= 0) erro('Limite personalizado inválido: ' + nomes[k] + ' precisa ser um número maior que zero.'); });
    if (!isFinite(nm.lqMin) || nm.lqMin < 0) erro('Limite personalizado inválido: Ponta mínima do leque precisa ser um número igual ou maior que zero.');
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
  const bal = st.leque !== 'conv';
  const A90 = dw * PI / 2; /* comprimento da linha de caminhamento numa curva de 90° */
  let kw = clamp(Math.round(num(st.kLeque, 3)), 2, 6);
  /* balanceado: as kw arestas da curva, a cada p, precisam cobrir o arco da curva (kw × p ≥ arco) */
  const kwMin = Math.max(2, Math.ceil(A90 / p - 1e-9));
  const kwSubiu = bal && (tipo === 'l-leque' || tipo === 'u-leque') && kw < kwMin;
  if (bal && kw < kwMin) kw = kwMin;
  let balInfo = null, gU = 0;
  const nMeio = clamp(Math.round(num(st.nMeio, 1)), 0, 6);
  const g = Math.max(0, st.vao);
  const Lp = st.LpAuto ? Math.max(L, nm.patReto || 0) : st.Lp;

  let a = 0, b = 0, avail = 0, endF = null, endS = 0;
  let arrival = null, slab = null, pole = null, startEdge = null, rises = [], helix = null, lancesTxt = [];
  let pReal = p;

  const rectPts = (F, t0, t1, s0, s1) => [F.map(t0, s0), F.map(t1, s0), F.map(t1, s1), F.map(t0, s1)];
  const flight = (F, s0, m) => {
    const gid = ++grpN;
    for (let j = 0; j < m; j++) { const aa = s0 + j * p; add(rectPts(F, 0, L, aa, aa + p), 'reto', p, { grp: gid, entry: [F.map(0, aa), F.map(L, aa)], wIn: p, wOut: p }); }
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
      let wo = 0; for (let q = 2; q < pts.length; q++) wo += Math.hypot(pts[q][0] - pts[q - 1][0], pts[q][1] - pts[q - 1][1]);
      add(pts, 'leque', dw * rad(db - da), { entry: [piv, bpt(da)], wIn: 0, wOut: wo });
    }
    arcWalk(F, s0);
  };
  const turn = (F, s0) => { const o = F.map(L, s0 + L); return mkF(o[0], o[1], F.rx, F.ry); };
  const split = av => {
    av = Math.max(0, av);
    const aa = st.n1Auto ? Math.ceil(av / 2) : clamp(Math.round(num(st.n1, 1)), 0, av);
    return [aa, av - aa];
  };

  /* ---- leques BALANCEADOS ----
     Ideia (NBR 9077:2001, 3.32 e 4.7.9.1 b): na linha de percurso todos os degraus têm o MESMO piso p, inclusive na curva.
     Cada aresta de degrau (bocel) é uma reta que passa por um ponto da linha de percurso (a cada p) e por um ponto da
     borda interna. Nos leques convergentes, todas as arestas da curva passam pelo canto interno (ponta 0). No balanceamento,
     os pontos na borda interna são redistribuídos por alguns degraus antes e depois da curva: as larguras na borda interna
     crescem em progressão aritmética do canto para fora, até voltarem a p nos degraus retos. Assim a ponta mais estreita
     fica com pelo menos lqMin (15 cm nos perfis), e os degraus perto da curva "giram" aos poucos.
     retas: comprimentos dos trechos retos na linha de percurso (2 trechos = 1 curva; 3 trechos = 2 curvas). */
  const balanceado = (retas, kTurn, aDeg) => {
    const A = dw * PI / 2, segs = [], turns = [], walkPts = [];
    const inn = [], out = []; /* vértices das bordas com o comprimento acumulado */
    let F = F1, u = 0, v = 0, w = 0;
    inn.push({ q: F.map(L, 0), d: 0 }); out.push({ q: F.map(0, 0), d: 0 });
    retas.forEach((len, j) => {
      segs.push({ F, u0: u, v0: v, len, j });
      walkPts.push([F.map(L - dw, 0), F.map(L - dw, len)]);
      u += len; v += len; w += len;
      inn.push({ q: F.map(L, len), d: v, piv: j < retas.length - 1 }); out.push({ q: F.map(0, len), d: w });
      if (j < retas.length - 1) {
        turns.push({ F, s0: len, uA: u, v });
        const arc = []; for (let i = 0; i <= 24; i++) { const ph = i / 24 * PI / 2; arc.push(F.map(L - dw * Math.cos(ph), len + dw * Math.sin(ph))); }
        walkPts.push(arc);
        w += L; out.push({ q: F.map(0, len + L), d: w, canto: true });
        F = turn(F, len);
        w += L; out.push({ q: F.map(0, 0), d: w });
        u += A;
      }
    });
    const Utot = u;
    const ptW = uu => {
      for (const sg of segs) if (uu <= sg.u0 + sg.len + 1e-9) {
        if (uu >= sg.u0 - 1e-9) return sg.F.map(L - dw, uu - sg.u0);
        const t = turns[sg.j - 1], ph = (uu - t.uA) / dw; return t.F.map(L - dw * Math.cos(ph), t.s0 + dw * Math.sin(ph));
      }
      const sg = segs[segs.length - 1]; return sg.F.map(L - dw, uu - sg.u0);
    };
    const vDef = uu => { for (const sg of segs) if (uu <= sg.u0 + sg.len + 1e-9) return uu >= sg.u0 ? sg.v0 + (uu - sg.u0) : sg.v0; const sg = segs[segs.length - 1]; return sg.v0 + (uu - sg.u0); };
    const along = (path, d) => {
      for (let i = 1; i < path.length; i++) if (d <= path[i].d + 1e-9) { const a0 = path[i - 1], a1 = path[i], k = a1.d - a0.d < 1e-12 ? 0 : (d - a0.d) / (a1.d - a0.d); return [a0.q[0] + (a1.q[0] - a0.q[0]) * k, a0.q[1] + (a1.q[1] - a0.q[1]) * k]; }
      return path[path.length - 1].q.slice();
    };
    /* raio que sai do ponto I da borda interna, passa por P da linha de percurso e encontra a borda externa */
    const hitOuter = (I, P) => {
      const dx = P[0] - I[0], dy = P[1] - I[1];
      let best = null;
      for (let i = 1; i < out.length; i++) {
        const a = out[i - 1].q, b = out[i].q, ex = b[0] - a[0], ey = b[1] - a[1];
        const den = dx * ey - dy * ex; if (Math.abs(den) < 1e-12) continue;
        const t = ((a[0] - I[0]) * ey - (a[1] - I[1]) * ex) / den, s = ((a[0] - I[0]) * dy - (a[1] - I[1]) * dx) / den;
        if (t > 1 + 1e-9 && s >= -1e-9 && s <= 1 + 1e-9 && (!best || t < best.t)) best = { t, q: [I[0] + dx * t, I[1] + dy * t], d: out[i - 1].d + clamp(s, 0, 1) * (out[i].d - out[i - 1].d) };
      }
      return best;
    };
    /* a reta I→O não pode cruzar a borda interna (fora do próprio ponto I) */
    const cruzaInterna = (I, O) => {
      for (let i = 1; i < inn.length; i++) {
        const a = inn[i - 1].q, b = inn[i].q;
        const d1x = O[0] - I[0], d1y = O[1] - I[1], ex = b[0] - a[0], ey = b[1] - a[1], den = d1x * ey - d1y * ex;
        if (Math.abs(den) < 1e-12) continue;
        const t = ((a[0] - I[0]) * ey - (a[1] - I[1]) * ex) / den, s = ((a[0] - I[0]) * d1y - (a[1] - I[1]) * d1x) / den;
        if (t > 1e-6 && t < 1 - 1e-9 && s > 1e-6 && s < 1 - 1e-6) return true;
      }
      return false;
    };
    const nos = []; for (let i = 0; i <= T; i++) nos.push(Math.min(i * p, Utot));
    /* zonas de balanceamento: kTurn degraus na curva, mais m de cada lado */
    const base = turns.map(t => ({ k0: Math.round((t.uA - (kTurn * p - A) / 2) / p), c: (t.uA + A / 2) / p - 0.5 }));
    const tenta = m => {
      const vs = nos.map(vDef);
      let zonas = base.map(b => ({ k0: Math.max(0, b.k0 - m), k1: Math.min(T - 1, b.k0 + kTurn - 1 + m), cs: [b.c] }));
      for (let i = 1; i < zonas.length; i++) if (zonas[i].k0 <= zonas[i - 1].k1 + 1) { zonas[i - 1].k1 = Math.max(zonas[i - 1].k1, zonas[i].k1); zonas[i - 1].cs = zonas[i - 1].cs.concat(zonas[i].cs); zonas.splice(i, 1); i--; }
      let minW = Infinity;
      for (const z of zonas) {
        const K = z.k1 - z.k0 + 1, Vt = vs[z.k1 + 1] - vs[z.k0];
        const dd = []; for (let k = z.k0; k <= z.k1; k++) dd.push(Math.min.apply(null, z.cs.map(c => Math.abs(k - c))));
        const D = Math.max(dd[0], dd[K - 1]), sd = dd.reduce((s, x) => s + x, 0);
        if (K * D - sd < 1e-9) return null;
        const B = (K * p - Vt) / (K * D - sd), A0 = p - B * D;
        let acc = vs[z.k0];
        for (let k = z.k0; k <= z.k1; k++) { const wk = A0 + B * dd[k - z.k0]; minW = Math.min(minW, wk); acc += wk; if (k < z.k1) vs[k + 1] = acc; }
      }
      if (!(minW > -1e-9)) return null;
      const lin = [];
      for (let i = 0; i <= T; i++) {
        const I = along(inn, vs[i]), P = ptW(nos[i]), O = hitOuter(I, P);
        if (!O || cruzaInterna(I, O.q)) return null;
        if (i && O.d <= lin[i - 1].w + 1e-6) return null;
        lin.push({ I, P, O: O.q, v: vs[i], w: O.d });
      }
      return { m, zonas, minW, lin, vs };
    };
    let sol = null, melhor = null;
    for (let m = 0; m <= T; m++) {
      const r = tenta(m);
      if (r && (!melhor || r.minW > melhor.minW + 1e-9)) melhor = r;
      if (r && r.minW >= nm.lqMin - 1e-6) { sol = r; break; }
      if (base.every(b => b.k0 - m <= 0 && b.k0 + kTurn - 1 + m >= T - 1)) break;
    }
    sol = sol || melhor;
    if (!sol) return null;
    /* polígonos dos degraus */
    const sub = (path, d0, d1, p0, p1) => { const r = [p0]; path.forEach(x => { if (x.d > d0 + 1e-9 && x.d < d1 - 1e-9) r.push(x.q); }); if (d1 > d0 + 1e-9) r.push(p1); return r; };
    const grpOf = {};
    for (let k = 0; k < T; k++) {
      const A1 = sol.lin[k], B1 = sol.lin[k + 1];
      const wIn = B1.v - A1.v, sg = segs.find(s => nos[k] >= s.u0 - 1e-9 && nos[k + 1] <= s.u0 + s.len + 1e-9);
      const ret = sg && Math.abs(A1.v - vDef(nos[k])) < 1e-6 && Math.abs(B1.v - vDef(nos[k + 1])) < 1e-6 && Math.abs(wIn - p) < 1e-6;
      if (ret) {
        const g = grpOf[sg.j] || (grpOf[sg.j] = ++grpN);
        add(rectPts(sg.F, 0, L, nos[k] - sg.u0, nos[k + 1] - sg.u0), 'reto', p, { grp: g, entry: [sg.F.map(0, nos[k] - sg.u0), sg.F.map(L, nos[k] - sg.u0)], wIn: p, wOut: p });
        continue;
      }
      const ins = sub(inn, A1.v, B1.v, A1.I, B1.I), ous = sub(out, A1.w, B1.w, A1.O, B1.O);
      let pts = ins.concat(ous.slice().reverse());
      const iv = inn.findIndex(x => x.piv && x.d > A1.v + 1e-9 && x.d < B1.v - 1e-9);
      if (iv >= 0) { const j = pts.findIndex(q => q === inn[iv].q); if (j > 0) pts = pts.slice(j).concat(pts.slice(0, j)); }
      add(pts, 'leque', p, { entry: [A1.O, A1.I], wIn, wOut: B1.w - A1.w, bal: true });
    }
    walkPts.forEach(wp => walk.push(wp));
    return { F: F, endS: retas[retas.length - 1], sol, A, kTurn, x: (kTurn * p - A) / 2, aDeg };
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
        if (bal) {
          const x = (kw * p - A90) / 2;
          balInfo = balanceado([a * p + x, b * p + x], kw, a);
          if (!balInfo) erro('Não consegui balancear os leques com essas medidas. Tente outra largura, mais degraus na curva ou a forma convergente.');
          endF = balInfo.F; endS = balInfo.endS;
          lancesTxt.push('Curva de 90° com leques balanceados: todos os ' + T + ' degraus têm ' + fmt(p) + ' cm de piso na linha de caminhamento. ' + kw + ' arestas de degrau caem dentro da curva, e o balanceamento redistribui a borda interna por ' + balInfo.sol.m + ' degrau(s) antes e depois dela.');
          lancesTxt.push('1º trecho reto: ' + fmt(a * p + x, 1) + ' cm na linha de caminhamento; 2º trecho reto: ' + fmt(b * p + x, 1) + ' cm.');
        } else {
          let s = flight(F1, 0, a);
          winders(F1, s, kw);
          const F2 = turn(F1, s);
          flight(F2, 0, b);
          endF = F2; endS = b * p;
          lancesTxt.push('1º lance: ' + a + ' pisos retos; curva de 90° com ' + kw + ' degraus em leque convergentes (' + fmt(90 / kw, 1) + '° cada); 2º lance: ' + b + ' pisos retos.');
        }
        rises = [H];
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
        if (bal) {
          const x = (kw * p - A90) / 2;
          balInfo = balanceado([a * p + x, nMeio * p + 2 * x, b * p + x], kw, a);
          if (!balInfo) erro('Não consegui balancear os leques com essas medidas. Tente outra largura, mais pisos no meio, mais degraus na curva ou a forma convergente.');
          endF = balInfo.F; endS = balInfo.endS;
          gU = nMeio * p + 2 * x;
          lancesTxt.push('Retorno de 180° com duas curvas de leques balanceados: todos os ' + T + ' degraus têm ' + fmt(p) + ' cm de piso na linha de caminhamento, ' + kw + ' arestas em cada curva e ' + nMeio + ' piso(s) no trecho do meio.');
          lancesTxt.push('Vão central entre os lances: ' + fmt(gU, 1) + ' cm (o trecho reto do meio, medido na borda interna).');
        } else {
          let s = flight(F1, 0, a);
          winders(F1, s, kw);
          const F2 = turn(F1, s);
          flight(F2, 0, nMeio);
          winders(F2, nMeio * p, kw);
          const F3 = turn(F2, nMeio * p);
          flight(F3, 0, b);
          endF = F3; endS = b * p;
          gU = nMeio * p;
          lancesTxt.push('1º lance: ' + a + ' pisos; 1ª curva com ' + kw + ' leques convergentes; trecho do meio com ' + nMeio + ' piso(s); 2ª curva com ' + kw + ' leques; último lance: ' + b + ' pisos.');
          lancesTxt.push('Vão central entre os lances: ' + fmt(gU) + ' cm.');
        }
        rises = [H];
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
  const contagem = [nReto + (hel ? ' degraus' : ' pisos comuns'), nLeque ? nLeque + (bal ? ' degraus balanceados' : ' leques') : '', nPat ? nPat + ' patamar' + (nPat > 1 ? 'es' : '') : ''].filter(Boolean).join(' + ');
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
  /* lanço mínimo: degraus seguidos entre pisos ou patamares (NBR 9077:2001 3.30 e 4.7.3.2; NBR 9050:2020 6.7.2 e 6.8.1) */
  const lancos = rises.map(r => Math.round(r / e));
  const lMin = Math.min.apply(null, lancos);
  chk('lanco', 'Espelhos por lance', lancos.join(' + '), 'mín. ' + nm.lancoMin + ' por lance', lMin < nm.lancoMin ? 'bad' : 'ok', lMin < nm.lancoMin ? 'Não atende: lance com ' + lMin + ' espelho(s). Até dois degraus seguidos contam como degrau isolado, que tropeça mais (NBR 9050:2020, 6.7.2); a NBR 9077:2001 (4.7.3.2) pede lance de três degraus no mínimo. Mude a divisão dos lances em "Pisos no 1º lance".' : '');
  if (tipo === 'reta-patamar') {
    const mn = Math.max(L, nm.patReto || 0);
    chk('patprof', 'Comprimento do patamar (no sentido da escada)', fmt(Lp) + ' cm', 'mín. ' + fmt(mn) + ' cm' + (nm.patReto ? ' (perfil NBR)' : ' (= largura)'), Lp < mn - 1e-6 ? 'bad' : 'ok', Lp < mn - 1e-6 ? 'Não atende: patamar curto.' : '');
    const bb2 = 2 * e + p;
    chk('patform', 'Fórmula do patamar (NBR 9077:2001, 4.7.3.3)', 'n = 1: ' + fmt(bb2 + p, 0) + ' · n = 2: ' + fmt(2 * bb2 + p, 0) + ' · n = 3: ' + fmt(3 * bb2 + p, 0) + ' cm', '(2e + p) × n + p', 'info', 'Comprimento do patamar reto para dar n passos inteiros nele sem quebrar o ritmo. Seu patamar tem ' + fmt(Lp) + ' cm.' + (nm.acess ? ' O perfil NBR 9050 exige pelo menos 120 cm.' : ''));
  }
  if (tipo === 'u-patamar') chk('patprof', 'Profundidade do patamar de retorno', fmt(Lp) + ' cm', 'mín. = largura (' + fmt(L) + ' cm)', Lp < L - 1e-6 ? 'bad' : 'ok', Lp < L - 1e-6 ? 'Não atende: na mudança de direção o patamar deve ter ao menos a largura da escada.' : '');
  if (tipo === 'l-patamar') chk('patprof', 'Patamar de canto', fmt(L) + ' × ' + fmt(L) + ' cm', 'lados = largura', 'ok', 'Quadrado com lado igual à largura, por construção.');
  if (nm.acess && (nLeque || hel)) chk('mudanca', 'Mudança de direção sem patamar', hel ? 'helicoidal' : nLeque + ' leques', 'patamar obrigatório', 'bad', 'Não atende ao perfil NBR 9050: a norma pede patamar nas mudanças de direção. Use um tipo com patamar.');
  if (tipo === 'l-leque' || tipo === 'u-leque') {
    const lqs = polys.filter(q => q.kind === 'leque');
    const ponta = Math.min.apply(null, lqs.map(q => q.wIn));
    if (bal) {
      chk('leque', 'Piso dos leques na linha de caminhamento', fmt(p, 1) + ' cm', 'igual ao dos degraus retos', 'ok', 'No balanceamento todos os degraus têm o mesmo piso na linha de caminhamento (NBR 9077:2001, 3.32 e 4.7.9.1 b), então o Blondel da curva é o mesmo dos trechos retos.');
      const pOk = ponta < nm.lqMin - TOL ? 'bad' : 'ok';
      const refLq = nm.id === 'custom' ? ' Limite digitado por você (a NBR 9077:2001, 4.7.3.1 c, usa 15 cm).' : ' Referência: NBR 9077:2001, 4.7.3.1 c' + (nm.acess ? ', e NBR 9050:2020, 6.8.6 (Figura 75)' : '') + '.';
      chk('ponta', 'Parte mais estreita dos leques (borda interna)', fmt(ponta, 1) + ' cm', 'mín. ' + fmt(nm.lqMin) + ' cm', pOk, (pOk === 'bad' ? 'Não atende: mesmo balanceando ' + lqs.length + ' degraus, a ponta não chega ao mínimo. Aumente a largura, ponha mais pisos retos ' + (tipo === 'u-leque' ? 'no meio ou ' : '') + 'nos lances, ou use patamar.' : 'Balanceamento em ' + lqs.length + ' degraus: a borda interna cresce aos poucos do canto para fora.') + refLq);
      if (kwSubiu) chk('kw', 'Arestas dentro da curva', kw + ' (você pediu ' + clamp(Math.round(num(st.kLeque, 3)), 2, 6) + ')', 'mín. ' + kwMin, 'info', 'Com piso de ' + fmt(p, 1) + ' cm, a curva da linha de caminhamento (' + fmt(A90, 1) + ' cm) precisa de pelo menos ' + kwMin + ' degraus para manter o piso constante. O app usou ' + kw + '.');
    } else {
      const pL = dw * rad(90 / kw), bL = 2 * e + pL;
      chk('leque', 'Piso do leque na linha de caminhamento', fmt(pL, 1) + ' cm', nm.pMin + ' a ' + nm.pMax + ' cm', fora(pL, nm.pMin, nm.pMax) ? 'bad' : 'ok', fora(pL, nm.pMin, nm.pMax) ? (pL < nm.pMin ? 'Não atende: leque apertado. Aumente a largura ou use menos leques.' : 'Não atende: leque longo. Use mais leques por curva.') : '');
      chk('blondel-leque', 'Blondel nos leques', fmt(bL, 1) + ' cm', nm.bMin + ' a ' + nm.bMax + ' cm', fora(bL, nm.bMin, nm.bMax) ? 'bad' : 'ok', fora(bL, nm.bMin, nm.bMax) ? 'Não atende: o passo na curva fica diferente do passo nos trechos retos (' + fmt(bl, 1) + ' cm).' : '');
      chk('ponta', 'Parte mais estreita dos leques (borda interna)', '0 cm (convergentes)', 'mín. ' + fmt(nm.lqMin) + ' cm', nm.lqMin > TOL ? 'bad' : 'ok', 'Na forma convergente todos os leques saem do mesmo canto, com ponta zero. A NBR 9077:2001 (4.7.3.1 c) pede leques balanceados, com a parte mais estreita de pelo menos 15 cm. Escolha "Balanceados" em Detalhes do tipo para corrigir.');
    }
  }
  if (hel) {
    chk('altura', 'Altura livre sob a volta de cima e a chegada', fmt(helix.clearance, 0) + ' cm', 'mín. ' + fmt(st.hLivre, 0) + ' cm', helix.clearance < st.hLivre - 1e-6 ? 'bad' : 'ok', 'Degraus por volta × espelho − espessura do degrau = ' + helix.nPer + ' × ' + fmt(e, 2) + ' − ' + fmt(thk) + '. A laje do piso de cima fica fora do furo, então não passa sobre os degraus.');
    const pPilar = helix.rc * rad(helix.th);
    chk('pilar', 'Piso junto ao pilar (parte mais estreita)', fmt(pPilar, 1) + ' cm', 'NBR 9077: ≥ ' + fmt(nm.lqMin) + ' cm em lanço curvo', 'warn', 'Na borda do pilar o degrau é bem mais curto que na linha de caminhamento. A NBR 9077:2001 (4.7.3.1 c) pede pelo menos 15 cm na parte mais estreita de lanços curvos, mas o app não sabe se a sua escada está no escopo dessa norma (saídas de emergência) ou se o código local aceita caracol com regra própria. Para aumentar: pilar mais grosso ou menos degraus por volta.');
  }
  if (dw < nm.dw - 1e-9) chk('dw', 'Linha de caminhamento', fmt(dw) + ' cm do lado interno', fmt(nm.dw) + ' cm no perfil', 'info', 'A escada é estreita: a linha passa no eixo (meio da largura). É a regra da NBR 9077:2001 (3.32, nota) para escadas com menos de 1,10 m.');
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
    bal, balInfo, kwMin, kwSubiu, gU,
    pole, helix, opening, kc, kCut, zc, person, lances: lancesTxt, nReto, nLeque, nPat, contagem, areaOcup, temFaixa, fP, bbox, bboxAll, startEdge, Wtot, checks, memo, mirror,
  };
}

if (typeof module !== 'undefined') module.exports = { calc, NORMAS, TIPOS, DEFAULTS, fmt, escolherN, faixaP };
