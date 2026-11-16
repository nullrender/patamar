/* ===== ABA EXPLICAÇÃO: texto que acompanha os números ===== */
function anatomiaSVG(C) {
  const t = (x, y, s, a, w) => '<text x="' + x + '" y="' + y + '" font-size="12" fill="' + C.ink + '" text-anchor="' + (a || 'start') + '" dominant-baseline="central" font-family="' + FONT + '"' + (w ? ' font-weight="600"' : '') + '>' + s + '</text>';
  const ln = (x1, y1, x2, y2, col, d) => '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (col || C.ink) + '" stroke-width="1.2"' + (d ? ' stroke-dasharray="3 3"' : '') + '/>';
  let s = '<path d="M30,170 L30,130 L128,130 L128,138 L120,138 L120,90 L208,90 L208,98 L200,98 L200,50 L290,50 L290,170 Z" fill="' + C.tread + '" stroke="' + C.ink + '" stroke-width="1.8" stroke-linejoin="round"/>';
  s += ln(110, 90, 110, 130) + ln(106, 90, 114, 90) + ln(106, 130, 114, 130) + t(104, 110, 'espelho (e)', 'end', 1);
  s += ln(120, 76, 200, 76) + ln(120, 72, 120, 80) + ln(200, 72, 200, 80) + t(160, 62, 'piso (p)', 'middle', 1);
  s += ln(128, 134, 78, 104, C.accent) + '<circle cx="128" cy="134" r="3" fill="' + C.accent + '"/>' + t(30, 98, 'bocel (nariz)', 'start', 1);
  s += ln(120, 90, 120, 138, C.muted, 1) + t(46, 152, 'degrau 1', 'start') + t(136, 112, '', 'start');
  s += t(215, 40, 'o piso é medido de nariz a nariz', 'start');
  return '<svg viewBox="0 0 330 185" style="width:100%;max-width:440px;height:auto;display:block" role="img" aria-label="Perfil de três degraus com espelho, piso e bocel">' + s + '</svg>';
}

