# Patamar

Calculadora de escadas para estudantes de arquitetura. Ela calcula e desenha planta, cortes A-A e B-B, perfil desenvolvido, detalhe do degrau e 3D, e tem uma aba "Explicação" para a estudante apresentar ao professor. É um app web de página única instalável (PWA), publicado pelo GitHub Pages a partir da branch `main`, na raiz: https://nullrender.github.io/patamar/

## Quem usa e como falar

- O dono do repositório fala português do Brasil e não lê inglês. Responda, comente o código e escreva mensagens de commit em PT-BR.
- Ele não é programador, mas usa terminal (Arch Linux). Ao pedir algo a ele, dê passo a passo com comandos explícitos.
- Formatos brasileiros: vírgula decimal, datas dd/mm/aaaa, unidades métricas. Todas as medidas internas estão em **cm**.
- A usuária final é uma estudante. Qualquer texto da interface deve ser algo que ela consiga explicar em voz alta.

## Estrutura

```
src/core.js      cálculo e geometria (sem DOM). calc(estado) devolve tudo; erro de entrada lança RangeError com .patamar = true
src/draw.js      SVG da planta (inferior/superior, com as chamadas de corte), do perfil desenvolvido e dos cortes A-A/B-B (corteSVG, cortesDe)
src/detail.js    detalhe do degrau ampliado (detalheSVG)
src/r3d.js       3D próprio (rasterizador com z-buffer em canvas 2D): fundo real da laje (R.zBot) e corrimãos
src/problemas.js seção "Problemas comuns" da Explicação (o que dá errado na prática e como se resolve, com fontes)
src/dxf.js       exportação DXF R12 (dxfDe, dxfBytes): converte os SVGs dos desenhos em entidades reais, em m ou cm, com camadas pelo data-camada
src/prancha.js   prancha em escala (montarPrancha, pranchaSVG, pranchasSVG): A3/A2/A4, 1:50 automático, várias folhas, carimbo e régua de 100 mm
src/explain.js   aba "Explicação": textos montados com os números do cálculo
src/ui.js        interface, estado, localStorage (chave patamar-v1), hash #<tipo>[-planta|-corte|-3d|-explica]
src/template.html  HTML e CSS; o build injeta o JS no lugar de /*__SCRIPT__*/
build.js         gera index.html (não edite index.html à mão)
tests/           test_core.js, edge.js, aceite.js (rodam no Node, sem dependências)
sw.js            service worker (offline); manifest.webmanifest e icon-* do PWA
```

## Fluxo obrigatório a cada mudança

1. Edite só os arquivos em `src/` (ou `sw.js`, o manifesto e os ícones).
2. `node build.js`
3. `npm test`. Precisa terminar com "todos passaram". Toda correção nova ganha um teste em `tests/aceite.js`.
4. Confira visualmente quando mexer em desenho ou interface: abra `index.html` no navegador e veja os 9 tipos nas abas Planta, Cortes, 3D e Explicação em 390, 820, 1024 e 1440 px, nos temas claro e escuro.
5. Troque a constante `VERSAO` em `sw.js` (ex.: `patamar-v4-1` para `patamar-v5-1`). Sem isso, quem instalou o app continua com a versão antiga.
6. Faça o commit de `src/`, `tests/`, `index.html` e `sw.js` juntos, com mensagem em PT-BR. O Pages publica sozinho em 1 ou 2 minutos.

## Regras técnicas

