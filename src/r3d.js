/* ===== VISTA 3D: z-buffer simples em canvas 2D ===== */
function hexRGB(h) {
  h = String(h).trim();
  if (h[0] === '#') { if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  const m = h.match(/(\d+)[ ,]+(\d+)[ ,]+(\d+)/); return m ? [+m[1], +m[2], +m[3]] : [128, 128, 128];
}

function triOf(pl) {
  const t = [];
  if (pl.arc) { const o = pl.arc.outer, i = pl.arc.inner; for (let s = 0; s < o.length - 1; s++) { t.push([o[s], o[s + 1], i[s + 1]]); t.push([o[s], i[s + 1], i[s]]); } return t; }
  const q = pl.pts; for (let i = 1; i < q.length - 1; i++) t.push([q[0], q[i], q[i + 1]]); return t;
}

/* ---- corrimãos (linhas de bocéis) ---- */
/* percorre o contorno do degrau a partir de 'ini' (ponta da aresta de entrada), no sentido oposto a 'outra' (a outra ponta),
   até chegar a uma das pontas da aresta de saída. Devolve a cadeia de pontos e qual ponta da saída foi alcançada. */
function cadeiaLado(pts0, ini, outra, saida) {
  const d2 = (a, b) => (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]);
  const perto = (a, b) => d2(a, b) < 0.25;
  const fim = q => saida.findIndex(s => perto(q, s));
  if (fim(ini) >= 0) return { ch: [ini], j: fim(ini) };
  /* contorno com as pontas da entrada e da saída inseridas nas arestas em que caem */
  const marcas = [ini, outra, saida[0], saida[1]], pts = [];
  for (let i = 0; i < pts0.length; i++) {
    const A = pts0[i], B = pts0[(i + 1) % pts0.length], dx = B[0] - A[0], dy = B[1] - A[1], l2 = dx * dx + dy * dy;
    pts.push(A);
    if (l2 < 1e-9) continue;
    const ins = [];
    marcas.forEach(m => {
      const t = ((m[0] - A[0]) * dx + (m[1] - A[1]) * dy) / l2;
      if (t <= 1e-6 || t >= 1 - 1e-6) return;
      const f = [A[0] + t * dx, A[1] + t * dy];
      if (d2(f, m) < 0.25) ins.push([t, m]);
    });
    ins.sort((a, b) => a[0] - b[0]).forEach(x => pts.push(x[1]));
  }
  const n = pts.length;
  let i0 = 0; for (let i = 1; i < n; i++) if (d2(pts[i], ini) < d2(pts[i0], ini)) i0 = i;
  /* sentido: para longe da outra ponta da entrada */
  const nx = pts[(i0 + 1) % n], pv = pts[(i0 - 1 + n) % n];
  const passo = d2(nx, outra) < d2(pv, outra) ? -1 : 1;
  const ch = [ini];
  for (let s = 1; s < n; s++) {
    const q = pts[(i0 + passo * s + 2 * n) % n], j = fim(q);
    if (j >= 0) return { ch, j };
    if (!perto(q, ch[ch.length - 1])) ch.push(q);
  }
  /* não achou (não deve acontecer): liga direto à ponta mais próxima da saída */
  return { ch, j: d2(saida[0], ini) <= d2(saida[1], ini) ? 0 : 1 };
}

/* pontos 3D do corrimão de um lado (lado 0 = começa em entry[0] do 1º degrau), na altura hR acima dos bocéis.
   Mesma regra do perfil (sectionSVG): o bocel do degrau k fica na cota k·e, na aresta de entrada;
   no patamar o corrimão segue horizontal até um piso antes da saída e então sobe até o bocel seguinte. */
