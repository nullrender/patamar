/* ===== ABA EXPLICAÇÃO: texto que acompanha os números ===== */
function anatomiaSVG(C) {
  const t = (x, y, s, a, w) => '<text x="' + x + '" y="' + y + '" font-size="12" fill="' + C.ink + '" text-anchor="' + (a || 'start') + '" dominant-baseline="central" font-family="' + FONT + '"' + (w ? ' font-weight="600"' : '') + '>' + s + '</text>';
  const ln = (x1, y1, x2, y2, col, d) => '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (col || C.ink) + '" stroke-width="1.2"' + (d ? ' stroke-dasharray="3 3"' : '') + '/>';
  let s = '<path d="M30,170 L30,130 L128,130 L128,138 L120,138 L120,90 L208,90 L208,98 L200,98 L200,50 L290,50 L290,170 Z" fill="' + C.tread + '" stroke="' + C.ink + '" stroke-width="1.8" stroke-linejoin="round"/>';
  s += ln(110, 90, 110, 130) + ln(106, 90, 114, 90) + ln(106, 130, 114, 130) + t(104, 110, 'espelho (e)', 'end', 1);
  s += ln(120, 76, 200, 76) + ln(120, 72, 120, 80) + ln(200, 72, 200, 80) + t(160, 62, 'piso (p)', 'middle', 1);
  s += ln(128, 134, 78, 104, C.accent) + '<circle cx="128" cy="134" r="3" fill="' + C.accent + '"/>' + t(30, 98, 'bocel (nariz)', 'start', 1);
  s += ln(120, 90, 120, 138, C.muted, 1) + t(46, 152, 'degrau 1', 'start');
  s += t(322, 16, 'o piso é medido', 'end') + t(322, 31, 'de nariz a nariz', 'end');
  return '<svg viewBox="0 0 330 185" style="width:100%;max-width:440px;height:auto;display:block" role="img" aria-label="Perfil de três degraus com espelho, piso e bocel">' + s + '</svg>';
}

/* Gráfico de Blondel: espelho no eixo x, piso no eixo y. A área que atende ao mesmo tempo espelho, piso e Blondel é a
   interseção de um retângulo com uma faixa inclinada. Cada número de espelhos possível vira um ponto. */
function blondelSVG(R, C) {
  const nm = R.nm, W = 440, Hh = 300, x0 = 54, x1 = 420, y0 = 262, y1 = 18;
  const eA = Math.min(14, nm.eMin - 1), eB = Math.max(20, nm.eMax + 1), pA = Math.min(22, nm.pMin - 2), pB = Math.max(36, nm.pMax + 3);
  const X = e => x0 + (e - eA) / (eB - eA) * (x1 - x0), Y = p => y0 - (p - pA) / (pB - pA) * (y0 - y1);
  const pt = q => r2(X(q[0])) + ',' + r2(Y(q[1]));
  /* recorte de um polígono por um semiplano a·e + b·p <= c (Sutherland–Hodgman) */
  const corta = (poly, a, b, c) => {
    const out = [], f = q => a * q[0] + b * q[1] - c;
    for (let i = 0; i < poly.length; i++) {
      const P = poly[i], Q = poly[(i + 1) % poly.length], fp = f(P), fq = f(Q);
      if (fp <= 0) out.push(P);
      if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) { const k = fp / (fp - fq); out.push([P[0] + (Q[0] - P[0]) * k, P[1] + (Q[1] - P[1]) * k]); }
    }
    return out;
  };
  const caixa = [[eA, pA], [eB, pA], [eB, pB], [eA, pB]];
  const faixa = corta(corta(caixa, 2, 1, nm.bMax), -2, -1, -nm.bMin);
  const ret = [[nm.eMin, nm.pMin], [nm.eMax, nm.pMin], [nm.eMax, nm.pMax], [nm.eMin, nm.pMax]];
  const ok = corta(corta(ret, 2, 1, nm.bMax), -2, -1, -nm.bMin);
  const tx = (x, y, s, a, col, sz, w) => '<text x="' + r2(x) + '" y="' + r2(y) + '" font-size="' + (sz || 11) + '" fill="' + (col || C.muted) + '" text-anchor="' + (a || 'middle') + '" dominant-baseline="central" font-family="' + FONT + '"' + (w ? ' font-weight="600"' : '') + '>' + s + '</text>';
  let s = '<rect x="' + x0 + '" y="' + y1 + '" width="' + (x1 - x0) + '" height="' + (y0 - y1) + '" fill="' + C.paper + '" stroke="' + C.line + '"/>';
  for (let e = Math.ceil(eA); e <= eB; e++) s += '<line x1="' + r2(X(e)) + '" y1="' + y1 + '" x2="' + r2(X(e)) + '" y2="' + y0 + '" stroke="' + C.line + '" stroke-width="0.6"/>' + tx(X(e), y0 + 12, e);
  for (let p = Math.ceil(pA / 2) * 2; p <= pB; p += 2) s += '<line x1="' + x0 + '" y1="' + r2(Y(p)) + '" x2="' + x1 + '" y2="' + r2(Y(p)) + '" stroke="' + C.line + '" stroke-width="0.6"/>' + tx(x0 - 6, Y(p), p, 'end');
  if (faixa.length > 2) s += '<polygon points="' + faixa.map(pt).join(' ') + '" fill="' + C.winder + '" fill-opacity="0.55"/>';
  s += '<polygon points="' + ret.map(pt).join(' ') + '" fill="none" stroke="' + C.muted + '" stroke-width="1.2" stroke-dasharray="5 4"/>';
  if (ok.length > 2) s += '<polygon points="' + ok.map(pt).join(' ') + '" fill="' + C.patamar + '" stroke="' + (C.ok || C.ink) + '" stroke-width="1.8"/>';
  /* um ponto para cada número de espelhos possível */
  const nA = Math.max(2, Math.ceil(R.H / eB)), nB = Math.floor(R.H / eA);
  for (let n = nA; n <= nB && n - nA < 40; n++) {
    const e = R.H / n; if (e < eA || e > eB) continue;
    const f = faixaP(e, nm), pm = f[0] <= f[1] + 1e-9 ? clamp(nm.bMid - 2 * e, f[0], f[1]) : clamp(nm.bMid - 2 * e, nm.pMin, nm.pMax);
    s += '<circle cx="' + r2(X(e)) + '" cy="' + r2(Y(pm)) + '" r="3" fill="' + C.muted + '"/>' + tx(X(e), Y(pm) - 10, n, 'middle', C.muted, 9);
  }
  if (R.e >= eA && R.e <= eB && R.p >= pA && R.p <= pB) s += '<circle cx="' + r2(X(R.e)) + '" cy="' + r2(Y(R.p)) + '" r="6.5" fill="' + C.accent + '" stroke="' + C.paper + '" stroke-width="2"/>' + tx(X(R.e) + 12, Y(R.p) - 16, 'sua escada', 'start', C.accent, 11, 1);
  s += tx((x0 + x1) / 2, Hh - 8, 'espelho e (cm)', 'middle', C.ink, 11, 1);
  s += '<text transform="translate(14 ' + ((y0 + y1) / 2) + ') rotate(-90)" font-size="11" fill="' + C.ink + '" text-anchor="middle" font-family="' + FONT + '" font-weight="600">piso p (cm)</text>';
  return '<svg viewBox="0 0 ' + W + ' ' + Hh + '" style="width:100%;max-width:520px;height:auto;display:block" role="img" aria-label="Gráfico de Blondel com a área que atende espelho, piso e Blondel e o ponto da sua escada">' + s + '</svg>';
}

/* Elevação com planta e elevação lado a lado: não dá para puxar linha de chamada, então a medida passa da planta
   para a elevação com o escalímetro. Cada figura é um passo; planta e elevação na MESMA escala, como no papel.
   cs = plano da elevação (elevacaoDe), x0 = posição horizontal da referência (eixo da helicoidal ou meio da escada),
   Cref = ponto da planta na referência, P = canto de exemplo, zP = altura do topo do degrau dele, pl0 = degrau do exemplo. */
