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

function explicacao(R, S, C) {
  const nm = R.nm, f = fmt, hel = R.hel, tp = TIPOS.find(x => x.id === R.tipo);
  const leq = R.tipo === 'l-leque' || R.tipo === 'u-leque';
  const nomeEsc = 'escada ' + tp.nome.toLowerCase().replace(/^em l /, 'em L ').replace(/^em u /, 'em U ');
  const nMin = Math.ceil(R.H / nm.eMax - 1e-9), nMax = Math.floor(R.H / nm.eMin + 1e-9);
  const sec = (titulo, corpo, aberto) => '<details class="ex"' + (aberto ? ' open' : '') + '><summary>' + titulo + '</summary><div class="exb">' + corpo + '</div></details>';
  const p = x => '<p>' + x + '</p>';
  const ul = a => '<ul>' + a.map(x => '<li>' + x + '</li>').join('') + '</ul>';
  const dl = a => '<dl>' + a.map(x => '<dt>' + x[0] + '</dt><dd>' + x[1] + '</dd>').join('') + '</dl>';
  const ol = a => '<ol>' + a.map(x => '<li>' + x + '</li>').join('') + '</ol>';
  const tab = (cab, linhas) => '<div class="tabwrap"><table class="tab"><thead><tr>' + cab.map(c => '<th>' + c + '</th>').join('') + '</tr></thead><tbody>' + linhas.map(l => '<tr>' + l.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  const ruins = R.checks.filter(c => c.status === 'bad'), atencao = R.checks.filter(c => c.status === 'warn');
  const ponta = leq ? Math.min.apply(null, R.polys.filter(q => q.kind === 'leque').map(q => q.wIn)) : 0;
  let h = '';

  /* 1. Resumo para falar */
  const comp = !hel && R.tipo === 'reta' ? ' Em linha reta ela ocupa ' + f(R.T * R.p / 100, 2) + ' m de comprimento.' : '';
  h += sec('Resumo para abrir a apresentação',
    p('Esta é uma <b>' + nomeEsc + '</b> que vence um desnível de <b>' + f(R.H) + ' cm</b> entre um piso e o outro, com <b>' + f(R.L) + ' cm</b> de largura útil. Ela tem <b>' + R.N + ' espelhos de ' + f(R.e, 2) + ' cm</b> e, entre eles, <b>' + R.contagem + '</b>' + (R.nReto || R.nLeque ? ', com piso de <b>' + f(R.p, 1) + ' cm</b>' + (hel ? ' na linha de caminhamento' : R.nLeque && R.bal ? ' em todos os degraus, medido na linha de caminhamento' : R.nLeque ? ' nos trechos retos' : '') : '') + '. A conta de conforto de Blondel dá <b>' + f(R.bl, 1) + ' cm</b> (referência de ' + f(nm.bMin) + ' a ' + f(nm.bMax) + ' cm) e a inclinação fica em <b>' + f(R.incl, 1) + '°</b>.' + comp) +
    (leq && R.bal ? p('Os degraus da curva são <b>balanceados</b>: em vez de saírem todos do canto, eles giram aos poucos, e a parte mais estreita fica com <b>' + f(ponta, 1) + ' cm</b> na borda interna.') : '') +
    p('Na lista de verificações, ' + (ruins.length ? 'há ' + ruins.length + ' item(ns) que <b>não atendem</b> ao perfil escolhido (' + ruins.map(c => c.nome.toLowerCase()).join('; ') + '): vale explicar quais são e o que ajustaria para corrigir.' : atencao.length ? 'nenhuma das verificações implementadas reprovou, mas há itens em <b>atenção</b> que o app não consegue validar: vale explicar cada um.' : 'os itens que o app confere atendem ao perfil escolhido (' + nm.curto + ').') + ' Lembre que o app confere só parte das exigências de uma escada.'), true);

  /* 2. Passo a passo */
  const passos = [];
  passos.push('<b>Desnível (H).</b> É a altura de um piso acabado até o outro piso acabado: <b>' + f(R.H) + ' cm</b>. Toda a escada existe para vencer essa altura em degraus iguais. Meça sempre de piso <i>acabado</i> a piso <i>acabado</i>: o contrapiso e o revestimento mudam a conta.');
  passos.push('<b>Número de espelhos (N).</b> O espelho é a parte vertical do degrau. Como o perfil limita o espelho entre ' + f(nm.eMin) + ' e ' + f(nm.eMax) + ' cm, o número de espelhos precisa estar entre H ÷ ' + f(nm.eMax) + ' = ' + f(R.H / nm.eMax, 2) + ' (arredonda para cima: ' + nMin + ') e H ÷ ' + f(nm.eMin) + ' = ' + f(R.H / nm.eMin, 2) + ' (arredonda para baixo: ' + nMax + '). O app testa cada número dessa faixa e escolhe o que deixa o espelho mais perto de 17,5 cm' + (hel ? '' : ', desde que exista um piso que atenda ao mesmo tempo o limite de piso e o de Blondel') + ': <b>' + R.nSug + '</b>' + (S.nAuto ? '.' : '; você definiu <b>' + R.N + '</b>.'));
  passos.push('<b>Altura do espelho (e).</b> e = H ÷ N = ' + f(R.H) + ' ÷ ' + R.N + ' = <b>' + f(R.e, 2) + ' cm</b>. Dividir o desnível por um número inteiro garante que todos os espelhos sejam iguais, que é o que evita tropeço. ' + (Math.abs(Math.round(R.e * 100) / 100 * R.N - R.H) < 1e-6 ? 'Confira: ' + R.N + ' × ' + f(R.e, 2) + ' = ' + f(R.H) + ' cm, exatamente o desnível.' : 'Aqui a divisão não é exata: o espelho vale ' + f(R.e, 4) + '… cm. Se você usar ' + f(R.e, 2) + ' cm, a soma dá ' + R.N + ' × ' + f(R.e, 2) + ' = ' + f(Math.round(R.e * 100) / 100 * R.N, 2) + ' cm, e não ' + f(R.H) + ' cm. Por isso, no desenho, divida o desnível em ' + R.N + ' partes iguais (veja o roteiro de desenho à mão), em vez de somar o espelho arredondado.'));
  passos.push(hel
    ? '<b>Piso (p) na linha de caminhamento.</b> Na helicoidal o degrau é um setor de círculo, então a profundidade muda conforme o raio. O app mede o piso na linha de caminhamento, que fica a ' + f(R.dw) + ' cm da borda do pilar, no raio de ' + f(R.helix.rw) + ' cm. Cada degrau gira ' + f(R.helix.th, 1) + '°, então p = raio × ângulo (em radianos) = ' + f(R.helix.rw) + ' × ' + f(rad(R.helix.th), 3) + ' = <b>' + f(R.p, 1) + ' cm</b>.'
    : '<b>Piso (p) pela fórmula de Blondel.</b> O piso precisa caber em duas faixas ao mesmo tempo: a do piso (' + f(nm.pMin) + ' a ' + f(nm.pMax) + ' cm) e a de Blondel, que com este espelho dá ' + f(nm.bMin) + ' − 2 × ' + f(R.e, 2) + ' = ' + f(nm.bMin - 2 * R.e, 1) + ' até ' + f(nm.bMax) + ' − 2 × ' + f(R.e, 2) + ' = ' + f(nm.bMax - 2 * R.e, 1) + ' cm. ' + (R.temFaixa ? 'As duas juntas deixam de ' + f(R.fP[0], 1) + ' a ' + f(R.fP[1], 1) + ' cm. ' : 'Elas não se cruzam: nenhum piso atende as duas, por isso aparece "não atende". ') + (S.pAuto ? (R.temFaixa ? 'O app pega o valor mais perto do meio de Blondel (' + f(nm.bMid, 1) + ' − 2e = ' + f(nm.bMid - 2 * R.e, 1) + ' cm), arredondado para centímetro inteiro quando possível: <b>' + f(R.p, 2) + ' cm</b>.' : 'O meio de Blondel daria ' + f(nm.bMid - 2 * R.e, 1) + ' cm, fora do limite de piso; o app usou o limite mais perto: <b>' + f(R.p, 2) + ' cm</b>. Mude o número de espelhos para sair dessa situação.') : 'Você definiu <b>' + f(R.p) + ' cm</b>.'));
  passos.push('<b>Superfícies entre espelhos.</b> N − 1 = ' + R.N + ' − 1 = <b>' + R.T + '</b>. O último espelho chega ao piso superior, que não é degrau da escada. ' + (R.nPat || R.nLeque ? 'Nesta escada essas ' + R.T + ' superfícies são: <b>' + R.contagem + '</b>.' + (R.nPat ? ' O patamar também fica entre dois espelhos, por isso entra na conta, mas não é um piso comum.' : '') : 'Aqui todas são pisos comuns.'));
  if (!hel) passos.push('<b>Conferência de Blondel.</b> 2e + p = 2 × ' + f(R.e, 2) + ' + ' + f(R.p, 1) + ' = <b>' + f(R.bl, 1) + ' cm</b>, contra a referência de ' + f(nm.bMin) + ' a ' + f(nm.bMax) + ' cm.');
  passos.push('<b>Inclinação.</b> tangente do ângulo = e ÷ p = ' + f(R.e, 2) + ' ÷ ' + f(R.p, 1) + ' = ' + f(R.e / R.p, 3) + ', então o ângulo é <b>' + f(R.incl, 1) + '°</b> (' + f(R.e / R.p * 100, 0) + '%).');
  R.lances.forEach(t => passos.push('<b>Divisão do tipo.</b> ' + t));
  passos.push('<b>Altura livre e laje.</b> Altura livre é a distância vertical entre a superfície onde se pisa e a face de baixo do obstáculo mais próximo acima (laje, viga). Aqui foi pedido ' + f(S.hLivre) + ' cm, valor usual; confira qual exigência vale para o seu caso. A laje do piso de cima tem ' + f(S.espLaje) + ' cm; ' + (R.opening ? 'a partir do degrau ' + R.kc + ' a laje ficaria baixa demais sobre a escada (a altura do degrau mais ' + f(S.hLivre) + ' cm de altura livre passaria da face de baixo da laje, que fica a ' + f(R.H - S.espLaje) + ' cm). Por isso a laje precisa de uma <b>abertura</b>' + (R.opening.circle ? ' circular de Ø ' + f(R.opening.circle * 2) + ' cm.' : ' de aproximadamente ' + f(R.opening.w) + ' × ' + f(R.opening.h) + ' cm.') : 'não precisa ser aberta, a altura livre já é atendida.'));
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
    'reta-patamar': ['Dois lances na mesma direção, separados por um patamar.', 'O patamar interrompe o lance e oferece uma superfície para descanso e circulação. Permite vencer desníveis acima do máximo sem patamar.', 'Continua precisando de comprimento em linha reta, e o patamar é área a mais. O comprimento mínimo do patamar aqui é ' + f(R.patRetoMin, 0) + ' cm: ' + (nm.patReto ? 'a NBR 9050:2020 (6.8.8) pede 120 cm entre lances.' : 'a NBR 9077:2001 (4.7.3.3 a) dá a fórmula (2e + p) × n + p, com n = 1, 2 ou 3 passos no patamar; com os seus números, ' + f(2 * R.e + 2 * R.p, 0) + ' cm (n = 1) ou ' + f(2 * (2 * R.e + R.p) + R.p, 0) + ' cm (n = 2).')],
    'l-patamar': ['Dois lances em ângulo reto, ligados por um patamar quadrado de lado igual à largura.', 'A curva acontece num piso plano, sem degraus de forma diferente. Cabe em cantos de parede. É a solução que a NBR 9050 aceita para mudar de direção.', 'O patamar ocupa um quadrado de ' + f(R.L) + ' × ' + f(R.L) + ' cm que não é degrau.'],
    'l-leque': ['Dois lances em ângulo reto, com a curva feita por degraus que giram, no lugar do patamar.', 'Ocupa menos área que a versão com patamar, porque a curva já sobe.', R.bal ? 'Os degraus da curva são balanceados: piso igual na linha de caminhamento e ponta de ' + f(ponta, 1) + ' cm na borda interna. Mesmo assim, a NBR 9050 pede patamar nas mudanças de direção, então essa solução não serve no perfil acessível.' : 'Na forma convergente os leques saem todos do canto interno, com ponta zero. É mais simples de desenhar, mas não atende a NBR 9077, que pede balanceamento.'],
    'u-patamar': ['Dois lances paralelos, de sentidos opostos, ligados por um patamar retangular (volta de 180°).', 'Ocupa menos comprimento: a escada dobra em vez de se esticar. A volta acontece num piso plano.', 'O patamar tem (2 × largura + vão) de comprimento. O vão entre os lances ocupa área e exige guarda-corpo seguro. A NBR 9077:2001 (4.7.2 c) pede pelo menos 10 cm entre lances paralelos, para caber a guarda ou o corrimão.'],
    'u-leque': ['Volta de 180° feita por duas curvas de degraus que giram, com pisos retos entre elas.', 'Ocupa menos área que a versão com patamar, porque a volta também sobe.', 'As duas curvas ficam perto uma da outra, então sobram poucos degraus retos para balancear: é comum a ponta não chegar a 15 cm, a não ser que se aumentem a largura ou os pisos do meio. Vão central de ' + f(R.gU || 0, 1) + ' cm. Não serve no perfil NBR 9050, que pede patamar nas mudanças de direção.'],
    'c-patamar': ['Três lances ligados por dois patamares quadrados, virando 90° duas vezes para o mesmo lado: o terceiro lance volta paralelo ao primeiro, como um U aberto.', 'Cada lance fica curto, o que ajuda a vencer desníveis grandes com descanso a cada trecho. Contorna um poço ou um vazio central de ' + f(R.nMeioP * R.p) + ' cm entre o primeiro e o último lance.', 'Ocupa mais área que o U com um patamar só, e são dois patamares para mobiliar de corrimão e guarda-corpo. Cada lance precisa de pelo menos três degraus (NBR 9077:2001, 4.7.3.2).'],
    'z-patamar': ['Três lances ligados por dois patamares quadrados: vira 90° para um lado e depois 90° para o outro, e o último lance sobe paralelo ao primeiro, deslocado.', 'Encaixa em plantas onde a saída fica deslocada da entrada, como uma escada que precisa desviar de uma viga ou de um pilar.', 'É a forma que mais espalha a escada na planta. A linha de caminhamento troca de lado no segundo patamar, porque o lado interno da curva muda. Cada lance precisa de pelo menos três degraus (NBR 9077:2001, 4.7.3.2).'],
    'helicoidal': ['Escada em caracol: os degraus são setores de círculo em volta de um pilar central.', 'Ocupa pouca área em planta: aqui um círculo de ' + f(R.helix ? R.helix.R * 2 : 0) + ' cm de diâmetro.', 'O piso depende do raio: junto ao pilar ele mede só ' + f(R.helix ? R.helix.rc * rad(R.helix.th) : 0, 1) + ' cm, e a medida vale na linha de caminhamento. A altura livre depende do número de degraus por volta (aqui ' + (R.helix ? R.helix.nPer : '') + '), e a largura costuma ficar abaixo do mínimo de escadas comuns. Por isso muitos códigos tratam a helicoidal como exceção ou de uso restrito. Confirme no código do seu município.'],
  }[R.tipo];
  h += sec('Sobre o tipo escolhido: ' + tp.nome, dl([['O que é', T[0]], ['Por que usar', T[1]], ['Cuidados', T[2]]]) + (leq ? p('<b>Por que o piso da curva é medido a ' + f(R.dw) + ' cm do lado interno?</b> Num degrau que gira o piso é diferente em cada ponto: curto junto ao canto interno e largo na parte externa. Por isso ele é medido numa linha definida, a linha de caminhamento (a NBR 9077 chama de linha de percurso: onde anda quem segura o corrimão do lado de dentro). O perfil usa ' + f(nm.dw) + ' cm a partir do lado interno' + (nm.acess ? ' (NBR 9050:2020, 6.8.6: 0,55 m da borda interna)' : '') + (R.dw < nm.dw ? '; como a escada é estreita, o app usou ' + f(R.dw) + ' cm, o meio da largura, que é o que a NBR 9077:2001 (3.32) manda fazer em escadas com menos de 1,10 m' : '') + '.') : '') + (hel ? p('<b>Por que o piso é ' + f(R.p, 1) + ' cm?</b> Cada degrau gira ' + f(R.helix.th, 1) + '° (360° ÷ ' + R.helix.nPer + ' degraus por volta). A linha de caminhamento fica a ' + f(R.dw) + ' cm da borda do pilar, ou seja, no raio de ' + f(R.helix.rc) + ' + ' + f(R.dw) + ' = ' + f(R.helix.rw) + ' cm. O arco nesse raio mede raio × ângulo = ' + f(R.p, 1) + ' cm. O número de degraus por volta é o maior entre o que dá o piso desejado e o que dá a altura livre: ' + f(R.helix.nPer) + ' × ' + f(R.e, 2) + ' − ' + f(S.espDegrau) + ' = ' + f(R.helix.clearance) + ' cm de altura livre sob a volta de cima. O app não verifica outros obstáculos (vigas, guarda-corpo, forro).') : ''), false);

  /* 5. Balanceamento (só nos tipos com leque) */
  if (leq) {
    const lqs = R.polys.filter(q => q.kind === 'leque');
    let corpo = p('Num degrau que gira, a aresta (o bocel) não é paralela às outras. Há dois jeitos de desenhar a curva:') +
      dl([['Convergentes', 'Todas as arestas da curva saem do mesmo ponto, o canto interno. Fácil de traçar, mas a ponta de cada leque fica com largura zero: quem desce pelo lado de dentro pisa em quase nada.'],
        ['Balanceados', 'As arestas são distribuídas por alguns degraus antes e depois da curva, e cada uma passa num ponto diferente da borda interna. A curva "começa" antes do canto e termina depois, e os degraus mudam de forma aos poucos.']]) +
      p('A regra que define o balanceamento está na NBR 9077:2001: o piso de todos os degraus é <b>igual na linha de percurso</b> (3.32 e 4.7.9.1 b), e a parte mais estreita do degrau na borda interna tem <b>pelo menos 15 cm</b> (4.7.3.1 c). A NBR 9050:2020 repete os 15 cm na Figura 75. A norma de 2001 fala em usar "um dos sistemas de balanceamento recomendados" pela boa técnica, sem fixar um; existem vários processos gráficos ensinados em desenho técnico.');
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

  /* 7. Roteiro para desenhar à mão */
  const esc = 50, mm = v => f(v / esc * 10, 1) + ' mm';
  const bw = R.bbox[2] - R.bbox[0], bh = R.bbox[3] - R.bbox[1];
  h += sec('Roteiro para desenhar à mão (escala 1:50)',
    p('Na escala 1:50, cada 1 cm do desenho vale 50 cm da obra, então divida as medidas reais por 5 para ter milímetros no papel. Com os seus números: espelho de ' + f(R.e, 2) + ' cm vira ' + mm(R.e) + ', piso de ' + f(R.p, 1) + ' cm vira ' + mm(R.p) + ', e a escada inteira cabe num retângulo de ' + mm(bw) + ' × ' + mm(bh) + '.') +
    p('<b>Perfil</b>') + ol([
      'Trace duas linhas horizontais: o piso de baixo (' + nivel(0) + ') e o piso de cima (' + nivel(R.H) + '), afastadas ' + mm(R.H) + '.',
      'Divida essa altura em ' + R.N + ' partes iguais sem fazer conta de milímetro. Trace uma vertical do nível de baixo ao de cima, no lugar do primeiro espelho. Do pé dessa vertical, trace uma reta inclinada qualquer e marque nela ' + R.N + ' divisões iguais com a régua (por exemplo, de 1 em 1 cm). Ligue a última marca ao topo da vertical e puxe, pelas outras marcas, paralelas a essa ligação. Onde as paralelas cortam a vertical estão as alturas dos ' + R.N + ' espelhos (é a divisão de segmentos pelo teorema de Tales).',
      'Marque na horizontal os pisos de ' + mm(R.p) + ' e desenhe a escadinha. A linha que liga os bocéis (os "narizes") tem a inclinação da escada, ' + f(R.incl, 1) + '°.',
      'Desenhe a laje da escada por baixo, paralela à linha dos bocéis, e o corrimão a 92 cm acima dela' + (nm.acess ? ' (e o segundo a 70 cm)' : '') + '.']) +
    p('<b>Planta</b>') + ol([
      'Desenhe o contorno da escada com a largura de ' + f(R.L) + ' cm (' + mm(R.L) + ').',
      (hel ? 'Trace o círculo externo e o pilar, e divida a volta em ' + R.helix.nPer + ' fatias de ' + f(R.helix.th, 1) + '° com o transferidor.' : leq && R.bal ? 'Trace a linha de caminhamento a ' + f(R.dw) + ' cm da borda interna, marque nela os pontos a cada ' + mm(R.p) + ' e use a tabela do balanceamento para marcar os pontos da borda interna. Ligue os pares de pontos e prolongue até a parede externa.' : 'Marque os pisos de ' + mm(R.p) + ' ao longo de cada lance.'),
      'Numere os degraus a partir do primeiro (o de baixo) e desenhe a linha de caminhamento com uma bolinha no começo, a seta no fim e a palavra SOBE.',
      'Faça o corte a ' + f(R.zc) + ' cm do piso (o degrau ' + R.kCut + '): o que fica abaixo do plano é traço cheio; o que fica acima é tracejado, e a linha em zigue-zague marca onde a escada foi cortada.',
      'Escreva os níveis (' + nivel(0) + ' e ' + nivel(R.H) + '), as cotas em centímetros e a escala no carimbo.']), false);

  /* 8. Como ler os desenhos */
  h += sec('Como ler a planta, os cortes e o perfil',
    anatomiaSVG(C) +
    dl([
      ['Planta', 'Vista de cima, como se a casa fosse cortada na horizontal. Por convenção de desenho, o plano de corte fica em torno de 1,50 m do piso (a NBR 6492, norma de representação de projetos, não foi conferida para este app); se usar outra altura, informe no desenho (aqui ' + f(R.zc) + ' cm, que dá o degrau ' + R.kCut + '). O que está abaixo do corte e à vista aparece em traço cheio. O que está acima aparece como projeção tracejada. A linha em zigue-zague marca onde a escada foi cortada.'],
      ['Planta do pavimento superior', 'Mostra o piso de cima. A escada só aparece através da abertura da laje, em traço cheio; onde dois trechos se sobrepõem, aparece o de cima.'],
      ['Linha de caminhamento', 'A linha laranja com seta: o caminho que uma pessoa faz ao usar a escada. Na planta do pavimento inferior a seta aponta para onde sobe e "SOBE" fica no primeiro degrau, com o nível ' + nivel(0) + '. Na planta do pavimento superior o app marca "DESCE", com a seta no sentido da descida.' + (leq && R.bal ? ' A marca "ponta" mostra o degrau mais estreito na borda interna.' : '')],
      ['Perfil desenvolvido', 'Não é um corte A-A da edificação: é um esquema da escada esticada ao longo da linha de caminhamento, então curvas e leques viram trecho reto. Serve para ver a sequência de espelhos, a laje da escada, a altura livre (tracejado laranja) e o corrimão' + (nm.acess ? ' a 92 e 70 cm, prolongado 30 cm nas pontas (NBR 9050:2020, 6.9.3.2)' : ' a 92 cm') + ', medido a partir do bocel dos degraus. Para ver a escada como ela é cortada de verdade, use os cortes A-A e B-B.'],
      ['Cortes A-A e B-B', 'Corte é um plano vertical que atravessa a edificação. Na planta ele aparece como uma linha de traço e ponto, com as letras nas pontas e setas que mostram para onde se olha. No desenho do corte, o que o plano atravessa (degraus, laje da escada, laje do piso de cima, chão) aparece hachurado e com traço grosso; o que está além do plano aparece em vista, com traço fino; o que fica atrás de quem olha não aparece. O A-A passa ao longo do 1º lance e o B-B atravessa esse lance; você pode deslocar cada linha. Repare na laje de cima: onde a escada passa, ela é interrompida pela abertura.'],
      ['Detalhe', 'Ampliação de poucos degraus, com as medidas do espelho, do piso, do bocel e da laje, para mostrar o que a escala da planta não deixa ler.'],
      ['Cotas', 'Todas em centímetros. Níveis em metros: ' + nivel(0) + ' é o piso de baixo e ' + nivel(R.H) + ' o de cima.'],
      ['3D', 'Modelo para enxergar o conjunto: ' + (R.hel ? 'degraus soltos em volta do pilar, com corrimão do lado de fora' : 'degraus com a face de baixo da laje inclinada de verdade, patamares e corrimãos') + '. Não mostra armadura, revestimento nem acabamentos. Gire arrastando.']
    ]), false);

  /* 9. Erros comuns */
  h += sec('Erros comuns na prancha',
    ul([
      '<b>Contar pisos em vez de espelhos.</b> Uma escada com ' + R.N + ' espelhos tem ' + R.T + ' superfícies: o piso de cima não é degrau.',
      '<b>Arredondar o espelho e esquecer de conferir.</b> Se você arredondar ' + f(R.e, 2) + ' cm para ' + f(Math.round(R.e), 0) + ' cm, a soma vira ' + R.N + ' × ' + f(Math.round(R.e), 0) + ' = ' + f(R.N * Math.round(R.e), 0) + ' cm' + (Math.abs(R.N * Math.round(R.e) - R.H) > 1e-6 ? ', e não ' + f(R.H) + ' cm: o último degrau sai diferente dos outros, que é justamente o que provoca tropeço.' : ', que por acaso fecha o desnível.'),
      '<b>Medir o desnível na laje bruta.</b> O desnível vale de piso acabado a piso acabado.',
      '<b>Chamar o perfil de corte A-A.</b> Corte A-A precisa da linha de corte marcada na planta, com letras e setas.',
      '<b>Esquecer a altura livre.</b> Sem abrir a laje de cima, a cabeça bate a partir de um certo degrau.' + (R.opening && R.kc ? ' Aqui, a partir do degrau ' + R.kc + '.' : ''),
      '<b>Leque saindo todo do canto.</b> Ponta zero na borda interna não atende a NBR 9077; balanceie.',
      '<b>Patamar de canto menor que a largura.</b> Na mudança de direção o patamar tem pelo menos a largura da escada (NBR 9077:2001, 4.7.3.3 b; NBR 9050:2020, 6.8.8).',
      '<b>Lance com um ou dois degraus.</b> A NBR 9077:2001 (4.7.3.2) pede pelo menos três; a NBR 9050:2020 (6.7.2) manda evitar o degrau isolado.',
      '<b>Medir o corrimão a partir do piso do degrau.</b> As normas medem a partir do bocel, a linha dos narizes.'
    ]), false);

  /* 10. Vocabulário */
  h += sec('Vocabulário',
    dl([
      ['Espelho', 'Parte vertical do degrau. Seu tamanho é a altura de cada passo (e). A NBR 9077 chama de altura h.'],
      ['Piso', 'Parte horizontal onde se pisa. A profundidade p é medida entre as projeções de dois bocéis seguidos. A NBR 9077 chama de largura do degrau (b).'],
      ['Bocel (nariz)', 'Borda do degrau que avança sobre o espelho de baixo. O avanço não se soma ao piso p. A NBR 9077:2001 (4.7.3.1 e) pede bocel de pelo menos 1,5 cm; a NBR 9050:2020 (6.7.1) limita o avanço a no máximo 1,5 cm. As duas juntas dão exatamente 1,5 cm.'],
      ['Lance (lanço)', 'Trecho contínuo de degraus entre dois patamares, ou entre um piso e um patamar. Pela NBR 9077:2001 (3.30), um lance tem no mínimo três degraus e sobe no máximo 3,70 m.'],
      ['Patamar', 'Piso plano no início, no fim ou entre lances. Interrompe a continuidade do lance e oferece uma superfície para circulação e descanso; também é onde a escada pode mudar de direção.'],
      ['Degrau em leque (ingrauxido)', 'Degrau mais estreito de um lado, usado para fazer a escada virar sem patamar. "Ingrauxido" é o termo da NBR 9077.'],
      ['Balanceamento', 'Distribuir a curva por vários degraus para que o piso fique igual na linha de percurso e a ponta interna não fique estreita demais.'],
      ['Linha de caminhamento (linha de percurso)', 'Linha imaginária por onde anda quem segura o corrimão do lado de dentro. A NBR 9077:2001 (3.32) põe essa linha a 0,55 m da borda; em escadas com menos de 1,10 m de largura, ela passa no eixo. É nela que se mede o piso de degraus que não são retangulares.'],
      ['Fórmula de Blondel', '2e + p = ' + f(nm.bMin) + ' a ' + f(nm.bMax) + ' cm. Relação empírica entre a altura do espelho e a profundidade do piso, usada para avaliar a passada. Leva o nome de François Blondel, arquiteto e engenheiro francês do século XVII.'],
      ['Altura livre', 'Distância vertical entre a superfície de apoio (o piso do degrau) e a face de baixo do obstáculo superior mais próximo.'],
      ['Abertura (vão) na laje', 'Recorte na laje do piso superior onde a escada passa, necessário quando o teto ficaria baixo sobre os degraus.'],
      ['Guarda-corpo', 'Barreira nos lados abertos, contra quedas. Pela NBR 9077:2001 (4.8.1.2), 1,05 m nos patamares, podendo baixar para 92 cm em escadas internas, medida a partir da linha dos bocéis; se for vazada, uma esfera de 15 cm não pode passar (4.8.1.4 a).'],
      ['Corte e planta', 'Planta é um corte horizontal visto de cima. Corte é um corte vertical, indicado na planta por uma linha com letras (A-A, B-B) e setas no sentido do olhar. O perfil desenvolvido deste app é outra coisa: um esquema do percurso esticado.'],
      ['Poché (hachura de corte)', 'Preenchimento dos elementos atravessados pelo plano de corte, para separar o que é cortado do que é visto.'],
      ['Cota', 'Número que indica uma medida ou altura no desenho.'],
      ['Desnível', 'Diferença de altura entre os dois pisos que a escada liga.']
    ]), false);

  /* 11. Normas */
  h += sec('Sobre as normas e limites deste app',
    p('Perfil usado agora: <b>' + nm.nome + '</b>. Espelho ' + f(nm.eMin) + ' a ' + f(nm.eMax) + ' cm, piso ' + f(nm.pMin) + ' a ' + f(nm.pMax) + ' cm, Blondel ' + f(nm.bMin) + ' a ' + f(nm.bMax) + ' cm, largura mínima ' + f(nm.Lmin) + ' cm, desnível máximo sem patamar ' + f(nm.hPat) + ' cm, linha de caminhamento a ' + f(nm.dw) + ' cm do lado interno, ponta mínima de leque ' + f(nm.lqMin) + ' cm.') +
    p('<b>NBR 9050:2020 (acessibilidade), versão corrigida de 25/01/2021.</b> Conferida no texto da norma em 16/11/2026. Item 6.8.2: espelho de 0,16 a 0,18 m, piso de 0,28 a 0,32 m, 0,63 ≤ p + 2e ≤ 0,65 m, dimensões constantes em toda a escada. 6.8.3: largura mínima de 1,20 m em rotas acessíveis. 6.8.6: lances curvos seguem a NBR 9077, com pisos e espelhos conforme 6.8.2 a 0,55 m da borda interna (Figura 75, com ponta ≥ 0,15 m). 6.8.7: patamar a cada 3,20 m de desnível e sempre que houver mudança de direção. 6.8.8: patamar entre lances com pelo menos 1,20 m; na mudança de direção, igual à largura. 6.9.3.2: corrimãos dos dois lados, a 0,92 e 0,70 m, prolongados 0,30 m nas pontas. O app faz só uma <b>conferência dimensional parcial</b>: passar nele não quer dizer que a escada é acessível (faltam sinalização, piso tátil, guia de balizamento, rampa associada e outros itens).') +
    p('<b>NBR 9077 (saídas de emergência).</b> O app usa a edição de 2001 (texto de 1993 com a Emenda 1), conferida no texto em 16/11/2026: 4.7.3.1 a) espelho de 16 a 18 cm; b) Blondel de 63 a 64 cm; c) leques balanceados, medidos na linha de percurso, com a parte mais estreita de pelo menos 15 cm; 4.7.3.2 lance de 3 degraus no mínimo e no máximo 3,70 m entre patamares; 4.7.3.3 patamar reto pela fórmula (2e + p) × n + p. Para escadas secundárias, que não são rota de fuga, a mesma norma (4.7.5.1 d) admite ponta de leque de 7 cm. <b>A NBR 9077 ganhou uma edição nova em 16/07/2025, que substitui a de 2001 e não foi lida para este app.</b> Os itens citados podem ter mudado: confira na edição vigente antes de usar em projeto.') +
    p('<b>Perfil Estudo.</b> Usa o Blondel e a regra de leques da NBR 9077:2001. Piso a partir de 25 cm, largura de 80 cm e desnível de 3,20 m sem patamar são valores comuns em apostilas e códigos de obras, mas <b>não há uma norma nacional</b> que os sustente para uso residencial. Use como hipótese de estudo e troque pelos valores que o professor ou o código da cidade indicarem, em "Personalizada".') +
    p('<b>Saídas de emergência.</b> Escadas de rota de fuga seguem a NBR 9077 e a norma técnica do Corpo de Bombeiros de cada estado. Na edição de 2001, escadas em leque só valem como rota de fuga em condições restritas (4.7.9), e são proibidas em escadas à prova de fumaça (4.7.9.2). O app não valida escada de emergência.') +
    p('O app calcula geometria e confere parte dos limites. Ele não faz dimensionamento estrutural, guarda-corpo, sinalização, piso tátil nem escolha de material.'), false);

  /* 12. Perguntas */
  const pergs = [
    ['Por que há um piso a menos que espelhos?', 'Porque o último espelho termina no piso do andar de cima. Esse piso já existe e não é degrau da escada. Aqui são ' + R.N + ' espelhos e ' + R.T + ' superfícies entre eles: ' + R.contagem + '.'],
    ['Por que dividir o desnível por um número inteiro?', 'Para todos os espelhos serem iguais. Uma diferença de poucos milímetros entre degraus já faz as pessoas tropeçarem, porque o corpo se acostuma com o ritmo. A NBR 9077:2001 (4.7.3.1 d) aceita no máximo 5 mm de diferença entre lances.'],
    ['De onde vem a fórmula 2e + p?', 'É associada ao arquiteto François Blondel, do século XVII. É uma relação empírica entre espelho e piso, usada para avaliar se a passada na escada fica confortável. Evite dizer que ela prova que subir custa o dobro de andar: isso é uma leitura comum, não uma lei demonstrada.'],
    ['Por que não fazer o piso maior para a escada ficar mais suave?', 'Porque a escada fica comprida e o passo passa do conforto: com piso grande demais a pessoa precisa esticar o passo. No gráfico de Blondel, o ponto sairia da faixa inclinada.'],
    ['Quando uso patamar?', 'Quando o desnível passa do máximo sem patamar (no perfil atual, ' + f(nm.hPat) + ' cm) e, pela NBR 9050, também nas mudanças de direção. Aqui o desnível é ' + f(R.H) + ' cm' + (R.H > nm.hPat ? ', maior que o limite, então o patamar é obrigatório.' : ', menor que o limite, então o patamar não é obrigatório por essa regra.')],
    ['Qual o tamanho certo do patamar reto?', 'A NBR 9077:2001 (4.7.3.3) dá a fórmula (2e + p) × n + p, em que n é o número de passos dados no patamar (1, 2 ou 3). Com os seus números: ' + f(2 * R.e + 2 * R.p, 0) + ' cm para um passo. A NBR 9050:2020 (6.8.8) pede pelo menos 120 cm. Na mudança de direção, o patamar tem no mínimo a largura da escada.'],
    ['Qual a vantagem do leque sobre o patamar?', 'Ocupa menos área em planta. A desvantagem é o piso estreito perto do lado interno, que o balanceamento ameniza. A NBR 9050 pede patamar nas mudanças de direção, então leque não serve em rota acessível.'],
    ['O que é balancear os leques?', 'É distribuir a curva por vários degraus, para que todos tenham o mesmo piso na linha de percurso e a ponta interna fique com pelo menos 15 cm (NBR 9077:2001, 4.7.3.1 c).' + (leq && R.bal ? ' Nesta escada, ' + R.nLeque + ' degraus foram balanceados e a ponta ficou com ' + f(ponta, 1) + ' cm.' : '')],
    ['Por que a linha de caminhamento fica a ' + f(R.dw) + ' cm da borda?', 'As normas põem essa linha a 55 cm da borda interna, a distância de quem anda segurando o corrimão do lado de dentro (NBR 9077:2001, 3.32; NBR 9050:2020, 6.8.6). Em escadas com menos de 1,10 m de largura, a NBR 9077 manda usar o eixo.' + (R.dw < 55 - 1e-9 ? ' Aqui a escada tem ' + f(R.L) + ' cm' + (R.hel ? ' de largura útil' : '') + ', então a linha ficou ' + (R.dw < nm.dw - 1e-9 ? 'no eixo, a ' + f(R.dw) + ' cm.' : 'a ' + f(R.dw) + ' cm, o valor do perfil escolhido.') : '')],
    ['A área em planta é a área da escada?', 'O app mostra duas coisas: o retângulo envolvente (' + f((R.bbox[2] - R.bbox[0]) / 100, 2) + ' × ' + f((R.bbox[3] - R.bbox[1]) / 100, 2) + ' m) e a área que a escada ocupa de fato (' + f(R.areaOcup / 10000, 2) + ' m²), que é a soma dos degraus e patamares.'],
    ['Por que a laje do andar de cima é aberta?', 'Para manter a altura livre. Se a laje continuasse inteira por cima dos últimos degraus, a cabeça de quem sobe bateria nela.' + (R.kc && R.opening ? ' A abertura começa no degrau ' + R.kc + ' nesta escada.' : '')],
    ['Esta escada atende às normas?', (ruins.length ? 'Não no perfil escolhido: há itens que não atendem (veja a lista).' : atencao.length ? 'Os itens conferidos não reprovam, mas há pontos em atenção que o app não valida.' : 'Nenhuma das verificações implementadas reprovou.') + ' O app confere só parte das exigências; quem decide é o texto da norma vigente e o código do município.'],
    ['O perfil é um corte A-A?', 'Não. O perfil desenvolvido é a escada esticada ao longo da linha de caminhamento, para mostrar a sequência de espelhos e a altura livre. O corte A-A é um plano vertical de verdade, marcado na planta; em escadas com curva ele mostra partes da escada em vista, além do plano.'],
    ['Por que no corte alguns degraus aparecem hachurados e outros não?', 'Hachurado é o que o plano de corte atravessa. Os outros degraus estão além do plano e aparecem em vista, como numa fachada. Os que ficam atrás de quem olha não aparecem.']
  ];
  h += sec('Perguntas que o professor pode fazer', '<dl>' + pergs.map(x => '<dt>' + x[0] + '</dt><dd>' + x[1] + '</dd>').join('') + '</dl>', false);

  return h;
}
