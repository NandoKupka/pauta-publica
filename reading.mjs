import { nextStage, normalize, reportKinds } from './pautas.mjs';

// Presentation rules describe the recorded stage, never infer a final outcome.
export function stageSummary(p) {
  const original=p.details?.status||'',s=normalize(original);
  const rules=[
    [/transformad[oa] em norma/,'Transformada em norma','A fonte registra a transformação em norma. O texto oficial informa o alcance e quando as regras valem.'],
    [/aguardando apreciacao pelo senado/,'Aguarda análise no Senado','A Câmara informa que a proposta aguarda análise do Senado.'],
    [/aguardando sancao/,'Aguarda decisão da Presidência','O texto aguarda sanção. A manifestação da Presidência é o próximo ato a acompanhar.'],
    [/aguardando designacao de relator/,'Aguarda escolha de relator','Falta definir quem analisará a proposta e apresentará um parecer.'],
    [/aguardando parecer/,'Aguarda análise do relator','O parecer é uma análise que orienta a discussão. Ele não é a decisão final.'],
    [/aguardando deliberacao/,'Aguarda decisão nesta etapa','O órgão responsável ainda precisa deliberar. Isso não confirma a aprovação final da proposta.'],
    [/processo incluido em pauta/,'Julgamento previsto','O processo foi incluído na pauta. A sessão pode ser alterada ou terminar sem decisão.'],
    [/^arquivad[oa]$/,'Arquivada','A fonte registra o arquivamento. Consulte o histórico para saber o motivo.']
  ];
  const match=rules.find(([pattern])=>pattern.test(s));
  return match?{label:match[1],text:match[2],original}:{label:original||'Etapa ainda não informada',text:original?'Situação registrada pela instituição. Consulte o histórico e os próximos passos.':'Há um registro de agenda ou votação, mas a situação atual ainda não foi informada nesta coleta.',original};
}

export function kindGuide(p) {
  const kind=p.details?.kind||p.kind;
  if(reportKinds.has(kind))return {label:'Parecer',text:'Análise e recomendação sobre uma proposta. Um parecer favorável não significa aprovação final.'};
  if(p.provider==='stf')return {label:'Processo no STF',text:'O tribunal analisa uma questão judicial. A inclusão na pauta indica uma oportunidade de julgamento, sem garantir uma decisão nessa sessão.'};
  if(/^(REQ|RQS|RQN|RIC)$/.test(kind))return {label:'Requerimento',text:'Pedido feito no trabalho legislativo, como uma audiência ou solicitação de informações. Aprovar o pedido não cria, por si só, uma lei.'};
  const guides={
    PL:['Projeto de lei','Proposta para criar ou mudar uma lei. A tramitação reúne análises e decisões; constar na agenda não significa que a regra já vale.'],
    PLP:['Projeto de lei complementar','Proposta de lei para matérias que a Constituição reserva a esse tipo de norma. Ainda depende das etapas de análise e aprovação.'],
    PEC:['Mudança na Constituição','Proposta de emenda à Constituição. Precisa da aprovação do mesmo texto pela Câmara e pelo Senado antes da promulgação.'],
    MPV:['Medida provisória','Ato editado pela Presidência com força de lei, submetido à análise do Congresso. Consulte o texto oficial para verificar sua vigência.'],
    PDL:['Projeto de decreto legislativo','Proposta sobre uma atribuição do Poder Legislativo. O efeito depende do ato descrito e da conclusão da tramitação.']
  };
  const guide=guides[kind];
  return guide?{label:guide[0],text:guide[1]}:{label:p.details?.typeName||'Matéria legislativa',text:'Consulte o texto e a etapa registrada para entender o que está sendo analisado.'};
}

export function decisionFor(p,next) {
  const d=p.details??{};
  return nextStage(p)?.who||(next?.org==='camara'&&next.body?next.body:next?.decisionMaker)||d.decisionBody||'Colegiado ainda não identificado nesta coleta';
}

export function milestoneTitle(item) {
  const titles={
    'Apresentação de Proposição':'Proposta apresentada',
    'Designação de Relator(a)':'Relator escolhido',
    'Parecer do(a) Relator(a)':'Parecer do relator apresentado',
    'Abertura de Prazo':'Prazo aberto para sugestões de mudança',
    'Encerramento de Prazo':'Prazo encerrado',
    'Distribuição':'Encaminhamento para análise',
    'Expedição de Documento':'Documento enviado ou registrado',
    'Recebimento':'Recebimento pela unidade responsável',
    'Publicação de Proposição':'Proposta publicada'
  };
  // Qualify ambiguous events using their text instead of inventing a milestone.
  if(item.title==='Abertura de Prazo'&&!/emenda/i.test(item.body||''))return item.title;
  return titles[item.title]||item.title||'Movimentação publicada';
}
