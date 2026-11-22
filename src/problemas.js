/* ===== PROBLEMAS COMUNS: norma x prática, e como os profissionais resolvem =====
   Conteúdo tirado só da pesquisa verificada. Normas lidas: NBR 9077:2025 (conferida no texto em 17/11/2026:
   3.11, 4.2 b, 9.1.4 a 9.1.12, 9.4.1 d, 9.4.2.2, 9.5.9.1 e o Prefácio), NBR 9050:2020, NPT 011 dos Bombeiros do PR,
   NT 11/2021 dos Bombeiros de GO. A NBR 9077:2001 foi cancelada pela de 2025: os itens dela aparecem só como
   histórico ou referência de estudo, sempre com a edição e o aviso de que foi cancelada. As instruções estaduais
   podem ainda se basear na edição de 2001; o que elas dizem fica como estava. O que não tem fonte aparece como
   "prática comum, sem fonte".
   Cada problema tem "ids": as verificações do calc que, com status 'bad' ou 'warn', mostram que o problema está
   acontecendo na escada atual ('mudanca', 'htot', 'patcurva', 'mezreq', 'vazado' vêm dos perfis de 2025). "cond",
   quando existe, restringe o destaque. */

const PROB_SF = 'prática comum, sem fonte';
const PROB_PR = 'NPT 011 dos Bombeiros do PR';
const PROB_GO = 'NT 11/2021 dos Bombeiros de GO';
const PROB_EST = 'as instruções estaduais podem ainda se basear na NBR 9077:2001';