function medirCopiarSVG(R, C, cs, x0, Cref, P, zP, pl0, passo) {
  const Sx = q => (q[0] - cs.P0[0]) * cs.u[0] + (q[1] - cs.P0[1]) * cs.u[1];
  const Dq = q => (q[0] - cs.P0[0]) * cs.n[0] + (q[1] - cs.P0[1]) * cs.n[1];
  const pts = []; R.polys.forEach(pl => pl.pts.forEach(q => pts.push(q)));
  if (R.hel) for (let a = 0; a < 360; a += 10) pts.push([R.helix.R * Math.cos(rad(a)), R.helix.R * Math.sin(rad(a))]);
  const bx = [Math.min.apply(null, pts.map(q => q[0])), Math.min.apply(null, pts.map(q => q[1])), Math.max.apply(null, pts.map(q => q[0])), Math.max.apply(null, pts.map(q => q[1]))];
  const ss = pts.map(Sx), sA = Math.min.apply(null, ss) - x0, sB = Math.max.apply(null, ss) - x0;
  const pw = bx[2] - bx[0], ph = bx[3] - bx[1], ew = sB - sA, eh = R.H, hM = Math.max(ph, eh);
  /* lado de quem olha na planta (na tela): n aponta de quem olha para a escada; na tela o y da planta é invertido */
  const ox = -cs.n[0], oy = cs.n[1];
  const W = 340, HMAX = 330, topo = 22, pe = 16, olhoPx = 16;
  const mL = 14 + (ox < -0.5 ? 34 : 0), gap = 26 + (ox > 0.5 ? 40 : 0), mR = 12, tT = oy < -0.5 ? 28 : 0, tB = oy > 0.5 ? 28 : 0;
  /* uma escala só para as duas vistas: a medida copiada tem o mesmo tamanho no papel */
  const k = Math.min((W - mL - gap - mR) / (pw + ew), (HMAX - topo - tT - tB - pe) / hM);
  const base = topo + tT + hM * k, Hh = base + tB + pe;
  const px0 = mL, ex0 = mL + pw * k + gap;
  const PL = q => [px0 + (q[0] - bx[0]) * k, base - (hM - ph) * k / 2 - (q[1] - bx[1]) * k];
  const EL = (sv, z) => [ex0 + (sv - sA) * k, base - z * k];
  const xy = q => r2(q[0]) + ',' + r2(q[1]);
  const ln = (a, b, col, w, d) => '<line x1="' + r2(a[0]) + '" y1="' + r2(a[1]) + '" x2="' + r2(b[0]) + '" y2="' + r2(b[1]) + '" stroke="' + col + '" stroke-width="' + w + '"' + (d ? ' stroke-dasharray="' + d + '"' : '') + '/>';
  /* texto com contorno da cor do papel, para não sumir sobre as linhas */
  const tx = (q, t, a, col, sz, w) => { const x = clamp(q[0], 4, W - 4), an = a || 'middle'; return '<text x="' + r2(an === 'middle' ? clamp(x, 24, W - 24) : x) + '" y="' + r2(q[1]) + '" font-size="' + (sz || 9.5) + '" fill="' + (col || C.muted) + '" text-anchor="' + an + '" dominant-baseline="central" font-family="' + FONT + '"' + (w ? ' font-weight="600"' : '') + ' stroke="' + C.paper + '" stroke-width="3" paint-order="stroke">' + t + '</text>'; };
  const dot = (q, col) => '<circle cx="' + r2(q[0]) + '" cy="' + r2(q[1]) + '" r="3.2" fill="' + col + '"/>';
  let s = '';
  /* planta (na mesma posição da aba Planta) */
  R.polys.forEach(pl => { s += '<polygon points="' + pl.pts.map(q => xy(PL(q))).join(' ') + '" fill="' + C.tread + '" stroke="' + C.muted + '" stroke-width="0.7"/>'; });
  if (R.hel && R.pole) { const c = PL([0, 0]); s += '<circle cx="' + r2(c[0]) + '" cy="' + r2(c[1]) + '" r="' + r2(R.pole.r * k) + '" fill="' + C.paper + '" stroke="' + C.ink + '" stroke-width="0.8"/>'; }
  s += tx([px0 + pw * k / 2, 9], 'PLANTA', 'middle', C.ink, 9.5, 1) + tx([ex0 + ew * k / 2, 9], 'ELEVAÇÃO', 'middle', C.ink, 9.5, 1);
  /* elevação: chão, níveis dos degraus e piso de cima */
  s += ln(EL(sA - 6 / k, 0), EL(sB + 6 / k, 0), C.ink, 1.6);
  for (let i = 1; i < R.N; i++) s += ln(EL(sA, i * R.e), EL(sB, i * R.e), C.line, 0.6);
  s += ln(EL(sA - 6 / k, R.H), EL(sB + 6 / k, R.H), C.muted, 0.9, '4 3');
  /* linha de referência da planta: passa pela referência e vai até quem olha, um pouco fora da planta */
  const dRef = Dq(Cref), dsP = pts.map(Dq), perto = Math.min.apply(null, dsP), longe = Math.max.apply(null, dsP);
  const naRef = dd => [Cref[0] + cs.n[0] * (dd - dRef), Cref[1] + cs.n[1] * (dd - dRef)];
  const olho = PL(naRef(perto - olhoPx / k));
  s += ln(PL(naRef(longe + 6 / k)), olho, C.accent, 1.4, '6 3') + dot(olho, C.accent);
  s += tx([olho[0] + ox * 4, olho[1] + (Math.abs(ox) > 0.5 ? 12 : oy * 13)], 'quem olha', 'middle', C.accent, 8.5, 1);
  /* linha em pé da elevação */
  s += ln(EL(0, -4 / k), EL(0, R.H + 4 / k), C.accent, 1.4, '6 3');
  const d = Sx(P) - x0, F = naRef(Dq(P)), dTxt = fmt(Math.abs(d), 1) + ' cm';
  if (passo >= 2) {
    const a = PL(F), b = PL(P);
    s += ln(a, b, C.ink, 1.3) + dot(b, C.accent) + dot(a, C.ink);
    const hor = Math.abs(a[1] - b[1]) < Math.abs(a[0] - b[0]);
    s += hor ? tx([(a[0] + b[0]) / 2, a[1] - 9], dTxt, 'middle', C.ink, 10, 1) : tx([a[0] + (a[0] < 60 ? 5 : -5), (a[1] + b[1]) / 2], dTxt, a[0] < 60 ? 'start' : 'end', C.ink, 10, 1);
  }
  if (passo >= 3) {
    const a = EL(0, zP), b = EL(d, zP);
    s += ln(a, b, C.ink, 1.3) + dot(b, C.accent);
    s += tx([(a[0] + b[0]) / 2, a[1] - 9], dTxt, 'middle', C.ink, 10, 1);
  }
  if (passo >= 4) {
    /* os outros cantos do mesmo degrau, na altura do topo dele, ligados */
    const sv = pl0.pts.map(q => Sx(q) - x0), lo = Math.min.apply(null, sv), hi = Math.max.apply(null, sv);
    s += '<polygon points="' + pl0.pts.map(q => xy(PL(q))).join(' ') + '" fill="' + C.accent + '" fill-opacity="0.25" stroke="' + C.accent + '" stroke-width="1"/>';
    s += ln(EL(lo, zP), EL(hi, zP), C.accent, 2.4);
    s += dot(EL(lo, zP), C.ink) + dot(EL(hi, zP), C.ink);
  }
  return '<svg viewBox="0 0 ' + W + ' ' + r2(Hh) + '" style="width:100%;max-width:420px;height:auto;display:block" role="img" aria-label="Passo ' + passo + ' de como passar uma medida da planta para a elevação">' + s + '</svg>';
}

