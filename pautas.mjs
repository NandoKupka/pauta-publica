import { createHash } from 'node:crypto';
import { plain, official, day } from './sources.mjs';
import { explanationFor } from './explanations.mjs';

const numeric=value=>/^\d+$/.test(String(value??''))?String(value):'';
export const normalize=value=>String(value??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
export const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const pautaPath=id=>'/pauta/'+encodeURIComponent(id);
export const reportKinds=new Set(['PRL','PAR','RLP','RRL']);
export function camSubject(p) {
  const key=numeric(p.id)||numeric(p.uri?.match(/\/proposicoes\/(\d+)$/)?.[1]);
  if(!key)return null;
  return {id:'camara-'+key,provider:'camara',key,org:'camara',reference:plain([p.siglaTipo,p.numero?p.numero+(p.ano?'/'+p.ano:''):''].filter(Boolean).join(' '))||'Proposta '+key,
    kind:p.siglaTipo||'',summary:plain(p.ementa),url:'https://www.camara.leg.br/propostas-legislativas/'+key};
}
export function senateSubject(item,org='senado') {
  const p=item.materiaLegislativa??{},key=numeric(p.codMateria||item.codMateria);
  if(!key)return null;
  return {id:'senado-'+key,provider:'senado',key,org,reference:plain(p.identificacao||item.identificacao)||'Matéria '+key,
    kind:p.siglaIdentificacao||'',title:plain(p.apelido||item.cabecalho),summary:plain(p.ementa||item.ementa),
    explanation:plain(p.explicacaoEmenta),processId:numeric(p.idProcesso),stageNote:plain(item.apreciacao),rapporteurNote:plain(item.rodape),
    url:'https://www25.senado.leg.br/web/atividade/materias/-/materia/'+key};
}
export function stfSubject(p) {
  const type=String(p.classe??'').trim().toUpperCase(),key=numeric(p.numero);
  if(!/^[A-Z]{2,10}$/.test(type)||!key)return null;
  return {id:'stf-'+type.toLowerCase()+'-'+key,provider:'stf',key,org:'stf',kind:type,apiClass:String(p.classe).trim(),reference:type+' '+key,
    summary:plain(p.resumoTema),rapporteur:plain(p.relator),themeId:numeric(p.idInformacaoPautaProcesso),
    url:'https://portal.stf.jus.br/processos/listarProcessos.asp?classe='+encodeURIComponent(String(p.classe).trim())+'&numeroProcesso='+key};
}
const entries=snapshot=>Object.values(snapshot.jobs??{}).flatMap(job=>job.entries??[]);
const compact=row=>({date:row.date,endDate:row.endDate,time:row.time,status:row.status,items:row.items,ballots:row.ballots});
function recordChange(old,row,at) {
  if(old?.dataShape!==row.dataShape)return [];
  if(!old||digest(compact(old))===digest(compact(row)))return [];
  const changes=[];
  if(old.date!==row.date||old.time!==row.time||old.endDate!==row.endDate)changes.push({field:'agenda',before:[old.date,old.time,old.endDate].filter(Boolean).join(' · '),after:[row.date,row.time,row.endDate].filter(Boolean).join(' · ')});
  if(old.status!==row.status)changes.push({field:'situação da sessão ou votação',before:old.status,after:row.status});
  if(digest(old.items??[])!==digest(row.items??[]))changes.push({field:'lista de assuntos da sessão',before:(old.items?.length??0)+' itens',after:(row.items?.length??0)+' itens'});
  if(digest(old.ballots??[])!==digest(row.ballots??[]))changes.push({field:'registros individuais',before:(old.ballots?.length??0)+' registros',after:(row.ballots?.length??0)+' registros'});
  return changes.map(change=>({...change,at,recordId:row.id,url:row.url}));
}
// Stable official identifiers link a subject to records. A matching title is never enough.
export function syncPautas(previous,snapshot) {
  const archive={...(previous.archive??{})},pautas=structuredClone(previous.pautas??{});
  for(const row of entries(previous).filter(row=>row.type==='agenda'||row.type==='votacoes'))archive[row.id]??=row;
  for(const row of entries(snapshot).filter(row=>row.type==='agenda'||row.type==='votacoes')) {
    const old=archive[row.id],changes=recordChange(old,row,snapshot.checkedAt);
    archive[row.id]={...row,firstSeen:old?.firstSeen||snapshot.checkedAt};
    for(const subject of [...(row.subjects??[]),...(row.documents??[])]) {
      const prior=pautas[subject.id]??{};
      const defined=Object.fromEntries(Object.entries(subject).filter(([,value])=>value!==''&&value!=null));
      pautas[subject.id]={...prior,...defined,orgs:[...new Set([...(prior.orgs??[]),subject.org])],
        recordIds:[...new Set([...(prior.recordIds??[]),row.id])],
        firstSeen:prior.firstSeen||snapshot.checkedAt,lastSeen:snapshot.checkedAt,details:prior.details,
        changes:[...(prior.changes??[]),...changes]};
    }
    for(const subject of old?.subjects??[])if(![...(row.subjects??[]),...(row.documents??[])].some(s=>s.id===subject.id)&&pautas[subject.id]){
      pautas[subject.id].changes.push({at:snapshot.checkedAt,field:'presença na pauta da sessão',before:'Listada',after:'Não retornou na lista atual; isso não confirma retirada ou decisão.',recordId:row.id,url:row.url});
    }
  }
  return {...snapshot,archive,pautas};
}
export function relatedRecords(pauta,snapshot) {
  const live=new Map(entries(snapshot).map(row=>[row.id,row]));
  const archive={...(snapshot.archive??{}),...Object.fromEntries(live)};
  const belongs=p=>p.id===pauta.id||snapshot.pautas?.[p.id]?.parentId===pauta.id;
  return Object.values(archive).filter(row=>pauta.recordIds?.includes(row.id)||row.subjects?.some(belongs)).map(row=>({...row,current:[...(live.get(row.id)?.subjects??[]),...(live.get(row.id)?.documents??[])].some(belongs)}));
}
export function primaryPautas(snapshot) {return Object.values(snapshot.pautas??{}).filter(p=>!p.parentId||!snapshot.pautas[p.parentId]);}
export function upcomingRecords(pauta,snapshot,today=day()) {
  return relatedRecords(pauta,snapshot).filter(row=>row.type==='agenda'&&row.current&&(row.endDate||row.date)>=today&&!/cancelad|encerrad|realizad|transferid/i.test(row.status))
    .sort((a,b)=>a.date.localeCompare(b.date)||(a.time??'').localeCompare(b.time??''));
}
const themes=[
 ['Apostas e loterias',/aposta|loteria|\bbets?\b|\bbingos?\b/,'bet bets jogos apostas loterias'],
 ['Educação',/educa|escola|professor|ensino|estudant|estudante/,'educacao escola ensino'],
 ['Saúde',/saude|hospital|medicament|enferm|medic[ao]|sanitari/,'saude hospital remedio'],
 ['Segurança e justiça',/seguranca publica|polici|penal|crime|violencia|prisao/,'seguranca violencia justica'],
 ['Economia e impostos',/tribut|imposto|fiscal|economi|orcament|financeir|credito/,'economia impostos tributos'],
 ['Trabalho e renda',/trabalh|previdenc|aposenta|salari|emprego/,'trabalho renda aposentadoria'],
 ['Ambiente e cidades',/ambient|florest|clima|saneamento|moradia|urban|transporte/,'ambiente cidades clima'],
 ['Direitos e cidadania',/direito|cidad|igualdade|discrimin|deficiencia|crianca|mulher/,'direitos cidadania']
];
export function topicText(p) {const explanation=explanationFor(p);return [p.reference,p.title,p.summary,p.explanation,p.details?.summary,p.details?.explanation,p.details?.keywords,p.details?.title,p.details?.themes?.join(' '),explanation?.title,explanation?.text].filter(Boolean).join(' ');}
export function topicThemes(p) {const text=normalize(topicText(p));return themes.filter(([,pattern])=>pattern.test(text)).map(([title])=>title);}
export function searchText(p) {
  const text=normalize(topicText(p));
  return text+' '+themes.filter(([,pattern])=>pattern.test(text)).map(([, ,terms])=>terms).join(' ');
}
export function matchesSearch(text,words) {
  const normalized=normalize(text),exact=new Set(['bet','bets','pec','pl','plp','pdl','mpv','sus','mei','stf','stj','tse']);
  return words.every(word=>exact.has(word)?new RegExp('\\b'+word+'\\b').test(normalized):normalized.includes(word));
}
export function topicTitle(p) {const text=explanationFor(p)?.title||p.details?.title||p.title||p.details?.summary||p.summary||p.reference;return text===text.toUpperCase()?text.charAt(0)+text.slice(1).toLowerCase():text;}
export function brief(p) {
  const d=p.details??{},summary=d.explanation||p.explanation||d.summary||p.summary||'';
  const kind=d.kind||p.kind;
  if(reportKinds.has(kind))return {lead:'Este documento apresenta uma análise ou recomendação sobre uma proposta. Um parecer favorável ou contrário não equivale, por si só, ao resultado final da tramitação.',text:summary,label:'Análise registrada no documento'};
  if(/transformad[oa] em norma/i.test(d.status??''))return {lead:'A fonte registra que esta proposta foi transformada em norma jurídica. O texto abaixo descreve seu objetivo; consulte a publicação oficial para conhecer as regras e quando passam a valer.',text:summary,label:'Objetivo informado pela fonte'};
  const editorial=explanationFor(p);
  if(editorial)return {lead:editorial.text,text:p.provider==='stf'?d.question||summary:summary,label:p.provider==='stf'?'Questão apresentada pelo STF':'Texto de referência',editorial:true};
  if(p.provider==='stf')return {lead:'Este processo leva uma questão ao STF. O alcance de uma eventual mudança depende do que for decidido e publicado.',text:d.question||summary,label:d.question?'Questão apresentada pelo STF':'Contexto informado na pauta'};
  const request=/^(REQ|RQS|RQN|RIC)$/.test(kind);
  const lead=request?'Este é um pedido dentro do trabalho legislativo. Sua aprovação diz respeito ao pedido descrito abaixo; por si só, não cria uma lei.':kind==='PEC'?'Esta proposta busca mudar a Constituição. Estar na pauta ou ter um parecer favorável não significa que a mudança já foi aprovada.':kind==='MPV'?'Esta é uma medida provisória. Sua presença na pauta não significa que esteja aguardando para produzir qualquer efeito: o alcance e a vigência dependem do texto publicado e das decisões posteriores.':'A proposta busca alterar ou estabelecer o que está descrito abaixo. O texto ainda pode mudar durante a análise; um voto isolado não confirma que a medida passou a valer.';
  const verbs=[[/^Altera\b/i,'Mudar'],[/^Dispõe sobre\b/i,'Definir regras sobre'],[/^Institui\b/i,'Criar'],[/^Estabelece\b/i,'Estabelecer'],[/^Autoriza\b/i,'Autorizar'],[/^Acrescenta\b/i,'Acrescentar'],[/^Revoga\b/i,'Revogar'],[/^Aprova\b/i,'Aprovar'],[/^Requer\b/i,'Solicitar']];
  let text=summary;
  for(const [pattern,replacement]of verbs)if(pattern.test(text)){text=text.replace(pattern,replacement);break;}
  return {lead,text,label:d.explanation||p.explanation?'Explicação publicada pela instituição':'Objetivo do texto em análise'};
}
export function nextStage(p) {
  const status=normalize(p.details?.status);
  if(/aguardando apreciacao pelo senado/.test(status))return {who:'Senado Federal',text:'A Câmara informa que a proposta aguarda análise do Senado. A data dessa etapa ainda precisa ser confirmada na agenda da casa revisora.'};
  if(/aguardando sancao/.test(status))return {who:'Presidência da República',text:'A fonte informa que o texto aguarda sanção. O próximo registro a acompanhar é a manifestação da Presidência da República.'};
  if(/transformad[oa] em norma/.test(status))return {text:'A fonte registra a transformação em norma jurídica. Consulte a publicação oficial para verificar seu alcance e sua vigência.'};
  if(/aguardando designacao de relator/.test(status))return {text:'A situação registrada indica que falta definir quem fará a relatoria da proposta.'};
  if(/aguardando parecer/.test(status))return {text:'A situação registrada indica que a proposta aguarda um parecer, a análise que orienta a discussão do texto.'};
  return null;
}
export function safeReturn(value) {
  if(!value)return '/?aba=pautas#painel';
  try{const u=new URL(value,'http://local');if(u.origin!=='http://local'||u.pathname!=='/')return '/?aba=pautas#painel';return '/'+u.search+'#painel';}catch{return '/?aba=pautas#painel';}
}