function railLado(R, lado, hR) {
  const P = R.polys, out = [];
  let cur = P[0].entry[lado];
  P.forEach((pl, i) => {
    const ent = pl.entry;
    const iniIdx = Math.hypot(ent[0][0] - cur[0], ent[0][1] - cur[1]) <= Math.hypot(ent[1][0] - cur[0], ent[1][1] - cur[1]) ? 0 : 1;
    const saida = i + 1 < P.length ? P[i + 1].entry : R.arrival.pts.slice(0, 2);
    const { ch, j } = cadeiaLado(pl.pts, ent[iniIdx], ent[1 - iniIdx], saida);
    const pts = ch.concat([saida[j]]);
    const z0 = pl.top, z1 = (pl.k + 1) * R.e;
    const cum = [0]; for (let s = 1; s < pts.length; s++) cum.push(cum[s - 1] + Math.hypot(pts[s][0] - pts[s - 1][0], pts[s][1] - pts[s - 1][1]));
    const Lt = cum[cum.length - 1];
    if (pl.kind === 'patamar') {
      const xs = Math.max(0, Lt - R.pInput); /* começo da subida */
      for (let s = 0; s < pts.length - 1; s++) {
        out.push([pts[s][0], pts[s][1], z0 + hR]);
        if (cum[s] < xs - 1e-6 && cum[s + 1] > xs + 1e-6) { const t = (xs - cum[s]) / (cum[s + 1] - cum[s]); out.push([pts[s][0] + t * (pts[s + 1][0] - pts[s][0]), pts[s][1] + t * (pts[s + 1][1] - pts[s][1]), z0 + hR]); }
      }
    } else {
      for (let s = 0; s < pts.length - 1; s++) out.push([pts[s][0], pts[s][1], z0 + (Lt > 1e-9 ? (z1 - z0) * cum[s] / Lt : 0) + hR]);
    }
    cur = saida[j];
  });
  out.push([cur[0], cur[1], R.H + hR]);
  /* pontos repetidos na planta (canto interno de patamar em L, centro de leques convergentes) viram um só, na cota MAIS ALTA:
     assim o corrimão nunca fica abaixo da altura pedida sobre o degrau seguinte (sobre o patamar, fica um pouco acima) */
  const lim = [];
  for (let i = 0; i < out.length;) {
    let j = i, zs = 0;
    while (j < out.length && Math.hypot(out[j][0] - out[i][0], out[j][1] - out[i][1]) < 0.5) { zs += out[j][2]; j++; }
    let zmax = -Infinity; for (let k = i; k < j; k++) zmax = Math.max(zmax, out[k][2]);
    lim.push([out[i][0], out[i][1], i === 0 ? out[i][2] : zmax]);
    i = j;
  }
  return lim;
}

/* corrimão da helicoidal: do lado de fora (raio R − off), 92 cm acima da borda externa de cada degrau; montantes a cada 4 degraus.
   Usado pelo 3D e pela elevação/cortes. */
/* interno = true: corrimão do lado do olho (caracol autoportante), 'off' cm para fora da borda do olho */
function railHel(R, off, interno) {
  const r0 = interno ? R.helix.rc : R.helix.R, rr = interno ? r0 + off : r0 - off, sc = rr / r0, pts = [], postes = [];
  const borda = a => interno ? a.inner : a.outer;
  const ponto = (q, z) => [q[0] * sc, q[1] * sc, z];
  R.polys.forEach((pl, i) => {
    const o = borda(pl.arc), z0 = pl.top, z1 = (pl.k + 1) * R.e, m = o.length - 1;
    [0, m >> 1].forEach(s => pts.push(ponto(o[s], z0 + (z1 - z0) * s / m + 92)));
    if (i % 4 === 0) postes.push([o[0][0] * sc, o[0][1] * sc, z0, z0 + 92]);
  });
  const ch = R.arrival && R.arrival.arc ? borda(R.arrival.arc)[0] : borda(R.polys[R.polys.length - 1].arc).slice(-1)[0];
  pts.push(ponto(ch, R.H + 92));
  postes.push([ch[0] * sc, ch[1] * sc, R.H, R.H + 92]);
  return { pts, postes };
}

