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
4. Confira visualmente quando mexer em desenho: abra `index.html` no navegador e veja os 7 tipos nas abas Planta, Perfil, 3D e Explicação, no desktop e com largura de celular (390 px).
5. Troque a constante `VERSAO` em `sw.js` (ex.: `patamar-v4-1` para `patamar-v5-1`). Sem isso, quem instalou o app continua com a versão antiga.
6. Faça o commit de `src/`, `tests/`, `index.html` e `sw.js` juntos, com mensagem em PT-BR. O Pages publica sozinho em 1 ou 2 minutos.

## Regras técnicas

- Não invente norma, item, número ou fonte. Se um limite não foi conferido no texto da norma, diga isso no app e na resposta.
- Os perfis ficam em `NORMAS`, no `core.js`. Fontes conferidas no texto das normas em 16/11/2026:
  - **Estudo**: espelho 16 a 18, piso 25 a 32, Blondel 63 a 64, largura 80, linha a 55 cm (no eixo abaixo de 110 cm), ponta de leque 15 cm, lance de 3 espelhos no mínimo, patamar reto pela fórmula (2e + p) + p. Blondel, linha, ponta, lance e patamar vêm da NBR 9077:2001 (4.7.3.1 b e c, 3.32, 4.7.3.2, 4.7.3.3 a). Piso 25, largura 80 e 3,20 m sem patamar não têm fonte nacional.
  - **NBR 9050:2020**, versão corrigida de 2021: 6.8.2 (espelho 16 a 18, piso 28 a 32, Blondel 63 a 65), 6.8.3 (largura 120), 6.8.6 (linha a 55 cm da borda interna em lances curvos, Figura 75 com ponta ≥ 15), 6.8.7 (patamar a cada 320 cm e nas mudanças de direção), 6.8.8 (patamar reto de 120 cm), 6.9.3.2 (corrimãos a 92 e 70 cm, prolongados 30 cm). É uma conferência dimensional parcial, não uma validação de acessibilidade.
  - **Personalizada**: limites digitados pelo usuário, validados (positivos, faixas não invertidas, ponta do leque ≥ 0).
- **NBR 9077:2025** (terceira edição, 16/07/2025) substitui a de 2001 e **não foi lida** (é paga). Todo texto que cita a NBR 9077 precisa dizer que é a edição de 2001.
- Cópias públicas usadas na conferência: NBR 9077:2001 no site do CNMP, NBR 9050:2020 no drive da Prefeitura de São Paulo, NPT 011 dos Bombeiros do PR. O ambiente de nuvem "patamar" libera esses hosts.
- Status das verificações: `bad` = fora do limite do perfil ("não atende"); `warn` = algo que o app não consegue validar; `info` = só informação. A tolerância é 1e-6 (só erro de arredondamento), nunca uma folga de obra.
- Entrada inválida não é corrigida em silêncio: `calc` lança erro e a interface mostra a mensagem, sem desenho.
- A contagem é N espelhos e N − 1 superfícies entre eles. Patamar e leque contam como superfícies, mas não como "pisos comuns". Use `R.contagem`, `R.nReto`, `R.nLeque` e `R.nPat`.
- **Leques**: o padrão é `leque: 'bal'` (balanceados, função `balanceado()` no `core.js`). Todos os degraus têm piso p na linha de caminhamento; as larguras na borda interna seguem progressão aritmética numa zona que cresce até a ponta chegar a `lqMin`. `leque: 'conv'` mantém os leques convergentes antigos, para comparar. Cada polígono tem `wIn` e `wOut` (largura nas bordas interna e externa). Teste de área: no balanceado, a soma de todos os degraus é a área do contorno; no convergente, os leques somam L² por curva.
- O "Perfil" é desenvolvido ao longo da linha de caminhamento. **Não é corte A-A**, e os textos não podem chamá-lo assim. Os cortes A-A e B-B (aba Cortes) são planos verticais de verdade: A ao longo do 1º lance, B atravessado a ele, deslocáveis (`corteA`, `corteB`); o que é cortado vira poché, o que está além aparece em vista.
- `R.zBot(pl, [x, y])` dá a cota da face inferior da laje em qualquer ponto da planta (espessura `tLaje` na perpendicular à linha dos cantos internos; patamar horizontal). Cortes, 3D e quantitativos usam essa função.
- Tipos: reta, reta-patamar, l-patamar, l-leque, u-patamar, u-leque, c-patamar, z-patamar (três lances, dois patamares) e helicoidal (com "Degraus por volta" automático ou escolhido).
- O artefato do claude.ai não permite download; o "Baixar PNG" só funciona no Pages ou no arquivo local.

## Pendências conhecidas

- O 3D não mostra armadura nem acabamentos; o detalhe do degrau é sempre de um degrau reto típico.
- Os quantitativos são estimativas da geometria (sem perdas nem armadura).
- A edição de 2025 da NBR 9077 não foi lida.
- O balanceamento usa progressão aritmética das larguras na borda interna. A NBR 9077:2001 fala em "sistemas de balanceamento recomendados" sem fixar um; outros processos gráficos dão degraus um pouco diferentes.
- O "Imprimir / PDF" usa `window.print()`; no artefato do claude.ai pode não abrir.

Relatório com fontes e o plano das correções anteriores: https://claude.ai/artifact/HDivZUpEWVE1FGpeLKgLH5