function explicacao(R, S, C) {
  const nm = R.nm, f = fmt, hel = R.hel, tp = TIPOS.find(x => x.id === R.tipo);
  const nMin = Math.ceil(R.H / nm.eMax - 1e-9), nMax = Math.floor(R.H / nm.eMin + 1e-9);
  const sec = (titulo, corpo, aberto) => '<details class="ex"' + (aberto ? ' open' : '') + '><summary>' + titulo + '</summary><div class="exb">' + corpo + '</div></details>';
  const p = x => '<p>' + x + '</p>';
  const ul = a => '<ul>' + a.map(x => '<li>' + x + '</li>').join('') + '</ul>';
  const dl = a => '<dl>' + a.map(x => '<dt>' + x[0] + '</dt><dd>' + x[1] + '</dd>').join('') + '</dl>';
  const ol = a => '<ol>' + a.map(x => '<li>' + x + '</li>').join('') + '</ol>';
  let h = '';

  /* 1. Resumo para falar */
  const comp = !hel && R.tipo === 'reta' ? ' Em linha reta ela ocupa ' + f(R.T * R.p / 100, 2) + ' m de comprimento.' : '';
  h += sec('Resumo para abrir a apresentação',
    p('Esta é uma <b>' + tp.nome.toLowerCase().replace(' l ', ' L ').replace(' u ', ' U ') + '</b> que vence um desnível de <b>' + f(R.H) + ' cm</b> entre um piso e o outro, com <b>' + f(R.L) + ' cm</b> de largura útil. Ela tem <b>' + R.N + ' espelhos de ' + f(R.e, 2) + ' cm</b> e, entre eles, <b>' + R.contagem + '</b>' + (R.nReto ? ', com piso de <b>' + f(R.p, 1) + ' cm</b>' + (R.nLeque ? ' nos trechos retos' : '') : '') + '. A conta de conforto de Blondel dá <b>' + f(R.bl, 1) + ' cm</b> (referência de ' + nm.bMin + ' a ' + nm.bMax + ' cm) e a inclinação fica em <b>' + f(R.incl, 1) + '°</b>.' + comp) +
    p('Na lista de verificações ao lado, ' + (R.checks.some(c => c.status === 'bad') ? 'há itens que <b>não atendem</b> ao perfil escolhido: vale explicar quais são e o que ajustaria para corrigir.' : R.checks.some(c => c.status === 'warn') ? 'nenhuma das verificações implementadas reprovou, mas há itens em <b>atenção</b> que o app não consegue validar: vale explicar cada um.' : 'os itens que o app confere atendem ao perfil escolhido (' + nm.curto + ').') + ' Lembre que o app confere só parte das exigências de uma escada.'), true);

  /* 2. Passo a passo */
  const passos = [];
  passos.push('<b>Desnível (H).</b> É a altura de um piso acabado até o outro piso acabado: <b>' + f(R.H) + ' cm</b>. Toda a escada existe para vencer essa altura em degraus iguais.');
  passos.push('<b>Número de espelhos (N).</b> O espelho é a parte vertical do degrau. Como a norma de referência limita o espelho entre ' + nm.eMin + ' e ' + nm.eMax + ' cm, o número de espelhos precisa estar entre H ÷ ' + nm.eMax + ' = ' + f(R.H / nm.eMax, 1) + ' (arredonda para cima: ' + nMin + ') e H ÷ ' + nm.eMin + ' = ' + f(R.H / nm.eMin, 1) + ' (arredonda para baixo: ' + nMax + '). O app testa cada número dessa faixa e escolhe o que deixa o espelho mais perto de 17,5 cm' + (hel ? '' : ', desde que exista um piso que atenda ao mesmo tempo o limite de piso e o de Blondel') + ': <b>' + R.nSug + '</b>' + (S.nAuto ? '.' : '; você definiu <b>' + R.N + '</b>.'));
  passos.push('<b>Altura do espelho (e).</b> e = H ÷ N = ' + f(R.H) + ' ÷ ' + R.N + ' = <b>' + f(R.e, 2) + ' cm</b>. Dividir o desnível por um número inteiro garante que todos os espelhos sejam iguais, que é o que evita tropeço. Na obra, a igualdade depende também dos níveis acabados e dos revestimentos.');
  passos.push(hel
    ? '<b>Piso (p) na linha de caminhamento.</b> Na helicoidal o degrau é um setor de círculo, então a profundidade muda conforme o raio. O app mede o piso na linha de caminhamento, que fica a ' + f(R.dw) + ' cm da borda do pilar, no raio de ' + f(R.helix.rw) + ' cm. Cada degrau gira ' + f(R.helix.th, 1) + '°, então p = raio × ângulo (em radianos) = ' + f(R.helix.rw) + ' × ' + f(rad(R.helix.th), 3) + ' = <b>' + f(R.p, 1) + ' cm</b>.'
    : '<b>Piso (p) pela fórmula de Blondel.</b> O piso precisa caber em duas faixas ao mesmo tempo: a do piso (' + nm.pMin + ' a ' + nm.pMax + ' cm) e a de Blondel, que com este espelho dá ' + nm.bMin + ' − 2 × ' + f(R.e, 2) + ' = ' + f(nm.bMin - 2 * R.e, 1) + ' até ' + nm.bMax + ' − 2 × ' + f(R.e, 2) + ' = ' + f(nm.bMax - 2 * R.e, 1) + ' cm. ' + (R.temFaixa ? 'As duas juntas deixam de ' + f(R.fP[0], 1) + ' a ' + f(R.fP[1], 1) + ' cm. ' : 'Elas não se cruzam: nenhum piso atende as duas, por isso aparece "não atende". ') + (S.pAuto ? 'O app pega o valor mais perto do meio de Blondel (' + f(nm.bMid, 1) + ' − 2e = ' + f(nm.bMid - 2 * R.e, 1) + ' cm), arredondado para centímetro inteiro quando possível: <b>' + f(R.p, 2) + ' cm</b>.' : 'Você definiu <b>' + f(R.p) + ' cm</b>.'));
  passos.push('<b>Superfícies entre espelhos.</b> N − 1 = ' + R.N + ' − 1 = <b>' + R.T + '</b>. O último espelho chega ao piso superior, que não é degrau da escada. ' + (R.nPat || R.nLeque ? 'Nesta escada essas ' + R.T + ' superfícies são: <b>' + R.contagem + '</b>. O patamar também fica entre dois espelhos, por isso entra na conta, mas não é um piso comum.' : 'Aqui todas são pisos comuns.'));
  if (!hel) passos.push('<b>Conferência de Blondel.</b> 2e + p = 2 × ' + f(R.e, 2) + ' + ' + f(R.p, 1) + ' = <b>' + f(R.bl, 1) + ' cm</b>, contra a referência de ' + nm.bMin + ' a ' + nm.bMax + ' cm.');
  passos.push('<b>Inclinação.</b> tangente do ângulo = e ÷ p = ' + f(R.e, 2) + ' ÷ ' + f(R.p, 1) + ' = ' + f(R.e / R.p, 3) + ', então o ângulo é <b>' + f(R.incl, 1) + '°</b> (' + f(R.e / R.p * 100, 0) + '%).');
  R.lances.forEach(t => passos.push('<b>Divisão do tipo.</b> ' + t));
  passos.push('<b>Altura livre e laje.</b> Altura livre é a distância vertical entre a superfície onde se pisa e a face de baixo do obstáculo mais próximo acima (laje, viga). Aqui foi pedido ' + f(S.hLivre) + ' cm, valor usual; confira qual exigência vale para o seu caso. A laje do piso de cima tem ' + f(S.espLaje) + ' cm; ' + (R.opening ? 'a partir do degrau ' + R.kc + ' a laje ficaria baixa demais sobre a escada (a altura do degrau mais ' + f(S.hLivre) + ' cm de altura livre passaria da face de baixo da laje, que fica a ' + f(R.H - S.espLaje) + ' cm). Por isso a laje precisa de uma <b>abertura</b>' + (R.opening.circle ? ' circular de Ø ' + f(R.opening.circle * 2) + ' cm.' : ' de aproximadamente ' + f(R.opening.w) + ' × ' + f(R.opening.h) + ' cm.') : 'não precisa ser aberta, a altura livre já é atendida.'));
  h += sec('Passo a passo da conta, com os seus números', ol(passos) + p('<i>Mudou algum número nas medidas? Esta aba se refaz sozinha.</i>'), true);

  /* 3. Tipo escolhido */
  const T = {
    'reta': ['Um lance único, sem mudança de direção.', 'Geometria simples: todos os degraus são iguais e o passo não muda ao longo da escada.', 'Exige comprimento em linha reta: aqui seriam ' + f(R.T * R.p / 100, 2) + ' m. Se o desnível passar do máximo sem patamar, não serve sozinha.'],
    'reta-patamar': ['Dois lances na mesma direção, separados por um patamar.', 'O patamar interrompe o lance e oferece uma superfície para descanso e circulação. Permite vencer desníveis acima do máximo sem patamar.', 'Continua precisando de comprimento em linha reta, e o patamar é área a mais. O comprimento mínimo depende do perfil: aqui ' + (nm.patReto ? fmt(nm.patReto) + ' cm (NBR 9050)' : 'igual à largura') + '.'],
    'l-patamar': ['Dois lances em ângulo reto, ligados por um patamar quadrado de lado igual à largura.', 'A curva acontece num piso plano, sem degraus de forma diferente. Cabe em cantos de parede.', 'O patamar ocupa um quadrado de ' + f(R.L) + ' × ' + f(R.L) + ' cm que não é degrau.'],
    'l-leque': ['Dois lances em ângulo reto, com a curva feita por degraus em leque no lugar do patamar.', 'Ocupa menos área que a versão com patamar, porque a curva já sobe.', 'Os leques convergem num ponto do lado interno, onde a largura do degrau é zero. O piso é medido na linha de caminhamento e conferido à parte, com Blondel próprio. O app não faz balanceamento de leques. A NBR 9050 pede patamar nas mudanças de direção, então essa solução não serve no perfil acessível.'],
    'u-patamar': ['Dois lances paralelos, de sentidos opostos, ligados por um patamar retangular (volta de 180°).', 'Ocupa menos comprimento: a escada dobra em vez de se esticar. A volta acontece num piso plano.', 'O patamar tem (2 × largura + vão) de comprimento. O vão entre os lances ocupa área e exige guarda-corpo seguro.'],
    'u-leque': ['Volta de 180° feita por duas curvas em leque, com pisos retos entre elas.', 'Ocupa menos área que a versão com patamar, porque a volta também sobe.', 'Os leques convergem no lado interno, sem balanceamento. O vão central é igual ao número de pisos retos do meio × ' + f(R.p, 1) + ' cm. Não serve no perfil NBR 9050, que pede patamar nas mudanças de direção.'],
    'helicoidal': ['Escada em caracol: os degraus são setores de círculo em volta de um pilar central.', 'Ocupa pouca área em planta: aqui um círculo de ' + f(R.helix ? R.helix.R * 2 : 0) + ' cm de diâmetro.', 'O piso depende do raio: junto ao pilar ele é muito curto, e a medida vale na linha de caminhamento. A altura livre depende do número de degraus por volta (aqui ' + (R.helix ? R.helix.nPer : '') + '), e a largura costuma ficar abaixo do mínimo de escadas comuns. Por isso muitos códigos tratam a helicoidal como exceção ou de uso restrito. Confirme no código do seu município.'],
  }[R.tipo];
  h += sec('Sobre o tipo escolhido: ' + tp.nome, dl([['O que é', T[0]], ['Por que usar', T[1]], ['Cuidados', T[2]]]) + (R.tipo === 'l-leque' || R.tipo === 'u-leque' ? p('<b>Por que o piso do leque é medido a ' + f(R.dw) + ' cm do lado interno?</b> Num degrau em leque o piso é diferente em cada ponto: zero junto ao canto interno e largo na parte externa. Por isso ele é medido numa linha definida, a linha de caminhamento. O perfil escolhido usa ' + f(nm.dw) + ' cm a partir do lado interno' + (nm.acess ? ' (a NBR 9050 indica 55 cm da borda interna em lances curvos)' : '') + (R.dw < nm.dw ? '; como a escada é estreita, o app usou ' + f(R.dw) + ' cm, o meio da largura' : '') + '. Confirme qual distância o seu professor ou o código adota.') : '') + (hel ? p('<b>Por que o piso é ' + f(R.p, 1) + ' cm?</b> Cada degrau gira ' + f(R.helix.th, 1) + '° (360° ÷ ' + R.helix.nPer + ' degraus por volta). A linha de caminhamento fica a ' + f(R.dw) + ' cm da borda do pilar, ou seja, no raio de ' + f(R.helix.rc) + ' + ' + f(R.dw) + ' = ' + f(R.helix.rw) + ' cm. O arco nesse raio mede raio × ângulo = ' + f(R.p, 1) + ' cm. O número de degraus por volta é o maior entre o que dá o piso desejado e o que dá a altura livre: ' + f(R.helix.nPer) + ' × ' + f(R.e, 2) + ' − ' + f(S.espDegrau) + ' = ' + f(R.helix.clearance) + ' cm de altura livre sob a volta de cima. A laje do piso superior fica fora do furo circular, e a chegada ocupa só uma posição de degrau, então essa é a folga calculada entre voltas na linha de caminhamento. O app não verifica outros obstáculos (vigas, guarda-corpo, forro).') : ''), false);

  /* 4. Como ler os desenhos */
  h += sec('Como ler a planta e o corte',
    anatomiaSVG(C) +
    dl([
      ['Planta', 'Vista de cima, como se a casa fosse cortada na horizontal. A NBR 6492 recomenda o plano a 1,50 m do piso, admitindo outra altura se for informada (aqui ' + f(R.zc) + ' cm, que dá o degrau ' + R.kCut + '). O que está abaixo do corte e à vista aparece em traço cheio. O que está acima aparece como projeção tracejada. A linha em zigue-zague marca onde a escada foi cortada.'],
      ['Planta do pavimento superior', 'Mostra o piso de cima. A escada só aparece através da abertura da laje, em traço cheio; onde dois trechos se sobrepõem, aparece o de cima.'],
      ['Linha de caminhamento', 'A linha laranja com seta: o caminho que uma pessoa faz ao usar a escada. Na planta do pavimento inferior a seta aponta para onde sobe e "SOBE" fica no primeiro degrau, com o nível ' + nivel(0) + '. Na planta do pavimento superior o app marca "DESCE", com a seta no sentido da descida.'],
      ['Perfil desenvolvido', 'Não é um corte A-A da edificação: é um esquema da escada esticada ao longo da linha de caminhamento, então curvas e leques viram trecho reto. Serve para ver a sequência de espelhos, a laje da escada, a altura livre (tracejado laranja) e o corrimão' + (nm.acess ? ' a 92 e 70 cm (a NBR 9050 pede os dois, dos dois lados)' : ' a 92 cm') + ', medido a partir do nariz dos degraus. Um corte A-A de verdade precisaria de uma linha de corte marcada na planta.'],
      ['Cotas', 'Todas em centímetros. Níveis em metros: ' + nivel(0) + ' é o piso de baixo e ' + nivel(R.H) + ' o de cima.'],
      ['3D', 'Volumes esquemáticos, só para enxergar o conjunto. Não representa o sistema construtivo. Gire arrastando.']
    ]), false);

  /* 5. Vocabulário */
  h += sec('Vocabulário',
    dl([
      ['Espelho', 'Parte vertical do degrau. Seu tamanho é a altura de cada passo (e).'],
      ['Piso', 'Parte horizontal onde se pisa. A profundidade p é medida entre as projeções de duas arestas (narizes) seguidas.'],
      ['Bocel (nariz)', 'Projeção da borda do degrau além do espelho. O avanço do bocel não se soma à profundidade p.'],
      ['Lance', 'Trecho contínuo de degraus entre dois patamares, ou entre um piso e um patamar.'],
      ['Patamar', 'Piso plano no início, no fim ou entre lances. Interrompe a continuidade do lance e oferece uma superfície para circulação e descanso; também é onde a escada pode mudar de direção.'],
      ['Degrau em leque', 'Degrau de forma trapezoidal ou triangular, mais estreito de um lado, usado para fazer a escada virar sem patamar.'],
      ['Linha de caminhamento', 'Linha imaginária por onde a pessoa anda. É nela que se mede o piso de degraus que não são retangulares.'],
      ['Fórmula de Blondel', '2e + p = ' + nm.bMin + ' a ' + nm.bMax + ' cm. Relação empírica entre a altura do espelho e a profundidade do piso, usada para avaliar a passada. Leva o nome de François Blondel, arquiteto e engenheiro francês do século XVII.'],
      ['Altura livre', 'Distância vertical entre a superfície de apoio (o piso do degrau) e a face de baixo do obstáculo superior mais próximo.'],
      ['Abertura (vão) na laje', 'Recorte na laje do piso superior onde a escada passa, necessário quando o teto ficaria baixo sobre os degraus.'],
      ['Corte e planta', 'Planta é um corte horizontal visto de cima. Corte é um corte vertical, indicado na planta por uma linha com letras (A-A). O perfil desenvolvido deste app é outra coisa: um esquema do percurso esticado.'],
      ['Cota', 'Número que indica uma medida ou altura no desenho.'],
      ['Desnível', 'Diferença de altura entre os dois pisos que a escada liga.']
    ]), false);

  /* 6. Normas */
  h += sec('Sobre as normas e limites deste app',
    p('Perfil usado agora: <b>' + nm.nome + '</b>. Espelho ' + nm.eMin + ' a ' + nm.eMax + ' cm, piso ' + nm.pMin + ' a ' + nm.pMax + ' cm, Blondel ' + nm.bMin + ' a ' + nm.bMax + ' cm, largura mínima ' + nm.Lmin + ' cm, desnível máximo sem patamar ' + nm.hPat + ' cm, linha de caminhamento a ' + nm.dw + ' cm do lado interno.') +
    p('<b>Perfil NBR 9050.</b> Usa os valores do item 6.8 da ABNT NBR 9050:2020 (versão corrigida de 2021): espelho 16 a 18 cm, piso 28 a 32 cm, 2e + p de 63 a 65 cm, patamar a cada 3,20 m de desnível e nas mudanças de direção, largura de 1,20 m em rota acessível, corrimãos a 0,92 e 0,70 m. Conferi esses valores em fontes secundárias em 16/11/2026; uma revisão externa diz ter conferido no texto da norma, inclusive os 55 cm da linha em lances curvos (6.8.6), que eu não conferi. O app faz só uma <b>conferência dimensional parcial</b>: passar nele não quer dizer que a escada é acessível.') +
    p('<b>Perfil Estudo.</b> Piso a partir de 25 cm, Blondel 63 a 64 cm e largura de 80 cm são valores comuns em apostilas e códigos de obras, mas <b>não há uma norma nacional</b> que os sustente para uso residencial. Use como hipótese de estudo e troque pelos valores que o professor ou o código da cidade indicarem, em "Personalizada".') +
    p('<b>Saídas de emergência.</b> Escadas de rota de fuga seguem a NBR 9077 e a norma técnica do Corpo de Bombeiros de cada estado. Segundo a revisão externa (eu não conferi no texto oficial), a NBR 9077 veda leques e escada em espiral nessas rotas. O app não valida escada de emergência.') +
    p('O app calcula geometria e confere parte dos limites. Ele não faz dimensionamento estrutural, guarda-corpo, sinalização, piso tátil nem escolha de material.'), false);

  /* 7. Perguntas */
  const pergs = [
    ['Por que há um piso a menos que espelhos?', 'Porque o último espelho termina no piso do andar de cima. Esse piso já existe e não é degrau da escada. Aqui são ' + R.N + ' espelhos e ' + R.T + ' superfícies entre eles: ' + R.contagem + '.'],
    ['Por que dividir o desnível por um número inteiro?', 'Para todos os espelhos serem iguais. Uma diferença de poucos milímetros entre degraus já faz as pessoas tropeçarem, porque o corpo se acostuma com o ritmo.'],
    ['De onde vem a fórmula 2e + p?', 'É associada ao arquiteto François Blondel, do século XVII. É uma relação empírica entre espelho e piso, usada para avaliar se a passada na escada fica confortável. Evite dizer que ela prova que subir custa o dobro de andar: isso é uma leitura comum, não uma lei demonstrada.'],
    ['Por que não fazer o piso maior para a escada ficar mais suave?', 'Porque a escada fica comprida e o passo passa do conforto: com piso grande demais a pessoa precisa esticar o passo. O Blondel fecha os dois lados.'],
    ['Quando uso patamar?', 'Quando o desnível passa do máximo sem patamar (no perfil atual, ' + nm.hPat + ' cm) e, pela NBR 9050, também nas mudanças de direção. Aqui o desnível é ' + f(R.H) + ' cm' + (R.H > nm.hPat ? ', maior que o limite, então o patamar é obrigatório.' : ', menor que o limite, então o patamar não é obrigatório por essa regra.')],
    ['Qual a vantagem do leque sobre o patamar?', 'Ocupa menos área em planta. A desvantagem é o piso estreito perto do lado interno. Por isso o piso e o Blondel dos leques são conferidos na linha de caminhamento, à parte dos trechos retos. A NBR 9050 pede patamar nas mudanças de direção.'],
    ['Por que os leques terminam em ponta?', 'Porque o app usa leques convergentes, todos saindo do mesmo canto interno. Existe a técnica de balanceamento, que distribui os leques para não ficarem com ponta zero; o app não faz isso, e mostra esse item como "atenção".'],
    ['A área em planta é a área da escada?', 'O app mostra duas coisas: o retângulo envolvente (' + f((R.bbox[2] - R.bbox[0]) / 100, 2) + ' × ' + f((R.bbox[3] - R.bbox[1]) / 100, 2) + ' m) e a área que a escada ocupa de fato (' + f(R.areaOcup / 10000, 2) + ' m²), que é a soma dos degraus e patamares.'],
    ['Por que a laje do andar de cima é aberta?', 'Para manter a altura livre. Se a laje continuasse inteira por cima dos últimos degraus, a cabeça de quem sobe bateria nela. A abertura começa no degrau ' + (R.kc || '—') + ' nesta escada.'],
    ['Esta escada atende às normas?', (R.checks.some(c => c.status === 'bad') ? 'Não no perfil escolhido: há itens que não atendem (veja a lista).' : R.checks.some(c => c.status === 'warn') ? 'Os itens conferidos não reprovam, mas há pontos em atenção que o app não valida.' : 'Nenhuma das verificações implementadas reprovou.') + ' O app confere só parte das exigências; quem decide é o texto da norma vigente e o código do município.'],
    ['Isso é um corte A-A?', 'Não. É um perfil desenvolvido: a escada esticada ao longo da linha de caminhamento, para mostrar a sequência de espelhos e a altura livre.']
  ];
  h += sec('Perguntas que o professor pode fazer', '<dl>' + pergs.map(x => '<dt>' + x[0] + '</dt><dd>' + x[1] + '</dd>').join('') + '</dl>', false);

  return h;
}