function explicacao(R, S, C) {
  const nm = R.nm, f = fmt, hel = R.hel, tp = TIPOS.find(x => x.id === R.tipo);
  /* caracol autoportante (centro vazio): o meio é o olho, não um pilar */
  const olhoV = !!R.olho, nomeC = olhoV ? 'olho' : 'pilar';
  const leq = R.tipo === 'l-leque' || R.tipo === 'u-leque';
  const nomeEsc = 'escada ' + tp.nome.toLowerCase().replace(/^em l /, 'em L ').replace(/^em u /, 'em U ');
  const nMin = Math.ceil(R.H / nm.eMax - 1e-9), nMax = Math.floor(R.H / nm.eMin + 1e-9);
  const sec = (titulo, corpo, aberto) => '<details class="ex"' + (aberto ? ' open' : '') + '><summary>' + titulo + '</summary><div class="exb">' + corpo + '</div></details>';
  const p = x => '<p>' + x + '</p>';
  const ul = a => '<ul>' + a.map(x => '<li>' + x + '</li>').join('') + '</ul>';
  const dl = a => '<dl>' + a.map(x => '<dt>' + x[0] + '</dt><dd>' + x[1] + '</dd>').join('') + '</dl>';
  const ol = a => '<ol>' + a.map(x => '<li>' + x + '</li>').join('') + '</ol>';
  const tab = (cab, linhas) => '<div class="tabwrap"><table class="tab"><thead><tr>' + cab.map(c => '<th>' + c + '</th>').join('') + '</tr></thead><tbody>' + linhas.map(l => '<tr>' + l.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  /* NBR 9050 e escada curva: mesma ressalva da verificação 'mudanca' do core.js */
  const ACESS_CURVA = 'A NBR 9050:2020 pede patamar sempre que houver mudança de direção (6.8.7), mas a 6.8.6 admite lance curvo, com piso e espelho medidos a 0,55 m da borda interna; a norma não diz como juntar as duas regras, e o app adota a leitura mais segura (pede patamar). Confirme com quem aprova o projeto.';
  const ruins = R.checks.filter(c => c.status === 'bad'), atencao = R.checks.filter(c => c.status === 'warn');
  const ponta = leq ? Math.min.apply(null, R.polys.filter(q => q.kind === 'leque').map(q => q.wIn)) : 0;
  let h = '';

  /* 1. Resumo para falar */
  const comp = !hel && R.tipo === 'reta' ? ' Em linha reta ela ocupa ' + f(R.T * R.p / 100, 2) + ' m de comprimento.' : '';
  h += sec('Resumo para abrir a apresentação',
    p('Esta é uma <b>' + nomeEsc + '</b> que vence um desnível de <b>' + f(R.H) + ' cm</b> entre um piso e o outro, com <b>' + f(R.L) + ' cm</b> de largura útil. Ela tem <b>' + R.N + ' espelhos de ' + f(R.e, 2) + ' cm</b> e, entre eles, <b>' + R.contagem + '</b>' + (R.nReto || R.nLeque ? ', com piso de <b>' + f(R.p, 1) + ' cm</b>' + (hel ? ' na linha de caminhamento' : R.nLeque && R.bal ? ' em todos os degraus, medido na linha de caminhamento' : R.nLeque ? ' nos trechos retos' : '') : '') + '. A conta de conforto de Blondel dá <b>' + f(R.bl, 1) + ' cm</b> (referência de ' + f(nm.bMin) + ' a ' + f(nm.bMax) + ' cm) e a inclinação fica em <b>' + f(R.incl, 1) + '°</b>.' + comp) +
    (leq && R.bal ? p('Os degraus da curva são <b>balanceados</b>: em vez de saírem todos do canto, eles giram aos poucos, e a parte mais estreita fica com <b>' + f(ponta, 1) + ' cm</b> na borda interna.') : '') +
    p('Na lista de verificações, ' + (ruins.length ? (ruins.length === 1 ? 'há 1 item que <b>não atende</b>' : 'há ' + ruins.length + ' itens que <b>não atendem</b>') + ' ao perfil escolhido (' + ruins.map(c => c.nome.toLowerCase()).join('; ') + '): vale explicar ' + (ruins.length === 1 ? 'qual é' : 'quais são') + ' e o que ajustaria para corrigir.' : atencao.length ? 'nenhum item ficou fora do limite, mas há itens em <b>atenção</b>' + (nm.mez ? ' (fora da referência de estudo ou que o app não consegue validar)' : ' que o app não consegue validar') + ': vale explicar cada um.' : 'os itens que o app confere atendem ao perfil escolhido (' + nm.curto + ').') + ' Lembre que o app confere só parte das exigências de uma escada.'), true);

  /* 2. Passo a passo */
  const passos = [];
  passos.push('<b>Desnível (H).</b> É a altura de um piso acabado até o outro piso acabado: <b>' + f(R.H) + ' cm</b>. Toda a escada existe para vencer essa altura em degraus iguais. Meça sempre de piso <i>acabado</i> a piso <i>acabado</i>: o contrapiso e o revestimento mudam a conta.');
  passos.push('<b>Número de espelhos (N).</b> O espelho é a parte vertical do degrau. Como o perfil limita o espelho entre ' + f(nm.eMin) + ' e ' + f(nm.eMax) + ' cm, o número de espelhos precisa estar entre H ÷ ' + f(nm.eMax) + ' = ' + f(R.H / nm.eMax, 2) + ' (arredonda para cima: ' + nMin + ') e H ÷ ' + f(nm.eMin) + ' = ' + f(R.H / nm.eMin, 2) + ' (arredonda para baixo: ' + nMax + '). O app testa cada número dessa faixa e escolhe o que deixa o espelho mais perto de 17,5 cm' + (hel ? '' : ', desde que exista um piso que atenda ao mesmo tempo o limite de piso e o de Blondel') + ': <b>' + R.nSug + '</b>' + (S.nAuto ? '.' : '; você definiu <b>' + R.N + '</b>.'));
  passos.push('<b>Altura do espelho (e).</b> e = H ÷ N = ' + f(R.H) + ' ÷ ' + R.N + ' = <b>' + f(R.e, 2) + ' cm</b>. Dividir o desnível por um número inteiro garante que todos os espelhos sejam iguais, que é o que evita tropeço. ' + (Math.abs(Math.round(R.e * 100) / 100 * R.N - R.H) < 1e-6 ? 'Confira: ' + R.N + ' × ' + f(R.e, 2) + ' = ' + f(R.H) + ' cm, exatamente o desnível.' : 'Aqui a divisão não é exata: o espelho vale ' + f(R.e, 4) + '… cm. Se você usar ' + f(R.e, 2) + ' cm, a soma dá ' + R.N + ' × ' + f(R.e, 2) + ' = ' + f(Math.round(R.e * 100) / 100 * R.N, 2) + ' cm, e não ' + f(R.H) + ' cm. Por isso, no desenho, divida o desnível em ' + R.N + ' partes iguais (veja o roteiro de desenho à mão), em vez de somar o espelho arredondado.'));
  passos.push(hel
    ? '<b>Piso (p) na linha de caminhamento.</b> Na helicoidal o degrau é um setor de círculo, então a profundidade muda conforme o raio. O app mede o piso na linha de caminhamento, que fica a ' + f(R.dw) + ' cm da borda do ' + nomeC + ', no raio de ' + f(R.helix.rw) + ' cm. Cada degrau gira ' + f(R.helix.th, 1) + '°, então p = raio × ângulo (em radianos) = ' + f(R.helix.rw) + ' × ' + f(rad(R.helix.th), 3) + ' = <b>' + f(R.p, 1) + ' cm</b>.'
    : '<b>Piso (p) pela fórmula de Blondel.</b> O piso precisa caber em duas faixas ao mesmo tempo: a do piso (' + f(nm.pMin) + ' a ' + f(nm.pMax) + ' cm) e a de Blondel, que com este espelho dá ' + f(nm.bMin) + ' − 2 × ' + f(R.e, 2) + ' = ' + f(nm.bMin - 2 * R.e, 1) + ' até ' + f(nm.bMax) + ' − 2 × ' + f(R.e, 2) + ' = ' + f(nm.bMax - 2 * R.e, 1) + ' cm. ' + (R.temFaixa ? 'As duas juntas deixam de ' + f(R.fP[0], 1) + ' a ' + f(R.fP[1], 1) + ' cm. ' : 'Elas não se cruzam: nenhum piso atende as duas, por isso aparece "não atende". ') + (S.pAuto ? (R.temFaixa ? 'O app pega o valor mais perto do meio de Blondel (' + f(nm.bMid, 1) + ' − 2e = ' + f(nm.bMid - 2 * R.e, 1) + ' cm), arredondado para centímetro inteiro quando possível: <b>' + f(R.p, 2) + ' cm</b>.' : 'O meio de Blondel daria ' + f(nm.bMid - 2 * R.e, 1) + ' cm, fora do limite de piso; o app usou o limite mais perto: <b>' + f(R.p, 2) + ' cm</b>. Mude o número de espelhos para sair dessa situação.') : 'Você definiu <b>' + f(R.p) + ' cm</b>.'));
  passos.push('<b>Superfícies entre espelhos.</b> N − 1 = ' + R.N + ' − 1 = <b>' + R.T + '</b>. O último espelho chega ao piso superior, que não é degrau da escada. ' + (R.nPat || R.nLeque ? 'Nesta escada essas ' + R.T + ' superfícies são: <b>' + R.contagem + '</b>.' + (R.nPat ? ' O patamar também fica entre dois espelhos, por isso entra na conta, mas não é um piso comum.' : '') : 'Aqui todas são pisos comuns.'));
  if (!hel) passos.push('<b>Conferência de Blondel.</b> 2e + p = 2 × ' + f(R.e, 2) + ' + ' + f(R.p, 1) + ' = <b>' + f(R.bl, 1) + ' cm</b>, contra a referência de ' + f(nm.bMin) + ' a ' + f(nm.bMax) + ' cm.');
  passos.push('<b>Inclinação.</b> tangente do ângulo = e ÷ p = ' + f(R.e, 2) + ' ÷ ' + f(R.p, 1) + ' = ' + f(R.e / R.p, 3) + ', então o ângulo é <b>' + f(R.incl, 1) + '°</b> (' + f(R.e / R.p * 100, 0) + '%).');
  if (R.lances.length) passos.push('<b>Divisão do tipo.</b> ' + R.lances.join(' '));
  passos.push('<b>Altura livre e laje.</b> Altura livre é a distância vertical entre a superfície onde se pisa e a face de baixo do obstáculo mais próximo acima (laje, viga). Aqui foi pedido ' + f(S.hLivre) + ' cm' + (nm.fuga ? '. Em rota de fuga, a NBR 9077:2025 (4.2 b) pede 2,10 m livres sob vigas e outros obstáculos, e pé-direito de 2,30 m no ambiente.' : ', valor usual; confira qual exigência vale para o seu caso.') + ' A laje do piso de cima tem ' + f(S.espLaje) + ' cm; ' + (R.opening ? 'a partir do degrau ' + R.kc + ' a laje ficaria baixa demais sobre a escada (a altura do degrau mais ' + f(S.hLivre) + ' cm de altura livre passaria da face de baixo da laje, que fica a ' + f(R.H - S.espLaje) + ' cm). Por isso a laje precisa de uma <b>abertura</b>' + (R.opening.circle ? ' circular de Ø ' + f(R.opening.circle * 2) + ' cm.' : ' de aproximadamente ' + f(R.opening.w) + ' × ' + f(R.opening.h) + ' cm.') : 'não precisa ser aberta, a altura livre já é atendida.'));
  h += sec('Passo a passo da conta, com os seus números', ol(passos) + p('<i>Mudou algum número nas medidas? Esta aba se refaz sozinha.</i>'), true);

  /* 3. Gráfico de Blondel */
  h += sec('O gráfico de Blondel: por que este espelho e este piso',
    p('Cada escada é um ponto neste gráfico: o espelho no eixo de baixo, o piso no eixo do lado. O <b>retângulo tracejado</b> é o que o perfil aceita de espelho (' + f(nm.eMin) + ' a ' + f(nm.eMax) + ' cm) e de piso (' + f(nm.pMin) + ' a ' + f(nm.pMax) + ' cm). A <b>faixa inclinada</b> é a fórmula de Blondel (2e + p entre ' + f(nm.bMin) + ' e ' + f(nm.bMax) + ' cm): ela é inclinada porque, quando o espelho sobe 1 cm, o piso precisa encolher 2 cm para a passada continuar do mesmo tamanho.') +
    blondelSVG(R, C) +
    p('Só a área <b>verde</b>, onde o retângulo e a faixa se cruzam, atende às três regras ao mesmo tempo. Os pontos cinza são as escadas possíveis com este desnível, uma para cada número de espelhos (o número em cima do ponto é N). O ponto laranja é a sua: ' + R.N + ' espelhos de ' + f(R.e, 2) + ' cm com piso de ' + f(R.p, 1) + ' cm.') +
    p('Repare que a faixa de Blondel é estreita (' + f(nm.bMax - nm.bMin, 1) + ' cm de folga). Por isso, com o espelho decidido, sobra pouca escolha para o piso: é a fórmula que "trava" a escada.'), false);

  /* 4. Tipo escolhido */
  const T = {
    'reta': ['Um lance único, sem mudança de direção.', 'Geometria simples: todos os degraus são iguais e o passo não muda ao longo da escada.', 'Exige comprimento em linha reta: aqui seriam ' + f(R.T * R.p / 100, 2) + ' m. Se o desnível passar do máximo sem patamar, não serve sozinha.'],
    'reta-patamar': ['Dois lances na mesma direção, separados por um patamar.', 'O patamar interrompe o lance e oferece uma superfície para descanso e circulação. Permite vencer desníveis acima do máximo sem patamar.', 'Continua precisando de comprimento em linha reta, e o patamar é área a mais. O comprimento mínimo do patamar aqui é ' + f(R.patRetoMin, 0) + ' cm: ' + (nm.patReto ? 'a NBR 9050:2020 (6.8.8) pede 120 cm entre lances.' : 'o perfil usa a fórmula (2e + p) × n + p da NBR 9077:2001 (4.7.3.3 a), edição cancelada pela de 2025, como referência de estudo; n é o número de passos no patamar (1, 2 ou 3). Com os seus números, ' + f(2 * R.e + 2 * R.p, 0) + ' cm (n = 1) ou ' + f(2 * (2 * R.e + R.p) + R.p, 0) + ' cm (n = 2).')],
    'l-patamar': ['Dois lances em ângulo reto, ligados por um patamar quadrado de lado igual à largura.', 'A curva acontece num piso plano, sem degraus de forma diferente. Cabe em cantos de parede. É a solução que a NBR 9050 aceita para mudar de direção, e a que a NBR 9077:2025 exige em rota de fuga (9.1.12).', 'O patamar ocupa um quadrado de ' + f(R.L) + ' × ' + f(R.L) + ' cm que não é degrau.'],
    'l-leque': ['Dois lances em ângulo reto, com a curva feita por degraus que giram, no lugar do patamar.', 'Ocupa menos área que a versão com patamar, porque a curva já sobe.', R.bal ? 'Os degraus da curva são balanceados: piso igual na linha de caminhamento e ponta de ' + f(ponta, 1) + ' cm na borda interna. Mesmo assim, o app não aceita leque nos perfis NBR 9050 e Rota de fuga. ' + ACESS_CURVA + ' A NBR 9077:2025 proíbe degrau em leque em rota de fuga (9.1.11). Em mezanino ou área privativa ela permite leque (9.5.9.1).' : 'Na forma convergente os leques saem todos do canto interno, com ponta zero. É mais simples de desenhar, mas quem desce pelo lado de dentro pisa em quase nada. A NBR 9077:2001, edição cancelada, pedia leques balanceados (4.7.3.1 c), e o perfil Estudo mantém essa referência.'],
    'u-patamar': ['Dois lances paralelos, de sentidos opostos, ligados por um patamar retangular (volta de 180°).', 'Ocupa menos comprimento: a escada dobra em vez de se esticar. A volta acontece num piso plano.', 'O patamar tem (2 × largura + vão) de comprimento. O vão entre os lances ocupa área e exige guarda-corpo seguro. A NBR 9077:2001 (4.7.2 c), edição cancelada, pedia pelo menos 10 cm entre lances paralelos, para caber a guarda ou o corrimão; use como referência de estudo. Em rota de fuga, o patamar da volta não pode ser mais estreito que o lance (NBR 9077:2025, 9.1.12).'],
    'u-leque': ['Volta de 180° feita por duas curvas de degraus que giram, com pisos retos entre elas.', 'Ocupa menos área que a versão com patamar, porque a volta também sobe.', 'As duas curvas ficam perto uma da outra, então sobram poucos degraus retos para balancear: é comum a ponta não chegar a 15 cm, a não ser que se aumentem a largura ou os pisos do meio. Vão central de ' + f(R.gU || 0, 1) + ' cm. O app não aceita este tipo nos perfis NBR 9050 e Rota de fuga. ' + ACESS_CURVA + ' A NBR 9077:2025 proíbe degrau em leque em rota de fuga (9.1.11).'],
    'c-patamar': ['Três lances ligados por dois patamares quadrados, virando 90° duas vezes para o mesmo lado: o terceiro lance volta paralelo ao primeiro, como um U aberto.', 'Cada lance fica curto, o que ajuda a vencer desníveis grandes com descanso a cada trecho. Contorna um poço ou um vazio central de ' + f(R.nMeioP * R.p) + ' cm entre o primeiro e o último lance.', 'Ocupa mais área que o U com um patamar só, e são dois patamares para mobiliar de corrimão e guarda-corpo. O app pede pelo menos três espelhos em cada lance. Esse mínimo vem da NBR 9077:2001 (4.7.3.2), edição cancelada; a NBR 9050:2020 (6.7.2) manda evitar o degrau isolado.'],
    'z-patamar': ['Três lances ligados por dois patamares quadrados: vira 90° para um lado e depois 90° para o outro, e o último lance sobe paralelo ao primeiro, deslocado.', 'Encaixa em plantas onde a saída fica deslocada da entrada, como uma escada que precisa desviar de uma viga ou de um pilar.', 'É a forma que mais espalha a escada na planta. A linha de caminhamento troca de lado no segundo patamar, porque o lado interno da curva muda. O app pede pelo menos três espelhos em cada lance. Esse mínimo vem da NBR 9077:2001 (4.7.3.2), edição cancelada; a NBR 9050:2020 (6.7.2) manda evitar o degrau isolado.'],
    'helicoidal': [olhoV ? 'Escada em caracol autoportante: os degraus são setores de círculo em volta de um vão vazio no meio, o olho (aqui com Ø ' + f(R.helix ? R.helix.rc * 2 : 0) + ' cm). Não há pilar: quem sustenta a escada é a própria laje helicoidal.' : 'Escada em caracol: os degraus são setores de círculo em volta de um pilar central.', 'Ocupa pouca área em planta: aqui um círculo de ' + f(R.helix ? R.helix.R * 2 : 0) + ' cm de diâmetro.', 'O piso depende do raio: junto ao ' + nomeC + ' ele mede só ' + f(R.helix ? R.helix.rc * rad(R.helix.th) : 0, 1) + ' cm, e a medida vale na linha de caminhamento. A altura livre depende do número de degraus por volta (aqui ' + (R.helix ? R.helix.nPer : '') + '), e a largura costuma ficar abaixo do mínimo de escadas comuns. Em rota de fuga, a NBR 9077:2025 proíbe escada em espiral (9.1.11). No perfil NBR 9050 ela também aparece como "não atende": ' + ACESS_CURVA + ' No acesso a mezanino ou área privativa ela é permitida (9.5.9.1), com largura de pelo menos 80 cm e até 3,7 m de altura. Confirme também no código do seu município.'],
  }[R.tipo];
  h += sec('Sobre o tipo escolhido: ' + tp.nome, dl([['O que é', T[0]], ['Por que usar', T[1]], ['Cuidados', T[2]]]) + (leq ? p('<b>Por que o piso da curva é medido a ' + f(R.dw) + ' cm do lado interno?</b> Num degrau que gira o piso é diferente em cada ponto: curto junto ao canto interno e largo na parte externa. Por isso ele é medido numa linha definida, a linha de caminhamento (a NBR 9077:2001, edição cancelada, chamava de linha de percurso: onde anda quem segura o corrimão do lado de dentro). O perfil usa ' + f(nm.dw) + ' cm a partir do lado interno' + (nm.acess ? ' (NBR 9050:2020, 6.8.6: 0,55 m da borda interna)' : '') + (R.dw < nm.dw ? '; como a escada é estreita, o app usou ' + f(R.dw) + ' cm, o meio da largura. É o que a NBR 9077:2001 (3.32) mandava fazer em escadas com menos de 1,10 m, e o app mantém essa regra como referência' : '') + '.') : '') + (hel ? p('<b>Por que o piso é ' + f(R.p, 1) + ' cm?</b> Cada degrau gira ' + f(R.helix.th, 1) + '° (360° ÷ ' + R.helix.nPer + ' degraus por volta). A linha de caminhamento fica a ' + f(R.dw) + ' cm da borda do ' + nomeC + ', ou seja, no raio de ' + f(R.helix.rc) + ' + ' + f(R.dw) + ' = ' + f(R.helix.rw) + ' cm. O arco nesse raio mede raio × ângulo = ' + f(R.p, 1) + ' cm. ' + (R.helix.nPerAuto ? 'O número de degraus por volta é o maior entre o que dá o piso desejado (' + R.helix.nPref + ') e o que dá a altura livre (' + R.helix.nReq + ')' : 'Você escolheu ' + R.helix.nPer + ' degraus por volta (o automático seria ' + Math.max(R.helix.nPref, R.helix.nReq) + ': ' + R.helix.nPref + ' para o piso desejado, ' + R.helix.nReq + ' para a altura livre)') + '. Conta: ' + f(R.helix.nPer) + ' × ' + f(R.e, 2) + ' − ' + f(R.thk, 1) + ' = ' + f(R.helix.clearance, 1) + ' cm (' + (R.placas ? 'a placa tem ' + f(R.thk, 1) + ' cm' : f(R.thk, 1) + ' cm é o espelho mais a laje helicoidal, medidos na vertical') + ') de altura livre sob a volta de cima. O app não verifica outros obstáculos (vigas, guarda-corpo, forro).') +
    p('<b>Caracol com pilar ou autoportante?</b> Na caracol com pilar, os degraus se apoiam num pilar no meio, e o diâmetro dele pode ser o que o projeto pedir. Na <b>caracol autoportante</b> não há pilar: a laje helicoidal de concreto se sustenta sozinha, apoiada no piso de baixo e na laje de cima, e no meio fica um vão vazio, o <b>olho</b>. Quanto maior o olho, maior fica o degrau na borda de dentro' + (olhoV ? ' (aqui, ' + f(R.helix.rc * rad(R.helix.th), 1) + ' cm com o olho de Ø ' + f(R.helix.rc * 2) + ' cm)' : '') + '. Como a borda de dentro dá para o vão, ela é um lado aberto: pede guarda-corpo e corrimão também desse lado. O app desenha a geometria; o cálculo estrutural da laje helicoidal (espessura, armadura, apoios) é de um engenheiro de estruturas.') : ''), false);

  /* 5. Balanceamento (só nos tipos com leque) */
  if (leq) {
    const lqs = R.polys.filter(q => q.kind === 'leque');
    let corpo = p('Num degrau que gira, a aresta (o bocel) não é paralela às outras. Há dois jeitos de desenhar a curva:') +
      dl([['Convergentes', 'Todas as arestas da curva saem do mesmo ponto, o canto interno. Fácil de traçar, mas a ponta de cada leque fica com largura zero: quem desce pelo lado de dentro pisa em quase nada.'],
        ['Balanceados', 'As arestas são distribuídas por alguns degraus antes e depois da curva, e cada uma passa num ponto diferente da borda interna. A curva "começa" antes do canto e termina depois, e os degraus mudam de forma aos poucos.']]) +
      p('A regra que o app usa vem da NBR 9077:2001, edição cancelada pela de 2025: o piso de todos os degraus é <b>igual na linha de caminhamento</b> (3.32 e 4.7.9.1 b), e a parte mais estreita do degrau na borda interna tem <b>pelo menos 15 cm</b> (4.7.3.1 c). A NBR 9050:2020 repete os 15 cm na Figura 75. A edição de 2025 não ensina a balancear: ela proíbe leque em rota de fuga (9.1.11) e, em mezanino ou área privativa, permite leque sem dar medida para a parte estreita (9.5.9.1). A norma de 2001 falava em usar "um dos sistemas de balanceamento recomendados" pela boa técnica, sem fixar um; existem vários processos gráficos ensinados em desenho técnico.');
    if (R.bal) {
      corpo += p('<b>Como o app faz, com os seus números:</b>') + ol([
        'Marca na linha de caminhamento um ponto a cada <b>' + f(R.p, 1) + ' cm</b>, do primeiro ao último degrau, inclusive dentro da curva. A curva da linha tem raio ' + f(R.dw) + ' cm e mede ' + f(R.dw) + ' × π ÷ 2 = ' + f(R.dw * Math.PI / 2, 1) + ' cm. Ela fica no meio de um trecho de ' + R.kw + ' degraus (' + R.kw + ' × ' + f(R.p, 1) + ' = ' + f(R.kw * R.p, 1) + ' cm); o mínimo é ' + R.kwMin + ' degraus, para o trecho cobrir a curva inteira.',
        'Na borda interna, os degraus retos teriam ' + f(R.p, 1) + ' cm cada, mas o canto "come" o comprimento da curva. Esse comprimento que falta é repartido entre ' + lqs.length + ' degraus em <b>progressão aritmética</b>: o degrau mais perto do canto fica com a borda mais estreita, e cada vizinho ganha um pouco mais, até voltar aos ' + f(R.p, 1) + ' cm dos degraus retos.',
        'O app começa balanceando só os degraus do trecho da curva e vai incluindo um degrau de cada lado até a ponta mais estreita chegar a ' + f(nm.lqMin) + ' cm. Aqui ficaram ' + lqs.length + ' degraus balanceados (do ' + lqs[0].k + ' ao ' + lqs[lqs.length - 1].k + '), e a ponta ficou com <b>' + f(ponta, 1) + ' cm</b>' + (ponta < nm.lqMin - 1e-6 ? ', ainda abaixo do mínimo: faltam degraus retos para repartir' : '') + '. Quando a zona encosta no primeiro ou no último degrau, o app reparte por igual nessa ponta, porque não há degrau reto para onde voltar.',
        'Cada aresta é a reta que liga o ponto da borda interna ao ponto da linha de caminhamento, prolongada até a parede externa.']) +
        p('A tabela mostra a largura de cada degrau balanceado nas três linhas. Na linha de caminhamento todos dão ' + f(R.p, 1) + ' cm: é isso que mantém o ritmo da passada na curva.') +
        tab(['Degrau', 'Borda interna', 'Linha de caminhamento', 'Borda externa'], lqs.map(q => [q.k, f(q.wIn, 1) + ' cm', f(q.wlen, 1) + ' cm', f(q.wOut, 1) + ' cm']));
    } else {
      corpo += p('Esta escada está com leques <b>convergentes</b>: ponta de 0 cm e piso de ' + f(R.dw * rad(90 / R.kw), 1) + ' cm na linha de caminhamento, diferente dos ' + f(R.p, 1) + ' cm dos degraus retos. Troque para <b>Balanceados</b> em "Detalhes do tipo" e compare as duas plantas: essa comparação costuma render boa conversa com o professor.');
    }
    h += sec('Leques balanceados: o que são e como o app desenha', corpo, false);
  }

  /* 6. Tabela de degraus */
  const linhas = R.polys.map(q => [q.k, nivel(q.k * R.e), q.kind === 'patamar' ? 'patamar' : q.kind === 'leque' ? (R.bal ? 'balanceado' : 'leque') : hel ? 'setor' : 'reto', f(q.x1 / 100, 2) + ' m']);
  h += sec('Tabela de degraus (níveis para o perfil e para a obra)',
    p('Cada linha é uma superfície da escada: o nível do piso dela (em metros, a partir do piso de baixo) e a distância acumulada na linha de caminhamento até o fim dela. Use para conferir o perfil e para marcar os degraus na parede durante a obra.') +
    tab(['Nº', 'Nível', 'Tipo', 'Percurso'], linhas) +
    p('O piso superior fica em ' + nivel(R.H) + ', um espelho acima do último degrau (' + R.T + ').'), false);

  /* 7. Roteiro para desenhar à mão: na escala que o professor pediu (S.escalaMao: 1:20, 1:25, 1:50 ou 1:100) */
  const ESC_MAO = [20, 25, 50, 100];
  const esc = ESC_MAO.indexOf(Number(S.escalaMao)) >= 0 ? Number(S.escalaMao) : 50, mm = v => f(v / esc * 10, 1) + ' mm';
  const divEsc = f(esc / 10, 1);
  const seletorEsc = '<div class="seg escMao" role="group" aria-label="Escala do desenho à mão">' + ESC_MAO.map(v => '<button type="button" data-esc-mao="' + v + '"' + (v === esc ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>1:' + v + '</button>').join('') + '</div>';
  const regraEsc = 'Na escala 1:' + esc + ', cada 1 cm do desenho vale ' + esc + ' cm da obra, então divida as medidas reais por ' + divEsc + ' para ter milímetros no papel' + (esc === 25 ? ' (é o mesmo que multiplicar por 0,4)' : esc === 20 ? ' (é o mesmo que multiplicar por 0,5)' : '') + '.';
  const bw = R.bbox[2] - R.bbox[0], bh = R.bbox[3] - R.bbox[1];
  h += sec('Roteiro para desenhar à mão (escala 1:' + esc + ')',
    p('<b>Escala do seu desenho</b> (use a que o professor pediu):') + seletorEsc +
    p(regraEsc + ' Com os seus números: espelho de ' + f(R.e, 2) + ' cm vira ' + mm(R.e) + ', piso de ' + f(R.p, 1) + ' cm vira ' + mm(R.p) + ', e a escada inteira cabe num retângulo de ' + mm(bw) + ' × ' + mm(bh) + '.') +
    p('<b>Perfil</b>') + ol([
      'Trace duas linhas horizontais: o piso de baixo (' + nivel(0) + ') e o piso de cima (' + nivel(R.H) + '), afastadas ' + mm(R.H) + '.',
      'Divida essa altura em ' + R.N + ' partes iguais sem fazer conta de milímetro. Trace uma vertical do nível de baixo ao de cima, no lugar do primeiro espelho. Do pé dessa vertical, trace uma reta inclinada qualquer e marque nela ' + R.N + ' divisões iguais com a régua (por exemplo, de 1 em 1 cm). Ligue a última marca ao topo da vertical e puxe, pelas outras marcas, paralelas a essa ligação. Onde as paralelas cortam a vertical estão as alturas dos ' + R.N + ' espelhos (é a divisão de segmentos pelo teorema de Tales).',
      'Marque na horizontal os pisos de ' + mm(R.p) + ' e desenhe a escadinha. A linha que liga os bocéis (os "narizes") tem a inclinação da escada, ' + f(R.incl, 1) + '°.',
      (R.placas ? 'Desenhe cada degrau como uma placa de ' + f(R.st.espDegrau) + ' cm, sem laje embaixo (o espelho fica aberto), e o corrimão a 92 cm acima da linha dos bocéis' : 'Desenhe a laje da escada por baixo, paralela à linha dos cantos internos (pés dos espelhos), e o corrimão a 92 cm acima da linha dos bocéis') + (nm.acess ? ' (e o segundo a 70 cm)' : '') + '.']) +
    p('<b>Planta</b>') + ol([
      'Desenhe o contorno da escada com a largura de ' + f(R.L) + ' cm (' + mm(R.L) + ').',
      (hel ? 'Trace o círculo externo e o ' + (olhoV ? 'do olho' : 'pilar') + ', e divida a volta em ' + R.helix.nPer + ' fatias de ' + f(R.helix.th, 1) + '° com o transferidor.' : leq && R.bal ? 'Trace a linha de caminhamento a ' + f(R.dw) + ' cm da borda interna, marque nela os pontos a cada ' + mm(R.p) + ' e use a tabela do balanceamento para marcar os pontos da borda interna. Ligue os pares de pontos e prolongue até a parede externa.' : 'Marque os pisos de ' + mm(R.p) + ' ao longo de cada lance.'),
      'Numere os degraus a partir do primeiro (o de baixo) e desenhe a linha de caminhamento com uma bolinha no começo, a seta no fim e a palavra SOBE.',
      'Faça o corte a ' + f(R.zc) + ' cm do piso (o degrau ' + R.kCut + '): o que fica abaixo do plano é traço cheio; o que fica acima é tracejado, e a linha em zigue-zague marca onde a escada foi cortada.',
      'Escreva os níveis (' + nivel(0) + ' e ' + nivel(R.H) + '), as cotas em centímetros e a escala no carimbo.']), false);

  /* 7b. Roteiro da elevação: os números saem da mesma projeção do desenho da aba Cortes › Elevação */
  {
    const ladoE = ['frente', 'direita', 'esquerda', 'fundos'].indexOf(S.ladoElev) >= 0 ? S.ladoElev : 'frente';
    const nomeE = { frente: 'Frente', direita: 'Direita', esquerda: 'Esquerda', fundos: 'Fundos' }[ladoE];
    const cs = elevacaoDe(R, ladoE), Sx = q => (q[0] - cs.P0[0]) * cs.u[0] + (q[1] - cs.P0[1]) * cs.u[1], Dq = q => (q[0] - cs.P0[0]) * cs.n[0] + (q[1] - cs.P0[1]) * cs.n[1];
    const xs = []; R.polys.forEach(pl => pl.pts.forEach(q => xs.push(Sx(q))));
    const x0 = R.hel ? Sx([0, 0]) : Math.round((Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2);
    const X = q => Sx(q) - x0;
    const giro = { frente: 'não precisa girar a planta', direita: 'gire a planta 90° no sentido horário', esquerda: 'gire a planta 90° no sentido anti-horário', fundos: 'gire a planta 180°' }[ladoE];
    const dmin = Math.min.apply(null, R.polys.map(pl => Math.min.apply(null, pl.pts.map(Dq))));
    /* fundo na posição s: o ponto mais baixo do intradorso na fatia do degrau (mesma amostragem do desenho) */
    const fundoEm = (pl, sx) => { const base = [cs.P0[0] + cs.u[0] * sx, cs.P0[1] + cs.u[1] * sx]; let z = pl.top; cortaPoligono(pl.pts, base, cs.u, cs.n).forEach(iv => [iv[0] + 1e-4, (iv[0] + iv[1]) / 2, iv[1] - 1e-4].forEach(d => { z = Math.min(z, R.zBot(pl, [base[0] + cs.n[0] * d, base[1] + cs.n[1] * d])); })); return Math.max(0, z); };
    const veQue = (pl, idx) => {
      if (R.placas) return 'placa';
      if (pl.kind === 'patamar') return 'patamar';
      const sai = idx + 1 < R.polys.length ? R.polys[idx + 1].entry : R.arrival.pts.slice(0, 2);
      const ce = [(pl.entry[0][0] + pl.entry[1][0]) / 2, (pl.entry[0][1] + pl.entry[1][1]) / 2], c2 = [(sai[0][0] + sai[1][0]) / 2, (sai[0][1] + sai[1][1]) / 2];
      const d = ((c2[0] - ce[0]) * cs.n[0] + (c2[1] - ce[1]) * cs.n[1]) / (Math.hypot(c2[0] - ce[0], c2[1] - ce[1]) || 1);
      return d > 0.35 ? 'espelhos' : d < -0.35 ? 'fundo da laje' : 'perfil';
    };
    const linhas = R.polys.map((pl, idx) => {
      const sx = pl.pts.map(Sx), a = Math.min.apply(null, sx), b = Math.max.apply(null, sx);
      const fa = R.placas ? pl.top - R.st.espDegrau : fundoEm(pl, a + 1e-6), fb = R.placas ? pl.top - R.st.espDegrau : fundoEm(pl, b - 1e-6);
      return [pl.k, f(pl.top, 1), f(fa, 1), f(fb, 1), f(a - x0, 1) + ' a ' + f(b - x0, 1), f(Math.min.apply(null, pl.pts.map(Dq)) - dmin, 0), veQue(pl, idx)];
    });
    let corpo = p('Elevação é a escada vista de fora, de um lado, sem cortar nada. Você não precisa imaginar a escada em pé: cada ponto do desenho tem só duas medidas. A <b>horizontal</b> vem da planta, por uma linha de chamada; a <b>altura</b> vem da conta do degrau (número do degrau × ' + f(R.e, 2) + ' cm). Este roteiro usa a vista <b>' + nomeE + '</b>, a que está escolhida em Cortes › Elevação; troque lá e esta seção se refaz com os números do outro lado.') +
      ol([
        'Veja como as vistas ficam na folha. <b>Elevação embaixo da planta</b>: o lado de onde você olha fica virado para baixo, para a elevação; para a vista ' + nomeE + ', ' + giro + ' (a planta do app tem ' + (R.hel ? 'o degrau 1 começando na linha que sai do centro para baixo' : 'o 1º lance subindo para o alto do papel') + '). <b>Planta e elevação lado a lado</b>: não dá para puxar linha de uma para a outra; siga "Lado a lado: medir e copiar", logo depois desta lista.',
        'Na elevação, trace a linha do chão (' + nivel(0) + ') e, acima dela, uma linha fina para cada nível de degrau, de ' + f(R.e, 2) + ' em ' + f(R.e, 2) + ' cm, até ' + nivel(R.H) + '. Para não somar o espelho arredondado, divida a altura por Tales, como no roteiro de desenho à mão.',
        'Leve a posição horizontal de cada canto de degrau para a elevação. Com a elevação embaixo, puxe da planta uma linha de chamada vertical. Lado a lado, meça na planta e copie na elevação. A posição horizontal é a mesma da planta; só a altura muda.',
        R.placas ? 'Cada degrau é uma placa em balanço: um retângulo fino da menor à maior chamada dos cantos, do fundo (' + f(R.st.espDegrau) + ' cm abaixo do topo) até o topo. Entre uma placa e outra o espelho é aberto: não há linha ali.' : 'Desenhe cada lance como um contorno só: em cima, os dentes (o topo de cada degrau, na altura da tabela); embaixo, a face de baixo da laje, ligando o fundo no começo e no fim de cada degrau (duas colunas da tabela). Num lance visto de lado essa linha é inclinada; num patamar, é horizontal. Dentro da laje não há linha entre um degrau e o outro.',
        R.hel ? 'O que fica mais perto de quem olha cobre o que está atrás (coluna Distância: vale o menor). ' + (olhoV ? 'O olho fica entre as duas metades: entre −' + f(R.helix.rc) + ' e +' + f(R.helix.rc) + ' cm não há pilar, e pelo vão você vê os degraus do outro lado da volta.' : 'O pilar fica entre as duas metades: os degraus de trás somem atrás dele, entre −' + f(R.helix.rc) + ' e +' + f(R.helix.rc) + ' cm.') : R.placas ? 'O que fica mais perto de quem olha cobre o que está atrás (coluna Distância: vale o menor). Como as placas são soltas, entre uma e outra você vê o que está atrás da escada.' : 'A última coluna diz o que se vê de cada degrau. <b>Espelhos</b>: o lance sobe para longe de você, então você vê os espelhos de frente; trace uma linha horizontal no topo de cada degrau. <b>Perfil</b>: o lance corre de lado; você vê o dente de cada degrau e a laje inclinada por baixo. <b>Fundo da laje</b>: o lance sobe na sua direção, então você vê só a face de baixo da laje; desenhe só o contorno, sem linhas de degrau. Onde dois lances se sobrepõem no desenho, vale o de menor distância.',
        R.hel ? 'Termine com o corrimão, do lado de fora' + (olhoV ? ' e do lado do olho' : '') + ', 92 cm acima da borda de cada degrau, a faixa da laje do piso de cima (da face de baixo dela até ' + nivel(R.H) + ') e os níveis. Na escala 1:' + esc + ', divida as medidas por ' + divEsc + ' para ter milímetros no papel.' : 'Termine com o corrimão (a ' + (R.nm.acess ? '92 e 70 cm' : '92 cm') + ' acima dos bocéis), a faixa da laje do piso de cima (da face de baixo dela até ' + nivel(R.H) + ') e os níveis. Na escala 1:' + esc + ', divida as medidas por ' + divEsc + ' para ter milímetros no papel.'
      ]) +
      p('<b>Números da vista ' + nomeE + '</b> (cm; a horizontal é medida a partir do ' + (R.hel ? (olhoV ? 'eixo da escada (centro do olho)' : 'eixo do pilar') : 'meio da escada') + ', negativo para a esquerda de quem olha):') +
      tab(['Degrau', 'Topo', 'Fundo no começo', 'Fundo no fim', 'Horizontal', 'Distância', 'Você vê'], linhas);
    /* lado a lado: medir na planta e copiar na elevação, com figuras passo a passo e um canto de exemplo */
    {
      const Ds = []; R.polys.forEach(pl => pl.pts.forEach(q => Ds.push(Dq(q))));
      const Dm = (Math.min.apply(null, Ds) + Math.max.apply(null, Ds)) / 2;
      const Cref = R.hel ? [0, 0] : [cs.P0[0] + cs.u[0] * x0 + cs.n[0] * Dm, cs.P0[1] + cs.u[1] * x0 + cs.n[1] * Dm];
      const pl0 = R.polys[0];
      let P;
      if (R.hel) { const hx = R.helix, a = rad(hx.phi0 + hx.dir * hx.th); P = [hx.R * Math.cos(a), hx.R * Math.sin(a)]; }
      else P = pl0.pts.reduce((m, q) => Math.abs(Sx(q) - x0) > Math.abs(Sx(m) - x0) + 1e-6 ? q : m, pl0.pts[0]);
      const dP = Sx(P) - x0, zP = pl0.top;
      const linhaRef = { frente: 'em pé (vertical no papel)', fundos: 'em pé (vertical no papel)', direita: 'deitada (horizontal no papel)', esquerda: 'deitada (horizontal no papel)' }[ladoE];
      const ladoQ = { frente: 'de baixo', fundos: 'de cima', direita: 'da direita', esquerda: 'da esquerda' }[ladoE];
      const regra = { frente: 'O que está à direita da linha na planta vai para a direita na elevação; à esquerda, para a esquerda.', fundos: 'Aqui o lado inverte: o que está à direita da linha na planta vai para a <b>esquerda</b> na elevação, e vice-versa.', direita: 'O que está acima da linha na planta vai para a direita na elevação; abaixo, para a esquerda.', esquerda: 'O que está abaixo da linha na planta vai para a direita na elevação; acima, para a esquerda.' }[ladoE];
      const ref = R.hel ? 'o centro do ' + nomeC : 'o meio da escada';
      const ex = R.hel ? 'a ponta externa da linha 1 (o fim do degrau 1)' : 'o canto do degrau 1 mais longe da linha';
      const fig = (n, t) => '<figure class="passo"><figcaption><b>' + n + '.</b> ' + t + '</figcaption>' + medirCopiarSVG(R, C, cs, x0, Cref, P, zP, pl0, n) + '</figure>';
      corpo += p('<b>Lado a lado: medir e copiar.</b> Quando a elevação fica ao lado da planta, nenhuma linha passa de uma para a outra. O que passa é a medida: a distância de cada canto até uma linha de referência é a mesma na planta e na elevação. Você mede com o escalímetro numa e marca na outra. Para a vista ' + nomeE + ', quem olha está do lado ' + ladoQ + ' da planta do app.') +
        ol([
          'Na planta, trace uma linha fina passando por ' + ref + ', ' + linhaRef + '. Ela aponta para quem olha. Na elevação, trace a linha do chão, os níveis dos degraus e uma linha em pé no lugar ' + (R.hel ? (olhoV ? 'do eixo (centro do olho)' : 'do eixo do pilar') : 'do meio da escada') + '.',
          'Escolha um canto na planta, por exemplo ' + ex + '. Meça com o escalímetro a distância dele até a linha de referência, reto (formando ângulo de 90° com a linha). Aqui dá <b>' + f(Math.abs(dP), 1) + ' cm</b>.',
          'Na elevação, marque a mesma distância a partir da linha em pé, na altura do topo do degrau desse canto (' + f(zP, 1) + ' cm). ' + regra + ' Em 1:' + esc + ', ' + f(Math.abs(dP), 1) + ' cm viram ' + f(Math.abs(dP) / esc * 10, 1) + ' mm no papel.',
          'Repita com os outros cantos do mesmo degrau, sempre na altura dele, e ligue as marcas. Depois faça o degrau seguinte. Não precisa medir na planta: a coluna Horizontal da tabela acima ' + (R.hel ? '(e as colunas Externa e No ' + nomeC + ', logo abaixo) ' : '') + 'já traz essas distâncias; negativo é à esquerda da linha em pé.'
        ]) +
        '<div class="passos">' + fig(1, 'Uma linha de referência em cada vista.') + fig(2, 'Meça o canto até a linha, na planta.') + fig(3, 'Copie a mesma medida na elevação, na altura do degrau.') + fig(4, 'Faça o mesmo com os cantos do degrau e ligue.') + '</div>';
    }
    if (R.hel) {
      const hx = R.helix, raios = [], norm = a => ((a % 360) + 360) % 360;
      const fm = { frente: ['', 'cos'], fundos: ['−', 'cos'], direita: ['', 'sen'], esquerda: ['−', 'sen'] }[ladoE];
      for (let j = 0; j <= Math.min(R.T, hx.nPer); j++) {
        const ang = hx.phi0 + hx.dir * j * hx.th, a = rad(ang), ext = [hx.R * Math.cos(a), hx.R * Math.sin(a)], inn = [hx.rc * Math.cos(a), hx.rc * Math.sin(a)];
        raios.push([j, f(norm(ang), 1) + '°', f(X(ext), 1), f(X(inn), 1), Dq(ext) - Dq([0, 0]) < 0 ? 'frente' : 'trás']);
      }
      corpo += p('<b>Helicoidal: as linhas de divisa dos degraus.</b> Cada degrau é uma fatia entre duas linhas que saem do centro da planta. A tabela dá a chamada de cada linha na ponta externa (a ' + f(hx.R) + ' cm do centro) e na borda do ' + nomeC + ' (a ' + f(hx.rc) + ' cm). O degrau k fica entre as linhas k − 1 e k. Depois de ' + hx.nPer + ' linhas a volta se repete, ' + f(hx.nPer * R.e, 1) + ' cm acima. O ângulo é medido a partir da direção da direita da planta (0°), girando no sentido anti-horário, de 0° a 360°.') +
        tab(['Linha', 'Ângulo', 'Externa', 'No ' + nomeC, 'Metade'], raios) +
        p('Para conferir sem transferidor, na vista ' + nomeE + ': chamada externa = ' + fm[0] + f(hx.R) + ' × ' + fm[1] + '(ângulo); no ' + nomeC + ' = ' + fm[0] + f(hx.rc) + ' × ' + fm[1] + '(ângulo). O sinal e o seno ou cosseno mudam conforme o lado de onde você olha.');
    }
    corpo += p('<i>O desenho à mão tem que bater com a elevação ' + nomeE + ' da aba Cortes.</i>');
    h += sec('Roteiro para desenhar a elevação (vista ' + nomeE + ')', corpo, false);
  }

  /* 8. Como ler os desenhos */
  h += sec('Como ler a planta, os cortes e o perfil',
    anatomiaSVG(C) +
    dl([
      ['Planta', 'Vista de cima, como se a casa fosse cortada na horizontal. Por convenção de desenho, o plano de corte fica em torno de 1,50 m do piso (a NBR 6492, norma de representação de projetos, não foi conferida para este app); se usar outra altura, informe no desenho (aqui ' + f(R.zc) + ' cm, que dá o degrau ' + R.kCut + '). O que está abaixo do corte e à vista aparece em traço cheio. O que está acima aparece como projeção tracejada. A linha em zigue-zague marca onde a escada foi cortada.'],
      ['Planta do pavimento superior', 'Mostra o piso de cima. A escada só aparece através da abertura da laje, em traço cheio; onde dois trechos se sobrepõem, aparece o de cima.'],
      ['Linha de caminhamento', 'A linha laranja com seta: o caminho que uma pessoa faz ao usar a escada. Na planta do pavimento inferior a seta aponta para onde sobe e "SOBE" fica no primeiro degrau, com o nível ' + nivel(0) + '. Na planta do pavimento superior o app marca "DESCE", com a seta no sentido da descida.' + (leq && R.bal ? ' A marca "ponta" mostra o degrau mais estreito na borda interna.' : '')],
      ['Perfil desenvolvido', 'Não é um corte A-A da edificação: é um esquema da escada esticada ao longo da linha de caminhamento, então curvas e leques viram trecho reto. Serve para ver a sequência de espelhos, ' + (R.placas ? 'as placas dos degraus em balanço' : 'a laje da escada') + ', a altura livre (tracejado laranja) e o corrimão' + (nm.acess ? ' a 92 e 70 cm, prolongado 30 cm nas pontas (NBR 9050:2020, 6.9.3.2)' : ' a 92 cm') + ', medido a partir do bocel dos degraus. Para ver a escada como ela é cortada de verdade, use os cortes A-A e B-B.'],
      ['Cortes A-A e B-B', 'Corte é um plano vertical que atravessa a edificação. Na planta ele aparece como uma linha de traço e ponto, com as letras nas pontas e setas que mostram para onde se olha. No desenho do corte, o que o plano atravessa (degraus, laje da escada, laje do piso de cima, chão) aparece hachurado e com traço grosso; o que está além do plano aparece em vista, com traço fino; o que fica atrás de quem olha não aparece. ' + (R.hel ? 'Na helicoidal, A-A e B-B passam pelo centro do ' + nomeC + ', um perpendicular ao outro' : 'O A-A passa ao longo do 1º lance e o B-B atravessa esse lance') + '; você pode deslocar cada linha. Repare na laje de cima: onde a escada passa, ela é interrompida pela abertura.'],
      ['Elevação', 'A escada vista de fora, de um dos lados, sem cortar nada: tudo em traço fino, sem hachura. Mostra contornos e alturas (espelhos, corrimão, patamares). ' + (R.placas ? 'Com degraus em balanço, cada placa aparece solta, e entre uma e outra se vê o que está atrás.' : 'Vista de lado, aparece o contorno da laje por baixo dos degraus; vista de frente, a laje fica escondida atrás dos degraus.') + ' Só o corte mostra o que é atravessado, hachurado. Na aba Cortes você escolhe o lado: frente, direita, esquerda ou fundos.'],
      ['Estrutura: laje maciça ou degraus em balanço', 'Na laje maciça, os degraus se apoiam numa laje de concreto (inclinada nos lances, horizontal nos patamares e helicoidal na caracol), e o espelho é fechado. Nos degraus em balanço, cada degrau é uma placa presa só de um lado (na parede, numa viga lateral ou no pilar central); embaixo não há laje e o espelho fica aberto. Na caracol autoportante (centro vazio) não há pilar onde prender as placas: só a laje helicoidal serve, e ela se sustenta sozinha, apoiada no piso de baixo e na laje de cima. A NBR 9050:2020 (6.7.1) não admite espelho vazado em rota acessível, e a NBR 9077:2025 define o degrau com espelho não vazado (3.11); por isso degrau em balanço não serve em rota de fuga. O cálculo da estrutura (armadura, engaste) não é feito pelo app.'],
      ['Detalhe', 'Ampliação de poucos degraus, com as medidas do espelho, do piso, do bocel e ' + (R.placas ? 'da placa' : 'da laje') + ', para mostrar o que a escala da planta não deixa ler.'],
      ['Cotas', 'Todas em centímetros. Níveis em metros: ' + nivel(0) + ' é o piso de baixo e ' + nivel(R.H) + ' o de cima.'],
      ['3D', 'Modelo para enxergar o conjunto: ' + (R.placas ? 'degraus em balanço (placas soltas, sem laje)' : R.hel ? 'degraus sobre a laje helicoidal' : 'degraus com a face de baixo da laje inclinada de verdade e patamares') + (R.hel ? (olhoV ? ', o olho vazio no meio e corrimão do lado de fora e do lado do olho' : ', pilar e corrimão do lado de fora') : ' e corrimãos') + '. Não mostra armadura, revestimento nem acabamentos. Gire arrastando.']
    ]), false);

  /* 9. Erros comuns */
  h += sec('Erros comuns na prancha',
    ul([
      '<b>Contar pisos em vez de espelhos.</b> Uma escada com ' + R.N + ' espelhos tem ' + R.T + ' superfícies: o piso de cima não é degrau.',
      '<b>Arredondar o espelho e esquecer de conferir.</b> Se você arredondar ' + f(R.e, 2) + ' cm para ' + f(Math.round(R.e), 0) + ' cm, a soma vira ' + R.N + ' × ' + f(Math.round(R.e), 0) + ' = ' + f(R.N * Math.round(R.e), 0) + ' cm' + (Math.abs(R.N * Math.round(R.e) - R.H) > 1e-6 ? ', e não ' + f(R.H) + ' cm: o último degrau sai diferente dos outros, que é justamente o que provoca tropeço.' : ', que por acaso fecha o desnível.'),
      '<b>Medir o desnível na laje bruta.</b> O desnível vale de piso acabado a piso acabado.',
      '<b>Chamar o perfil de corte A-A.</b> Corte A-A precisa da linha de corte marcada na planta, com letras e setas.',
      '<b>Esquecer a altura livre.</b> Sem abrir a laje de cima, a cabeça bate a partir de um certo degrau.' + (R.opening && R.kc ? ' Aqui, a partir do degrau ' + R.kc + '.' : ''),
      '<b>Leque saindo todo do canto.</b> Ponta zero na borda interna deixa quem desce pelo lado de dentro sem onde pisar; balanceie. A referência de 15 cm é da NBR 9077:2001 (4.7.3.1 c), edição cancelada, e a NBR 9050:2020 repete na Figura 75. Em rota de fuga, a NBR 9077:2025 nem permite leque (9.1.11).',
      '<b>Patamar de canto menor que a largura.</b> Na mudança de direção o patamar tem pelo menos a largura da escada (NBR 9050:2020, 6.8.8). Em rota de fuga, a NBR 9077:2025 diz o mesmo e proíbe degrau no patamar (9.1.12).',
      '<b>Lance com um ou dois degraus.</b> A NBR 9050:2020 (6.7.2) manda evitar o degrau isolado. A NBR 9077:2001 (4.7.3.2), edição cancelada, pedia pelo menos três, e o app usa esse mínimo.',
      '<b>Medir o corrimão a partir do piso do degrau.</b> As normas medem a partir do bocel, a linha dos narizes.'
    ]), false);

  /* 10. Vocabulário */
  h += sec('Vocabulário',
    dl([
      ['Espelho', 'Parte vertical do degrau. Seu tamanho é a altura de cada passo (e). Na NBR 9077:2025 o degrau é a pisada mais o espelho, e o espelho não pode ser vazado (3.11). A edição de 2001, cancelada, chamava a altura do espelho de h.'],
      ['Piso', 'Parte horizontal onde se pisa. A profundidade p é medida entre as projeções de dois bocéis seguidos. A NBR 9077:2025 chama de pisada (3.11); a edição de 2001, cancelada, chamava de largura do degrau (b).'],
      ['Bocel (nariz)', 'Borda do degrau que avança sobre o espelho de baixo. O avanço não se soma ao piso p. A NBR 9077:2001 (4.7.3.1 e), edição cancelada, pedia bocel de pelo menos 1,5 cm, ou, sem bocel, balanço da quina do degrau sobre o de baixo com esse mesmo mínimo; pela nota do item 3.10 dela, sem bocel o espelho era obrigatoriamente inclinado. A NBR 9050:2020 (6.7.1) limita o avanço a no máximo 1,5 cm. As duas juntas davam exatamente 1,5 cm, e o app ainda usa esse mínimo. A edição de 2025 não fixa bocel: manda seguir a NBR 9050 nos degraus (9.1.10). Nesta escada: ' + (R.placas ? (R.bocel === 'sem' ? 'placas sem sobreposição' : 'cada placa avança ' + f(R.avanco, 2) + ' cm sobre a de baixo') : R.bocel === 'sem' ? 'espelho reto, sem saliência' : (R.bocel === 'inclinado' ? 'espelho inclinado, com a quina avançando ' : 'bocel de ') + f(R.avanco, 2) + ' cm') + '.'],
      ['Lance (lanço)', 'Trecho contínuo de degraus entre dois patamares, ou entre um piso e um patamar. Pela NBR 9077:2001 (3.30), edição cancelada, um lance tinha no mínimo três degraus e subia no máximo 3,70 m; o app usa o mínimo de três como referência. A NBR 9050:2020 (6.8.7) pede patamar a cada 3,20 m de desnível.'],
      ['Patamar', 'Piso plano no início, no fim ou entre lances. Interrompe a continuidade do lance e oferece uma superfície para circulação e descanso; também é onde a escada pode mudar de direção.'],
      ['Degrau em leque (ingrauxido)', 'Degrau mais estreito de um lado, usado para fazer a escada virar sem patamar. "Ingrauxido" é o termo da NBR 9077:2001, edição cancelada. A edição de 2025 proíbe degrau em leque em rota de fuga (9.1.11) e permite no acesso a mezanino ou área privativa (9.5.9.1).'],
      ['Balanceamento', 'Distribuir a curva por vários degraus para que o piso fique igual na linha de caminhamento e a ponta interna não fique estreita demais.'],
      ['Linha de caminhamento (linha de percurso)', 'Linha imaginária por onde anda quem segura o corrimão do lado de dentro. A NBR 9077:2001 (3.32), edição cancelada, punha essa linha a 0,55 m da borda e, em escadas com menos de 1,10 m de largura, no eixo. A NBR 9050:2020 (6.8.6) também usa 0,55 m da borda interna nos lances curvos. É nela que se mede o piso de degraus que não são retangulares.'],
      ['Fórmula de Blondel', '2e + p = ' + f(nm.bMin) + ' a ' + f(nm.bMax) + ' cm. Relação empírica entre a altura do espelho e a profundidade do piso, usada para avaliar a passada. Leva o nome de François Blondel, arquiteto e engenheiro francês do século XVII.'],
      ['Altura livre', 'Distância vertical entre a superfície de apoio (o piso do degrau) e a face de baixo do obstáculo superior mais próximo.'],
      ['Abertura (vão) na laje', 'Recorte na laje do piso superior onde a escada passa, necessário quando o teto ficaria baixo sobre os degraus.'],
      ['Guarda-corpo', 'Barreira nos lados abertos, contra quedas. Nas escadas de rota de fuga, a NBR 9077:2025 pede guarda-corpo nos lados abertos, conforme a NBR 14718 (9.1.4), que não foi conferida para este app. A edição de 2001, cancelada, dava 1,05 m nos patamares, podendo baixar para 92 cm em escadas internas, medida a partir da linha dos bocéis (4.8.1.2); se fosse vazado, uma esfera de 15 cm não podia passar (4.8.1.4 a).'],
      ['Corte e planta', 'Planta é um corte horizontal visto de cima. Corte é um corte vertical, indicado na planta por uma linha com letras (A-A, B-B) e setas no sentido do olhar. O perfil desenvolvido deste app é outra coisa: um esquema do percurso esticado.'],
      ['Poché (hachura de corte)', 'Preenchimento dos elementos atravessados pelo plano de corte, para separar o que é cortado do que é visto.'],
      ['Cota', 'Número que indica uma medida ou altura no desenho.'],
      ['Desnível', 'Diferença de altura entre os dois pisos que a escada liga.']
    ]), false);

  /* 11. Normas */
  h += sec('Sobre as normas e limites deste app',
    p('Perfil usado agora: <b>' + nm.nome + '</b>. Espelho ' + f(nm.eMin) + ' a ' + f(nm.eMax) + ' cm, piso ' + f(nm.pMin) + ' a ' + f(nm.pMax) + ' cm, Blondel ' + f(nm.bMin) + ' a ' + f(nm.bMax) + ' cm, largura mínima ' + f(nm.Lmin) + ' cm, ' + (nm.mez ? 'altura percorrida até ' + f(nm.hTot) + ' cm (sem exigência de patamar no lance reto)' : 'desnível máximo sem patamar ' + f(nm.hPat) + ' cm') + ', linha de caminhamento a ' + f(nm.dw) + ' cm do lado interno, ponta mínima de leque ' + f(nm.lqMin) + ' cm.') +
    (nm.mez ? p('<b>Atenção a este perfil.</b> Nas medidas da escada, a 9.5.9.1 só fixa a largura (80 cm), a altura percorrida (3,7 m) e o patamar da escada curva (80 cm). Os outros números acima (espelho, piso, Blondel, lance mínimo, ponta do leque) não vêm dela: são os do perfil Estudo, usados como referência. Por isso, fora deles, o item aparece como <b>atenção</b>, e não como "não atende".') + p('<b>Corrimão neste perfil.</b> A 9.5.9.1 d pede corrimão e diz que basta de um lado quando a largura é menor que 1,20 m. O app desenha só o corrimão a 92 cm, sem o segundo a 70 cm e sem o prolongamento de 30 cm nas pontas: esses vêm da NBR 9050:2020 (6.9.3.2), para rota acessível. O diâmetro segue a NBR 9050, porque a NBR 9077:2025 define o corrimão conforme ela (3.10). Confirme com quem aprova o projeto.') : '') +
    (nm.fuga ? p('Neste perfil, os números do degrau, do patamar e da largura são os da NBR 9050:2020, porque a NBR 9077:2025 manda seguir a NBR 9050 (9.1.10).') : '') +
    p('<b>Qual NBR 9077 vale?</b> A NBR 9077 é a norma de saídas de emergência. Rota de fuga, ou rota de saída, é o caminho contínuo, sem obstáculo, que leva as pessoas a um local seguro (3.34). A terceira edição saiu em 16/07/2025. O Prefácio diz que ela cancela e substitui a edição de 2001. Houve um prazo de transição: projetos protocolados na prefeitura (ou no órgão que aprova a obra) até 365 dias depois, ou seja, até 16/07/2026, ainda podiam seguir a de 2001. Hoje, projeto novo segue a de 2025. O app foi conferido no texto da edição de 2025 em 17/11/2026.') +
    p('<b>Escada de rota de fuga pela NBR 9077:2025 (perfil "Rota de fuga").</b> A norma nova não tem tabela própria de espelho, piso ou Blondel. Ela manda seguir a NBR 9050 nos degraus, patamares e larguras (9.1.10). Por isso o perfil usa os números da NBR 9050:2020: espelho de 16 a 18 cm, piso de 28 a 32 cm, Blondel de 63 a 65 cm. O que a norma de 2025 pede para a escada:') +
    ul([
      '<b>Sem degraus em leque e sem escada em espiral</b> (9.1.11). Por isso, neste perfil, os tipos com leque e a helicoidal aparecem como "não atende".',
      '<b>Mudança de direção só com patamar</b> (9.1.12). O patamar não pode ser mais estreito que o lance e não pode ter degrau.',
      '<b>Corrimão dos dois lados</b>, conforme a NBR 9050 (9.1.5).',
      '<b>Degrau com espelho fechado.</b> A norma define o degrau como pisada mais espelho não vazado (3.11). Degrau em balanço, com o espelho aberto, não serve.',
      '<b>Altura livre.</b> Pé-direito de pelo menos 2,30 m; embaixo de viga, verga de porta e outros obstáculos, 2,10 m livres (4.2 b).',
      '<b>Largura.</b> A 9.4.2.2 manda usar a largura mínima da NBR 9050, a não ser que a conta pela população do prédio (9.4.2.1, Tabela 10) dê mais; o app não faz essa conta. O único número da NBR 9050 para escada é 1,20 m, e ele é para rota acessível (6.8.3): o app adota esse valor também na rota de fuga. A largura é medida no ponto mais estreito. O corrimão pode avançar até 10 cm de cada lado sem obrigar a alargar a escada; o guarda-corpo, não (9.4.1 d).',
      '<b>Altura livre no app.</b> O perfil confere se a altura livre pedida é de pelo menos 2,10 m (4.2 b). O pé-direito de 2,30 m do ambiente não é conferido.',
      '<b>O que o app não confere:</b> material incombustível (9.1.3), guarda-corpo nos lados abertos (9.1.4), iluminação e sinalização de emergência (9.1.7) e piso antiderrapante (9.1.8).'
    ]) +
    p('<b>Perfil "Mezanino ou área privativa" (NBR 9077:2025, 9.5.9.1).</b> Pela definição da norma (3.26), mezanino é um piso intermediário entre o piso e o teto de um ambiente ou pavimento, ligado a ele por escada ou rampa aberta. Área privativa não tem definição no trecho conferido: confirme com o código local o que conta como tal. No acesso a esses lugares, a norma permite escada em leque, em espiral ou de lances retos, desde que:') +
    ol([
      'a população seja menor que 20 pessoas e a escada suba no máximo 3,7 m (alínea a);',
      'a largura seja de pelo menos 0,80 m (b);',
      'o piso seja antiderrapante, com coeficiente de atrito dinâmico de pelo menos 0,5, conforme a NBR 15575 ou norma internacional (c). O coeficiente de atrito diz quanto o piso segura o pé;',
      'tenha corrimão; com largura menor que 1,20 m, basta corrimão de um lado (d);',
      'tenha guarda-corpo nos lados abertos (e);',
      'atenda ao Anexo A, o sistema de abandono do prédio (responsáveis, treinamento, documentos); e escadas curvas e em leque tenham patamares de pelo menos 0,80 m de comprimento (f).'
    ]) +
    p('O app confere a altura (a) e a largura (b) e avisa sobre os patamares da escada curva (f). Os outros itens dependem do projeto e aparecem como "atenção". A 9.5.9.1 não fixa espelho, piso, Blondel nem a parte estreita do leque. Nesses números o perfil usa os valores do perfil Estudo, como referência.') +
    p('<b>Perfil Estudo.</b> Serve para aprender e para trabalhos de faculdade, não para aprovar projeto. Alguns números dele vêm da NBR 9077:2001, a edição cancelada: Blondel de 63 a 64 cm (4.7.3.1 b), ponta de leque de pelo menos 15 cm (4.7.3.1 c), linha de caminhamento a 55 cm, ou no eixo em escada com menos de 1,10 m (3.32), lance de no mínimo 3 degraus (4.7.3.2) e a fórmula do patamar (2e + p) × n + p (4.7.3.3 a). Por que ainda usar? Esses números foram a regra por muitos anos, aparecem nas apostilas e nos livros, e ensinam o raciocínio de uma escada confortável: degraus iguais, passada constante e curva sem ponta estreita. A NBR 9050:2020, que segue valendo, tem números parecidos (Blondel de 63 a 65 cm; ponta de 15 cm na Figura 75). O piso a partir de 25 cm é valor comum em apostilas e códigos de obras, mas <b>não tem fonte nacional</b>. A largura de 80 cm aparece na NBR 9077:2025, mas só para mezanino e área privativa (9.5.9.1 b), e os 3,20 m sem patamar vêm da NBR 9050:2020 (6.8.7), para rota acessível; o perfil Estudo usa esses números como referência, também fora desses casos. Troque pelos valores que o professor ou o código da cidade indicarem, em "Personalizada".') +
    p('<b>NBR 9050:2020 (acessibilidade), versão corrigida de 25/01/2021.</b> Conferida no texto da norma em 16/11/2026. Item 6.8.2: espelho de 0,16 a 0,18 m, piso de 0,28 a 0,32 m, 0,63 ≤ p + 2e ≤ 0,65 m, dimensões constantes em toda a escada. 6.8.3: largura mínima de 1,20 m em rotas acessíveis. 6.8.6: lances curvos seguem a NBR 9077 (quando a NBR 9050 foi escrita, valia a edição de 2001), com pisos e espelhos conforme 6.8.2 a 0,55 m da borda interna (Figura 75, com ponta ≥ 0,15 m). 6.8.7: patamar a cada 3,20 m de desnível e sempre que houver mudança de direção. 6.8.8: patamar entre lances com pelo menos 1,20 m; na mudança de direção, igual à largura. 6.9.3.2: corrimãos dos dois lados, a 0,92 e 0,70 m, prolongados 0,30 m nas pontas. O app faz só uma <b>conferência dimensional parcial</b>: passar nele não quer dizer que a escada é acessível (faltam sinalização, piso tátil, guia de balizamento, rampa associada e outros itens).') +
    p('<b>Bombeiros e prefeitura.</b> Além da NBR 9077, cada estado tem a instrução técnica do Corpo de Bombeiros, e cada cidade tem o código de obras. Eles podem pedir mais do que o app confere. O app não valida escada de emergência: confere só parte das dimensões.') +
    p('O app calcula geometria e confere parte dos limites. Ele não faz dimensionamento estrutural, guarda-corpo, sinalização, piso tátil nem escolha de material.'), false);

  /* 11b. Problemas comuns (norma x prática) e como os profissionais resolvem */
  const pc = typeof problemasHTML === 'function' ? problemasHTML(R) : '';
  if (pc) h += sec('Problemas comuns e como os profissionais resolvem', pc, false);

  /* 12. Perguntas */
  const pergs = [
    ['Por que há um piso a menos que espelhos?', 'Porque o último espelho termina no piso do andar de cima. Esse piso já existe e não é degrau da escada. Aqui são ' + R.N + ' espelhos e ' + R.T + ' superfícies entre eles: ' + R.contagem + '.'],
    ['Por que dividir o desnível por um número inteiro?', 'Para todos os espelhos serem iguais. Uma diferença de poucos milímetros entre degraus já faz as pessoas tropeçarem, porque o corpo se acostuma com o ritmo. A NBR 9077:2001 (4.7.3.1 d), edição cancelada, aceitava no máximo 5 mm de diferença entre lances; a NBR 9050:2020 (6.8.2) pede dimensões constantes em toda a escada.'],
    ['De onde vem a fórmula 2e + p?', 'É associada ao arquiteto François Blondel, do século XVII. É uma relação empírica entre espelho e piso, usada para avaliar se a passada na escada fica confortável. Evite dizer que ela prova que subir custa o dobro de andar: isso é uma leitura comum, não uma lei demonstrada.'],
    ['Por que não fazer o piso maior para a escada ficar mais suave?', 'Porque a escada fica comprida e o passo passa do conforto: com piso grande demais a pessoa precisa esticar o passo. No gráfico de Blondel, o ponto sairia da faixa inclinada.'],
    ['Quando uso patamar?', nm.mez ? 'No perfil Mezanino o limite é outro: a NBR 9077:2025 (9.5.9.1 a) admite esta escada só até 3,7 m de altura percorrida, e não pede patamar no lance reto dentro desse limite. Acima de 3,7 m o patamar não resolve: a escada sai da 9.5.9.1 e passa a seguir a regra de rota de fuga. A 9.5.9.1 f pede patamares de 0,80 m nas escadas curvas e em leque. Aqui a altura é ' + f(R.H) + ' cm' + (R.H > nm.hTot + 1e-6 ? ', acima de 3,7 m.' : ', dentro do limite.') : 'Quando o desnível passa do máximo sem patamar (no perfil atual, ' + f(nm.hPat) + ' cm) e, pela NBR 9050, também nas mudanças de direção. Aqui o desnível é ' + f(R.H) + ' cm' + (R.H > nm.hPat ? ', maior que o limite, então o patamar é obrigatório.' : ', menor que o limite, então o patamar não é obrigatório por essa regra.')],
    ['Qual o tamanho certo do patamar reto?', 'A NBR 9077:2001 (4.7.3.3), edição cancelada, dava a fórmula (2e + p) × n + p, em que n é o número de passos dados no patamar (1, 2 ou 3); o app usa como referência de estudo. Com os seus números: ' + f(2 * R.e + 2 * R.p, 0) + ' cm para um passo. A NBR 9050:2020 (6.8.8) pede pelo menos 120 cm, e é ela que vale em rota de fuga (NBR 9077:2025, 9.1.10). Na mudança de direção, o patamar tem no mínimo a largura da escada (NBR 9050:2020, 6.8.8; NBR 9077:2025, 9.1.12).'],
    ['Qual a vantagem do leque sobre o patamar?', 'Ocupa menos área em planta. A desvantagem é o piso estreito perto do lado interno, que o balanceamento ameniza. Em rota acessível o app não aceita leque. ' + ACESS_CURVA],
    ['O que é balancear os leques?', 'É distribuir a curva por vários degraus, para que todos tenham o mesmo piso na linha de caminhamento e a ponta interna fique com pelo menos 15 cm. Esse número é da NBR 9077:2001 (4.7.3.1 c), edição cancelada, e a NBR 9050:2020 repete na Figura 75. Em rota de fuga a NBR 9077:2025 não permite leque (9.1.11).' + (leq && R.bal ? ' Nesta escada, ' + R.nLeque + ' degraus foram balanceados e a ponta ficou com ' + f(ponta, 1) + ' cm.' : '')],
    ['Por que a linha de caminhamento fica a ' + f(R.dw) + ' cm da borda?', 'As normas põem essa linha a 55 cm da borda interna, a distância de quem anda segurando o corrimão do lado de dentro (NBR 9077:2001, 3.32, edição cancelada; NBR 9050:2020, 6.8.6). Em escadas com menos de 1,10 m de largura, a edição de 2001 mandava usar o eixo, e o app segue essa regra.' + (R.dw < 55 - 1e-9 ? ' Aqui a escada tem ' + f(R.L) + ' cm' + (R.hel ? ' de largura útil' : '') + ', então a linha ficou ' + (R.dw < nm.dw - 1e-9 ? 'no eixo, a ' + f(R.dw) + ' cm.' : 'a ' + f(R.dw) + ' cm, o valor do perfil escolhido.') : '')],
    ['A área em planta é a área da escada?', R.hel ? 'Na helicoidal, a área ocupada é o círculo de Ø ' + f(R.helix.R * 2, 0) + ' cm (' + f(R.areaOcup / 10000, 2) + ' m²). A soma dos pisos dos degraus (' + f(R.quant.aPisos / 10000, 2) + ' m²) pode ser maior, porque com mais de uma volta os degraus ficam uns sobre os outros em planta.' : 'O app mostra duas coisas: o retângulo envolvente (' + f((R.bbox[2] - R.bbox[0]) / 100, 2) + ' × ' + f((R.bbox[3] - R.bbox[1]) / 100, 2) + ' m) e a área que a escada ocupa de fato (' + f(R.areaOcup / 10000, 2) + ' m²), que é a soma dos degraus e patamares.'],
    ['Por que a laje do andar de cima é aberta?', 'Para manter a altura livre. Se a laje continuasse inteira por cima dos últimos degraus, a cabeça de quem sobe bateria nela.' + (R.kc && R.opening ? ' A abertura começa no degrau ' + R.kc + ' nesta escada.' : '')],
    ['Por que o app ainda cita a NBR 9077:2001, se ela foi cancelada?', 'Porque a edição de 2025 não tem números de degrau: ela manda seguir a NBR 9050 (9.1.10). Os números da edição de 2001 (Blondel, ponta do leque, linha de caminhamento, fórmula do patamar) continuam bons para aprender a desenhar uma escada confortável, e o app sempre diz quando usa um deles. Em projeto de rota de fuga valem a NBR 9077:2025 e a NBR 9050.'],
    ['Esta escada atende às normas?', (ruins.length ? 'Não no perfil escolhido: há itens que não atendem (veja a lista).' : atencao.length ? 'Os itens conferidos não reprovam, mas há pontos em atenção que o app não valida.' : 'Nenhum item ficou fora do limite.') + ' O app confere só parte das exigências; quem decide é o texto da norma vigente e o código do município.'],
    ['O perfil é um corte A-A?', 'Não. O perfil desenvolvido é a escada esticada ao longo da linha de caminhamento, para mostrar a sequência de espelhos e a altura livre. O corte A-A é um plano vertical de verdade, marcado na planta; em escadas com curva ele mostra partes da escada em vista, além do plano.'],
    ['Por que no corte alguns degraus aparecem hachurados e outros não?', 'Hachurado é o que o plano de corte atravessa. Os outros degraus estão além do plano e aparecem em vista, como numa fachada. Os que ficam atrás de quem olha não aparecem.']
  ];
  h += sec('Perguntas que o professor pode fazer', '<dl>' + pergs.map(x => '<dt>' + x[0] + '</dt><dd>' + x[1] + '</dd>').join('') + '</dl>', false);

  return h;
}
