/* ===== PROBLEMAS COMUNS: norma x prática, e como os profissionais resolvem =====
   Conteúdo tirado só da pesquisa verificada (normas lidas: NBR 9077:2001, NBR 9050:2020,
   NPT 011 dos Bombeiros do PR, NT 11/2021 dos Bombeiros de GO). O que não tem fonte aparece
   como "prática comum, sem fonte". A NBR 9077:2025 não foi lida e nada é atribuído a ela.
   Cada problema tem "ids": as verificações do calc que, com status 'bad' ou 'warn',
   mostram que o problema está acontecendo na escada atual. */

const PROB_SF = 'prática comum, sem fonte';
const PROB_PR = 'NPT 011 dos Bombeiros do PR';
const PROB_GO = 'NT 11/2021 dos Bombeiros de GO';

const PROBLEMAS = [
  { tema: 'Geometria do degrau', itens: [
    { t: 'Espelho alto (19 a 20 cm) em casa apertada', ids: ['e'], cond: R => R.e > R.nm.eMax + 1e-6,
      pq: 'O desnível é fixo e a projeção em planta é pequena; com menos espelhos, cada um fica mais alto e a escada fica mais curta.',
      regra: 'Saída de emergência: espelho de 16 a 18 cm (NBR 9077:2001, 4.7.3.1 a). Rota acessível: 16 a 18 cm, sem exceção (NBR 9050:2020, 6.8.2). Só nas escadas secundárias "exclusivamente de serviço" a NBR 9077:2001 (4.7.5.2) aceita até 20 cm (19 cm no grupo de ocupação H, 23 cm em I e J), sempre com Blondel. O PR (' + PROB_PR + ', 5.7.5.1 e 5.7.5.2) aceita os mesmos 20 cm em mezanino e área privativa, que inclui a residência unifamiliar, com população abaixo de 10 pessoas e escada de até 3,7 m. GO (' + PROB_GO + ', 5.7.5.1 e 5.7.5.2) aceita em escada de uso restrito, exclusivamente de serviço, com população abaixo de 20, escada de até 3,7 m e um só pavimento atendido. O limite do código de obras municipal não foi encontrado.',
      sol: [
        ['Enquadrar como escada privativa ou de serviço, onde o código local ou os Bombeiros do estado admitirem, com espelho de até 19 ou 20 cm e mantendo Blondel', 'só fora de rota de fuga e de rota acessível; com espelho de 20 cm, Blondel pede piso de 23 a 24 cm (cerca de 40°); exige corrimão e guarda', 'NBR 9077:2001, 4.7.5.2; ' + PROB_PR + ', 5.7.5.2; ' + PROB_GO + ', 5.7.5.2'],
        ['Trocar o tipo de escada para ganhar desenvolvimento na mesma área: L ou U com leque, ou helicoidal', 'os leques precisam de balanceamento, com ponta de 15 cm (7 cm em escada secundária)', PROB_SF],
        ['Começar a escada fora da projeção da laje, avançando os primeiros degraus no ambiente de baixo, ou aumentar o vão da laje', 'ocupa área do pavimento de baixo; mexer na laje passa pelo projeto estrutural', PROB_SF],
        ['Reduzir o desnível (laje mais fina ou pé-direito menor), dentro do mínimo do código de obras', 'depende do pé-direito mínimo do município e do cálculo estrutural', PROB_SF]
      ] },
    { t: 'Blondel fora da faixa: piso curto com espelho normal, ou piso longo com espelho baixo', ids: ['blondel', 'p', 'blondel-leque'],
      pq: 'O comprimento é fixado pela planta, o espelho pelo desnível, e o piso vira "o que sobra" (' + PROB_SF + ').',
      regra: 'A fórmula de Blondel soma dois espelhos e um piso (2e + p), que é o tamanho do passo. NBR 9077:2001, 4.7.3.1 b: 63 a 64 cm, também nas escadas secundárias (4.7.5.1 d e 4.7.5.2). NBR 9050:2020, 6.8.2: 63 a 65 cm, com piso de 28 a 32 cm, em rota acessível. Só em GO (' + PROB_GO + ', nota da 5.7.5.2) o Blondel é dispensado, e apenas no acesso a barrilete, casa de máquinas e mezanino técnico. Piso mínimo de 25 cm para casa: sem fonte nacional.',
      sol: [
        ['Mudar o número de espelhos (um a mais ou a menos) e tirar o piso da faixa de Blondel, em vez de fixar o piso pelo comprimento', 'cada espelho a mais acrescenta um piso ao comprimento', 'NBR 9077:2001, 4.7.3.1 b'],
        ['Usar bocel (a saliência da borda do degrau) ou espelho inclinado para ganhar área de pisada sem aumentar a projeção', 'ganho de cerca de 1,5 cm; não foi conferido se o "b" de Blondel inclui o bocel; o risco de um bocel grande prender o pé é ' + PROB_SF, 'NBR 9077:2001, 4.7.3.1 e; NBR 9050:2020, 6.7.1'],
        ['Mudar a forma da escada (L, U, leque) para ganhar desenvolvimento', 'leques pedem balanceamento (NBR 9077:2001, 4.7.3.1 c)', PROB_SF]
      ] },
    { t: 'Desnível que não divide certinho, e primeiro ou último degrau diferente na obra', ids: [],
      pq: 'O projeto usa a cota da laje bruta e a obra a cota acabada (ou o contrário), e a diferença do revestimento vai parar no primeiro ou no último espelho (' + PROB_SF + ').',
      regra: 'NBR 9077:2001, 4.7.3.1 d: num mesmo lance todas as alturas são iguais; entre lances seguidos, diferença de no máximo 5 mm. NBR 9050:2020, 6.8.2: pisos e espelhos constantes em toda a escada. No PR, o mesmo para escadas secundárias (' + PROB_PR + ', 5.7.5.3 g). Nenhuma das normas lidas aceita primeiro ou último degrau diferente. Programas como o TQS jogam a diferença no último degrau (ajuda do TQS, lido só o resumo), mas isso é convenção de programa, não regra.',
      sol: [
        ['Calcular o número de espelhos entre pisos ACABADOS e desenhar o degrau em osso (só o concreto) descontando o revestimento, com as duas cotas no detalhe', 'exige definir os acabamentos antes de concretar', PROB_SF],
        ['Escolher um número inteiro de espelhos e fazer todos iguais (desnível ÷ número), arredondado ao milímetro', 'um espelho a mais acrescenta um piso ao comprimento', 'NBR 9077:2001, 4.7.3.1 a e d; NBR 9050:2020, 6.8.2'],
        ['Escada já feita errada: corrigir na espessura do contrapiso ou do revestimento; se não der, refazer o degrau', 'dentro de um lance, qualquer altura diferente descumpre as duas normas', PROB_SF]
      ] },
    { t: 'Lance com 1 ou 2 degraus (degrau isolado)', ids: ['lanco'],
      pq: 'Pequenos desníveis de projeto, ou um lance curto que sobra ao dividir os espelhos entre dois lances.',
      regra: 'NBR 9077:2001, 4.7.3.2: lance mínimo de três degraus; 4.6.1 c: em saída de emergência, desnível abaixo de 48 cm pede rampa. GO repete os três degraus (' + PROB_GO + ', 5.7.3.2). NBR 9050:2020, 6.7.2: até dois degraus seguidos é "degrau isolado" e deve ser evitado; se usado, com corrimão (6.9.4) e faixa de cor contrastante de pelo menos 3 cm no piso e no espelho (5.4.4.1).',
      sol: [
        ['Trocar por rampa (obrigatória em saída de emergência abaixo de 48 cm)', 'pede comprimento: a 10% de inclinação, 1 m de rampa a cada 10 cm de desnível; o máximo é 10% ou 12,5% conforme a ocupação', 'NBR 9077:2001, 4.6.1 c e 4.6.3.2'],
        ['Redistribuir os espelhos entre os lances para nenhum ficar com menos de 3', 'muda a posição do patamar', 'NBR 9077:2001, 4.7.3.2'],
        ['Se mantido fora de rota de fuga: mesmas medidas da escada, corrimão e faixa contrastante no piso e no espelho', 'a própria norma manda evitar', 'NBR 9050:2020, 6.7.2, 5.4.4.1 e 6.9.4'],
        ['Eliminar o desnível nivelando o contrapiso, quando for de poucos centímetros', 'muda as cotas de piso; pode pedir impermeabilização ou soleira', PROB_SF]
      ] },
    { t: 'Acesso muito íngreme a sótão, mezanino ou caixa d\'água (escada de marinheiro, "de navio" ou de passo alternado)', ids: [],
      pq: 'Sótão ou mezanino com pouca área de piso para uma escada que atenda Blondel.',
      regra: 'A NBR 9077:2001 e a NBR 9050:2020 não falam de escada de marinheiro (a escada vertical, de degraus de barra) nem de passo alternado. Em GO (' + PROB_GO + ', nota da 5.7.5.2), barrilete, casa de máquinas e piso ou mezanino técnico de manutenção eventual podem ter marinheiro, espiral ou leque sem largura mínima e sem Blondel. No PR, mezanino e área privativa seguem Blondel (' + PROB_PR + ', 5.7.5.1 f), o que não combina com marinheiro em mezanino ocupado. A NR-35 (Anexo III) trata de escadas de uso individual no trabalho (lido só o resumo). Passo alternado: nenhuma regra brasileira encontrada.',
      sol: [
        ['Separar o uso: espaço técnico com escada de marinheiro, onde os Bombeiros admitirem, tratado como trabalho em altura; ambiente de permanência com escada que atenda Blondel', 'a escada de permanência ocupa bem mais área; a de marinheiro não serve para carregar coisas nem para fuga (' + PROB_SF + ')', PROB_GO + ', nota da 5.7.5.2; NR-35, Anexo III, lido só o resumo'],
        ['Helicoidal ou leque privativo, com espelho de até 20 cm onde for admitido e ponta mínima de 7 cm em escada secundária', 'pede corrimão e guarda; difícil de passar móveis (' + PROB_SF + ')', 'NBR 9077:2001, 4.7.5.1 d e 4.7.5.2; ' + PROB_GO + ', 5.7.5.1 g'],
        ['Passo alternado: consultar a prefeitura e os Bombeiros antes de usar', 'risco na descida para crianças e idosos (' + PROB_SF + ')', 'sem regra brasileira encontrada; só há referência dos EUA']
      ] },
    { t: 'Não saber qual regra vale: escada secundária ou de serviço desenhada como saída de emergência, ou o contrário', ids: [],
      pq: 'A NBR 9077 trata de saídas de emergência e a NBR 9050 de acessibilidade; nenhuma é código de obras de casa, e cada estado tem sua instrução dos Bombeiros.',
      regra: 'NBR 9077:2001, 4.7.5.1: escadas secundárias (que não são saída de emergência) pedem piso antiderrapante, corrimão (basta um até 1,20 m de largura), guarda e Blondel, mas aceitam ponta de leque de 7 cm e patamar de 80 cm sem a fórmula do patamar. 4.7.5.2: espelho de 20 cm só nas "exclusivamente de serviço". No PR (' + PROB_PR + ', 5.7.5.3): secundária com 0,80 m de largura. Em GO (' + PROB_GO + ', 5.7.5.1): uso restrito com 80 cm. NBR 9050:2020: áreas técnicas e de acesso restrito não precisam ser acessíveis; prédios multifamiliares, sim, nas áreas comuns.',
      sol: [
        ['Antes de desenhar, classificar a escada: (1) saída de emergência, (2) rota acessível, (3) secundária ou de serviço, (4) privativa de residência unifamiliar', 'a regra do município varia por cidade e não está no app', 'NBR 9077:2001, 4.7.5; NBR 9050:2020, escopo; ' + PROB_PR + ', 5.7.5; ' + PROB_GO + ', 5.7.5'],
        ['Usar as concessões da secundária (ponta de 7 cm, patamar de 80 cm) e manter Blondel e corrimão', 'não vale para saída de emergência nem para rota acessível', 'NBR 9077:2001, 4.7.5.1 d']
      ] }
  ] },
  { tema: 'Curvas e caracol', itens: [
    { t: 'Leque convergente com ponta zero: os degraus da curva viram triângulos', ids: ['ponta', 'leque'], cond: R => !R.bal,
      pq: 'Dividir o giro em fatias iguais a partir do canto é rápido e economiza espaço (' + PROB_SF + ').',
      regra: 'NBR 9077:2001, 4.7.3.1 c: na curva os degraus são balanceados, o piso é medido na linha de percurso (a linha por onde se anda, a 55 cm da borda, ou no eixo se a escada tiver menos de 1,10 m, item 3.32) e a parte mais estreita tem no mínimo 15 cm. Em escada secundária, 7 cm (4.7.5.1 d). NBR 9050:2020, 6.8.6 e Figura 75: medida a 55 cm da borda interna, ponta de 15 cm. Ponta zero não atende nenhuma das duas.',
      sol: [
        ['Balancear: espalhar o estreitamento também pelos degraus retos vizinhos, com piso igual na linha de percurso, até a ponta chegar a 15 cm (ou 7 cm). É o que o app faz no modo "balanceados"', 'mais degraus tortos; forma de concreto ou corte das peças mais trabalhosos (' + PROB_SF + ')', 'NBR 9077:2001, 4.7.3.1 c e 4.7.9.1 b'],
        ['Trocar o leque por patamar no canto (L ou U com patamar), com lado igual à largura da escada', 'o número de espelhos não muda, mas a curva deixa de subir e os lances ficam mais compridos', 'NBR 9077:2001, 4.7.3.3 b'],
        ['Eliminar o leque com um patamar e um degrau a mais, dividindo em dois lances', 'muda espelho e comprimento; reconferir Blondel', 'opinião de usuário num fórum de Portugal, lido só o resumo'],
        ['Afastar a borda interna do canto (vão central ou pilar maior) para aumentar a ponta', 'a caixa da escada fica maior', PROB_SF]
      ] },
    { t: 'Balanceamento: qual método usar e como provar que está certo', ids: [],
      pq: 'Os métodos são ensinados por apostilas e professores, com variações; a norma só fixa o resultado (' + PROB_SF + ').',
      regra: 'NBR 9077:2001, 4.7.9.1 b: leques balanceados "utilizando-se um dos sistemas de balanceamento recomendados", com piso constante na linha de percurso, mas a norma não lista esses sistemas; 4.7.9.1 c: ponta de pelo menos 15 cm. No PR (' + PROB_PR + ', 5.7.3.1 c): linha a 55 cm e ponta de 15 cm. Não foi achada fonte aberta que descreva os processos gráficos.',
      sol: [
        ['Conferir o resultado, não o método: piso igual em todos os degraus na linha de percurso, ponta mais estreita acima do mínimo e Blondel na linha', 'outros processos gráficos dão degraus um pouco diferentes', 'NBR 9077:2001, 3.32, 4.7.3.1 b e c, 4.7.9.1 b e c'],
        ['Programas BIM têm opção de largura mínima do degrau em leque; no ArchiCAD ela é medida da projeção do ponto de giro até a borda interna', 'cada programa tem seu cálculo; conferir os valores na linha de percurso', 'ajuda do ArchiCAD, Graphisoft, lido só o resumo']
      ] },
    { t: 'Caracol com pilar central fino: a ponta do degrau junto ao pilar fica com poucos centímetros', ids: ['pilar'], conta: true,
      pq: 'Caracóis de catálogo usam pilar fino e diâmetro pequeno para caber num furo pequeno de laje (' + PROB_SF + ').',
      regra: 'NBR 9077:2001, 4.7.5.1 d: em escada secundária, ponta mínima de 7 cm. Em saída de emergência, 4.7.8.1 b pede degraus convergindo para um vão central de diâmetro mínimo de 0,97 m (piso de 32 cm) a 1,375 m (piso de 27 cm), conforme o piso, o que, pela nossa leitura, tira o caracol de pilar fino da rota de fuga. Em GO (' + PROB_GO + ', 5.7.5.1 g), uso restrito: 15 cm em lance curvo e 7 cm em espiral. No PR (' + PROB_PR + ', 5.7.3.1 c): 15 cm em leque ou espiral, sem exceção de 7 cm, e largura mínima de 0,80 m (5.7.5.1 b).',
      sol: [
        ['Usar o caracol só onde a regra permite (uso restrito, mezanino, residência) e conferir a ponta: 7 cm em GO e na secundária da NBR 9077:2001, 15 cm no PR, aumentando o pilar ou criando um vão central', 'diâmetro total e furo na laje maiores', 'NBR 9077:2001, 4.7.5.1 d; ' + PROB_GO + ', 5.7.5.1 g; ' + PROB_PR + ', 5.7.3.1 c'],
        ['Diminuir os degraus por volta (ângulo maior por degrau) para aumentar a ponta, conferindo Blondel e altura livre', 'piso na linha maior ou espelho maior; a altura livre sob a volta de cima diminui', PROB_SF + '; a conta é geometria'],
        ['Em GO, barrilete, casa de máquinas e piso técnico de manutenção eventual podem ter espiral sem largura mínima e sem Blondel', 'só em GO e só nesses locais técnicos', PROB_GO + ', nota da 5.7.5.2'],
        ['Só como comparação: o código residencial dos EUA aceita caracol com 66 cm de largura livre, espelho de até 24 cm e piso de 19 cm medido a 30 cm da borda estreita. Por isso caracóis importados costumam não fechar com Blondel', 'não é norma brasileira e o app não usa como limite', 'código residencial dos EUA (IRC), em sites de consulta, lido só o resumo']
      ] },
    { t: 'Escada em leque ou curva usada como saída de emergência do prédio', ids: [],
      pq: 'A escada curva é peça de destaque no hall e acaba sendo a única do pavimento (' + PROB_SF + ').',
      regra: 'NBR 9077:2001, 4.7.8.1: lance curvo só é de emergência no grupo A (residencial) ou em escada não enclausurada (menos na divisão F-3), com degraus iguais convergindo para um vão central de diâmetro mínimo de 0,97 m (piso de 32 cm) a 1,375 m (piso de 27 cm), conforme o piso, e largura de 1,10 a 1,65 m. 4.7.8.2 e 4.7.9.2: proibido em escada à prova de fumaça; o leque também nos grupos F e H. A capacidade cai 10% em lance curvo (nota da tabela). 4.7.7: nos grupos A, B, D, G, I ou J, em prédio com menos de 50 pessoas e até 6 m de altura, ou quando a escada é só a segunda saída (com outra escada para toda a população, de no máximo 50 pessoas, nos mesmos grupos), aceitam-se 90 cm e degraus em leque. Em GO (' + PROB_GO + ', 5.7.1 k), leque e espiral não são escada de segurança, salvo em mezanino e área privativa.',
      sol: [
        ['Separar funções: a escada curva fica como escada social (secundária) e uma escada reta com patamares faz a rota de fuga', 'duas escadas: mais área e custo', 'NBR 9077:2001, 4.7.5.1; ' + PROB_GO + ', 5.7.1 k'],
        ['Manter a curva como emergência, onde a regra do estado permitir: vão central com diâmetro mínimo de 0,97 m (piso de 32 cm) a 1,375 m (piso de 27 cm), conforme o piso; largura de 1,10 a 1,65 m, degraus iguais', 'escada grande; a curva é proibida em escada à prova de fumaça, e o leque também nos grupos F e H', 'NBR 9077:2001, 4.7.8.1, 4.7.8.2 e 4.7.9.2'],
        ['Prédio pequeno (grupos A, B, D, G, I ou J, menos de 50 pessoas, até 6 m) ou escada só de segunda saída nessas condições: degraus em leque com 90 cm de largura', 'só nesses casos; o estado pode ter regra própria', 'NBR 9077:2001, 4.7.7']
      ] },
    { t: 'Leque ou curva numa rota acessível', ids: ['mudanca'],
      pq: 'O leque faz a mudança de direção com degraus, sem o patamar que a NBR 9050 pede.',
      regra: 'NBR 9050:2020, 6.8.7: patamar a cada 3,20 m de desnível e sempre que houver mudança de direção; 6.8.8: nesse caso, com lado igual à largura. 6.8.6 aceita lances curvos, com piso e espelho medidos a 55 cm da borda interna. A norma não diz como conciliar 6.8.6 com 6.8.7: ler que um leque não atende é interpretação nossa. Largura mínima: 1,20 m (6.8.3).',
      sol: [
        ['Na rota acessível, lances retos com patamar nas mudanças de direção (L ou U com patamar)', 'mais área; a escada curva fica como escada não acessível', 'NBR 9050:2020, 6.8.7 e 6.8.8'],
        ['Em curva contínua (helicoidal grande): piso e espelho constantes a 55 cm da borda interna, ponta de 15 cm e corrimão dos dois lados, avisando que o patamar é ponto de interpretação', 'depende do entendimento de quem aprova', 'NBR 9050:2020, 6.8.6 e 6.9.3.2']
      ] },
    { t: 'Caracol ou leque em mezanino e residência: o que a regra exige e quem fiscaliza', ids: ['altura'],
      pq: 'Em casa e mezanino o espaço é pequeno, e cada estado e município tem regra própria (' + PROB_SF + ').',
      regra: 'No PR (' + PROB_PR + ', 5.7.5.1 e 5.7.5.1.1): mezanino e área privativa, que inclui a residência unifamiliar, aceitam leque, espiral ou reta com população abaixo de 10 e escada de até 3,7 m, largura de 0,80 m, piso antiderrapante, corrimão (um basta até 1,10 m), guarda no lado aberto, Blondel, patamar de 0,80 m, pé-direito de 2,5 m (2,10 m sob vigas) e placa "ESCADA DE ACESSO RESTRITO". Em GO (' + PROB_GO + ', 5.7.5.1): população abaixo de 20, até 3,7 m, um pavimento, 80 cm, ponta de 15 cm (curva) e 7 cm (espiral). Não foi encontrado artigo de código de obras municipal com limites para caracol.',
      sol: [
        ['Identificar o enquadramento antes de desenhar (casa ou mezanino, saída de emergência, rota acessível) e consultar o código de obras da cidade', 'exige pesquisa local; o app não conhece o código municipal', PROB_PR + ', 5.7.5.1; ' + PROB_GO + ', 5.7.5.1; consultar o município é ' + PROB_SF],
        ['Caracol em mezanino: largura de 80 cm, Blondel na linha de percurso, ponta conforme o estado, guarda no lado aberto. Usar 2,10 m como altura livre sob a volta de cima é interpretação nossa', 'com 80 cm de largura útil o diâmetro total passa de 1,70 m (conta, não norma)', PROB_PR + ', 5.7.5.1; ' + PROB_GO + ', 5.7.5.1']
      ] }
  ] },
  { tema: 'Espaço, altura e patamares', itens: [
    { t: 'Altura livre baixa: a cabeça bate na borda da laje ou na viga de cima', ids: ['altura'],
      pq: 'A abertura da laje é desenhada com o comprimento que a estrutura deixa, sem medir a folga na vertical sobre cada degrau (' + PROB_SF + ').',
      regra: 'NBR 9077:2001, 4.5.1.1 d: os ACESSOS das saídas de emergência pedem pé-direito de 2,50 m e 2,00 m livres sob vigas; a seção de escadas não traz valor próprio. No PR (' + PROB_PR + ', 5.7.1.1 k e 5.7.5.1 g) e em GO (' + PROB_GO + ', 5.7.1 l): escadas com 2,5 m e 2,10 m sob vigas. As normas não dizem como medir na escada; medir na vertical a partir do bocel é ' + PROB_SF + '.',
      sol: [
        ['Aumentar a abertura da laje no sentido do lance, com projeto estrutural da nova borda', 'reforço e responsável técnico (' + PROB_SF + '); perde área no pavimento de cima', 'fórum de Portugal, lido só o resumo'],
        ['Deslocar o começo do lance para a parte alta ficar sob a abertura', 'ocupa mais área no pavimento de baixo', PROB_SF],
        ['Trocar o tipo de escada (L, U, com patamar) para encurtar a abertura', 'mais área em planta; o patamar precisa de apoio', PROB_SF],
        ['Viga invertida (para cima da laje) ou laje sem viga aparente sobre a escada', 'a viga invertida aparece no piso de cima', PROB_SF]
      ] },
    { t: 'A abertura da laje não cabe na estrutura: corta viga ou fica junto de pilar', ids: [],
      pq: 'A escada é lançada depois da estrutura, ou uma reforma abre escada numa laje existente (' + PROB_SF + ').',
      regra: 'Não está nas normas lidas. O assunto é da NBR 6118 (concreto), que não foi lida; uma apostila da PUCRS remete a ela para aberturas (lido só o resumo).',
      sol: [
        ['Prever no anteprojeto a caixa da escada com vigas de borda em volta da abertura', 'decidir cedo; depois sai caro', PROB_SF],
        ['Em reforma: abertura só com projeto e acompanhamento de engenheiro de estruturas', 'custo, escoramento e reforço (' + PROB_SF + ')', 'fórum de Portugal, lido só o resumo'],
        ['Girar o lance ou trocar a reta por L ou U para alinhar a abertura com o vão entre vigas', 'muda a circulação nos dois pavimentos', PROB_SF]
      ] },
    { t: 'Usar o vão sob a escada (lavabo, depósito, armário) com altura insuficiente', ids: [],
      pq: 'A face de baixo da laje da escada desce em rampa até o começo do lance.',
      regra: 'Não há regra específica. NBR 9077:2001, 4.7.4.2 e 4.7.4.3: a caixa de escada de emergência não pode ser depósito nem ter quadros ou medidores (com exceção para escadas não enclausuradas de edificações L e M). No PR (' + PROB_PR + ', 5.7.1.1 j): escada de emergência livre de móveis. NBR 9050:2020, 4.3.3 trata de móveis na rota acessível (risco entre 0,60 e 2,10 m de altura) e serve só como comparação. Pé-direito de lavabo: é do código municipal, não encontrado.',
      sol: [
        ['Fechar a parte baixa com armário ou mureta e deixar passagem só onde a altura basta', 'perde um pouco de área útil', 'comparação com NBR 9050:2020, 4.3.3; em casa, ' + PROB_SF],
        ['Em caixa de escada de emergência, não usar o vão como depósito nem instalar quadros ou medidores', 'nenhum', 'NBR 9077:2001, 4.7.4.2 e 4.7.4.3']
      ] },
    { t: 'Largura mínima que não cabe em casa estreita', ids: ['L'],
      pq: 'Lote estreito, ou regra de prédio coletivo aplicada a uma casa, ou o contrário (' + PROB_SF + ').',
      regra: 'NBR 9077:2001, 4.4.2: 1,10 m (duas "unidades de passagem" de 55 cm); 4.7.7: 90 cm nos grupos A, B, D, G, I ou J, em prédio com menos de 50 pessoas e até 6 m de altura (ou escada só de segunda saída nessas condições). A largura é medida no ponto mais estreito, e o corrimão pode avançar 10 cm de cada lado sem descontar (4.7.2 b). NBR 9050:2020, 6.8.3: 1,20 m em rota acessível. No PR (' + PROB_PR + ', 5.7.5.1 a e b): 0,80 m em área privativa, inclusive casa, com população abaixo de 10 e escada de até 3,7 m. Uma revista da UNESP cita 0,80 m no Código de Obras de São Paulo, sem dizer a edição: confira a lei vigente.',
      sol: [
        ['Enquadrar corretamente: em casa ou área privativa, usar o limite de escada privativa', 'vale só no PR e nessas condições; confira os Bombeiros e o município locais', PROB_PR + ', 5.7.5.1 e 5.7.5.1.1'],
        ['Corrimão que avança até 10 cm de cada lado sem reduzir a largura de cálculo', 'não vale para guarda ou balaústre', 'NBR 9077:2001, 4.7.2 b'],
        ['L ou U encostada nas divisas, ou estrutura lateral fina para ganhar largura útil', 'custo da estrutura metálica', PROB_SF]
      ] },
    { t: 'Lance longo sem patamar (pé-direito alto, mezanino, térreo comercial)', ids: ['patamar'],
      pq: 'Pé-direito alto vencido com uma reta só para economizar área (' + PROB_SF + ').',
      regra: 'NBR 9077:2001, 3.30 e 4.7.3.2: no máximo 3,70 m de altura entre patamares, em saída de emergência. NBR 9050:2020, 6.8.7: patamar a cada 3,20 m, em rota acessível. No PR (' + PROB_PR + ', 5.7.5.1 a), a escada privativa tem no máximo 3,7 m de altura TOTAL.',
      sol: [
        ['Patamar intermediário (reta com patamar) ou escada em L ou U', 'mais comprimento ou largura em planta', 'NBR 9050:2020, 6.8.7; NBR 9077:2001, 4.7.3.2'],
        ['Três lances com dois patamares (em C ou em Z)', 'mais área', PROB_SF]
      ] },
    { t: 'Patamar curto (menor que o passo, ou que a largura na mudança de direção)', ids: ['patprof'],
      pq: 'O patamar é encaixado no espaço que sobra, sem pensar no ritmo do passo (' + PROB_SF + ').',
      regra: 'NBR 9077:2001, 4.7.3.3 a: na escada reta, patamar = (2e + p) × n + p, com n = 1, 2 ou 3 passos; 4.7.3.3 b: na mudança de direção sem degraus em leque, no mínimo a largura da escada. Escada secundária: 80 cm, sem a fórmula (4.7.5.1 d); no PR, mezanino e área privativa também 0,80 m (' + PROB_PR + ', 5.7.5.1 f). NBR 9050:2020, 6.8.8: 1,20 m entre lances; na mudança de direção, igual à largura.',
      sol: [
        ['Usar n = 2 quando a regra pede 1,20 m, mantendo o ritmo do passo', 'mais comprimento', 'NBR 9077:2001, 4.7.3.3 a; NBR 9050:2020, 6.8.8'],
        ['Fora de rota de fuga e de rota acessível, enquadrar como secundária ou privativa (patamar de 80 cm)', 'só fora dessas rotas', 'NBR 9077:2001, 4.7.5.1 d; ' + PROB_PR + ', 5.7.5.1 f'],
        ['Trocar o patamar de canto por leque balanceado', 'em emergência só nas condições do 4.7.9.1; em rota acessível a NBR 9050 (6.8.7) pede patamar', 'NBR 9077:2001, 4.7.3.1 c e 4.7.9.1']
      ] },
    { t: 'Porta abrindo sobre o degrau ou sobre o patamar', ids: [],
      pq: 'A porta fica no topo da escada para economizar circulação (' + PROB_SF + ').',
      regra: 'NBR 9077:2001, 4.7.3.4: dos dois lados da porta, patamar com pelo menos a largura da folha. NBR 9050:2020, 6.8.8: o giro da porta não pode invadir a medida mínima do patamar. No PR (' + PROB_PR + ', 5.7.3.4.1): proibidas portas nos patamares entre lances.',
      sol: [
        ['Afastar a porta do degrau com patamar maior que a folha, ou abrir para fora da escada (se a rota de fuga permitir)', 'mais área de patamar', 'NBR 9077:2001, 4.7.3.4; NBR 9050:2020, 6.8.8'],
        ['Porta em recesso na parede; porta de correr só fora de rota de fuga', 'a de correr veda pior e não serve como porta corta-fogo', 'NBR 9077:2001, 4.4.3.3 (recesso); a porta de correr é ' + PROB_SF]
      ] },
    { t: 'Primeiro ou último degrau colado na circulação', ids: [],
      pq: 'O espelho final é alinhado com a parede do corredor para ganhar área (' + PROB_SF + ').',
      regra: 'NBR 9050:2020, 6.8.4: em construção nova, o primeiro e o último degrau ficam a pelo menos 30 cm da circulação e são sinalizados; a sinalização no piso segue a NBR 16537, que não foi lida. Na NBR 9077:2001 não foi encontrada regra.',
      sol: [
        ['Recuar o lance 30 cm ou alongar o patamar de chegada', '30 cm a mais em planta em cada ponta', 'NBR 9050:2020, 6.8.4'],
        ['Sinalização tátil e visual no piso (obrigatória junto com o recuo em obra nova); em reforma sem espaço, pelo menos reduz o risco', 'não resolve a geometria', 'NBR 9050:2020, 6.8.4 e 5.4.6; o uso em reforma é ' + PROB_SF]
      ] }
  ] },
  { tema: 'Corrimão, guarda-corpo e segurança', itens: [
    { t: 'Corrimão ausente, só de um lado, na altura errada ou cortado no patamar', ids: [],
      pq: 'Economia ou estética; do lado do vão não há parede para fixar, e o prolongamento de 30 cm invade a circulação.',
      regra: 'NBR 9077:2001, 4.7.1 e: escada de emergência com corrimão (o texto não diz "dos dois lados"); 4.8.2.1: altura de 80 a 92 cm acima da linha dos bocéis; 4.8.2.3: seção redonda de 38 a 65 mm. Secundária: basta um até 1,20 m de largura (4.7.5.1 b). NBR 9050:2020, 6.9.3.2 e 6.9.3.3, em rota acessível: dois lados, a 92 e 70 cm, prolongado 30 cm nas pontas e contínuo nos patamares. No PR (' + PROB_PR + ', 5.8.2.1): dos dois lados, de 0,80 a 0,92 m; em área privativa, um basta até 1,10 m (5.7.5.1 d).',
      sol: [
        ['Fixar o corrimão na própria guarda do lado aberto; no PR, em escada interna com vão central de até 15 cm, a guarda de 0,92 m pode ser o corrimão', 'a guarda precisa de perfil que dê para segurar; sem tábua larga nem aresta viva em emergência', PROB_PR + ', 5.8.1.2.1; NBR 9077:2001, 4.8.2.5'],
        ['Em edificação existente sem espaço para os 30 cm, levar o prolongamento ao longo da circulação ou fixar na parede ao lado', 'só para edificação existente', 'NBR 9050:2020, 6.9.3.4, nota'],
        ['Seção redonda de 38 a 45 mm, que atende as duas normas ao mesmo tempo', 'nenhum relevante', 'NBR 9077:2001, 4.8.2.3; NBR 9050:2020, 4.6.5'],
        ['Em casa, mesmo sem exigência local, pelo menos um corrimão firme', 'custo baixo', PROB_SF]
      ] },
    { t: 'Guarda-corpo baixo no lado aberto da escada, do patamar ou do mezanino', ids: [],
      pq: 'A guarda é medida a partir do degrau e não da linha dos bocéis, ou os 92 cm do lance são repetidos no patamar.',
      regra: 'NBR 9077:2001, 4.8.1.1: saída de emergência protegida por parede ou guarda quando o desnível passa de 19 cm; 4.8.1.2: guarda de 1,05 m em patamar e mezanino, que pode ser 92 cm no lance de escada interna, medida na vertical a partir da linha dos bocéis. No PR (' + PROB_PR + ', 5.8.1.2): 1,05 m também ao longo das escadas; 0,92 m só em escada interna com vão central de até 15 cm. A NBR 9050:2020 (6.9.2) manda seguir a NBR 9077 e a NBR 14718, que não foi lida; pelo resumo de uma busca, a edição de 2001 da NBR 14718 pede 1,10 m a partir do piso acabado (a revisão de 2019 não foi conferida).',
      sol: [
        ['Duas alturas: 92 cm ou mais sobre a linha dos bocéis no lance interno, 1,05 m ou mais no patamar e no mezanino (no PR, 1,05 m também no lance, salvo a exceção); conferir se a NBR 14718 ou o código local pedem 1,10 m', 'na chegada ao patamar a altura muda e pede um detalhe de concordância', 'NBR 9077:2001, 4.8.1.2; ' + PROB_PR + ', 5.8.1.2'],
        ['Completar a mureta baixa com tubo ou vidro até a altura exigida', 'o vidro tem de ser laminado ou aramado (NBR 9077:2001, 4.8.1.4 c)', PROB_SF],
        ['Fechar o vão com parede', 'perde luz e transparência', 'NBR 9077:2001, 4.8.1.1']
      ] },
    { t: 'Guarda vazada com vãos grandes ou barras horizontais que dá para escalar', ids: [],
      pq: 'Estética (barras deitadas, cabos de aço, poucos montantes) ou economia.',
      regra: 'NBR 9077:2001, 4.8.1.4 (exceto ocupações I e J): uma esfera de 15 cm não pode passar por nenhuma abertura, sem saliências que enganchem roupa e com vidro que não estilhaça. No PR (' + PROB_PR + ', 5.8.1.4 a): a mesma esfera, com exceções na nota. Contar também o triângulo entre degrau e travessa inclinada é interpretação nossa de "nenhuma abertura". Pelo resumo de uma busca, a NBR 14718:2001 limitaria o vão a 11 cm (não conferido).',
      sol: [
        ['Balaústres (barras) verticais com vão livre de até 11 cm', 'mais montantes, mais custo de serralheria', 'NBR 9077:2001, 4.8.1.4 a; os 11 cm só pelo resumo da busca'],
        ['Vidro laminado, chapa perfurada ou tela metálica no lugar das barras deitadas', 'o vidro pede limpeza e fixação calculada', 'NBR 9077:2001, 4.8.1.4 a e c, e 4.8.3.1 b'],
        ['Em casa pronta: tela de proteção na guarda e portão de segurança no topo e na base', 'paliativo, não substitui a guarda', 'sites Decorfácil e Cursa, lido só o resumo']
      ] },
    { t: 'Escada de casa sem guarda-corpo no lado aberto', ids: [],
      pq: 'Escolha de estética e custo; dentro da casa quase não há fiscalização.',
      regra: 'No PR (' + PROB_PR + ', 5.7.5.1 e e 5.7.5.1.1): escada de área privativa, inclusive casa, com guarda nos lados abertos. NBR 9077:2001, 4.7.5.1 c: escada secundária com guarda nos lados abertos; aplicar isso à casa depende do código local, não encontrado. Numa matéria da Gazeta do Povo (lido só o resumo), um engenheiro do Crea-PR diz que em casa a guarda não é exigida nem fiscalizada.',
      sol: [
        ['Desenhar a guarda no projeto e registrar no memorial quando o dono decide não colocar', 'muda a estética "flutuante"', PROB_SF],
        ['Deixar chumbadores ou reforço na laje e no degrau para pôr a guarda depois', 'custo pequeno na obra', PROB_SF],
        ['Paliativo: rede de proteção e portões de segurança', 'pouco durável; a fixação pede manutenção', 'site Decorfácil, lido só o resumo']
      ] },
    { t: 'Bocel saliente demais, ausente, ou degrau sem espelho (vazado)', ids: ['bocel', 'vazado'],
      pq: 'A pedra é assentada com 3 a 4 cm de sobra, ou rente; em escada metálica ou de madeira o degrau fica solto para parecer leve.',
      regra: 'NBR 9077:2001, 4.7.3.1 e: bocel de NO MÍNIMO 1,5 cm (sem bocel, a quina avança o mesmo sobre o degrau de baixo). NBR 9050:2020, 6.7.1, em rota acessível: espelho vazado proibido e avanço de NO MÁXIMO 1,5 cm. No PR (' + PROB_PR + ', 5.7.3.1 e e f): também no máximo 1,5 cm. Quem precisa atender as duas fica com exatamente 1,5 cm.',
      sol: [
        ['Especificar no detalhe um bocel de 1,5 cm (ou espelho inclinado com o mesmo avanço) e cotar o acabamento, não só a estrutura', 'a pedra precisa de corte sob medida', 'NBR 9077:2001, 4.7.3.1 e; NBR 9050:2020, 6.7.1; ' + PROB_PR + ', 5.7.3.1 f'],
        ['Em rota acessível, fechar o espelho vazado com chapa, vidro ou madeira; fora dela, pelo menos diminuir a abertura', 'perde transparência e ganha peso', 'NBR 9050:2020, 6.7.1; diminuir a abertura é ' + PROB_SF]
      ] },
    { t: 'Piso escorregadio na escada', ids: [],
      pq: 'O acabamento é escolhido pela aparência; peça polida com água tem pouca aderência.',
      regra: 'NBR 9077:2001, 4.7.1 g e 4.7.5.1 a: piso antiderrapante, que continue assim com o uso. No PR (' + PROB_PR + ', inclusive área privativa, 5.7.5.1 c): coeficiente de atrito dinâmico (medida de aderência) de pelo menos 0,5. NBR 9050:2020, 6.3.2: antiderrapante seco ou molhado. O método de ensaio não foi conferido.',
      sol: [
        ['Especificar revestimento antiderrapante e conferir na ficha do fabricante (no PR, atrito de 0,5 ou mais)', 'pode ser mais difícil de limpar', PROB_PR],
        ['Em obra pronta: fita antiderrapante na borda do degrau, ou frisos no bocel', 'a fita é provisória e gasta', 'Catraca Livre e boletim da 3M, lido só o resumo; fresar frisos é ' + PROB_SF]
      ] },
    { t: 'Degraus sem sinalização e escada mal iluminada', ids: [],
      pq: 'Revestimento de uma cor só, um único ponto de luz que faz sombra no degrau, nenhuma luz de emergência.',
      regra: 'NBR 9050:2020, 5.4.4.2: faixa de cor contrastante nos degraus, de pelo menos 7 cm por 3 cm, de preferência fotoluminescente (que brilha no escuro), obrigatória assim em saída de emergência; a nota recomenda a faixa no degrau inteiro. 6.1.2: rota acessível com pelo menos 150 lux a 1 m do chão. A NBR 9077:2001 remete à NBR 10898 (iluminação de emergência), não lida. Iluminação de escada de casa: não encontrado.',
      sol: [
        ['Faixa contrastante e antiderrapante nas bordas, na projeção do corrimão ou no bocel inteiro', 'interfere na estética; a fita gasta', 'NBR 9050:2020, 5.4.4.2 e nota'],
        ['Balizadores na parede ou LED embutido sob o bocel, iluminando o piso sem ofuscar quem desce', 'a elétrica precisa estar no projeto', PROB_SF],
        ['Em saída de emergência: iluminação de emergência e sinalização fotoluminescente nos degraus', 'custo de instalação e manutenção', 'NBR 9050:2020, 5.4.4.2 c; NBR 10898, citada na NBR 9077:2001 (não lida)']
      ] }
  ] }
];

