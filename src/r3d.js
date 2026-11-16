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

function buildFaces(R, C) {
  const faces = []; let id = 0;
  const col3 = { reto: hexRGB(C.t3), helice: hexRGB(C.t3), leque: hexRGB(C.w3), patamar: hexRGB(C.p3) };
  function prism(loop, tris, z0, z1, col) {
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
      faces.push({ id: cur, kind: 'side', n: [nx, ny], col, tris: [[[A[0], A[1], z0], [B[0], B[1], z0], [B[0], B[1], z1]], [[A[0], A[1], z0], [B[0], B[1], z1], [A[0], A[1], z1]]] });
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
  /* chegada da helicoidal: placa no nível do piso de cima, com a espessura do degrau */
  if (R.hel && R.arrival && R.arrival.arc) prism(R.arrival.pts, triOf({ arc: R.arrival.arc, pts: R.arrival.pts }), R.H - R.thk, R.H, col3.patamar || col3.reto);
  /* pilar */
  if (R.pole) { const ring = []; for (let i = 0; i < 28; i++) { const a = i / 28 * 2 * PI; ring.push([R.pole.r * Math.cos(a), R.pole.r * Math.sin(a)]); } prism(ring, fan(ring), 0, R.H - R.st.espLaje, [88, 98, 108]); }
  /* degraus */
  R.polys.forEach(pl => { const top = pl.k * R.e; prism(pl.pts, triOf(pl), Math.max(top - R.thk, 0), top, col3[pl.kind] || col3.reto); });
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
  faces.forEach(f => {
    let sh = 1;
    if (f.kind === 'side') { const nX = f.n[0] * cy - f.n[1] * sy, nY = f.n[0] * sy + f.n[1] * cy; sh = 0.56 + 0.4 * clamp(nX * toL[0] + nY * toL[1], 0, 1); }
    const r = f.col[0] * sh, g = f.col[1] * sh, b = f.col[2] * sh;
    f.tris.forEach(t => {
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