/* desloca a poligonal 'off' cm para dentro da escada (lado do centro 'cen' de cada trecho), mantendo z */
function afastaDentro(R, pts, off) {
  const segN = [];
  for (let s = 0; s < pts.length - 1; s++) {
    const A = pts[s], B = pts[s + 1], dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy);
    if (l < 1e-6) { segN.push(null); continue; }
    let nx = -dy / l, ny = dx / l;
    /* o lado de dentro é o do degrau mais próximo do meio do trecho */
    const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    let best = null, bd = Infinity;
    R.polys.forEach(pl => { const c = centroid(pl.pts), d = Math.hypot(c[0] - M[0], c[1] - M[1]); if (d < bd) { bd = d; best = c; } });
    if (best && nx * (best[0] - M[0]) + ny * (best[1] - M[1]) < 0) { nx = -nx; ny = -ny; }
    segN.push([nx, ny]);
  }
  const achar = (s, d) => { for (let i = s; i >= 0 && i < segN.length; i += d) if (segN[i]) return segN[i]; return null; };
  return pts.map((q, i) => {
    const a = achar(i - 1, -1), b = achar(i, 1), n1 = a || b, n2 = b || a;
    if (!n1) return q.slice();
    const dt = 1 + n1[0] * n2[0] + n1[1] * n2[1];
    const m = dt < 0.3 ? [(n1[0] + n2[0]) / 2, (n1[1] + n2[1]) / 2] : [(n1[0] + n2[0]) / dt, (n1[1] + n2[1]) / dt];
    return [q[0] + m[0] * off, q[1] + m[1] * off, q[2]];
  });
}

/* prisma fino de seção quadrada (lado w) de P a Q, em 3D; cada triângulo leva sua normal (tn) para o sombreamento */
function tubo(P, Q, w, tris, tn) {
  let dx = Q[0] - P[0], dy = Q[1] - P[1], dz = Q[2] - P[2]; const l = Math.hypot(dx, dy, dz);
  if (l < 1e-6) return;
  dx /= l; dy /= l; dz /= l;
  /* estende um pouco cada ponta para fechar as juntas entre trechos */
  const ex = w * 0.5, A = [P[0] - dx * ex, P[1] - dy * ex, P[2] - dz * ex], B = [Q[0] + dx * ex, Q[1] + dy * ex, Q[2] + dz * ex];
  const hl = Math.hypot(dx, dy);
  const h = hl > 1e-6 ? [-dy / hl, dx / hl, 0] : [1, 0, 0];
  const u = [dy * h[2] - dz * h[1], dz * h[0] - dx * h[2], dx * h[1] - dy * h[0]];
  const c = (Pt, a, b) => [Pt[0] + (h[0] * a + u[0] * b) * w / 2, Pt[1] + (h[1] * a + u[1] * b) * w / 2, Pt[2] + (h[2] * a + u[2] * b) * w / 2];
  const cs = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  for (let i = 0; i < 4; i++) {
    const a = cs[i], b = cs[(i + 1) % 4];
    const a0 = c(A, a[0], a[1]), b0 = c(A, b[0], b[1]), a1 = c(B, a[0], a[1]), b1 = c(B, b[0], b[1]);
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = [h[0] * m[0] + u[0] * m[1], h[1] * m[0] + u[1] * m[1], h[2] * m[0] + u[2] * m[1]];
    tris.push([a0, b0, b1], [a0, b1, a1]); tn.push(n, n);
  }
}