function problemasHTML(R) {
  const f = (v, d) => fmt(v, d);
  const ruins = {};
  (R.checks || []).forEach(c => { if (c.status === 'bad' || c.status === 'warn') ruins[c.id] = 1; });
  const agora = it => it.ids.some(id => ruins[id]) && (!it.cond || it.cond(R));
  const nm = R.nm || {};
  let n = 0;
  PROBLEMAS.forEach(g => g.itens.forEach(it => { if (agora(it)) n++; }));

  let h = '<p>Muita escada feita na prática não atende ao limite da norma. Antes de tudo, é preciso saber QUAL regra vale para esta escada: saída de emergência (NBR 9077:2001 e a instrução dos Bombeiros do estado), rota acessível (NBR 9050:2020), escada secundária ou de serviço (NBR 9077:2001, 4.7.5) ou escada de casa, que segue o código de obras do município (o app não conhece esse código). Por isso, além de Estudo e NBR 9050, o app tem os perfis "Escada secundária" e "Escada de serviço" (NBR 9077:2001, 4.7.5).</p>';
  h += '<p>As regras da ' + PROB_PR + ' valem só no Paraná, e as da ' + PROB_GO + ' só em Goiás. Toda citação da NBR 9077 é da edição de 2001; a edição de 2025 não foi lida. Onde não achamos fonte, está escrito "' + PROB_SF + '". Perfil em uso: ' + (nm.nome || '') + '.</p>';
  h += '<p>' + (n ? 'Os problemas marcados com <span class="agora">nesta escada</span> aparecem nas verificações da escada atual: ' + n + (n === 1 ? ' problema.' : ' problemas.') : 'Nenhum dos problemas abaixo aparece nas verificações da escada atual.') + '</p>';

  PROBLEMAS.forEach(g => {
    h += '<h4>' + g.tema + '</h4><dl>';
    g.itens.forEach(it => {
      h += '<dt>' + it.t + (agora(it) ? ' <span class="agora">nesta escada</span>' : '') + '</dt><dd>';
      h += '<p><b>Por que acontece:</b> ' + it.pq + '</p>';
      h += '<p><b>O que a regra diz:</b> ' + it.regra + '</p>';
      if (it.conta && R.hel && R.helix) {
        const hx = R.helix, th = hx.th * Math.PI / 180, ponta = hx.rc * th, ang = 2 * Math.PI / hx.nPer;
        const D = t => 2 * t / ang;
        h += '<p><b>A conta nesta escada:</b> ponta = raio do pilar × ângulo do degrau em radianos = ' + f(hx.rc, 1) + ' × ' + f(th, 3) + ' = ' + f(ponta, 1) + ' cm. Com ' + hx.nPer + ' degraus por volta, o diâmetro mínimo do centro (pilar ou vão central) seria Dmin = 2 × ponta desejada ÷ (2π ÷ ' + hx.nPer + '): ' + f(Math.ceil(D(15) * 10 - 1e-9) / 10, 1) + ' cm para ponta de 15 cm e ' + f(Math.ceil(D(7) * 10 - 1e-9) / 10, 1) + ' cm para ponta de 7 cm (arredondado para cima: é um mínimo). O pilar atual tem ' + f(2 * hx.rc, 1) + ' cm de diâmetro.</p>';
      }
      h += '<p><b>Como resolvem na prática:</b></p><ul>';
      it.sol.forEach(s => { h += '<li>' + s[0] + '. Efeito: ' + s[1] + '. (' + s[2] + ')</li>'; });
      h += '</ul></dd>';
    });
    h += '</dl>';
  });
  h += '<p>O app confere só parte disso. A decisão é do texto da norma vigente, do código de obras do município e do Corpo de Bombeiros do estado.</p>';
  return h;
}
