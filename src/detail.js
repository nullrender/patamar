/* ===== DETALHE DO DEGRAU (ampliação) =====
   Desenho ampliado de três degraus típicos (retos) em corte, para mostrar ao professor.
   Unidades em cm, eixo y para cima (sLine/sText já invertem). Só usa as cores do tema (C).
   Valores de norma conferidos no texto:
   - borda do degrau (R.bocel: 'bocel', 'inclinado' ou 'sem'; avanço R.avanco): NBR 9077:2001, 4.7.3.1 e (mínimo 1,5)
     e NBR 9050:2020, 6.7.1 (máximo 1,5);
   - corrimão de seção circular com Ø de 38 a 65 mm: NBR 9077:2001, 4.8.2.3;
   - corrimão afastado no mínimo 40 mm da parede: NBR 9077:2001, 4.8.2.4.
   A altura do corrimão (92 cm, e 70 cm no perfil NBR 9050) é desenhada fora de escala, com a cota interrompida. */
let DTL = 0;

function detalheSVG(R, o, C) {
  o = o || {};
  const e = R.e, p = R.p, st = R.st, hel = !!R.hel, plc = !!R.placas; /* plc: degraus em balanço (placas soltas) */
  const modo = R.bocel || 'bocel', b = modo === 'sem' ? 0 : (R.avanco === undefined ? 1.5 : R.avanco); /* avanço da borda */
  const a = Math.atan2(e, p), ca = Math.cos(a), sa = Math.sin(a), tg = e / p;
  const u = [ca, sa], n = [-sa, ca];
  const add = (P, v, t) => [P[0] + v[0] * t, P[1] + v[1] * t];
  const f2 = v => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const tl = plc ? 0 : Math.max(0, st.tLaje);
  const tD = plc ? st.espDegrau : 0;
  const span = Math.max(3.6 * p + 30, 4 * e + 50);
  const fs = clamp(span / 42, 2, 4.5);
  const id = 'dtl' + (++DTL);
  const halo = t => t.replace('<text ', '<text stroke="' + C.paper + '" stroke-width="' + r2(fs * 0.28) + '" stroke-linejoin="round" paint-order="stroke" ');
  /* caixa envolvente: cada elemento informa os pontos que ocupa */
  const bb = [Infinity, Infinity, -Infinity, -Infinity];
  const B = (x, y) => { bb[0] = Math.min(bb[0], x); bb[1] = Math.min(bb[1], y); bb[2] = Math.max(bb[2], x); bb[3] = Math.max(bb[3], y); };
  const tW = (txt, size) => String(txt).length * size * 0.6;
  const zn = x => e + x * tg; /* linha dos bocéis: passa pela ponta de cada bocel */
  let s = '';

  /* concreto: pontos e pequenos triângulos (em cm, no espaço do desenho) */
  const defs = '<defs><pattern id="' + id + '" width="9" height="9" patternUnits="userSpaceOnUse">' +
    [[1.2, 1.5], [5.6, 3.1], [3.2, 6.4], [7.6, 7.7], [0.6, 5.0]].map(q => '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="0.28" fill="' + C.muted + '"/>').join('') +
    '<polygon points="3.4,1.2 4.6,1.6 3.7,2.6" fill="none" stroke="' + C.muted + '" stroke-width="0.16"/>' +
    '<polygon points="6.6,5.0 7.8,5.6 6.7,6.2" fill="none" stroke="' + C.muted + '" stroke-width="0.16"/>' +
    '<polygon points="1.0,7.6 2.1,7.1 1.9,8.3" fill="none" stroke="' + C.muted + '" stroke-width="0.16"/>' +
    '</pattern></defs>';

  /* cota vertical própria: linha, traços oblíquos, texto ao lado; brk = fração onde a linha é interrompida */
  const vDim = (x, z0, z1, label, side, brk, x0a, x1a) => {
    let d = '';
    const ext = fs * 0.5, gap = fs * 0.3;
    if (x0a !== undefined) d += sLine([x0a + Math.sign(x - x0a) * gap, z0], [x + Math.sign(x - x0a) * ext, z0], C.muted, 0.9);
    if (x1a !== undefined) d += sLine([x1a + Math.sign(x - x1a) * gap, z1], [x + Math.sign(x - x1a) * ext, z1], C.muted, 0.9);
    const tk = fs * 0.4;
    if (brk) {
      const zb = z0 + (z1 - z0) * brk, g = fs * 0.7;
      d += sLine([x, z0], [x, zb - g / 2], C.ink, 1) + sLine([x, zb + g / 2], [x, z1], C.ink, 1);
      /* símbolo de interrupção: duas barras inclinadas */
      [-g / 2, g / 2].forEach(dz => { d += sLine([x - fs * 0.6, zb + dz - fs * 0.3], [x + fs * 0.6, zb + dz + fs * 0.3], C.ink, 1.3); });
    } else d += sLine([x, z0], [x, z1], C.ink, 1);
    [z0, z1].forEach(z => { d += sLine([x - tk, z - tk], [x + tk, z + tk], C.ink, 1.3); });
    const tx = x + side * fs * 0.95, tz = brk ? z0 + (z1 - z0) * brk * 0.5 : (z0 + z1) / 2; /* com interrupção, o texto fica no trecho de baixo */
    d += halo(sText(tx, tz, label, fs * 0.9, C.ink, 'middle', -90, 500));
    B(tx - fs, tz); B(tx + fs, tz); B(x, z0); B(x, z1);
    return d;
  };
  /* cota horizontal própria */
  const hDim = (x0, x1, z, label, za0, za1, txtSide) => {
    let d = '';
    const ext = fs * 0.5, gap = fs * 0.3, tk = fs * 0.4;
    if (za0 !== undefined) d += sLine([x0, za0 + Math.sign(z - za0) * gap], [x0, z + Math.sign(z - za0) * ext], C.muted, 0.9);
    if (za1 !== undefined) d += sLine([x1, za1 + Math.sign(z - za1) * gap], [x1, z + Math.sign(z - za1) * ext], C.muted, 0.9);
    d += sLine([x0, z], [x1, z], C.ink, 1);
    [x0, x1].forEach(x => { d += sLine([x - tk, z - tk], [x + tk, z + tk], C.ink, 1.3); });
    if (txtSide === 'right') { d += halo(sText(x1 + fs * 0.6, z, label, fs * 0.85, C.ink, 'start', 0, 500)); B(x1 + fs * 0.6 + tW(label, fs * 0.85), z); }
    else if (txtSide === 'left') { d += halo(sText(x0 - fs * 0.6, z, label, fs * 0.85, C.ink, 'end', 0, 500)); B(x0 - fs * 0.6 - tW(label, fs * 0.85), z); }
    else { d += halo(sText((x0 + x1) / 2, z + fs * 0.9, label, fs * 0.9, C.ink, 'middle', 0, 500)); B((x0 + x1) / 2 - tW(label, fs * 0.9) / 2, z + fs * 1.4); B((x0 + x1) / 2 + tW(label, fs * 0.9) / 2, z); }
    B(x0, z); B(x1, z);
    return d;
  };

  /* ---------- degraus ---------- */
  const tn = clamp(e * 0.16, 2, 3.5); /* altura do bocel só para o desenho (não é cotada) */
  const noseRight = (k, xr) => {
    /* do pé do espelho (xr) até o topo do piso k */
    const z1 = k * e, xn = (k - 1) * p;
    if (modo === 'sem' || b < 1e-9) return [[xn, z1]];                 /* espelho reto, quina viva */
    if (modo === 'inclinado') return [[xn, z1]];                       /* espelho inclinado: do pé direto até a quina */
    if (b < 1.2) return [[xr, z1 - tn], [xn, z1 - tn], [xn, z1]];      /* bocel curto: avanço reto */
    /* bocel: face de baixo chanfrada e ponta arredondada */
    return [[xr, z1 - tn - 0.9], [xn + 0.5, z1 - tn], [xn, z1 - tn + 0.5], [xn, z1 - 0.45], [xn + 0.45, z1]];
  };
  let zMin = 0, zMax = 4 * e, xMin = -p, xMax = 3 * p + b;
  if (!plc) {
    const zc = x => (x - b) * tg;              /* linha dos cantos internos (pé dos espelhos) */
    const zu = x => zc(x) - tl / ca;          /* face inferior da laje: paralela, a tl na perpendicular */
    const prof = [];
    for (let k = -1; k <= 5; k++) {
      const xr = (k - 1) * p + b;
      prof.push([xr, (k - 1) * e]);
      noseRight(k, xr).forEach(q => prof.push(q));
      prof.push([k * p + b, k * e]);
    }
    const poly = prof.concat([[5 * p + b, zu(5 * p + b)], [-3 * p, zu(-3 * p)]]);
    const C1 = [b, 0], Ps = add(C1, u, -0.62 * p), Pe = [3 * p + b, 3 * e];
    const BIG = 300;
    const clip = [add(Ps, n, -BIG), add(Pe, n, -BIG), add(Pe, n, BIG), add(Ps, n, BIG)];
    const cid = id + 'c';
    s += '<defs><clipPath id="' + cid + '"><polygon points="' + clip.map(q => r2(q[0]) + ',' + r2(-q[1])).join(' ') + '"/></clipPath></defs>';
    s += '<g clip-path="url(#' + cid + ')">' + sPoly(poly, C.tread, 'none', 0) + sPoly(poly, 'url(#' + id + ')', C.ink, 1.6) + '</g>';
    /* onde o corte da esquerda encontra o piso de cima (raio ao longo de n) */
    let tTop = 0;
    for (let i = 0; i < prof.length - 1; i++) {
      const A = prof[i], Bq = prof[i + 1], dx = Bq[0] - A[0], dy = Bq[1] - A[1];
      const den = n[0] * dy - n[1] * dx; if (Math.abs(den) < 1e-12) continue;
      const t = ((A[0] - Ps[0]) * dy - (A[1] - Ps[1]) * dx) / den, w = ((A[0] - Ps[0]) * n[1] - (A[1] - Ps[1]) * n[0]) / den;
      if (t >= 0 && w >= -1e-9 && w <= 1 + 1e-9 && (!tTop || t < tTop)) tTop = t;
    }
    const PsTop = add(Ps, n, tTop), PsBot = add(Ps, n, -tl), PeBot = add(Pe, n, -tl);
    if (tl > 0 || tTop > 0) s += breakLine(PsBot, PsTop, fs * 0.8, C);
    if (tl > 0) s += breakLine(PeBot, Pe, fs * 0.8, C);
    B(PsBot[0], PsBot[1]); B(PsTop[0] - fs, PsTop[1]); B(PeBot[0], PeBot[1]);
    zMin = PsBot[1]; xMin = Math.min(PsBot[0], PsTop[0]);
    /* espessura da laje, cotada no corte da direita (na perpendicular) */
    if (tl > 0) {
      s += dimLine(Pe, PeBot, u[0], u[1], fs * 2, 'laje ' + fmt(tl), fs * 0.9, C);
      const q = add(add(Pe, n, -tl / 2), u, fs * 3.2); B(q[0] + fs * 2, q[1]);
    } else s += sText(Pe[0] + fs, Pe[1] - fs * 1.5, 'sem laje', fs * 0.8, C.muted, 'start');
    s += halo(sText((Ps[0] + Pe[0]) / 2 + p * 0.25, zu((Ps[0] + Pe[0]) / 2 + p * 0.25) - fs * 1.4, 'concreto', fs * 0.8, C.muted, 'middle', -R.incl, 500));
    /* avanço da borda, no degrau 1 */
    if (b > 1e-9) {
      const zb = (modo === 'inclinado' ? 0 : e - tn) - fs * 1.2;
      s += hDim(0, b, zb, (modo === 'inclinado' ? 'quina ' : 'bocel ') + fmt(b, 2), modo === 'inclinado' ? e : e - tn, modo === 'inclinado' ? 0 : e - tn - 0.9, 'left');
    } else { const tx = 'espelho reto, sem saliência'; s += halo(sText(-fs * 0.6, e * 0.5, tx, fs * 0.8, C.muted, 'end', 0, 500)); B(-fs * 0.6 - tW(tx, fs * 0.8), e * 0.5); }
  } else {
    /* degraus em balanço: placas soltas de espessura espDegrau, vistos na linha de caminhamento; cada placa avança o bocel sobre a de baixo */
    for (let k = 0; k <= 3; k++) {
      const x0 = (k - 1) * p, x1 = k * p + b, z1 = k * e, z0 = z1 - tD;
      const pts = [[x0 + 0.45, z1], [x1, z1], [x1, z0], [x0 + 0.5, z0], [x0, z0 + 0.5], [x0, z1 - 0.45]];
      s += sPoly(pts, C.tread, C.ink, 1.6);
      B(x0, z0);
    }
    xMin = -p; zMin = -tD;
    /* espessura do degrau, no degrau 3 */
    s += vDim(3 * p + b + fs * 1.6, 3 * e - tD, 3 * e, 'degrau ' + fmt(tD), 1, 0, 3 * p + b, 3 * p + b);
    /* bocel = sobreposição em planta do degrau 2 sobre o 1 */
    if (b > 1e-9) s += hDim(p, p + b, 2 * e - tD - fs * 1.2, 'avanço ' + fmt(b, 2), 2 * e - tD, e, 'right');
  }
  /* espelho e, no degrau 2 (à esquerda do espelho) */
  const xr2 = p + b, dE = Math.min(p * 0.32, fs * 3.5);
  s += vDim(xr2 - dE, e, 2 * e, 'e ' + f2(e), -1, 0, plc ? p + b : xr2, plc ? p : xr2);
  /* piso p, de bocel a bocel (degraus 2 e 3) */
  const zp = 3 * e + fs * 1.8;
  s += hDim(p, 2 * p, zp, 'p ' + f2(p), 2 * e, 3 * e);
  s += sLine([p, 2 * e + fs * 0.3], [p, 3 * e], C.muted, 0.9);

  /* linha dos bocéis */
  const xa = -0.85 * p, xb = 3 * p + b + fs;
  s += sLine([xa, zn(xa)], [xb, zn(xb)], C.info, 1.2, '7 4');
  { const xl = 2 * p + fs * 1.6, dl = fs * 0.9 / ca; s += halo(sText(xl, zn(xl) - dl, 'linha dos bocéis', fs * 0.75, C.info, 'start', -R.incl, 500)); }
  B(xa, zn(xa)); B(xb, zn(xb));

  /* ângulo de inclinação, no bocel do degrau 2 */
  const rA = p * 0.55, V = [p, 2 * e];
  const A0 = [V[0] + rA, V[1]], A1 = [V[0] + rA * ca, V[1] + rA * sa];
  s += '<path d="M' + r2(A0[0]) + ',' + r2(-A0[1]) + ' A' + r2(rA) + ',' + r2(rA) + ' 0 0 0 ' + r2(A1[0]) + ',' + r2(-A1[1]) + '" fill="none" stroke="' + C.accent + '" stroke-width="1.3" ' + NS + '/>';
  const am = a / 2, rT = rA + fs * 1.6;
  s += halo(sText(V[0] + rT * Math.cos(am), V[1] + rT * Math.sin(am), fmt(R.incl, 1) + '°', fs * 0.9, C.accent, 'middle', 0, 600));

  /* corrimão: altura medida na vertical a partir da linha dos bocéis; desenhada fora de escala (cota interrompida) */
  const Hd = h => h * 0.4;
  /* diâmetro do corrimão: NBR 9077:2001 4.8.2.3 aceita 38 a 65 mm; a NBR 9050:2020 (6.9.3.1 remete a 4.6.5) pede 30 a 45 mm.
     No perfil NBR 9050 vale a faixa dela (desenhado com 4 cm); nos outros, a da NBR 9077 (desenhado com 5 cm). */
  const faixaD = R.nm.acess ? 'Ø 3,0 a 4,5' : 'Ø 3,8 a 6,5', rr = R.nm.acess ? 2 : 2.5;
  const alturas = R.nm && R.nm.acess ? [92, 70] : [92];
  const xr0 = -0.55 * p, xr1 = 3 * p + b + fs * 2;
  alturas.forEach((h, i) => {
    const L0 = [xr0, zn(xr0) + Hd(h)], L1 = [xr1, zn(xr1) + Hd(h)];
    const band = [add(L0, n, rr), add(L1, n, rr), add(L1, n, -rr), add(L0, n, -rr)];
    s += sPoly(band, C.piso, C.ink, 1.3);
    band.forEach(q => B(q[0], q[1]));
    const xd = 3 * p - (alturas.length - 1 - i) * Math.max(p * 0.42, fs * 3.2);
    s += sCircle(xd, zn(xd), fs * 0.18, C.ink);
    s += vDim(xd, zn(xd), zn(xd) + Hd(h), String(h), -1, 0.4);
  });
  s += halo(sText(xr0 + fs * 0.5, zn(xr0) + Hd(alturas[0]) + rr + fs * 1.1, 'corrimão (altura fora de escala)', fs * 0.8, C.ink, 'start', -R.incl, 500));
  B(xr0 + fs * 0.5, zn(xr0) + Hd(alturas[0]) + rr + fs * 2);

  /* seção do corrimão junto à parede, em escala, com um diâmetro dentro da faixa do perfil */
  const xw = 2.25 * p;
  const zTopLim = plc ? Math.min(zn(xw - 4) - e - tD, e - tD) - fs * 2 : (xw - 4 - b) * tg - tl / ca - fs * 1.5;
  const zi = Math.min(zTopLim - fs * 2.2 - 8, -2);
  s += '<rect x="' + r2(xw - 3) + '" y="' + r2(-(zi + 8)) + '" width="3" height="16" fill="url(#' + id + ')" stroke="' + C.ink + '" stroke-width="1.3" ' + NS + '/>';
  const cx = xw + 4 + rr;
  s += sCircle(cx, zi, rr, C.piso, C.ink, 1.4);
  s += sLine([cx - rr - 1, zi], [cx + rr + 1, zi], C.muted, 0.7, '2 2') + sLine([cx, zi - rr - 1], [cx, zi + rr + 1], C.muted, 0.7, '2 2');
  s += hDim(xw, xw + 4, zi - rr - fs * 1.4, '', zi - 8, zi - rr * 0.2);
  s += halo(sText(xw + 2, zi - rr - fs * 2.6, '≥ 4', fs * 0.85, C.ink, 'middle', 0, 500));
  s += sLine([cx + rr * 0.7, zi + rr * 0.7], [cx + rr + fs * 1.2, zi + rr + fs * 0.6], C.muted, 0.9);
  s += halo(sText(cx + rr + fs * 1.4, zi + rr + fs * 0.6, faixaD, fs * 0.85, C.ink, 'start', 0, 500));
  s += halo(sText(xw - 3, zi + 8 + fs * 1.1, 'seção do corrimão', fs * 0.8, C.muted, 'start', 0, 600));
  s += halo(sText(xw - 3.6, zi, 'parede', fs * 0.7, C.muted, 'end', 0));
  B(xw - 3.6 - tW('parede', fs * 0.7), zi - rr - fs * 3.2); B(cx + rr + fs * 1.4 + tW(faixaD, fs * 0.85), zi + 8 + fs * 1.6);
  zMin = Math.min(zMin, zi - rr - fs * 3.2);

  /* ---------- moldura, notas e título ---------- */
  B(xMin - fs, zMin);
  const m = fs * 2.5;
  const notas = [
    '2e + p = 2 × ' + f2(e) + ' + ' + f2(p) + ' = ' + f2(2 * e + p) + ' cm (Blondel)',
    'inclinação = arctg(e ÷ p) = ' + fmt(R.incl, 1) + '°',
    plc ? (modo === 'sem' ? 'borda: placas sem sobreposição' : 'borda: cada placa avança ' + fmt(b, 2) + ' cm sobre a de baixo')
      : (modo === 'sem' ? 'borda: espelho reto, sem saliência' : (modo === 'inclinado' ? 'borda: espelho inclinado, quina avança ' : 'borda: bocel de ') + fmt(b, 2) + ' cm'),
    '  NBR 9077:2001, 4.7.3.1 e: mín. 1,5 cm; NBR 9050:2020, 6.7.1: máx. 1,5 cm',
    R.nm.acess ? 'corrimão: Ø 3,0 a 4,5 cm (NBR 9050:2020, 6.9.3.1 e 4.6.5)' : 'corrimão: Ø 3,8 a 6,5 cm (NBR 9077:2001, 4.8.2.3)',
    'afastamento da parede ≥ 4 cm (NBR 9077:2001, 4.8.2.4' + (R.nm.acess ? '; NBR 9050:2020, 4.6.5)' : ')'),
    'altura do corrimão (' + alturas.join(' e ') + ' cm) medida na vertical',
    '  a partir da linha dos bocéis'
  ];
  if (plc) notas.push('degraus em balanço: sem laje; placas soltas de ' + fmt(tD) + ' cm de espessura, espelho aberto');
  else if (hel) notas.push('helicoidal maciça: laje helicoidal de ' + fmt(st.tLaje) + ' cm sob os degraus');
  if (hel) {
    notas.push('piso medido na linha de caminhamento (' + fmt(R.helix.rw, 0) + ' cm do eixo);');
    notas.push('fora dela o piso muda: menor perto do eixo, maior perto da borda');
  } else if (!plc) notas.push('laje da escada ' + fmt(tl) + ' cm, medida na perpendicular à inclinação');
  const fN = fs * 0.78, lh = fs * 1.35;
  const wN = Math.max.apply(null, notas.map(t => tW(t, fN)));
  const tb1 = 'DETALHE DO DEGRAU · AMPLIADO (use a escala gráfica)';
  const tb2 = (hel ? 'degraus na linha de caminhamento' : plc ? 'três degraus em balanço típicos, ampliados' : 'três degraus retos típicos, ampliados') + ' · medidas em cm';
  const wT = Math.max(tW(tb1, fs * 0.95), tW(tb2, fs * 0.8));
  const vx = bb[0] - m;
  const vw = Math.max(bb[2] - bb[0] + 2 * m, wN + 3 * fs, wT + 3 * fs);
  const zN0 = bb[1] - fs * 2;
  notas.forEach((t, i) => { s += sText(vx + fs * 1.2, zN0 - i * lh, t, fN, C.ink, 'start', 0, i === 0 ? 600 : 400); });
  const yT = zN0 - notas.length * lh - fs * 0.6;
  s += sLine([vx + fs * 0.5, yT], [vx + vw - fs * 0.5, yT], C.ink, 1.2);
  s += sText(vx + fs * 1.2, yT - fs * 1.5, tb1, fs * 0.95, C.ink, 'start', 0, 600);
  s += sText(vx + fs * 1.2, yT - fs * 3.0, tb2, fs * 0.8, C.muted, 'start', 0, 400);
  /* escala gráfica 0-10-20 cm em tamanho real do desenho */
  const x0 = vx + fs * 1.2, y0 = yT - fs * 5.0, hh = fs * 0.5;
  [0, 1].forEach(i => { s += '<rect x="' + r2(x0 + i * 10) + '" y="' + r2(-y0 - hh) + '" width="10" height="' + r2(hh) + '" fill="' + (i ? C.paper : C.ink) + '" stroke="' + C.ink + '" stroke-width="1" ' + NS + '/>'; });
  [0, 10, 20].forEach(v => { s += sText(x0 + v, y0 - fs * 0.85, String(v), fs * 0.7, C.muted, 'middle'); });
  s += sText(x0 + 22, y0 + hh / 2, 'cm', fs * 0.7, C.muted, 'start');
  const ymin = y0 - fs * 2.2, ymax = bb[3] + m;
  const bg = '<rect x="' + r2(vx) + '" y="' + r2(-ymax) + '" width="' + r2(vw) + '" height="' + r2(ymax - ymin) + '" fill="' + C.paper + '"/>';
  return svgWrap(vx, -ymax, vw, ymax - ymin, bg + s, o, defs);
}
