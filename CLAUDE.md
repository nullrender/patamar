# Patamar

Calculadora de escadas para estudantes de arquitetura. Ela calcula e desenha planta, perfil desenvolvido e 3D, e tem uma aba "Explicação" para a estudante apresentar ao professor. É um app web de página única instalável (PWA), publicado pelo GitHub Pages a partir da branch `main`, na raiz: https://nullrender.github.io/patamar/

## Quem usa e como falar

- O dono do repositório fala português do Brasil e não lê inglês. Responda, comente o código e escreva mensagens de commit em PT-BR.
- Ele não é programador, mas usa terminal (Arch Linux). Ao pedir algo a ele, dê passo a passo com comandos explícitos.
- Formatos brasileiros: vírgula decimal, datas dd/mm/aaaa, unidades métricas. Todas as medidas internas estão em **cm**.
- A usuária final é uma estudante. Qualquer texto da interface deve ser algo que ela consiga explicar em voz alta.

## Estrutura

```
src/core.js      cálculo e geometria (sem DOM). calc(estado) devolve tudo; erro de entrada lança RangeError com .patamar = true
src/draw.js      SVG da planta (inferior/superior) e do perfil desenvolvido
src/r3d.js       3D próprio (rasterizador com z-buffer em canvas 2D)
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
- Os perfis ficam em `NORMAS`, no `core.js`:
  - **Estudo**: espelho 16 a 18, piso 25 a 32, Blondel 63 a 64, largura 80, linha a 50 cm. O Blondel tem fonte na NBR 9077:2001 (4.7.3.1 b). Piso 25 e largura 80 não têm fonte nacional.
  - **NBR 9050:2020** (item 6.8): piso 28 a 32, Blondel 63 a 65, largura 120, patamar a cada 320 cm e nas mudanças de direção, patamar reto de 120 cm, linha a 55 cm da borda interna, corrimãos a 92 e 70 cm. É uma conferência dimensional parcial, não uma validação de acessibilidade.
  - **Personalizada**: limites digitados pelo usuário, validados (positivos, faixas não invertidas).
- Status das verificações: `bad` = fora do limite do perfil ("não atende"); `warn` = algo que o app não consegue validar; `info` = só informação. A tolerância é 1e-6 (só erro de arredondamento), nunca uma folga de obra.
- Entrada inválida não é corrigida em silêncio: `calc` lança erro e a interface mostra a mensagem, sem desenho.
- A contagem é N espelhos e N − 1 superfícies entre eles. Patamar e leque contam como superfícies, mas não como "pisos comuns". Use `R.contagem`, `R.nReto`, `R.nLeque` e `R.nPat`.
- O "Perfil" é desenvolvido ao longo da linha de caminhamento. **Não é corte A-A**, e os textos não podem chamá-lo assim.
- O artefato do claude.ai não permite download; o "Baixar PNG" só funciona no Pages ou no arquivo local.

## Pendências conhecidas

- **P2: balanceamento de leques.** Hoje os leques convergem num ponto (largura 0 no canto interno). A NBR 9077 (4.7.3.1 c) pede leques balanceados, com a parte mais estreita de pelo menos 15 cm. O app só avisa. Implementar exige rever `winders()` no `core.js`, o comprimento na linha de caminhamento (`wlen`) e os testes de área (a soma das áreas dos leques precisa continuar igual a L² por curva de 90°).
- Não existe corte A-A real com chamada na planta, e o 3D é só volumétrico.
- A edição de 2025 da NBR 9077 não foi lida.

Relatório com fontes e o plano das correções anteriores: https://claude.ai/artifact/HDivZUpEWVE1FGpeLKgLH5