- Não invente norma, item, número ou fonte. Se um limite não foi conferido no texto da norma, diga isso no app e na resposta.
- Os perfis ficam em `NORMAS`, no `core.js`. Fontes conferidas no texto das normas (NBR 9077:2025 em 17/11/2026, as demais em 16/11/2026):
  - **Estudo**: espelho 16 a 18, piso 25 a 32, Blondel 63 a 64, largura 80, linha a 55 cm (no eixo abaixo de 110 cm), ponta de leque 15 cm, lance de 3 espelhos no mínimo, patamar reto pela fórmula (2e + p) + p. Blondel, linha, ponta, lance e patamar vêm da NBR 9077:2001 (4.7.3.1 b e c, 3.32, 4.7.3.2, 4.7.3.3 a), **cancelada** pela de 2025: são referência de estudo. Piso 25, largura 80 e 3,20 m sem patamar não têm fonte nacional.
  - **Rota de fuga** (`fuga`): NBR 9077:2025 — 9.1.10 (degraus, patamares e larguras pela NBR 9050), 9.1.11 (sem leque e sem espiral), 9.1.12 (mudança de direção só por patamar, com largura não inferior à dos lances), 9.1.5 (corrimão dos dois lados), 3.11 (espelho não vazado), 4.2 b (pé-direito 2,30 m; 2,10 m sob vigas e obstáculos), 9.4.2.2 (largura pela NBR 9050). Números da NBR 9050.
  - **Mezanino ou área privativa** (`mez`): NBR 9077:2025, 9.5.9.1 — leque, espiral ou lances retos; população < 20 e altura percorrida até 3,7 m (a); largura 0,80 m (b); piso antiderrapante, atrito dinâmico ≥ 0,5 (c); corrimão, de um lado só se a largura < 1,20 m (d); guarda-corpo (e); Anexo A e patamares de 0,80 m nas escadas curvas e em leque (f). Espelho, piso, Blondel e ponta não são fixados: o perfil usa os do Estudo como referência, e a ponta abaixo de 15 cm é atenção, não "não atende".
  - **NBR 9050:2020**, versão corrigida de 2021: 6.8.2 (espelho 16 a 18, piso 28 a 32, Blondel 63 a 65), 6.8.3 (largura 120), 6.8.6 (linha a 55 cm da borda interna em lances curvos, Figura 75 com ponta ≥ 15), 6.8.7 (patamar a cada 320 cm e nas mudanças de direção), 6.8.8 (patamar reto de 120 cm), 6.9.3.2 (corrimãos a 92 e 70 cm, prolongados 30 cm). É uma conferência dimensional parcial, não uma validação de acessibilidade.
  - **Personalizada**: limites digitados pelo usuário, validados (positivos, faixas não invertidas, ponta do leque ≥ 0).
