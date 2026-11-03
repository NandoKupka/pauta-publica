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

export function nextGuidance(p,next) {
  const status=normalize(p.details?.status),kind=p.details?.kind||p.kind;
  if(/transformad[oa] em norma/.test(status))return {action:'Conferir a publicação da norma',watch:'Procure o texto publicado e a data de início de vigência. A situação do projeto, sozinha, não informa quando cada regra começa a valer.',basis:'Situação oficial'};
  if(/^arquivad[oa]$/.test(status))return {action:'Conferir o motivo do arquivamento',watch:'O histórico oficial informa o motivo e eventuais atos posteriores. Não há continuação automática indicada por esse estado.',basis:'Situação oficial'};
  if(/aguardando apreciacao pelo senado/.test(status))return {action:'Acompanhar o recebimento e a análise no Senado',watch:'Procure a distribuição da matéria e os próximos atos na casa revisora. Uma sessão antiga da Câmara não confirma uma data de votação no Senado.',basis:'Situação oficial'};
  if(/aguardando sancao/.test(status))return {action:'Acompanhar a manifestação da Presidência',watch:'Procure o ato de sanção ou veto e a publicação correspondente. Ainda não é possível afirmar a vigência apenas com esse andamento.',basis:'Situação oficial'};
  if(/aguardando designacao de relator/.test(status))return {action:'Aguardar a escolha de quem fará a relatoria',watch:'O próximo registro a procurar é a designação do relator. Depois, acompanhe a apresentação de sua análise.',basis:'Situação oficial'};
  if(/aguardando parecer/.test(status))return {action:'Acompanhar a apresentação do parecer',watch:'O parecer expõe a recomendação do relator e pode sugerir mudanças. Confira depois o que o colegiado efetivamente decidiu.',basis:'Situação oficial'};
  if(p.provider==='stf')return {action:next?'Acompanhar a sessão e o resultado publicado':'Verificar nova pauta ou andamento do processo',watch:'Procure a ata e a decisão publicada. O julgamento pode ser adiado, suspenso ou continuar em outra sessão; o efeito depende do resultado oficial.',basis:next?'Sessão encontrada na agenda':'Orientação de acompanhamento'};
  if(next||/aguardando deliberacao|pronta para pauta|incluida em ordem do dia/.test(status))return {
    action:next?'Acompanhar a apreciação na sessão indicada':'Conferir a inclusão em uma sessão',
    watch:/^(REQ|RQS|RQN|RIC)$/.test(kind)?'Confira se o pedido foi aprovado e quais providências foram registradas para executá-lo. A aprovação se refere ao pedido descrito, não à adoção automática de uma política pública.':reportKinds.has(kind)?'Confira a decisão sobre o parecer e o encaminhamento da proposta principal. A recomendação do documento não substitui a decisão do colegiado.':'Confira o resultado do ato votado e o encaminhamento registrado depois da sessão. Pode haver emendas, adiamento ou análise de apenas uma etapa.',
    basis:next?'Sessão encontrada na agenda':'Situação oficial'
  };
  return {action:'Consultar o próximo andamento oficial',watch:'A coleta ainda não permite identificar um próximo ato específico. Consulte a ficha oficial; a ausência de data aqui não significa que a tramitação parou.',basis:'Etapa ainda não identificada'};
}

export function effectContext(p) {
  const status=normalize(p.details?.status),kind=p.details?.kind||p.kind;
  if(/transformad[oa] em norma/.test(status))return 'A fonte registra transformação em norma. Consulte o texto publicado para conferir o alcance e a vigência.';
  if(/^arquivad[oa]$/.test(status))return 'A fonte registra arquivamento. O objetivo descrito não representa uma mudança em vigor.';
  if(p.provider==='stf')return 'O resumo descreve a questão em análise. A decisão publicada é que define o resultado e seus efeitos.';
  if(kind==='MPV')return 'Medidas provisórias podem produzir efeitos antes da conclusão da análise legislativa. Confira a vigência na fonte oficial.';
  if(/^(REQ|RQS|RQN|RIC)$/.test(kind))return 'A aprovação vale para o pedido descrito. Não aprova automaticamente uma lei ou a política discutida na audiência.';
  if(reportKinds.has(kind))return 'O parecer recomenda um caminho. Ele não comprova a aprovação final da proposta.';
  return 'Este é o efeito proposto pelo texto. A presença na agenda ou a aprovação de uma etapa não comprova que a mudança já está valendo.';
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