const PROBLEMAS = [
  { tema: 'Geometria do degrau', itens: [
    { t: 'Espelho alto (19 a 20 cm) em casa apertada', ids: ['e'], cond: R => R.e > R.nm.eMax + 1e-6,
      pq: 'O desnível é fixo e a projeção em planta é pequena; com menos espelhos, cada um fica mais alto e a escada fica mais curta.',
      regra: 'Rota de fuga: a NBR 9077:2025 manda dimensionar os degraus pela NBR 9050 (9.1.10), que pede espelho de 16 a 18 cm (NBR 9050:2020, 6.8.2), o mesmo exigido em rota acessível, sem exceção. No acesso a mezanino e área privativa, a NBR 9077:2025 (9.5.9.1) não fixa o espelho. A NBR 9077:2001, cancelada pela de 2025, pedia 16 a 18 cm (4.7.3.1 a) e só aceitava até 20 cm nas escadas secundárias "exclusivamente de serviço" (4.7.5.2); essa categoria não existe na edição de 2025. O PR (' + PROB_PR + ', 5.7.5.1 e 5.7.5.2) aceita 20 cm em mezanino e área privativa, que inclui a residência unifamiliar, com população abaixo de 10 pessoas e escada de até 3,7 m. GO (' + PROB_GO + ', 5.7.5.1 e 5.7.5.2) aceita em escada de uso restrito, exclusivamente de serviço, com população abaixo de 20, escada de até 3,7 m e um só pavimento atendido (' + PROB_EST + '). O limite do código de obras municipal não foi encontrado.',
      sol: [
        ['Enquadrar como acesso a mezanino ou área privativa, onde a NBR 9077:2025 não fixa o espelho, e usar o limite dos Bombeiros do estado e do município (no PR e em GO, até 20 cm, cada um com as suas condições), mantendo Blondel', 'só fora de rota de fuga e de rota acessível; pela 9.5.9.1, população abaixo de 20 e altura até 3,7 m; com espelho de 20 cm, Blondel pede piso de 23 a 24 cm (cerca de 40°); exige corrimão e guarda', 'NBR 9077:2025, 9.5.9.1; ' + PROB_PR + ', 5.7.5.2; ' + PROB_GO + ', 5.7.5.2'],
        ['Trocar o tipo de escada para ganhar desenvolvimento na mesma área: L ou U com leque, ou helicoidal', 'os leques precisam de balanceamento; leque e espiral são proibidos em rota de fuga e só valem em mezanino ou área privativa', 'NBR 9077:2025, 9.1.11 e 9.5.9.1; a troca de tipo é ' + PROB_SF],
        ['Começar a escada fora da projeção da laje, avançando os primeiros degraus no ambiente de baixo, ou aumentar o vão da laje', 'ocupa área do pavimento de baixo; mexer na laje passa pelo projeto estrutural', PROB_SF],
        ['Reduzir o desnível (laje mais fina ou pé-direito menor), dentro do mínimo do código de obras', 'depende do pé-direito mínimo do município e do cálculo estrutural', PROB_SF]
      ] },
    { t: 'Blondel fora da faixa: piso curto com espelho normal, ou piso longo com espelho baixo', ids: ['blondel', 'p', 'blondel-leque'],
      pq: 'O comprimento é fixado pela planta, o espelho pelo desnível, e o piso vira "o que sobra" (' + PROB_SF + ').',
      regra: 'A fórmula de Blondel soma dois espelhos e um piso (2e + p), que é o tamanho do passo. NBR 9050:2020, 6.8.2: 63 a 65 cm, com piso de 28 a 32 cm; vale em rota acessível e, porque a NBR 9077:2025 remete os degraus à NBR 9050 (9.1.10), também em rota de fuga. A 9.5.9.1 da NBR 9077:2025 (mezanino e área privativa) não fixa Blondel. A NBR 9077:2001, cancelada pela de 2025, pedia 63 a 64 cm (4.7.3.1 b), também nas escadas secundárias daquela edição (4.7.5.1 d e 4.7.5.2); o perfil Estudo usa essa faixa como referência. Só em GO (' + PROB_GO + ', nota da 5.7.5.2) o Blondel é dispensado, e apenas no acesso a barrilete, casa de máquinas e mezanino técnico. Piso mínimo de 25 cm para casa: sem fonte nacional.',
      sol: [
        ['Mudar o número de espelhos (um a mais ou a menos) e tirar o piso da faixa de Blondel, em vez de fixar o piso pelo comprimento', 'cada espelho a mais acrescenta um piso ao comprimento', 'NBR 9050:2020, 6.8.2; referência da NBR 9077:2001, 4.7.3.1 b, cancelada'],
        ['Usar bocel (a saliência da borda do degrau) ou espelho inclinado para ganhar área de pisada sem aumentar a projeção', 'ganho de cerca de 1,5 cm; não foi conferido se o "b" de Blondel inclui o bocel; o risco de um bocel grande prender o pé é ' + PROB_SF, 'NBR 9050:2020, 6.7.1; NBR 9077:2001, 4.7.3.1 e, cancelada'],
        ['Mudar a forma da escada (L, U, leque) para ganhar desenvolvimento', 'leques pedem balanceamento e são proibidos em rota de fuga (NBR 9077:2025, 9.1.11)', PROB_SF]
      ] },
    { t: 'Desnível que não divide certinho, e primeiro ou último degrau diferente na obra', ids: [],
      pq: 'O projeto usa a cota da laje bruta e a obra a cota acabada (ou o contrário), e a diferença do revestimento vai parar no primeiro ou no último espelho (' + PROB_SF + ').',
      regra: 'NBR 9050:2020, 6.8.2: pisos e espelhos constantes em toda a escada; em rota de fuga isso vale pela NBR 9077:2025 (9.1.10). A NBR 9077:2001, cancelada pela de 2025, dizia o mesmo dentro de um lance e aceitava no máximo 5 mm de diferença entre lances seguidos (4.7.3.1 d). No PR (' + PROB_PR + ', 5.7.5.3 g), o mesmo vale para as escadas que a instrução chama de secundárias, categoria que vinha da NBR 9077:2001. Nenhuma das normas lidas aceita primeiro ou último degrau diferente. Programas como o TQS jogam a diferença no último degrau (ajuda do TQS, lido só o resumo), mas isso é convenção de programa, não regra.',
      sol: [
        ['Calcular o número de espelhos entre pisos ACABADOS e desenhar o degrau em osso (só o concreto) descontando o revestimento, com as duas cotas no detalhe', 'exige definir os acabamentos antes de concretar', PROB_SF],
        ['Escolher um número inteiro de espelhos e fazer todos iguais (desnível ÷ número), arredondado ao milímetro', 'um espelho a mais acrescenta um piso ao comprimento', 'NBR 9050:2020, 6.8.2; NBR 9077:2025, 9.1.10'],
        ['Escada já feita errada: corrigir na espessura do contrapiso ou do revestimento; se não der, refazer o degrau', 'qualquer altura diferente descumpre a NBR 9050', PROB_SF]
      ] },
    { t: 'Lance com 1 ou 2 degraus (degrau isolado)', ids: ['lanco'],
      pq: 'Pequenos desníveis de projeto, ou um lance curto que sobra ao dividir os espelhos entre dois lances.',
      regra: 'NBR 9050:2020, 6.7.2: até dois degraus seguidos é "degrau isolado" e deve ser evitado; se usado, com corrimão (6.9.4) e faixa de cor contrastante de pelo menos 3 cm no piso e no espelho (5.4.4.1). A NBR 9077:2025 remete os degraus à NBR 9050 (9.1.10). A NBR 9077:2001, cancelada pela de 2025, pedia lance mínimo de três degraus (4.7.3.2), item que não existe na de 2025, e rampa em saída de emergência com desnível abaixo de 48 cm (4.6.1 c), regra que não foi conferida na de 2025. GO repete os três degraus (' + PROB_GO + ', 5.7.3.2; ' + PROB_EST + ').',
      sol: [
        ['Trocar por rampa', 'pede comprimento: a 10% de inclinação, 1 m de rampa a cada 10 cm de desnível; a obrigação abaixo de 48 cm e o máximo de 10% ou 12,5% eram da edição de 2001 e não foram conferidos na de 2025', 'NBR 9077:2001, 4.6.1 c e 4.6.3.2, cancelada'],
        ['Redistribuir os espelhos entre os lances para nenhum ficar com menos de 3', 'muda a posição do patamar', 'NBR 9050:2020, 6.7.2; ' + PROB_GO + ', 5.7.3.2; NBR 9077:2001, 4.7.3.2, cancelada'],
        ['Se mantido: mesmas medidas da escada, corrimão e faixa contrastante no piso e no espelho', 'a própria norma manda evitar', 'NBR 9050:2020, 6.7.2, 5.4.4.1 e 6.9.4'],
        ['Eliminar o desnível nivelando o contrapiso, quando for de poucos centímetros', 'muda as cotas de piso; pode pedir impermeabilização ou soleira', PROB_SF]
      ] },
    { t: 'Acesso muito íngreme a sótão, mezanino ou caixa d\'água (escada de marinheiro, "de navio" ou de passo alternado)', ids: [],
      pq: 'Sótão ou mezanino com pouca área de piso para uma escada que atenda Blondel.',
      regra: 'A NBR 9050:2020 e a NBR 9077:2001 (cancelada) não falam de escada de marinheiro (a escada vertical, de degraus de barra) nem de passo alternado; nos itens lidos da NBR 9077:2025 (9.1 e 9.5.9.1) também não. A NBR 9077:2025 (9.5.9.1) admite, no acesso a mezanino e área privativa, escada em leque, em espiral ou de lances retos, com população abaixo de 20, altura até 3,7 m e largura de 0,80 m. Em GO (' + PROB_GO + ', nota da 5.7.5.2), barrilete, casa de máquinas e piso ou mezanino técnico de manutenção eventual podem ter marinheiro, espiral ou leque sem largura mínima e sem Blondel. No PR, mezanino e área privativa seguem Blondel (' + PROB_PR + ', 5.7.5.1 f), o que não combina com marinheiro em mezanino ocupado. A NR-35 (Anexo III) trata de escadas de uso individual no trabalho (lido só o resumo). Passo alternado: nenhuma regra brasileira encontrada.',
      sol: [
        ['Separar o uso: espaço técnico com escada de marinheiro, onde os Bombeiros admitirem, tratado como trabalho em altura; ambiente de permanência com escada que atenda Blondel', 'a escada de permanência ocupa bem mais área; a de marinheiro não serve para carregar coisas nem para fuga (' + PROB_SF + ')', PROB_GO + ', nota da 5.7.5.2; NR-35, Anexo III, lido só o resumo'],
        ['Helicoidal ou leque no acesso ao mezanino ou área privativa, nas condições da NBR 9077:2025 (largura de 0,80 m, altura até 3,7 m, população abaixo de 20, patamares de 0,80 m nas escadas curvas e em leque), com espelho alto só onde o estado admitir', 'pede corrimão e guarda; difícil de passar móveis (' + PROB_SF + ')', 'NBR 9077:2025, 9.5.9.1; ' + PROB_GO + ', 5.7.5.1 g'],
        ['Passo alternado: consultar a prefeitura e os Bombeiros antes de usar', 'risco na descida para crianças e idosos (' + PROB_SF + ')', 'sem regra brasileira encontrada; só há referência dos EUA']
      ] },
    { t: 'Não saber qual regra vale: rota de fuga, rota acessível, mezanino ou área privativa, ou casa', ids: [],
      pq: 'A NBR 9077 trata de saídas de emergência e a NBR 9050 de acessibilidade; nenhuma é código de obras de casa, e cada estado tem sua instrução dos Bombeiros.',
      regra: 'A NBR 9077:2025 (terceira edição, 16/07/2025) cancelou a de 2001 e vale para edifícios novos; projetos protocolados até 365 dias depois da publicação, ou seja até 16/07/2026, ainda podiam usar a de 2001 (Prefácio). Nas rotas de saída, ela remete degraus, patamares e larguras à NBR 9050 (9.1.10), proíbe degraus em leque e escada em espiral (9.1.11), faz toda mudança de direção por patamar sem degraus, com largura não inferior à dos lances (9.1.12), e pede corrimão dos dois lados (9.1.5). No acesso a mezanino e área privativa (9.5.9.1) admite leque, espiral ou lances retos com população abaixo de 20 e altura até 3,7 m, largura de 0,80 m, piso antiderrapante, corrimão (basta de um lado se a largura for menor que 1,20 m), guarda nos lados abertos, o Anexo A (sistema de abandono) e patamares de 0,80 m nas escadas curvas e em leque. As escadas "secundária" e "de serviço" eram da NBR 9077:2001 (4.7.5), cancelada: a edição de 2025 não tem essas categorias. No PR (' + PROB_PR + ', 5.7.5.3): secundária com 0,80 m de largura. Em GO (' + PROB_GO + ', 5.7.5.1): uso restrito com 80 cm (' + PROB_EST + '). NBR 9050:2020: áreas técnicas e de acesso restrito não precisam ser acessíveis; prédios multifamiliares, sim, nas áreas comuns.',
      sol: [
        ['Antes de desenhar, classificar a escada: (1) rota de fuga (NBR 9077:2025, que remete à NBR 9050), (2) rota acessível (NBR 9050), (3) acesso a mezanino ou área privativa (NBR 9077:2025, 9.5.9.1), (4) escada de casa, que segue o código de obras do município', 'a regra do município varia por cidade e não está no app', 'NBR 9077:2025, 9.1 e 9.5.9.1; NBR 9050:2020, escopo; ' + PROB_PR + ', 5.7.5; ' + PROB_GO + ', 5.7.5'],
        ['Escolher no app o perfil que corresponde: Rota de fuga, NBR 9050, Mezanino ou área privativa, ou Estudo', 'o perfil Estudo não é norma: usa números usuais e referências da edição de 2001, cancelada', 'perfis do app'],
        ['Projeto protocolado até 16/07/2026: conferir qual edição o órgão aceitou, porque as concessões da escada secundária da NBR 9077:2001 (ponta de 7 cm, patamar de 80 cm) só valem por aquela edição', 'para projeto novo, vale a edição de 2025', 'NBR 9077:2025, Prefácio; NBR 9077:2001, 4.7.5.1 d, cancelada']
      ] }
  ] },
  { tema: 'Curvas e caracol', itens: [
    { t: 'Leque convergente com ponta zero: os degraus da curva viram triângulos', ids: ['ponta', 'leque'], cond: R => !R.bal,
      pq: 'Dividir o giro em fatias iguais a partir do canto é rápido e economiza espaço (' + PROB_SF + ').',
      regra: 'NBR 9050:2020, 6.8.6 e Figura 75: em lance curvo, piso e espelho medidos a 55 cm da borda interna, com ponta de 15 cm. A NBR 9077:2025 não fixa a ponta: proíbe o leque em rota de saída (9.1.11) e o admite em mezanino e área privativa (9.5.9.1) sem dizer a medida; o app usa 15 cm como referência. A NBR 9077:2001, cancelada pela de 2025, pedia degraus balanceados na curva, piso medido na linha de caminhamento (a 55 cm da borda, ou no eixo se a escada tiver menos de 1,10 m, item 3.32) e parte mais estreita de 15 cm (4.7.3.1 c), ou 7 cm na escada secundária daquela edição (4.7.5.1 d). Ponta zero não atende a NBR 9050 nem a referência.',
      sol: [
        ['Balancear: espalhar o estreitamento também pelos degraus retos vizinhos, com piso igual na linha de caminhamento, até a ponta chegar a 15 cm. É o que o app faz no modo "balanceados"', 'mais degraus tortos; forma de concreto ou corte das peças mais trabalhosos (' + PROB_SF + ')', 'NBR 9050:2020, 6.8.6; método da NBR 9077:2001, 4.7.3.1 c e 4.7.9.1 b, cancelada'],
        ['Trocar o leque por patamar no canto (L ou U com patamar), com lado igual à largura da escada. Em rota de fuga é obrigatório', 'o número de espelhos não muda, mas a curva deixa de subir e os lances ficam mais compridos', 'NBR 9077:2025, 9.1.11 e 9.1.12; NBR 9050:2020, 6.8.8'],
        ['Eliminar o leque com um patamar e um degrau a mais, dividindo em dois lances', 'muda espelho e comprimento; reconferir Blondel', 'opinião de usuário num fórum de Portugal, lido só o resumo'],
        ['Afastar a borda interna do canto (vão central ou pilar maior) para aumentar a ponta', 'a caixa da escada fica maior', PROB_SF]
      ] },
    { t: 'Balanceamento: qual método usar e como provar que está certo', ids: [],
      pq: 'Os métodos são ensinados por apostilas e professores, com variações; a norma só fixava o resultado (' + PROB_SF + ').',
      regra: 'A NBR 9077:2025 não trata de balanceamento (leque só em mezanino e área privativa, 9.5.9.1). A NBR 9077:2001, cancelada pela de 2025, pedia leques balanceados "utilizando-se um dos sistemas de balanceamento recomendados", com piso constante na linha de percurso (4.7.9.1 b), mas não listava esses sistemas, e ponta de pelo menos 15 cm (4.7.9.1 c). NBR 9050:2020, 6.8.6: medida a 55 cm da borda interna. No PR (' + PROB_PR + ', 5.7.3.1 c): linha a 55 cm e ponta de 15 cm (' + PROB_EST + '). Não foi achada fonte aberta que descreva os processos gráficos.',
      sol: [
        ['Conferir o resultado, não o método: piso igual em todos os degraus na linha de caminhamento, ponta mais estreita acima do mínimo e Blondel na linha', 'outros processos gráficos dão degraus um pouco diferentes', 'NBR 9050:2020, 6.8.6; referência da NBR 9077:2001 (3.32, 4.7.3.1 b e c, 4.7.9.1 b e c), cancelada'],
        ['Programas BIM têm opção de largura mínima do degrau em leque; no ArchiCAD ela é medida da projeção do ponto de giro até a borda interna', 'cada programa tem seu cálculo; conferir os valores na linha de caminhamento', 'ajuda do ArchiCAD, Graphisoft, lido só o resumo']
      ] },
    { t: 'Caracol com pilar central fino: a ponta do degrau junto ao pilar fica com poucos centímetros', ids: ['pilar', 'mudanca'], cond: R => !!R.hel && (!!(R.nm && R.nm.fuga) || (R.checks || []).some(c => c.id === 'pilar' && c.status !== 'ok')), conta: true,
      pq: 'Caracóis de catálogo usam pilar fino e diâmetro pequeno para caber num furo pequeno de laje (' + PROB_SF + ').',
      regra: 'NBR 9077:2025, 9.1.11: escada em espiral é proibida nas rotas de saída. 9.5.9.1: no acesso a mezanino e área privativa ela é permitida, com população abaixo de 20, altura até 3,7 m, largura de 0,80 m, corrimão, guarda nos lados abertos e patamares de pelo menos 0,80 m nas escadas curvas; a norma não fixa a ponta junto ao pilar. A NBR 9077:2001, cancelada pela de 2025, aceitava ponta de 7 cm na escada secundária (4.7.5.1 d) e, em saída de emergência, pedia degraus convergindo para um vão central de diâmetro mínimo de 0,97 m (piso de 32 cm) a 1,375 m (piso de 27 cm), conforme o piso (4.7.8.1 b). Em GO (' + PROB_GO + ', 5.7.5.1 g), uso restrito: 15 cm em lance curvo e 7 cm em espiral. No PR (' + PROB_PR + ', 5.7.3.1 c): 15 cm em leque ou espiral, sem exceção de 7 cm, e largura mínima de 0,80 m (5.7.5.1 b). ' + PROB_EST.charAt(0).toUpperCase() + PROB_EST.slice(1) + '.',
      sol: [
        ['Usar o caracol só fora da rota de fuga: no acesso a mezanino ou área privativa, nas condições da 9.5.9.1, e conferir a ponta pela regra do estado (7 cm em GO na espiral, 15 cm no PR), aumentando o pilar ou criando um vão central', 'diâmetro total e furo na laje maiores', 'NBR 9077:2025, 9.1.11 e 9.5.9.1; ' + PROB_GO + ', 5.7.5.1 g; ' + PROB_PR + ', 5.7.3.1 c'],
        ['Trocar o pilar fino pela caracol autoportante, sem pilar e com um olho (vão no meio) maior: o olho maior aumenta a ponta do degrau, que é o raio do olho × o ângulo do degrau. No app: Centro "Vazio (autoportante)" e um diâmetro do centro maior', 'diâmetro total e furo na laje maiores; a laje helicoidal se sustenta sozinha e precisa de cálculo estrutural de engenheiro', PROB_SF + '; a conta é geometria'],
        ['Na rota de fuga, trocar o caracol por lances retos com patamares nas mudanças de direção', 'bem mais área em planta', 'NBR 9077:2025, 9.1.11 e 9.1.12'],
        ['Diminuir os degraus por volta (ângulo maior por degrau) para aumentar a ponta, conferindo Blondel e altura livre', 'piso na linha maior ou espelho maior; a altura livre sob a volta de cima diminui', PROB_SF + '; a conta é geometria'],
        ['Em GO, barrilete, casa de máquinas e piso técnico de manutenção eventual podem ter espiral sem largura mínima e sem Blondel', 'só em GO e só nesses locais técnicos', PROB_GO + ', nota da 5.7.5.2'],
        ['Só como comparação: o código residencial dos EUA aceita caracol com 66 cm de largura livre, espelho de até 24 cm e piso de 19 cm medido a 30 cm da borda estreita. Por isso caracóis importados costumam não fechar com Blondel', 'não é norma brasileira e o app não usa como limite', 'código residencial dos EUA (IRC), em sites de consulta, lido só o resumo']
      ] },
    { t: 'Escada em leque ou curva usada como saída de emergência do prédio', ids: ['mudanca'], cond: R => !!(R.nm && R.nm.fuga),
      pq: 'A escada curva é peça de destaque no hall e acaba sendo a única do pavimento (' + PROB_SF + ').',
      regra: 'NBR 9077:2025, 9.1.11: as escadas das rotas de saída não podem ter degraus em leque nem ser em espiral. 9.1.12: toda mudança de direção é feita entre lances, por patamar sem degraus e com largura não inferior à dos lances. A única abertura para leque e espiral é o acesso a mezanino e área privativa (9.5.9.1): população abaixo de 20, altura até 3,7 m, largura de 0,80 m, piso antiderrapante, corrimão (de um lado basta abaixo de 1,20 m), guarda nos lados abertos, Anexo A e patamares de 0,80 m nas escadas curvas e em leque. A NBR 9077:2001, cancelada pela de 2025, aceitava lance curvo e leque em saída de emergência em alguns casos (4.7.7, 4.7.8.1 e 4.7.9); para projeto novo isso não vale mais. Em GO (' + PROB_GO + ', 5.7.1 k), leque e espiral não são escada de segurança, salvo em mezanino e área privativa (' + PROB_EST + ').',
      sol: [
        ['Separar funções: a escada curva fica como escada social, fora da rota de fuga, e uma escada de lances retos com patamares faz a rota de fuga', 'duas escadas: mais área e custo', 'NBR 9077:2025, 9.1.11 e 9.1.12; ' + PROB_GO + ', 5.7.1 k'],
        ['Se a escada curva só atende um mezanino ou uma área privativa, enquadrar pela 9.5.9.1 e usar no app o perfil "Mezanino ou área privativa"', 'população abaixo de 20, altura até 3,7 m, largura de 0,80 m e patamares de 0,80 m nas curvas; corrimão, guarda e Anexo A', 'NBR 9077:2025, 9.5.9.1'],
        ['Projeto protocolado até 16/07/2026 pela edição de 2001: as exceções dela (vão central conforme o piso, leque com 90 cm em prédio pequeno) só valem se o órgão aceitou aquela edição', 'para projeto novo, a curva sai da rota de fuga', 'NBR 9077:2025, Prefácio; NBR 9077:2001, 4.7.7 e 4.7.8.1, cancelada']
      ] },
    { t: 'Leque ou curva numa rota acessível', ids: ['mudanca'],
      pq: 'O leque faz a mudança de direção com degraus, sem o patamar que a NBR 9050 pede.',
      regra: 'NBR 9050:2020, 6.8.7: patamar a cada 3,20 m de desnível e sempre que houver mudança de direção; 6.8.8: nesse caso, com lado igual à largura. 6.8.6 aceita lances curvos, com piso e espelho medidos a 55 cm da borda interna. A norma não diz como conciliar 6.8.6 com 6.8.7. O app adota a leitura mais segura: no perfil NBR 9050, leque e helicoidal aparecem como "não atende" (pede patamar). Outra leitura é possível; confirme com quem aprova o projeto. Largura mínima: 1,20 m (6.8.3). Se a escada também é rota de fuga, a NBR 9077:2025 resolve a dúvida: leque e espiral são proibidos (9.1.11).',
      sol: [
        ['Na rota acessível, lances retos com patamar nas mudanças de direção (L ou U com patamar)', 'mais área; a escada curva fica como escada não acessível', 'NBR 9050:2020, 6.8.7 e 6.8.8'],
        ['Em curva contínua (helicoidal grande) que não é rota de fuga, se quem aprova aceitar a leitura da 6.8.6: piso e espelho constantes a 55 cm da borda interna, ponta de 15 cm e corrimão dos dois lados. O app continua marcando "não atende" no perfil NBR 9050, porque adota a leitura que pede patamar', 'depende do entendimento de quem aprova', 'NBR 9050:2020, 6.8.6 e 6.9.3.2']
      ] },
    { t: 'Caracol ou leque em mezanino e residência: o que a regra exige e quem fiscaliza', ids: ['altura', 'htot', 'patcurva', 'mezreq'],
      pq: 'Em casa e mezanino o espaço é pequeno, e cada estado e município tem regra própria (' + PROB_SF + ').',
      regra: 'NBR 9077:2025, 9.5.9.1: no acesso a mezaninos e áreas privativas de qualquer edificação podem ser usadas escadas abertas em leque, em espiral ou de lances retos, desde que a) a população seja inferior a 20 pessoas e a altura percorrida não passe de 3,7 m; b) a largura mínima seja 0,80 m; c) o piso seja antiderrapante (coeficiente de atrito dinâmico de pelo menos 0,5); d) haja corrimão, que basta de um lado se a largura for menor que 1,20 m; e) haja guarda-corpo nos lados abertos; f) atendam ao Anexo A (sistema de abandono), e as escadas curvas e em leque tenham patamares de pelo menos 0,80 m de comprimento (o texto não diz onde). Ela não fixa espelho, piso, Blondel nem ponta. No PR (' + PROB_PR + ', 5.7.5.1 e 5.7.5.1.1): mezanino e área privativa, que inclui a residência unifamiliar, aceitam leque, espiral ou reta com população abaixo de 10 e escada de até 3,7 m, largura de 0,80 m, piso antiderrapante, corrimão (um basta até 1,10 m), guarda no lado aberto, Blondel, patamar de 0,80 m, pé-direito de 2,5 m (2,10 m sob vigas) e placa "ESCADA DE ACESSO RESTRITO". Em GO (' + PROB_GO + ', 5.7.5.1): população abaixo de 20, até 3,7 m, um pavimento, 80 cm, ponta de 15 cm (curva) e 7 cm (espiral). ' + PROB_EST.charAt(0).toUpperCase() + PROB_EST.slice(1) + '. Não foi encontrado artigo de código de obras municipal com limites para caracol.',
      sol: [
        ['Identificar o enquadramento antes de desenhar (casa ou mezanino, rota de fuga, rota acessível) e consultar o código de obras da cidade e a instrução dos Bombeiros do estado', 'exige pesquisa local; o app não conhece o código municipal', 'NBR 9077:2025, 9.5.9.1; ' + PROB_PR + ', 5.7.5.1; ' + PROB_GO + ', 5.7.5.1; consultar o município é ' + PROB_SF],
        ['Caracol em mezanino: largura de 80 cm, Blondel na linha de caminhamento (referência), ponta conforme o estado, guarda no lado aberto e patamares de 80 cm na saída e na chegada. Ler que os patamares ficam na saída e na chegada, e usar 2,10 m como altura livre sob a volta de cima, é interpretação nossa', 'com 80 cm de largura útil o diâmetro total passa de 1,70 m (conta, não norma)', 'NBR 9077:2025, 9.5.9.1 b, e e f; ' + PROB_PR + ', 5.7.5.1; ' + PROB_GO + ', 5.7.5.1'],
        ['Escada que passa de 3,7 m de altura percorrida ou que atende 20 pessoas ou mais sai da 9.5.9.1: vale a regra de rota de fuga (sem leque nem espiral)', 'muda o tipo de escada', 'NBR 9077:2025, 9.5.9.1 a e 9.1.11']
      ] }
  ] },
  { tema: 'Espaço, altura e patamares', itens: [
    { t: 'Altura livre baixa: a cabeça bate na borda da laje ou na viga de cima', ids: ['altura'],
      pq: 'A abertura da laje é desenhada com o comprimento que a estrutura deixa, sem medir a folga na vertical sobre cada degrau (' + PROB_SF + ').',
      regra: 'NBR 9077:2025, 4.2 b: as rotas de saída têm pé-direito mínimo de 2,30 m; sob vigas, vergas de portas e outros obstáculos, altura livre mínima de 2,10 m. A NBR 9077:2001, cancelada pela de 2025, pedia nos ACESSOS 2,50 m e 2,00 m livres sob vigas (4.5.1.1 d). No PR (' + PROB_PR + ', 5.7.1.1 k e 5.7.5.1 g) e em GO (' + PROB_GO + ', 5.7.1 l): escadas com 2,5 m e 2,10 m sob vigas. As normas não dizem como medir na escada; medir na vertical a partir do bocel é ' + PROB_SF + '.',
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
      regra: 'Não há regra específica. A NBR 9077:2001, cancelada pela de 2025, proibia usar a caixa de escada de emergência como depósito ou para quadros e medidores (4.7.4.2 e 4.7.4.3, com exceção para escadas não enclausuradas de edificações L e M); na de 2025 não foi conferido item equivalente. No PR (' + PROB_PR + ', 5.7.1.1 j): escada de emergência livre de móveis. NBR 9050:2020, 4.3.3 trata de móveis na rota acessível (risco entre 0,60 e 2,10 m de altura) e serve só como comparação. Pé-direito de lavabo: é do código municipal, não encontrado.',
      sol: [
        ['Fechar a parte baixa com armário ou mureta e deixar passagem só onde a altura basta', 'perde um pouco de área útil', 'comparação com NBR 9050:2020, 4.3.3; em casa, ' + PROB_SF],
        ['Em caixa de escada de emergência, não usar o vão como depósito nem instalar quadros ou medidores', 'nenhum', PROB_PR + ', 5.7.1.1 j; NBR 9077:2001, 4.7.4.2 e 4.7.4.3, cancelada']
      ] },
    { t: 'Largura mínima que não cabe em casa estreita', ids: ['L'],
      pq: 'Lote estreito, ou regra de prédio coletivo aplicada a uma casa, ou o contrário (' + PROB_SF + ').',
      regra: 'Rota de fuga: NBR 9077:2025, 9.4.2.2: largura mínima pela NBR 9050, salvo se a largura calculada pela população for maior (9.4.2.1, Tabela 10; o app não faz essa conta). O único número da NBR 9050 para escada é 1,20 m, para rota acessível (6.8.3), e o app adota esse valor também na rota de fuga; 9.4.1 d: medida no ponto mais estreito, sem contar os corrimãos, que podem avançar até 10 cm de cada lado sem aumentar a largura exigida (o guarda-corpo conta). Mezanino e área privativa: 0,80 m (9.5.9.1 b). A NBR 9077:2001, cancelada pela de 2025, pedia 1,10 m (4.4.2) e aceitava 90 cm em prédio pequeno (4.7.7). No PR (' + PROB_PR + ', 5.7.5.1 a e b): 0,80 m em área privativa, inclusive casa, com população abaixo de 10 e escada de até 3,7 m. Uma revista da UNESP cita 0,80 m no Código de Obras de São Paulo, sem dizer a edição: confira a lei vigente.',
      sol: [
        ['Enquadrar corretamente: em mezanino, casa ou área privativa, usar os 0,80 m da 9.5.9.1', 'só nessas condições (população abaixo de 20, altura até 3,7 m); no PR a instrução pede população abaixo de 10; confira os Bombeiros e o município locais', 'NBR 9077:2025, 9.5.9.1 b; ' + PROB_PR + ', 5.7.5.1 e 5.7.5.1.1'],
        ['Corrimão que avança até 10 cm de cada lado sem reduzir a largura de cálculo', 'não vale para guarda-corpo', 'NBR 9077:2025, 9.4.1 d'],
        ['L ou U encostada nas divisas, ou estrutura lateral fina para ganhar largura útil', 'custo da estrutura metálica', PROB_SF]
      ] },
    { t: 'Lance longo sem patamar (pé-direito alto, mezanino, térreo comercial)', ids: ['patamar', 'htot'],
      pq: 'Pé-direito alto vencido com uma reta só para economizar área (' + PROB_SF + ').',
      regra: 'NBR 9050:2020, 6.8.7: patamar a cada 3,20 m, em rota acessível e, pela NBR 9077:2025 (9.1.10), também em rota de fuga. Mezanino e área privativa: altura TOTAL percorrida de no máximo 3,7 m (NBR 9077:2025, 9.5.9.1 a). A NBR 9077:2001, cancelada pela de 2025, pedia patamar a cada 3,70 m em saída de emergência (3.30 e 4.7.3.2). No PR (' + PROB_PR + ', 5.7.5.1 a), a escada privativa tem no máximo 3,7 m de altura TOTAL.',
      sol: [
        ['Patamar intermediário (reta com patamar) ou escada em L ou U', 'mais comprimento ou largura em planta', 'NBR 9050:2020, 6.8.7; NBR 9077:2025, 9.1.10'],
        ['Três lances com dois patamares (em C ou em Z)', 'mais área', PROB_SF],
        ['Mezanino com mais de 3,7 m de altura percorrida: o patamar não resolve, porque a escada sai da 9.5.9.1 e passa a seguir a regra de rota de fuga', 'sem leque nem espiral; largura e degraus pela NBR 9050', 'NBR 9077:2025, 9.5.9.1 a, 9.1.10 e 9.1.11']
      ] },
    { t: 'Patamar curto (menor que o passo, ou que a largura na mudança de direção)', ids: ['patprof', 'patcurva'],
      pq: 'O patamar é encaixado no espaço que sobra, sem pensar no ritmo do passo (' + PROB_SF + ').',
      regra: 'NBR 9050:2020, 6.8.8: 1,20 m entre lances; na mudança de direção, igual à largura. Em rota de fuga isso vale pela NBR 9077:2025 (9.1.10), que também diz que o patamar de mudança de direção não pode ser mais estreito que os lances nem ter degraus (9.1.12). Mezanino e área privativa: escadas curvas e em leque com patamares de pelo menos 0,80 m de comprimento (9.5.9.1 f). A NBR 9077:2001, cancelada pela de 2025, tinha a fórmula (2e + p) × n + p, com n = 1, 2 ou 3 passos (4.7.3.3 a), que o perfil Estudo usa como referência, e 80 cm sem a fórmula na escada secundária daquela edição (4.7.5.1 d). No PR, mezanino e área privativa: 0,80 m (' + PROB_PR + ', 5.7.5.1 f).',
      sol: [
        ['Usar n = 2 quando a regra pede 1,20 m, mantendo o ritmo do passo', 'mais comprimento', 'NBR 9050:2020, 6.8.8; fórmula da NBR 9077:2001, 4.7.3.3 a, cancelada'],
        ['Fora de rota de fuga e de rota acessível, enquadrar como acesso a mezanino ou área privativa (patamar de 0,80 m)', 'só fora dessas rotas e nas condições da 9.5.9.1', 'NBR 9077:2025, 9.5.9.1 f; ' + PROB_PR + ', 5.7.5.1 f'],
        ['Trocar o patamar de canto por leque balanceado', 'só em mezanino ou área privativa: em rota de fuga é proibido (NBR 9077:2025, 9.1.11) e em rota acessível a NBR 9050 (6.8.7) pede patamar', 'NBR 9077:2025, 9.1.11 e 9.5.9.1']
      ] },
    { t: 'Porta abrindo sobre o degrau ou sobre o patamar', ids: [],
      pq: 'A porta fica no topo da escada para economizar circulação (' + PROB_SF + ').',
      regra: 'NBR 9050:2020, 6.8.8: o giro da porta não pode invadir a medida mínima do patamar. A NBR 9077:2001, cancelada pela de 2025, pedia, dos dois lados da porta, patamar com pelo menos a largura da folha (4.7.3.4); na de 2025 não foi conferido item equivalente. No PR (' + PROB_PR + ', 5.7.3.4.1): proibidas portas nos patamares entre lances.',
      sol: [
        ['Afastar a porta do degrau com patamar maior que a folha, ou abrir para fora da escada (se a rota de fuga permitir)', 'mais área de patamar', 'NBR 9050:2020, 6.8.8; NBR 9077:2001, 4.7.3.4, cancelada'],
        ['Porta em recesso na parede; porta de correr só fora de rota de fuga', 'a de correr veda pior e não serve como porta corta-fogo', 'NBR 9077:2001, 4.4.3.3 (recesso), cancelada; a porta de correr é ' + PROB_SF]
      ] },
    { t: 'Primeiro ou último degrau colado na circulação', ids: [],
      pq: 'O espelho final é alinhado com a parede do corredor para ganhar área (' + PROB_SF + ').',
      regra: 'NBR 9050:2020, 6.8.4: em construção nova, o primeiro e o último degrau ficam a pelo menos 30 cm da circulação e são sinalizados; a sinalização no piso segue a NBR 16537, que não foi lida. Em rota de fuga, a NBR 9077:2025 remete os degraus à NBR 9050 (9.1.10). Na NBR 9077:2001 (cancelada) não foi encontrada regra própria.',
      sol: [
        ['Recuar o lance 30 cm ou alongar o patamar de chegada', '30 cm a mais em planta em cada ponta', 'NBR 9050:2020, 6.8.4'],
        ['Sinalização tátil e visual no piso (obrigatória junto com o recuo em obra nova); em reforma sem espaço, pelo menos reduz o risco', 'não resolve a geometria', 'NBR 9050:2020, 6.8.4 e 5.4.6; o uso em reforma é ' + PROB_SF]
      ] }
  ] },
  { tema: 'Corrimão, guarda-corpo e segurança', itens: [
    { t: 'Corrimão ausente, só de um lado, na altura errada ou cortado no patamar', ids: [],
      pq: 'Economia ou estética; do lado do vão não há parede para fixar, e o prolongamento de 30 cm invade a circulação.',
      regra: 'NBR 9077:2025, 9.1.5: escadas das rotas de saída com corrimão dos dois lados, conforme a NBR 9050 (a de 2025 não tem altura própria); 9.5.9.1 d: em mezanino e área privativa, corrimão, que basta de um lado se a largura for menor que 1,20 m. NBR 9050:2020, 6.9.3.2 e 6.9.3.3: dois lados, a 92 e 70 cm, prolongado 30 cm nas pontas e contínuo nos patamares. A NBR 9077:2001, cancelada pela de 2025, pedia altura de 80 a 92 cm acima da linha dos bocéis (4.8.2.1) e seção redonda de 38 a 65 mm (4.8.2.3). No PR (' + PROB_PR + ', 5.8.2.1): dos dois lados, de 0,80 a 0,92 m; em área privativa, um basta até 1,10 m (5.7.5.1 d).',
      sol: [
        ['Fixar o corrimão na própria guarda do lado aberto; no PR, em escada interna com vão central de até 15 cm, a guarda de 0,92 m pode ser o corrimão', 'a guarda precisa de perfil que dê para segurar; sem tábua larga nem aresta viva', PROB_PR + ', 5.8.1.2.1; NBR 9077:2001, 4.8.2.5, cancelada'],
        ['Em edificação existente sem espaço para os 30 cm, levar o prolongamento ao longo da circulação ou fixar na parede ao lado', 'só para edificação existente', 'NBR 9050:2020, 6.9.3.4, nota'],
        ['Seção redonda de 38 a 45 mm, que atende a NBR 9050 e também a faixa da edição de 2001', 'nenhum relevante', 'NBR 9050:2020, 4.6.5; NBR 9077:2001, 4.8.2.3, cancelada'],
        ['Em casa, mesmo sem exigência local, pelo menos um corrimão firme', 'custo baixo', PROB_SF]
      ] },
    { t: 'Guarda-corpo baixo no lado aberto da escada, do patamar ou do mezanino', ids: [],
      pq: 'A guarda é medida a partir do degrau e não da linha dos bocéis, ou os 92 cm do lance são repetidos no patamar.',
      regra: 'NBR 9077:2025, 9.1.4: guarda-corpo nos lados abertos das escadas, conforme a NBR 14718 (não lida); 9.5.9.1 e: também em mezanino e área privativa. A NBR 9077:2001, cancelada pela de 2025, pedia proteção quando o desnível passa de 19 cm (4.8.1.1) e guarda de 1,05 m em patamar e mezanino, que podia ser 92 cm no lance de escada interna, medida na vertical a partir da linha dos bocéis (4.8.1.2). No PR (' + PROB_PR + ', 5.8.1.2): 1,05 m também ao longo das escadas; 0,92 m só em escada interna com vão central de até 15 cm. A NBR 9050:2020 (6.9.2) manda seguir a NBR 9077 e a NBR 14718; pelo resumo de uma busca, a edição de 2001 da NBR 14718 pede 1,10 m a partir do piso acabado (a revisão de 2019 não foi conferida).',
      sol: [
        ['Conferir a altura na NBR 14718 e no código local; como referência, a edição de 2001 da NBR 9077 usava 92 cm sobre a linha dos bocéis no lance interno e 1,05 m no patamar e no mezanino (no PR, 1,05 m também no lance, salvo a exceção)', 'na chegada ao patamar a altura muda e pede um detalhe de concordância', 'NBR 9077:2025, 9.1.4; NBR 9077:2001, 4.8.1.2, cancelada; ' + PROB_PR + ', 5.8.1.2'],
        ['Completar a mureta baixa com tubo ou vidro até a altura exigida', 'o vidro tinha de ser laminado ou aramado na edição de 2001 (4.8.1.4 c, cancelada); conferir na NBR 14718', PROB_SF],
        ['Fechar o vão com parede', 'perde luz e transparência', 'NBR 9077:2025, 9.1.4']
      ] },
    { t: 'Guarda vazada com vãos grandes ou barras horizontais que dá para escalar', ids: [],
      pq: 'Estética (barras deitadas, cabos de aço, poucos montantes) ou economia.',
      regra: 'A NBR 9077:2025 remete o guarda-corpo à NBR 14718 (9.1.4), que não foi lida. A NBR 9077:2001, cancelada pela de 2025, pedia (exceto nas ocupações I e J) que uma esfera de 15 cm não passasse por nenhuma abertura, sem saliências que enganchem roupa e com vidro que não estilhaça (4.8.1.4). No PR (' + PROB_PR + ', 5.8.1.4 a): a mesma esfera, com exceções na nota. Contar também o triângulo entre degrau e travessa inclinada é interpretação nossa de "nenhuma abertura". Pelo resumo de uma busca, a NBR 14718:2001 limitaria o vão a 11 cm (não conferido).',
      sol: [
        ['Balaústres (barras) verticais com vão livre de até 11 cm', 'mais montantes, mais custo de serralheria', 'NBR 9077:2001, 4.8.1.4 a, cancelada; os 11 cm só pelo resumo da busca'],
        ['Vidro laminado, chapa perfurada ou tela metálica no lugar das barras deitadas', 'o vidro pede limpeza e fixação calculada', 'NBR 9077:2001, 4.8.1.4 a e c, e 4.8.3.1 b, cancelada'],
        ['Em casa pronta: tela de proteção na guarda e portão de segurança no topo e na base', 'paliativo, não substitui a guarda', 'sites Decorfácil e Cursa, lido só o resumo']
      ] },
    { t: 'Escada de casa sem guarda-corpo no lado aberto', ids: [],
      pq: 'Escolha de estética e custo; dentro da casa quase não há fiscalização.',
      regra: 'NBR 9077:2025, 9.5.9.1 e: escada de acesso a mezanino e área privativa com guarda nos lados abertos; aplicar isso à casa depende do código local, não encontrado. No PR (' + PROB_PR + ', 5.7.5.1 e e 5.7.5.1.1): escada de área privativa, inclusive casa, com guarda nos lados abertos. A NBR 9077:2001, cancelada, pedia o mesmo nas escadas secundárias daquela edição (4.7.5.1 c). Numa matéria da Gazeta do Povo (lido só o resumo), um engenheiro do Crea-PR diz que em casa a guarda não é exigida nem fiscalizada.',
      sol: [
        ['Desenhar a guarda no projeto e registrar no memorial quando o dono decide não colocar', 'muda a estética "flutuante"', PROB_SF],
        ['Deixar chumbadores ou reforço na laje e no degrau para pôr a guarda depois', 'custo pequeno na obra', PROB_SF],
        ['Paliativo: rede de proteção e portões de segurança', 'pouco durável; a fixação pede manutenção', 'site Decorfácil, lido só o resumo']
      ] },
    { t: 'Bocel saliente demais, ausente, ou degrau sem espelho (vazado)', ids: ['bocel', 'vazado'],
      pq: 'A pedra é assentada com 3 a 4 cm de sobra, ou rente; em escada metálica ou de madeira o degrau fica solto para parecer leve.',
      regra: 'NBR 9050:2020, 6.7.1, em rota acessível (e em rota de fuga, pela NBR 9077:2025, 9.1.10): espelho vazado proibido e avanço de NO MÁXIMO 1,5 cm. A NBR 9077:2025 define degrau com espelho não vazado (3.11). A NBR 9077:2001, cancelada pela de 2025, pedia bocel de NO MÍNIMO 1,5 cm (sem bocel, a quina avança o mesmo sobre o degrau de baixo; 4.7.3.1 e), e o perfil Estudo usa esse mínimo como referência. No PR (' + PROB_PR + ', 5.7.3.1 e e f): no máximo 1,5 cm. Quem segue a NBR 9050 e a referência de 2001 fica com exatamente 1,5 cm.',
      sol: [
        ['Especificar no detalhe um bocel de 1,5 cm (ou espelho inclinado com o mesmo avanço) e cotar o acabamento, não só a estrutura', 'a pedra precisa de corte sob medida', 'NBR 9050:2020, 6.7.1; NBR 9077:2001, 4.7.3.1 e, cancelada; ' + PROB_PR + ', 5.7.3.1 f'],
        ['Em rota acessível e em rota de fuga, fechar o espelho vazado com chapa, vidro ou madeira; fora delas, pelo menos diminuir a abertura', 'perde transparência e ganha peso', 'NBR 9050:2020, 6.7.1; NBR 9077:2025, 3.11; diminuir a abertura é ' + PROB_SF]
      ] },
    { t: 'Piso escorregadio na escada', ids: [],
      pq: 'O acabamento é escolhido pela aparência; peça polida com água tem pouca aderência.',
      regra: 'NBR 9077:2025, 9.1.8: escadas das rotas de saída com piso antiderrapante, conforme a NBR 16919 (não lida); 9.5.9.1 c: em mezanino e área privativa, coeficiente de atrito dinâmico (medida de aderência) de pelo menos 0,5, conforme a NBR 15575. No PR (' + PROB_PR + ', inclusive área privativa, 5.7.5.1 c): também 0,5. NBR 9050:2020, 6.3.2: antiderrapante seco ou molhado. A NBR 9077:2001, cancelada, também pedia piso antiderrapante (4.7.1 g). O método de ensaio não foi conferido.',
      sol: [
        ['Especificar revestimento antiderrapante e conferir na ficha do fabricante (atrito de 0,5 ou mais)', 'pode ser mais difícil de limpar', 'NBR 9077:2025, 9.5.9.1 c; ' + PROB_PR],
        ['Em obra pronta: fita antiderrapante na borda do degrau, ou frisos no bocel', 'a fita é provisória e gasta', 'Catraca Livre e boletim da 3M, lido só o resumo; fresar frisos é ' + PROB_SF]
      ] },
    { t: 'Degraus sem sinalização e escada mal iluminada', ids: [],
      pq: 'Revestimento de uma cor só, um único ponto de luz que faz sombra no degrau, nenhuma luz de emergência.',
      regra: 'NBR 9050:2020, 5.4.4.2: faixa de cor contrastante nos degraus, de pelo menos 7 cm por 3 cm, de preferência fotoluminescente (que brilha no escuro), obrigatória assim em saída de emergência; a nota recomenda a faixa no degrau inteiro. 6.1.2: rota acessível com pelo menos 150 lux a 1 m do chão. NBR 9077:2025, 9.1.7: escadas das rotas de saída com iluminação de emergência pela NBR 10898 (não lida) e sinalização de emergência; 9.1.10 remete a sinalização dos degraus à NBR 9050. Iluminação de escada de casa: não encontrado.',
      sol: [
        ['Faixa contrastante e antiderrapante nas bordas, na projeção do corrimão ou no bocel inteiro', 'interfere na estética; a fita gasta', 'NBR 9050:2020, 5.4.4.2 e nota'],
        ['Balizadores na parede ou LED embutido sob o bocel, iluminando o piso sem ofuscar quem desce', 'a elétrica precisa estar no projeto', PROB_SF],
        ['Em saída de emergência: iluminação de emergência e sinalização fotoluminescente nos degraus', 'custo de instalação e manutenção', 'NBR 9050:2020, 5.4.4.2 c; NBR 9077:2025, 9.1.7 e 9.1.10; NBR 10898, não lida']
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

  let h = '<p>Muita escada feita na prática não atende ao limite da norma. Antes de tudo, é preciso saber QUAL regra vale para esta escada. São quatro casos:</p><ul>' +
    '<li><b>Rota de fuga</b>: NBR 9077:2025 e a instrução dos Bombeiros do estado. Degraus, patamares e larguras seguem a NBR 9050. Leque e espiral são proibidos.</li>' +
    '<li><b>Rota acessível</b>: NBR 9050:2020.</li>' +
    '<li><b>Acesso a mezanino ou área privativa</b>: NBR 9077:2025, 9.5.9.1. Leque e espiral são permitidos, com condições.</li>' +
    '<li><b>Escada de casa</b>: segue o código de obras do município, que o app não conhece.</li></ul>' +
    '<p>Por isso o app tem os perfis Estudo, Rota de fuga, Mezanino ou área privativa e NBR 9050.</p>';
  h += '<p>A NBR 9077:2025 cancelou a edição de 2001. Os itens da edição de 2025 citados aqui foram conferidos no texto; os da edição de 2001 aparecem só como histórico ou como referência de estudo, sempre com o aviso de que ela foi cancelada. As regras da ' + PROB_PR + ' valem só no Paraná, e as da ' + PROB_GO + ' só em Goiás; ' + PROB_EST + '. Onde não achamos fonte, está escrito "' + PROB_SF + '". Perfil em uso: ' + (nm.nome || '') + '.</p>';
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
        const nc = R.olho ? 'olho' : 'pilar';
        h += '<p><b>A conta nesta escada:</b> ponta = raio do ' + nc + ' × ângulo do degrau em radianos = ' + f(hx.rc, 1) + ' × ' + f(th, 3) + ' = ' + f(ponta, 1) + ' cm. Com ' + hx.nPer + ' degraus por volta, o diâmetro mínimo do centro (pilar ou olho) seria Dmin = 2 × ponta desejada ÷ (2π ÷ ' + hx.nPer + '): ' + f(Math.ceil(D(15) * 10 - 1e-9) / 10, 1) + ' cm para ponta de 15 cm e ' + f(Math.ceil(D(7) * 10 - 1e-9) / 10, 1) + ' cm para ponta de 7 cm (arredondado para cima: é um mínimo). O ' + nc + ' atual tem ' + f(2 * hx.rc, 1) + ' cm de diâmetro.</p>';
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
