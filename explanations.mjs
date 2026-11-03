// Source-bound summaries. Any change in the supporting official text disables the summary until reviewed.
import { createHash } from 'node:crypto';
const explanations = {

  "camara-2643435": {
    "title": "Recursos extraordinários para desenvolvimento agrário e assistência social",
    "text": "A medida provisória prevê a abertura de cerca de R$ 925 milhões para os ministérios responsáveis pelo desenvolvimento agrário e pela assistência social. A destinação detalhada está no texto e nos anexos. Por ser uma MP, sua vigência deve ser conferida na publicação oficial.",
    "affected": "Órgãos e ações atendidos pelos recursos previstos na medida.",
    "fingerprint": "a92c5a82a1f5d5efb2ff73df56d64848a4b7daed1dfccf45f55a0979fc3466e1"
  },
  "camara-2642560": {
    "title": "Convidado para debate sobre orçamento da reciclagem",
    "text": "O requerimento pede a inclusão de um convidado em uma audiência sobre recursos para políticas de reciclagem no orçamento de 2027. Aprovar esse convite não destina dinheiro à atividade.",
    "affected": "Participantes da audiência e pessoas ligadas à reciclagem.",
    "fingerprint": "cfc07caf3e710955a23e6eb18f4f6ccadfb831a644f7671c6a0df37b203c9103"
  },
  "camara-2642836": {
    "title": "Debate sobre recursos para proteção de cães e gatos",
    "text": "O pedido é para realizar uma audiência sobre financiamento do ProPatinhas e fortalecimento do SinPatinhas no orçamento de 2027. A aprovação permite avançar na organização do debate; não aprova por si só verbas para os programas.",
    "affected": "Gestores dos programas e pessoas que atuam na proteção animal.",
    "fingerprint": "9a3a83de9a748e8470558ba0711878f2253eae1c24d6021d4a0a8ff6e23bfa43"
  },
  "camara-2645514": {
    "title": "Debate sobre orçamento das agências reguladoras",
    "text": "O requerimento pede uma audiência sobre os recursos das agências reguladoras e os efeitos dos bloqueios orçamentários em suas atividades. O debate pode orientar a discussão do orçamento de 2027, mas o pedido não altera o orçamento.",
    "affected": "Agências reguladoras e participantes do debate orçamentário.",
    "fingerprint": "dd9f910c273ab7b32e600ed659c0408377bc41821aa6087368e1f25a773ea28b"
  },
  "camara-2596596": {
    "title": "Destino das contribuições dos setores aéreo e portuário",
    "text": "A proposta muda regras sobre a destinação de contribuições sociais obrigatórias das empresas dos setores aéreo e portuário, incluindo as relativas ao trabalhador portuário avulso. A ementa não detalha como os recursos seriam repartidos.",
    "affected": "Empresas desses setores e instituições destinatárias das contribuições.",
    "fingerprint": "71f6927c36aab2783c3965578cc5120e5952344cb3e38342548abd6228877435"
  },
  "camara-2531613": {
    "title": "Dia Nacional da Consolidação da Independência",
    "text": "A proposta cria uma data no calendário nacional dedicada à consolidação da Independência do Brasil. A ementa descreve a instituição da data; não informa a criação de um feriado.",
    "affected": "Instituições e pessoas envolvidas em atividades de memória e celebração da Independência.",
    "fingerprint": "9ae3bcebe64ac8f809a07b68d92ae3e9fa11e39c1de5173120c9f90b13ba5e67"
  },
  "senado-173226": {
    "title": "Cursos e campanhas para apoiar a parentalidade positiva",
    "text": "A proposta inclui cursos, campanhas e palestras baseados em evidências científicas entre as ações de promoção da parentalidade positiva. A mudança trata das formas de orientação e apoio às famílias.",
    "affected": "Famílias e responsáveis pelas ações de apoio à parentalidade.",
    "fingerprint": "1bf1653d7de432db2c2250143ca852689d92ab5119e6319e2938fda5d4c57328"
  },
  "senado-171335": {
    "title": "Campanha Setembro em Flor sobre tumores ginecológicos",
    "text": "A proposta cria a campanha Setembro em Flor para conscientizar sobre tumores ginecológicos. A ementa informa a finalidade da campanha, sem detalhar novos serviços ou tratamentos.",
    "affected": "Público das ações de conscientização e responsáveis pela campanha.",
    "fingerprint": "4c04c092768e996ec3aaebc9fa4d2fad4ab750ac2a2c74e387a4b8966fb9c4c2"
  },
  "senado-102633": {
    "title": "Cooperação em defesa entre Brasil e Guiana",
    "text": "O projeto submete à aprovação legislativa um acordo de cooperação em defesa entre Brasil e Guiana. As atividades previstas e as condições de aplicação estão no texto do acordo.",
    "affected": "Governos e órgãos de defesa dos dois países.",
    "fingerprint": "c809aa1c20f77285843134f8f2f52bb34a2deb3ad421bd2dd5c4b2e721821152"
  },
  "senado-174513": {
    "title": "Cooperação espacial entre Brasil e Venezuela",
    "text": "O projeto trata da aprovação de um acordo entre Brasil e Venezuela para cooperação em ciência e tecnologia espacial. Projetos, responsabilidades e condições devem ser conferidos no acordo.",
    "affected": "Governos e instituições envolvidos na cooperação espacial.",
    "fingerprint": "389932803a4d0cfccefaafefa7ffead271f89d4f2f0b80a69430d4453aad3df0"
  },
  "camara-2399325": {
    "title": "Condições mais favoráveis ao empregado",
    "text": "A proposta altera a CLT e a lei do trabalho temporário para tratar do princípio da condição mais favorável ao empregado. Quais regras seriam modificadas e como se aplicariam depende do texto em análise.",
    "affected": "Empregados e empregadores, inclusive nas relações de trabalho temporário.",
    "fingerprint": "60d0248bc8cd321ba299ca194aa67d1307f393d6b835c7932e2b203d3e1ec63a"
  },
  "camara-2233100": {
    "title": "Regras para a denominação Cachaça Artesanal",
    "text": "A proposta cria a denominação Cachaça Artesanal e trata de sua produção, fiscalização e venda. Os critérios para usar essa denominação devem ser conferidos no projeto.",
    "affected": "Produtores, comerciantes, consumidores e órgãos de fiscalização.",
    "fingerprint": "19041739a1dcb90991f3fbb1160e527385bddf01d44b3a6e0c3bcb894318e6ec"
  },
  "camara-2415638": {
    "title": "Suspensão de licença de empresas da construção civil",
    "text": "A proposta trata da suspensão da licença de empresas da construção civil em casos de descumprimento de execuções judiciais e risco flagrante de falta de saúde financeira. Os requisitos e o procedimento dependem do texto em análise.",
    "affected": "Empresas da construção civil e pessoas envolvidas nas execuções judiciais.",
    "fingerprint": "313366ef284afb49ea97ce48760beb9908ecd56531c41b501f1afa0a04805d2f"
  },
  "camara-2484301": {
    "title": "Uso de marca após utilização prolongada sem oposição",
    "text": "A proposta permite o direito de uso de uma marca após utilização prolongada sem oposição. Os prazos, requisitos e limites dessa possibilidade precisam ser conferidos no texto do projeto.",
    "affected": "Pessoas e empresas que usam marcas e titulares de direitos sobre elas.",
    "fingerprint": "f693af69144e6c5578fe0832c3f9d223a502309cba3525bb24129fd6f7d5b9ed"
  },
  "camara-2486602": {
    "title": "Alerta sobre empresas na lista de trabalho escravo",
    "text": "A proposta cria um selo de alerta para empresas que constam na Lista Suja do trabalho análogo à escravidão. As regras de exibição e aplicação do selo estão no texto em análise.",
    "affected": "Empresas incluídas na lista e pessoas que contratam ou compram delas.",
    "fingerprint": "d6e69d0e8dc0d00ed5bc97121d562581540cb82bf19d32916d33ec27d9624cfe"
  },
  "camara-2498417": {
    "title": "Proibição de venda de animais em pet shops e lojas",
    "text": "A proposta proíbe a venda de animais em pet shops e lojas e busca incentivar a adoção. O alcance da proibição e as condições de aplicação dependem do texto aprovado.",
    "affected": "Lojas, pet shops e pessoas interessadas em adquirir ou adotar animais.",
    "fingerprint": "368f7bf00791a3169fd642e8c851ec3292d479dea3947fa8c2cdae60d075282e"
  },
  "camara-2539033": {
    "title": "Regras ambientais para produtos de higiene pessoal",
    "text": "A proposta estabelece normas para fabricar, importar, vender e rotular produtos de higiene pessoal, com objetivos de proteção ambiental, saúde pública e funcionamento do esgoto. A ementa não identifica todos os produtos e exigências.",
    "affected": "Fabricantes, importadores, comerciantes e consumidores de produtos de higiene pessoal.",
    "fingerprint": "e908fa84fb5cc04a969b8f04c658545173146bbf559ef8573ed758928db8343e"
  },
  "camara-2555233": {
    "title": "Proteção de créditos trabalhistas em falências",
    "text": "A proposta muda regras de representação e proteção dos valores devidos aos trabalhadores em processos de recuperação judicial e falência. O texto em análise define quais garantias seriam alteradas.",
    "affected": "Trabalhadores com valores a receber e empresas em recuperação judicial ou falência.",
    "fingerprint": "b7c637d471d017564ade2f1a2c41f4d3b66bb5e0584475e362d356f742567761"
  },
  "camara-2567594": {
    "title": "Participação de menores de idade como sócios",
    "text": "A proposta proíbe que menores de 18 anos sejam sócios de sociedades empresárias, sociedades simples ou cooperativas. As condições de aplicação e eventuais regras de transição devem ser conferidas no projeto.",
    "affected": "Menores de idade, seus responsáveis e as sociedades envolvidas.",
    "fingerprint": "9ac33772ade67a0aa28ca90a87200001c21fdc56c723cda5c6817f2679769921"
  },
  "camara-2568030": {
    "title": "Estoques de grãos na recuperação judicial",
    "text": "A proposta trata da classificação dos estoques de grãos como essenciais no contexto da recuperação judicial. A ementa não informa todos os efeitos dessa classificação sobre a venda ou utilização dos estoques.",
    "affected": "Empresas em recuperação judicial que mantêm estoques de grãos e seus credores.",
    "fingerprint": "26e1c4c4ba8b35073e65dc864700b8554bb8078ffc53c03035d0581f546c6446"
  },
  "camara-2573869": {
    "title": "Regras para parcerias de profissionais autônomos",
    "text": "A proposta cria uma política nacional para regulamentar parcerias autônomas entre profissionais e estabelecimentos de serviços. Os direitos, deveres e critérios para essas parcerias dependem do texto em análise.",
    "affected": "Profissionais autônomos e estabelecimentos que firmam essas parcerias.",
    "fingerprint": "7026f32d039189ac14798c01e0e6dc57fa5bf06f04070a80a58d67c8a0f5c2d3"
  },
  "camara-2602554": {
    "title": "Relações entre plataformas de venda e lojistas parceiros",
    "text": "A proposta estabelece regras para a relação entre plataformas de comércio eletrônico e vendedores parceiros. Prevê transparência, prazo antes de mudanças contratuais e proibição de práticas abusivas. Os detalhes dependem do texto aprovado.",
    "affected": "Plataformas de comércio eletrônico e vendedores que usam seus serviços.",
    "fingerprint": "78e62a6be27b83a2b15cfb5b13917a979621ddfddf5f401708ca8601c0d6133f"
  },
  "camara-2355896": {
    "title": "Pena maior para quem atribui crime de drogas a inocente",
    "text": "A proposta aumenta a pena quando um crime da Lei de Drogas envolve fraude ou outro artifício para responsabilizar uma pessoa inocente. Também trata da aplicação conjunta de causas de aumento de pena. O alcance depende do texto aprovado.",
    "affected": "Pessoas envolvidas nesses processos e órgãos responsáveis pela aplicação da lei.",
    "fingerprint": "155ce78170edc731269e1813a6ce1bdc231d0a46a257884a7f50450b1d034f05"
  },
  "camara-2482618": {
    "title": "Câmeras e reconhecimento facial na busca de desaparecidos",
    "text": "A proposta incorpora câmeras de segurança e reconhecimento facial à Política Nacional de Busca de Pessoas Desaparecidas. As condições de uso dessas tecnologias e as demais medidas precisam ser conferidas no projeto.",
    "affected": "Pessoas desaparecidas, suas famílias e órgãos responsáveis pelas buscas.",
    "fingerprint": "1cc8a1b0d060d4160497b11b977cd8457bfaf5a90a48946cbeb1d4e6ac1430dd"
  }
,

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
