// Source-bound summaries. Any change in the supporting official text disables the summary until reviewed.
import { createHash } from 'node:crypto';
const explanations = {

  "camara-2647144": {
    "title": "Pedido de explicações sobre medicamento para acondroplasia no SUS",
    "text": "O requerimento pede ao Ministério da Saúde informações sobre a decisão de não incluir a vosoritida no SUS para tratar acondroplasia. Também pede os motivos da rejeição dos recursos apresentados. A aprovação do pedido não inclui o medicamento no SUS.",
    "fingerprint": "c0979cce8e186f02c30662549d7811495ee10ffc092aa4610830d39de9ce9a03"
  },
  "camara-2333814": {
    "title": "Auxílio a responsáveis por pessoas com deficiência",
    "text": "A proposta prevê auxílio mensal de um salário mínimo a pais ou responsáveis nas situações de deficiência e doença rara descritas no texto, com limite de renda familiar por pessoa. Também propõe passe livre interestadual para responsáveis de baixa renda. As condições dependem do texto aprovado.",
    "fingerprint": "79d80b27664a1616004bd2d20a98a4a49400fbe2fb5ef2c276cc3269f037f6ed"
  },
  "camara-2599601": {
    "title": "Acessibilidade nos totens de autoatendimento",
    "text": "A proposta quer tornar obrigatória a acessibilidade plena nos totens de autoatendimento de estabelecimentos públicos e privados. Os requisitos e a forma de aplicação devem ser conferidos no texto em análise.",
    "fingerprint": "05315c04bfd28c1928ec77a2997fcf445863ac37edb5c7936fe1b8e2fa2b26a7"
  },
  "camara-2599713": {
    "title": "Inclusão de idosos com deficiência no esporte",
    "text": "A proposta estabelece diretrizes para incluir idosos com deficiência física em atividades esportivas. A ementa informa o objetivo geral; as ações previstas precisam ser conferidas no texto do projeto.",
    "fingerprint": "b98e22c6c1d215d50ff936303ef450e6bbacae27a5b3e029f8966ef344848785"
  },
  "camara-2601056": {
    "title": "Recursos digitais no apoio escolar a alunos autistas",
    "text": "A proposta trata do uso de computadores, tablets e celulares por terapeutas nas escolas para apoiar estudantes com transtorno do espectro autista. As condições de uso dependem do texto em análise.",
    "fingerprint": "a9a289e5191a3a66d5a1341435425c54f18345d2fb8b74691c4e8de390e1de77"
  },
  "camara-2611932": {
    "title": "Credencial de estacionamento sem prazo de validade",
    "text": "A proposta quer que a credencial de estacionamento tenha validade por prazo indeterminado para pessoas com deficiência e comprometimento permanente da mobilidade. A mudança ainda depende da tramitação.",
    "fingerprint": "b4d0968636ecdc1094d0cb991c5d3e6a8b350cc7220be09ef8ebd27d3ce847ce"
  },
  "camara-2614899": {
    "title": "Símbolos de deficiência nos documentos de identidade",
    "text": "A proposta quer tornar obrigatória a inclusão do Símbolo Internacional de Acessibilidade e de outros símbolos de identificação de deficiências nos documentos oficiais de identidade. As condições dependem do texto aprovado.",
    "fingerprint": "a59437f44de5f0f2bb1f787b9acb66ad0cfdbdaf5c410a1088168f55b8cddeff"
  },
  "camara-2620547": {
    "title": "Incentivos fiscais para tecnologias assistivas",
    "text": "A proposta prevê incentivos fiscais para empresas que desenvolvem tecnologias assistivas. A ementa não detalha quais incentivos seriam concedidos; é preciso consultar o texto para conhecer as condições.",
    "fingerprint": "6da66bed7662f5c392c3b19645caddaa227e8d471307b88b4acf66b13082f1f2"
  },
  "camara-2627936": {
    "title": "Apoio a famílias e a pessoas que precisam de cuidados permanentes",
    "text": "A proposta cria uma política de apoio e proteção às famílias atípicas e um auxílio para pessoas com autismo e outras deficiências que demandem cuidados permanentes. Valores, requisitos e aplicação dependem do texto em análise.",
    "fingerprint": "7591d2b5aa6b71d804dc43a3f172aff6df05bbcc893c968818288dea09bac708"
  },
  "camara-2629982": {
    "title": "Informações do cadastro nacional de pessoas com deficiência",
    "text": "A proposta altera o Estatuto da Pessoa com Deficiência para tratar das informações do Cadastro-Inclusão. A ementa não especifica todas as mudanças nos dados do cadastro; esses detalhes estão no texto do projeto.",
    "fingerprint": "fdfc35d9f47a1e867545e143c0aed7b6da93f442474e66a5178cf849fa2ee1e9"
  },
  "camara-2204495": {
    "title": "Criação do Dia Nacional do Autocuidado",
    "text": "A proposta inclui o Dia Nacional do Autocuidado no calendário nacional. O objeto descrito na ementa é a criação dessa data.",
    "fingerprint": "fef67f4ec34c5ebb9fba56f03c09f42723512af37b677954c1166fa2f80b69e8"
  },
  "camara-2647427": {
    "title": "Monitoração eletrônica para proteção de vítimas de violência",
    "text": "A proposta muda a Lei Maria da Penha para estabelecer garantias na monitoração eletrônica usada como medida protetiva. Trata de alertas sonoros e luminosos, de um mecanismo excepcional de contenção física remota e da proteção da vítima. As condições precisam ser conferidas no texto em análise.",
    "fingerprint": "b944c874610cdd4e1dcb94a8d14b903a4abbe8a1cf2f103c56656e4597b862f7"
  }
,
  "stf-adpf-1212": {
    "title": "Loterias e apostas criadas por municípios",
    "text": "O processo discute se prefeituras podem criar e explorar loterias próprias. A decisão pode afetar as leis municipais que autorizam essas atividades e a atuação das empresas que operam com essas autorizações.",
    "fingerprint": "f4031f8503a42dec5185ff2d81b862a7e548d4929af203e8949703985da1ae4e"
  },
  "stf-adi-2039": {
    "title": "Regras do Ministério Público do Rio Grande do Sul",
    "text": "A ação questiona regras estaduais sobre a organização do Ministério Público. O STF analisa se os dispositivos contestados respeitam a divisão de atribuições entre os poderes e o que cabe à União legislar. A eventual mudança depende de quais dispositivos forem mantidos ou invalidados.",
    "fingerprint": "cc5818ec42b3d57348820ef0611c1ff1d85f0e9e1f5921caea1582d3001a9516"
  },
  "stf-re-1093553": {
    "title": "Crime de ato obsceno em local público",
    "text": "O recurso discute se a regra do Código Penal que trata do ato obsceno em local público é compatível com a Constituição. O resultado pode afetar a aplicação dessa regra; o alcance depende do que o tribunal decidir.",
    "fingerprint": "9d8ae1d0c00b3243f67d7c476670804c38a2e1357750c9109d2c2184b9c84a76"
  },
  "stf-ap-618": {
    "title": "Recurso em ação penal por crime ambiental",
    "text": "Nesta etapa, o STF analisa se um recurso contra um julgamento anterior cumpre os requisitos para ser examinado. Aceitar o recurso para análise não é, por si só, mudar o resultado da ação penal.",
    "fingerprint": "807037d3478a133ec9476fb7408032b481d41ae357172ad6838ecedbbf1a97c3"
  },
  "stf-adpf-1183": {
    "title": "Acordos para resolver conflitos na administração pública",
    "text": "A ação questiona uma norma do Tribunal de Contas da União que criou procedimentos para buscar acordos em conflitos da administração federal. O julgamento pode afetar a validade desses procedimentos e os limites de atuação do TCU.",
    "fingerprint": "4fef1e0323fa3c0c09d7334c77d4a6dbd5c2ba1032199cd04ba01c90bd249ed6"
  },
  "senado-172997": {
    "title": "PEC da Segurança Pública",
    "text": "A proposta reúne mudanças na segurança pública, como atribuições dos órgãos policiais, cooperação entre governos e financiamento do setor. Também trata de regras penais e de execução de penas. O conteúdo pode mudar com as emendas; o efeito final depende do texto que concluir a tramitação.",
    "fingerprint": "122e1b7f4bc53e4307cc66ed5e28b398929ebe9bcef0b01fd27748e73f413e63"
  },
  "senado-174386": {
    "title": "Jornada de trabalho e fim da escala 6×1",
    "text": "O texto propõe reduzir o limite semanal de trabalho e prever dois dias de descanso remunerado por semana, sem redução de salário. A mudança é proposta para a Constituição; as regras e os prazos de aplicação dependem do texto aprovado e publicado.",
    "fingerprint": "c1e6e6fc7e82268af2c420185a509c75f926199375c8095d2602a0a1da67b3ea"
  },
  "senado-174061": {
    "title": "Estatuto do Aprendiz",
    "text": "A proposta cria um estatuto para a aprendizagem profissional e altera regras da legislação trabalhista e de outras leis. Pode mudar a forma como a contratação de aprendizes é organizada. Os detalhes dependem do texto e das emendas em análise.",
    "fingerprint": "582c1c786c7115822f57db1b738aafa6dffac3521aef519d5cf8274ffb22b262"
  },
  "camara-2649688": {
    "title": "Debate sobre impostos e fiscalização das bets",
    "text": "O pedido é para realizar uma audiência pública sobre impostos, movimentações financeiras e prevenção à lavagem de dinheiro nas plataformas de apostas. Se aprovado, o passo é organizar esse debate. O requerimento não cria, por si só, um novo imposto nem uma nova regra para as apostas.",
    "fingerprint": "8761de070e246c8c102a0d5a22e25928b95fdb09a60be09b1071906349de4ffd"
  },
  "camara-2620905": {
    "title": "Proteção a mulheres entre países do Mercosul",
    "text": "O projeto trata de um acordo para que medidas de proteção a mulheres em situação de violência sejam reconhecidas entre os países participantes. O objetivo é permitir esse reconhecimento além das fronteiras. A aprovação de um requerimento durante a tramitação não equivale à entrada em vigor do acordo.",
    "fingerprint": "e592adc9b8355136454bdb9cbed6f87961aba9c2cdba8e2a44344c1b4d83f942"
  },
  "camara-2487836": {
    "title": "Exames feitos na rede privada aceitos pelo SUS",
    "text": "A proposta quer que unidades do SUS aceitem exames realizados em serviços privados. Isso pode permitir o uso desses resultados no atendimento público, conforme as regras do texto que for aprovado.",
    "fingerprint": "4efce5166d434fa641c1e57351579b61f00e1f5343f8ac359cf4af394c2e49e7"
  },
  "camara-2410357": {
    "title": "Uso de drones no espaço aéreo de presídios",
    "text": "A proposta muda o Código Penal para tratar do uso de drones no espaço aéreo de presídios. O resumo oficial não detalha todas as condições e consequências da mudança; elas devem ser conferidas no texto em análise.",
    "fingerprint": "1b1582a1c477e3ef215ff664bccfdba5d22598ba8a78efd340b4464b154dc87d"
  }
};
export function explanationFor(p) {
  const entry=explanations[p.id],d=p.details;
  if(!entry||!d)return null;
  const fingerprint=createHash('sha256').update(JSON.stringify([d.summary||'',d.question||'',d.keywords||''])).digest('hex');
  return fingerprint===entry.fingerprint?entry:null;
}
