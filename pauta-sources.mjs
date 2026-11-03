import { asList, plain, official } from './sources.mjs';
import { safeError } from './data-quality.mjs';
import { digest } from './pautas.mjs';

const cam='https://dadosabertos.camara.leg.br/api/v2/proposicoes/';
const sen='https://legis.senado.leg.br/dadosabertos/';
const stf='https://portal.stf.jus.br/pauta/services/tema-service.asp?';
const list=value=>{if(!Array.isArray(value))throw new Error('Lista oficial ausente');return value;};
const lines=html=>String(html??'').split(/(?:<br\s*\/?\s*>\s*){1,}|\r?\n/i).map(plain).filter(Boolean);
const iso=value=>/^(\d{2})\/(\d{2})\/(\d{4})/.test(value??'')?value.slice(0,10).split('/').reverse().join('-'):value?.slice(0,10);
async function fullList(url,get) {
  const first=new URL(url),seen=new Set(),rows=[];
  while(url){
    const current=new URL(url);
    if(current.origin!==first.origin||current.pathname!==first.pathname||seen.has(url)||seen.size>=100)throw new Error('Paginação incompleta');
    seen.add(url);const data=await get(url,true);rows.push(...list(data?.dados));
    const next=data.links?.find(link=>link.rel==='next')?.href;url=next?new URL(next,current).href:null;
  }
  return rows;
}
async function part(old,label,url,at,run) {
  try{return {label,url,at,checkedAt:at,ok:true,data:await run()};}
  catch(error){return {label,url,at:old?.at??null,checkedAt:at,ok:false,error:safeError(error),data:old?.data??null};}
}
function senData(p) {
  if(!p?.id||!p.conteudo)throw new Error('Processo em formato inesperado');
  const proceedings=asList(p.autuacoes);
  return {summary:plain(p.conteudo.ementa),explanation:plain(p.conteudo.explicacaoEmenta),title:plain(p.apelido),kind:p.sigla,
    keywords:plain(p.documento?.indexacao),themes:asList(p.classificacoes).map(c=>plain(c.descricao)),
    status:plain(p.situacaoAtual),statusAt:p.dataSituacaoAtual,authors:asList(p.autoriaIniciativa?.length?p.autoriaIniciativa:p.documento?.autoria).map(a=>({name:plain(a.autor),role:'Autoria / iniciativa'})),
    decisionBody:proceedings.map(a=>plain(a.nomeColegiadoControleAtual)).filter(Boolean).join(' / '),
    textUrl:official(p.documento?.url),history:proceedings.flatMap(a=>asList(a.informesLegislativos).map(h=>({id:'sen-'+h.id,date:h.data?.slice(0,10),timestamp:h.data?.replace(' ','T'),title:'Movimentação registrada',body:plain(h.descricao),actor:plain(h.colegiado?.nome),url:official(h.documentosAssociados?.[0]?.url)}))),
    historyScope:'Movimentações publicadas pela API de processos do Senado.'};
}
function stfData(payload,p) {
  const block=list(payload).find(x=>x.incidentes?.some(i=>String(i.numero)===p.key&&String(i.idInformacaoPautaProcesso)===p.themeId));
  if(!block?.conteudo)throw new Error('Tema do processo não encontrado');
  const incident=block.incidentes.find(i=>String(i.numero)===p.key&&String(i.idInformacaoPautaProcesso)===p.themeId),c=block.conteudo;
  const context=lines(c.tema),question=lines(c.tese).find(t=>/^Saber\b/i.test(t))||'';
  const history=[];
  for(let i=0;i<context.length;i++){
    const match=context[i].match(/\bEm (\d{2}\/\d{2}\/\d{4})\b/i);
    if(match)history.push({id:'stf-context-'+i,date:iso(match[1]),title:'Marco mencionado na pauta oficial',body:context[i].replace(/^\d+\.\s*/,''),detail:/seguinte teor|seguintes termos/i.test(context[i])?context[i+1]:'',url:p.url});
  }
  for(const text of lines(c.informacoes)){
    const match=text.match(/\bem (\d{2}\/\d{2}\/\d{4})\b/i);
    if(match)history.push({id:'stf-info-'+history.length,date:iso(match[1]),title:'Informação da pauta',body:text,url:p.url});
  }
  return {summary:(context[0]||p.summary).replace(/^\d+\.\s*/,''),question,title:plain(incident.subtema),themes:[plain(incident.tema),plain(incident.subtema)].filter(Boolean),
    rapporteur:plain(incident.relator),authors:asList(incident.partes).filter(a=>/^REQTE|RECLTE|IMPTE|RECTE/.test(a.categoria)).map(a=>({name:plain(a.nome),role:'Quem apresentou a ação ou recurso'})),
    officialContext:context,questionContext:lines(c.tese),history,historyScope:'Marcos datados mencionados no resumo da pauta do STF. Não é o andamento processual completo.',
    publishedVotes:lines(c.votos),rapporteurVote:plain(c.votoRelator),status:'Processo incluído em pauta'};
}
export async function hydratePauta(p,get,at) {
  p={...p};
  const old=p.details??{},parts={};
  if(p.provider==='camara'){
    const url=cam+p.key;
    parts.overview=await part(old.parts?.overview,'Texto e situação da proposta',url,at,async()=>{
      const d=(await get(url,true))?.dados;if(String(d?.id)!==p.key)throw new Error('Identidade da proposta divergente');
      const s=d.statusProposicao??{};
      return {summary:plain(d.ementa),kind:d.siglaTipo,typeName:plain(d.descricaoTipo),keywords:plain(d.keywords),status:plain(s.descricaoSituacao),statusAt:s.dataHora?.slice(0,10),consideration:plain(s.apreciacao),stageNote:plain(s.despacho),regime:plain(s.regime),textUrl:official(d.urlInteiroTeor),relatorUri:official(s.uriUltimoRelator),orgUri:official(s.uriOrgao),orgCode:plain(s.siglaOrgao)};
    });
    [parts.history,parts.authors]=await Promise.all([
      part(old.parts?.history,'Tramitação na Câmara',url+'/tramitacoes',at,async()=>(await fullList(url+'/tramitacoes',get)).map(h=>({id:'cam-'+h.sequencia,date:h.dataHora?.slice(0,10),timestamp:h.dataHora,sequence:h.sequencia,title:plain(h.descricaoTramitacao),body:plain(h.despacho),actor:plain(h.siglaOrgao),url:official(h.url)}))),
      part(old.parts?.authors,'Autoria',url+'/autores',at,async()=>(await fullList(url+'/autores',get)).map(a=>({name:plain(a.nome),role:a.proponente===1?'Autoria / proponente':'Coautoria',url:official(a.uri)})))
    ]);
    const overview=parts.overview.data;
    parts.roles=await part(old.parts?.roles,'Local de tramitação e última relatoria',url,at,async()=>{
      if(!parts.overview.ok)throw new Error('Dados da situação indisponíveis');
      const result={};
      for(const [key,uri]of [['rapporteur',overview?.relatorUri],['location',overview?.orgUri]])if(uri){
        if(!/^https:\/\/dadosabertos\.camara\.leg\.br\/api\/v2\/(deputados|orgaos)\/\d+$/.test(uri))continue;
        const d=(await get(uri,true))?.dados;if(!d)throw new Error('Responsável não localizado');
        result[key]=plain(d.ultimoStatus?.nome||d.nomePublicacao||d.nome);
      }
      return result;
    });
  }else if(p.provider==='senado'){
    let processId=p.processId;
    const fallback=sen+'materia/'+p.key;
    parts.overview=await part(old.parts?.overview,'Processo e tramitação no Senado',processId?sen+'processo/'+processId:fallback,at,async()=>{
      if(!processId){const legacy=(await get(fallback,true))?.DetalheMateria?.Materia;processId=legacy?.IdentificacaoMateria?.IdentificacaoProcesso;}
      if(!/^\d+$/.test(String(processId??'')))throw new Error('Identificador de processo ausente');
      const data=await get(sen+'processo/'+processId,true);
      if(String(data?.codigoMateria)!==p.key)throw new Error('Identidade do processo divergente');
      return senData(data);
    });
    if(processId){p.processId=String(processId);parts.overview.url=sen+'processo/'+processId;}
  }else if(p.provider==='stf'){
    const url=stf+new URLSearchParams({id:p.themeId||'',numero:p.key,classe:p.apiClass||p.kind});
    parts.overview=await part(old.parts?.overview,'Tema e informações da pauta do STF',url,at,async()=>{
      if(!p.themeId)throw new Error('Tema ainda não identificado');
      return stfData(await get(url,true),p);
    });
  }
  const failures=Object.values(parts).filter(part=>!part.ok);
  const details={...(parts.overview?.data??{}),...(parts.roles?.data??{}),parts,checkedAt:at,at:parts.overview?.at,inputFingerprint:inputFingerprint(p),
    quality:failures.length?(Object.values(parts).some(part=>part.data)?'partial':'error'):'ready',
    historyScope:p.provider==='camara'?'Tramitações publicadas na Câmara. Acompanhamento em outras casas depende de vínculo oficial.':parts.overview?.data?.historyScope};
  if(parts.history)details.history=parts.history.data??[];
  if(parts.authors)details.authors=parts.authors.data??[];
  details.history=(details.history??[]).filter(h=>/^\d{4}-\d{2}-\d{2}$/.test(h.date)).sort((a,b)=>b.date.localeCompare(a.date)||(b.timestamp||'').localeCompare(a.timestamp||'')||(b.sequence||0)-(a.sequence||0));
  const changes=[...(p.changes??[])];
  for(const [field,key]of [['situação da proposta','status'],['texto de apresentação','summary']]){
    if(parts.overview?.ok&&old[key]&&details[key]&&digest(old[key])!==digest(details[key]))changes.push({at,field,before:old[key],after:details[key],url:parts.overview.url});
  }
  return {...p,details,changes};
}
export async function enrichPautas(pautas,get,at) {
  const out={...pautas},values=Object.values(pautas),cache=new Map();let next=0;
  const cachedGet=(url,json)=>{const key=String(url);if(!cache.has(key))cache.set(key,get(url,json));return cache.get(key);};
  await Promise.all(Array.from({length:4},async()=>{
    for(;;){const index=next++;if(index>=values.length)return;const p=values[index];
      const interval=p.lastSeen===at?30*60*1000:24*60*60*1000;
      if(p.details?.quality==='ready'&&p.details.inputFingerprint===inputFingerprint(p)&&Date.parse(at)-Date.parse(p.details.checkedAt)<interval)continue;
      out[p.id]=await hydratePauta(p,cachedGet,at);
    }
  }));
  return out;
}
const inputFingerprint=p=>digest([p.provider,p.key,p.processId||'',p.themeId||'',p.apiClass||'']);