- **NBR 9077:2025** (terceira edição, 16/07/2025) cancela a de 2001; o Prefácio deixa usar a de 2001 só em projetos protocolados até 365 dias depois (16/07/2026). Foi lida em 17/11/2026 numa cópia enviada pelo dono (imagem; ficha com os trechos conferidos no histórico do PR). Ela **não** tem escada secundária nem de serviço, nem Blondel, ponta de leque, linha de caminhamento ou fórmula do patamar: remete à NBR 9050. Toda citação da NBR 9077 diz a edição; a de 2001 aparece como cancelada.
- A NBR 9050:2020 (versão corrigida de 2021) segue vigente: em 17/11/2026 não havia edição nova (só confirmação em 12/2025).
- Cópias públicas usadas na conferência: NBR 9077:2001 no site do CNMP, NBR 9050:2020 no drive da Prefeitura de São Paulo, NPT 011 dos Bombeiros do PR. O ambiente de nuvem "patamar" libera esses hosts.
- Status das verificações: `bad` = fora do limite do perfil ("não atende"); `warn` = algo que o app não consegue validar; `info` = só informação. A tolerância é 1e-6 (só erro de arredondamento), nunca uma folga de obra.
- Entrada inválida não é corrigida em silêncio: `calc` lança erro e a interface mostra a mensagem, sem desenho. O erro traz `.campo` (chave do estado, ex.: `'H'`) para a interface marcar o campo. Desnível < 20 cm ou largura < 30 cm dão erro (provável valor em metros).
- Interface: faixa de tipos no topo; no celular, três painéis (Dados / Desenho / Verificações) com barra fixa embaixo e botão "Ampliar" no desenho; tablet com duas colunas; PC com três. O "Como resolver" roda depois de desenhar, com cache por estado. Perfil salvo que não existe mais (`sec`, `serv`) vira `mez` com aviso (`migrarNorma`); qualquer outro desconhecido volta ao Estudo com aviso.
- No perfil `mez`, o que a 9.5.9.1 não fixa (espelho, piso, Blondel, lance, patamares, ponta) aparece como atenção (`warn`), nunca como "não atende". No `fuga`, a verificação `hlivre` confere os 2,10 m da 4.2 b.
- A contagem é N espelhos e N − 1 superfícies entre eles. Patamar e leque contam como superfícies, mas não como "pisos comuns". Use `R.contagem`, `R.nReto`, `R.nLeque` e `R.nPat`.
- **Leques**: o padrão é `leque: 'bal'` (balanceados, função `balanceado()` no `core.js`). Todos os degraus têm piso p na linha de caminhamento; as larguras na borda interna seguem progressão aritmética numa zona que cresce até a ponta chegar a `lqMin`. `leque: 'conv'` mantém os leques convergentes antigos, para comparar. Cada polígono tem `wIn` e `wOut` (largura nas bordas interna e externa). Teste de área: no balanceado, a soma de todos os degraus é a área do contorno; no convergente, os leques somam L² por curva.
- **Estrutura** (`estrutura`): `'laje'` (degraus sobre laje maciça; na helicoidal, laje helicoidal) ou `'balanco'` (placas soltas de `espDegrau`, sem espelho; `R.placas`). Padrão: helicoidal em balanço, os demais em laje. Valem nos 9 tipos.
- **Como resolver**: `R.resolver()` preenche `c.sol` sob demanda, testando cada saída com `calc` (`_semSol`); só mostra o que de fato resolve. A interface chama fora da digitação.
- A elevação (aba Cortes) é `elevacaoSVG` / `corteSVG(..., 'E', lado)`: nada é cortado, a laje do piso de cima aparece em vista.
- O "Perfil" é desenvolvido ao longo da linha de caminhamento. **Não é corte A-A**, e os textos não podem chamá-lo assim. Os cortes A-A e B-B (aba Cortes) são planos verticais de verdade: A ao longo do 1º lance, B atravessado a ele, deslocáveis (`corteA`, `corteB`); o que é cortado vira poché, o que está além aparece em vista.
- `R.zBot(pl, [x, y])` dá a cota da face inferior da laje em qualquer ponto da planta (espessura `tLaje` na perpendicular à linha dos cantos internos; patamar horizontal). Cortes, 3D e quantitativos usam essa função.
- Tipos: reta, reta-patamar, l-patamar, l-leque, u-patamar, u-leque, c-patamar, z-patamar (três lances, dois patamares) e helicoidal (com "Degraus por volta" automático ou escolhido).
- **Prancha e DXF**: os desenhos aceitam `o.fs` (tamanho do texto em cm) e `o.semTitulo` (sem bloco de título; a prancha e o DXF põem o seu). Na prancha, `width_mm = viewBox_cm × 10 / escala` garante a escala; o padrão é várias folhas mantendo 1:50 (`folhas: 'varias'`), com a opção de uma folha só reduzindo a escala. O DXF é R12 (AC1009), em windows-1252, em verdadeira grandeza (o corrimão do detalhe é fora de escala e o título diz isso). Nenhum texto pode sair do viewBox: há teste nos 9 tipos.
- O artefato do claude.ai não permite download; o "Baixar PNG" só funciona no Pages ou no arquivo local.

## Pendências conhecidas

- O 3D não mostra armadura nem acabamentos; o detalhe do degrau é sempre de um degrau reto típico.
- Os quantitativos são estimativas da geometria (sem perdas nem armadura).
- A 9.5.9.1 f (patamares de 0,80 m nas escadas curvas e em leque) não diz onde ficam os patamares; o app mostra como atenção.
- O balanceamento usa progressão aritmética das larguras na borda interna. A NBR 9077:2001 fala em "sistemas de balanceamento recomendados" sem fixar um; outros processos gráficos dão degraus um pouco diferentes.
- O "Imprimir / PDF" usa `window.print()`; no artefato do claude.ai pode não abrir.

Relatório com fontes e o plano das correções anteriores: https://claude.ai/artifact/HDivZUpEWVE1FGpeLKgLH5