function buildFaces(R, C) {
  const faces = []; let id = 0;
  const col3 = { reto: hexRGB(C.t3), helice: hexRGB(C.t3), leque: hexRGB(C.w3), patamar: hexRGB(C.p3) };
  /* z0 pode ser um número (fundo plano) ou uma função do ponto da planta (fundo que segue o intradorso) */
  function prism(loop, tris, z0, z1, col) {
    const zb = typeof z0 === 'function' ? q => Math.min(z0(q), z1) : () => z0;
    faces.push({ id: id++, kind: 'top', col, tris: tris.map(t => t.map(v => [v[0], v[1], z1])) });
    const cen = centroid(loop), n = loop.length; let prev = null, cur = -1;
    for (let i = 0; i < n; i++) {
      const A = loop[i], B = loop[(i + 1) % n];
      const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy);
      if (len < 1e-6) continue;
      let nx = dy / len, ny = -dx / len;
      if (nx * ((A[0] + B[0]) / 2 - cen[0]) + ny * ((A[1] + B[1]) / 2 - cen[1]) < 0) { nx = -nx; ny = -ny; }
      if (!(prev && prev[0] * nx + prev[1] * ny > 0.966)) cur = id++;
      prev = [nx, ny];
      const zA = zb(A), zB = zb(B);
      faces.push({ id: cur, kind: 'side', n: [nx, ny], col, tris: [[[A[0], A[1], zA], [B[0], B[1], zB], [B[0], B[1], z1]], [[A[0], A[1], zA], [B[0], B[1], z1], [A[0], A[1], z1]]] });
    }
  }
  const fan = q => { const t = []; for (let i = 1; i < q.length - 1; i++) t.push([q[0], q[i], q[i + 1]]); return t; };
  /* chão */
  const all = []; R.polys.forEach(pl => pl.pts.forEach(q => all.push(q))); R.slab.pts.forEach(q => all.push(q));
  const gb = bboxOf(all), pad = 35;
  const g = [[gb[0] - pad, gb[1] - pad], [gb[2] + pad, gb[1] - pad], [gb[2] + pad, gb[3] + pad], [gb[0] - pad, gb[3] + pad]];
  prism(g, fan(g), -4, 0, hexRGB(C.ground));
  /* laje superior */
  const sl = R.slab;
  prism(sl.pts, sl.arc ? triOf({ arc: sl.arc, pts: sl.pts }) : fan(sl.pts), R.H - R.st.espLaje, R.H, hexRGB(C.f3));
  /* chegada da helicoidal: placa no nível do piso de cima; na laje maciça desce pelo menos um espelho, fechando a frente do último degrau */
  if (R.hel && R.arrival && R.arrival.arc) prism(R.arrival.pts, triOf({ arc: R.arrival.arc, pts: R.arrival.pts }), R.H - (R.placas ? R.st.espDegrau : Math.max(R.st.espLaje, R.st.tLaje, R.e)), R.H, col3.patamar || col3.reto);
  /* pilar */
  /* pilar (na caracol autoportante não há pilar: o centro é o olho, vazio) */
  if (R.pole) { const ring = []; for (let i = 0; i < 28; i++) { const a = i / 28 * 2 * PI; ring.push([R.pole.r * Math.cos(a), R.pole.r * Math.sin(a)]); } prism(ring, fan(ring), 0, R.H - R.st.espLaje, [88, 98, 108]); }
  /* dente da chegada: espelho do último degrau sob a laje do piso de cima (quando o espelho é maior que a laje) */
  if (R.dente) prism(R.dente.pts, fan(R.dente.pts), R.dente.z0, R.dente.z1, hexRGB(C.f3));
  /* degraus: o fundo segue a face inferior real (R.zBot): laje inclinada nos lances, horizontal nos patamares;
     na helicoidal, degraus soltos com a espessura do degrau */
  R.polys.forEach(pl => { const top = pl.k * R.e; prism(pl.pts, triOf(pl), R.zBot ? q => R.zBot(pl, q) : Math.max(top - R.thk, 0), top, col3[pl.kind] || col3.reto); });
  /* corrimãos: prismas finos de 5 × 5 cm sobre a linha dos bocéis, 4 cm para dentro da borda, com montante nas pontas */
  const ink = hexRGB(C.ink), pap = hexRGB(C.paper), colR = ink.map((v, i) => Math.round(v * 0.6 + pap[i] * 0.4));
  /* eixo do corrimão a 4 cm + meia seção da borda: a face fica a 4 cm livres da parede (NBR 9050:2020 4.6.5, que a NBR 9077:2025 manda seguir; era também a NBR 9077:2001 4.8.2.4, cancelada), como no detalhe */
  const W5 = 5, OFF = 4 + W5 / 2;
  const corrimao = (pts, postes) => {
    const tris = [], tn = [];
    for (let s = 0; s < pts.length - 1; s++) tubo(pts[s], pts[s + 1], W5, tris, tn);
    postes.forEach(pp => tubo([pp[0], pp[1], pp[2]], [pp[0], pp[1], pp[3]], W5 * 0.8, tris, tn));
    if (tris.length) faces.push({ id: id++, kind: 'tubo', col: colR, tris, tn });
  };
  if (R.polys.length && !R.hel) {
    const alturas = R.nm && R.nm.acess ? [92, 70] : [92], ext = R.nm && R.nm.acess ? 30 : 0;
    [0, 1].forEach(lado => {
      alturas.forEach(hR => {
        const pts = afastaDentro(R, railLado(R, lado, hR), OFF);
        /* NBR 9050:2020, 6.9.3.2 (mesma regra do perfil): prolonga 30 cm na horizontal antes do primeiro e depois do último degrau */
        let z0p = pts[0][2] - hR - R.e; /* piso de baixo */
        if (ext && pts.length > 1) {
          const um = (a, b) => { const dx = a[0] - b[0], dy = a[1] - b[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
          const a = pts[0], d0 = um(a, pts[1]), b = pts[pts.length - 1], d1 = um(b, pts[pts.length - 2]);
          pts.unshift([a[0] + d0[0] * ext, a[1] + d0[1] * ext, a[2]]);
          pts.push([b[0] + d1[0] * ext, b[1] + d1[1] * ext, b[2]]);
        } else z0p = pts[0][2] - hR;
        const ult = pts[pts.length - 1], pri = pts[0];
        /* montantes só no corrimão de 92 cm (o de 70 se apoia neles) */
        const postes = hR === alturas[0] ? [[pri[0], pri[1], Math.max(0, z0p), pri[2]], [ult[0], ult[1], ult[2] - hR, ult[2]]] : [];
        corrimao(pts, postes);
      });
    });
  } else if (R.polys.length && R.hel && R.helix) {
    const c = railHel(R, OFF);
    corrimao(c.pts, c.postes);
    /* caracol autoportante: o lado do olho é aberto e também leva corrimão */
    if (R.olho) { const ci = railHel(R, OFF, true); corrimao(ci.pts, ci.postes); }
  }
  return faces;
}

function render3D(cv, R, view, C) {
  const W = cv.width, Hh = cv.height, ctx = cv.getContext('2d');
  const faces = buildFaces(R, C);
  const yaw = rad(view.yaw), pit = rad(view.pitch);
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pit), sp = Math.sin(pit);
  const proj = v => { const X = v[0] * cy - v[1] * sy, Y = v[0] * sy + v[1] * cy, Z = v[2]; return [X, Z * cp + Y * sp, Y * cp - Z * sp]; };
  let x0 = Infinity, x1 = -Infinity, u0 = Infinity, u1 = -Infinity;
  faces.forEach(f => f.tris.forEach(t => t.forEach(v => { const q = proj(v); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); u0 = Math.min(u0, q[1]); u1 = Math.max(u1, q[1]); })));
  const mg = Math.min(W, Hh) * 0.06;
  const sc = Math.min((W - 2 * mg) / (x1 - x0), (Hh - 2 * mg) / (u1 - u0));
  const cx = (x0 + x1) / 2, cu = (u0 + u1) / 2;
  const P = v => { const q = proj(v); return { x: (q[0] - cx) * sc + W / 2, y: Hh / 2 - (q[1] - cu) * sc, z: q[2] }; };
  const bg = hexRGB(C.paper), ink = hexRGB(C.ink);
  const img = ctx.createImageData(W, Hh), d = img.data;
  const zb = new Float32Array(W * Hh).fill(1e30), ib = new Int32Array(W * Hh).fill(-1);
  for (let i = 0; i < W * Hh; i++) { d[i * 4] = bg[0]; d[i * 4 + 1] = bg[1]; d[i * 4 + 2] = bg[2]; d[i * 4 + 3] = 255; }
  const toL = [-0.5, -0.85];
  const luzLado = (nx, ny) => { const nX = nx * cy - ny * sy, nY = nx * sy + ny * cy; return 0.56 + 0.4 * clamp(nX * toL[0] + nY * toL[1], 0, 1); };
  faces.forEach(f => {
    let sh = 1;
    if (f.kind === 'side') sh = luzLado(f.n[0], f.n[1]);
    let r = f.col[0] * sh, g = f.col[1] * sh, b = f.col[2] * sh;
    f.tris.forEach((t, ti) => {
      if (f.tn) {
        /* sombreamento por triângulo (corrimãos): mistura de face de cima e face lateral conforme a normal */
        const n = f.tn[ti], hz = Math.hypot(n[0], n[1]), nz2 = n[2] * n[2];
        const sl = hz > 1e-6 ? luzLado(n[0] / hz, n[1] / hz) : 1;
        const s2 = n[2] >= 0 ? nz2 + (1 - nz2) * sl : (1 - nz2) * sl + nz2 * 0.45;
        r = f.col[0] * s2; g = f.col[1] * s2; b = f.col[2] * s2;
      }
      const A = P(t[0]), B = P(t[1]), Q = P(t[2]);
      const area = (B.x - A.x) * (Q.y - A.y) - (B.y - A.y) * (Q.x - A.x);
      if (Math.abs(area) < 1e-9) return;
      const inv = 1 / area;
      const minX = Math.max(0, Math.floor(Math.min(A.x, B.x, Q.x))), maxX = Math.min(W - 1, Math.ceil(Math.max(A.x, B.x, Q.x)));
      const minY = Math.max(0, Math.floor(Math.min(A.y, B.y, Q.y))), maxY = Math.min(Hh - 1, Math.ceil(Math.max(A.y, B.y, Q.y)));
      for (let y = minY; y <= maxY; y++) {
        const py = y + 0.5;
        for (let x = minX; x <= maxX; x++) {
          const px = x + 0.5;
          const w0 = ((B.x - px) * (Q.y - py) - (B.y - py) * (Q.x - px)) * inv;
          const w1 = ((Q.x - px) * (A.y - py) - (Q.y - py) * (A.x - px)) * inv;
          const w2 = 1 - w0 - w1;
          if (w0 < -1e-4 || w1 < -1e-4 || w2 < -1e-4) continue;
          const z = w0 * A.z + w1 * B.z + w2 * Q.z, i = y * W + x;
          if (z < zb[i] - 1e-3) { zb[i] = z; ib[i] = f.id; const k = i * 4; d[k] = r; d[k + 1] = g; d[k + 2] = b; }
        }
      }
    });
  });
  /* contornos entre faces diferentes */
  const ed = new Uint8Array(W * Hh);
  for (let y = 0; y < Hh - 1; y++) for (let x = 0; x < W - 1; x++) {
    const i = y * W + x, a = ib[i];
    if (a !== ib[i + 1]) { ed[i] = 1; ed[i + 1] = 1; }
    if (a !== ib[i + W]) { ed[i] = 1; ed[i + W] = 1; }
  }
  for (let i = 0; i < W * Hh; i++) if (ed[i] && ib[i] >= 0) { const k = i * 4; d[k] = d[k] * 0.35 + ink[0] * 0.65; d[k + 1] = d[k + 1] * 0.35 + ink[1] * 0.65; d[k + 2] = d[k + 2] * 0.35 + ink[2] * 0.65; }
  ctx.putImageData(img, 0, 0);
}
